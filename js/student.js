/* Muna prototype · student screens
   Join a class, see assignments, and work inside the Output Sandbox:
   Think First -> Write (drafts, paste labels, autosave) -> Sources -> AI note -> Understanding Check -> Submit.
   After submitting: see the teacher's decision, answer follow-ups, or reply/appeal a concern. */
'use strict';

const sCrumb = (...parts) => [`<a href="#/student">My work</a>`, ...parts].join(' › ');
const sNotFound = what => `<div class="empty">${badge('search', 'blue', 'big')}<b>${esc(what)} not found on this device.</b><br><span class="small">Ask your teacher for the class file.</span><br><a class="btn sm" style="margin-top:12px" href="#/student">Back</a></div>`;

/* ================================================================ join / login */
addRoute('student/login', {
  role: null,
  render() {
    const here = DB.students.slice().sort((a, b) => a.name.localeCompare(b.name));
    return `
    <div style="max-width:480px;margin:0 auto">
    ${muni('Hi! Enter your class code. Isip muna!')}
    <h1>Join your class</h1>
    <form class="card" data-form="studentJoin" novalidate>
      <label class="field">Class code<input type="text" name="code" class="code" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="MUN-XXXX" required></label>
      <label class="field">Full name<input type="text" name="name" maxlength="60" autocomplete="name" required placeholder="Bea Dela Cruz"></label>
      <div id="joinErr" role="alert"></div>
      <button class="btn coral lg block">Join</button>
    </form>
    ${here.length ? `<h2 style="margin-top:24px">Continue as</h2>
      <ul class="list">${here.map(s => `<li><button class="item" data-act="continueStudent" data-v="${s.id}"><span class="avatar" aria-hidden="true">${esc(initials(s.name))}</span><span class="grow"><b>${esc(s.name)}</b></span><span class="go" aria-hidden="true">›</span></button></li>`).join('')}</ul>` : `
      <section class="card flat" style="margin-top:24px;text-align:center">
        <b>No classes on this device yet</b>
        <p class="small muted">Classes are saved in each browser. Try Muna with the sample class and its students.</p>
        <button class="btn ghost block" data-act="loadSampleStudent">Try the sample class</button>
      </section>`}
    <p class="small muted center" style="margin-top:16px">On your own phone? <button class="linkbtn" data-act="importFile">Import class file</button></p>
    </div>`;
  }
});
FORM.studentJoin = (fd, form) => {
  const code = String(fd.get('code') || '').trim(), name = String(fd.get('name') || '').trim().replace(/\s+/g, ' ');
  const err = $('#joinErr');
  if (!code || !name) { err.innerHTML = '<p class="err">Enter the code and your name.</p>'; return; }
  if (words(name) < 2) { err.innerHTML = '<p class="err">Please use your first and last name.</p>'; form.name.focus(); return; }
  const c = classByCode(code);
  if (!c) { err.innerHTML = `<p class="err">No class “${esc(code.toUpperCase())}” on this device.</p><p class="small">On your own phone? <button type="button" class="linkbtn" data-act="importFile">Import the class file</button> first.</p>`; form.code.focus(); return; }
  const s = addStudentToClass(name, c.id);
  DB.session = { role: 'student', studentId: s.id }; saveDB();
  toast(`Joined ${c.name}`); go('student');
};

