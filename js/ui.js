export const $ = selector => document.querySelector(selector);
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : String(value));
  }
  node.append(...children.filter(c => c != null));
  return node;
}
export const option = (value, label = value) => el('option', { value }, label);
export const button = (label, handler, className = 'ghost') => el('button', { type: 'button', className, onclick: handler }, label);
export function field(label, input) { return el('label', { className: 'field' }, el('span', {}, label), input); }
export function message(target, text, error = false) { target.textContent = text; target.classList.toggle('error', error); }
export function date(value) { return value?.toDate ? value.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Just now'; }
export async function busy(button, work, report) {
  button.disabled = true;
  try { await work(); } catch (e) { report(e); } finally { button.disabled = false; }
}
