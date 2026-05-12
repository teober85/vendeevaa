function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function flashSave() {
  const btn = document.getElementById('saveBtn');
  btn.textContent = 'Sauvegardé !';
  btn.classList.add('saved');
  setTimeout(() => { btn.textContent = 'Sauvegarder'; btn.classList.remove('saved'); }, 2000);
}

function copyObs() {
  navigator.clipboard.writeText('http://localhost:8765/overlay').then(() => toast('URL OBS copiée'));
}

function previewPopout() {
  document.getElementById('previewModal').classList.add('open');
}

function closePreviewModal(e) {
  const modal = document.getElementById('previewModal');
  if (!e || e.target === modal) modal.classList.remove('open');
}

function previewFullscreen(btn) {
  const wrap = btn.closest('.preview-wrap');
  if (!document.fullscreenElement) { wrap.requestFullscreen().catch(() => {}); }
  else { document.exitFullscreen(); }
}