/* ================================================================ student home */
addRoute('student', {
  role: 'student', wide: true,
  render() {
    const me = currentStudent(), classes = me.classIds.map(classById).filter(Boolean);
    const all = classes.flatMap(c => assignmentsInClass(c.id).map(a => ({ a, c, sub: subFor(a.id, me.id) })));
    const todo = all.filter(x => !x.sub || x.sub.status === 'draft'), action = all.filter(x => x.sub && ['followup', 'concern'].includes(x.sub.status));
    const games = DB.games.filter(g => g.open && me.classIds.includes(g.classId) && !g.plays.some(p => p.studentId === me.id && p.verdict));
    const row = ({ a, c, sub }) => {
      const late = isPastDue(a.due) && (!sub || sub.status === 'draft');
      const flag = sub && ['followup', 'concern'].includes(sub.status) ? '<span class="chip r">Action needed</span>' : statusChip(sub);
      return `<li><a class="item" href="#/student/work/${a.id}">${badge(RULES[a.rule].icon, RULES[a.rule].tone, 'num')}
        <span class="grow"><b>${esc(a.title)}</b><span class="meta">${esc(c.subject)} · Due ${esc(fmtDue(a.due))}${late ? ' · late' : ''}</span></span>${flag}<span class="go" aria-hidden="true">›</span></a></li>`;
    };
    return `
    <div class="pagehead"><div><p class="eyebrow">Student</p><h1>Hi, ${esc(me.name.split(' ')[0])}</h1></div>
      <a class="btn coral" href="#/student/play">${ic('gamepad-2')} Join a game</a></div>
    <div class="bigstats">
      <div class="bigstat" style="background:var(--coral);color:#fff"><b>${todo.length}</b><span>to do</span></div>
      <div class="bigstat" style="background:var(--cream)"><b>${action.length}</b><span>need reply</span></div>
      <div class="bigstat" style="background:var(--skybg)"><b>${all.filter(x => x.sub?.status === 'accepted').length}</b><span>done</span></div>
    </div>
    ${games.length ? `<a class="card navy" href="#/student/game/${games[0].id}" style="display:flex;gap:14px;align-items:center;text-decoration:none">
      ${badge('gamepad-2', 'yellow', 'lg')}<span class="grow"><b style="font-size:17px">Evidence Game is live</b><br><span class="muted small">${esc(scenarioById(games[0].scenarioId)?.title || '')}</span></span><span class="codechip">${esc(games[0].code)}</span></a>` : ''}
    ${action.length ? `<h2>Needs your reply</h2><ul class="list" style="margin-bottom:24px">${action.map(row).join('')}</ul>` : ''}
    <h2>Assignments</h2>
    ${all.length ? `<ul class="list">${all.filter(x => !action.includes(x)).map(row).join('')}</ul>` : `<div class="empty">${badge('book-open', 'coral', 'big')}No assignments yet.</div>`}
    <details class="card flat" style="margin-top:24px"><summary>Join another class</summary>
      <form data-form="joinAnother" novalidate style="margin-top:12px"><div class="row top wrap"><label class="grow" style="min-width:160px"><span class="sr-only">Class code</span><input type="text" name="code" class="code" maxlength="9" placeholder="MUN-XXXX"></label><button class="btn" style="margin-top:6px">Join</button></div>
      <p class="err" id="anotherErr" role="alert"></p></form></details>`;
  }
});
addRoute('student/play', {
  role: 'student',
  render() {
    const me = currentStudent(), games = DB.games.filter(g => g.open && me.classIds.includes(g.classId));
    const status = g => { const pl = g.plays.find(x => x.studentId === me.id); return pl?.verdict ? 'Done' : pl?.gut ? 'Continue' : 'Start'; };
    return `
    <div class="lobby">
      <img src="assets/muni.svg" alt="" class="lobby-muni">
      <h1>Evidence Game</h1>
      <p class="lsn-sub">Check a claim like a detective. Enter the room code on the board.</p>
      <form class="lobby-form" data-form="joinGame" novalidate>
        <label class="sr-only" for="gcode">Room code</label>
        <input id="gcode" type="text" name="code" class="code" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off">
        <p class="err" id="gameErr" role="alert"></p>
        <button class="dbtn block">Play</button>
      </form>
      ${games.length ? `<h2 class="lobby-h">Open now</h2><ul class="list">${games.map(g => { const sc = scenarioById(g.scenarioId); return `<li>
        <a class="dtile lrow" href="#/student/game/${g.id}">${kindIcon(sc?.icon)}<span class="grow"><b>${esc(sc?.title || 'Round')}</b>
          <small>${sc ? `${plural(sc.cards.length, 'evidence card')} · about ${sc.minutes} min` : ''}</small></span>
          <span class="codechip">${esc(g.code)}</span><span class="lrow-go">${status(g)}</span></a></li>`; }).join('')}</ul>` : ''}
    </div>`;
  }
});
FORM.joinGame = fd => {
  const me = currentStudent(), code = String(fd.get('code') || '').trim();
  const g = DB.games.find(x => x.code === code && x.open && me.classIds.includes(x.classId));
  if (!g) { $('#gameErr').textContent = DB.games.some(x => x.code === code && x.open) ? 'That room is for another class.' : 'No room with that code.'; return; }
  go(`student/game/${g.id}`);
};
FORM.joinAnother = fd => {
  const c = classByCode(String(fd.get('code') || ''));
  if (!c) { $('#anotherErr').textContent = 'No class with that code on this device.'; return; }
  addStudentToClass(currentStudent().name, c.id);
  const me = currentStudent(); if (!me.classIds.includes(c.id)) { me.classIds.push(c.id); touch(me); saveDB(); }
  toast(`Joined ${c.name}`); refresh();
};
ACT.exportMine = () => { exportStudentWork(DB.session.studentId); toast('Downloaded. Send it to your teacher.'); };

