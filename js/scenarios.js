/* Muna prototype · Evidence Game scenario library (pre-written, no live AI).
   Scenarios marked "practice" use fictional posts and events made for class practice.
   Each card practices one T.A.N.O.N.G. step.
   Card fields used by the game:
     kind  which picture to draw (see gameart.js): social, doc, weather, chat, ai, book, news, note, headline, blog, search, comments, radio, meme
     v     extra details for the picture (names, times, banner text...)
     lean  accepted answers to "What does this card tell you?": for | against | weak | context
     tip   one-line feedback shown after the student checks the card */
'use strict';

const TANONG = [['T', 'Trace', 'Where did it come from?'], ['A', 'Assess', 'What is its purpose, context, and limits?'],
  ['N', 'Nail down', 'What evidence supports it?'], ['O', 'Observe', 'What framing or context is missing?'],
  ['N', 'Notice', 'Is confidence hiding doubt?'], ['G', 'Govern', 'Accept, revise, verify, or reject.']];
const STEP_KEYS = ['Trace', 'Assess', 'Nail down', 'Observe', 'Notice', 'Govern'];

const VERDICTS = {
  supported: { label: 'Supported', icon: 'shield-check', tone: 'green', desc: 'Strong, current, official evidence backs the claim.' },
  unverified: { label: 'Unverified', icon: 'circle-help', tone: 'blue', desc: 'There is not enough evidence either way yet.' },
  misleading: { label: 'Misleading', icon: 'triangle-alert', tone: 'orange', desc: 'Evidence shows it is false, outdated, or taken out of context.' }
};
/** Verdict icon in its colored badge, e.g. vIcon('misleading'). */
const vIcon = (k, cls = '') => badge(VERDICTS[k].icon, VERDICTS[k].tone, cls);

