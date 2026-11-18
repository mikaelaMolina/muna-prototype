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
      <p class="hero-try">Just looking? <button class="linkbtn" data-act="loadSample">Open the sample class ${ic('arrow-right')}</button></p>
      <ul class="hero-trust" aria-label="About this prototype">
        <li>${ic('check')} Free, no sign-up</li><li>${ic('check')} Data stays in your browser</li><li>${ic('check')} Works on phones</li>
      </ul>
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

      <section class="section" id="why" aria-labelledby="w-h">
        <h2 class="section-title center" id="w-h">Why not an AI detector?</h2>
        <p class="section-lede center">Detectors guess. Muna shows you what happened, so you can ask the right question.</p>
        <div class="compare">
          <article class="cmp cmp-bad" aria-labelledby="cmp-a">
            <p class="cmp-tag">AI detector</p>
            <h3 id="cmp-a">A score with no reasons</h3>
            <div class="cmp-gauge" aria-hidden="true"><b>73%</b><span>“Likely AI”</span></div>
            <ul>
              <li>${ic('x')} One number, no evidence behind it</li>
              <li>${ic('x')} Flags honest students, especially second-language writers</li>
              <li>${ic('x')} Students can’t explain or respond</li>
            </ul>
          </article>
          <article class="cmp cmp-good" aria-labelledby="cmp-b">
            <p class="cmp-tag">Muna</p>
            <h3 id="cmp-b">The story of how it was made</h3>
            <div class="cmp-bars" aria-hidden="true"><i style="height:30%"></i><i style="height:45%"></i><i style="height:62%"></i><i class="y" style="height:80%"></i><i class="y" style="height:100%"></i></div>
            <ul>
              <li>${ic('check')} Drafts, writing time, labeled pastes, and sources</li>
              <li>${ic('check')} Questions made from the student’s own work</li>
              <li>${ic('check')} Students can reply, and you make the final call</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section" id="features" aria-labelledby="f-h">
        <h2 class="section-title" id="f-h">One classroom.<br>Everything you need.</h2>
        <div class="bento">
          <article class="b-navy span-7">
            <h3>Clear AI rules for every task</h3>
            <p>Prohibited, allowed, or required. Students see it before they start.</p>
            <div class="art" aria-hidden="true">
              <div class="mini"><span class="ic" style="background:var(--badbg);color:var(--bad)">${ic('ban')}</span><b>AI prohibited</b></div>
              <div class="mini sel"><span class="ic" style="background:var(--infobg);color:var(--info)">${ic('compass')}</span><b>AI allowed for specific roles</b></div>
              <div class="mini"><span class="ic" style="background:var(--warnbg);color:var(--warn)">${ic('bot')}</span><b>AI required</b></div>
            </div>
          </article>
          <article class="b-coral span-5">
            <h3>Process View</h3>
            <p>Drafts, pastes, sources, and time. Facts, not a % score.</p>
            <div class="art" aria-hidden="true">
              <div class="mini mini-chart"><span class="mc-label">How the work grew</span><span class="mc-bars"><i style="height:24%"></i><i style="height:36%"></i><i style="height:48%"></i><i class="y" style="height:66%"></i><i class="y" style="height:82%"></i><i class="y" style="height:100%"></i></span></div>
              <div class="mini-grid">
              <div class="mini"><b>3</b>drafts</div><div class="mini"><b>1h 35m</b>writing</div><div class="mini"><b>2</b>sources</div></div></div>
          </article>
          <article class="b-sky span-5">
            <h3>Understanding Check</h3>
            <p>Quick questions made from the student’s own work.</p>
            <div class="art" aria-hidden="true">
              <div class="mini"><span class="ic" style="background:var(--okbg);color:var(--ok)">${ic('check')}</span>Understands</div>
              <div class="mini"><span class="ic" style="background:var(--warnbg)">~</span>Partly</div>
            </div>
          </article>
          <article class="b-yellow span-7">
            <h3>Evidence Game</h3>
            <p>A 10-minute class game. Inspect the cards, then decide.</p>
            <div class="art" aria-hidden="true"><div class="mini mini-claim"><span class="ic" style="background:var(--badbg);color:var(--bad)">${ic('newspaper')}</span><span><b>“Walang pasok bukas!”</b><br>Shared 2.4K times · Is it true?</span></div><div class="verdict-row"><span>${ic('shield-check')} Supported</span><span>${ic('circle-help')} Unverified</span><span class="on">${ic('triangle-alert')} Misleading</span></div></div>
          </article>
        </div>
      </section>

      <section class="section" id="how" aria-labelledby="h-h">
        <h2 class="section-title center" id="h-h">Fair grading in four steps</h2>
        <p class="section-lede center">About five minutes per submission.</p>
        <ol class="circles">
          ${[['c-coral', 'Set the rule', 'Teacher', 'Choose if AI is off, limited to certain uses, or required.'],
             ['c-yellow', 'Think first', 'Student', 'Students write what they already know before they search.'],
             ['c-sky', 'See the process', 'Teacher', 'Drafts, pastes, sources, and answers in one view.'],
             ['c-navy', 'Decide fairly', 'Teacher', 'Accept, ask a follow-up, or raise a concern they can answer.']]
            .map(([c, t, who, d], i) => `<li><div class="circle ${c}"><span class="n">0${i + 1}</span><b>${t}</b><span>${who}</span></div><p>${d}</p></li>`).join('')}
        </ol>
      </section>

      <section class="section" id="tanong" aria-labelledby="t-h">
        <h2 class="section-title center" id="t-h">Six questions for any claim</h2>
        <p class="section-lede center">T.A.N.O.N.G. works in every subject.</p>
        <ol class="tanong-strip">${TANONG.map(([l, n, q]) => `<li><b aria-hidden="true">${l}</b><span>${n}</span><small>${q}</small></li>`).join('')}</ol>
      </section>

      <section class="section" id="faq" aria-labelledby="q-h">
        <h2 class="section-title center" id="q-h">Questions teachers ask</h2>
        <div class="faq">
          <details><summary>Does Muna tell me if a student used AI?${ic('chevron-down', 'chev')}</summary><p>No. Muna never gives a “% AI” score. It shows how the work was made and what the student says about it, so you can talk with them and decide.</p></details>
          <details><summary>Where is the data saved?${ic('chevron-down', 'chev')}</summary><p>In this browser only. Nothing is sent to a server. To move work between devices, you export a file and import it on the other device.</p></details>
          <details><summary>Do students need an account or email?${ic('chevron-down', 'chev')}</summary><p>No. Students join with a class code and their name.</p></details>
          <details><summary>Can I use my DepEd grading system?${ic('chevron-down', 'chev')}</summary><p>Yes. Pick a DepEd preset (with transmutation) or set your own components and weights for each class.</p></details>
        </div>
      </section>

      <section class="cta" aria-labelledby="cta-h">
        <img class="mascot" src="assets/muni.svg" alt="">
        <h2 id="cta-h">Isip muna. Try it in one minute.</h2>
        <p>Open a sample class with real student work.</p>
        <div class="btnrow" style="justify-content:center"><button class="btn white lg" data-act="loadSample" style="flex:0 1 auto">Open sample class</button></div>
      </section>

      <footer class="sitefoot">
        <div><span class="brand"><img src="assets/wordmark.svg" alt="Muna"></span><p>Think First, Learn for Real.<br>Prototype: your data stays in this browser.</p></div>
        <nav class="footlinks" aria-label="Footer">
          <a href="#/start/teacher">Teacher sign in</a><a href="#/start/student">Join a class</a><button class="linkbtn" data-act="loadSample">Sample class</button><a href="#/settings">Data &amp; export</a>
        </nav>
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
      <div class="ph-btn" style="background:#fff">${ic('shield-check')} Supported</div><div class="ph-btn" style="background:#fff">${ic('circle-help')} Unverified</div><div class="ph-btn" style="background:var(--navy);color:#fff">${ic('triangle-alert')} Misleading</div>
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
      <a class="role t" href="#/start/teacher"><h2>Teacher</h2><p>${DB.teacher ? `Continue as ${esc(DB.teacher.name)}` : 'Set up your classes'}</p><span class="go">Continue ${ic('arrow-right')}</span><img src="assets/wordmark.svg" alt="" style="width:170px;right:16px;bottom:20px"></a>
      <a class="role s" href="#/start/student"><h2>Student</h2><p>Join with a class code</p><span class="go">Continue ${ic('arrow-right')}</span><img src="assets/muni.svg" alt=""></a>
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