/* ================================================================ Output Sandbox */
const SB_STEPS = [['think', 'Think First'], ['write', 'Write'], ['sources', 'Sources'], ['ai', 'AI note'], ['check', 'Check']];
const IDLE_GAP = 2 * 60e3;     // pauses longer than this don't count as active time
const NEW_SESSION = 15 * 60e3; // coming back after this long starts a new session
const AUTO_SNAPSHOT = 90e3;    // autosave a version at most this often while writing

function getOrCreateSub(a) {
  const me = currentStudent();
  return subFor(a.id, me.id) || newSubmission(a.id, me.id);
}
function stepDone(sub, a, step) {
  switch (step) {
    case 'think': return !a.thinkFirst || words(sub.think.text) >= 15;
    case 'write': return words(sub.text) >= 20;
    case 'sources': return sub.sources.length > 0 || !!sub.noSources;
    case 'ai': return aiNoteOk(sub, a);
    case 'check': return sub.uc.questions.length > 0 && sub.uc.questions.every((_, i) => words(sub.uc.answers[i]) >= 5);
  }
}
function stepsFor(a) { return SB_STEPS.filter(([k]) => (k !== 'think' || a.thinkFirst) && (k !== 'check' || a.ucCount || (a.customQs || []).length)); }
function firstOpenStep(sub, a) { const s = stepsFor(a).find(([k]) => !stepDone(sub, a, k)); return s ? s[0] : stepsFor(a).slice(-1)[0][0]; }
function canOpenStep(sub, a, step) {
  if (step === 'think') return true;
  if (a.thinkFirst && !stepDone(sub, a, 'think')) return false; // Think First must come before writing
  if (step === 'check') return stepsFor(a).filter(([k]) => k !== 'check').every(([k]) => stepDone(sub, a, k));
  return true;
}
function aiNoteOk(sub, a) {
  const ai = sub.ai, need = a.disclose;
  if (ai.none && a.rule !== 'required') return true;
  if (a.rule === 'prohibited') return !!(ai.tool.trim() || ai.purpose.trim());
  const fields = ['tool', 'purpose', 'prompts', 'changes'].filter(k => need.includes(k));
  if (!fields.length) return !!(ai.tool.trim() || ai.none);
  return fields.every(k => ai[k].trim());
}
function stepNav(sub, a, step) {
  const steps = stepsFor(a);
  return `<ol class="steps" aria-label="Your progress">${steps.map(([k, l]) => {
    const cur = k === step, done = stepDone(sub, a, k), open = canOpenStep(sub, a, k);
    return `<li>${open ? `<a href="#/student/work/${a.id}/${k}" class="${done ? 'done' : ''}" ${cur ? 'aria-current="step"' : ''}>${l}${done ? '<span class="sr-only"> (done)</span>' : ''}</a>` : `<span class="lock" title="Finish Think First first">${l}<span class="sr-only"> (locked)</span></span>`}</li>`;
  }).join('')}</ol>`;
}
function nextStepBtn(sub, a, step, label = 'Next') {
  const steps = stepsFor(a), i = steps.findIndex(([k]) => k === step), next = steps[i + 1];
  const prev = steps[i - 1];
  return `<div class="btnrow" style="margin-top:16px">
    ${prev ? `<a class="btn ghost lg" href="#/student/work/${a.id}/${prev[0]}" style="flex:0 1 auto">${ic('arrow-left')} Back</a>` : ''}
    ${next ? `<button class="btn coral lg" data-act="sbNext" data-v="${a.id}:${step}:${next[0]}" id="nextBtn" ${stepDone(sub, a, step) ? '' : 'disabled'}>${label} ${ic('arrow-right')}</button>`
           : `<button class="btn coral lg" data-act="sbSubmit" data-v="${a.id}" id="nextBtn" ${stepDone(sub, a, step) ? '' : 'disabled'}>Submit ${ic('check')}</button>`}
  </div>`;
}
function workHeader(a) {
  const c = classById(a.classId);
  return `<div class="card" style="padding:18px">
    <p class="eyebrow">${esc(c.subject)} · Due ${esc(fmtDue(a.due))}</p>
    <h1 style="font-size:22px">${esc(a.title)}</h1>
    ${a.instructions ? `<details style="margin-bottom:10px"><summary class="small">Instructions</summary><p class="small" style="margin:6px 0 0;white-space:pre-wrap">${esc(a.instructions)}</p></details>` : ''}
    <div class="banner ${esc(a.rule)}"><span aria-hidden="true">${RULES[a.rule].icon}</span><span><b>${RULES[a.rule].label}</b>${a.rule !== 'prohibited' ? ` · ${esc(rolesText(a.roles))}` : ''}</span></div></div>`;
}

