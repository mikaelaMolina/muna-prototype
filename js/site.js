/* Muna · public website pages: landing, sign-in (role picker), and data settings. */
'use strict';

/* ================================================================ landing */
addRoute('', {
  role: null, site: true,
  render() {
    return `
    <section class="hero wrap" aria-labelledby="hero-h">
      <span class="shape sun" aria-hidden="true"></span><span class="shape arc" aria-hidden="true"></span><span class="shape dot" aria-hidden="true"></span>
      <div class="bubble-img l" aria-hidden="true"><img src="assets/muni.svg" alt=""></div>
      <div class="bubble-img r" aria-hidden="true"><img src="assets/wordmark.svg" alt="" style="width:80%"></div>
      <p class="eyebrow">The AI-ready classroom</p>
      <h1 id="hero-h">Grade the <span class="hl">thinking</span>,<br>not a guess</h1>
      <p class="lede">See how every piece of work was made. No AI detectors, no false accusations.</p>
      <div class="ctas">
        <a class="btn coral lg" href="#/start/teacher">I’m a teacher</a>
        <a class="btn ghost lg" href="#/start/student">I’m a student</a>
      </div>
    </section>

    <div class="wrap">
      <section class="showcase" aria-label="Muna on a phone">
        <div class="float f1"><span class="tag">AI rule</span><b>AI allowed for brainstorming</b>Set per assignment</div>
        <div class="float f2"><span class="tag">Think First</span><b>Starts with what you know</b></div>
        <div class="float f3"><span class="tag">Understanding Check</span><b>3 / 3 answered</b>From the student’s own work</div>
        <div class="float f4" aria-hidden="true"><span><i style="background:var(--coral)"></i>Typed</span><span><i style="background:var(--yellow)"></i>Pasted, cited</span><span><i style="background:var(--skydeep)"></i>AI, disclosed</span></div>
        ${phoneProcess()}
        ${phoneGame()}
      </section>

      <section class="section" id="features" aria-labelledby="f-h">
        <h2 class="section-title" id="f-h">One classroom.<br>Everything you need.</h2>
        <div class="bento">
          <article class="b-navy span-7">
            <h3>Clear AI rules for every task</h3>
            <p>Prohibited, allowed, or required. Students see it before they start.</p>
            <div class="art" aria-hidden="true">
              <div class="mini"><span class="ic" style="background:var(--badbg)">⛔</span><b>AI prohibited</b></div>
              <div class="mini sel"><span class="ic" style="background:var(--infobg)">🧭</span><b>AI allowed for specific roles</b></div>
              <div class="mini"><span class="ic" style="background:var(--warnbg)">🤖</span><b>AI required</b></div>
            </div>
          </article>
          <article class="b-coral span-5">
            <h3>Process View</h3>
            <p>Drafts, pastes, sources, and time. Facts, not a % score.</p>
            <div class="art" aria-hidden="true"><div class="mini-grid">
              <div class="mini"><b>3</b>drafts</div><div class="mini"><b>1h 35m</b>writing</div><div class="mini"><b>2</b>sources</div></div></div>
          </article>
          <article class="b-sky span-5">
            <h3>Understanding Check</h3>
            <p>Quick questions made from the student’s own work.</p>
            <div class="art" aria-hidden="true">
              <div class="mini"><span class="ic" style="background:var(--okbg)">✓</span>Understands</div>
              <div class="mini"><span class="ic" style="background:var(--warnbg)">~</span>Partly</div>
            </div>
          </article>
          <article class="b-yellow span-7">
            <h3>Evidence Game</h3>
            <p>A 10-minute class game. Inspect the cards, then decide.</p>
            <div class="art" aria-hidden="true"><div class="verdict-row"><span>✅ Supported</span><span>❔ Unverified</span><span class="on">⚠️ Misleading</span></div></div>
          </article>
        </div>
      </section>

      <section class="section" id="how" aria-labelledby="h-h">
        <h2 class="section-title center" id="h-h">Fair grading in four steps</h2>
        <p class="section-lede center">About five minutes per submission.</p>
        <ol class="circles" style="list-style:none;padding:0;margin:0 auto">
          <li class="circle c-coral"><span class="n">01</span><b>Set the rule</b><span>Teacher</span></li>
          <li class="circle c-yellow"><span class="n">02</span><b>Think first</b><span>Student</span></li>
          <li class="circle c-sky"><span class="n">03</span><b>See the process</b><span>Teacher</span></li>
          <li class="circle c-navy"><span class="n">04</span><b>Decide fairly</b><span>Teacher</span></li>
        </ol>
      </section>

      <section class="section" id="tanong" aria-labelledby="t-h">
        <h2 class="section-title center" id="t-h">Six questions for any claim</h2>
        <p class="section-lede center">T.A.N.O.N.G. works in every subject.</p>
        <div class="tanong-strip">${TANONG.map(([l, n]) => `<div><b>${l}</b><span>${n}</span></div>`).join('')}</div>
      </section>

      <section class="cta" aria-labelledby="cta-h">
        <img class="mascot" src="assets/muni.svg" alt="">
        <h2 id="cta-h">Isip muna. Try it in one minute.</h2>
        <p>Open a sample class with real student work.</p>
        <div class="btnrow" style="justify-content:center"><button class="btn white lg" data-act="loadSample" style="flex:0 1 auto">Open sample class</button></div>
      </section>

      <footer class="sitefoot">
        <span class="brand"><img src="assets/wordmark.svg" alt="Muna"></span>
        <span>Think First, Learn for Real · Prototype: your data stays in this browser.</span>
      </footer>
    </div>`;
  }
});

