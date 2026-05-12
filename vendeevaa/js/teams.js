function addTeam() {
  const i = document.getElementById('teamInput'), n = i.value.trim();
  if (!n) return; i.value = '';
  send({ type: 'add_team', race: currentRace, name: n });
}

function removeTeam(n) {
  if (!confirm('Supprimer "' + n + '" ?')) return;
  send({ type: 'remove_team', race: currentRace, name: n });
}

function addToRanking() {
  const n = document.getElementById('addSel').value;
  if (!n) { toast('Choisissez une pirogue'); return; }
  send({ type: 'add_to_ranking', race: currentRace, name: n });
}

function addToRankingDirect(name) {
  send({ type: 'add_to_ranking', race: currentRace, name });
}

function removeFromRanking(n) {
  send({ type: 'remove_from_ranking', race: currentRace, name: n });
}

function moveUp(i) {
  const rr = (races[currentRace] || { ranking: [] }).ranking;
  if (i === 0) return;
  const r = [...rr]; [r[i - 1], r[i]] = [r[i], r[i - 1]];
  send({ type: 'set_ranking', race: currentRace, ranking: r });
}

function moveDown(i) {
  const rr = (races[currentRace] || { ranking: [] }).ranking;
  if (i >= rr.length - 1) return;
  const r = [...rr]; [r[i], r[i + 1]] = [r[i + 1], r[i]];
  send({ type: 'set_ranking', race: currentRace, ranking: r });
}

function onDragStart(e, i) {
  dragIdx = i;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.rank-row').forEach(el => el.classList.remove('drag-over'));
}

function onDragOver(e) {
  e.preventDefault();
  const r = e.target.closest('.rank-row'); if (!r) return;
  document.querySelectorAll('.rank-row').forEach(el => el.classList.remove('drag-over'));
  r.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const rr = e.target.closest('.rank-row'); if (!rr || dragIdx === null) return;
  const ti = parseInt(rr.dataset.idx); if (ti === dragIdx) { dragIdx = null; return; }
  const ranking = (races[currentRace] || { ranking: [] }).ranking;
  const arr = [...ranking]; const m = arr.splice(dragIdx, 1)[0]; arr.splice(ti, 0, m);
  dragIdx = null;
  send({ type: 'set_ranking', race: currentRace, ranking: arr });
}

function setTeamNumber(name, val) {
  send({ type: 'set_team_number', race: currentRace, name, number: val.trim() });
}

function setTeamCountry(name, val) {
  send({ type: 'set_team_country', race: currentRace, name, country: val });
}

function renameTeam(oldName, input) {
  const newName = input.value.trim();
  if (!newName || newName === oldName) { input.value = oldName; return; }
  send({ type: 'rename_team', race: currentRace, old: oldName, new: newName });
}

function setTeamStatus(name, status) {
  send({ type: 'set_team_status', race: currentRace, name, status });
}
