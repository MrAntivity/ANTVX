import { readFileSync } from 'node:fs';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, getDocs, collection, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
let env;
const role='game-development';
const context=(uid,email=`${uid}@example.com`,verified=true)=>env.authenticatedContext(uid,{email,email_verified:verified});
const application=(uid)=>({terms:{compensation:'Paid',commitment:'10 hours',details:'Test role'},uid,roleId:role,name:'Applicant',email:`${uid}@example.com`,discord:'',roblox:'',timezone:'UTC',availability:'10 hours',portfolio:'',motivation:'Build worlds',experience:'Personal work',answer1:'First answer',answer2:'Second answer',consent:true,resumePath:'',status:'Submitted',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),privacyVersion:'2026-09-21'});
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-antvx',firestore:{rules:readFileSync('firestore.rules','utf8')},storage:{rules:readFileSync('storage.rules','utf8')}});
 await env.withSecurityRulesDisabled(async c=>{
   const db=c.firestore();
   for(const [email,role] of [['owner@example.com','owner'],['admin@example.com','admin'],['reviewer@example.com','reviewer']]) await setDoc(doc(db,'members',email),{role,name:role,updatedAt:serverTimestamp()});
   await setDoc(doc(db,'openings',role),{open:true,compensation:'Paid',commitment:'10 hours',details:'Test role',updatedAt:serverTimestamp()});
 });
});
after(async()=>{await env?.cleanup();});
test('public role browsing works; private collections reject anonymous access',async()=>{
 const db=env.unauthenticatedContext().firestore();
 await assertSucceeds(getDocs(collection(db,'openings')));
 for(const name of ['applications','members','tasks','announcements']) await assertFails(getDocs(collection(db,name)));
});
test('only owners manage membership; self-escalation and owner replacement fail',async()=>{
 await assertFails(setDoc(doc(context('stranger').firestore(),'members','stranger@example.com'),{role:'owner',name:'Stranger',updatedAt:serverTimestamp()}));
 await assertFails(setDoc(doc(context('admin').firestore(),'members','other@example.com'),{role:'reviewer',name:'Other',updatedAt:serverTimestamp()}));
 const db=context('owner').firestore();
 await assertSucceeds(setDoc(doc(db,'members','invite@example.com'),{role:'reviewer',name:'Invited',updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(doc(db,'members','invite@example.com'),{role:'owner',updatedAt:serverTimestamp()}));
 await assertFails(deleteDoc(doc(db,'members','owner@example.com')));
 await assertSucceeds(deleteDoc(doc(db,'members','invite@example.com')));
});
test('applications are private, validated, immutable, and cannot impersonate another applicant',async()=>{
 const db=context('applicant').firestore(), target=doc(db,'applications',`applicant_${role}`);
 await assertFails(setDoc(doc(context('unverified','unverified@example.com',false).firestore(),'applications',`unverified_${role}`),application('unverified')));
 await assertSucceeds(getDoc(target));
 await assertFails(setDoc(target,{...application('applicant'),email:'other@example.com'}));
 await assertFails(setDoc(target,{...application('applicant'),status:'Accepted'}));
 await assertFails(setDoc(target,{...application('applicant'),answer1:'x'.repeat(4001)}));
 await assertFails(setDoc(target,{...application('applicant'),unexpected:'injected'}));
 await assertSucceeds(setDoc(target,application('applicant')));
 await assertSucceeds(getDocs(query(collection(db,'applications'),where('uid','==','applicant'))));
 await assertFails(getDocs(collection(db,'applications')));
 await assertFails(getDoc(doc(context('other').firestore(),'applications',`applicant_${role}`)));
 await assertFails(updateDoc(target,{status:'Accepted',updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(target,{name:'Changed',updatedAt:serverTimestamp()}));
 await assertSucceeds(getDoc(doc(context('reviewer').firestore(),'applications',`applicant_${role}`)));
 await assertSucceeds(updateDoc(doc(context('reviewer').firestore(),'applications',`applicant_${role}`),{status:'In review',updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(target,{status:'Withdrawn',updatedAt:serverTimestamp()}));
});
test('reviewer notes are never visible to applicants',async()=>{
 const path=['applications',`applicant_${role}`,'notes','note'];
 await assertSucceeds(setDoc(doc(context('reviewer').firestore(),...path),{body:'Private assessment',author:'reviewer@example.com',createdAt:serverTimestamp()}));
 await assertFails(getDoc(doc(context('applicant').firestore(),...path)));
 await assertSucceeds(getDoc(doc(context('admin').firestore(),...path)));
});
test('reviewers cannot publish roles or announcements; admins can',async()=>{
 const opening={open:true,compensation:'Volunteer',commitment:'Flexible',details:'Unpaid',updatedAt:serverTimestamp()};
 await assertFails(setDoc(doc(context('reviewer').firestore(),'openings','events'),opening));
 await assertSucceeds(setDoc(doc(context('admin').firestore(),'openings','events'),opening));
 await assertFails(setDoc(doc(context('admin').firestore(),'openings','events'),{...opening,compensation:'Undisclosed'}));
 const news={title:'Update',body:'Playtest',author:'admin@example.com',createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(context('admin').firestore(),'announcements','test'),news));
 await assertFails(setDoc(doc(context('reviewer').firestore(),'announcements','test2'),{...news,author:'reviewer@example.com'}));
});
test('resume files are private, bounded PDFs and lock after submission',async()=>{
 const upload=context('upload'), path=`resumes/upload/${role}.pdf`, data=new Uint8Array([37,80,68,70]);
 await assertFails(uploadBytes(ref(upload.storage(),path),data,{contentType:'text/html'}));
 await assertSucceeds(uploadBytes(ref(upload.storage(),path),data,{contentType:'application/pdf'}));
 await assertFails(getBytes(ref(context('other').storage(),path)));
 await assertSucceeds(getBytes(ref(context('reviewer').storage(),path)));
 await assertSucceeds(setDoc(doc(upload.firestore(),'applications',`upload_${role}`),{...application('upload'),resumePath:path}));
 await assertFails(uploadBytes(ref(upload.storage(),path),data,{contentType:'application/pdf'}));
});
test('revoked teammates immediately lose data access',async()=>{
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'members','revoked@example.com'),{role:'reviewer',name:'Revoked',updatedAt:serverTimestamp()}));
 const db=context('revoked').firestore();await assertSucceeds(getDocs(collection(db,'applications')));
 await assertSucceeds(deleteDoc(doc(context('owner').firestore(),'members','revoked@example.com')));
 await assertFails(getDocs(collection(db,'applications')));
});
