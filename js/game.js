/* Muna prototype · Evidence Game (student side), lesson style.
   Flow: first feeling → one evidence card at a time (find the clues, then say what the card tells you, then check)
   → verdict → strongest card → one-sentence reason → results.
   Points still come from scoreGamePlay() so the teacher view is unchanged: they reward reasoning, not speed.
   Card checks give instant feedback and a streak, but do not change points. */
'use strict';

const LEANS = {
  for: { label: 'Backs up the claim', icon: 'thumbs-up', tone: 'green' },
  against: { label: 'Goes against the claim', icon: 'thumbs-down', tone: 'red' },
  weak: { label: 'Not real proof', icon: 'ban', tone: 'gray' },
  context: { label: 'Adds context', icon: 'lightbulb', tone: 'yellow' }
};
const GUTS = {
  believe: { label: 'I believe it', icon: 'laugh', tone: 'yellow' },
  unsure: { label: 'Not sure yet', icon: 'meh', tone: 'blue' },
  doubt: { label: 'I doubt it', icon: 'annoyed', tone: 'purple' }
};
const HOWTO = [['search', 'blue', 'Find the clues'], ['list-checks', 'green', 'Check each card'], ['shield-check', 'orange', 'Make your verdict']];
const STARTERS = ['The official source says', 'The date shows', 'There is no proof that', 'It was taken out of context because', 'More than one source agrees that'];
const CHEERS = ['Nice work!', 'Sharp eyes!', 'You got it!', 'Great checking!', 'Detective mode!'];
const VCOLOR = { supported: 'var(--d-green)', unverified: 'var(--d-blue)', misleading: 'var(--d-orange)' };

/* Screen-only state: which clues are flipped and which tile is picked. Reset when the screen changes. */
const GM = { key: '', pick: '', revealed: new Set(), enter: true, pct: 0 };
function gmFresh(key, pick) {
  if (GM.key !== key) Object.assign(GM, { key, pick: pick || '', revealed: new Set(), enter: true });
  else GM.enter = false;
}
const leanOk = (c, k) => (c.lean || []).includes(k);
const gmPath = (g, s = '') => `student/game/${g.id}${s ? '/' + s : ''}`;
const gmRedirect = path => { location.replace('#/' + path); return null; };

function myPlay(g) {
  const sid = DB.session.studentId;
  let p = g.plays.find(x => x.studentId === sid);
  if (!p) { p = { studentId: sid, opened: [], verdict: '', best: '', why: '', points: 0, at: 0 }; g.plays.push(p); touch(g); saveDB(); }
  p.checks = p.checks || {}; p.draft = p.draft || {};
  return p;
}
/** Correct card checks in a row, counting back from the latest one. */
function gmStreak(sc, play) {
  let n = 0;
  for (const id of [...play.opened].reverse()) {
    const c = sc.cards.find(x => x.id === id), k = play.checks[id];
    if (!c || !k || !leanOk(c, k)) break;
    n++;
  }
  return n;
}

/* ---------------------------------------------------------------- shared pieces */
const muniSay = (msg, cls = '') => `<div class="msay ${cls}"><img src="assets/muni.svg" alt=""><p class="sb">${msg}</p></div>`;
const kbd = i => `<kbd aria-hidden="true">${i + 1}</kbd>`;
const radioTile = (k, i, checked, inner, cls = '', disabled = false) =>
  `<button type="button" class="dtile ${cls}" role="radio" aria-checked="${checked}" data-act="gmPick" data-v="${esc(k)}" ${disabled ? 'disabled' : ''}>${inner}${disabled ? '' : kbd(i)}</button>`;

function lsn(sc, play, pos, body, foot) {
  const total = sc.cards.length + 4, pct = Math.round(Math.min(pos, total) / total * 100), streak = gmStreak(sc, play);
  return `<div class="lsn">
    <header class="lsn-top">
      <a class="lsn-x" href="#/student" aria-label="Leave the game. Your progress is saved.">${GI.x}</a>
      <div class="lsn-prog" role="progressbar" aria-label="Game progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${GM.pct}%" data-to="${pct}"></span></div>
      <span class="lsn-streak ${streak ? 'on' : ''}" title="${plural(streak, 'correct check')} in a row">${GI.flame}<b>${streak}</b><span class="sr-only"> correct checks in a row</span></span>
      ${themeButton()}
    </header>
    <div class="lsn-body ${GM.enter ? 'enter' : ''}">${body}</div>
    <footer class="lsn-foot ${foot.cls || ''}" id="lsnFoot"><div class="lsn-foot-in">${foot.html}</div></footer>
  </div>`;
}

