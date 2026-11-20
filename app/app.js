// Leonida Legend: checklist, tracker, roadmap and cited guides for the 55 GTA 6 trophies.
// All data lives in data/trophies.json; progress lives in this browser's localStorage only.
const EARNED_KEY = 'leonida-legend-earned-v1';
const SPOILER_KEY = 'leonida-legend-spoilers-v1';
const KIND_LABELS = { story: 'Story', side: 'Side quest', collectibles: 'Collectibles', activities: 'Activities', completion: '100% completion', platinum: 'Platinum' };
const STAGES = [
  { n: 1, title: 'Step 1 — Finish the story', hours: '60–80 hours', text: 'Play the story and enjoy it. The 100% checklist is not visible until after the story, but everything you do during it already counts. There are no mission gold medals and no mission replay, so keep a save at the start and end of each chapter. Watch for the one thing that can be missed: the Chapter 1 meditation at Jason\u2019s house (see Missables).' },
  { n: 2, title: 'Step 2 — The 100% Completion checklist', hours: '~100 hours', text: 'After the story, the checklist appears under Progress, Stats, 100% Completion. It is lenient — closer to 60% true completion — and asks for any 100 optional missions, 200 of 277 vehicles scanned, 100 of 255 animals studied, 300 of 397 stunts, 15 of 18 meditations, 15 of 18 card sets and 70 of 80 challenges, plus every robbery, underwater discovery, shooting range, drone race and target deck.' },
  { n: 3, title: 'Step 3 — Strangers & Freaks and the leftovers', hours: '~10 hours', text: 'Most trophies are done by the end of Step 2. Finish the 8 Strangers & Freaks strands and sweep up whatever is left — the side questlines, the one-off secret trophies and the passive counters like Actions Speak Louder. The platinum pops with the last one.' },
];

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byName = new Map(trophies.map((t) => [t.name, t]));

let earned = new Set(readJson(EARNED_KEY, []));
let spoilerOn = readJson(SPOILER_KEY, true);
let selected = trophies.find((t) => t.name === 'Positive Mental Attitude') ?? trophies[0];
let activeView = 'checklist';

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detail');
const searchEl = $('search');
const kindEl = $('kindFilter');
const gradeEl = $('gradeFilter');
const spoilerEl = $('spoilerToggle');
const hideEarnedEl = $('hideEarned');

function readJson(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; }
}
function saveEarned() { localStorage.setItem(EARNED_KEY, JSON.stringify([...earned])); }
function saveSpoiler() { localStorage.setItem(SPOILER_KEY, JSON.stringify(spoilerOn)); }
function isSpoilerHidden(t) { return spoilerOn && t.kind === 'story' && !earned.has(t.name); }
function targetText(t) {
  if (t.target == null) return '';
  const unit = t.targetLabel ?? '';
  const num = t.target >= 1000 ? t.target.toLocaleString('en-US') : String(t.target);
  return unit ? `${num} ${unit}` : num;
}
function kindOf(t) { return KIND_LABELS[t.kind] ?? t.kind; }

function filteredTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  return trophies.filter((t) => {
    if (kind === 'missable' && !t.missable) return false;
    if (kind === 'online') return false;
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderList() {
  const rows = filteredTrophies();
  listEl.replaceChildren();
  if (kindEl.value === 'online') {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No online trophies — all 55 are single-player and offline. Nothing to filter here.';
    listEl.append(li);
  } else if (rows.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No trophies match these filters. Clear the search or widen the kind and grade.';
    listEl.append(li);
  }
  for (const t of rows) {
    const hidden = isSpoilerHidden(t);
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.name) ? ' earned' : '') + (selected === t ? ' selected' : '');
    li.dataset.name = t.name;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${hidden ? 'story trophy' : t.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveEarned(); renderAll();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    const main = document.createElement('div');
    main.className = 't-main';
    const name = document.createElement('div');
    name.className = 't-name';
    name.textContent = hidden ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = 't-desc';
    desc.textContent = hidden ? 'Complete the story to reveal this trophy.' : t.description;
    const tags = document.createElement('div');
    tags.className = 't-tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = kindOf(t);
    tags.append(kindTag);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable';
      m.textContent = 'Missable';
      tags.append(m);
    }
    if (t.target != null) {
      const g = document.createElement('span');
      g.className = 'tag target';
      g.textContent = targetText(t);
      tags.append(g);
    }
    main.append(name, desc, tags);
    const dot = document.createElement('span');
    dot.className = `medal ${t.grade}`;
    dot.title = t.grade;
    li.append(box, dot, main);
    li.addEventListener('click', () => { selected = t; renderList(); renderDetail(); syncHash(); });
    listEl.append(li);
  }
  const shown = rows.length;
  $('statusLine').textContent = kindEl.value === 'online'
    ? '0 online trophies: every trophy on this list is earned in single-player.'
    : `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned`;
}

