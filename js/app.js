/* Muna prototype · router, layout, landing, settings, and boot. Loaded last. */
'use strict';

/* ---------------------------------------------------------------- router
   Routes are registered by teacher.js, student.js, and game.js with addRoute().
   path:   'teacher/class/:id/:tab?'  (':' = param, '?' = optional)
   role:   'teacher' | 'student' | null
   render(params) -> HTML string · mount(params) after insert · leave(params, nextPath) before leaving */
const currentPath = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));
const go = path => { if (currentPath() === path) render(); else location.hash = '#/' + path; };

function matchRoute(path) {
  const segs = path ? path.split('/') : [];
  for (const r of ROUTES) {
    const params = {}; let ok = true;
    const req = r.parts.filter(p => !p.endsWith('?')).length;
    if (segs.length < req || segs.length > r.parts.length) continue;
    for (let i = 0; i < r.parts.length; i++) {
      const p = r.parts[i], s = segs[i];
      if (p.startsWith(':')) { if (s !== undefined) params[p.replace(/[:?]/g, '')] = s; else if (!p.endsWith('?')) { ok = false; break; } }
      else if (p !== s) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

let ACTIVE = null; // { route, params, path }
function render(keep = false) {
  const path = currentPath();
  if (ACTIVE && ACTIVE.route.leave) ACTIVE.route.leave(ACTIVE.params, path);
  let m = matchRoute(path);
  if (!m) m = matchRoute('');
  const { route, params } = m;
  if (route.role === 'teacher' && (DB.session.role !== 'teacher' || !DB.teacher)) {
    ACTIVE = null;
    return go(DB.teacher ? 'start' : 'teacher/setup');
  }
  // New teachers see the short introduction before the empty dashboard. A teacher
  // can exit it and resume from the dashboard, so this only redirects untouched
  // first-run accounts with no classes yet.
  if (route.role === 'teacher' && route.path === 'teacher' && DB.teacher && !DB.teacher.onboardingCompleted && !DB.teacher.onboardingDismissed && !DB.classes.length) {
    ACTIVE = null;
    return go('teacher/onboarding');
  }
  if (route.role === 'student' && (DB.session.role !== 'student' || !currentStudent())) { ACTIVE = null; return go('student/login'); }
  ACTIVE = { route, params, path };
  const main = $('#main');
  let html;
  try { html = route.render(params); }
  catch (e) { console.error(e); html = `<div class="empty"><p><b>Something went wrong on this screen.</b></p><p class="small">${esc(e.message)}</p><a class="btn" href="#/">Go home</a></div>`; }
  if (html == null) return; // route redirected
  main.className = route.site ? 'site' : route.lesson ? 'lesson' : route.wide ? 'wide' : '';
  document.body.className = route.site ? 'site' : [DB.session.role ? 'app' : '', route.lesson ? 'lesson' : '', route.walkthrough ? 'walkthrough-page' : ''].join(' ').trim();
  const crumbs = route.crumbs ? route.crumbs(params) : '';
  main.innerHTML = (crumbs ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>` : '') + html;
  renderTopbar(route, params);
  $('.topbar').hidden = !!route.walkthrough;
  $('#tabbar').hidden = !!route.walkthrough;
  $('.footer').hidden = !!route.walkthrough;
  if (route.mount) route.mount(params);
  updateTimer();
  if (!keep) {
    window.scrollTo(0, 0);
    const h = main.querySelector('h1');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    document.title = (h ? h.textContent + ' · ' : '') + 'Muna';
  }
}
/** Re-render the same screen, keeping scroll position and focus. */
function refresh() {
  const y = window.scrollY, a = document.activeElement;
  let sel = null;
  if (a && a.id) sel = '#' + CSS.escape(a.id);
  else if (a && a.dataset && a.dataset.act) sel = `[data-act="${CSS.escape(a.dataset.act)}"][data-v="${CSS.escape(a.dataset.v || '')}"]`;
  ACTIVE = ACTIVE && { ...ACTIVE, route: { ...ACTIVE.route, leave: null } }; // same screen: don't run leave hooks
  render(true);
  window.scrollTo(0, y);
  if (sel) { const el = $(sel); if (el) el.focus({ preventScroll: true }); }
}

/* ---------------------------------------------------------------- navigation
   Visitors see the website nav. Signed-in teachers/students see app links, plus a bottom tab bar on phones. */
function navSection(path) {
  if (/^teacher\/(review|inbox)/.test(path)) return 'review';
  if (/^student\/(game|play)/.test(path)) return 'play';
  if (path === 'settings') return 'data';
  return 'home';
}
function renderTopbar(route) {
  const role = DB.session.role, stu = currentStudent(), path = currentPath(), sec = navSection(path);
  const signedIn = (role === 'teacher' && DB.teacher) || (role === 'student' && stu);
  $('#brand').setAttribute('href', role === 'teacher' && signedIn ? '#/teacher' : role === 'student' && signedIn ? '#/student' : '#/');
  let links = [];
  if (role === 'teacher' && signedIn) {
    const n = DB.submissions.filter(s => NEEDS_TEACHER.includes(s.status) && assignmentById(s.assignmentId)).length;
    links = [['home', '#/teacher', 'Classes', 'school'], ['review', '#/teacher/inbox', 'To review', 'clipboard-check', n], ['data', '#/settings', 'Data', 'database']];
  } else if (role === 'student' && signedIn) {
    const n = DB.submissions.filter(s => s.studentId === stu.id && ['followup', 'concern'].includes(s.status)).length;
    links = [['home', '#/student', 'My work', 'book-open', n], ['play', '#/student/play', 'Evidence Game', 'gamepad-2'], ['data', '#/settings', 'Data', 'database']];
  }
  const link = ([k, href, label, icn, n]) => `<a href="${href}" ${k === sec ? 'aria-current="page"' : ''}>${ic(icn)}${label}${n ? `<span class="count" aria-label="${n} new">${n}</span>` : ''}</a>`;
  $('#navlinks').innerHTML = signedIn ? links.map(link).join('')
    : `<a href="#/" data-act="scrollTo" data-v="features">Features</a><a href="#/" data-act="scrollTo" data-v="how">How it works</a><a href="#/" data-act="scrollTo" data-v="tanong">T.A.N.O.N.G.</a>`;
  $('#tabbar').innerHTML = signedIn ? links.map(([k, href, label, icn, n]) => `<a href="${href}" ${k === sec ? 'aria-current="page"' : ''}><span class="ti">${ic(icn)}</span>${label}${n ? `<span class="count">${n}</span>` : ''}</a>`).join('') : '';
  const name = role === 'teacher' ? DB.teacher?.name : stu?.name;
  $('#navright').innerHTML = `<span id="timer"></span>${themeButton()}` + (signedIn
    ? `<button class="me" data-act="toggleMenu" aria-haspopup="true" aria-expanded="false" id="meBtn"><span class="avatar" aria-hidden="true">${esc(initials(name))}</span><span class="name">${esc(name)}</span></button>`
    : `<a class="btn ghost sm join-btn" href="#/start/student" aria-label="Join a class"><span class="long">Join a class</span><span class="short">Join</span></a><a class="btn sm" href="#/start">Sign in</a>`);
  updateTimer();
}
function closeMenu() { const m = $('#menu'); if (m) m.remove(); const b = $('#meBtn'); if (b) b.setAttribute('aria-expanded', 'false'); }
document.addEventListener('click', e => { if ($('#menu') && !e.target.closest('#menu, #meBtn')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#menu')) { closeMenu(); $('#meBtn')?.focus(); } });

/* ---------------------------------------------------------------- light / dark theme
   The choice is saved on this device. With no saved choice, Muna uses light mode.
   index.html sets data-theme before the page paints, so there is no flash of the wrong theme. */
const THEME_KEY = 'muna-theme';
const isDark = () => document.documentElement.dataset.theme === 'dark';
function savedTheme() { try { return localStorage.getItem(THEME_KEY); } catch { return null; } }
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#141833' : '#E8594F');
}
function themeButton() {
  const d = isDark(), label = d ? 'Switch to light mode' : 'Switch to dark mode';
  return `<button class="iconbtn themebtn" data-act="toggleTheme" aria-label="${label}" title="${label}">${ic(d ? 'sun' : 'moon')}</button>`;
}
function swapThemeButtons() {
  const had = document.activeElement?.classList.contains('themebtn');
  $$('.themebtn').forEach(b => { b.outerHTML = themeButton(); });
  if (had) $$('.themebtn').find(b => b.offsetParent)?.focus();
}
ACT.toggleTheme = () => {
  const t = isDark() ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode: still switch for this visit */ }
  applyTheme(t); swapThemeButtons();
};
applyTheme(isDark() ? 'dark' : 'light');

/* ---------------------------------------------------------------- live timer in the top bar
   Screens set TIMER = { label, start, stopped } to show how long a task is taking. */
let TIMER = null;
function updateTimer() {
  const el = $('#timer');
  if (!el) return;
  if (!TIMER) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="timer" title="${esc(TIMER.label)}"><span class="sr-only">${esc(TIMER.label)}: </span>${ic('timer')} ${fmtClock((TIMER.stopped || Date.now()) - TIMER.start)}</span>`;
}
setInterval(updateTimer, 1000);

/* ---------------------------------------------------------------- global events */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
  fn(el.dataset.v, el, e);
});
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const fn = FORM[form.dataset.form];
  if (fn) fn(new FormData(form), form, e);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el && ACT[el.dataset.change]) ACT[el.dataset.change](el.value, el, e);
});
$('#dlg').addEventListener('click', e => { if (e.target.id === 'dlg') closeDialog(); });
$('#dlg').addEventListener('close', () => { if (dlgReturnFocus && document.contains(dlgReturnFocus)) dlgReturnFocus.focus(); });
window.addEventListener('hashchange', () => { closeMenu(); render(); });
window.addEventListener('storage', e => { if (e.key === STORE_KEY) { loadDB(); refresh(); } }); // another tab changed data

