import { roles, statuses } from './roles.js';
import { configured, connect, login, logout, friendlyError } from './firebase.js';
import { $, el, button, option, field, message, date, busy } from './ui.js';
let sdk, user, member, activeTab = 'Applications', subscriptions = [], memberSubscription, reviewSubscription;
let applications = [], openings = {}, tasks = [], announcements = [], members = [];
$('#workspace').addEventListener('input', event => { if (event.target.closest('form')) $('#workspace').dataset.dirty = 'true'; });
const filters = { search: '', role: '', status: '' };
const manager = () => ['owner','admin'].includes(member?.role);
const owner = () => member?.role === 'owner';
const report = e => message($('#portal-message'), friendlyError(e), true);
const reviewReport = e => message($('#review-message'), friendlyError(e), true);
const run = (event, action) => busy(event.currentTarget, action, report);
function clearSubscriptions() { subscriptions.forEach(stop => stop()); subscriptions = []; reviewSubscription?.(); reviewSubscription = null; }
function clearWorkspace() {
  clearSubscriptions();
  applications = []; openings = {}; tasks = []; announcements = []; members = [];
  delete $('#workspace').dataset.dirty; delete $('#workspace').dataset.tab;
  $('#workspace').replaceChildren(); $('#review-content').replaceChildren(); $('#review-dialog').close();
  $('#portal').hidden = true;
}
$('#team-login').onclick = event => run(event, login);
$('#team-logout').onclick = event => run(event, logout);
$('#close-review').onclick = () => $('#review-dialog').close();
$('#review-dialog').addEventListener('close', () => { reviewSubscription?.(); reviewSubscription = null; render(); $('#workspace input[type=search]')?.focus({preventScroll:true}); });
function watch(collection, callback) {
  const { d, db } = sdk;
  subscriptions.push(d.onSnapshot(d.collection(db, collection), snapshot => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const section = { applications:'Applications', tasks:'Studio board', announcements:'Announcements', openings:'Open roles', members:'Team access' }[collection];
    if (activeTab === section) render();
  }, e => { clearWorkspace(); report(e); }));
}
function startWorkspace() {
  clearWorkspace();
  $('#portal').hidden = false; $('#portal-login').hidden = true;
  message($('#portal-message'), '');
  const names = ['Applications','Studio board','Announcements', ...(manager() ? ['Open roles'] : []), ...(owner() ? ['Team access'] : [])];
  if (!names.includes(activeTab)) activeTab = names[0];
  $('#portal-tabs').replaceChildren(...names.map(name => {
    const b = button(name, () => { if ($('#workspace').dataset.dirty === 'true' && !confirm('Discard your unsaved changes and switch sections?')) return;
      delete $('#workspace').dataset.dirty; activeTab = name; render(); });
    return b;
  }));
  watch('applications', value => applications = value.sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0)));
  watch('tasks', value => tasks = value.sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0)));
  watch('announcements', value => announcements = value.sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0)));
  if (manager()) watch('openings', value => openings = Object.fromEntries(value.map(v => [v.id,v])));
  if (owner()) watch('members', value => members = value);
  render();
}
function render() {
  if (!member || $('#portal').hidden || $('#review-dialog').open) return;
  $('#portal-tabs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === activeTab)));
  // Preserve unsaved editor inputs when a background snapshot arrives.
  if ($('#workspace').dataset.tab === activeTab && $('#workspace').dataset.dirty === 'true') return;
  if ($('#workspace').dataset.tab === activeTab && $('#workspace').contains(document.activeElement) && document.activeElement.matches('input,textarea,select')) return;
  $('#workspace').dataset.tab = activeTab;
  $('#workspace').replaceChildren();
  if (activeTab === 'Applications') renderApplications();
  if (activeTab === 'Studio board') renderBoard();
  if (activeTab === 'Announcements') renderAnnouncements();
  if (activeTab === 'Open roles') renderOpenings();
  if (activeTab === 'Team access') renderMembers();
}
function empty(text) { return el('p', { className: 'empty' }, text); }
function renderApplications() {
  const metrics = el('div', { className: 'metrics' });
  for (const [label, count] of [['All applications',applications.length],['Awaiting review',applications.filter(a => a.status === 'Submitted').length],['In conversation',applications.filter(a => ['In review','Interview','Offer'].includes(a.status)).length],['Accepted',applications.filter(a => a.status === 'Accepted').length]]) metrics.append(el('div', { className: 'metric' }, el('strong', {}, String(count)), el('span', {}, label)));
  const search = el('input', { type: 'search', placeholder: 'Name or email', value: filters.search });
  const role = el('select', {}, option('','All disciplines'), ...roles.map(r => option(r.id,r.title))); role.value = filters.role;
  const status = el('select', {}, option('','All statuses'), ...statuses.map(s => option(s))); status.value = filters.status;
  const list = el('div', { className: 'data-list' });
  function updateList() {
    filters.search = search.value; filters.role = role.value; filters.status = status.value;
    const visible = applications.filter(a => (!filters.role || a.roleId === filters.role) && (!filters.status || a.status === filters.status) && `${a.name} ${a.email}`.toLowerCase().includes(filters.search.toLowerCase()));
    list.replaceChildren(...visible.map(a => el('article', { className: 'data-card' },
      el('div', { className: 'card-meta' }, el('span', { className: 'tag' }, a.status), el('span', { className: 'hint' }, `${roles.find(r => r.id === a.roleId)?.title} · ${date(a.createdAt)}`)),
      el('h3', {}, a.name), el('p', {}, a.email), el('div', { className: 'row-actions' }, button('Review application ↗', () => openReview(a.id))))));
    if (!visible.length) list.append(empty(applications.length ? 'No applications match these filters.' : 'Your next teammate starts here. Applications will appear when people apply.'));
  }
  search.oninput = updateList; role.onchange = updateList; status.onchange = updateList;
  $('#workspace').append(metrics, el('div', { className: 'portal-filters' }, field('Search applications',search), field('Discipline',role), field('Status',status)), list);
  updateList();
}
function openReview(id) {
  const record = applications.find(a => a.id === id);
  if (!record) return;
  const { d, db, s, storage } = sdk;
  reviewSubscription?.();
  $('#review-title').textContent = record.name;
  message($('#review-message'), '');
  const content = $('#review-content'); content.replaceChildren();
  content.append(el('p', { className: 'hint' }, `${roles.find(r => r.id === record.roleId)?.title} · Applied ${date(record.createdAt)}`));
  const status = el('select', {}, ...statuses.map(value => option(value))); status.value = record.status;
  content.append(el('div', { className: 'form-actions' }, field('Application status', status), button('Save status', event => busy(event.currentTarget, async () => {
    await d.updateDoc(d.doc(db,'applications',id), { status: status.value, updatedAt:d.serverTimestamp() });
    message($('#review-message'), 'Status saved. The applicant can see this status.');
  }, reviewReport), 'primary')));
  if (record.terms) content.append(el('div',{className:'answer'},el('h3',{},'Role terms at application'),el('p',{},`${record.terms.compensation} · ${record.terms.commitment}\n${record.terms.details}`)));
  const questions = roles.find(r => r.id === record.roleId)?.questions || ['Role question 1','Role question 2'];
  for (const [label,value] of [['Email',record.email],['Discord',record.discord],['Roblox',record.roblox],['Time zone',record.timezone],['Availability',record.availability],['Why ANTVX?',record.motivation],['Relevant experience',record.experience],[questions[0],record.answer1],[questions[1],record.answer2]]) if (value) content.append(el('div', { className: 'answer' }, el('h3', {}, label),el('p', {}, value)));
  if (/^https:\/\//i.test(record.portfolio)) content.append(el('a', { className:'record-link', href:record.portfolio, target:'_blank', rel:'noopener noreferrer' }, 'Open portfolio ↗'));
  if (record.resumePath) content.append(el('div', { className: 'row-actions' }, button('Download resume (PDF)', event => busy(event.currentTarget, async () => {
    // Authenticated download: never persist a public bearer-token download URL.
    const blob = await s.getBlob(s.ref(storage, record.resumePath), 5 * 1024 * 1024);
    const url = URL.createObjectURL(blob), link = el('a', { href:url, download:`ANTVX-${record.roleId}-resume.pdf` });
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  },reviewReport))));
  const note = el('textarea', { required:true, maxlength:4000, placeholder:'Add context for the review team…' });
  const submit = el('button', { type:'submit', className:'primary' }, 'Add private note');
  const noteForm = el('form', { className:'stack' }, field('Private reviewer note',note),submit);
  noteForm.onsubmit = event => { event.preventDefault(); busy(submit, async () => {
    if (!note.value.trim()) return;
    await d.addDoc(d.collection(db,'applications',id,'notes'), { body:note.value.trim(),author:user.email,createdAt:d.serverTimestamp() });
    note.value = ''; message($('#review-message'),'Private note saved.');
  },reviewReport); };
  const notes = el('div', { className:'data-list' });
  content.append(el('div', { className:'answer' }, el('h3',{},'Reviewer notes'), el('p',{},'Visible only to authorized team members.')),noteForm,notes);
  reviewSubscription = d.onSnapshot(d.collection(db,'applications',id,'notes'), snapshot => {
    notes.replaceChildren(...snapshot.docs.map(doc => doc.data()).sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0)).map(n => el('div',{className:'answer'},el('p',{},n.body),el('small',{className:'hint'},`${n.author} · ${date(n.createdAt)}`))));
  },reviewReport);
  $('#review-dialog').showModal();
}
function renderBoard() {
  const { d, db } = sdk;
  const list = el('div', { className:'data-list' });
  for (const task of tasks) {
    const status = el('select', {}, ...['To do','In progress','Done'].map(s => option(s))); status.value = task.status;
    const save = button('Update status', event => run(event, () => d.updateDoc(d.doc(db,'tasks',task.id), { status:status.value,updatedAt:d.serverTimestamp() })));
    list.append(el('article',{className:'data-card'},el('h3',{},task.title),el('div',{className:'card-meta'},el('span',{className:'tag'},task.status),el('span',{className:'hint'},`${task.assignee || 'Unassigned'}${task.due ? ` · Due ${task.due}` : ''}`)),el('p',{},task.body),field('Task status',status),el('div',{className:'row-actions'},save,manager() ? button('Delete task', event => { if (confirm('Delete this studio task?')) run(event, () => d.deleteDoc(d.doc(db,'tasks',task.id))); }) : null)));
  }
  if (!tasks.length) list.append(empty('A little structure for big ideas. Add your first studio task.'));
  $('#workspace').append(el('h2',{className:'subheading'},'Keep the next world moving.'));
  if (manager()) {
    const form = el('form',{className:'data-card stack'});
    const title = el('input',{required:true,maxlength:200}), body = el('textarea',{maxlength:4000}), assignee = el('input',{type:'email',maxlength:200,placeholder:'Teammate email (optional)'}), due = el('input',{type:'date'});
    const submit = el('button',{type:'submit',className:'primary'},'Create task ↗');
    form.append(el('h3',{},'New studio task'),field('Task title *',title),field('Details',body),field('Assignee email',assignee),field('Due date',due),submit);
    form.onsubmit = event => { event.preventDefault(); busy(submit, async () => {
      await d.addDoc(d.collection(db,'tasks'),{title:title.value.trim(),body:body.value.trim(),assignee:assignee.value.trim(),due:due.value,status:'To do',author:user.email,createdAt:d.serverTimestamp(),updatedAt:d.serverTimestamp()});form.reset(); delete $('#workspace').dataset.dirty; render();
    },report); };
    $('#workspace').append(el('div',{className:'split-panel'},list,form));
  } else $('#workspace').append(list);
}
function renderAnnouncements() {
  const { d, db } = sdk;
  const list = el('div',{className:'data-list'});
  for (const item of announcements) list.append(el('article',{className:'data-card'},el('p',{className:'hint'},`${date(item.createdAt)} · ${item.author}`),el('h3',{},item.title),el('p',{},item.body), manager() ? el('div',{className:'row-actions'},button('Remove announcement',event => { if (confirm('Remove this announcement?')) run(event,()=>d.deleteDoc(d.doc(db,'announcements',item.id))); })) : null));
  if (!announcements.length) list.append(empty('The studio’s latest news will live here.'));
  $('#workspace').append(el('h2',{className:'subheading'},'Everyone on the same page.'));
  if (manager()) {
    const title = el('input',{required:true,maxlength:200}),body = el('textarea',{required:true,maxlength:4000}),submit = el('button',{type:'submit',className:'primary'},'Post announcement ↗');
    const form = el('form',{className:'data-card stack'},el('h3',{},'Studio update'),field('Title *',title),field('Message *',body),submit);
    form.onsubmit = event => { event.preventDefault(); busy(submit,async()=> { await d.addDoc(d.collection(db,'announcements'),{title:title.value.trim(),body:body.value.trim(),author:user.email,createdAt:d.serverTimestamp()});form.reset(); delete $('#workspace').dataset.dirty; render(); },report); };
    $('#workspace').append(el('div',{className:'split-panel'},list,form));
  } else $('#workspace').append(list);
}
function renderOpenings() {
  const { d, db } = sdk;
  $('#workspace').append(el('h2',{className:'subheading'},'Set the right expectations.'),el('p',{className:'notice'},'Set compensation, commitment, and details before opening a role. Paid roles should state a rate or range; volunteer roles should clearly describe the unpaid arrangement.'));
  const grid = el('div',{className:'split-panel'});
  for (const role of roles) {
    const current = openings[role.id] || {};
    const compensation = el('select',{required:true},option('','Choose arrangement'),option('Paid'),option('Volunteer'));compensation.value = current.compensation || '';
    const commitment = el('input',{required:true,maxlength:200,value:current.commitment || '',placeholder:'e.g. 5–10 hours / week · Remote'});
    const details = el('textarea',{required:true,maxlength:1000,placeholder:'Compensation / unpaid arrangement, expectations, and requirements'},current.details || '');
    const open = el('input',{type:'checkbox',checked:current.open || false});
    const submit = el('button',{type:'submit',className:'primary'},'Save role');
    const form = el('form',{className:'data-card stack'},el('h3',{},role.title),field('Arrangement *',compensation),field('Commitment / location *',commitment),field('Role details *',details),el('label',{className:'checkbox'},open,el('span',{},'Accepting applications')),submit);
    form.onsubmit = event => { event.preventDefault(); busy(submit,async()=>{
      await d.setDoc(d.doc(db,'openings',role.id),{open:open.checked,compensation:compensation.value,commitment:commitment.value.trim(),details:details.value.trim(),updatedAt:d.serverTimestamp()});
      delete $('#workspace').dataset.dirty; message($('#portal-message'),`${role.title} updated.`);
    },report); };
    grid.append(form);
  }
  $('#workspace').append(grid);
}
function renderMembers() {
  const { d, db } = sdk;
  $('#workspace').append(el('h2',{className:'subheading'},'The right people. The right access.'),el('p',{className:'notice'},'Adding an email grants access when that person signs in with Google. No invitation email is sent. Reviewers handle applications and task statuses. Admins also manage openings, tasks, and announcements. Only owners manage access.'));
  const email = el('input',{required:true,type:'email',maxlength:200}),name = el('input',{required:true,maxlength:200}),role = el('select',{},option('reviewer','Reviewer'),option('admin','Admin')),submit = el('button',{type:'submit',className:'primary'},'Grant access');
  const form = el('form',{className:'data-card stack'},el('h3',{},'Invite a teammate'),field('Google account email *',email),field('Name *',name),field('Access level',role),submit);
  form.onsubmit = event => { event.preventDefault(); busy(submit,async()=>{
    const address = email.value.trim().toLowerCase();
    if (members.some(m => m.id.toLowerCase() === address)) throw new Error('This teammate already has access. Use their access selector below to change it.');
    await d.setDoc(d.doc(db,'members',address),{name:name.value.trim(),role:role.value,updatedAt:d.serverTimestamp()});form.reset(); delete $('#workspace').dataset.dirty; render();message($('#portal-message'),'Access granted. Ask your teammate to sign in at antvx.xyz/team.');
  },report); };
  const list = el('div',{className:'data-list'});
  for (const item of members) {
    const card = el('article',{className:'data-card'},el('h3',{},item.name),el('p',{},item.id),el('span',{className:'tag'},item.role));
    if (item.role !== 'owner') {
      const access = el('select',{},option('reviewer','Reviewer'),option('admin','Admin'));access.value=item.role;
      card.append(field('Access level',access),el('div',{className:'row-actions'},button('Save access',event => run(event,()=>d.updateDoc(d.doc(db,'members',item.id),{role:access.value,updatedAt:d.serverTimestamp()}))),button('Revoke access',event => { if(confirm(`Revoke portal access for ${item.id}?`)) run(event,()=>d.deleteDoc(d.doc(db,'members',item.id))); })));
    }
    list.append(card);
  }
  $('#workspace').append(el('div',{className:'split-panel'},list,form));
}
if (!configured) { $('#team-login').disabled = true; $('#setup-notice').hidden = false; }
else {
  try {
    sdk = await connect();
    sdk.a.onAuthStateChanged(sdk.auth, value => {
      memberSubscription?.(); clearWorkspace(); member = null; user = value;
      $('#portal-login').hidden = false; $('#team-logout').hidden = !user;
      $('#identity').textContent = user ? `Signed in as ${user.email}` : '';
      if (!user) { message($('#portal-message'),''); return; }
      memberSubscription = sdk.d.onSnapshot(sdk.d.doc(sdk.db,'members',user.email), snapshot => {
        member = snapshot.exists() ? snapshot.data() : null;
        if (!['owner','admin','reviewer'].includes(member?.role)) { clearWorkspace(); $('#portal-login').hidden = false; message($('#portal-message'),'This account has not been invited. Ask the studio owner to grant access to this Google email.',true); return; }
        $('#identity').textContent = `${user.email} / ${member.role}`;
        startWorkspace();
      }, e => { member = null; clearWorkspace(); $('#portal-login').hidden = false; report(e); });
    });
  } catch(e) { report(e); }
}