/* ---- session + activity tracking (used by every sandbox step) ---- */
let SB = null; // { subId, session, lastInput }
function startSession(sub) {
  const now = Date.now(), last = sub.sessions[sub.sessions.length - 1];
  if (last && now - last.end < NEW_SESSION) { SB = { subId: sub.id, session: last, lastInput: 0 }; return; }
  const s = { start: now, end: now, activeMs: 0 };
  sub.sessions.push(s);
  logEvent(sub, sub.events.length ? 'resume' : 'open');
  SB = { subId: sub.id, session: s, lastInput: 0 };
  touch(sub); saveDB();
}
function noteActivity(sub) {
  if (!SB || SB.subId !== sub.id) startSession(sub);
  const now = Date.now();
  if (SB.lastInput && now - SB.lastInput < IDLE_GAP) SB.session.activeMs += now - SB.lastInput;
  SB.lastInput = now; SB.session.end = now;
}
const saveSoon = debounce(sub => { touch(sub); saveDB(); const el = $('#saveState'); if (el) el.textContent = `Saved ${fmtTime(Date.now())}`; }, 700);

/* ---- the work route ---- */
addRoute('student/work/:aid/:step?', {
  role: 'student',
  crumbs: p => { const a = assignmentById(p.aid); return sCrumb(a ? esc(a.title) : ''); },
  render(p) {
    const a = assignmentById(p.aid); if (!a) return sNotFound('Assignment');
    const me = currentStudent(); if (!me.classIds.includes(a.classId)) return sNotFound('Assignment');
    const existing = subFor(a.id, me.id);
    if (existing && existing.status !== 'draft') return submittedView(existing, a);
    const sub = getOrCreateSub(a);
    let step = p.step;
    if (!step || !stepsFor(a).some(([k]) => k === step)) step = firstOpenStep(sub, a);
    if (!canOpenStep(sub, a, step)) step = a.thinkFirst && !stepDone(sub, a, 'think') ? 'think' : firstOpenStep(sub, a);
    if (step !== p.step) { history.replaceState(null, '', `#/student/work/${a.id}/${step}`); }
    return stepNav(sub, a, step) + ({ think: stepThink, write: stepWrite, sources: stepSources, ai: stepAI, check: stepCheck }[step])(sub, a);
  },
  mount(p) {
    const a = assignmentById(p.aid); if (!a) return;
    const sub = subFor(a.id, currentStudent().id); if (!sub || sub.status !== 'draft') return;
    startSession(sub);
    const step = currentPath().split('/')[3];
    if (step === 'write') mountWrite(sub, a);
    const gate = () => { const b = $('#nextBtn'); if (b) b.disabled = !stepDone(sub, a, step); };
    $$('[data-bind]').forEach(el => el.addEventListener('input', () => {
      const path = el.dataset.bind.split('.');
      let o = sub; while (path.length > 1) o = o[path.shift()];
      o[path[0]] = el.value;
      // Think First counts from the moment it first reaches the minimum length.
      if (el.dataset.bind === 'think.text' && !sub.think.at && words(el.value) >= 15) sub.think.at = Date.now();
      noteActivity(sub); saveSoon(sub);
      $$(`[data-wc="${el.dataset.bind}"]`).forEach(w => { w.textContent = words(el.value); });
      gate();
    }));
  },
  leave(p) {
    const a = assignmentById(p.aid); if (!a || !SB) return;
    const sub = submissionById(SB.subId);
    if (sub && sub.status === 'draft') {
      saveSoon.flush(sub);
      if (sub.text && (!sub.snapshots.length || sub.snapshots[sub.snapshots.length - 1].text !== sub.text)) { sub.snapshots.push({ at: Date.now(), text: sub.text, kind: 'auto' }); touch(sub); saveDB(); }
    }
    SB = null;
  }
});

function stepThink(sub, a) {
  return `${workHeader(a)}
    ${muni('Before you search, what do <i>you</i> already know?')}
    <h2>Think First</h2>
    <label class="field">What do you know? What are you unsure about?
      <span class="hint">15+ words. Not graded for being right.</span>
      <textarea id="thinkBox" data-bind="think.text" rows="6" maxlength="3000" placeholder="I already know that…&#10;I am not sure about…">${esc(sub.think.text)}</textarea></label>
    <p class="small muted"><span data-wc="think.text">${words(sub.think.text)}</span> words</p>
    ${nextStepBtn(sub, a, 'think', 'Start writing')}`;
}