function renderDetail() {
  const t = selected;
  const hidden = isSpoilerHidden(t);
  const isEarned = earned.has(t.name);
  detailEl.replaceChildren();
  const grade = document.createElement('div');
  grade.className = 'grade';
  grade.textContent = `${t.grade} trophy · ${kindOf(t)}${t.hidden ? ' · hidden on PSN' : ''}`;
  const h = document.createElement('h2');
  h.textContent = hidden ? 'Hidden story trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? 'Its name and description stay hidden until you earn it.' : `“${t.description}”`;
  detailEl.append(grade, h, official);
  if (t.missable) {
    const w = document.createElement('p');
    w.className = 'warn';
    w.textContent = '⚠ Potentially missable — read the guide below before you pass Chapter 1.';
    detailEl.append(w);
  }
  if (hidden) {
    const p = document.createElement('p');
    p.textContent = 'Spoilers are hidden for this trophy. Earn it in the game — or turn “Hide story spoilers” off — to see its guide.';
    detailEl.append(p);
  } else {
    const guideH = document.createElement('h3');
    guideH.textContent = 'How to get it';
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    detailEl.append(guideH, guide);
    if (t.steps?.length) {
      const stepsH = document.createElement('h3');
      stepsH.textContent = 'Steps';
      const ol = document.createElement('ol');
      for (const s of t.steps) { const li = document.createElement('li'); li.textContent = s; ol.append(li); }
      detailEl.append(stepsH, ol);
    }
    const srcH = document.createElement('h3');
    srcH.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of t.sources ?? []) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.label; a.target = '_blank'; a.rel = 'noopener';
      li.append(a);
      ul.append(li);
    }
    detailEl.append(srcH, ul);
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mark-btn' + (isEarned ? ' earned' : '');
  btn.textContent = isEarned ? '✓ Earned — click to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    saveEarned(); renderAll();
  });
  detailEl.append(btn);
}

function renderProgress() {
  const total = trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  $('earnedCount').textContent = earned.size;
  $('progressFill').style.width = `${pct}%`;
  $('progressBar').setAttribute('aria-valuenow', String(earned.size));
  $('progressText').textContent = `${pct}% to the platinum — ${total - earned.size} to go`;
  const counts = {};
  for (const t of trophies) counts[t.grade] = (counts[t.grade] ?? 0) + (earned.has(t.name) ? 1 : 0);
  $('gradeLine').textContent = `Platinum ${counts.platinum ?? 0}/1 · Gold ${counts.gold ?? 0}/2 · Silver ${counts.silver ?? 0}/6 · Bronze ${counts.bronze ?? 0}/46`;
  $('missablePill').textContent = String(trophies.filter((t) => t.missable).length);
}

function renderRoadmap() {
  const host = $('roadmapStages');
  host.replaceChildren();
  for (const stage of STAGES) {
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const hours = document.createElement('span');
    hours.className = 'hours';
    hours.textContent = ` — ${stage.hours}`;
    h.append(hours);
    const p = document.createElement('p');
    p.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const t of trophies.filter((t) => t.stage === stage.n)) {
      const c = document.createElement('span');
      c.className = 'chip' + (earned.has(t.name) ? ' done' : '');
      c.textContent = `${isSpoilerHidden(t) ? 'Hidden story trophy' : t.name} (${t.grade})`;
      chips.append(c);
    }
    div.append(h, p, chips);
    host.append(div);
  }
}

function renderMissables() {
  const host = $('missableList');
  host.replaceChildren();
  for (const t of trophies.filter((t) => t.missable)) {
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = `${t.name} — ${t.grade}`;
    const p = document.createElement('p');
    p.textContent = t.guide;
    const ol = document.createElement('ol');
    for (const s of t.steps ?? []) { const li = document.createElement('li'); li.textContent = s; ol.append(li); }
    const src = document.createElement('p');
    src.className = 'sources';
    src.textContent = 'Source: ';
    (t.sources ?? []).forEach((s, i) => {
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.label; a.target = '_blank'; a.rel = 'noopener';
      src.append(a);
      if (i < (t.sources ?? []).length - 1) src.append(document.createTextNode(' · '));
    });
    div.append(h, p, ol, src);
    host.append(div);
  }
}

function showView(name) {
  activeView = name;
  for (const v of ['checklist', 'roadmap', 'missables', 'sources']) {
    $(`view-${v}`).hidden = v !== name;
    $(`tab-${v}`).classList.toggle('active', v === name);
  }
  if (name === 'roadmap') renderRoadmap();
  if (name === 'missables') renderMissables();
  syncHash();
}

function syncHash() {
  const hash = activeView === 'checklist' && selected ? `#trophy/${encodeURIComponent(selected.name)}` : `#${activeView}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function readHash() {
  const h = location.hash.replace(/^#/, '');
  if (h.startsWith('trophy/')) {
    const name = decodeURIComponent(h.slice(7));
    if (byName.has(name)) { selected = byName.get(name); showView('checklist'); return; }
  }
  if (['checklist', 'roadmap', 'missables', 'sources'].includes(h)) showView(h);
}

function renderAll() { renderProgress(); renderList(); renderDetail(); if (activeView === 'roadmap') renderRoadmap(); if (activeView === 'missables') renderMissables(); }

spoilerEl.checked = spoilerOn;
spoilerEl.addEventListener('change', () => { spoilerOn = spoilerEl.checked; saveSpoiler(); renderAll(); });
hideEarnedEl.addEventListener('change', renderList);
searchEl.addEventListener('input', renderList);
kindEl.addEventListener('change', renderList);
gradeEl.addEventListener('change', renderList);
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
window.addEventListener('hashchange', readHash);

$('exportBtn').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned].sort() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const valid = (names ?? []).filter((n) => byName.has(n));
    if (valid.length === 0) throw new Error('no known trophy names in file');
    earned = new Set(valid);
    saveEarned(); renderAll();
    $('statusLine').textContent = `Imported ${valid.length} earned trophies from ${file.name}.`;
  } catch {
    $('statusLine').textContent = `Could not import ${file.name}: not a Leonida Legend progress file.`;
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies? This cannot be undone.')) { earned = new Set(); saveEarned(); renderAll(); }
});

readHash();
renderAll();