/* ---------------------------------------------------------------- screens */
function gmIntro(g, sc, play) {
  gmFresh(`${g.id}:intro`, play.gut);
  const body = `
    ${muniSay('A new message just landed in your group chat. Let’s check it <b>before</b> we believe it!')}
    <ol class="howto" aria-label="How to play">${HOWTO.map(([icn, tone, t], i) => `<li>${badge(icn, tone)}<span><small>Step ${i + 1}</small>${t}</span></li>`).join('')}</ol>
    <div class="phonechat">
      <div class="pc-h">${av('G10', '#7C5CFC')}<div><b>Class group chat</b><small>${esc(sc.from)}</small></div></div>
      <div class="pc-body"><div class="pc-msg">
        <span class="fwd">${GI.forward} Forwarded many times</span>
        <p class="claimtxt" lang="${esc(sc.claimLang)}">${esc(sc.claim)}</p>
        ${sc.claimLang !== 'en'
          ? `<button type="button" class="linkbtn" data-act="gmTranslate" aria-expanded="false" aria-controls="trEn">Show in English</button><p class="tr-en" id="trEn" hidden>${esc(sc.claimEn)}</p>`
          : `<p class="tr-en">${esc(sc.claimEn)}</p>`}
        <span class="pc-react" aria-hidden="true">${GI.heart} 12 <span class="dotsep">·</span> ${GI.repeat} 31</span>
      </div></div>
    </div>
    <h1 class="lsn-q">What’s your first feeling?</h1>
    <p class="lsn-sub">There is no wrong answer here. We’ll compare it with your verdict at the end.</p>
    <div class="dgrid3" role="radiogroup" aria-label="First feeling">${Object.entries(GUTS).map(([k, x], i) =>
      radioTile(k, i, GM.pick === k, `${badge(x.icon, x.tone, 'lg')}<b>${x.label}</b>`, 'gut')).join('')}</div>
    ${sc.practice ? '<p class="tiny muted center" style="margin-top:18px">Practice scenario · made up for class</p>' : ''}`;
  return lsn(sc, play, 0, body, { html: `<span class="foot-note">${plural(sc.cards.length, 'evidence card')} to inspect</span>
    <button class="dbtn" id="gmMain" data-act="gmGut" data-v="${g.id}" ${GM.pick ? '' : 'disabled'}>Start investigating ${GI.arrow}</button>` });
}

