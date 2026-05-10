function hsvToRgb(h, s, v) {
  const i = Math.floor(h / 60) % 6, f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i].map(x => Math.round(x * 255));
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = max ? d / max : 0, v = max;
  if (d) { switch (max) { case r: h = ((g - b) / d + 6) % 6; break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h *= 60; }
  return { h, s, v };
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  if (isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function cpDrawWheel() {
  const canvas = document.getElementById('cpWheel'); if (!canvas) return;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 1;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy), i = (y * w + x) * 4;
      if (dist <= r) {
        const hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360, sat = dist / r;
        const [rr, gg, bb] = hsvToRgb(hue, sat, cpHSV.v);
        img.data[i] = rr; img.data[i + 1] = gg; img.data[i + 2] = bb; img.data[i + 3] = 255;
      } else { img.data[i + 3] = 0; }
    }
  }
  ctx.putImageData(img, 0, 0);
  const a = cpHSV.h * Math.PI / 180, cx2 = cx + Math.cos(a) * cpHSV.s * (r - 2), cy2 = cy + Math.sin(a) * cpHSV.s * (r - 2);
  ctx.beginPath(); ctx.arc(cx2, cy2, 8, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx2, cy2, 8, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.stroke();
}

function cpDrawSlider() {
  const canvas = document.getElementById('cpSlider'); if (!canvas) return;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const [rr, gg, bb] = hsvToRgb(cpHSV.h, cpHSV.s, 1);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgb(${rr},${gg},${bb})`); g.addColorStop(1, '#000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const y = Math.round((1 - cpHSV.v) * (h - 1));
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(1, y - 5, w - 2, 10);
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.strokeRect(2, y - 4, w - 4, 8);
}

function cpSyncFromHSV() {
  cpDrawWheel(); cpDrawSlider();
  const [r, g, b] = hsvToRgb(cpHSV.h, cpHSV.s, cpHSV.v), hex = rgbToHex(r, g, b);
  const pr = document.getElementById('cpPreview'); if (pr) pr.style.background = hex;
  const hi = document.getElementById('cpHex');     if (hi) hi.value = hex.slice(1).toUpperCase();
  const ri = document.getElementById('cpR');       if (ri) ri.value = r;
  const gi = document.getElementById('cpG');       if (gi) gi.value = g;
  const bi = document.getElementById('cpB');       if (bi) bi.value = b;
  overlayColors[cpTarget] = hex;
  const sw = document.getElementById('sw-' + cpTarget); if (sw) sw.style.background = hex;
}

function cpWheelPick(e) {
  const canvas = document.getElementById('cpWheel'), rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * sx, y = (e.clientY - rect.top) * sy;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) - 1;
  const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);
  cpHSV.h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
  cpHSV.s = Math.min(dist / r, 1);
  cpSyncFromHSV();
}

function cpSliderPick(e) {
  const canvas = document.getElementById('cpSlider'), rect = canvas.getBoundingClientRect();
  cpHSV.v = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  cpSyncFromHSV();
}

function cpTouchPos(e) { return e.touches[0] || e.changedTouches[0]; }

function selectColorTarget(target) {
  cpTarget = target;
  document.querySelectorAll('.cp-target').forEach(el => el.classList.remove('active'));
  const ct = document.getElementById('cpt-' + target); if (ct) ct.classList.add('active');
  const hex = overlayColors[target] || '#2d6ea8', rgb = hexToRgb(hex);
  if (rgb) { cpHSV = rgbToHsv(rgb.r, rgb.g, rgb.b); cpSyncFromHSV(); }
}

function syncColorSwatches() {
  ['primary', 'accent', 'background'].forEach(k => {
    const sw = document.getElementById('sw-' + k);
    if (sw) sw.style.background = overlayColors[k] || DEFAULT_COLORS[k];
  });
  if (currentTab === 'couleurs') {
    const hex = overlayColors[cpTarget], rgb = hexToRgb(hex || '');
    if (rgb) { cpHSV = rgbToHsv(rgb.r, rgb.g, rgb.b); cpSyncFromHSV(); }
  }
}

function sendColors() {
  send({ type: 'set_colors', colors: overlayColors });
  toast('Couleurs appliquées à l\'overlay');
}

function initColorPicker() {
  const wheel  = document.getElementById('cpWheel');
  const slider = document.getElementById('cpSlider');
  if (!wheel || !slider) return;

  wheel.addEventListener('mousedown',  e => { cpDragging = 'wheel';  cpWheelPick(e); });
  slider.addEventListener('mousedown', e => { cpDragging = 'slider'; cpSliderPick(e); });
  document.addEventListener('mousemove', e => {
    if (cpDragging === 'wheel')  cpWheelPick(e);
    else if (cpDragging === 'slider') cpSliderPick(e);
  });
  document.addEventListener('mouseup', () => cpDragging = null);

  wheel.addEventListener('touchstart',  e => { cpDragging = 'wheel';  cpWheelPick(cpTouchPos(e));  e.preventDefault(); }, { passive: false });
  slider.addEventListener('touchstart', e => { cpDragging = 'slider'; cpSliderPick(cpTouchPos(e)); e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (cpDragging === 'wheel')  cpWheelPick(cpTouchPos(e));
    else if (cpDragging === 'slider') cpSliderPick(cpTouchPos(e));
  }, { passive: false });
  document.addEventListener('touchend', () => cpDragging = null);

  document.getElementById('cpHex').addEventListener('input', e => {
    const val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
    e.target.value = val;
    if (val.length === 6) {
      const rgb = hexToRgb(val); if (!rgb) return;
      cpHSV = rgbToHsv(rgb.r, rgb.g, rgb.b);
      cpDrawWheel(); cpDrawSlider();
      document.getElementById('cpR').value = rgb.r;
      document.getElementById('cpG').value = rgb.g;
      document.getElementById('cpB').value = rgb.b;
      const hex = '#' + val.toLowerCase();
      const pr = document.getElementById('cpPreview'); if (pr) pr.style.background = hex;
      overlayColors[cpTarget] = hex;
      const sw = document.getElementById('sw-' + cpTarget); if (sw) sw.style.background = hex;
    }
  });

  ['cpR', 'cpG', 'cpB'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const r = Math.min(255, Math.max(0, parseInt(document.getElementById('cpR').value) || 0));
      const g = Math.min(255, Math.max(0, parseInt(document.getElementById('cpG').value) || 0));
      const b = Math.min(255, Math.max(0, parseInt(document.getElementById('cpB').value) || 0));
      cpHSV = rgbToHsv(r, g, b);
      cpDrawWheel(); cpDrawSlider();
      const hex = rgbToHex(r, g, b);
      const hi = document.getElementById('cpHex'); if (hi) hi.value = hex.slice(1).toUpperCase();
      const pr = document.getElementById('cpPreview'); if (pr) pr.style.background = hex;
      overlayColors[cpTarget] = hex;
      const sw = document.getElementById('sw-' + cpTarget); if (sw) sw.style.background = hex;
    });
  });

  const rgb = hexToRgb(overlayColors.primary || '#2d6ea8');
  if (rgb) cpHSV = rgbToHsv(rgb.r, rgb.g, rgb.b);
  cpSyncFromHSV();
  syncColorSwatches();
}