function stepWrite(sub, a) {
  const unlabeled = sub.pastes.map((p, i) => ({ p, i })).filter(x => !x.p.label);
  return `${workHeader(a)}
    <h2>Write</h2>
    <p class="small muted">Drafts save automatically. Pasting? Muni will ask where it’s from.</p>
    <div id="pasteSlot">${unlabeled.length ? pastePrompt(unlabeled[unlabeled.length - 1].i, unlabeled[unlabeled.length - 1].p, a) : ''}</div>
    <label class="field"><span class="sr-only">Your work</span>
      <textarea id="editor" class="editor" spellcheck="true" placeholder="Start writing…">${esc(sub.text)}</textarea></label>
    <div class="row wrap between small">
      <span class="muted"><span id="wc">${words(sub.text)}</span> words · <span id="saveState" aria-live="polite">${sub.updatedAt ? `Saved ${fmtTime(sub.updatedAt)}` : 'Not saved yet'}</span></span>
      <button class="btn ghost sm" data-act="sbSaveDraft" data-v="${a.id}">${ic('save')} Save draft</button>
    </div>
    ${unlabeled.length > 1 ? `<p class="small" style="margin-top:8px"><b>${unlabeled.length} pastes</b> still need a label. <button class="linkbtn" data-act="sbLabelAll" data-v="${a.id}">Label them</button></p>` : ''}
    <details class="card flat" style="margin-top:14px"><summary>Your process so far</summary>
      <ul class="tl" style="margin-top:10px">${timelineItems(sub).slice(-12).map(t => `<li class="${t.cls}"><time>${esc(fmtWhen(t.at))}</time>${t.html}</li>`).join('') || '<li>Nothing yet.</li>'}</ul></details>
    <p class="tiny muted">20+ words to continue.</p>
    ${nextStepBtn(sub, a, 'write')}`;
}
function pastePrompt(i, p, a) {
  const opts = [['source', 'A source', 'book-marked'], ['mine', 'My own', 'pen-line'], ['ai', 'AI', 'bot']];
  return `<div class="pastebox" role="group" aria-labelledby="pp-${i}">
    <p class="small" id="pp-${i}" style="margin-bottom:8px"><b>Pasted ${plural(p.words, 'word')}.</b> Where is it from?</p>
    <div class="seg">${opts.map(([v, l, icn]) => `<button type="button" data-act="sbLabel" data-v="${a.id}:${i}:${v}">${ic(icn)} ${l}</button>`).join('')}</div></div>`;
}
function mountWrite(sub, a) {
  const ed = $('#editor'); if (!ed) return;
  let lastLen = ed.value.length;
  ed.addEventListener('paste', e => {
    const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    if (!text.trim()) return;
    const p = { at: Date.now(), text: text.slice(0, 20000), words: words(text), label: '' };
    sub.pastes.push(p); logEvent(sub, 'paste', { words: p.words, label: '' });
    $('#pasteSlot').innerHTML = pastePrompt(sub.pastes.length - 1, p, a);
  });
  ed.addEventListener('input', e => {
    const grew = ed.value.length - lastLen;
    if (grew > 150 && e.inputType !== 'insertFromPaste' && e.inputType !== 'insertFromPasteAsQuotation') {
      logEvent(sub, 'bulk', { words: words(ed.value) - words(sub.text) });
    }
    lastLen = ed.value.length;
    sub.text = ed.value;
    noteActivity(sub);
    const last = sub.snapshots[sub.snapshots.length - 1];
    if (!last || (Date.now() - last.at > AUTO_SNAPSHOT && last.text !== sub.text)) sub.snapshots.push({ at: Date.now(), text: sub.text, kind: 'auto' });
    $('#wc').textContent = words(sub.text);
    $('#saveState').textContent = 'Saving…';
    saveSoon(sub);
    const b = $('#nextBtn'); if (b) b.disabled = !stepDone(sub, a, 'write');
  });
}

