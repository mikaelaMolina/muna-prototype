/* Muna prototype · process evidence
   Turns what was recorded in the Output Sandbox into facts a teacher can read.
   Muna reports observable facts only. It never estimates "% human" or "% AI". */
'use strict';

const PASTE_LABELS = { source: 'Quote from a source', mine: 'My own text', ai: 'From AI', '': 'No label' };
const PASTE_KIND = l => l === 'source' ? 'source' : l === 'mine' ? 'mine' : l === 'ai' ? 'ai' : 'unlabeled';
const MIN_PASTE_CHARS = 12;

/** Ranges of recorded pastes that still appear in `text` (first match each, no overlaps). */
function pasteRanges(text, pastes) {
  const ranges = [];
  (pastes || []).forEach((p, i) => {
    const needle = String(p.text || '').trim();
    if (needle.length < MIN_PASTE_CHARS) return;
    let from = 0, idx;
    while ((idx = text.indexOf(needle, from)) >= 0) {
      const end = idx + needle.length;
      if (!ranges.some(r => idx < r.end && end > r.start)) { ranges.push({ start: idx, end, kind: PASTE_KIND(p.label), i }); break; }
      from = idx + 1;
    }
  });
  return ranges.sort((a, b) => a.start - b.start);
}
function composition(text, pastes) {
  const c = { total: words(text), typed: 0, source: 0, mine: 0, ai: 0, unlabeled: 0 };
  pasteRanges(text, pastes).forEach(r => { c[r.kind] += words(text.slice(r.start, r.end)); });
  c.typed = Math.max(0, c.total - c.source - c.mine - c.ai - c.unlabeled);
  return c;
}
function highlightHTML(text, pastes) {
  let html = '', pos = 0;
  pasteRanges(text, pastes).forEach(r => {
    html += esc(text.slice(pos, r.start));
    html += `<mark class="${r.kind}" title="Pasted · ${esc(PASTE_LABELS[r.kind === 'unlabeled' ? '' : r.kind])}">${esc(text.slice(r.start, r.end))}</mark>`;
    pos = r.end;
  });
  return html + esc(text.slice(pos));
}

const activeMs = sub => (sub.sessions || []).reduce((s, x) => s + (x.activeMs || 0), 0);
const draftCount = sub => (sub.snapshots || []).filter(s => s.kind === 'manual' || s.kind === 'submit').length;

/** Up to `max` points for the growth chart: Think First, then evenly spaced snapshots, always ending on the latest. */
function growthPoints(sub, max = 7) {
  const pts = [];
  if (sub.think && sub.think.text) pts.push({ label: 'Think First', at: sub.think.at, text: sub.think.text, think: true });
  let snaps = (sub.snapshots || []).slice();
  if (sub.status === 'draft' && sub.text && (!snaps.length || snaps[snaps.length - 1].text !== sub.text)) snaps.push({ at: Date.now(), text: sub.text, kind: 'now' });
  const room = max - pts.length;
  if (snaps.length > room) {
    const pick = [];
    for (let k = 0; k < room; k++) pick.push(snaps[Math.round(k * (snaps.length - 1) / (room - 1))]);
    snaps = [...new Set(pick)];
  }
  let d = 0;
  snaps.forEach(s => {
    if (s.kind === 'manual') d++;
    pts.push({ ...s, label: s.kind === 'submit' ? 'Final' : s.kind === 'manual' ? `Draft ${d}` : s.kind === 'now' ? 'Now' : fmtTime(s.at) });
  });
  return pts;
}

function timelineItems(sub) {
  const map = {
    open: e => ['', 'Opened the assignment in Muna'],
    resume: e => ['', 'Came back to keep working (new session)'],
    think: e => ['g', `Wrote Think First (${e.words} words)`],
    paste: e => ['y', `Pasted ${e.words} words · ${e.label ? PASTE_LABELS[e.label] : '<b>no label</b>'}`],
    label: e => ['y', `Labeled a paste: ${PASTE_LABELS[e.label] || e.label}`],
    bulk: e => ['y', `About ${e.words} words appeared at once without a paste being recorded`],
    draft: e => ['', `Saved a draft (${e.words} words)`],
    source: e => ['', `Added source “${esc(e.title)}”`],
    ainote: e => ['s', e.none ? 'AI note: said no AI was used' : `AI note: ${esc(e.tool || 'AI tool')} disclosed`],
    check: e => ['g', 'Answered the Understanding Check'],
    submit: e => ['g', `Submitted (${e.words} words)`],
    fupAnswer: e => ['g', 'Answered the teacher’s follow-up questions'],
    reply: e => ['s', e.appeal ? 'Replied to the concern and asked for an appeal' : 'Replied to the teacher’s concern']
  };
  return (sub.events || []).filter(e => map[e.type]).map(e => { const [cls, html] = map[e.type](e); return { at: e.at, cls, html }; });
}

