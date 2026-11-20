// Leonida Legend — tracker logic for the GTA 6 trophy guide.
// Plain ES module, no libraries, no network calls beyond this app's own
// data file. Progress lives in localStorage under the keys below and can
// be exported to / imported from a small JSON file on the Save view.

const EARNED_KEY = 'leonida-legend-rebuild-earned-v1';
const SPOILER_KEY = 'leonida-legend-rebuild-spoilers-v1';
const DATA_URL = 'data/trophies.json';

const ROADMAP_STAGES = [
  {
    title: 'Stage 1 — The story, with two warnings in your pocket',
    text: 'Play the campaign straight through: the opening mission, Chapters 1 to 4 and the final mission, plus the named story missions in between. Before big decisions, keep a rotating manual save — that is the whole defence for Actions Speak Louder — and when a first attempt is scripted to go wrong, let it happen instead of reloading: that is the whole defence for Bad Luck, I Guess. Everything else on the list can still be earned afterwards, as far as the official descriptions state.',
    trophies: ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'Actions Speak Louder', 'Bad Luck, I Guess'],
  },
  {
    title: 'Stage 2 — Strands and one-of-each activities',
    text: 'Clear the stranger strands (Andy, Kenton, Billy, Randy, Tyrone, and three more for Strangers & Freaks) and sample every activity type once for Master of None. Bret\'s hunt and Cal\'s fishing challenge belong here too, while their givers are already on your map.',
    trophies: ['Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!', 'Strangers & Freaks', 'Master of None', 'Fair Game', 'Baited My Tackle', 'Stick Fiddler'],
  },
  {
    title: 'Stage 3 — Robberies, races and the partner trophies',
    text: 'The repeatable set pieces: vaults, trucks, shops, the jewelry store, gang operations, and the race wins. Partner up for Hot Together and Retail Therapy while the wanted-level routines are fresh, and bank Gunslinger, Sneakthief and Ten Pin on the way.',
    trophies: ['Maximum Withdrawal', 'A Classic Blitz Play', 'Sneakthief', 'Pest Control', 'Retail Therapy', 'Hot Together', 'Personal Best', 'Gunslinger', 'Ten Pin', 'Earn Cash, Not Kudos', 'Top Fun', 'One Last Thing'],
  },
  {
    title: 'Stage 4 — The great Leonida sweep',
    text: 'Explore the whole state once, properly, and let four counters ride on the same tour: meditation spots, WAiNK locations, stunt spots and card sets, plus the vehicles you discover and register as you go. Finish with the Shooting Range golds, challenge by challenge.',
    trophies: ['The Goodtime State', 'Positive Mental Attitude', 'You WAiNKer!', 'Cunning Stunts', "Don't Touch My Deck", 'Whip It Good', 'On the Spot', 'The Shootist', 'Catch Me If You Can', 'Challenging Tank', 'In The Beginning…', 'Capital Offense', 'Let’s Go Bowling', 'The Truth Is Out There'],
  },
  {
    title: 'Stage 5 — Money, property, 100%, platinum',
    text: 'Close with the money: launder Marked Bills through your contacts, spend across the shops, and buy every garage. When the in-game counter reads 100%, A Long Road lands — and Vice Got a Price! follows on its own.',
    trophies: ['Dime on the Dollar', 'Treat Yo Self', 'Little Boxes', 'A Long Road', 'Vice Got a Price!'],
  },
];

let trophies = [];
let earned = loadEarned();
let spoilerShield = loadSpoiler();
let kindFilter = 'all';
let selectedName = null;

const $ = (id) => document.getElementById(id);

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}

function loadSpoiler() {
  try { return JSON.parse(localStorage.getItem(SPOILER_KEY) || 'false') === true; }
  catch { return false; }
}

function persist() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, JSON.stringify(spoilerShield));
}

function isStory(t) { return (t.tags || [t.kind]).includes('story'); }
function isMissable(t) { return t.missable === true; }
function matchesKind(t) {
  if (kindFilter === 'all') return true;
  if (kindFilter === 'missable') return isMissable(t);
  return (t.tags || [t.kind]).includes(kindFilter) || t.kind === kindFilter;
}
function isMasked(t) { return spoilerShield && isStory(t) && !earned.has(t.name); }
function displayName(t) { return isMasked(t) ? 'Hidden story trophy' : t.name; }
function displayDesc(t) { return isMasked(t) ? 'Name and description hidden by the spoiler shield until earned.' : t.description; }