function gmCard(g, sc, play, i) {
  const c = sc.cards[i], step = TANONG.find(t => t[1] === c.step), n = sc.cards.length;
  const answered = play.checks[c.id];
  gmFresh(`${g.id}:card:${c.id}`, answered);
  if (answered) c.facts.forEach((_, j) => GM.revealed.add(j));
  const open = GM.revealed.size >= c.facts.length, next = i + 1 < n ? `card/${i + 1}` : 'verdict';
  const tileCls = k => !answered ? '' : k === answered ? (leanOk(c, k) ? 'ok' : 'bad') : leanOk(c, k) ? 'ans' : '';
  const body = `
    <div class="stepchip"><span class="lt" aria-hidden="true">${esc(step[0])}</span><span><b>${esc(step[1])}</b> · ${esc(step[2])}</span></div>
    <p class="eyebrow">Card ${i + 1} of ${n} · ${esc(c.type)}</p>
    <h1 class="lsn-q">${esc(c.title)}</h1>
    ${gmArt(sc, c)}
    ${i === 0 && !answered ? muniSay('Look closely at the card, then tap each <b>blue clue</b> to flip it over.', 'sm') : ''}
    <section class="clues" aria-labelledby="h-clues">
      <h2 id="h-clues">Find the clues <span class="cnt" id="clueCnt">${GM.revealed.size}/${c.facts.length}</span></h2>
      <div class="cluegrid">${c.facts.map((f, j) => { const on = GM.revealed.has(j); return `
        <button type="button" class="clue ${on ? 'on' : ''}" data-act="gmClue" data-v="${j}" aria-label="${on ? `Clue ${j + 1}: ${esc(f)}` : `Reveal clue ${j + 1}`}">
          <span class="clue-in"><span class="front" aria-hidden="true">${GI.search}<b>Clue ${j + 1}</b><small>Tap to reveal</small></span>
          <span class="back" aria-hidden="true">${GI.bulb}<span>${esc(f)}</span></span></span></button>`; }).join('')}</div>
    </section>
    <section class="qbox ${open ? '' : 'locked'}" id="qbox" aria-labelledby="h-q">
      <h2 id="h-q">What does this card tell you about the claim?</h2>
      <p class="lockmsg" id="lockMsg" ${open ? 'hidden' : ''}>${GI.lock} Find all the clues to unlock</p>
      <div class="dgrid2" role="radiogroup" aria-labelledby="h-q">${Object.entries(LEANS).map(([k, l], j) =>
        radioTile(k, j, GM.pick === k, `${badge(l.icon, l.tone)}<b>${l.label}</b>`, tileCls(k), !open || !!answered)).join('')}</div>
    </section>`;
  let foot;
  if (answered) {
    const ok = leanOk(c, answered), best = (c.lean || []).map(k => LEANS[k].label).join(' or ');
    foot = { cls: ok ? 'ok' : 'bad', html: `<div class="fb" role="status"><span class="fb-ic">${ok ? GI.check : GI.x}</span><div>
        <b class="fb-t">${ok ? CHEERS[i % CHEERS.length] : 'Not quite, but good thinking'}</b>${ok ? '' : `<p><b>Better answer:</b> ${esc(best)}</p>`}<p>${esc(c.tip)}</p></div></div>
      <a class="dbtn ${ok ? '' : 'red'}" id="gmMain" href="#/${gmPath(g, next)}">Continue</a>` };
  } else {
    foot = { html: `${play.opened.length >= 3 ? `<a class="dbtn ghost" href="#/${gmPath(g, 'verdict')}">Skip to verdict</a>` : `<span class="foot-note">${play.opened.length} of ${n} inspected · 3 needed</span>`}
      <button class="dbtn" id="gmMain" data-act="gmCheck" data-v="${g.id}:${c.id}" ${open && GM.pick ? '' : 'disabled'}>Check</button>` };
  }
  return lsn(sc, play, 1 + i, body, foot);
}

function gmNotes(g, sc, play) {
  const seen = sc.cards.filter(c => play.opened.includes(c.id));
  return `<details class="notes"><summary>${GI.search} Review your clues (${seen.length})</summary>
    ${seen.map(c => { const k = play.checks[c.id]; return `<button type="button" class="crow" data-act="gmPeek" data-v="${g.id}:${c.id}">${kindIcon(c.kind)}
      <span class="grow"><b>${esc(c.title)}</b><small>${k ? `You said: ${esc(LEANS[k].label)}` : 'Inspected'}</small></span>
      <span class="mark ${!k ? 'n' : leanOk(c, k) ? 'ok' : 'bad'}" aria-label="${!k ? '' : leanOk(c, k) ? 'correct' : 'not quite'}">${!k ? '' : leanOk(c, k) ? GI.check : GI.x}</span></button>`; }).join('')}</details>`;
}

function gmVerdict(g, sc, play) {
  gmFresh(`${g.id}:verdict`, play.draft.verdict);
  const n = sc.cards.length, left = sc.cards.findIndex(c => !play.opened.includes(c.id));
  const body = `
    <p class="eyebrow">You inspected ${play.opened.length} of ${n} cards</p>
    <h1 class="lsn-q">What’s your verdict?</h1>
    <p class="claimmini" lang="${esc(sc.claimLang)}">${esc(sc.claim)}</p>
    <div class="vtiles" role="radiogroup" aria-label="Verdict">${Object.entries(VERDICTS).map(([k, v], i) =>
      radioTile(k, i, GM.pick === k, `${vIcon(k, 'lg')}<span class="grow"><b>${v.label}</b><small>${v.desc}</small></span>`, 'vt')).join('')}</div>
    ${gmNotes(g, sc, play)}`;
  return lsn(sc, play, n + 1, body, { html: `${left >= 0 ? `<a class="dbtn ghost" href="#/${gmPath(g, 'card/' + left)}">Inspect more</a>` : '<span></span>'}
    <button class="dbtn" id="gmMain" data-act="gmDraft" data-v="${g.id}:verdict" ${GM.pick ? '' : 'disabled'}>Continue</button>` });
}