function stepSources(sub, a) {
  return `${workHeader(a)}
    <h2>Sources</h2>
    <p class="small muted">What did you read or watch?</p>
    ${sub.sources.length ? `<div class="card">${sub.sources.map((s, i) => `<div class="fact ok"><span class="dot" aria-hidden="true">${i + 1}</span><span class="grow">${esc(s.title)}${s.link ? `<br><span class="tiny muted" style="word-break:break-all">${esc(s.link)}</span>` : ''}</span>
      <button class="linkbtn" data-act="sbDelSource" data-v="${a.id}:${i}" aria-label="Remove source ${i + 1}">Remove</button></div>`).join('')}</div>` : ''}
    <form class="card" data-form="addSource" data-aid="${a.id}" novalidate>
      <label class="field">Title<input type="text" name="title" maxlength="200" placeholder="PAGASA: Climate Change in the Philippines"></label>
      <label class="field">Link <span class="hint">Optional</span><input type="url" name="link" maxlength="500" placeholder="https://"></label>
      <p class="err" id="srcErr" role="alert"></p>
      <button class="btn sm">+ Add</button>
    </form>
    <label class="check"><input type="checkbox" data-change="sbNoSources" data-v="${a.id}" ${sub.noSources ? 'checked' : ''}> I didn’t use sources</label>
    ${nextStepBtn(sub, a, 'sources')}`;
}
FORM.addSource = (fd, form) => {
  const a = assignmentById(form.dataset.aid), sub = subFor(a.id, currentStudent().id);
  const title = String(fd.get('title') || '').trim(), link = String(fd.get('link') || '').trim();
  if (!title) { $('#srcErr').textContent = 'Add a title for the source.'; form.title.focus(); return; }
  if (link && !/^https?:\/\/\S+\.\S+/i.test(link)) { $('#srcErr').textContent = 'The link should start with http:// or https://'; form.link.focus(); return; }
  sub.sources.push({ title, link, at: Date.now() }); sub.noSources = false; logEvent(sub, 'source', { title });
  touch(sub); saveDB(); refresh(); $('form[data-form=addSource] [name=title]')?.focus();
};

function stepAI(sub, a) {
  const need = a.disclose, ai = sub.ai, r = a.rule;
  const fld = (k, label, ph, area) => need.includes(k) || (r === 'prohibited' && ['tool', 'purpose'].includes(k)) || (!['prompts', 'changes'].some(x => need.includes(x)) && k === 'tool')
    ? `<label class="field">${label}${area ? `<textarea data-bind="ai.${k}" rows="3" maxlength="2000" placeholder="${esc(ph)}">${esc(ai[k])}</textarea>` : `<input type="text" data-bind="ai.${k}" maxlength="200" value="${esc(ai[k])}" placeholder="${esc(ph)}">`}</label>` : '';
  const fields = `${fld('tool', 'AI tool', 'ChatGPT, Gemini, Meta AI…')}${fld('purpose', 'Used it for', 'Check my grammar')}
    ${fld('prompts', 'Your prompts', 'What you typed', true)}${fld('changes', 'What you kept or changed', 'I kept… I changed…', true)}`;
  return `${workHeader(a)}
    <h2>AI note</h2>
    <p class="small muted">Honest is always better.</p>
    <div class="card">
      ${r !== 'required' ? `<label class="check"><input type="checkbox" data-change="sbNoAI" data-v="${a.id}" ${ai.none ? 'checked' : ''}> I didn’t use AI</label>` : ''}
      ${ai.none && r !== 'required' ? '' : `<div style="margin-top:12px">${r === 'prohibited' ? '<p class="small"><b>AI isn’t allowed here.</b> Used it anyway? Say how.</p>' : ''}${fields}</div>`}
    </div>
    ${nextStepBtn(sub, a, 'ai')}`;
}

function stepCheck(sub, a) {
  const basis = sub.text + '|' + sub.think.text + '|' + sub.sources.map(s => s.title).join() + '|' + sub.ai.tool + '|' + a.ucCount + '|' + (a.customQs || []).join();
  if (sub.uc.basis !== basis) {
    const qs = buildUCQuestions(sub, a);
    sub.uc.answers = qs.map((q, i) => sub.uc.questions[i] === q ? sub.uc.answers[i] || '' : '');
    sub.uc.questions = qs; sub.uc.basis = basis; touch(sub); saveDB();
  }
  return `${workHeader(a)}
    ${muni('Almost done! Explain it in your own words.')}
    <h2>Understanding Check</h2>
    ${sub.uc.questions.map((q, i) => `<div class="qa"><label class="field" style="margin:0"><span class="q" style="display:block">${i + 1}. ${esc(q)}</span>
      <textarea data-bind="uc.answers.${i}" rows="3" maxlength="2000">${esc(sub.uc.answers[i] || '')}</textarea></label>
      <p class="tiny muted" style="margin:4px 0 0"><span data-wc="uc.answers.${i}">${words(sub.uc.answers[i])}</span> / 5+ words</p></div>`).join('')}
    ${nextStepBtn(sub, a, 'check')}`;
}