/** Facts checked against the assignment's AI rule and disclosure settings. */
function ruleFacts(sub, a) {
  const f = [], ai = sub.ai || {}, comp = composition(sub.text, sub.pastes);
  const aiUsed = !ai.none && (ai.tool || ai.purpose);
  if (a.thinkFirst) {
    const firstWrite = (sub.snapshots[0] || {}).at || sub.submittedAt || Infinity;
    if (sub.think.text && sub.think.at && sub.think.at <= firstWrite) f.push(['ok', `Think First written before the first draft (${fmtWhen(sub.think.at)}, ${words(sub.think.text)} words).`]);
    else f.push(['warn', 'Think First is missing or was written after drafting began.']);
  }
  if (a.rule === 'prohibited') {
    if (aiUsed) f.push(['warn', `AI use disclosed (${ai.tool || 'tool not named'}: “${ai.purpose || 'no purpose given'}”) on a task where AI is prohibited.`]);
    else f.push(['ok', 'Student states that no AI tool was used.']);
  } else if (a.rule === 'allowed') {
    if (!aiUsed) f.push(['ok', 'Student states that no AI tool was used.']);
    else {
      f.push(['ok', `AI use disclosed: ${ai.tool || 'tool not named'}, for “${ai.purpose || 'no purpose given'}”.`]);
      f.push(['info', `Check this against the roles you allowed: ${rolesText(a.roles)}.`]);
    }
  } else if (a.rule === 'required') {
    if (!aiUsed) f.push(['warn', 'AI was required for this task, but no AI use was disclosed.']);
    else f.push(['ok', `Required AI use disclosed: ${ai.tool || 'tool not named'}, for “${ai.purpose || 'no purpose given'}”.`]);
  }
  if (aiUsed && a.rule !== 'prohibited') {
    [['tool', 'tool name'], ['purpose', 'purpose'], ['prompts', 'prompts'], ['changes', 'what they kept or changed']].forEach(([k, l]) => {
      if (a.disclose.includes(k) && k !== 'tool' && k !== 'purpose') f.push(ai[k] && ai[k].trim() ? ['ok', `Shared ${l}.`] : ['warn', `Did not share ${l}.`]);
    });
  }
  if (comp.ai) f.push([a.rule === 'prohibited' ? 'warn' : 'info', `${comp.ai} words pasted from AI are in the submitted text.`]);
  const total = sub.pastes.length, labeled = sub.pastes.filter(p => p.label).length;
  if (a.disclose.includes('pasted')) {
    if (!total) f.push(['ok', 'No pasted text recorded.']);
    else f.push([labeled === total ? 'ok' : 'warn', `${labeled} of ${total} pasted passages have a label.`]);
  }
  if (a.disclose.includes('sources')) f.push(sub.sources.length ? ['ok', `${plural(sub.sources.length, 'source')} listed.`] : ['warn', 'No sources listed.']);
  return f;
}

/** Things worth talking about. Each has a stable key so a teacher can attach it as evidence. */
function askAbout(sub, a) {
  const out = [], ai = sub.ai || {};
  pasteRanges(sub.text, sub.pastes).forEach(r => {
    const p = sub.pastes[r.i];
    if (r.kind === 'unlabeled') out.push({ key: 'paste:' + r.i, text: `${p.words} words pasted ${fmtWhen(p.at)} have no label: “${snip(p.text, 10)}”` });
    if (r.kind === 'ai') out.push({ key: 'aipaste:' + r.i, text: `${p.words} words pasted from AI are in the final text: “${snip(p.text, 10)}”` });
  });
  (sub.events || []).filter(e => e.type === 'bulk').forEach((e, i) => out.push({ key: 'bulk:' + i, text: `About ${e.words} words appeared at once on ${fmtWhen(e.at)} without a recorded paste (for example dictation, autocomplete, or drag and drop).` }));
  if (a.rule === 'prohibited' && !ai.none && (ai.tool || ai.purpose)) out.push({ key: 'ai-prohibited', text: 'AI use was disclosed on a task where AI is prohibited.' });
  if (a.rule === 'required' && (ai.none || !ai.tool)) out.push({ key: 'ai-required', text: 'AI was required, but no AI use was disclosed.' });
  if (a.rule !== 'prohibited' && !ai.none && ai.tool) ['prompts', 'changes'].forEach(k => {
    if (a.disclose.includes(k) && !(ai[k] || '').trim()) out.push({ key: 'disclose:' + k, text: k === 'prompts' ? 'Prompts were not shared in the AI note.' : 'Did not explain what was kept or changed from AI.' });
  });
  (sub.uc.answers || []).forEach((ans, i) => { if (i < sub.uc.questions.length && words(ans) < 12) out.push({ key: 'uc:' + i, text: `Answer ${i + 1} of the Understanding Check is short (${words(ans)} words).` }); });
  const comp = composition(sub.text, sub.pastes), mins = activeMs(sub) / 6e4;
  if (comp.typed > 150 && mins > 0 && comp.typed / mins > 45) out.push({ key: 'speed', text: `${comp.typed} typed words in ${fmtDur(activeMs(sub))} of active writing time is faster than typical drafting.` });
  return out;
}