function gmBest(g, sc, play) {
  gmFresh(`${g.id}:best`, play.draft.best);
  const seen = sc.cards.filter(c => play.opened.includes(c.id)), v = VERDICTS[play.draft.verdict];
  const body = `
    <p class="eyebrow">Your verdict: ${esc(v.label)}</p>
    <h1 class="lsn-q">Which card is your strongest proof?</h1>
    <p class="lsn-sub">Pick the one card that best supports <b>${esc(v.label)}</b>.</p>
    <div class="bgrid" role="radiogroup" aria-label="Strongest evidence">${seen.map((c, i) =>
      radioTile(c.id, i, GM.pick === c.id, `${kindIcon(c.kind)}<span class="grow"><b>${esc(c.title)}</b><small>${esc(c.type)} · ${esc(c.step)}</small></span>`, 'bt')).join('')}</div>
    ${gmNotes(g, sc, play)}`;
  return lsn(sc, play, sc.cards.length + 2, body, { html: `<a class="dbtn ghost" href="#/${gmPath(g, 'verdict')}">Back</a>
    <button class="dbtn" id="gmMain" data-act="gmDraft" data-v="${g.id}:best" ${GM.pick ? '' : 'disabled'}>Continue</button>` });
}

function gmWhy(g, sc, play) {
  gmFresh(`${g.id}:why`, '');
  const v = VERDICTS[play.draft.verdict], c = sc.cards.find(x => x.id === play.draft.best);
  const body = `
    <p class="eyebrow">Last step</p>
    <h1 class="lsn-q">Why? Say it in one sentence.</h1>
    <div class="sumrow"><span>${vIcon(play.draft.verdict, 'sm')}${esc(v.label)}</span><span>${kindIcon(c.kind)}${esc(c.title)}</span></div>
    <p class="lsn-sub">Tap a starter or write your own.</p>
    <div class="wb">${STARTERS.map(s => `<button type="button" class="wchip" data-act="gmStarter" data-v="${esc(s)}">${esc(s)}…</button>`).join('')}</div>
    <label class="sr-only" for="gmWhy">Your reason</label>
    <textarea id="gmWhy" class="dta" maxlength="240" placeholder="The official page says classes continue, so…" data-gid="${g.id}">${esc(play.draft.why || '')}</textarea>
    <p class="tiny muted" style="text-align:right;margin-top:4px"><span id="whyCnt">${(play.draft.why || '').length}</span>/240</p>`;
  return lsn(sc, play, sc.cards.length + 3, body, { html: `<a class="dbtn ghost" href="#/${gmPath(g, 'best')}">Back</a>
    <button class="dbtn" id="gmMain" data-act="gmLock" data-v="${g.id}">${GI.lock} Lock in my verdict</button>` });
}

