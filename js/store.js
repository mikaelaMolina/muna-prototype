/* Muna prototype · data store
   Everything lives in this browser's localStorage under one key. No server, no network calls.
   Export/import (JSON files) moves data between devices, e.g. teacher laptop <-> student phone. */
'use strict';

const STORE_KEY = 'muna.prototype.v1';
const DATA_VERSION = 1;
const COLLECTIONS = ['classes', 'students', 'assignments', 'submissions', 'games'];

const RULES = {
  prohibited: { label: 'AI prohibited', icon: 'ban', tone: 'red', desc: 'Students do the whole task without AI tools.' },
  allowed: { label: 'AI allowed for specific roles', icon: 'compass', tone: 'blue', desc: 'Students may use AI only for the roles you pick.' },
  required: { label: 'AI required', icon: 'bot', tone: 'yellow', desc: 'Students must use AI for the roles you pick, then show how.' }
};
const AI_ROLES = [
  ['brainstorm', 'Brainstorm ideas'], ['outline', 'Suggest an outline'], ['explain', 'Explain hard concepts'],
  ['feedback', 'Grammar and feedback'], ['translate', 'Translate or simplify text'], ['practice', 'Make practice questions']
];
const DISCLOSE = [
  ['tool', 'Which AI tool they used'], ['purpose', 'What they used it for'], ['prompts', 'The prompts they typed'],
  ['changes', 'What they kept, changed, or rejected'], ['pasted', 'A label on any pasted text'], ['sources', 'A list of their sources']
];
const roleLabel = id => (AI_ROLES.find(r => r[0] === id) || [, id])[1];
const rolesText = list => (list && list.length) ? list.map(roleLabel).join(', ').toLowerCase() : 'no roles picked';

/* Weights from DepEd Order No. 8, s. 2015 (K to 12 classroom assessment). Teachers can edit them. */
const GRADING_PRESETS = {
  'deped-lang': { label: 'DepEd JHS · Languages, AP, EsP (30/50/20)', transmute: true, parts: [['Written Works', 30], ['Performance Tasks', 50], ['Quarterly Assessment', 20]] },
  'deped-scimath': { label: 'DepEd JHS · Science, Math (40/40/20)', transmute: true, parts: [['Written Works', 40], ['Performance Tasks', 40], ['Quarterly Assessment', 20]] },
  'deped-mapeh': { label: 'DepEd JHS · MAPEH, EPP/TLE (20/60/20)', transmute: true, parts: [['Written Works', 20], ['Performance Tasks', 60], ['Quarterly Assessment', 20]] },
  'deped-shs-core': { label: 'DepEd SHS · Core subjects (25/50/25)', transmute: true, parts: [['Written Works', 25], ['Performance Tasks', 50], ['Quarterly Assessment', 25]] },
  'deped-shs-acad': { label: 'DepEd SHS · Academic track, other subjects (25/45/30)', transmute: true, parts: [['Written Works', 25], ['Performance Tasks', 45], ['Quarterly Assessment', 30]] },
  'college': { label: 'College · example (edit to match your syllabus)', transmute: false, parts: [['Quizzes', 20], ['Outputs and Projects', 30], ['Major Exams', 40], ['Class Participation', 10]] },
  'custom': { label: 'Custom', transmute: false, parts: [['Component 1', 50], ['Component 2', 50]] }
};
const presetParts = key => (GRADING_PRESETS[key] || GRADING_PRESETS.custom).parts.map(([name, weight]) => ({ id: uid('c_'), name, weight }));

const STATUS = {
  draft: { label: 'In progress', chip: 'n' },
  submitted: { label: 'Needs review', chip: 'y' },
  followup: { label: 'Follow-up sent', chip: 's' },
  answered: { label: 'Follow-up answered', chip: 'y' },
  concern: { label: 'Concern raised', chip: 'r' },
  replied: { label: 'Student replied', chip: 'y' },
  accepted: { label: 'Accepted', chip: 'g' }
};
const NEEDS_TEACHER = ['submitted', 'answered', 'replied'];