function suggestedFollowups(sub, a) {
  const q = [], ai = sub.ai || {};
  const unl = pasteRanges(sub.text, sub.pastes).find(r => r.kind === 'unlabeled');
  if (unl) q.push(`Where did this part come from: “${snip(sub.pastes[unl.i].text, 9)}”? Can you show me the source?`);
  if (!ai.none && ai.tool) q.push(`What did ${ai.tool} suggest that you decided not to use, and why?`);
  if (sub.think.text) q.push('What changed in your thinking between your Think First and your final work?');
  if (sub.sources[0]) q.push(`How did you check that “${snip(sub.sources[0].title, 8)}” was reliable?`);
  const short = (sub.uc.answers || []).findIndex((x, i) => i < sub.uc.questions.length && words(x) < 12);
  if (short >= 0) q.push(`Can you explain your answer to question ${short + 1} with an example?`);
  q.push('Without looking at your work, explain your main point in two sentences.');
  return [...new Set(q)].slice(0, 5);
}

/** Understanding Check questions built from the student's own work, plus the teacher's own questions. */
function buildUCQuestions(sub, a) {
  const qs = [];
  if (sub.think.text.trim()) qs.push(`In your Think First, you wrote: “${snip(sub.think.text, 12)}” What did you learn that changed or confirmed this?`);
  const unl = pasteRanges(sub.text, sub.pastes);
  const pick = unl.find(r => r.kind === 'unlabeled') || unl.find(r => r.kind === 'ai') || unl[0];
  const sentences = (sub.text.match(/[^.!?\n]+[.!?]/g) || []).map(s => s.trim()).filter(s => words(s) >= 6);
  if (pick) qs.push(`Explain this part of your work in your own words: “${snip(sub.text.slice(pick.start, pick.end), 14)}”`);
  else if (sentences.length) qs.push(`Explain this part of your work in your own words: “${snip(sentences.slice().sort((x, y) => y.length - x.length)[0], 14)}”`);
  if (sub.sources[0]) qs.push(`Why did you trust “${snip(sub.sources[0].title, 8)}”? What would make you doubt it?`);
  if (!sub.ai.none && sub.ai.tool) qs.push(`What did ${sub.ai.tool} suggest that you changed or did not use? Why?`);
  if (sentences.length > 2) qs.push(`Why did you include this line: “${snip(sentences[Math.floor(sentences.length / 2)], 12)}”`);
  qs.push('What is the main point of your work, in one or two sentences?');
  return [...new Set(qs)].slice(0, a.ucCount).concat((a.customQs || []).filter(Boolean));
}

/** The AI rule exactly as students see it. Used in setup preview, sandbox, and review. */
function ruleBanner(a) {
  const disc = (a.disclose || []).map(d => (DISCLOSE.find(x => x[0] === d) || [, d])[1].replace(/^./, ch => ch.toLowerCase()));
  const txt = {
    prohibited: '<b>No AI for this task.</b> Muna saves your drafts so your own effort shows.',
    allowed: `<b>AI allowed only to:</b> ${esc(rolesText(a.roles))}. It may never write your final answer.`,
    required: `<b>Use AI to:</b> ${esc(rolesText(a.roles))}. Then show how you used it.`
  }[a.rule] || '';
  return `<div class="banner ${esc(a.rule)}">${RULES[a.rule] ? ic(RULES[a.rule].icon) : ''}<span>${txt}`
    + (disc.length ? `<br><span class="tiny">You will share: ${esc(disc.join(', '))}.</span>` : '')
    + (a.thinkFirst ? '<br><span class="tiny">You will answer Think First before you write.</span>' : '')
    + (a.ucCount || (a.customQs || []).length ? `<br><span class="tiny">You will answer a short Understanding Check about your own work.</span>` : '')
    + '</span></div>';
}
const statusChip = sub => { const s = STATUS[sub ? sub.status : 'none'] || { label: 'Not started', chip: 'n' }; return `<span class="chip ${s.chip}">${s.label}</span>`; };