Object.assign(ACT, {
  sbNext: v => {
    const [aid, step, next] = v.split(':'), a = assignmentById(aid), sub = subFor(aid, currentStudent().id);
    if (!stepDone(sub, a, step)) return;
    if (step === 'think') logEvent(sub, 'think', { words: words(sub.think.text) });
    if (step === 'write' && sub.text && sub.snapshots[sub.snapshots.length - 1]?.text !== sub.text) sub.snapshots.push({ at: Date.now(), text: sub.text, kind: 'auto' });
    if (step === 'ai') logEvent(sub, 'ainote', { none: sub.ai.none, tool: sub.ai.tool });
    touch(sub); saveDB(); go(`student/work/${aid}/${next}`);
  },
  sbSaveDraft: aid => {
    const sub = subFor(aid, currentStudent().id);
    if (!words(sub.text)) return toast('Write something first, then save a draft.');
    sub.snapshots.push({ at: Date.now(), text: sub.text, kind: 'manual' }); logEvent(sub, 'draft', { words: words(sub.text) });
    touch(sub); saveDB(); toast(`Draft ${draftCount(sub)} saved.`);
    $('#saveState').textContent = `Saved ${fmtTime(Date.now())}`;
  },
  sbLabel: v => {
    const [aid, i, label] = v.split(':'), a = assignmentById(aid), sub = subFor(aid, currentStudent().id), p = sub.pastes[Number(i)];
    if (!p) return;
    p.label = label; logEvent(sub, 'label', { label }); touch(sub); saveDB();
    const left = sub.pastes.map((x, j) => ({ p: x, i: j })).filter(x => !x.p.label);
    $('#pasteSlot').innerHTML = left.length ? pastePrompt(left[left.length - 1].i, left[left.length - 1].p, a) : '';
    toast(label === 'ai' && a.rule === 'prohibited' ? 'Thanks for being honest. Mention it in your AI note too.' : 'Labeled. Thanks for being clear!');
    if (label === 'source' && !sub.sources.length) toast('Labeled. Remember to add this source in the Sources step.');
  },
  sbLabelAll: aid => { const sub = subFor(aid, currentStudent().id); const a = assignmentById(aid); const left = sub.pastes.map((p, i) => ({ p, i })).filter(x => !x.p.label); if (left.length) { $('#pasteSlot').innerHTML = pastePrompt(left[0].i, left[0].p, a); $('#pasteSlot button').focus(); } },
  sbDelSource: v => { const [aid, i] = v.split(':'); const sub = subFor(aid, currentStudent().id); sub.sources.splice(Number(i), 1); touch(sub); saveDB(); refresh(); },
  sbNoSources: (val, el) => { const sub = subFor(el.dataset.v, currentStudent().id); sub.noSources = el.checked; touch(sub); saveDB(); refresh(); },
  sbNoAI: (val, el) => { const sub = subFor(el.dataset.v, currentStudent().id); sub.ai.none = el.checked; touch(sub); saveDB(); refresh(); },
  sbSubmit: async aid => {
    const a = assignmentById(aid), sub = subFor(aid, currentStudent().id);
    const missing = stepsFor(a).filter(([k]) => !stepDone(sub, a, k)).map(([, l]) => l);
    if (missing.length) return toast('Finish these first: ' + missing.join(', '));
    const unl = sub.pastes.filter(p => !p.label).length;
    if (!await confirmDialog('Submit your work?', `${unl ? `${plural(unl, 'paste')} still unlabeled. ` : ''}You can’t edit after this.`, 'Submit')) return;
    const now = Date.now();
    if (SB && SB.session) SB.session.end = now;
    sub.snapshots.push({ at: now, text: sub.text, kind: 'submit' });
    logEvent(sub, 'check'); logEvent(sub, 'submit', { words: words(sub.text) });
    sub.status = 'submitted'; sub.submittedAt = now; touch(sub); saveDB();
    SB = null; go(`student/work/${aid}`);
  }
});