const SCENARIOS = [
  {
    id: 'no-classes', title: 'No classes tomorrow?', practice: true, minutes: 10, icon: 'chat',
    tags: ['Media and Information Literacy', 'Araling Panlipunan', 'Any subject'],
    claim: '“Walay klase ugma sa tanang lebel sa Cebu City, ingon ni Mayor!”', claimLang: 'ceb',
    claimEn: '“No classes tomorrow at all levels in Cebu City, says the Mayor!”',
    from: 'Forwarded to your class group chat · 9:12 PM',
    cards: [
      { id: 'fb', type: 'Facebook post', title: 'Cebu Updates 24/7 page', step: 'Trace', body: '“BREAKING: Walay klase ugma! Share para mahibal-an sa tanan!”', facts: ['2.4K shares in 3 hours', 'The page was created 9 days ago', 'No link to any official source'],
        kind: 'social', v: { name: 'Cebu Updates 24/7', av: 'CU', color: '#3B5BDB', time: '3 hrs', reacts: '1.1K', stats: '386 comments · 2.4K shares', banner: { tag: 'BREAKING', text: 'Walay klase ugma!', tone: 'red' } },
        lean: ['weak'], tip: 'Shares are not sources. A 9-day-old page with no link to an official announcement is not proof.' },
      { id: 'memo', type: 'Screenshot', title: 'Photo of a city order', step: 'Observe', body: 'A photo of a signed order suspending classes in Cebu City.', facts: ['Zoom in: the order is dated last year', 'It names a typhoon that has already passed', 'Cropped so the date is hard to see'],
        kind: 'doc', v: { org: 'Office of the City Mayor', label: 'Executive Order', head: 'Suspension of classes in all levels', text: 'Due to Typhoon “Kulot,” classes in all levels, public and private, are hereby suspended in Cebu City.', sign: 'City Mayor', crop: true },
        lean: ['against'], tip: 'The order is real, but it is from last year. Old material shared as if it were new goes against the claim.' },
      { id: 'pio', type: 'Official page', title: 'City Public Information Office', step: 'Nail down', body: '6:00 PM post: “Classes will continue tomorrow. Wait for announcements on this page only.”', facts: ['Verified government page', 'Posted 3 hours before the claim spread', 'No newer post since then'],
        kind: 'social', v: { name: 'Cebu City Public Information Office', av: 'PIO', color: '#1F4E79', verified: true, official: 'Government organization', time: '6:00 PM', text: 'Classes will continue tomorrow. Wait for announcements on this page only.', reacts: '5.1K', stats: '420 comments · 1.2K shares', banner: { tag: 'ADVISORY', text: 'Classes continue tomorrow', tone: 'blue' } },
        lean: ['against'], tip: 'The verified city page says classes continue. That directly goes against the claim.' },
      { id: 'pagasa', type: 'Weather bulletin', title: 'PAGASA forecast', step: 'Assess', body: 'Light to moderate rain over Cebu. No tropical cyclone wind signal raised.', facts: ['Official weather agency', 'Issued at 5:00 PM today'],
        kind: 'weather', v: { issued: '5:00 PM today', signal: 0 },
        lean: ['against', 'context'], tip: 'No wind signal and only light rain make a citywide suspension unlikely. It adds context that goes against the claim.' },
      { id: 'gc', type: 'Group chat', title: 'Message from a classmate', step: 'Notice', body: '“100% true!! Akong tita taga City Hall, siya mismo nag-ingon.” (My aunt works at City Hall, she said it herself.)', facts: ['Very confident tone', 'No proof shared', 'Repeated by 14 classmates'],
        kind: 'chat', v: { group: 'Grade 10 · Rizal', members: '42 members', from: 'Jomar', replies: [['Kyla', 'Yesss!! Sure jud?'], ['Paolo', 'Share na dayon sa tanan!']] },
        lean: ['weak'], tip: 'A confident tone and “my tita said so” are not evidence. No proof was shared.' }
    ],
    answer: 'misleading', best: ['memo', 'pio'],
    explain: 'The order in the screenshot is real, but it is from last year. It was cropped and shared as if it were new, while the official city page says classes continue. Real material used out of context makes the claim Misleading, not just Unverified.',
    discuss: 'Why is “Misleading” a better verdict than “Unverified” here? Which single card changed your mind?'
  },
  {
    id: 'islands', title: 'How many islands?', practice: false, minutes: 10, icon: 'ai',
    tags: ['Araling Panlipunan', 'Science', 'Any subject'],
    claim: '“The Philippines has 7,107 islands.”', claimLang: 'en',
    claimEn: 'An AI chatbot gave this answer when a student asked for a fun fact for their report.',
    from: 'AI chatbot answer · used in a draft report',
    cards: [
      { id: 'ai', type: 'AI chatbot', title: 'Chatbot answer', step: 'Notice', body: '“The Philippines is an archipelago of 7,107 islands.” No source was given.', facts: ['Sounds sure of itself', 'No date or source', 'Chatbots can repeat older information they learned'],
        kind: 'ai', v: { bot: 'StudyBot', q: 'Give me a fun fact about the Philippines for my report.', say: 'Sure! The Philippines is an archipelago of 7,107 islands. That’s a fact you can use with confidence!' },
        lean: ['weak'], tip: 'The chatbot gave no source or date. A confident answer still needs checking.' },
      { id: 'book', type: 'Old textbook', title: 'Elementary textbook', step: 'Assess', body: '“Our country has 7,107 islands.”', facts: ['Printed many years ago', 'Was the commonly taught number for decades'],
        kind: 'book', v: { subject: 'Sibika at Kultura · Grade 4', chapter: 'Ang Ating Bansa', page: '12', count: '7,107' },
        lean: ['for', 'weak'], tip: 'It agrees with the claim, but the book is old. Agreement from an outdated source is weak proof.' },
      { id: 'namria', type: 'Government agency', title: 'NAMRIA announcement (2017)', step: 'Nail down', body: 'The national mapping agency reported a new count of 7,641 islands after improved mapping.', facts: ['Official mapping agency', 'Newer than the textbook', 'Explains why the number changed'],
        kind: 'doc', v: { org: 'National Mapping and Resource Information Authority', label: 'Press release · 2017', head: 'The Philippines has 7,641 islands', text: 'After improved mapping, NAMRIA reports a new official count of 7,641 islands, up from the long-used figure of 7,107.', sign: 'Administrator' },
        lean: ['against'], tip: 'The official mapping agency counted 7,641 islands. That newer number goes against 7,107.' },
      { id: 'news', type: 'News report', title: 'National news coverage', step: 'Trace', body: 'Several news outlets reported the 7,641 count and quoted NAMRIA.', facts: ['Traces back to the agency', 'Multiple outlets agree'],
        kind: 'news', v: { outlet: 'The Daily Islander', head: 'PH now has 7,641 islands, says NAMRIA', when: '2017', more: 2, count: '7,641' },
        lean: ['against'], tip: 'Several outlets trace the new number back to NAMRIA. That goes against the claim.' },
      { id: 'map', type: 'Context note', title: 'Why counts change', step: 'Observe', body: 'Better satellite mapping can find small islands that older surveys missed.', facts: ['The old number was not a lie', 'It is outdated, not current'],
        kind: 'note', lean: ['context', 'against'], tip: 'This explains why the number changed. The old count was not a lie, just outdated.' }
    ],
    answer: 'misleading', best: ['namria', 'news'],
    explain: 'The 7,107 figure was the commonly taught number, but the national mapping agency NAMRIA reported 7,641 islands in 2017. A confident AI answer repeated outdated information. Using it today without a date makes the claim Misleading.',
    discuss: 'The AI did not make up 7,107. Why is it still a problem to use it? What should you check before using an AI fact?'
  },
  {
    id: 'ai-study', title: 'AI makes you smarter?', practice: true, minutes: 10, icon: 'headline',
    tags: ['English', 'Oral Communication', 'Media and Information Literacy'],
    claim: '“New study: students who use AI score 30% higher on exams!”', claimLang: 'en',
    claimEn: 'A headline shared by an education page.',
    from: 'Shared on a study tips page · 2 days ago',
    cards: [
      { id: 'head', type: 'Headline image', title: 'Shared headline card', step: 'Trace', body: 'Bold text on a colorful background. No link, no author, no study name.', facts: ['8K likes', 'No link to the study'],
        kind: 'headline', v: { big: 'Students who use AI score 30% higher!', likes: '8K' },
        lean: ['weak'], tip: 'A bold image with no link, author, or study name is not evidence.' },
      { id: 'blog', type: 'Blog post', title: 'Study tips blog', step: 'Assess', body: '“A university found that AI users score 30% higher.” The blog sells an AI study app.', facts: ['Does not name the university', 'The writer earns from AI app sign-ups'],
        kind: 'blog', v: { url: 'studysmart-tips.blog/ai-grades', ad: 'Try StudyGenius AI. Sign up free today!', head: 'Why AI users get better grades', text: '“A university found that AI users score 30% higher.” Want the same results? Use our app!' },
        lean: ['weak'], tip: 'The writer earns money from AI app sign-ups and does not name the study. That is a reason to be careful.' },
      { id: 'search', type: 'Search results', title: 'Searching for the study', step: 'Nail down', body: 'No study with this result can be found on university or journal websites.', facts: ['Not found yet', 'That does not prove it is false'],
        kind: 'search', v: { q: 'study students AI 30% higher exam scores' },
        lean: ['context', 'weak'], tip: 'Not finding the study is a warning sign, but it does not prove the claim false.' },
      { id: 'expert', type: 'Teacher comment', title: 'A research teacher replies', step: 'Observe', body: '“Which students? Which exams? Compared to whom? Without the study, we cannot tell.”', facts: ['Points out missing details'],
        kind: 'comments', v: { list: [{ name: 'Ma’am Reyes', badge: 'Research teacher', likes: '1.3K' }] },
        lean: ['context'], tip: 'The teacher points out what is missing: which students, which exams, compared to whom.' },
      { id: 'comments', type: 'Comments', title: 'Top comments', step: 'Notice', body: '“Obviously true!” “AI is the future!”', facts: ['Many agree, none give evidence'],
        kind: 'comments', v: { list: [{ name: 'kyla.writes', text: 'Obviously true!', likes: '214' }, { name: 'jm_santos', text: 'AI is the future!', likes: '98' }, { name: 'bea.notes', text: 'Share this to everyone!!', likes: '41' }] },
        lean: ['weak'], tip: 'Lots of agreement, but nobody gives evidence. Popular is not the same as proven.' }
    ],
    answer: 'unverified', best: ['search', 'expert', 'blog'],
    explain: 'There is no study we can find, the blog has a reason to promote AI, and key details are missing. But we also have no evidence that proves it false. The fair verdict is Unverified until someone finds the actual study.',
    discuss: 'What is the difference between “I can’t find proof” and “it is false”? What would change your verdict?'
  },
  {
    id: 'signal', title: 'Signal No. 1 raised?', practice: true, minutes: 10, icon: 'weather',
    tags: ['Science', 'Disaster Readiness and Risk Reduction', 'Any subject'],
    claim: '“PAGASA raised Wind Signal No. 1 over Cebu this afternoon.”', claimLang: 'en',
    claimEn: 'Posted by your barangay page.',
    from: 'Barangay Facebook page · 3:40 PM',
    cards: [
      { id: 'brgy', type: 'Barangay page', title: 'Barangay announcement', step: 'Trace', body: '“Signal No. 1 is up per PAGASA 2 PM bulletin. Secure loose items. Check our page for updates.”', facts: ['Official barangay page', 'Names its source and time'],
        kind: 'social', v: { name: 'Barangay Lahug Official', av: 'BL', color: '#1F7A4D', official: 'Government organization', time: '3:40 PM', text: 'Signal No. 1 is up per PAGASA 2 PM bulletin. Secure loose items. Check our page for updates.', reacts: '640', stats: '58 comments · 312 shares', banner: { tag: 'WEATHER ALERT', text: 'Signal No. 1 per PAGASA', tone: 'yellow' } },
        lean: ['for'], tip: 'The barangay names its source and time, so you can check it. It backs up the claim.' },
      { id: 'bulletin', type: 'Weather bulletin', title: 'PAGASA 2 PM bulletin', step: 'Nail down', body: 'Tropical Cyclone Wind Signal No. 1 raised over Cebu, including Cebu City.', facts: ['Official weather agency', 'Matches the claim exactly', 'Most recent bulletin'],
        kind: 'weather', v: { issued: '2:00 PM today', signal: 1 },
        lean: ['for'], tip: 'The official bulletin says exactly what the claim says. That is strong support.' },
      { id: 'radio', type: 'Radio report', title: 'Local AM station', step: 'Assess', body: 'Reads the same PAGASA bulletin on air at 3 PM.', facts: ['Repeats the official source'],
        kind: 'radio', v: { station: 'Radyo Sugbo 999 AM', time: 'On air · 3:00 PM', say: 'Signal No. 1 is now up over Cebu, based on the 2 PM PAGASA bulletin…' },
        lean: ['for'], tip: 'It repeats the official bulletin, so it backs up the claim. The bulletin itself is the stronger source.' },
      { id: 'meme', type: 'Meme', title: 'Funny weather meme', step: 'Notice', body: '“Signal No. 5 na ni bes!” with a cartoon.', facts: ['A joke, not information', 'Should not be used as evidence'],
        kind: 'meme', v: { top: 'Signal No. 5 na ni bes!', bottom: 'Me after one gust of wind' },
        lean: ['weak'], tip: 'A meme is a joke, not information. Don’t use it as evidence.' },
      { id: 'note', type: 'Context note', title: 'What Signal No. 1 means', step: 'Observe', body: 'Signal No. 1 means strong winds are expected within 36 hours. It does not automatically cancel all classes.', facts: ['Helps avoid jumping to conclusions'],
        kind: 'note', lean: ['context'], tip: 'This tells you what the signal means, so you don’t jump to “no classes.”' }
    ],
    answer: 'supported', best: ['bulletin', 'brgy'],
    explain: 'The barangay post names its source, and the official PAGASA bulletin says the same thing. When current, official evidence matches the claim, the verdict is Supported. Checking still matters: the meme is not evidence, and Signal No. 1 alone does not mean “no classes.”',
    discuss: 'Not every viral claim is fake. What made this one trustworthy?'
  }
];
const scenarioById = id => SCENARIOS.find(s => s.id === id);

function scoreGamePlay(sc, play) {
  const verdictPts = play.verdict === sc.answer ? 50 : 0;
  const bestPts = sc.best.includes(play.best) ? 30 : 0;
  const cardPts = Math.round(Math.min(play.opened.length, sc.cards.length) / sc.cards.length * 20);
  return { verdictPts, bestPts, cardPts, total: verdictPts + bestPts + cardPts };
}