/* ---------------------------------------------------------------- core store */
const emptyDB = () => ({ version: DATA_VERSION, teacher: null, classes: [], students: [], assignments: [], submissions: [], games: [], session: { role: null, studentId: null } });
let DB = emptyDB();

function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') DB = { ...emptyDB(), ...d, session: { ...emptyDB().session, ...(d.session || {}) } };
    }
  } catch (e) { console.warn('Muna: could not read saved data', e); }
  COLLECTIONS.forEach(c => { if (!Array.isArray(DB[c])) DB[c] = []; });
}
function saveDB() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); return true; }
  catch (e) { console.error(e); toast('Could not save. Browser storage may be full or blocked. Export your data to keep it.', 5000); return false; }
}
const touch = rec => { rec.updatedAt = Date.now(); return rec; };

/* ---------------------------------------------------------------- lookups */
const byId = (col, id) => DB[col].find(x => x.id === id);
const classById = id => byId('classes', id);
const studentById = id => byId('students', id);
const assignmentById = id => byId('assignments', id);
const submissionById = id => byId('submissions', id);
const gameById = id => byId('games', id);
const classByCode = code => DB.classes.find(c => c.code.replace(/[^A-Z0-9]/g, '') === String(code).toUpperCase().replace(/[^A-Z0-9]/g, ''));
const gameByCode = code => DB.games.find(g => g.code === String(code).trim() && g.open);
const studentsInClass = cid => DB.students.filter(s => s.classIds.includes(cid)).sort((a, b) => a.name.localeCompare(b.name));
const assignmentsInClass = cid => DB.assignments.filter(a => a.classId === cid).sort((a, b) => (a.due || '').localeCompare(b.due || '') || a.createdAt - b.createdAt);
const subsForAssignment = aid => DB.submissions.filter(s => s.assignmentId === aid);
const subFor = (aid, sid) => DB.submissions.find(s => s.assignmentId === aid && s.studentId === sid);
const currentStudent = () => DB.session.studentId ? studentById(DB.session.studentId) : null;
const componentOf = a => { const c = classById(a.classId); return c ? c.grading.components.find(p => p.id === a.componentId) : null; };

/* ---------------------------------------------------------------- codes */
function makeClassCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'MUN-' + Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(''); } while (DB.classes.some(c => c.code === code));
  return code;
}
function makeGameCode() {
  let code;
  do { code = String(1000 + Math.floor(Math.random() * 9000)); } while (DB.games.some(g => g.code === code && g.open));
  return code;
}

/* ---------------------------------------------------------------- mutations */
function createClass({ name, subject, preset }) {
  const p = GRADING_PRESETS[preset] || GRADING_PRESETS.custom;
  const c = touch({ id: uid('cls_'), name, subject, code: makeClassCode(), createdAt: Date.now(),
    grading: { preset, components: presetParts(preset), transmute: p.transmute, fileName: '' } });
  DB.classes.push(c); saveDB(); return c;
}
function addStudentToClass(name, cid) {
  const clean = name.trim().replace(/\s+/g, ' ');
  let s = DB.students.find(x => x.name.toLowerCase() === clean.toLowerCase() && x.classIds.includes(cid));
  if (s) return s;
  s = DB.students.find(x => x.name.toLowerCase() === clean.toLowerCase() && DB.session.studentId === x.id);
  if (!s) { s = touch({ id: uid('stu_'), name: clean, classIds: [], createdAt: Date.now() }); DB.students.push(s); }
  if (!s.classIds.includes(cid)) s.classIds.push(cid);
  touch(s); saveDB(); return s;
}
function newSubmission(aid, sid) {
  const sub = touch({
    id: uid('sub_'), assignmentId: aid, studentId: sid, status: 'draft', createdAt: Date.now(),
    think: { text: '', at: 0 }, text: '', snapshots: [], pastes: [], sessions: [], events: [],
    sources: [], ai: { none: false, tool: '', purpose: '', prompts: '', changes: '' },
    uc: { questions: [], answers: [], basis: '' }, submittedAt: 0,
    review: { ratings: {}, decision: '', score: '', comment: '', followups: [], followupAnswers: [], concern: '', evidence: [],
              studentReply: '', appeal: false, history: [], reviewMs: 0, firstDecisionMs: 0 }
  });
  DB.submissions.push(sub); saveDB(); return sub;
}
const logEvent = (sub, type, detail = {}) => { sub.events.push({ at: Date.now(), type, ...detail }); };

