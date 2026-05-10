function showTitrage() {
  const nom   = (document.getElementById('titrageNomInput').value   || '').trim();
  const titre = (document.getElementById('titrageRoleInput').value  || '').trim();
  if (!nom) { toast('Entrez un nom'); return; }
  if (titrageOverlay.visible && titrageOverlay.nom === nom && titrageOverlay.titre === titre) {
    hideTitrage(); return;
  }
  send({ type: 'show_titrage', nom, titre });
  toast('Titrage : ' + nom);
}

function hideTitrage() {
  send({ type: 'hide_titrage' });
  toast('Titrage masqué');
}

function saveTitrage() {
  const nom   = (document.getElementById('titrageNomInput').value   || '').trim();
  const titre = (document.getElementById('titrageRoleInput').value  || '').trim();
  if (!nom) { toast('Entrez un nom à enregistrer'); return; }
  if (titrages.some(t => t.nom === nom && (t.titre || '') === titre)) { toast('Déjà enregistré'); return; }
  send({ type: 'set_titrages', titrages: [...titrages, { nom, titre }] });
  toast('Nom enregistré');
}

function deleteTitrageEntry(idx) {
  send({ type: 'set_titrages', titrages: titrages.filter((_, i) => i !== idx) });
}

function selectTitrageEntry(idx) {
  const t = titrages[idx]; if (!t) return;
  const ni = document.getElementById('titrageNomInput');
  const ri = document.getElementById('titrageRoleInput');
  if (ni) ni.value = t.nom;
  if (ri) ri.value = t.titre || '';
}

function renderTitrageList() {
  const el = document.getElementById('titrageList'); if (!el) return;
  if (!titrages.length) { el.innerHTML = '<div class="empty">Aucun nom enregistré</div>'; return; }
  el.innerHTML = titrages.map((t, i) => `
    <div class="chip tit-chip" onclick="selectTitrageEntry(${i})">
      <div style="flex:1;min-width:0;overflow:hidden">
        <div class="chip-name">${t.nom.toUpperCase()}</div>
        ${t.titre ? `<div class="chip-label">${t.titre}</div>` : ''}
      </div>
      <button class="icon-btn del" onclick="event.stopPropagation();deleteTitrageEntry(${i})" title="Supprimer">✕</button>
    </div>
  `).join('');
}

function syncTitrageUI() {
  const tov = titrageOverlay;
  const dot = document.getElementById('stDotTit');
  const val = document.getElementById('stValTit');
  const btn = document.getElementById('btnTit');
  const tab = document.getElementById('tab-titrage');
  if (dot) dot.classList.toggle('on', !!tov.visible);
  if (val) { val.textContent = tov.visible ? (tov.nom || '—') : 'Masqué'; val.classList.toggle('live', !!tov.visible); }
  if (btn) btn.classList.toggle('live-on', !!tov.visible);
  if (tab) tab.classList.toggle('live', !!tov.visible);
}
