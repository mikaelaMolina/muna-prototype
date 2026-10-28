/* Muna prototype · Evidence Game visuals.
   Each evidence card is drawn as the thing it is: a Facebook-style post, a photo of a paper order, a weather
   bulletin with a map, a group chat, a chatbot window, and so on. Pure HTML/CSS/SVG, no images to load.
   All scenario text goes through esc(). */
'use strict';

const svgI = (inner, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
const st = (d, w = 2) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ---------- icons used inside the game (all Lucide, see icons.js) ---------- */
const GI = {
  check: ic('check'), x: ic('x'), flame: ic('flame'), bolt: ic('zap'), search: ic('search'), bulb: ic('lightbulb'),
  lock: ic('lock'), like: ic('thumbs-up'), thumbUp: ic('thumbs-up'), thumbDown: ic('thumbs-down'), ban: ic('ban'),
  comment: ic('message-square'), share: ic('forward'), globe: ic('globe'), forward: ic('forward'), link: ic('unlink'),
  sparkle: ic('sparkles'), scissors: ic('scissors'), arrow: ic('arrow-right'), heart: ic('heart'), repeat: ic('repeat-2'),
  verified: ic('badge-check', 'verified'), trophy: ic('trophy'), target: ic('target'), star: ic('star'), play: ic('play'),
  list: ic('list-checks'), keyboard: ic('keyboard')
};

/* ---------- card-type icons (used for thumbnails and lists) ---------- */
const KIND_ICON = {
  social: 'users', doc: 'file-text', weather: 'cloud-rain', chat: 'messages-square', ai: 'bot', book: 'book-open',
  news: 'newspaper', note: 'lightbulb', headline: 'image', blog: 'app-window', search: 'search', comments: 'message-square',
  radio: 'radio', meme: 'laugh'
};
const kindIcon = kind => `<span class="kic k-${esc(kind || 'note')}" aria-hidden="true">${ic(KIND_ICON[kind] || 'lightbulb')}</span>`;

/* ---------- reusable drawings ---------- */
const av = (txt, color) => `<span class="av" style="background:${esc(color)}" aria-hidden="true">${esc(txt)}</span>`;
const SEAL = svgI('<circle cx="20" cy="20" r="18" fill="#1F4E79"/><circle cx="20" cy="20" r="13" fill="none" stroke="#F7D449" stroke-width="2"/><path d="M20 10l2.6 6.2 6.7.5-5.1 4.4 1.6 6.5L20 24l-5.8 3.6 1.6-6.5-5.1-4.4 6.7-.5z" fill="#F7D449"/>', '0 0 40 40');
const SIGN = svgI('<path d="M4 26c6-14 10-18 12-14s-6 14-2 13 8-16 12-14-2 12 2 12 6-8 10-8 4 6 8 4 6-4 10-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>', '0 0 110 34');
const LINES = (...w) => `<span class="lines" aria-hidden="true">${w.map(x => `<i style="width:${x}%"></i>`).join('')}</span>`;

function cebuMap(signal) {
  const land = signal ? '#FFC800' : '#A5ED6E', edge = signal ? '#E0A800' : '#58A700';
  const sky = signal
    ? `<g fill="none" stroke="#1899D6" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M78 26c10 0 16-4 22-2"/><path d="M84 36c8 0 12-3 18-1"/><path d="M8 104c8 0 12-3 18-1"/></g>
       <circle cx="58" cy="66" r="14" fill="#FF4B4B" stroke="#fff" stroke-width="3"/><text x="58" y="72" text-anchor="middle" font-size="17" font-weight="900" fill="#fff" font-family="Nunito, sans-serif">${Number(signal)}</text>`
    : `<g transform="translate(76 14)"><path d="M7 22a7.5 7.5 0 0 1 1-15 10.5 10.5 0 0 1 20 2.4A6.4 6.4 0 0 1 28 22z" fill="#fff" stroke="#1899D6" stroke-width="2.4"/><path d="M11 27l-2 5M18 27l-2 5M25 27l-2 5" stroke="#1CB0F6" stroke-width="2.6" stroke-linecap="round"/></g>`;
  return `<svg class="wx-map" viewBox="0 0 120 140" aria-hidden="true" focusable="false">
    <rect width="120" height="140" rx="16" fill="#DDF4FF"/>
    <path d="M16 34c8-5 15 1 16 11s-2 26-6 38-9 22-14 20-3-18-1-30 0-35 5-39z" fill="#D7EFC6"/>
    <path d="M88 80c8-3 17 2 16 9s-10 11-17 9-7-15 1-18z" fill="#D7EFC6"/>
    <path d="M70 10c7 1 9 10 6 21-3 13-9 28-15 44-5 16-11 33-18 47-3 6-10 8-11 1-1-11 6-28 12-44 6-17 12-34 17-50 2-12 4-20 9-19z" fill="${land}" stroke="${edge}" stroke-width="2.4"/>
    ${sky}
    <circle cx="54" cy="88" r="3.4" fill="#3C3C3C"/><text x="60" y="98" font-size="9" font-weight="800" fill="#3C3C3C" font-family="Nunito, sans-serif">Cebu City</text>
  </svg>`;
}
const islands = count => `<svg class="isl" viewBox="0 0 320 120" aria-hidden="true" focusable="false">
  <rect width="320" height="120" fill="#2FB5EE"/><rect y="60" width="320" height="60" fill="#1CA3E0"/>
  <g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"><path d="M14 30q8-6 16 0t16 0"/><path d="M240 96q8-6 16 0t16 0"/><path d="M150 106q8-6 16 0t16 0"/></g>
  <g fill="#A5ED6E" stroke="#58A700" stroke-width="2"><path d="M60 22c14-6 26 4 22 18s-18 30-28 26-8-38 6-44z"/><path d="M120 52c10-2 16 6 12 14s-14 10-18 4-4-16 6-18z"/><path d="M168 30c12-4 20 6 14 14s-16 6-18 0 0-12 4-14z"/><path d="M200 62c16-4 26 8 20 22s-24 18-28 8 0-26 8-30z"/><circle cx="104" cy="88" r="6"/><circle cx="150" cy="84" r="4"/><circle cx="246" cy="40" r="5"/><circle cx="268" cy="60" r="3.5"/><circle cx="36" cy="80" r="4"/></g>
  <rect x="226" y="10" width="84" height="30" rx="10" fill="#fff"/><text x="268" y="31" text-anchor="middle" font-size="17" font-weight="900" fill="#1F4E79" font-family="Nunito, sans-serif">${esc(count)}</text>
</svg>`;
const RADIO = `<svg viewBox="0 0 120 92" aria-hidden="true" focusable="false">
  <path d="M30 24 L92 6" stroke="#3C3C3C" stroke-width="4" stroke-linecap="round"/><circle cx="92" cy="6" r="4" fill="#3C3C3C"/>
  <rect x="6" y="24" width="108" height="64" rx="16" fill="#FF9600"/><rect x="6" y="78" width="108" height="10" rx="5" fill="#E07800"/>
  <circle cx="40" cy="56" r="21" fill="#3C3C3C"/><circle cx="40" cy="56" r="14" fill="none" stroke="#6F6F6F" stroke-width="3"/><circle cx="40" cy="56" r="6" fill="#6F6F6F"/>
  <rect x="70" y="36" width="34" height="14" rx="4" fill="#FFF4CC"/><path d="M76 40v6M82 42v4M88 38v8M94 41v5" stroke="#B35C00" stroke-width="1.6"/><path d="M85 34v18" stroke="#FF4B4B" stroke-width="2.4"/>
  <circle cx="78" cy="66" r="7" fill="#fff"/><circle cx="96" cy="66" r="7" fill="#fff"/><path d="M78 61v4M96 61v4" stroke="#3C3C3C" stroke-width="2" stroke-linecap="round"/>
</svg>`;
const CLOUD_FACE = `<svg viewBox="0 0 220 120" aria-hidden="true" focusable="false">
  <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"><path d="M150 52h56"/><path d="M158 70h44"/><path d="M152 88h34"/></g>
  <path d="M46 98a24 24 0 0 1 2-47 32 32 0 0 1 60-8 24 24 0 0 1 22 26 18 18 0 0 1-8 29z" fill="#fff" stroke="#3C3C3C" stroke-width="5" stroke-linejoin="round"/>
  <ellipse cx="72" cy="66" rx="5" ry="7" fill="#3C3C3C"/><ellipse cx="98" cy="66" rx="5" ry="7" fill="#3C3C3C"/>
  <ellipse cx="62" cy="80" rx="7" ry="4" fill="#F59AAE"/><ellipse cx="112" cy="80" rx="7" ry="4" fill="#F59AAE"/>
  <circle cx="132" cy="70" r="9" fill="#3C3C3C"/><path d="M64 54l12 4M106 54l-12 4" stroke="#3C3C3C" stroke-width="4" stroke-linecap="round"/>
</svg>`;
const EMPTY_SEARCH = `<svg viewBox="0 0 100 80" aria-hidden="true" focusable="false">
  <path d="M62 56l18 18" stroke="#AFAFAF" stroke-width="9" stroke-linecap="round"/><circle cx="44" cy="38" r="26" fill="#DDF4FF" stroke="#84D8FF" stroke-width="5"/>
  <circle cx="35" cy="34" r="3.5" fill="#1899D6"/><circle cx="53" cy="34" r="3.5" fill="#1899D6"/><path d="M34 50c5-5 15-5 20 0" fill="none" stroke="#1899D6" stroke-width="3.4" stroke-linecap="round"/>
</svg>`;
const SUNCLOUD = svgI('<circle cx="15" cy="13" r="7" fill="#FFC800"/><path d="M11 33a7 7 0 0 1 .8-14 9.5 9.5 0 0 1 18.2 2.4A5.8 5.8 0 0 1 30 33z" fill="#fff"/>', '0 0 40 40');

/* ---------- one renderer per card kind ---------- */
const ART = {
  social: (c, v) => `<div class="post">
    <div class="post-h">${av(v.av, v.color)}<div class="grow"><b>${esc(v.name || c.title)} ${v.verified ? `${GI.verified}<span class="sr-only">(verified)</span>` : ''}</b>
      <small>${v.official ? `${esc(v.official)} · ` : ''}${esc(v.time)} · ${GI.globe}</small></div><span class="post-dots" aria-hidden="true">•••</span></div>
    <p class="post-t">${esc(v.text || c.body)}</p>
    ${v.banner ? `<div class="post-img tone-${esc(v.banner.tone)}" aria-hidden="true"><span class="tag">${esc(v.banner.tag)}</span><b>${esc(v.banner.text)}</b></div>` : ''}
    <div class="post-stats"><span><i class="re re-like" aria-hidden="true">${ic('thumbs-up')}</i><i class="re re-heart" aria-hidden="true">${ic('heart')}</i> ${esc(v.reacts || '')}</span><span>${esc(v.stats || '')}</span></div>
    <div class="post-acts" aria-hidden="true"><span>${GI.like} Like</span><span>${GI.comment} Comment</span><span>${GI.share} Share</span></div></div>`,

  doc: (c, v) => `<div class="doc ${v.crop ? 'crop' : ''}">${v.crop ? `<span class="crop-tag">${GI.scissors} Cropped photo</span>` : ''}
    <div class="paper">
      <div class="doc-h"><span class="seal">${SEAL}</span><div><small>Republic of the Philippines</small><b>${esc(v.org)}</b></div></div>
      <p class="doc-label">${esc(v.label)}</p><p class="doc-head">${esc(v.head)}</p>
      <p class="doc-body">${esc(v.text || c.body)}</p>${LINES(100, 92, 60)}
      <div class="doc-sign">${SIGN}<small>${esc(v.sign || '')}</small></div>
      ${v.crop ? `<p class="doc-date">Date: <span aria-hidden="true">Sept 2▇, 20▇▇</span><span class="sr-only">hidden by the crop</span></p>` : ''}
    </div></div>`,

  weather: (c, v) => `<div class="wx">
    <div class="wx-h"><span class="wx-logo">${SUNCLOUD}</span><div><b>${esc(c.title)}</b><small>Issued ${esc(v.issued)}</small></div><span class="wx-live">Official</span></div>
    <div class="wx-main">${cebuMap(v.signal)}<div class="wx-info">
      <div class="wx-sig ${v.signal ? 'on' : ''}"><small>Wind signal</small><b>${v.signal ? `No. ${Number(v.signal)}` : 'None'}</b></div>
      <p>${esc(c.body)}</p></div></div></div>`,

  chat: (c, v) => `<div class="chat">
    <div class="chat-h">${av('G10', '#7C5CFC')}<div><b>${esc(v.group)}</b><small>${esc(v.members || '')}</small></div></div>
    <div class="chat-b">
      <div class="msg">${av(v.from[0], '#FF9600')}<div><small>${esc(v.from)}</small><p class="bub">${esc(c.body)}</p></div></div>
      ${(v.replies || []).map(([n, t], i) => `<div class="msg">${av(n[0], ['#1CB0F6', '#FF4B4B'][i % 2])}<div><small>${esc(n)}</small><p class="bub">${esc(t)}</p></div></div>`).join('')}
      <p class="chat-seen">Seen by 32</p></div></div>`,

  ai: (c, v) => `<div class="aiw">
    <div class="aiw-h"><span class="aiw-logo">${GI.sparkle}</span><b>${esc(v.bot)}</b><span class="aiw-dot" aria-hidden="true"></span><small>online</small></div>
    <div class="aiw-b"><p class="me-bub">${esc(v.q)}</p>
      <div class="bot"><span class="aiw-logo">${GI.sparkle}</span><p class="bot-bub">${esc(v.say || c.body)}</p></div>
      <span class="nosrc">${GI.link} No sources cited</span></div></div>`,

  book: (c, v) => `<div class="book">
    <div class="pg l"><small>${esc(v.subject)}</small><b>${esc(v.chapter)}</b>${LINES(100, 94, 80, 100)}${islands(v.count || '')}</div>
    <div class="pg r">${LINES(100, 86)}<p><mark class="hlt">${esc(c.body)}</mark></p>${LINES(100, 92, 100, 64)}<small class="pno">${esc(v.page)}</small></div></div>`,

  news: (c, v) => `<div class="news">${v.more ? '<span class="news-stack s1" aria-hidden="true"></span><span class="news-stack s2" aria-hidden="true"></span>' : ''}
    <div class="news-in"><p class="mast">${esc(v.outlet)}</p><p class="news-head">${esc(v.head)}</p>${islands(v.count || '')}
      <p class="news-t">${esc(c.body)}</p><small>${esc(v.when)}${v.more ? ` · +${Number(v.more)} more outlets report the same` : ''}</small></div></div>`,

  note: c => `<div class="note"><span class="tape" aria-hidden="true"></span><span class="note-ic">${GI.bulb}</span>
    <small>${esc(c.type)}</small><b>${esc(c.title)}</b><p>${esc(c.body)}</p></div>`,

  headline: (c, v) => `<div class="hlimg"><div class="hlimg-in"><span class="hl-burst" aria-hidden="true">30%</span>
    <span class="hl-tag">New study!</span><b>${esc(v.big)}</b></div>
    <div class="hl-meta"><span>${GI.heart} ${esc(v.likes)} likes</span><span>${GI.link} No link · No author</span></div></div>`,

  blog: (c, v) => `<div class="brw"><div class="brw-bar"><i></i><i></i><i></i><span class="url">${GI.lock} ${esc(v.url)}</span></div>
    <div class="brw-b"><div class="ad"><span>AD</span>${esc(v.ad)}</div><b class="brw-t">${esc(v.head)}</b>
      <p>${esc(v.text || c.body)}</p>${LINES(100, 84)}<small class="brw-by">Posted by Admin · Study Smart Tips</small></div></div>`,

  search: (c, v) => `<div class="srch"><div class="srch-bar">${GI.search}<span>${esc(v.q)}</span></div>
    <div class="srch-empty">${EMPTY_SEARCH}<b>No matching study found</b><p>${esc(c.body)}</p></div>
    <div class="srch-res" aria-hidden="true"><i style="width:56%"></i><i></i><i style="width:78%"></i></div></div>`,

  comments: (c, v) => `<div class="cmts"><p class="cmts-h">${GI.comment} ${v.list.length > 1 ? 'Top comments' : 'Reply'}</p>
    ${v.list.map((m, i) => `<div class="cmt">${av(m.name[0].toUpperCase(), ['#FF9600', '#7C5CFC', '#1CB0F6'][i % 3])}<div class="grow">
      <p class="cmt-b"><b>${esc(m.name)}</b>${m.badge ? `<span class="cbadge">${esc(m.badge)}</span>` : ''}<br>${esc(m.text || c.body)}</p>
      <small>${m.likes ? `${GI.heart} ${esc(m.likes)} · ` : ''}Reply</small></div></div>`).join('')}</div>`,

  radio: (c, v) => `<div class="radio"><div class="radio-dev">${RADIO}</div><div class="radio-info">
    <span class="live"><i aria-hidden="true"></i>LIVE</span><b>${esc(v.station)}</b><small>${esc(v.time)}</small>
    <span class="wave" aria-hidden="true">${'<i></i>'.repeat(16)}</span><p>“${esc(v.say || c.body)}”</p><small>${esc(c.body)}</small></div></div>`,

  meme: (c, v) => `<div class="meme"><p class="mt">${esc(v.top)}</p>${CLOUD_FACE}<p class="mt">${esc(v.bottom)}</p></div>`
};

/** Draw one evidence card as a picture. */
function gmArt(sc, c) {
  const kind = ART[c.kind] ? c.kind : 'note';
  return `<figure class="art art-${kind}">${ART[kind](c, c.v || {}, sc)}<figcaption class="sr-only">${esc(c.type)}: ${esc(c.title)}</figcaption></figure>`;
}