/* ---------------------------------------------------------------- grades */
/** DepEd transmutation (DO 8, s. 2015): 60–100 initial -> 75–100, below 60 -> 60–74. */
function transmute(ig) {
  if (ig == null || isNaN(ig)) return null;
  if (ig >= 100) return 100;
  if (ig >= 60) return 75 + Math.floor((ig - 60) / 1.6);
  return 60 + Math.floor(Math.max(0, ig) / 4);
}
/** Grades from accepted scores only. Components with no graded work yet are left out ("so far"). */
function computeGrades(cid) {
  const cls = classById(cid), comps = cls.grading.components, asg = assignmentsInClass(cid);
  return studentsInClass(cid).map(stu => {
    const perComp = comps.map(c => {
      let earned = 0, max = 0;
      asg.filter(a => a.componentId === c.id).forEach(a => {
        const sub = subFor(a.id, stu.id);
        if (sub && sub.status === 'accepted' && sub.review.score !== '') { earned += Number(sub.review.score); max += Number(a.points) || 0; }
      });
      return { id: c.id, name: c.name, weight: Number(c.weight) || 0, earned, max, pct: max ? earned / max * 100 : null };
    });
    const used = perComp.filter(p => p.pct != null && p.weight > 0);
    const wsum = used.reduce((s, p) => s + p.weight, 0);
    const initial = wsum ? used.reduce((s, p) => s + p.pct * p.weight, 0) / wsum : null;
    return { student: stu, perComp, initial, final: cls.grading.transmute ? transmute(initial) : initial, partial: wsum && wsum < comps.reduce((s, c) => s + (Number(c.weight) || 0), 0) };
  });
}

/* ---------------------------------------------------------------- export / import */
function exportAll() {
  const data = { ...DB, session: undefined, exportedAt: Date.now(), kind: 'muna-all' };
  download(`muna-data-${todayISO()}.json`, JSON.stringify(data, null, 1));
}
function exportClass(cid) {
  const cls = classById(cid);
  const data = { version: DATA_VERSION, kind: 'muna-class', exportedAt: Date.now(), classes: [cls],
    assignments: assignmentsInClass(cid), students: [], submissions: [], games: DB.games.filter(g => g.classId === cid && g.open).map(g => ({ ...g, plays: [] })) };
  download(`muna-class-${cls.code}.json`, JSON.stringify(data, null, 1));
}
function exportStudentWork(sid) {
  const stu = studentById(sid);
  const subs = DB.submissions.filter(s => s.studentId === sid);
  const games = DB.games.filter(g => g.plays.some(p => p.studentId === sid)).map(g => ({ ...g, plays: g.plays.filter(p => p.studentId === sid) }));
  const data = { version: DATA_VERSION, kind: 'muna-student', exportedAt: Date.now(), students: [stu], submissions: subs, games,
    classes: DB.classes.filter(c => stu.classIds.includes(c.id)), assignments: DB.assignments.filter(a => stu.classIds.includes(a.classId)) };
  download(`muna-work-${stu.name.replace(/\W+/g, '-').toLowerCase()}-${todayISO()}.json`, JSON.stringify(data, null, 1));
}
/** Merge records by id; the newer updatedAt wins. Game plays merge per student. Returns counts. */
function importData(obj) {
  if (!obj || typeof obj !== 'object' || !COLLECTIONS.some(c => Array.isArray(obj[c]))) throw new Error('This file is not Muna data.');
  const counts = {};
  COLLECTIONS.forEach(col => {
    (obj[col] || []).forEach(rec => {
      if (!rec || typeof rec.id !== 'string') return;
      const i = DB[col].findIndex(x => x.id === rec.id);
      if (i < 0) { DB[col].push(rec); counts[col] = (counts[col] || 0) + 1; return; }
      const cur = DB[col][i];
      if (col === 'games') {
        const plays = [...cur.plays]; let changed = (rec.updatedAt || 0) > (cur.updatedAt || 0);
        (rec.plays || []).forEach(p => {
          const j = plays.findIndex(x => x.studentId === p.studentId);
          if (j < 0) { plays.push(p); changed = true; } else if ((p.at || 0) > (plays[j].at || 0)) { plays[j] = p; changed = true; }
        });
        DB[col][i] = { ...((rec.updatedAt || 0) > (cur.updatedAt || 0) ? rec : cur), plays };
        if (changed) counts[col] = (counts[col] || 0) + 1;
      } else if (col === 'students') {
        const keep = (rec.updatedAt || 0) > (cur.updatedAt || 0) ? rec : cur;
        DB[col][i] = { ...keep, classIds: [...new Set([...(cur.classIds || []), ...(rec.classIds || [])])] };
      } else if ((rec.updatedAt || 0) > (cur.updatedAt || 0)) { DB[col][i] = rec; counts[col] = (counts[col] || 0) + 1; }
    });
  });
  if (obj.teacher && !DB.teacher) DB.teacher = obj.teacher;
  saveDB();
  return counts;
}