function gmResult(g, sc, play) {
  gmFresh(`${g.id}:result`, '');
  const s = scoreGamePlay(sc, play), right = play.verdict === sc.answer, bestOk = sc.best.includes(play.best);
  const seen = sc.cards.filter(c => play.opened.includes(c.id)), checked = seen.filter(c => play.checks[c.id]);
  const good = checked.filter(c => leanOk(c, play.checks[c.id])).length;
  const steps = new Set(seen.map(c => c.step)); steps.add('Govern');
  const done = g.plays.filter(x => x.verdict), dist = Object.fromEntries(Object.keys(VERDICTS).map(k => [k, done.filter(x => x.verdict === k).length]));
  const gut = GUTS[play.gut], bestCard = sc.cards.find(c => c.id === play.best);
  const confetti = right ? `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) =>
    `<i style="--x:${(i * 37) % 100}%;--d:${(i % 9) * 0.12}s;--c:${['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#A560E8', '#FF9600'][i % 6]};--r:${(i * 53) % 360}deg"></i>`).join('')}</div>` : '';
  const body = `${GM.enter ? confetti : ''}
    <div class="res-hero">${right ? `<span class="trophy" aria-hidden="true">${GI.trophy}</span>` : ''}<img src="assets/muni.svg" alt=""><h1 class="lsn-q">${right ? 'Case closed! You cracked it.' : 'Good investigating!'}</h1>
      <p class="lsn-sub">${right ? 'You checked before you believed.' : 'The evidence points to a different verdict. Here’s what it shows.'}</p></div>
    <div class="res-claim"><p lang="${esc(sc.claimLang)}">${esc(sc.claim)}</p><span class="stamp st-${sc.answer}">${esc(VERDICTS[sc.answer].label)}</span></div>
    <div class="res-stats">
      <div class="rs y"><span class="rs-h">Points</span><b>${GI.bolt} ${s.total}</b></div>
      <div class="rs ${right ? 'g' : 'r'}"><span class="rs-h">Verdict</span><b>${right ? GI.check : GI.x} ${esc(VERDICTS[play.verdict].label)}</b></div>
      <div class="rs b"><span class="rs-h">Card checks</span><b>${GI.search} ${good}/${checked.length}</b></div>
    </div>
    <p class="tiny muted center">Verdict +${s.verdictPts} · Best evidence +${s.bestPts} · Cards inspected +${s.cardPts}</p>
    ${gut ? `<div class="dcard journey"><span class="jstep">${badge(gut.icon, gut.tone)}<span><small>You first felt</small><b>${esc(gut.label)}</b></span></span>
      <span class="jarrow" aria-hidden="true">${GI.arrow}</span>
      <span class="jstep">${vIcon(play.verdict)}<span><small>After checking</small><b>${esc(VERDICTS[play.verdict].label)}</b></span></span></div>` : ''}
    <div class="dcard"><h2>What the evidence shows</h2><p>${esc(sc.explain)}</p>
      ${bestCard ? `<p class="bestline ${bestOk ? 'ok' : ''}">${bestOk ? GI.check : GI.bulb}<span>${bestOk ? `Strong pick: <b>${esc(bestCard.title)}</b>` : `Stronger evidence: <b>${sc.best.map(id => esc(sc.cards.find(c => c.id === id).title)).join(', ')}</b>`}</span></p>` : ''}
      ${play.why ? `<p class="yourwhy">“${esc(play.why)}”</p>` : ''}</div>
    <div class="dcard"><h2>Your cards</h2>${seen.map(c => { const k = play.checks[c.id]; return `
      <button type="button" class="crow" data-act="gmPeek" data-v="${g.id}:${c.id}">${kindIcon(c.kind)}<span class="grow"><b>${esc(c.title)}</b><small>${k ? `You said: ${esc(LEANS[k].label)}` : 'Inspected'}</small></span>
      <span class="mark ${!k ? 'n' : leanOk(c, k) ? 'ok' : 'bad'}">${!k ? '' : leanOk(c, k) ? GI.check : GI.x}<span class="sr-only">${!k ? '' : leanOk(c, k) ? 'correct' : 'not quite'}</span></span></button>`; }).join('')}</div>
    <div class="dcard"><h2>T.A.N.O.N.G. badges</h2><div class="badges">${TANONG.map(([l, nm], i) => `<div class="tbadge ${steps.has(nm) ? 'on' : ''}" style="--i:${i}"><span class="coin" aria-hidden="true">${l}</span><small>${nm}</small><span class="sr-only">${steps.has(nm) ? 'earned' : 'not used'}</span></div>`).join('')}</div>
      <p class="tiny muted" style="margin:10px 0 0">Govern = making your final verdict.</p></div>
    <div class="dcard"><h2>Class so far</h2>${Object.entries(VERDICTS).map(([k, v]) => `<div class="vbar"><span class="lbl">${vIcon(k, 'sm')}${v.label}</span><span class="track"><span class="fill" style="background:${VCOLOR[k]};width:${done.length ? dist[k] / done.length * 100 : 0}%"></span></span><b>${dist[k]}</b></div>`).join('')}
      <p class="tiny muted" style="margin:6px 0 0">${plural(done.length, 'answer')} on this device.</p></div>
    <div class="dcard talk"><b>Talk about it:</b> ${esc(sc.discuss)}</div>`;
  return lsn(sc, play, sc.cards.length + 4, body, { html: `${g.open ? `<button class="dbtn ghost" data-act="gmReplay" data-v="${g.id}">${ic('rotate-ccw')} Play again</button>` : '<span></span>'}
    <a class="dbtn" id="gmMain" href="#/student">${GI.check} Done</a>` });
}

