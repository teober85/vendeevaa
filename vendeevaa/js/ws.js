function connect() {
  ws = new WebSocket(WS_URL);
  ws.onopen  = () => badge('ok', 'Connecté');
  ws.onclose = () => { badge('err', 'Déconnecté'); setTimeout(connect, 2000); };
  ws.onerror = () => badge('err', 'Erreur');
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.type === 'full_state') {
      races = m.races || {}; sponsors = m.sponsors || [];
      courseName = m.courseName || 'Jeudi';
      overlay = m.overlay || { mode: 'hidden', race: 'medium' };
      titrages = m.titrages || [];
      titrageOverlay = m.titrage_overlay || { visible: false, nom: '', titre: '' };
      if (m.colors) overlayColors = { ...DEFAULT_COLORS, ...m.colors };
      renderAll(); syncUI(); syncColorSwatches();
      renderTitrageList(); syncTitrageUI();
    } else if (m.type === 'saved') {
      flashSave();
    }
  };
}

function send(o) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(o));
  else toast('Non connecté');
}

function badge(cls, txt) {
  const b = document.getElementById('wsBadge');
  b.className = 'ws-badge ' + cls;
  b.querySelector('.wdot').className = 'wdot' + (cls === 'ok' ? ' blink' : '');
  document.getElementById('wsLabel').textContent = txt;
}

function manualSave() { send({ type: 'save' }); }