/* ---------------------------------------------------------------- sample data */
function loadSampleData() {
  const H = 3600e3, D = 24 * H, now = Date.now(), t0 = now - 3 * D;
  if (!DB.teacher) DB.teacher = { name: 'Ms. Reyes', school: 'Sample High School, Cebu City' };
  const cls = createClass({ name: 'Grade 9 · Sampaguita', subject: 'Science 9', preset: 'deped-scimath' });
  cls.sample = true;
  const [ww, pt] = cls.grading.components;
  const names = ['Bea Dela Cruz', 'Carlo Mendoza', 'Jasmine Uy', 'Paolo Santos'];
  const stus = names.map(n => addStudentToClass(n, cls.id));

  const quiz = touch({ id: uid('asg_'), classId: cls.id, title: 'Quiz: Greenhouse effect', instructions: 'Short written quiz on the greenhouse effect.',
    due: todayISO(-5), componentId: ww.id, points: 20, rule: 'prohibited', roles: [], disclose: ['pasted', 'sources'], thinkFirst: false, ucCount: 1, customQs: [],
    createdAt: t0 - 5 * D, setupMs: 95e3, sample: true });
  const essay = touch({ id: uid('asg_'), classId: cls.id, title: "How Climate Change Affects Cebu's Coasts",
    instructions: 'Write a 250 to 400 word report on one way climate change affects coastal communities in Cebu. Use at least one reliable source and one local example.',
    due: todayISO(4), componentId: pt.id, points: 50, rule: 'allowed', roles: ['brainstorm', 'feedback'], disclose: ['tool', 'purpose', 'changes', 'pasted', 'sources'],
    thinkFirst: true, ucCount: 3, customQs: [], createdAt: t0 - D, setupMs: 154e3, sample: true });
  DB.assignments.push(quiz, essay);

  // graded quiz results so the gradebook has numbers
  [[0, 17], [1, 15], [2, 19], [3, 12]].forEach(([i, sc]) => {
    const s = newSubmission(quiz.id, stus[i].id);
    Object.assign(s, { status: 'accepted', text: 'Quiz answers (sample).', submittedAt: t0 - 4 * D, sample: true });
    s.snapshots = [{ at: t0 - 4 * D, text: s.text, kind: 'submit' }];
    s.review = { ...s.review, decision: 'accept', score: String(sc), reviewMs: 60e3 + i * 15e3, firstDecisionMs: 60e3 + i * 15e3, history: [{ at: t0 - 4 * D + H, decision: 'accept', note: `${sc}/20` }] };
  });

  // Bea's essay: a full process log
  const PAGASA_Q = 'According to PAGASA, sea levels in the Philippines have risen faster than the global average over recent decades.';
  const SURGE = 'Storm surges can push seawater several meters inland, contaminating wells and damaging crops and homes.';
  const think = 'I know climate change makes the weather hotter and the sea level rise. In Cebu, I think coastal barangays get more flooding during high tide. I am not sure how much the sea has risen or what the city is doing about it.';
  const d1 = "How Climate Change Affects Cebu's Coasts\n\n1. Intro: Cebu is an island, many families live near the sea.\n2. Sea level rise: need data from PAGASA.\n3. Stronger typhoons: Odette 2021 damage.\n4. Effects on fishers and mangroves.\n5. What we can do: mangrove planting, early warning, less plastic.";
  const d2 = `Cebu is an island province, and many families live near the sea. Because of this climate change is not a far problem for us.\n\nThe first effect is sea level rise. ${PAGASA_Q} This mean high tides now reach places that used to be dry. In our barangay the basketball court near the shore is flooded every high tide, my lola say it did not happen before.\n\nThe second effect is stronger typhoons. When Typhoon Odette hit in 2021, many houses near the coast was damaged and fishing boats was destroy. ${SURGE}\n\nMangroves and corals protect the coast.`;
  const fin = `Cebu is an island province, and many families live only a few steps from the sea. Because of this, climate change is not a far-away problem for us. It is already changing how coastal communities live.\n\nThe first effect is sea level rise. ${PAGASA_Q} This means high tides now reach places that used to stay dry. In our barangay, the basketball court near the shore floods during high tide, something my lola says did not happen when she was young.\n\nThe second effect is stronger typhoons. Warmer ocean water gives storms more energy. When Typhoon Odette hit in 2021, many houses along the coast were damaged and fishing boats were destroyed. ${SURGE} Families who depend on fishing lost both their homes and their income at the same time.\n\nThe third effect is damage to mangroves and coral reefs. These act as natural walls that slow down waves. When they are lost, the coast becomes even more exposed.\n\nStill, communities can adapt. Planting mangroves, following early warning signals, and keeping canals free of plastic can reduce the damage. For me, the most important lesson is that small actions in our barangay connect to a much bigger problem. Climate change is global, but its effects are felt at home.`;
  const s1 = t0 + 19 * H, s2 = t0 + D + 20 * H, s3 = t0 + 2 * D + 18.5 * H;
  const bea = newSubmission(essay.id, stus[0].id);
  Object.assign(bea, {
    sample: true, status: 'submitted', text: fin, submittedAt: s3 + 35 * 6e4,
    think: { text: think, at: s1 + 6 * 6e4 },
    sessions: [{ start: s1, end: s1 + 24 * 6e4, activeMs: 22 * 6e4 }, { start: s2, end: s2 + 45 * 6e4, activeMs: 41 * 6e4 }, { start: s3, end: s3 + 35 * 6e4, activeMs: 32 * 6e4 }],
    snapshots: [
      { at: s1 + 14 * 6e4, text: d1.split('\n\n')[0] + '\n\n1. Intro: Cebu is an island, many families live near the sea.\n2. Sea level rise: need data from PAGASA.', kind: 'auto' },
      { at: s1 + 24 * 6e4, text: d1, kind: 'manual' },
      { at: s2 + 20 * 6e4, text: d2.split('\n\nThe second')[0], kind: 'auto' },
      { at: s2 + 45 * 6e4, text: d2, kind: 'manual' },
      { at: s3 + 15 * 6e4, text: fin.split('\n\nThe third')[0], kind: 'auto' },
      { at: s3 + 35 * 6e4, text: fin, kind: 'submit' }
    ],
    pastes: [{ at: s2 + 7 * 6e4, text: PAGASA_Q, words: words(PAGASA_Q), label: 'source' }, { at: s2 + 26 * 6e4, text: SURGE, words: words(SURGE), label: '' }],
    sources: [{ title: 'PAGASA: Climate Change in the Philippines', link: 'https://www.pagasa.dost.gov.ph/', at: s1 + 10 * 6e4 },
              { title: 'News report on Typhoon Odette damage in Cebu coastal barangays', link: '', at: s2 + 30 * 6e4 }],
    ai: { none: false, tool: 'ChatGPT', purpose: 'Check my grammar', prompts: '', changes: 'Fixed 4 grammar mistakes it found. I did not use its rewrite of my conclusion because it did not sound like me.' },
    uc: { basis: 'sample', questions: [
      'In your Think First, you wrote: “I am not sure how much the sea has risen…” What did you find out, and where?',
      'Explain this part of your work in your own words: “Storm surges can push seawater several meters inland, contaminating wells…”',
      'Why did you trust “PAGASA: Climate Change in the Philippines”? What would make you doubt it?'],
      answers: ['PAGASA says the sea level here is rising faster than the world average. I got it from the PAGASA climate page and I put it as a quote.',
        'It means water from the sea goes to the land during a typhoon and it makes damage.',
        'Because PAGASA is the government weather agency. I would doubt it if it was an old page or if other sources said something different.'] }
  });
  bea.events = [
    { at: s1, type: 'open' }, { at: s1 + 6 * 6e4, type: 'think', words: words(think) },
    { at: s1 + 10 * 6e4, type: 'source', title: 'PAGASA: Climate Change in the Philippines' }, { at: s1 + 24 * 6e4, type: 'draft', words: words(d1) },
    { at: s2, type: 'resume' }, { at: s2 + 7 * 6e4, type: 'paste', words: words(PAGASA_Q), label: 'source' },
    { at: s2 + 26 * 6e4, type: 'paste', words: words(SURGE), label: '' }, { at: s2 + 30 * 6e4, type: 'source', title: 'News report on Typhoon Odette damage' },
    { at: s2 + 45 * 6e4, type: 'draft', words: words(d2) }, { at: s3, type: 'resume' },
    { at: s3 + 2 * 6e4, type: 'ainote', tool: 'ChatGPT' }, { at: s3 + 33 * 6e4, type: 'check' }, { at: s3 + 35 * 6e4, type: 'submit', words: words(fin) }
  ];
  touch(bea);

  // Carlo: still writing. Jasmine: submitted with a short process.
  const carlo = newSubmission(essay.id, stus[1].id);
  Object.assign(carlo, { sample: true, think: { text: 'Climate change is when the earth gets warmer because of greenhouse gases from cars and factories. I do not know much about Cebu.', at: now - 5 * H },
    text: 'Climate change affects Cebu because', sessions: [{ start: now - 5.2 * H, end: now - 5 * H, activeMs: 8 * 6e4 }], events: [{ at: now - 5.2 * H, type: 'open' }, { at: now - 5 * H, type: 'think', words: 24 }] });

  const g = touch({ id: uid('game_'), classId: cls.id, scenarioId: 'no-classes', code: makeGameCode(), open: true, createdAt: now - 2 * H, sample: true, plays: [
    { studentId: stus[1].id, opened: ['fb', 'gc', 'pio'], verdict: 'unverified', best: 'pio', why: 'The city page says classes continue but I am not sure.', points: 42, at: now - 1.9 * H },
    { studentId: stus[2].id, opened: ['fb', 'memo', 'pio', 'pagasa'], verdict: 'misleading', best: 'memo', why: 'The order is from last year.', points: 96, at: now - 1.9 * H },
    { studentId: stus[3].id, opened: ['fb', 'gc', 'memo'], verdict: 'supported', best: 'memo', why: 'There is a signed order.', points: 42, at: now - 1.9 * H }
  ] });
  DB.games.push(g);
  saveDB();
  return cls;
}
