/* Muna prototype · Evidence Game (student side)
   Inspect evidence cards (each practices a T.A.N.O.N.G. step), pick a verdict and the strongest card,
   then see the explanation. Points reward reasoning, not speed. */
'use strict';

function myPlay(g) {
  const sid = DB.session.studentId;
  let p = g.plays.find(x => x.studentId === sid);
  if (!p) { p = { studentId: sid, opened: [], verdict: '', best: '', why: '', points: 0, at: 0 }; g.plays.push(p); touch(g); saveDB(); }
  return p;
}

addRoute('student/game/:gid/:stage?', {
  role: 'student',

  render(p) {
    const g = gameById(p.gid), me = currentStudent();
    if (!g || !me.classIds.includes(g.classId)) return sNotFound('Game round');
    const sc = scenarioById(g.scenarioId), play = myPlay(g);
    const stage = play.verdict ? 'result' : p.stage === 'verdict' && play.opened.length >= 3 ? 'verdict' : 'play';
    if (!g.open && !play.verdict) return `<div class="empty"><p><b>This round is closed.</b></p><a class="btn" href="#/student">Back</a></div>`;
    const claim = `<div class="claim"><p class="eyebrow">The claim · Room ${esc(g.code)}</p><p class="text" lang="${esc(sc.claimLang)}">${esc(sc.claim)}</p>
      <p class="small" style="margin:6px 0 0;opacity:.85">${esc(sc.claimEn)}</p><p class="tiny" style="margin:6px 0 0;opacity:.7">${esc(sc.from)}</p></div>`;

    if (stage === 'play') return `
      <p class="eyebrow">Evidence Game · ${esc(sc.title)}</p>
      <h1>Inspect the evidence</h1>
      ${claim}
      <p class="small muted">Open 3 or more cards. No rush.</p>
      <div class="ecards">${sc.cards.map((c, i) => `<button class="ecard c${i % 6}" data-act="gmOpen" data-v="${g.id}:${c.id}">
        <span class="t">${esc(c.type)}</span><b>${esc(c.title)}</b><span class="seen">${play.opened.includes(c.id) ? `✓ Inspected · ${esc(c.step)}` : 'Tap to inspect'}</span></button>`).join('')}</div>
      <p class="small center" aria-live="polite"><b>${play.opened.length}</b> of ${sc.cards.length} inspected</p>
      <a class="btn coral lg block" href="#/student/game/${g.id}/verdict" ${play.opened.length >= 3 ? '' : 'aria-disabled="true" tabindex="-1" style="pointer-events:none"'} id="toVerdict">Make your verdict</a>
      ${sc.practice ? '<p class="tiny muted center" style="margin-top:10px">Practice scenario · made up for class</p>' : ''}`;

    if (stage === 'verdict') return `
      <p class="eyebrow">Evidence Game · ${esc(sc.title)}</p>
      <h1>Your verdict</h1>${claim}
      <form data-form="gmVerdict" data-gid="${g.id}" novalidate>
        <fieldset><legend>Is the claim…</legend>${Object.entries(VERDICTS).map(([k, v]) => `<label class="opt"><input type="radio" name="verdict" value="${k}" ${play.verdict === k ? 'checked' : ''}><span class="ico" aria-hidden="true">${v.icon}</span><span><b>${v.label}</b><small>${v.desc}</small></span></label>`).join('')}</fieldset>
        <fieldset><legend>Best evidence</legend>${sc.cards.filter(c => play.opened.includes(c.id)).map(c => `<label class="opt"><input type="radio" name="best" value="${c.id}"><span><b>${esc(c.title)}</b><small>${esc(c.type)} · ${esc(c.step)}</small></span></label>`).join('')}</fieldset>
        <label class="field">Why? <span class="hint">One sentence</span><input type="text" name="why" maxlength="240"></label>
        <p class="err" id="gvErr" role="alert"></p>
        <div class="btnrow"><a class="btn ghost lg" href="#/student/game/${g.id}" style="flex:0 1 auto">← Cards</a><button class="btn coral lg">Lock in</button></div>
      </form>`;

    const s = scoreGamePlay(sc, play), right = play.verdict === sc.answer;
    const steps = new Set(play.opened.map(id => (sc.cards.find(c => c.id === id) || {}).step)); steps.add('Govern');
    const done = g.plays.filter(x => x.verdict), dist = Object.fromEntries(Object.keys(VERDICTS).map(k => [k, done.filter(x => x.verdict === k).length]));
    return `
      ${muni(right ? 'Nice investigating! You checked before you believed.' : 'Good try! Let’s look at what the evidence shows.')}
      <h1>${right ? `You got it: ${VERDICTS[sc.answer].label}` : `The answer: ${VERDICTS[sc.answer].label}`}</h1>
      <div class="card center"><span class="score">${s.total}</span><span class="small"> / 100 points</span>
        <p class="tiny muted" style="margin:6px 0 0">Verdict +${s.verdictPts} · Best evidence +${s.bestPts} · Cards inspected +${s.cardPts}</p></div>
      <div class="card"><h2>Why</h2><p class="small">${esc(sc.explain)}</p>
        ${!sc.best.includes(play.best) ? `<p class="small muted">Stronger evidence: ${sc.best.map(id => esc(sc.cards.find(c => c.id === id).title)).join(', ')}.</p>` : ''}</div>
      <div class="card"><h2>T.A.N.O.N.G. steps you used</h2>
        <div class="tanong">${TANONG.map(([l, n]) => `<span class="${steps.has(n) ? 'on' : ''}" title="${n}"><span aria-hidden="true">${l}</span><span class="sr-only">${n}${steps.has(n) ? ' used' : ' not used'}</span></span>`).join('')}</div>
        <p class="tiny muted" style="margin:6px 0 0">Govern = making your final verdict.</p></div>
      <div class="card"><h2>Class so far</h2>${Object.entries(VERDICTS).map(([k, v]) => `<div class="vbar"><span class="lbl">${v.label}</span><span class="track"><span class="fill" style="width:${done.length ? dist[k] / done.length * 100 : 0}%"></span></span><b>${dist[k]}</b></div>`).join('')}
        <p class="tiny muted" style="margin:6px 0 0">${plural(done.length, 'answer')} on this device.</p></div>
      <div class="card blush small"><b>Talk about it:</b> ${esc(sc.discuss)}</div>
      <div class="btnrow"><a class="btn" href="#/student">Done</a>${g.open ? `<button class="btn ghost" data-act="gmReplay" data-v="${g.id}">Play again</button>` : ''}</div>`;
  }
});
function cardDialog(sc, c) {
  const i = sc.cards.indexOf(c), step = TANONG.find(t => t[1] === c.step);
  return `<p class="eyebrow">${esc(c.type)}</p><h2>${esc(c.title)}</h2>
    <div class="ecard c${i % 6}" style="cursor:default;min-height:0;margin-bottom:12px"><span>${esc(c.body)}</span></div>
    <h3>What you notice</h3>${c.facts.map(f => `<div class="fact info"><span class="dot" aria-hidden="true">•</span><span>${esc(f)}</span></div>`).join('')}
    <div class="banner required" style="margin:12px 0"><b>${esc(step[0])} · ${esc(c.step)}</b>&nbsp;${esc(step[2])}</div>
    <button class="btn block" data-act="closeDlg">Done inspecting</button>`;
}
Object.assign(ACT, {
  gmOpen: v => {
    const [gid, cid] = v.split(':'), g = gameById(gid), sc = scenarioById(g.scenarioId), play = myPlay(g);
    if (!play.opened.includes(cid)) { play.opened.push(cid); touch(g); saveDB(); }
    refresh(); openDialog(cardDialog(sc, sc.cards.find(c => c.id === cid)));
  },
  gmReplay: gid => { const g = gameById(gid); g.plays = g.plays.filter(p => p.studentId !== DB.session.studentId); touch(g); saveDB(); go(`student/game/${gid}`); }
});
FORM.gmVerdict = (fd, form) => {
  const g = gameById(form.dataset.gid), sc = scenarioById(g.scenarioId), play = myPlay(g);
  const verdict = String(fd.get('verdict') || ''), best = String(fd.get('best') || '');
  if (!verdict || !best) { $('#gvErr').textContent = 'Pick a verdict and the card that best supports it.'; return; }
  Object.assign(play, { verdict, best, why: String(fd.get('why') || '').trim(), at: Date.now() });
  play.points = scoreGamePlay(sc, play).total; touch(g); saveDB(); go(`student/game/${g.id}/result`);
};
