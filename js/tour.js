/* Muna prototype · spotlight tour
   Dims the screen, cuts a hole around one real element, and shows a short tip next to it.
   startTour([{ target, title, body }], onEnd)
     target: CSS selector list; the first *visible* match is used, so one step can point at the
             desktop nav link or the phone tab bar. Leave it out for a centered welcome card.
   Keys: Esc closes, Left/Right move between steps. Any way of leaving the tour calls onEnd once. */
'use strict';

let TOUR = null; // { steps, i, onEnd, ret }
const isVisible = el => !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
const tourTarget = st => st && st.target ? $$(st.target).find(isVisible) || null : null;

function startTour(steps, onEnd) {
  endTour(false);
  // Drop steps whose element isn't on this screen (for example, no classes yet).
  steps = steps.filter(st => !st.target || tourTarget(st));
  if (!steps.length) return;
  TOUR = { steps, i: 0, onEnd, ret: document.activeElement };
  document.body.insertAdjacentHTML('beforeend', `<div class="tour" id="tour">
    <div class="tour-hole" aria-hidden="true"></div>
    <div class="tour-tip" role="dialog" aria-modal="true" aria-labelledby="tourT" aria-describedby="tourB"></div></div>`);
  document.body.classList.add('touring');
  window.addEventListener('resize', positionTour);
  window.addEventListener('scroll', positionTour, true);
  showTourStep();
}

function showTourStep() {
  const { steps, i } = TOUR, st = steps[i], last = i === steps.length - 1, el = tourTarget(st);
  const dots = steps.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'past' : ''}"></i>`).join('');
  $('#tour .tour-tip').innerHTML = `
    <div class="tour-head"><img src="assets/muni.svg" alt=""><span class="tour-count">${steps.length > 1 ? `${i + 1} of ${steps.length}` : ''}</span>
      <button class="iconbtn tour-x" data-act="tourEnd" aria-label="Close tour">${ic('x')}</button></div>
    <h2 id="tourT">${st.title}</h2>
    <p id="tourB">${st.body}</p>
    <div class="tour-foot">
      <span class="tour-dots" aria-hidden="true">${dots}</span>
      <span class="tour-btns">
        ${i === 0 ? (last ? '' : '<button class="linkbtn" data-act="tourEnd">Skip</button>') : `<button class="btn ghost sm" data-act="tourBack">Back</button>`}
        <button class="btn coral sm" data-act="tourNext" id="tourNextBtn">${last ? (st.doneLabel || 'Got it') : i === 0 ? (st.nextLabel || 'Show me around') : 'Next'}</button>
      </span></div>`;
  $('#tour').classList.toggle('no-target', !el);
  if (el) {
    // Bring the element into view first; fixed elements (top bar, tab bar) are already visible.
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > innerHeight - 80) el.scrollIntoView({ block: 'center' });
  }
  positionTour();
  $('#tourNextBtn').focus({ preventScroll: true });
}

function positionTour() {
  if (!TOUR) return;
  const hole = $('#tour .tour-hole'), tip = $('#tour .tour-tip'), el = tourTarget(TOUR.steps[TOUR.i]);
  const vw = document.documentElement.clientWidth, vh = innerHeight, gap = 14, pad = 6, edge = 12;
  const w = Math.min(340, vw - edge * 2);
  tip.style.width = w + 'px';
  if (!el) {
    Object.assign(hole.style, { top: vh / 2 + 'px', left: vw / 2 + 'px', width: '0px', height: '0px' });
    Object.assign(tip.style, { left: (vw - w) / 2 + 'px', top: Math.max(edge, (vh - tip.offsetHeight) / 2) + 'px' });
    tip.dataset.side = '';
    return;
  }
  const r = el.getBoundingClientRect();
  Object.assign(hole.style, { top: r.top - pad + 'px', left: r.left - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
  const h = tip.offsetHeight;
  const below = r.bottom + pad + gap, above = r.top - pad - gap - h;
  const side = below + h <= vh - edge || above < edge ? 'below' : 'above';
  let top = side === 'below' ? below : above;
  top = Math.min(Math.max(edge, top), vh - h - edge);
  const left = Math.min(Math.max(edge, r.left + r.width / 2 - w / 2), vw - w - edge);
  Object.assign(tip.style, { top: top + 'px', left: left + 'px' });
  tip.dataset.side = side;
  // Point the little arrow at the middle of the highlighted element.
  tip.style.setProperty('--arrow-x', Math.min(Math.max(18, r.left + r.width / 2 - left), w - 18) + 'px');
}

function endTour(callDone = true) {
  if (!TOUR) return;
  const { onEnd, ret } = TOUR;
  TOUR = null;
  $('#tour')?.remove();
  document.body.classList.remove('touring');
  window.removeEventListener('resize', positionTour);
  window.removeEventListener('scroll', positionTour, true);
  if (callDone && onEnd) onEnd();
  if (ret && document.contains(ret)) ret.focus({ preventScroll: true });
}

Object.assign(ACT, {
  tourNext: () => { if (!TOUR) return; if (TOUR.i >= TOUR.steps.length - 1) endTour(); else { TOUR.i++; showTourStep(); } },
  tourBack: () => { if (TOUR && TOUR.i > 0) { TOUR.i--; showTourStep(); } },
  tourEnd: () => endTour()
});

document.addEventListener('keydown', e => {
  if (!TOUR) return;
  if (e.key === 'Escape') { e.preventDefault(); endTour(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); ACT.tourNext(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); ACT.tourBack(); }
  else if (e.key === 'Tab') { // keep focus inside the tip
    const f = $$('#tour button'); if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});
// Leaving the screen (for example the browser Back button) ends the tour.
window.addEventListener('hashchange', () => endTour());
