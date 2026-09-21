import { roles, validateApplication, validateResume } from './roles.js';
import { configured, connect, login, logout, friendlyError } from './firebase.js';
import { $, el, button, message, date, busy } from './ui.js';
let openings = {}, category = 'All', selected, user, sdk, stopApplications, submitting = false;
const dialog = $('#application-dialog'), form = $('#application-form');
const categories = ['All', 'Development', 'Creative', 'Community', 'Business'];
for (const name of categories) {
  $('#role-filters').append(button(name, () => {
    category = name;
    $('#role-filters').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === name)));
    renderRoles();
  }, 'filter'));
}
$('#role-filters button').setAttribute('aria-pressed', 'true');
$('#role-filters').querySelectorAll('button:not(:first-child)').forEach(b => b.setAttribute('aria-pressed', 'false'));
function renderRoles() {
  const visible = roles.filter(r => category === 'All' || r.category === category);
  $('#roles').replaceChildren(...visible.map(role => {
    const listing = openings[role.id], open = configured && listing?.open;
    const apply = button(open ? 'Apply ↗' : 'View role ↗', () => showApplication(role));
    return el('article', { className: 'role-row' }, el('span', { className: 'role-number' }, String(roles.indexOf(role) + 1).padStart(2,'0')), el('div', {}, el('h3', {}, role.title), el('p', {}, role.description)), el('div', {}, el('span', { className: `tag ${open ? 'open' : ''}` }, open ? listing.compensation : 'Not open yet'), el('p', {}, role.category)), apply);
  }));
  $('#role-count').textContent = `${visible.length} disciplines / ${roles.filter(r => openings[r.id]?.open).length} accepting applications`;
}
function showApplication(role) {
  selected = role;
  form.reset();
  $('#application-title').textContent = role.title;
  $('#question-1').textContent = `${role.questions[0]} *`;
  $('#question-2').textContent = `${role.questions[1]} *`;
  const listing = openings[role.id];
  $('#role-terms').textContent = listing?.open ? `${listing.compensation} · ${listing.commitment} · ${listing.details}` : `${role.description} Applications for this role are not open yet.`;
  message($('#application-message'), listing?.open ? '' : 'Check back for this opening. You can explore other disciplines on the careers page.');
  updateFormAccess();
  dialog.showModal();
}
function updateFormAccess() {
  const open = configured && openings[selected?.id]?.open;
  form.hidden = !open || !user;
  $('#application-auth').hidden = !open || Boolean(user);
  if (user) { form.elements.email.value = user.email || ''; form.elements.name.value ||= user.displayName || ''; }
}
$('#close-application').onclick = () => { if (!submitting) dialog.close(); };
dialog.addEventListener('cancel', event => { if (submitting) event.preventDefault(); });
$('#applicant-login').onclick = event => busy(event.currentTarget, login, e => message($('#application-message'), friendlyError(e), true));
$('#sign-out').onclick = () => logout().catch(e => message($('#page-message'), friendlyError(e), true));
form.onsubmit = async event => {
  event.preventDefault();
  submitting = true;
  await busy($('#submit-application'), async () => {
    if (!user || !selected || !form.reportValidity()) return;
    const role = selected, applicant = user;
    const fields = Object.fromEntries(new FormData(form));
    const file = form.elements.resume.files[0];
    delete fields.resume;
    fields.consent = form.elements.consent.checked;
    fields.roleId = role.id;
    validateApplication(fields); validateResume(file);
    const { d, db, s, storage } = sdk;
    const listing = openings[role.id];
    if (!listing?.open) throw new Error('This role is no longer accepting applications.');
    const terms = { compensation:listing.compensation, commitment:listing.commitment, details:listing.details };
    const id = `${applicant.uid}_${role.id}`, target = d.doc(db, 'applications', id);
    if ((await d.getDoc(target)).exists()) throw new Error('You have already applied for this role. Check Your applications below.');
    message($('#application-message'), file ? 'Uploading resume…' : 'Sending application…');
    const resumePath = file ? `resumes/${applicant.uid}/${role.id}.pdf` : '';
    if (file) await s.uploadBytes(s.ref(storage, resumePath), file, { contentType: 'application/pdf' });
    // A deterministic ID prevents double submissions, including a retry after a lost response.
    await d.setDoc(target, { ...fields, terms, uid: applicant.uid, email: applicant.email, resumePath, status: 'Submitted', createdAt: d.serverTimestamp(), updatedAt: d.serverTimestamp(), privacyVersion: '2026-09-21' });
    form.hidden = true;
    message($('#application-message'), 'Application received. Thank you for sharing your work with ANTVX. Track its status under Your applications.');
    form.reset();
  }, e => message($('#application-message'), friendlyError(e), true));
  submitting = false;
};
function watchApplications() {
  stopApplications?.();
  $('#my-list').replaceChildren();
  $('#my-applications').hidden = !user;
  if (!user) return;
  const { d, db } = sdk;
  stopApplications = d.onSnapshot(d.query(d.collection(db, 'applications'), d.where('uid', '==', user.uid)), snapshot => {
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    $('#my-list').replaceChildren(...records.map(record => {
      const card = el('article', { className: 'data-card' }, el('h3', {}, roles.find(r => r.id === record.roleId)?.title || record.roleId), el('div', { className: 'card-meta' }, el('span', { className: 'tag' }, record.status), el('span', { className: 'hint' }, `Applied ${date(record.createdAt)}`)));
      if (!['Withdrawn', 'Declined', 'Accepted'].includes(record.status)) card.append(button('Withdraw application', event => {
        if (!confirm('Withdraw this application? Contact the studio if you later want it reconsidered.')) return;
        busy(event.currentTarget, () => d.updateDoc(d.doc(db,'applications',record.id), { status:'Withdrawn', updatedAt:d.serverTimestamp() }), e => message($('#page-message'),friendlyError(e),true));
      }));
      return card;
    }));
    if (!records.length) $('#my-list').append(el('p', { className: 'empty' }, 'No applications yet. Find your place above.'));
  }, e => message($('#page-message'), friendlyError(e), true));
}
renderRoles();
if (!configured) message($('#availability-notice'), 'We’re preparing our next openings. Explore the 12 disciplines below; applications will open once role details are ready.');
else {
  try {
    sdk = await connect();
    sdk.d.onSnapshot(sdk.d.collection(sdk.db,'openings'), snapshot => {
      openings = Object.fromEntries(snapshot.docs.map(doc => [doc.id, doc.data()]));
      renderRoles();
      message($('#availability-notice'), roles.some(r => openings[r.id]?.open) ? 'Find an open role below. Each application includes a few shared questions and two questions specific to your discipline.' : 'No roles are accepting applications right now. Explore our disciplines and check back soon.');
      if (dialog.open) updateFormAccess();
    }, e => { openings = {}; renderRoles(); updateFormAccess(); message($('#availability-notice'), friendlyError(e), true); });
    sdk.a.onAuthStateChanged(sdk.auth, value => { if (!value || user?.uid !== value.uid) form.reset(); user = value; updateFormAccess(); watchApplications(); });
  } catch (e) { message($('#availability-notice'), friendlyError(e), true); }
}