function phoneProcess() {
  return `<div class="phone tilt-l" aria-hidden="true"><div class="screen"><div class="notch"></div>
    <div class="ph-top"><span style="opacity:.8">Process View</span><b>Bea Dela Cruz</b></div>
    <div class="ph-body">
      <div class="ph-row"><div class="ph-stat"><b>3</b><span>drafts</span></div><div class="ph-stat"><b>2</b><span>sources</span></div><div class="ph-stat"><b>95m</b><span>writing</span></div></div>
      <div class="ph-card"><b>How the work grew</b><div class="ph-bars"><i style="height:22%;background:var(--soft)"></i><i style="height:28%"></i><i style="height:40%"></i><i class="y" style="height:62%"></i><i class="y" style="height:78%"></i><i class="y" style="height:100%"></i></div></div>
      <div class="ph-card"><b>Understanding Check</b><div class="ph-line"></div><div class="ph-line w80"></div><div class="ph-line w60"></div></div>
      <div class="ph-row" style="margin-top:auto"><div class="ph-btn" style="flex:1;background:var(--coral);color:#fff">Accept</div><div class="ph-btn" style="flex:1;background:var(--yellow)">Ask</div></div>
    </div></div></div>`;
}
function phoneGame() {
  return `<div class="phone tilt-r" aria-hidden="true"><div class="screen"><div class="notch"></div>
    <div class="ph-top" style="background:var(--navy)"><span style="opacity:.8">Evidence Game · 4821</span><b>“No classes tomorrow!”</b></div>
    <div class="ph-body">
      <div class="ph-row"><div class="ph-card" style="flex:1;background:#FDE2DF"><b>FB post</b>2.4K shares</div><div class="ph-card" style="flex:1;background:var(--warnbg)"><b>Screenshot</b>Dated last year</div></div>
      <div class="ph-row"><div class="ph-card" style="flex:1;background:var(--infobg)"><b>City page</b>Classes continue</div><div class="ph-card" style="flex:1;background:var(--okbg)"><b>PAGASA</b>No signal</div></div>
      <div class="ph-btn" style="background:#fff">✅ Supported</div><div class="ph-btn" style="background:#fff">❔ Unverified</div><div class="ph-btn" style="background:var(--navy);color:#fff">⚠️ Misleading</div>
    </div></div></div>`;
}

/* ================================================================ sign in: pick a role */
addRoute('start/:role?', {
  role: null,
  render(p) {
    if (p.role === 'teacher') { if (DB.teacher) { DB.session = { role: 'teacher', studentId: null }; saveDB(); go('teacher'); return null; } go('teacher/setup'); return null; }
    if (p.role === 'student') { go('student/login'); return null; }
    return `
    <div class="center" style="margin-bottom:24px"><h1>Welcome to Muna</h1><p class="muted">Who’s using Muna?</p></div>
    <div class="roles">
      <a class="role t" href="#/start/teacher"><h2>Teacher</h2><p>${DB.teacher ? `Continue as ${esc(DB.teacher.name)}` : 'Set up your classes'}</p><span class="go">Continue →</span><img src="assets/wordmark.svg" alt="" style="width:170px;right:16px;bottom:20px"></a>
      <a class="role s" href="#/start/student"><h2>Student</h2><p>Join with a class code</p><span class="go">Continue →</span><img src="assets/muni.svg" alt=""></a>
    </div>
    <p class="center small muted" style="margin-top:24px">New here? <button class="linkbtn" data-act="loadSample">Open the sample class</button></p>`;
  }
});

/* ================================================================ data & export */
addRoute('settings', {
  role: null,
  crumbs: () => '',
  render() {
    const stu = DB.session.role === 'student' ? currentStudent() : null;
    const kb = Math.ceil(new Blob([localStorage.getItem(STORE_KEY) || '']).size / 1024);
    return `
    <div class="pagehead"><div><h1>Data</h1><p class="sub">Saved in this browser only · ${kb} KB</p></div></div>
    <div class="bigstats">
      <div class="bigstat" style="background:var(--blush)"><b>${DB.classes.length}</b><span>classes</span></div>
      <div class="bigstat" style="background:var(--skybg)"><b>${DB.students.length}</b><span>students</span></div>
      <div class="bigstat" style="background:var(--cream)"><b>${DB.submissions.length}</b><span>submissions</span></div>
    </div>
    <section class="card">
      <h2>Move to another device</h2>
      <p class="small muted">${stu ? 'Export your work and send the file to your teacher.' : 'Export a file, then import it on the other device.'}</p>
      <div class="btnrow">
        ${stu ? `<button class="btn coral" data-act="exportMine">Export my work</button>` : `<button class="btn coral" data-act="exportAll">Export all</button>`}
        <button class="btn ghost" data-act="importFile">Import file</button>
      </div>
    </section>
    <section class="card">
      <h2>Start over</h2>
      <button class="btn danger" data-act="resetAll">Erase all data</button>
    </section>`;
  }
});
