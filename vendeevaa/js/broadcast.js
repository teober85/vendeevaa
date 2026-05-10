function showClassement() {
  if (overlay.mode === 'classement' && overlay.race === currentRace) { hideAll(); return; }
  send({ type: 'show_classement', race: currentRace });
  toast('Classement → OBS');
}

function getNextPlace() {
  return ((races[currentRace] || {}).ranking || []).length + 1;
}

function showBanner() {
  const team = document.getElementById('bnTeam').value;
  if (!team) { toast('Sélectionnez une pirogue'); return; }
  if (overlay.mode === 'arrivee' && overlay.team === team) { hideAll(); return; }
  const place = Math.max(1, parseInt(document.getElementById('bnPlace').value) || getNextPlace());
  send({ type: 'show_banner', race: currentRace, team, place });
  toast('Arrivée : ' + team + ' — ' + place + (place === 1 ? 're' : 'e'));
}

function showBandeauCours() {
  const el   = document.getElementById('stValCours');
  const team = el.dataset.selected || '';
  const race = el.dataset.race    || 'medium';
  if (overlay.mode === 'bandeau_course') { hideAll(); return; }
  if (!team) { toast('Sélectionnez une pirogue en cours'); return; }
  send({ type: 'show_bandeau_course', race, team });
  toast('Bandeau en cours : ' + team);
}

function showSponsor() {
  const sp = document.getElementById('selSponsor').value;
  if (!sp) { toast('Sélectionnez un partenaire'); return; }
  if (overlay.mode === 'partenaires' && overlay.sponsor === sp) { hideAll(); return; }
  send({ type: 'show_sponsor', sponsor: sp });
  toast('Partenaire : ' + sp);
}

function hideAll() { send({ type: 'hide' }); toast('Overlay masqué'); }

function selectPirogueEnCours(name, race) {
  const el = document.getElementById('stValCours');
  el.textContent = name; el.dataset.selected = name; el.dataset.race = race || 'medium';
  document.querySelectorAll('.cours-item').forEach(el => {
    const match = el.dataset.name === name && el.dataset.race === (race || 'medium');
    el.style.borderColor = match ? 'rgba(68,144,200,.5)' : 'rgba(45,110,168,.18)';
    el.style.background  = match ? 'rgba(68,144,200,.08)' : 'rgba(255,255,255,.025)';
  });
}

function syncUI() {
  const ov = overlay;
  ['btnC', 'btnB', 'btnCours', 'btnSp'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('live-on');
  });
  ['stDotC', 'stDotCours', 'stDotSp'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('on');
  });

  const stC  = document.getElementById('stValC');
  const stSp = document.getElementById('stValSp');
  if (stC)  { stC.textContent  = 'Masqué'; stC.classList.remove('live'); }
  if (stSp) { stSp.textContent = 'Aucun';  stSp.classList.remove('live'); }
  document.querySelectorAll('.tab,.race-tab').forEach(el => el.classList.remove('live'));

  const raceData = races[ov.race] || {};
  const raceName = raceData.displayName || raceData.name || ov.race || '';

  if (ov.mode === 'classement' && ov.showAll) {
    act('btnC', 'stDotC');
    if (stC) { stC.textContent = 'Classement · ' + raceName; stC.classList.add('live'); }
    document.getElementById('tab-classement').classList.add('live');
    const rtab = document.getElementById('rtab-' + (ov.race || 'medium'));
    if (rtab) rtab.classList.add('live');
  } else if (ov.mode === 'arrivee' && ov.team) {
    act('btnB', 'stDotC');
    if (stC) { stC.textContent = ov.team + ' — ' + ov.place + (ov.place === 1 ? 're' : 'e'); stC.classList.add('live'); }
    document.getElementById('tab-classement').classList.add('live');
  } else if (ov.mode === 'bandeau_course') {
    act('btnCours', 'stDotCours');
    const coursEl = document.getElementById('stValCours');
    if (coursEl) coursEl.textContent = ov.team || '—';
    document.getElementById('tab-encours').classList.add('live');
  } else if (ov.mode === 'partenaires') {
    act('btnSp', 'stDotSp');
    if (stSp) { stSp.textContent = ov.sponsor || '—'; stSp.classList.add('live'); }
    document.getElementById('tab-partenaires').classList.add('live');
  }
}

function act(btnId, dotId) {
  const b = document.getElementById(btnId); if (b) b.classList.add('live-on');
  const d = document.getElementById(dotId); if (d) d.classList.add('on');
}