function currentView() {
  const h = (location.hash || '#checklist').replace('#', '');
  return ['roadmap', 'missables', 'save'].includes(h) ? h : 'checklist';
}

function showView() {
  const view = currentView();
  for (const name of ['checklist', 'roadmap', 'missables', 'save']) {
    $('view-' + name).hidden = name !== view;
    $('tab-' + name).classList.toggle('active', name === view);
  }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}

function renderProgress() {
  $('earned-count').textContent = String(earned.size);
  $('progress-fill').style.width = (trophies.length ? (earned.size / trophies.length) * 100 : 0) + '%';
}

function renderList() {
  const query = $('search-input').value.trim().toLowerCase();
  const grade = $('grade-filter').value;
  const earnedOnly = $('earned-only-toggle').checked;
  const list = $('trophy-list');
  list.textContent = '';
  let shown = 0;
  for (const t of trophies) {
    if (!matchesKind(t)) continue;
    if (grade !== 'all' && t.grade !== grade) continue;
    if (earnedOnly && !earned.has(t.name)) continue;
    if (query) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
      if (!hay.includes(query)) continue;
    }
    shown++;
    const row = document.createElement('button');
    row.className = 'trophy-row' + (earned.has(t.name) ? ' earned' : '') + (t.name === selectedName ? ' selected' : '');
    row.dataset.name = t.name;
    const check = document.createElement('input');
    check.type = 'checkbox'; check.className = 'trophy-check'; check.checked = earned.has(t.name);
    check.addEventListener('click', (ev) => ev.stopPropagation());
    check.addEventListener('change', () => toggleEarned(t.name));
    const main = document.createElement('span'); main.className = 'trophy-main';
    const name = document.createElement('span'); name.className = 'trophy-name'; name.textContent = displayName(t);
    const desc = document.createElement('span'); desc.className = 'trophy-desc'; desc.textContent = displayDesc(t);
    const meta = document.createElement('span'); meta.className = 'trophy-meta';
    meta.append(chip('grade-' + t.grade, t.grade), chip('', t.kind));
    if (isMissable(t)) meta.append(chip('missable', 'missable — read first'));
    if (t.hidden) meta.append(chip('hidden-chip', 'hidden on PSN'));
    if (t.target) meta.append(chip('', 'target: ' + t.target));
    main.append(name, desc, meta);
    row.append(check, main);
    row.addEventListener('click', () => { selectedName = t.name; renderList(); renderDetail(); });
    list.append(row);
  }
  $('result-count').textContent = shown + ' of ' + trophies.length + ' trophies shown · ' + earned.size + ' earned';
}

function chip(cls, text) {
  const s = document.createElement('span');
  s.className = 'chip ' + cls; s.textContent = text; return s;
}

function toggleEarned(name) {
  if (earned.has(name)) earned.delete(name); else earned.add(name);
  persist(); renderProgress(); renderList(); renderDetail();
}

function renderDetail() {
  const t = trophies.find((x) => x.name === selectedName);
  $('detail-empty').hidden = !!t;
  $('detail-content').hidden = !t;
  if (!t) return;
  $('detail-grade').textContent = t.grade;
  $('detail-kind').textContent = '· ' + t.kind;
  $('detail-flags').textContent = (isMissable(t) ? '· MISSABLE — READ FIRST' : '') + (t.hidden ? '· hidden on PSN' : '');
  $('detail-name').textContent = displayName(t);
  $('detail-description').textContent = '“' + displayDesc(t) + '” — official description';
  $('detail-earned').checked = earned.has(t.name);
  $('detail-guide').textContent = isMasked(t)
    ? 'The guide for this story trophy is hidden by the spoiler shield until the trophy is earned.'
    : t.guide;
  const steps = $('detail-steps'); steps.textContent = '';
  if (!isMasked(t)) for (const step of t.steps || []) {
    const li = document.createElement('li'); li.textContent = step; steps.append(li);
  }
  const sources = $('detail-sources'); sources.textContent = '';
  for (const source of t.sources || []) {
    const li = document.createElement('li'); li.textContent = source; sources.append(li);
  }
  $('detail-target').textContent = t.target ? 'Tracked target: ' + t.target : '';
}

