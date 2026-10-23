/* Muna prototype · shared helpers (DOM, formatting, dialogs, toasts, actions). */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape any value before putting it into HTML. Every user-provided string goes through this. */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const words = s => (String(s || '').trim().match(/\S+/g) || []).length;
const uid = (prefix = '') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const snip = (s, n = 14) => { const w = String(s || '').trim().split(/\s+/); return w.slice(0, n).join(' ') + (w.length > n ? '…' : ''); };
const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

function fmtDur(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}
const fmtClock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtWhen = ts => ts ? new Date(ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
const fmtDue = iso => iso ? new Date(iso + 'T23:59').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'No due date';
const isPastDue = iso => iso && Date.now() > new Date(iso + 'T23:59:59').getTime();
const todayISO = (plusDays = 0) => { const d = new Date(Date.now() + plusDays * 864e5); return d.toISOString().slice(0, 10); };

function debounce(fn, ms) { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); fn(...a); }; return d; }

function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

const muni = (msg, img = 'assets/muni.svg') => `<div class="muni"><img src="${img}" alt=""><div class="bubble">${msg}</div></div>`;

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, ms = 2600) {
  const el = $('#toast');
  clearTimeout(toastTimer);
  el.innerHTML = msg ? `<div>${esc(msg)}</div>` : '';
  if (msg) toastTimer = setTimeout(() => { el.innerHTML = ''; }, ms);
}

/* ---------- dialog ---------- */
let dlgReturnFocus = null;
function openDialog(html, { wide = false } = {}) {
  const dlg = $('#dlg');
  dlgReturnFocus = document.activeElement;
  dlg.classList.toggle('wide', wide);
  $('#dlgBody').innerHTML = html;
  if (!dlg.open) dlg.showModal();
  const h = dlg.querySelector('h2');
  if (h) { h.tabIndex = -1; h.focus(); }
}
function closeDialog() {
  const dlg = $('#dlg');
  if (dlg.open) dlg.close();
}
function confirmDialog(title, body, okLabel = 'Yes', danger = false) {
  return new Promise(resolve => {
    openDialog(`<h2>${esc(title)}</h2><p class="small">${esc(body)}</p>
      <div class="btnrow"><button class="btn ghost" data-dlg="no">Cancel</button><button class="btn ${danger ? 'danger' : ''}" data-dlg="yes">${esc(okLabel)}</button></div>`);
    const dlg = $('#dlg');
    const done = v => { dlg.removeEventListener('click', onClick); dlg.removeEventListener('close', onClose); closeDialog(); resolve(v); };
    const onClick = e => { const b = e.target.closest('[data-dlg]'); if (b) done(b.dataset.dlg === 'yes'); };
    const onClose = () => done(false);
    dlg.addEventListener('click', onClick);
    dlg.addEventListener('close', onClose);
  });
}

/* ---------- action + form registries (event delegation) ----------
   Buttons:  <button data-act="name" data-v="value">   -> ACT.name(value, el, event)
   Forms:    <form data-form="name">                   -> FORM.name(formData, formEl, event)  */
const ACT = {};
const FORM = {};

/* Route registry (the router itself lives in app.js, which loads last). */
const ROUTES = [];
function addRoute(path, def) { ROUTES.push({ path, parts: path ? path.split('/') : [], ...def }); }
