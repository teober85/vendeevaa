connect();
initColorPicker();
initSplit();
initCourseSplit();
initTheme();

document.getElementById('teamInput').addEventListener('keydown',      e => { if (e.key === 'Enter') addTeam(); });
document.getElementById('courseNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveCourseName(); });
document.getElementById('displayNameInput').addEventListener('keydown',e => { if (e.key === 'Enter') saveDisplayName(); });
document.getElementById('distanceInput').addEventListener('keydown',   e => { if (e.key === 'Enter') saveDistance(); });

document.getElementById('fileInput').addEventListener('change', async function () {
  const f = this.files[0]; if (!f || !fileCallback) return;
  const reader = new FileReader();
  reader.onload = e => { fileCallback(e.target.result); fileCallback = null; };
  reader.readAsDataURL(f);
  this.value = '';
});

document.getElementById('bnTeam').addEventListener('change', function () {
  const pb = document.getElementById('bnPlace'); if (!pb) return;
  pb._manual = false;
  const race = races[currentRace] || { ranking: [] };
  const pos  = race.ranking.indexOf(this.value);
  pb.value = pos >= 0 ? pos + 1 : getNextPlace();
});

document.getElementById('bnPlace').addEventListener('input', function () { this._manual = true; });

document.querySelectorAll('.race-tab').forEach(el => el.addEventListener('click', () => {
  const pb = document.getElementById('bnPlace'); if (pb) pb._manual = false;
}));