function renderRoadmap() {
  const wrap = $('roadmap-stages'); wrap.textContent = '';
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('article'); card.className = 'roadmap-stage';
    const h = document.createElement('h3'); h.textContent = stage.title;
    const p = document.createElement('p'); p.textContent = stage.text;
    const chips = document.createElement('div'); chips.className = 'stage-chips';
    for (const name of stage.trophies) {
      const b = document.createElement('button');
      b.className = 'stage-chip' + (earned.has(name) ? ' done' : '');
      b.textContent = (earned.has(name) ? '✓ ' : '') + name;
      b.addEventListener('click', () => { selectedName = name; location.hash = '#checklist'; showView(); renderList(); renderDetail(); });
      chips.append(b);
    }
    card.append(h, p, chips); wrap.append(card);
  }
}

function renderMissables() {
  const wrap = $('missable-list'); wrap.textContent = '';
  for (const t of trophies.filter(isMissable)) {
    const card = document.createElement('article'); card.className = 'missable-card';
    const h = document.createElement('h3'); h.textContent = t.name + ' — ' + t.grade;
    const warn = document.createElement('p'); warn.className = 'missable-warning';
    warn.textContent = 'Potentially missable — flagged from the official description; not confirmed by the official list.';
    const desc = document.createElement('p'); desc.textContent = 'Official description: “' + t.description + '”';
    const guide = document.createElement('p'); guide.textContent = t.guide;
    const src = document.createElement('p'); src.textContent = 'Sources: ' + (t.sources || []).join(' · ');
    const open = document.createElement('button');
    open.className = 'stage-chip'; open.textContent = 'Open in the checklist';
    open.addEventListener('click', () => { selectedName = t.name; location.hash = '#checklist'; showView(); renderList(); renderDetail(); });
    card.append(h, warn, desc, guide, src, open); wrap.append(card);
  }
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, earned: [...earned] }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'leonida-legend-progress.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  $('save-status').textContent = 'Exported ' + earned.size + ' earned trophies.';
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const names = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(names)) throw new Error('no earned list');
      const valid = new Set(trophies.map((t) => t.name));
      earned = new Set(names.filter((n) => valid.has(n)));
      persist(); renderProgress(); renderList(); renderDetail();
      $('save-status').textContent = 'Imported: ' + earned.size + ' earned trophies restored.';
    } catch {
      $('save-status').textContent = 'That file could not be read as a progress export.';
    }
  };
  reader.readAsText(file);
}

function wireControls() {
  $('search-input').addEventListener('input', renderList);
  $('grade-filter').addEventListener('change', renderList);
  $('earned-only-toggle').addEventListener('change', renderList);
  for (const btn of document.querySelectorAll('.kind-filter')) {
    btn.addEventListener('click', () => {
      kindFilter = btn.dataset.kind;
      for (const b of document.querySelectorAll('.kind-filter')) b.classList.toggle('active', b === btn);
      renderList();
    });
  }
  document.querySelector('[data-kind="all"]').classList.add('active');
  const syncSpoiler = (on) => {
    spoilerShield = on; persist();
    $('spoiler-toggle').checked = on; $('settings-spoiler-toggle').checked = on;
    renderList(); renderDetail();
  };
  $('spoiler-toggle').addEventListener('change', () => syncSpoiler($('spoiler-toggle').checked));
  $('settings-spoiler-toggle').addEventListener('change', () => syncSpoiler($('settings-spoiler-toggle').checked));
  $('spoiler-toggle').checked = spoilerShield;
  $('settings-spoiler-toggle').checked = spoilerShield;
  $('detail-earned').addEventListener('change', () => { if (selectedName) toggleEarned(selectedName); });
  $('export-button').addEventListener('click', exportProgress);
  $('import-input').addEventListener('change', () => {
    if ($('import-input').files[0]) importProgress($('import-input').files[0]);
  });
  $('reset-button').addEventListener('click', () => {
    earned = new Set(); persist(); renderProgress(); renderList(); renderDetail();
    $('save-status').textContent = 'Progress reset.';
  });
  window.addEventListener('hashchange', showView);
}

async function boot() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  trophies = data.trophies;
  wireControls();
  renderProgress(); renderList(); showView();
}

boot();