/* ---------------------------------------------------------------- route */
addRoute('student/game/:gid/:stage?/:i?', {
  role: 'student',
  lesson: true,
  render(p) {
    const g = gameById(p.gid), me = currentStudent();
    if (!g || !me.classIds.includes(g.classId)) return sNotFound('Game round');
    const sc = scenarioById(g.scenarioId), play = myPlay(g), n = sc.cards.length;
    if (play.verdict) return gmResult(g, sc, play);
    if (!g.open) return `<div class="lobby"><img src="assets/muni.svg" alt="" class="lobby-muni"><h1>This round is closed.</h1><p class="lsn-sub">Ask your teacher to open a new one.</p><a class="dbtn" href="#/student">Back</a></div>`;
    const resume = () => { const k = sc.cards.findIndex(c => !play.opened.includes(c.id)); return gmRedirect(gmPath(g, k >= 0 ? `card/${k}` : 'verdict')); };
    const stage = p.stage || '';
    if (!stage || stage === 'result') return play.gut ? resume() : gmIntro(g, sc, play);
    if (!play.gut) return gmRedirect(gmPath(g));
    if (stage === 'card') { const i = Number(p.i); return Number.isInteger(i) && i >= 0 && i < n ? gmCard(g, sc, play, i) : resume(); }
    if (play.opened.length < 3) return resume();
    if (stage === 'verdict') return gmVerdict(g, sc, play);
    if (stage === 'best') return VERDICTS[play.draft.verdict] ? gmBest(g, sc, play) : gmRedirect(gmPath(g, 'verdict'));
    if (stage === 'why') return play.opened.includes(play.draft.best) && VERDICTS[play.draft.verdict] ? gmWhy(g, sc, play) : gmRedirect(gmPath(g, 'best'));
    return resume();
  },
  mount() {
    const bar = $('.lsn-prog span');
    if (!bar) return;
    const to = Number(bar.dataset.to);
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = to + '%'; }));
    GM.pct = to;
  }
});

function gmPeekHtml(sc, c, pick) {
  const step = TANONG.find(t => t[1] === c.step);
  return `<div class="lsn-dlg"><p class="eyebrow">${esc(c.type)} · ${esc(step[0])} ${esc(c.step)}</p><h2>${esc(c.title)}</h2>${gmArt(sc, c)}
    <ul class="peek-facts">${c.facts.map(f => `<li>${GI.search}<span>${esc(f)}</span></li>`).join('')}</ul>
    ${pick ? `<div class="peek-ans ${leanOk(c, pick) ? 'ok' : 'bad'}"><b>You said: ${esc(LEANS[pick].label)}</b><span>${esc(c.tip)}</span></div>` : ''}
    <button class="dbtn block" data-act="closeDlg">Got it</button></div>`;
}

/* ---------------------------------------------------------------- actions */
function gmCtx(v) { const [gid, cid] = String(v).split(':'), g = gameById(gid), sc = scenarioById(g.scenarioId); return { g, sc, play: myPlay(g), c: sc.cards.find(x => x.id === cid), cid }; }
function gmEnableMain(on) { const b = $('#gmMain'); if (b && b.tagName === 'BUTTON') b.disabled = !on; }

