/* Muna prototype · teacher screens
   Dashboard, classes, grading system, assignment setup (AI rules), submissions,
   Process View + Understanding Check review, gradebook, and Evidence Game hosting. */
'use strict';

const tCrumb = (...parts) => [`<a href="#/teacher">Classes</a>`, ...parts].join(' › ');
const classCrumb = c => c ? `<a href="#/teacher/class/${c.id}">${esc(c.name)}</a>` : '';
const notFound = what => `<div class="empty"><p><b>${esc(what)} not found.</b></p><p class="small">It may have been deleted, or it is saved on another device.</p><a class="btn" href="#/teacher">Back to classes</a></div>`;

/* ================================================================ first-time setup */
addRoute('teacher/setup', {
  role: null,
  render: () => `
    <div style="max-width:480px;margin:0 auto">
    ${muni('Hi! I’m Muni. Let’s get you set up.')}
    <h1>Your teacher space</h1>
    <form class="card" data-form="teacherSetup" novalidate>
      <label class="field">Your name<input type="text" name="name" required maxlength="60" autocomplete="name" value="${esc(DB.teacher?.name || '')}" placeholder="Ms. Reyes"></label>
      <label class="field">School <span class="hint">Optional</span><input type="text" name="school" maxlength="80" value="${esc(DB.teacher?.school || '')}"></label>
      <p class="err" id="setupErr" role="alert"></p>
      <button class="btn coral block">Continue</button>
    </form></div>`
});
FORM.teacherSetup = fd => {
  const name = String(fd.get('name') || '').trim();
  if (!name) { $('#setupErr').textContent = 'Please enter your name.'; $('input[name=name]').focus(); return; }
  DB.teacher = { name, school: String(fd.get('school') || '').trim() };
  DB.session = { role: 'teacher', studentId: null }; saveDB(); go('teacher');
};