/* ---------------------------------------------------------------- shared actions */
Object.assign(ACT, {
  go: v => go(v),
  closeDlg: () => closeDialog(),
  switchRole: () => { closeMenu(); DB.session = { role: null, studentId: null }; saveDB(); TIMER = null; go('start'); },
  signOut: () => { closeMenu(); DB.session = { role: null, studentId: null }; saveDB(); TIMER = null; go(''); },
  scrollTo: id => { if (currentPath() !== '') { go(''); setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60); } else document.getElementById(id)?.scrollIntoView(); },
  toggleMenu: (v, btn) => {
    if ($('#menu')) return closeMenu();
    const role = DB.session.role, name = role === 'teacher' ? DB.teacher?.name : currentStudent()?.name;
    document.body.insertAdjacentHTML('beforeend', `<div class="menu" id="menu" role="menu">
      <div class="who">${role === 'teacher' ? 'Teacher' : 'Student'}<br><b style="color:var(--ink);font-size:14px">${esc(name)}</b></div>
      <button role="menuitem" data-act="openOnboarding">${ic('circle-help')} How Muna works</button>
      ${role === 'teacher' ? `<button role="menuitem" data-act="openGettingStarted">${ic('list-checks')} Getting started checklist</button>` : ''}
      <a href="#/settings" role="menuitem">${ic('database')} Data &amp; export</a>
      <button role="menuitem" data-act="switchRole">${ic('repeat')} Switch account</button>
      <button role="menuitem" data-act="signOut">${ic('log-out')} Sign out</button></div>`);
    btn.setAttribute('aria-expanded', 'true'); $('#menu a').focus();
  },
  print: () => window.print(),
  loadSample: () => {
    if (DB.classes.some(c => c.sample)) toast('Sample class is already loaded.');
    else { loadSampleData(); toast('Sample class loaded.'); }
    DB.session = { role: 'teacher', studentId: null }; saveDB(); go('teacher');
  },
  loadSampleStudent: () => {
    if (!DB.classes.some(c => c.sample)) { loadSampleData(); saveDB(); }
    toast('Sample class loaded. Pick a student to continue.');
    refresh();
  },
  importFile: (v, el) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
    input.addEventListener('change', async () => {
      const f = input.files[0]; if (!f) return;
      if (f.size > 5e6) return toast('That file is too large for a Muna export.');
      try {
        const counts = importData(JSON.parse(await f.text()));
        const n = Object.values(counts).reduce((a, b) => a + b, 0);
        toast(n ? `Imported: ${Object.entries(counts).map(([k, c]) => `${c} ${k}`).join(', ')}.` : 'Nothing new in that file.', 4000);
        refresh();
      } catch (err) { toast('Could not import: ' + err.message, 4000); }
    });
    input.click();
  },
  exportAll: () => exportAll(),
  resetAll: async () => {
    if (!await confirmDialog('Erase all Muna data on this device?', 'This deletes every class, student, submission, and game saved in this browser. Export first if you want to keep it. This cannot be undone.', 'Erase everything', true)) return;
    localStorage.removeItem(STORE_KEY); DB = emptyDB(); saveDB(); TIMER = null; toast('All data erased.'); go('');
  },
  continueTeacher: () => { DB.session = { role: 'teacher', studentId: null }; saveDB(); go('teacher'); },
  openOnboarding: () => {
    if (DB.teacher) { DB.teacher.onboardingDismissed = false; saveDB(); }
    closeMenu(); go('teacher/onboarding');
  },
  openGettingStarted: () => { closeMenu(); go('teacher'); setTimeout(() => { const card = document.querySelector('.get-started'); if (card) { const details = card.querySelector('details'); if (details) details.open = true; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 60); },
  continueStudent: id => { DB.session = { role: 'student', studentId: id }; saveDB(); go('student'); }
});

/* ---------------------------------------------------------------- boot */
loadDB();
render();
window.addEventListener('pagehide', () => { if (ACTIVE && ACTIVE.route.leave) ACTIVE.route.leave(ACTIVE.params, ''); saveDB(); });
