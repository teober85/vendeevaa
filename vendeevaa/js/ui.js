function switchTab(t) {
  currentTab = t;
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  document.getElementById('panel-' + t).classList.add('active');
}

function switchRace(race) {
  currentRace = race;
  document.querySelectorAll('.race-tab').forEach(el => el.classList.remove('active'));
  const rtab = document.getElementById('rtab-' + race); if (rtab) rtab.classList.add('active');
  const sr = document.getElementById('selectifRow');
  if (sr) sr.style.display = race === 'selectif' ? 'flex' : 'none';
  const r   = races[race] || { distance: '', displayName: '' };
  const di  = document.getElementById('distanceInput');    if (di)  di.value  = r.distance    || '';
  const dni = document.getElementById('displayNameInput'); if (dni) dni.value = r.displayName || '';
  const sl  = document.getElementById('settingsRaceLabel');
  if (sl) sl.textContent = (races[race] || {}).name || race;
  updateSelectifBadge();
  renderTeamPool(); renderRankList(); renderBannerSelects();
}

function toggleSettings() {
  document.getElementById('settingsPanel').classList.toggle('open');
}

function toggleSelectif() {
  const r = races['selectif'] || {};
  send({ type: 'set_race_config', race: 'selectif', enabled: !r.enabled });
}

function saveCourseName() {
  const val = (document.getElementById('courseNameInput').value || '').trim();
  courseName = val || 'Jeudi';
  send({ type: 'set_course_name', courseName });
}

function saveDisplayName() {
  const val = (document.getElementById('displayNameInput').value || '').trim();
  send({ type: 'set_race_config', race: currentRace, displayName: val });
}

function saveDistance() {
  const val = (document.getElementById('distanceInput').value || '').trim();
  send({ type: 'set_race_config', race: currentRace, distance: val });
}

function updateSelectifBadge() {
  const r = races['selectif'] || {};
  const badge = document.getElementById('selectifBadge');
  if (badge) { badge.textContent = r.enabled ? 'ON' : 'OFF'; badge.className = 'race-badge' + (r.enabled ? ' on' : ''); }
  const btn = document.getElementById('selectifToggleBtn');
  if (btn) btn.textContent = r.enabled ? 'Désactiver' : 'Activer';
}

/* ── Split pane ── */
const SPLIT_KEY = 'vva-split-w';
let splitDrag = false, splitX0 = 0, splitW0 = 0;

function initSplit() {
  const saved = parseInt(localStorage.getItem(SPLIT_KEY));
  if (saved > 0) document.getElementById('splitLeft').style.flex = `0 0 ${saved}px`;
  document.getElementById('splitHandle').addEventListener('mousedown', e => {
    splitDrag = true;
    splitX0   = e.clientX;
    splitW0   = document.getElementById('splitLeft').getBoundingClientRect().width;
    document.getElementById('splitHandle').classList.add('active');
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
}

document.addEventListener('mousemove', e => {
  if (!splitDrag) return;
  const pane  = document.getElementById('splitPane');
  const left  = document.getElementById('splitLeft');
  const paneW = pane.getBoundingClientRect().width;
  const newW  = Math.max(180, Math.min(paneW - 230, splitW0 + (e.clientX - splitX0)));
  left.style.flex = `0 0 ${newW}px`;
});

document.addEventListener('mouseup', () => {
  if (!splitDrag) return;
  splitDrag = false;
  document.getElementById('splitHandle').classList.remove('active');
  document.body.style.cursor     = '';
  document.body.style.userSelect = '';
  const w = document.getElementById('splitLeft').getBoundingClientRect().width;
  localStorage.setItem(SPLIT_KEY, Math.round(w));
});