Object.assign(ACT, {
  gmPick: (v, el) => {
    const group = el.closest('[role=radiogroup]');
    $$('[role=radio]', group).forEach(b => b.setAttribute('aria-checked', String(b === el)));
    GM.pick = v;
    if (!$('#qbox.locked')) gmEnableMain(true);
  },
  gmTranslate: (v, el) => {
    const p = $('#trEn'), show = p.hidden;
    p.hidden = !show; el.setAttribute('aria-expanded', String(show)); el.textContent = show ? 'Hide English' : 'Show in English';
  },
  gmGut: gid => {
    const g = gameById(gid), play = myPlay(g);
    if (!GUTS[GM.pick]) return;
    play.gut = GM.pick; touch(g); saveDB(); go(gmPath(g, 'card/0'));
  },
  gmClue: (v, el) => {
    const j = Number(v), c = scenarioById(gameById(ACTIVE.params.gid).scenarioId).cards[Number(ACTIVE.params.i)];
    if (GM.revealed.has(j)) return;
    GM.revealed.add(j);
    el.classList.add('on');
    el.setAttribute('aria-label', `Clue ${j + 1}: ${c.facts[j]}`);
    $('#clueCnt').textContent = `${GM.revealed.size}/${c.facts.length}`;
    if (GM.revealed.size >= c.facts.length) {
      const q = $('#qbox');
      q.classList.remove('locked'); $('#lockMsg').hidden = true;
      $$('[role=radio]', q).forEach((b, i) => { b.disabled = false; if (!b.querySelector('kbd')) b.insertAdjacentHTML('beforeend', kbd(i)); });
      if (GM.pick) gmEnableMain(true);
      setTimeout(() => q.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
    }
  },
  gmCheck: v => {
    const { g, play, c } = gmCtx(v);
    if (!LEANS[GM.pick] || GM.revealed.size < c.facts.length) return;
    play.checks[c.id] = GM.pick;
    if (!play.opened.includes(c.id)) play.opened.push(c.id);
    touch(g); saveDB(); refresh();
    $('#gmMain')?.focus({ preventScroll: true });
  },
  gmDraft: v => {
    const [gid, field] = v.split(':'), g = gameById(gid), play = myPlay(g);
    if (!GM.pick) return;
    play.draft[field] = GM.pick; touch(g); saveDB();
    go(gmPath(g, field === 'verdict' ? 'best' : 'why'));
  },
  gmStarter: s => {
    const ta = $('#gmWhy');
    const cur = ta.value.trim();
    ta.value = (cur ? cur.replace(/[.…]*$/, '') + '. ' : '') + s + ' ';
    ta.value = ta.value.slice(0, 240);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  },
  gmLock: gid => {
    const g = gameById(gid), sc = scenarioById(g.scenarioId), play = myPlay(g), d = play.draft;
    if (!VERDICTS[d.verdict] || !play.opened.includes(d.best)) return go(gmPath(g, 'verdict'));
    const why = String($('#gmWhy')?.value || '').trim().slice(0, 240);
    Object.assign(play, { verdict: d.verdict, best: d.best, why, at: Date.now() });
    play.points = scoreGamePlay(sc, play).total; touch(g); saveDB(); go(gmPath(g, 'result'));
  },
  gmPeek: v => {
    const { sc, play, c } = gmCtx(v);
    openDialog(gmPeekHtml(sc, c, play.checks[c.id]), { wide: true });
  },
  gmReplay: gid => {
    const g = gameById(gid);
    g.plays = g.plays.filter(p => p.studentId !== DB.session.studentId); touch(g); saveDB();
    GM.key = ''; GM.pct = 0; go(gmPath(g));
  }
});

/* Save the reason as the student types, so leaving and coming back keeps it. */
document.addEventListener('input', e => {
  if (e.target.id !== 'gmWhy') return;
  const g = gameById(e.target.dataset.gid); if (!g) return;
  myPlay(g).draft.why = e.target.value; saveDB();
  const n = $('#whyCnt'); if (n) n.textContent = e.target.value.length;
});

/* Keyboard shortcuts in lesson screens: 1–4 pick an answer, Enter presses the main button. */
document.addEventListener('keydown', e => {
  if (!document.body.classList.contains('lesson') || $('#dlg').open || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if (/^[1-4]$/.test(e.key)) {
    const el = $$('.lsn-body [role=radio]:not([disabled])')[Number(e.key) - 1];
    if (el) { e.preventDefault(); el.click(); el.focus(); }
  } else if (e.key === 'Enter' && !/^(BUTTON|A|SUMMARY)$/.test(t.tagName)) {
    const b = $('#gmMain');
    if (b && !b.disabled) { e.preventDefault(); b.click(); }
  }
});