/* ================================================================ dashboard */
const pendingReviews = () => DB.submissions.filter(s => NEEDS_TEACHER.includes(s.status) && assignmentById(s.assignmentId)).sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0));
const reviewItem = s => {
  const a = assignmentById(s.assignmentId), st = studentById(s.studentId);
  return `<li><a class="item" href="#/teacher/review/${s.id}"><span class="avatar" aria-hidden="true">${esc(initials(st?.name))}</span>
    <span class="grow"><b>${esc(st?.name || 'Student')}</b><span class="meta">${esc(a.title)}</span></span>${statusChip(s)}<span class="go" aria-hidden="true">›</span></a></li>`;
};
addRoute('teacher', {
  role: 'teacher', wide: true,
  render() {
    const pending = pendingReviews();
    const reviewed = DB.submissions.filter(s => s.review.firstDecisionMs);
    const avg = reviewed.length ? reviewed.reduce((t, s) => t + s.review.firstDecisionMs, 0) / reviewed.length : 0;
    const students = new Set(DB.classes.flatMap(c => studentsInClass(c.id).map(s => s.id))).size;
    return `
    <div class="pagehead"><div><p class="eyebrow">${esc(DB.teacher.school || 'Teacher')}</p><h1>Magandang araw, ${esc(DB.teacher.name)}</h1></div>
      <button class="btn coral" data-act="newClassDlg">+ New class</button></div>
    <div class="bigstats">
      <a class="bigstat" href="#/teacher/inbox" style="background:var(--coral);color:#fff;text-decoration:none"><b>${pending.length}</b><span>to review</span></a>
      <div class="bigstat" style="background:var(--skybg)"><b>${students}</b><span>students</span></div>
      <div class="bigstat" style="background:var(--cream)"><b>${avg ? fmtDur(avg) : '–'}</b><span>avg. review</span></div>
    </div>
    ${pending.length ? `<section aria-labelledby="h-rev" style="margin-bottom:28px"><div class="row between"><h2 id="h-rev">Up next</h2>${pending.length > 3 ? '<a class="linkbtn" href="#/teacher/inbox">See all</a>' : ''}</div>
      <ul class="list">${pending.slice(0, 3).map(reviewItem).join('')}</ul></section>` : ''}
    <section aria-labelledby="h-cls">
      <h2 id="h-cls">Classes</h2>
      <div class="tiles">
        ${DB.classes.map((c, i) => {
          const n = studentsInClass(c.id).length, asg = assignmentsInClass(c.id);
          const todo = DB.submissions.filter(s => NEEDS_TEACHER.includes(s.status) && asg.some(a => a.id === s.assignmentId)).length;
          return `<a class="tile t${i % 4}" href="#/teacher/class/${c.id}"><span class="tile-sub">${esc(c.subject)}</span><h3>${esc(c.name)}</h3>
            <span class="tile-foot"><span class="chip n">${plural(n, 'student')}</span>${todo ? `<span class="chip y">${todo} to review</span>` : ''}<span class="codechip">${esc(c.code)}</span></span></a>`;
        }).join('')}
        <button class="tile add" data-act="newClassDlg"><span class="plus" aria-hidden="true">+</span>New class</button>
      </div>
      ${DB.classes.length ? '' : '<p class="center small muted" style="margin-top:16px">Or <button class="linkbtn" data-act="loadSample">open the sample class</button></p>'}
    </section>`;
  }
});
ACT.newClassDlg = () => openDialog(`
  <button class="iconbtn x" data-act="closeDlg" aria-label="Close">${ic('x')}</button>
  <h2>New class</h2>
  <form data-form="newClass" novalidate>
    <label class="field">Class name<input type="text" name="name" required maxlength="60" placeholder="Grade 9 · Sampaguita"></label>
    <label class="field">Subject<input type="text" name="subject" required maxlength="60" placeholder="Science 9" list="subjects"></label>
    <datalist id="subjects">${['Science 9', 'English 10', 'Mathematics 8', 'Araling Panlipunan 8', 'Oral Communication', 'Media and Information Literacy', 'Purposive Communication'].map(s => `<option value="${s}">`).join('')}</datalist>
    <label class="field">Grading system<select name="preset">${Object.entries(GRADING_PRESETS).map(([k, p]) => `<option value="${k}" ${k === 'deped-scimath' ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></label>
    <p class="err" id="classErr" role="alert"></p>
    <button class="btn coral block">Create class</button>
  </form>`);

addRoute('teacher/inbox', {
  role: 'teacher',
  render() {
    const pending = pendingReviews();
    const waiting = DB.submissions.filter(s => ['followup', 'concern'].includes(s.status) && assignmentById(s.assignmentId));
    return `<div class="pagehead"><div><h1>To review</h1><p class="sub">${pending.length ? `${plural(pending.length, 'submission')} waiting` : 'All caught up'}</p></div></div>
      ${pending.length ? `<ul class="list">${pending.map(reviewItem).join('')}</ul>` : `<div class="empty">${badge('party-popper', 'green', 'big')}Nothing to review right now.</div>`}
      ${waiting.length ? `<h2 style="margin-top:28px">Waiting on students</h2><ul class="list">${waiting.map(reviewItem).join('')}</ul>` : ''}`;
  }
});
FORM.newClass = (fd, form) => {
  const name = String(fd.get('name') || '').trim(), subject = String(fd.get('subject') || '').trim();
  if (!name || !subject) { $('#classErr').textContent = 'Add a class name and a subject.'; form.querySelector(name ? '[name=subject]' : '[name=name]').focus(); return; }
  const c = createClass({ name, subject, preset: String(fd.get('preset')) });
  closeDialog(); toast(`Class created · code ${c.code}`); go(`teacher/class/${c.id}`);
};

/* ================================================================ class (tabs) */
const CLASS_TABS = [['', 'Assignments'], ['students', 'Students'], ['grades', 'Grades'], ['games', 'Games'], ['grading', 'Grading']];
addRoute('teacher/class/:id/:tab?', {
  role: 'teacher', wide: true,
  crumbs: p => tCrumb(classCrumb(classById(p.id))),
  render(p) {
    const c = classById(p.id); if (!c) return notFound('Class');
    const tab = p.tab || '';
    const body = { '': classAssignments, students: classStudents, grades: classGrades, games: classGames, grading: classGrading }[tab] || classAssignments;
    return `
    <div class="pagehead">
      <div><p class="eyebrow">${esc(c.subject)}</p><h1>${esc(c.name)}</h1></div>
      <div class="row wrap"><span class="codechip" style="font-size:16px;padding:8px 14px" title="Class code">${esc(c.code)}</span>
        <button class="btn ghost sm" data-act="shareDlg" data-v="${c.id}">Share</button>
        <a class="btn coral" href="#/teacher/assign/new/${c.id}">+ Assignment</a></div>
    </div>
    <nav class="tabs" aria-label="Class sections">${CLASS_TABS.map(([k, l]) => `<a href="#/teacher/class/${c.id}${k ? '/' + k : ''}" ${k === tab ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    ${body(c)}`;
  },
  mount(p) { if (p.tab === 'grading') mountGrading(p.id); }
});

function classAssignments(c) {
  const asg = assignmentsInClass(c.id), n = studentsInClass(c.id).length;
  return asg.length ? `<ul class="list">${asg.map(a => {
      const subs = subsForAssignment(a.id), done = subs.filter(s => s.status !== 'draft').length, todo = subs.filter(s => NEEDS_TEACHER.includes(s.status)).length;
      return `<li><a class="item" href="#/teacher/assign/${a.id}">${badge(RULES[a.rule].icon, RULES[a.rule].tone, 'num')}
        <span class="grow"><b>${esc(a.title)}</b><span class="meta">Due ${esc(fmtDue(a.due))} · ${esc(a.points)} pts</span></span>
        ${todo ? `<span class="chip y">${todo} to review</span>` : ''}<span class="chip n">${done}/${n}</span><span class="go" aria-hidden="true">›</span></a></li>`;
    }).join('')}</ul>`
    : `<div class="empty">${badge('file-text', 'coral', 'big')}No assignments yet.<br><a class="btn coral sm" style="margin-top:12px" href="#/teacher/assign/new/${c.id}">Create one</a></div>`;
}
ACT.shareDlg = cid => {
  const c = classById(cid);
  openDialog(`<button class="iconbtn x" data-act="closeDlg" aria-label="Close">${ic('x')}</button><h2>Share with students</h2>
    <div class="center" style="margin:8px 0 18px"><span class="bigcode">${esc(c.code)}</span><p class="small muted" style="margin:8px 0 0">Class code</p></div>
    <ol class="small" style="padding-left:20px;margin:0 0 16px"><li>Send the class file to students.</li><li>They import it and join with the code.</li><li>They send their work file back.</li></ol>
    <div class="btnrow"><button class="btn coral" data-act="exportClass" data-v="${c.id}">Download class file</button><button class="btn ghost" data-act="importFile">Import work</button></div>`);
};

function classStudents(c) {
  const stus = studentsInClass(c.id);
  return `
    <div class="grid2">
      <section class="card" aria-labelledby="h-roster">
        <h2 id="h-roster">Roster (${stus.length})</h2>
        ${stus.length ? `<ul class="list">${stus.map(s => {
          const subs = DB.submissions.filter(x => x.studentId === s.id && assignmentById(x.assignmentId)?.classId === c.id);
          return `<li class="item"><span class="avatar" aria-hidden="true">${esc(initials(s.name))}</span><span class="grow"><b>${esc(s.name)}</b><span class="meta">${plural(subs.filter(x => x.status !== 'draft').length, 'submission')}</span></span>
            <button class="btn danger sm" data-act="removeStudent" data-v="${c.id}:${s.id}" aria-label="Remove ${esc(s.name)} from class">Remove</button></li>`;
        }).join('')}</ul>` : '<div class="empty small">No students yet.</div>'}
      </section>
      <section>
        <div class="card cream center"><p class="small" style="margin-bottom:8px">Join code</p><span class="bigcode">${esc(c.code)}</span></div>
        <form class="card" data-form="addStudents" data-cid="${c.id}" novalidate>
          <h2>Add students</h2>
          <label class="field">One name per line<textarea name="names" rows="5" placeholder="Bea Dela Cruz&#10;Carlo Mendoza"></textarea></label>
          <button class="btn ghost">Add to roster</button>
        </form>
      </section>
    </div>`;
}
FORM.addStudents = (fd, form) => {
  const names = String(fd.get('names') || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 80);
  if (!names.length) return toast('Type at least one name.');
  names.forEach(n => addStudentToClass(n.slice(0, 60), form.dataset.cid));
  toast(`Added ${plural(names.length, 'student')}.`); refresh();
};
ACT.removeStudent = async v => {
  const [cid, sid] = v.split(':'); const s = studentById(sid);
  if (!await confirmDialog(`Remove ${s.name}?`, 'They leave this class roster. Their saved submissions stay on this device.', 'Remove', true)) return;
  s.classIds = s.classIds.filter(x => x !== cid); touch(s); saveDB(); refresh();
};
ACT.exportClass = cid => { exportClass(cid); toast('Class file downloaded. Share it with your students.'); };

function classGrades(c) {
  const rows = computeGrades(c.id), comps = c.grading.components;
  const fmt = n => n == null ? '<span class="muted">–</span>' : (Math.round(n * 10) / 10).toFixed(1);
  return `
    <div class="chips">${comps.map(x => `<span class="chip n">${esc(x.name)} ${x.weight}%</span>`).join('')}${c.grading.transmute ? '<span class="chip s">DepEd transmuted</span>' : ''}</div>
    ${rows.length ? `<div class="tablewrap"><table>
      <caption class="sr-only">Gradebook for ${esc(c.name)}</caption>
      <thead><tr><th scope="col">Student</th>${comps.map(x => `<th scope="col" class="num">${esc(x.name)}<br><span class="muted">${x.weight}%</span></th>`).join('')}<th scope="col" class="num">Initial</th><th scope="col" class="num">${c.grading.transmute ? 'Grade' : 'Final'}</th></tr></thead>
      <tbody>${rows.map(r => `<tr><th scope="row">${esc(r.student.name)}</th>${r.perComp.map(p => `<td class="num">${p.max ? `${fmt(p.pct)}<br><span class="tiny muted">${p.earned}/${p.max}</span>` : fmt(null)}</td>`).join('')}
        <td class="num">${fmt(r.initial)}</td><td class="num"><b>${r.final == null ? '–' : Math.round(r.final)}</b>${r.partial ? '<br><span class="tiny muted">so far</span>' : ''}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="btnrow" style="margin-top:12px"><button class="btn ghost sm" data-act="gradesCSV" data-v="${c.id}">Download CSV</button><button class="btn ghost sm" data-act="print">Print</button></div>`
    : '<div class="empty">No students yet.</div>'}
    <p class="tiny muted" style="margin-top:10px">Only accepted scores count. “So far” = some components have no scores yet.</p>`;
}
ACT.gradesCSV = cid => {
  const c = classById(cid), rows = computeGrades(cid);
  const head = ['Student', ...c.grading.components.map(x => `${x.name} (${x.weight}%)`), 'Initial grade', 'Final grade'];
  const lines = [head, ...rows.map(r => [r.student.name, ...r.perComp.map(p => p.pct == null ? '' : p.pct.toFixed(2)), r.initial == null ? '' : r.initial.toFixed(2), r.final == null ? '' : Math.round(r.final)])];
  download(`muna-grades-${c.code}.csv`, lines.map(l => l.map(csvCell).join(',')).join('\n'), 'text/csv');
};

function classGrading(c) {
  const g = c.grading;
  return `
    <form class="card" data-form="saveGrading" data-cid="${c.id}" novalidate>
      <h2>Grading system</h2>
      <div class="field">Your grading file <span class="hint">Kept for reference. Match the components below.</span>
        <div class="row wrap" style="margin-top:8px"><label class="btn ghost sm">${ic('upload')} Upload<input type="file" id="gradeFile" class="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"></label>
        <span class="small" id="gradeFileName">${g.fileName ? `${ic('check')} ${esc(g.fileName)}` : 'No file yet'}</span></div></div>
      <label class="field">Preset<select id="presetPick"><option value="">Pick a preset…</option>${Object.entries(GRADING_PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.label)}</option>`).join('')}</select></label>
      <fieldset><legend>Components</legend>
        <div id="compRows">${g.components.map(compRow).join('')}</div>
        <button type="button" class="btn ghost sm" id="addComp">+ Add component</button>
      </fieldset>
      <p class="small" aria-live="polite">Total: <b id="wTotal"></b></p>
      <label class="check"><input type="checkbox" name="transmute" ${g.transmute ? 'checked' : ''}> DepEd transmutation</label>
      <p class="err" id="gradeErr" role="alert"></p>
      <button class="btn coral" style="margin-top:8px">Save</button>
    </form>`;
}
const compRow = p => `<div class="row" data-comp="${esc(p.id)}" style="margin-bottom:8px">
  <label class="grow"><span class="sr-only">Component name</span><input type="text" name="cname" value="${esc(p.name)}" maxlength="40" required></label>
  <label style="width:96px"><span class="sr-only">Weight percent</span><input type="number" name="cweight" value="${esc(p.weight)}" min="0" max="100" inputmode="numeric"></label>
  <span aria-hidden="true">%</span><button type="button" class="btn danger sm" data-del-comp aria-label="Remove component">${ic('x')}</button></div>`;
function mountGrading(cid) {
  const form = $('form[data-form=saveGrading]'); if (!form) return;
  const total = () => { const t = $$('[name=cweight]', form).reduce((s, el) => s + (Number(el.value) || 0), 0); $('#wTotal').textContent = t + '%'; $('#wTotal').style.color = t === 100 ? 'var(--ok)' : 'var(--bad)'; };
  form.addEventListener('input', total); total();
  $('#addComp').addEventListener('click', () => { $('#compRows').insertAdjacentHTML('beforeend', compRow({ id: uid('c_'), name: '', weight: 0 })); total(); $('#compRows .row:last-child input').focus(); });
  form.addEventListener('click', e => { const b = e.target.closest('[data-del-comp]'); if (b && $$('[data-comp]', form).length > 1) { b.closest('[data-comp]').remove(); total(); } });
  $('#presetPick').addEventListener('change', e => { const k = e.target.value; if (!k) return; $('#compRows').innerHTML = presetParts(k).map(compRow).join(''); form.transmute.checked = GRADING_PRESETS[k].transmute; total(); });
  $('#gradeFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) { $('#gradeFileName').innerHTML = ic('check') + ' ' + esc(f.name); form.dataset.file = f.name; } });
}
FORM.saveGrading = (fd, form) => {
  const c = classById(form.dataset.cid);
  const comps = $$('[data-comp]', form).map(r => ({ id: r.dataset.comp, name: r.querySelector('[name=cname]').value.trim(), weight: Number(r.querySelector('[name=cweight]').value) || 0 }));
  const err = $('#gradeErr');
  if (comps.some(x => !x.name)) { err.textContent = 'Every component needs a name.'; return; }
  const t = comps.reduce((s, x) => s + x.weight, 0);
  if (t !== 100) { err.textContent = `Weights must add up to 100%. They add up to ${t}%.`; return; }
  const removed = c.grading.components.filter(x => !comps.some(y => y.id === x.id));
  DB.assignments.filter(a => a.classId === c.id && removed.some(r => r.id === a.componentId)).forEach(a => { a.componentId = comps[0].id; touch(a); });
  c.grading = { ...c.grading, components: comps, transmute: !!fd.get('transmute'), fileName: form.dataset.file || c.grading.fileName };
  touch(c); saveDB(); toast('Grading system saved.'); refresh();
};

function classGames(c) {
  const games = DB.games.filter(g => g.classId === c.id).sort((a, b) => b.createdAt - a.createdAt);
  return `
    <div class="grid2">
      <section aria-labelledby="h-lib">
        <h2 id="h-lib">Start a round <span class="chip n">~10 min</span></h2>
        <ul class="list">${SCENARIOS.map(s => `<li class="item"><span class="grow"><b>${esc(s.title)}</b><span class="meta">${esc(s.tags[0])}</span></span>
          <button class="btn coral sm" data-act="startGame" data-v="${c.id}:${s.id}">Start</button></li>`).join('')}</ul>
      </section>
      <section aria-labelledby="h-rounds">
        <h2 id="h-rounds">Past rounds</h2>
        ${games.length ? `<ul class="list">${games.map(g => { const s = scenarioById(g.scenarioId); return `<li><a class="item" href="#/teacher/game/${g.id}"><span class="grow"><b>${esc(s ? s.title : 'Scenario')}</b><span class="meta">${plural(g.plays.filter(p => p.verdict).length, 'answer')}</span></span>
          ${g.open ? `<span class="codechip">${esc(g.code)}</span>` : '<span class="chip n">Closed</span>'}<span class="go" aria-hidden="true">›</span></a></li>`; }).join('')}</ul>` : '<div class="empty small">No rounds yet.</div>'}
      </section>
    </div>`;
}
ACT.startGame = v => {
  const [cid, sid] = v.split(':');
  const g = touch({ id: uid('game_'), classId: cid, scenarioId: sid, code: makeGameCode(), open: true, createdAt: Date.now(), plays: [] });
  DB.games.push(g); saveDB(); go(`teacher/game/${g.id}`);
};

/* ================================================================ assignment setup */
let SETUP_TIMER = null;
function assignmentForm(c, a) {
  const comps = c.grading.components;
  a = a || { title: '', instructions: '', due: todayISO(7), componentId: (comps.find(x => /perf/i.test(x.name)) || comps[0]).id, points: 50, rule: 'allowed',
    roles: ['brainstorm', 'feedback'], disclose: ['tool', 'purpose', 'changes', 'pasted', 'sources'], thinkFirst: true, ucCount: 3, customQs: [] };
  const used = a.id && subsForAssignment(a.id).some(s => s.status !== 'draft');
  return `
  <form data-form="saveAssignment" data-cid="${c.id}" data-aid="${a.id || ''}" novalidate>
  <div class="cols">
    <div>
      ${used ? `<div class="banner required" style="margin-bottom:12px">${ic('triangle-alert')}<span>Students already submitted. Tell the class if you change the rule.</span></div>` : ''}
      <section class="card" aria-labelledby="h-a1">
        <h2 id="h-a1">Task</h2>
        <label class="field">Title<input type="text" name="title" required maxlength="100" value="${esc(a.title)}" placeholder="How Climate Change Affects Cebu's Coasts"></label>
        <label class="field">Instructions <span class="hint">Optional</span><textarea name="instructions" rows="3" maxlength="2000">${esc(a.instructions)}</textarea></label>
        <div class="grid3">
          <label class="field">Due<input type="date" name="due" value="${esc(a.due)}"></label>
          <label class="field">Counts toward<select name="componentId">${comps.map(x => `<option value="${x.id}" ${x.id === a.componentId ? 'selected' : ''}>${esc(x.name)} (${x.weight}%)</option>`).join('')}</select></label>
          <label class="field">Points<input type="number" name="points" min="1" max="500" value="${esc(a.points)}" inputmode="numeric"></label>
        </div>
      </section>
      <section class="card" aria-labelledby="h-a2">
        <h2 id="h-a2">AI rule</h2>
        <div class="optgrid" role="radiogroup" aria-labelledby="h-a2">${Object.entries(RULES).map(([k, r]) => `
          <label class="opt"><input type="radio" name="rule" value="${k}" ${a.rule === k ? 'checked' : ''} class="sr-only">${badge(r.icon, r.tone, 'ico')}<span><b>${r.label.replace(' for specific roles', '')}</b></span></label>`).join('')}</div>
        <fieldset id="rolesBox" style="margin:16px 0 0"><legend id="rolesLegend">AI may help to</legend>
          <div class="pills">${AI_ROLES.map(([k, l]) => `<label><input type="checkbox" name="roles" value="${k}" ${a.roles.includes(k) ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>
          <p class="tiny muted" style="margin:8px 0 0">AI never writes the final answer.</p>
        </fieldset>
      </section>
      <section class="card" aria-labelledby="h-a3">
        <h2 id="h-a3">Students share</h2>
        <div class="pills">${DISCLOSE.map(([k, l]) => `<label data-disc="${k}"><input type="checkbox" name="disclose" value="${k}" ${a.disclose.includes(k) ? 'checked' : ''}>${esc(l.replace('Which AI tool they used', 'AI tool').replace('What they used it for', 'Purpose').replace('The prompts they typed', 'Prompts').replace('What they kept, changed, or rejected', 'What they changed').replace('A label on any pasted text', 'Paste labels').replace('A list of their sources', 'Sources'))}</label>`).join('')}</div>
      </section>
      <section class="card" aria-labelledby="h-a4">
        <h2 id="h-a4">Checks</h2>
        <label class="check"><input type="checkbox" name="thinkFirst" ${a.thinkFirst ? 'checked' : ''}> Think First before writing</label>
        <label class="field" style="margin-top:12px">Understanding Check questions
          <select name="ucCount">${[0, 1, 2, 3].map(n => `<option value="${n}" ${Number(a.ucCount) === n ? 'selected' : ''}>${n === 0 ? 'None' : n}</option>`).join('')}</select></label>
        <details><summary class="small">Add your own question</summary><label class="field" style="margin-top:8px"><span class="sr-only">Your own questions, one per line</span><textarea name="customQs" rows="2" maxlength="600" placeholder="One per line">${esc((a.customQs || []).join('\n'))}</textarea></label></details>
      </section>
    </div>
    <div class="sticky">
      <section class="card blush" aria-labelledby="h-prev"><h2 id="h-prev">Student preview</h2><div id="rulePreview" aria-live="polite"></div></section>
      <p class="err" id="asgErr" role="alert"></p>
      <button class="btn coral lg block">${a.id ? 'Save changes' : 'Post assignment'}</button>
      ${a.id ? `<button type="button" class="btn danger block" style="margin-top:10px" data-act="deleteAssignment" data-v="${a.id}">Delete assignment</button>` : ''}
    </div>
  </div>
  </form>`;
}
function readAssignmentForm(form) {
  const fd = new FormData(form);
  return { title: String(fd.get('title') || '').trim(), instructions: String(fd.get('instructions') || '').trim(), due: String(fd.get('due') || ''),
    componentId: String(fd.get('componentId')), points: Number(fd.get('points')), rule: String(fd.get('rule') || 'allowed'),
    roles: fd.getAll('roles').map(String), disclose: fd.getAll('disclose').map(String), thinkFirst: !!fd.get('thinkFirst'),
    ucCount: Number(fd.get('ucCount')) || 0, customQs: String(fd.get('customQs') || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5) };
}
function mountAssignmentForm() {
  const form = $('form[data-form=saveAssignment]'); if (!form) return;
  const sync = () => {
    const a = readAssignmentForm(form);
    $('#rolesBox').hidden = a.rule === 'prohibited';
    $('#rolesLegend').textContent = a.rule === 'required' ? 'AI must be used to' : 'AI may help to';
    ['tool', 'purpose', 'prompts', 'changes'].forEach(k => { $(`[data-disc=${k}]`, form).hidden = a.rule === 'prohibited'; });
    $('#rulePreview').innerHTML = `<p class="eyebrow">${esc(a.title || 'Untitled assignment')}</p>${ruleBanner({ ...a, disclose: a.rule === 'prohibited' ? a.disclose.filter(d => ['pasted', 'sources'].includes(d)) : a.disclose })}`;
  };
  form.addEventListener('input', sync); form.addEventListener('change', sync); sync();
}
addRoute('teacher/assign/new/:cid', {
  role: 'teacher', wide: true,
  crumbs: p => tCrumb(classCrumb(classById(p.cid)), 'New assignment'),
  render(p) {
    const c = classById(p.cid); if (!c) return notFound('Class');
    return `<div class="pagehead"><div><p class="eyebrow">${esc(c.name)}</p><h1>New assignment</h1></div></div>${assignmentForm(c)}`;
  },
  mount() { SETUP_TIMER = SETUP_TIMER || Date.now(); TIMER = { label: 'Setup time', start: SETUP_TIMER }; mountAssignmentForm(); },
  leave(p, next) { TIMER = null; if (!String(next).startsWith('teacher/assign/new')) SETUP_TIMER = null; }
});
addRoute('teacher/assign/:aid/edit', {
  role: 'teacher', wide: true,
  crumbs: p => { const a = assignmentById(p.aid); return tCrumb(classCrumb(a && classById(a.classId)), 'Edit assignment'); },
  render(p) {
    const a = assignmentById(p.aid); if (!a) return notFound('Assignment');
    return `<p class="eyebrow">Edit assignment</p><h1>${esc(a.title)}</h1>${assignmentForm(classById(a.classId), a)}`;
  },
  mount: mountAssignmentForm
});
FORM.saveAssignment = (fd, form) => {
  const v = readAssignmentForm(form), err = $('#asgErr');
  if (!v.title) { err.textContent = 'Add a title so students know what this is.'; form.title.focus(); return; }
  if (!(v.points >= 1)) { err.textContent = 'Points must be at least 1.'; form.points.focus(); return; }
  if (v.rule !== 'prohibited' && !v.roles.length) { err.textContent = 'Pick at least one AI role, or choose “AI prohibited.”'; return; }
  if (v.rule === 'prohibited') { v.roles = []; v.disclose = v.disclose.filter(d => ['pasted', 'sources'].includes(d)); }
  if (!v.ucCount && !v.customQs.length) v.ucCount = 0;
  const aid = form.dataset.aid;
  if (aid) { Object.assign(assignmentById(aid), v); touch(assignmentById(aid)); saveDB(); toast('Changes saved.'); go(`teacher/assign/${aid}`); return; }
  const a = touch({ id: uid('asg_'), classId: form.dataset.cid, ...v, createdAt: Date.now(), setupMs: SETUP_TIMER ? Date.now() - SETUP_TIMER : 0 });
  DB.assignments.push(a); saveDB(); SETUP_TIMER = null;
  toast(`Posted in ${fmtDur(a.setupMs)}.`); go(`teacher/assign/${a.id}`);
};
ACT.deleteAssignment = async aid => {
  const a = assignmentById(aid), n = subsForAssignment(aid).length;
  if (!await confirmDialog('Delete this assignment?', `“${a.title}” and ${plural(n, 'saved submission')} will be deleted from this device. This cannot be undone.`, 'Delete', true)) return;
  DB.submissions = DB.submissions.filter(s => s.assignmentId !== aid);
  DB.assignments = DB.assignments.filter(x => x.id !== aid); saveDB(); toast('Assignment deleted.'); go(`teacher/class/${a.classId}`);
};

/* ================================================================ assignment detail: submissions */
addRoute('teacher/assign/:aid', {
  role: 'teacher',
  crumbs: p => { const a = assignmentById(p.aid); return tCrumb(classCrumb(a && classById(a.classId)), a ? esc(a.title) : ''); },
  render(p) {
    const a = assignmentById(p.aid); if (!a) return notFound('Assignment');
    const c = classById(a.classId), comp = componentOf(a), stus = studentsInClass(c.id);
    const rows = stus.map(s => ({ s, sub: subFor(a.id, s.id) }));
    DB.submissions.filter(x => x.assignmentId === a.id && !stus.some(s => s.id === x.studentId)).forEach(sub => rows.push({ s: studentById(sub.studentId) || { name: 'Former student' }, sub }));
    const order = { submitted: 0, answered: 0, replied: 0, followup: 1, concern: 2, draft: 3, accepted: 4 };
    rows.sort((x, y) => (order[x.sub?.status] ?? 3.5) - (order[y.sub?.status] ?? 3.5) || x.s.name.localeCompare(y.s.name));
    const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, rows.filter(r => r.sub?.status === k).length]));
    return `
    <div class="pagehead"><div><p class="eyebrow">${esc(c.name)}</p><h1>${esc(a.title)}</h1></div>
      <a class="btn ghost sm" href="#/teacher/assign/${a.id}/edit">Edit</a></div>
    <div class="chips"><span class="chip">${ic(RULES[a.rule].icon)} ${RULES[a.rule].label}</span><span class="chip y">Due ${esc(fmtDue(a.due))}</span>
      <span class="chip s">${esc(a.points)} pts · ${esc(comp ? comp.name : '–')}</span>${a.setupMs ? `<span class="chip n">${ic('timer')} set up in ${fmtDur(a.setupMs)}</span>` : ''}</div>
    <div class="bigstats">
      <div class="bigstat" style="background:var(--coral);color:#fff"><b>${counts.submitted + counts.answered + counts.replied}</b><span>to review</span></div>
      <div class="bigstat" style="background:var(--okbg)"><b>${counts.accepted}</b><span>accepted</span></div>
      <div class="bigstat" style="background:var(--page)"><b>${rows.filter(r => !r.sub || r.sub.status === 'draft').length}</b><span>not in yet</span></div>
    </div>
    <h2>Students</h2>
    ${rows.length ? `<ul class="list">${rows.map(({ s, sub }) => {
      const open = sub && sub.status !== 'draft';
      const meta = !sub ? '' : sub.status === 'draft' ? `${words(sub.text)} words so far` : sub.status === 'accepted' && sub.review.score !== '' ? `${sub.review.score}/${a.points}` : fmtWhen(sub.submittedAt);
      const inner = `<span class="avatar" aria-hidden="true">${esc(initials(s.name))}</span><span class="grow"><b>${esc(s.name)}</b><span class="meta">${esc(meta)}</span></span>${statusChip(sub)}${sub ? '<span class="go" aria-hidden="true">›</span>' : ''}`;
      return `<li>${open || sub ? `<a class="item" href="#/teacher/review/${sub.id}">${inner}</a>` : `<div class="item">${inner}</div>`}</li>`;
    }).join('')}</ul>` : `<div class="empty">No students yet. Share code <b>${esc(c.code)}</b>.</div>`}`;
  }
});

/* ================================================================ review: Process View + Understanding Check */
const RV = {}; // unsaved decision drafts per submission id
let REVIEW_START = 0;
addRoute('teacher/review/:sid', {
  role: 'teacher', wide: true,
  crumbs: p => { const s = submissionById(p.sid), a = s && assignmentById(s.assignmentId); return tCrumb(classCrumb(a && classById(a.classId)), a ? `<a href="#/teacher/assign/${a.id}">${esc(a.title)}</a>` : '', 'Review'); },
  render(p) {
    const sub = submissionById(p.sid); if (!sub) return notFound('Submission');
    const a = assignmentById(sub.assignmentId); if (!a) return notFound('Assignment');
    const stu = studentById(sub.studentId) || { name: 'Student' }, c = classById(a.classId);
    const rv = RV[sub.id] = RV[sub.id] || { snap: -1, decision: '', score: sub.review.score, comment: sub.review.comment || '', fups: [], fupOwn: '', concern: '', evidence: [], showDetector: false };
    const pts = growthPoints(sub), snapI = rv.snap < 0 || rv.snap >= pts.length ? pts.length - 1 : rv.snap, snap = pts[snapI];
    const comps = pts.map(x => x.think ? { total: words(x.text), typed: words(x.text), source: 0, mine: 0, ai: 0, unlabeled: 0 } : composition(x.text, sub.pastes));
    const max = Math.max(1, ...comps.map(x => x.total));
    const isDraft = sub.status === 'draft';
    const asks = askAbout(sub, a), fups = suggestedFollowups(sub, a);
    const facts = ruleFacts(sub, a), passed = facts.filter(f => f[0] === 'ok').length;
    // Specific talking points first. Skip a general warning when a talking point already names the same paste.
    const pasteAsk = asks.some(x => /^(paste|aipaste):/.test(x.key));
    const looks = [...asks.map(x => ({ icon: 'circle-help', t: x.text })),
      ...facts.filter(([k, t]) => k === 'warn' && !(pasteAsk && /past/i.test(t))).map(([, t]) => ({ icon: 'circle-alert', t }))];
    const calm = !looks.length, aiLabel = sub.ai.none ? 'None' : sub.ai.tool ? esc(sub.ai.tool) : 'Not said';
    const used = new Set(comps.flatMap(k => ['typed', 'mine', 'source', 'unlabeled', 'ai'].filter(t => k[t])));
    if (pts.some(x => x.think)) used.add('mine');
    const LEGEND = [['typed', 'Typed'], ['mine', 'Own text / Think First'], ['source', 'Cited paste'], ['unlabeled', 'Unlabeled paste'], ['ai', 'AI paste']];
    return `
    <div class="pagehead"><div class="row"><span class="avatar" style="width:52px;height:52px;font-size:18px" aria-hidden="true">${esc(initials(stu.name))}</span>
      <div><p class="eyebrow" style="margin:0">${esc(a.title)}</p><h1>${esc(stu.name)}</h1></div></div>${statusChip(sub)}</div>
    <div class="chips">${sub.submittedAt ? `<span class="chip y">Submitted ${esc(fmtWhen(sub.submittedAt))}</span>` : ''}
      ${a.due && sub.submittedAt > new Date(a.due + 'T23:59:59').getTime() ? '<span class="chip r">Late</span>' : ''}<span class="chip">${ic(RULES[a.rule].icon)} ${RULES[a.rule].label}</span></div>
    ${isDraft ? `<div class="banner note" style="margin-bottom:16px">${ic('pencil')}<span>Still working. You can decide once they submit.</span></div>` : ''}
    <section class="card sumcard" aria-labelledby="h-sum">
      <div class="sum-top">${badge(calm ? 'circle-check' : 'eye', calm ? 'green' : 'yellow', 'lg')}
        <div><h2 id="h-sum">${calm ? 'Nothing unusual in how this was made' : `${plural(looks.length, 'thing')} worth a quick look`}</h2>
        <p class="sum-sub">${passed} of ${facts.length} checks passed · Facts only, never a “% AI” score.</p></div></div>
      <div class="sum-stats">
        <div>${ic('timer')}<b>${fmtDur(activeMs(sub))}</b><span>writing time</span></div>
        <div>${ic('file-text')}<b>${draftCount(sub)}</b><span>${draftCount(sub) === 1 ? 'draft' : 'drafts'}</span></div>
        <div>${ic('book-marked')}<b>${sub.sources.length}</b><span>${sub.sources.length === 1 ? 'source' : 'sources'}</span></div>
        <div>${ic('bot')}<b>${aiLabel}</b><span>AI use</span></div>
      </div>
      ${looks.length ? `<ul class="looks">${looks.map(l => `<li>${ic(l.icon)}<span>${esc(l.t)}</span></li>`).join('')}</ul>
        <p class="tiny muted" style="margin:6px 0 0">Talking points, not proof.</p>` : ''}
      <details class="more"><summary>All checks and details ${ic('chevron-down', 'chev')}</summary>
        <div class="more-in">
          ${facts.map(([k, t]) => `<div class="fact ${k}"><span class="dot" aria-hidden="true">${ic(k === 'ok' ? 'check' : k === 'warn' ? 'circle-alert' : 'info')}</span><span>${esc(t)}</span></div>`).join('')}
          <p class="small muted" style="margin:10px 0">${plural((sub.sessions || []).length, 'writing session')} · ${plural(sub.pastes.length, 'paste')} (${sub.pastes.filter(x => x.label).length} labeled)</p>
          <button class="btn ghost sm" data-act="rvDetector" data-v="${sub.id}">Compare with a detector (mock)</button>
        </div>
      </details>
    </section>
    <div class="cols">
    <div>
      <section class="card" aria-labelledby="h-gr">
        <div class="row between"><h2 id="h-gr" class="stephead"><span class="stepn">1</span>See how it was made</h2>${pts.length ? '<span class="tiny muted">Tap a bar to read that version</span>' : ''}</div>
        ${pts.length ? `
        <div class="bars" role="group" aria-label="Words at each saved version">${pts.map((x, i) => {
          const k = comps[i];
          return `<button class="bar" data-act="rvSnap" data-v="${sub.id}:${i}" aria-pressed="${i === snapI}" aria-label="${esc(x.label)}: ${k.total} words, ${k.source + k.mine + k.ai + k.unlabeled} pasted">
            <span class="n">${k.total}</span><span class="stk" style="height:${Math.max(4, k.total / max * 100)}%">${['typed', 'mine', 'source', 'unlabeled', 'ai'].filter(t => k[t]).map(t => `<span class="k-${x.think && t === 'typed' ? 'mine' : t}" style="flex:${k[t]};min-height:3px"></span>`).join('')}</span></button>`;
        }).join('')}</div>
        <div class="barlabels" aria-hidden="true">${pts.map(x => `<span>${esc(x.label)}</span>`).join('')}</div>
        <div class="legend">${LEGEND.filter(([k]) => used.has(k)).map(([k, l]) => `<span><i class="k-${k}"></i>${l}</span>`).join('')}</div>
        <div class="snap" tabindex="0" aria-label="${esc(snap.label)} text"><p class="tiny muted" style="margin:0 0 6px;white-space:normal"><b>${esc(snap.label)}</b> · ${esc(fmtWhen(snap.at))} · ${words(snap.text)} words</p>${snap.think ? esc(snap.text) : highlightHTML(snap.text, sub.pastes)}</div>`
        : '<div class="empty small">Nothing written yet.</div>'}
        ${timelineItems(sub).length ? `<details class="more"><summary>Timeline (${timelineItems(sub).length}) ${ic('chevron-down', 'chev')}</summary><ul class="tl" style="margin-top:12px">${timelineItems(sub).map(t => `<li class="${t.cls}"><time>${esc(fmtWhen(t.at))}</time>${t.html}</li>`).join('')}</ul></details>` : ''}
        <details class="more"><summary>Sources and AI note ${ic('chevron-down', 'chev')}</summary><div class="more-in">
        ${sub.sources.length ? sub.sources.map((s, i) => `<div class="fact info"><span class="dot" aria-hidden="true">${i + 1}</span><span>${esc(s.title)}${s.link ? `<br><a class="tiny" href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">${esc(s.link)}</a>` : ''}</span></div>`).join('') : '<p class="small muted">No sources listed.</p>'}
        <hr class="divider">
        ${sub.ai.none ? '<p class="small"><b>No AI used</b> (student says)</p>' : (sub.ai.tool || sub.ai.purpose) ? `
          <dl class="small" style="margin:0">${[['Tool', sub.ai.tool], ['Used it for', sub.ai.purpose], ['Prompts', sub.ai.prompts], ['Kept or changed', sub.ai.changes]].filter(([, v]) => v).map(([k, v]) => `<dt><b>${k}</b></dt><dd style="margin:0 0 8px;white-space:pre-wrap">${esc(v)}</dd>`).join('')}</dl>` : '<p class="small muted">AI note not filled in yet.</p>'}
        </div></details>
      </section>
    </div>

    <div class="sticky">
      <section class="card" aria-labelledby="h-uc">
        <h2 id="h-uc" class="stephead"><span class="stepn">2</span>Check understanding</h2>
        ${sub.uc.questions.length ? `<p class="small muted">Questions made from ${esc(stu.name.split(' ')[0])}’s own work. Rate each answer.</p>
          ${sub.uc.questions.map((q, i) => `<div class="qa"><p class="q">${i + 1}. ${esc(q)}</p><p class="a">${esc(sub.uc.answers[i] || '(no answer yet)')}</p>
            <div class="seg" role="group" aria-label="Rate answer ${i + 1}">${[['clear', 'Understands'], ['partly', 'Partly'], ['no', 'Not yet']].map(([v, l]) => `<button data-act="rvRate" data-v="${sub.id}:${i}:${v}" aria-pressed="${sub.review.ratings[i] === v}">${l}</button>`).join('')}</div></div>`).join('')}`
          : '<p class="small muted">Not used on this task.</p>'}
        ${sub.review.followups.length ? `<h3 style="margin-top:12px">Follow-up questions</h3>${sub.review.followups.map((q, i) => `<div class="qa"><p class="q">${esc(q)}</p><p class="a">${esc(sub.review.followupAnswers[i] || '(waiting for an answer)')}</p></div>`).join('')}` : ''}
        ${sub.review.concern ? `<h3 style="margin-top:12px">Your concern</h3><p class="small" style="white-space:pre-wrap">${esc(sub.review.concern)}</p>
          ${sub.review.studentReply ? `<div class="qa"><p class="q">Student reply${sub.review.appeal ? ' · <span class="chip r">Appeal requested</span>' : ''}</p><p class="a">${esc(sub.review.studentReply)}</p></div>` : '<p class="tiny muted">No reply from the student yet.</p>'}` : ''}
      </section>

      ${isDraft ? '' : decisionCard(sub, a, rv, asks, fups)}
      ${sub.review.history.length ? `<section class="card flat"><h3>Decision history</h3><ul class="tl">${sub.review.history.map(h => `<li class="${h.decision === 'accept' ? 'g' : h.decision === 'concern' ? '' : 's'}"><time>${esc(fmtWhen(h.at))}</time>${esc({ accept: 'Accepted', followup: 'Follow-up sent', concern: 'Concern raised' }[h.decision])}${h.note ? ` · ${esc(h.note)}` : ''}</li>`).join('')}</ul></section>` : ''}
    </div>
    </div>`;
  },
  mount(p) {
    const sub = submissionById(p.sid); if (!sub) return;
    if (!REVIEW_START) REVIEW_START = Date.now();
    TIMER = { label: 'Review time', start: REVIEW_START - (sub.review.reviewMs || 0) };
    const form = $('form[data-form=decide]');
    if (form) form.addEventListener('input', () => {
      const rv = RV[sub.id], fd = new FormData(form);
      rv.score = String(fd.get('score') ?? rv.score); rv.comment = String(fd.get('comment') ?? rv.comment);
      rv.fups = fd.getAll('fups').map(String); rv.fupOwn = String(fd.get('fupOwn') ?? ''); rv.concern = String(fd.get('concern') ?? ''); rv.evidence = fd.getAll('evidence').map(String);
      const pct = $('#pctOut'); if (pct) pct.textContent = gradePreview(sub, a(sub), rv.score);
    });
    function a(s) { return assignmentById(s.assignmentId); }
  },
  leave(p, next) {
    const sub = submissionById(p.sid);
    if (sub && REVIEW_START && next !== ACTIVE?.path) { sub.review.reviewMs = (sub.review.reviewMs || 0) + (Date.now() - REVIEW_START); saveDB(); }
    REVIEW_START = 0; TIMER = null;
  }
});
function gradePreview(sub, a, score) {
  const comp = componentOf(a), pts = Number(a.points) || 1, n = Number(score);
  if (score === '' || isNaN(n)) return comp ? `Goes to ${comp.name} (${comp.weight}%)` : '';
  return `${Math.round(clamp(n, 0, pts) / pts * 100)}%${comp ? ` · goes to ${comp.name} (${comp.weight}%)` : ''}`;
}
function decisionCard(sub, a, rv, asks, fups) {
  const d = rv.decision;
  return `
  <form class="card" data-form="decide" data-sid="${sub.id}" aria-labelledby="h-dc" novalidate>
    <h2 id="h-dc" class="stephead"><span class="stepn">3</span>Decide</h2>
    <div class="optgrid" role="radiogroup" aria-labelledby="h-dc">${[['accept', 'circle-check', 'Accept', 'green'], ['followup', 'message-circle', 'Follow up', 'blue'], ['concern', 'flag', 'Concern', 'red']]
      .map(([v, icn, l, tone]) => `<button type="button" class="opt" role="radio" aria-checked="${d === v}" data-act="rvDecision" data-v="${sub.id}:${v}" style="align-items:center">${badge(icn, tone, 'ico')}<b>${l}</b></button>`).join('')}</div>
    ${d === 'followup' ? '<p class="tiny muted" style="margin:8px 0 0">Grade waits for their answer.</p>' : d === 'concern' ? '<p class="tiny muted" style="margin:8px 0 0">They can reply or appeal.</p>' : ''}
    ${d === 'accept' ? `<div style="margin-top:12px">
      <label class="field">Score / ${esc(a.points)}<input type="number" name="score" min="0" max="${esc(a.points)}" step="0.5" inputmode="decimal" value="${esc(rv.score)}"></label>
      <p class="tiny muted" id="pctOut">${esc(gradePreview(sub, a, rv.score))}</p>
      <label class="field">Comment <span class="hint">Optional</span><textarea name="comment" rows="3" maxlength="1000">${esc(rv.comment)}</textarea></label></div>` : ''}
    ${d === 'followup' ? `<fieldset style="margin-top:12px"><legend>Questions to send</legend>
      ${fups.map((q, i) => `<label class="check"><input type="checkbox" name="fups" value="${esc(q)}" ${rv.fups.includes(q) ? 'checked' : ''}> ${esc(q)}</label>`).join('')}
      <label class="field" style="margin-top:8px">Or write your own<input type="text" name="fupOwn" maxlength="300" value="${esc(rv.fupOwn)}"></label></fieldset>` : ''}
    ${d === 'concern' ? `<fieldset style="margin-top:12px"><legend>Attach evidence</legend>
      ${asks.length ? asks.map(x => `<label class="check"><input type="checkbox" name="evidence" value="${esc(x.text)}" ${rv.evidence.includes(x.text) ? 'checked' : ''}> ${esc(x.text)}</label>`).join('') : '<p class="small muted">Nothing flagged. Describe what you saw.</p>'}
      <label class="field" style="margin-top:8px">Your concern<textarea name="concern" rows="4" maxlength="1500" placeholder="What you saw in the process, not a guess about AI.">${esc(rv.concern)}</textarea></label></fieldset>` : ''}
    <p class="err" id="dcErr" role="alert"></p>
    <button class="btn coral lg block" style="margin-top:12px" ${d ? '' : 'disabled'}>Record decision</button>
  </form>`;
}
Object.assign(ACT, {
  rvSnap: v => { const [sid, i] = v.split(':'); RV[sid].snap = Number(i); refresh(); },
  rvRate: v => { const [sid, i, r] = v.split(':'); const sub = submissionById(sid); if (sub.review.ratings[i] === r) delete sub.review.ratings[i]; else sub.review.ratings[i] = r; touch(sub); saveDB(); refresh(); },
  rvDecision: v => { const [sid, d] = v.split(':'); RV[sid].decision = d; refresh(); },
  rvDetector: sid => openDialog(detectorHTML(submissionById(sid)), { wide: true })
});
FORM.decide = (fd, form) => {
  const sub = submissionById(form.dataset.sid), a = assignmentById(sub.assignmentId), rv = RV[sub.id], err = $('#dcErr');
  const now = Date.now(), elapsed = (sub.review.reviewMs || 0) + (REVIEW_START ? now - REVIEW_START : 0);
  let note = '';
  if (rv.decision === 'accept') {
    const n = Number(fd.get('score'));
    if (fd.get('score') === '' || isNaN(n) || n < 0 || n > Number(a.points)) { err.textContent = `Enter a score from 0 to ${a.points}.`; form.score.focus(); return; }
    Object.assign(sub.review, { decision: 'accept', score: String(n), comment: String(fd.get('comment') || '').trim() });
    sub.status = 'accepted'; note = `${n}/${a.points}`;
  } else if (rv.decision === 'followup') {
    const qs = fd.getAll('fups').map(String); const own = String(fd.get('fupOwn') || '').trim(); if (own) qs.push(own);
    if (!qs.length) { err.textContent = 'Pick or write at least one question.'; return; }
    Object.assign(sub.review, { decision: 'followup', followups: qs, followupAnswers: [] }); sub.status = 'followup'; note = plural(qs.length, 'question');
  } else if (rv.decision === 'concern') {
    const text = String(fd.get('concern') || '').trim(), ev = fd.getAll('evidence').map(String);
    if (words(text) < 5) { err.textContent = 'Explain your concern in at least one full sentence.'; form.concern.focus(); return; }
    Object.assign(sub.review, { decision: 'concern', concern: text, evidence: ev, studentReply: '', appeal: false }); sub.status = 'concern'; note = plural(ev.length, 'piece') + ' of evidence';
  } else return;
  sub.review.history.push({ at: now, decision: rv.decision, note, reviewMs: elapsed });
  if (!sub.review.firstDecisionMs) sub.review.firstDecisionMs = elapsed;
  sub.review.reviewMs = elapsed; REVIEW_START = now;
  touch(sub); saveDB(); delete RV[sub.id];
  openDialog(`<div class="center">${badge({ accept: 'circle-check', followup: 'message-circle', concern: 'flag' }[sub.review.decision], { accept: 'green', followup: 'blue', concern: 'red' }[sub.review.decision], 'big')}
    <h2>${esc({ accept: 'Accepted', followup: 'Follow-up sent', concern: 'Concern raised' }[sub.review.decision])}</h2>
    <p class="small muted">${esc(note)} · reviewed in <b>${fmtDur(elapsed)}</b></p></div>
    <div class="btnrow"><button class="btn ghost" data-act="closeDlg">Stay</button><button class="btn coral" data-act="nextReview" data-v="${a.id}">Next ${ic('arrow-right')}</button></div>`);
  refresh();
};
ACT.nextReview = aid => {
  closeDialog();
  const next = subsForAssignment(aid).find(s => NEEDS_TEACHER.includes(s.status)) || DB.submissions.find(s => NEEDS_TEACHER.includes(s.status));
  if (next) go(`teacher/review/${next.id}`); else { toast('All caught up. Nothing else to review.'); go(`teacher/assign/${aid}`); }
};

/** A clearly fictional "AI detector" report, for side-by-side comparison testing only. */
function detectorHTML(sub) {
  let h = 0; for (const ch of sub.text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pct = 35 + (h % 55), sentences = (sub.text.match(/[^.!?\n]+[.!?]/g) || []).map(s => s.trim());
  const flagged = new Set(sentences.filter((_, i) => ((h >> (i % 24)) & 3) === 0).slice(0, 4));
  const comp = composition(sub.text, sub.pastes);
  return `<div class="det">
    <p class="eyebrow" style="color:#555">Mock report · fictional · for comparison testing only</p>
    <h2>AI Detection Report</h2>
    <div class="row" style="margin:6px 0 10px"><span class="gauge">${pct}%</span><span class="small"><b>${pct >= 60 ? 'Likely AI-generated' : 'Possibly AI-generated'}</b><br>Confidence: medium</span></div>
    <div class="snap" style="max-height:200px">${sentences.slice(0, 12).map(s => flagged.has(s) ? `<mark>${esc(s)}</mark>` : esc(s)).join(' ') || '(no text)'}</div>
    <p class="small" style="margin-top:10px">Highlighted sentences “resemble AI writing.” No reasons, drafts, or sources are shown.</p>
    <div class="card cream flat small" style="margin:10px 0"><b>The Process View for the same work:</b> ${comp.typed} of ${comp.total} words typed inside Muna across ${plural((sub.sessions || []).length, 'session')} (${fmtDur(activeMs(sub))} active), ${plural(draftCount(sub), 'saved draft')}, ${plural(sub.pastes.length, 'paste')} (${sub.pastes.filter(p => p.label).length} labeled), and ${plural(sub.uc.answers.filter(Boolean).length, 'Understanding Check answer')}.</div>
    <p class="tiny" style="color:#555">The score above is made up from the text, so testers can compare. It does not come from any real detector and means nothing.</p>
    <button class="btn block" data-act="closeDlg">Close</button></div>`;
}

/* ================================================================ host an Evidence Game round */
addRoute('teacher/game/:gid', {
  role: 'teacher', wide: true,
  crumbs: p => { const g = gameById(p.gid), c = g && classById(g.classId); return tCrumb(classCrumb(c), c ? `<a href="#/teacher/class/${c.id}/games">Evidence Games</a>` : ''); },
  render(p) {
    const g = gameById(p.gid); if (!g) return notFound('Game round');
    const sc = scenarioById(g.scenarioId), c = classById(g.classId), done = g.plays.filter(x => x.verdict);
    const dist = Object.fromEntries(Object.keys(VERDICTS).map(k => [k, done.filter(x => x.verdict === k).length]));
    const stepUse = STEP_KEYS.map(st => st === 'Govern' ? done.length : done.filter(pl => pl.opened.some(id => (sc.cards.find(cd => cd.id === id) || {}).step === st)).length);
    const avg = done.length ? Math.round(done.reduce((s, x) => s + scoreGamePlay(sc, x).total, 0) / done.length) : 0;
    return `
    <div class="row between wrap"><div><p class="eyebrow">Evidence Game · ${esc(c.name)}</p><h1>${esc(sc.title)}</h1></div>
      <div class="center">${g.open ? `<span class="tiny muted">Room code</span><br><span class="bigcode">${esc(g.code)}</span>` : '<span class="chip n">Round closed</span>'}</div></div>
    <div class="claim"><p class="eyebrow">The claim</p><p class="text" lang="${esc(sc.claimLang)}">${esc(sc.claim)}</p>${sc.claimLang !== 'en' ? `<p class="small" style="margin:6px 0 0;opacity:.85">${esc(sc.claimEn)}</p>` : `<p class="small" style="margin:6px 0 0;opacity:.85">${esc(sc.claimEn)}</p>`}</div>
    <div class="cols">
      <div>
        <section class="card" aria-labelledby="h-res"><div class="row between"><h2 id="h-res">Class results</h2><button class="btn ghost sm" data-act="refreshGame">Refresh</button></div>
          <p class="small muted">${plural(done.length, 'student')} answered${g.plays.length > done.length ? ` · ${g.plays.length - done.length} playing` : ''}${done.length ? ` · avg ${avg}/100` : ''}</p>
          ${Object.entries(VERDICTS).map(([k, v]) => `<div class="vbar"><span class="lbl">${vIcon(k, 'sm')} ${v.label}</span><span class="track"><span class="fill" style="width:${done.length ? dist[k] / done.length * 100 : 0}%"></span></span><b>${dist[k]}</b></div>`).join('')}
          <h3 style="margin-top:16px">T.A.N.O.N.G. steps used</h3>
          ${STEP_KEYS.map((st, i) => `<div class="vbar"><span class="lbl">${TANONG[i][0]} · ${st}</span><span class="track"><span class="fill" style="background:var(--yellow);width:${done.length ? stepUse[i] / done.length * 100 : 0}%"></span></span><b>${stepUse[i]}</b></div>`).join('')}
        </section>
        <section class="card" aria-labelledby="h-pl"><h2 id="h-pl">Answers</h2>
          ${done.length ? `<div class="tablewrap"><table><thead><tr><th scope="col">Student</th><th scope="col">Verdict</th><th scope="col">Best evidence</th><th scope="col" class="num">Points</th></tr></thead><tbody>
            ${done.map(pl => { const st = studentById(pl.studentId); const best = sc.cards.find(x => x.id === pl.best); return `<tr><th scope="row">${esc(st ? st.name : 'Student')}</th><td>${vIcon(pl.verdict, 'sm')} ${VERDICTS[pl.verdict].label}</td><td>${esc(best ? best.title : '–')}</td><td class="num">${scoreGamePlay(sc, pl).total}</td></tr>${pl.why ? `<tr><td colspan="4" class="tiny muted" style="white-space:normal">“${esc(pl.why)}”</td></tr>` : ''}`; }).join('')}
          </tbody></table></div>` : `<div class="empty small">Waiting for answers. Room code <b>${esc(g.code)}</b></div>`}
        </section>
      </div>
      <div class="sticky">
        <section class="card cream"><details><summary><b>Answer key</b> <span class="tiny muted">(tap to show)</span></summary><div style="margin-top:10px"><p class="small"><b>${vIcon(sc.answer, 'sm')} ${VERDICTS[sc.answer].label}.</b> ${esc(sc.explain)}</p>
          <p class="small"><b>Strongest cards:</b> ${sc.best.map(id => esc(sc.cards.find(x => x.id === id).title)).join(', ')}</p></div></details></section>
        <section class="card"><h2>Discuss</h2><p class="small">${esc(sc.discuss)}</p></section>
        ${g.open ? `<button class="btn danger block" data-act="closeGame" data-v="${g.id}">Close round</button>` : `<button class="btn ghost block" data-act="reopenGame" data-v="${g.id}">Reopen round</button>`}
      </div>
    </div>`;
  }
});
Object.assign(ACT, {
  refreshGame: () => { loadDB(); refresh(); },
  closeGame: gid => { const g = gameById(gid); g.open = false; touch(g); saveDB(); refresh(); },
  reopenGame: gid => { const g = gameById(gid); g.open = true; if (DB.games.some(x => x !== g && x.open && x.code === g.code)) g.code = makeGameCode(); touch(g); saveDB(); refresh(); }
});