/* ================================================================ after submitting */
function submittedView(sub, a) {
  const r = sub.review, c = classById(a.classId);
  const status = {
    submitted: muni('Submitted! Your teacher will review it.'),
    answered: muni('Answers sent. Your teacher will check soon.'),
    replied: muni('Reply sent.'),
    followup: muni('Your teacher has a few questions.'),
    concern: muni('Your teacher has a concern. Reply below.'),
    accepted: muni('Accepted. Great job thinking first!')
  }[sub.status] || '';
  return `
    <div class="pagehead"><div><p class="eyebrow">${esc(c.subject)}</p><h1>${esc(a.title)}</h1></div>${statusChip(sub)}</div>
    ${status}
    ${sub.status === 'accepted' ? `<div class="card"><p class="eyebrow">Score</p><p class="score">${esc(r.score)}<span class="small muted"> / ${esc(a.points)}</span></p>${r.comment ? `<p class="small" style="white-space:pre-wrap">“${esc(r.comment)}”</p>` : ''}</div>` : ''}
    ${sub.status === 'followup' ? `<form class="card" data-form="answerFollowup" data-sid="${sub.id}" novalidate><h2>Questions</h2>
      ${r.followups.map((q, i) => `<div class="qa"><label class="field" style="margin:0"><span class="q" style="display:block">${i + 1}. ${esc(q)}</span><textarea name="a${i}" rows="3" maxlength="2000"></textarea></label></div>`).join('')}
      <p class="err" id="fuErr" role="alert"></p><button class="btn block">Send answers</button></form>` : ''}
    ${r.followups.length && sub.status !== 'followup' ? `<div class="card flat"><h2>Follow-up questions</h2>${r.followups.map((q, i) => `<div class="qa"><p class="q">${esc(q)}</p><p class="a">${esc(r.followupAnswers[i] || '')}</p></div>`).join('')}</div>` : ''}
    ${r.concern ? `<div class="card blush"><h2>Your teacher’s concern</h2><p class="small" style="white-space:pre-wrap">${esc(r.concern)}</p>
      ${r.evidence.length ? `<h3>Evidence attached</h3>${r.evidence.map(t => `<div class="fact info"><span class="dot" aria-hidden="true">?</span><span>${esc(t)}</span></div>`).join('')}` : ''}
      <p class="tiny muted" style="margin-top:8px">A question, not an accusation.</p></div>` : ''}
    ${sub.status === 'concern' ? `<form class="card" data-form="replyConcern" data-sid="${sub.id}" novalidate><h2>Your reply</h2>
      <label class="field"><span class="sr-only">Your reply</span><textarea name="reply" rows="4" maxlength="2000" placeholder="What happened, in your own words"></textarea></label>
      <label class="check"><input type="checkbox" name="appeal"> I want to appeal</label>
      <p class="err" id="rcErr" role="alert"></p><button class="btn block" style="margin-top:8px">Send reply</button></form>` : ''}
    ${r.studentReply && sub.status !== 'concern' ? `<div class="card flat"><h3>Your reply${r.appeal ? ' (appeal)' : ''}</h3><p class="small" style="white-space:pre-wrap">${esc(r.studentReply)}</p></div>` : ''}
    <div class="receipt"><p class="eyebrow">Your Muna Receipt</p>
      <div class="stats">
        <div class="stat"><b>${fmtDur(activeMs(sub))}</b><span>active writing</span></div>
        <div class="stat"><b>${(sub.sessions || []).length}</b><span>sessions</span></div>
        <div class="stat"><b>${words(sub.text)}</b><span>words</span></div>
        <div class="stat"><b>${draftCount(sub)}</b><span>drafts</span></div>
        <div class="stat"><b>${sub.sources.length}</b><span>sources</span></div>
        <div class="stat"><b>${sub.pastes.filter(p => p.label).length}/${sub.pastes.length}</b><span>pastes labeled</span></div>
      </div></div>
    <details class="card flat"><summary style="cursor:pointer;font-weight:700">Read what you submitted</summary><div class="snap">${esc(sub.text)}</div></details>
    <div class="btnrow"><a class="btn ghost" href="#/student">${ic('arrow-left')} My work</a><button class="btn ghost" data-act="exportMine">Export</button></div>`;
}
FORM.answerFollowup = (fd, form) => {
  const sub = submissionById(form.dataset.sid);
  const ans = sub.review.followups.map((_, i) => String(fd.get('a' + i) || '').trim());
  if (ans.some(x => words(x) < 3)) { $('#fuErr').textContent = 'Answer every question in at least one sentence.'; return; }
  sub.review.followupAnswers = ans; sub.status = 'answered'; logEvent(sub, 'fupAnswer'); touch(sub); saveDB(); toast('Answers sent to your teacher.'); refresh();
};
FORM.replyConcern = (fd, form) => {
  const sub = submissionById(form.dataset.sid), reply = String(fd.get('reply') || '').trim();
  if (words(reply) < 5) { $('#rcErr').textContent = 'Write at least one full sentence.'; form.reply.focus(); return; }
  sub.review.studentReply = reply; sub.review.appeal = !!fd.get('appeal'); sub.status = 'replied';
  logEvent(sub, 'reply', { appeal: sub.review.appeal }); touch(sub); saveDB(); toast('Reply sent.'); refresh();
};
