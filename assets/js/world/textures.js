// Texturas pintadas en canvas: rótulos, zinc, LED, fachadas coloniales, tejidos andinos.
import * as THREE from 'three';

export const C = {
  ash: '#1e1d1b', paper: '#d9d3c4', paperHi: '#ede8dc', marker: '#141312',
  blue: '#1f5fa8', orange: '#f26b1d', yellow: '#f2c230', red: '#c8261e', green: '#2e8b57',
  led: '#ffb23f', sodium: '#ff9a3c', lava: '#ff5a1a', cyan: '#46d6e6', tile: '#8a3b22',
};

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, opts = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = opts.aniso || 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

export function grime(ctx, w, h, r, amount = 1) {
  for (let i = 0; i < 140 * amount; i++) {
    ctx.globalAlpha = 0.04 + r() * 0.08;
    ctx.fillStyle = r() > 0.5 ? '#000' : '#5a4630';
    const x = r() * w, y = r() * h, s = 4 + r() * 40;
    ctx.beginPath(); ctx.ellipse(x, y, s, s * (0.3 + r()), r() * 3, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,22,14,.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

export function paintedText(ctx, text, x, y, size, fill, shade, outline, r, align = 'center') {
  ctx.font = `400 ${size}px Bungee`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  const off = size * 0.07;
  ctx.fillStyle = shade; ctx.fillText(text, x + off, y + off);
  if (outline) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.09; ctx.strokeStyle = outline; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  const m = ctx.measureText(text); const left = align === 'center' ? x - m.width / 2 : x;
  ctx.fillStyle = fill;
  for (let i = 0; i < Math.max(1, text.length / 4); i++) {
    if (r() > 0.6) continue;
    const dx = left + r() * m.width, len = size * (0.15 + r() * 0.35), wd = size * 0.035;
    ctx.fillRect(dx, y + size * 0.36, wd, len); ctx.beginPath(); ctx.arc(dx + wd / 2, y + size * 0.36 + len, wd * 0.9, 0, 7); ctx.fill();
  }
}

export const SIGN_STYLES = [
  { bg: C.yellow, fg: C.red, shade: '#5a1410', band: C.red },
  { bg: C.paperHi, fg: C.blue, shade: '#0e2a4d', band: C.blue },
  { bg: C.red, fg: C.yellow, shade: '#3a0b08', band: C.yellow },
  { bg: C.blue, fg: C.paperHi, shade: '#0b1d33', band: C.orange },
  { bg: '#1b1a18', fg: C.orange, shade: '#000', band: C.yellow },
  { bg: C.green, fg: C.paperHi, shade: '#0c2a19', band: C.yellow },
];

export function signTexture(lines, style, r, vertical = false) {
  const W = vertical ? 256 : 1024, H = vertical ? 1024 : 384;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = style.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = style.band; ctx.fillRect(0, 0, W, vertical ? 18 : 22); ctx.fillRect(0, H - (vertical ? 18 : 22), W, vertical ? 18 : 22);
  if (vertical) {
    const letters = lines[0].split('');
    const size = Math.min(150, (H - 80) / letters.length * 0.95);
    letters.forEach((ch, i) => paintedText(ctx, ch, W / 2, 50 + size * 0.55 + i * (H - 100) / letters.length, size, style.fg, style.shade, null, r));
  } else {
    const main = lines[0], sub = lines[1];
    let size = 150; ctx.font = `400 ${size}px Bungee`;
    while (ctx.measureText(main).width > W * 0.88 && size > 40) { size -= 4; ctx.font = `400 ${size}px Bungee`; }
    paintedText(ctx, main, W / 2, sub ? H * 0.42 : H * 0.5, size, style.fg, style.shade, null, r);
    if (sub) { ctx.font = '400 46px Bungee'; ctx.fillStyle = style.fg; ctx.textAlign = 'center'; ctx.fillText(sub, W / 2, H * 0.78); }
  }
  grime(ctx, W, H, r, 0.7);
  return tex(c);
}

export function ledTexture(text, color = C.led) {
  const [c, ctx] = canvas(2048, 128);
  ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, 2048, 128);
  ctx.fillStyle = '#1d1209';
  for (let x = 4; x < 2048; x += 8) for (let y = 4; y < 128; y += 8) ctx.fillRect(x, y, 4, 4);
  ctx.font = '900 84px Doto'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  const m = ctx.measureText(text).width; let x = 20;
  while (x < 2048) { ctx.fillText(text, x, 68); x += m + 60; }
  const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t;
}

// Lámina de zinc corrugado con letras pintadas (rótulo principal y portada del mercado)
export function zincSignTexture(r, { main, accent, sub, W = 2048, H = 640 }) {
  const [c, ctx] = canvas(W, H);
  for (let x = 0; x < W; x++) {
    const s = 0.5 + 0.5 * Math.sin(x / W * Math.PI * 2 * 46);
    const v = Math.round(78 + s * 52);
    ctx.fillStyle = `rgb(${v - 6},${v},${v + 6})`; ctx.fillRect(x, 0, 1, H);
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() < 0.6 ? H - r() * 140 : r() * H;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 30 + r() * 110);
    g.addColorStop(0, 'rgba(140,62,20,.55)'); g.addColorStop(1, 'rgba(140,62,20,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 160, y - 160, 320, 320);
  }
  ctx.globalAlpha = 0.94; ctx.fillStyle = '#16120e';
  ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(W - 50, 54); ctx.lineTo(W - 70, H - 64); ctx.lineTo(48, H - 50); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  let size = 300; ctx.font = `400 ${size}px Bungee`;
  const gap = () => (accent ? size * 0.35 : 0);
  const total = () => ctx.measureText(main).width + gap() + (accent ? ctx.measureText(accent).width : 0);
  while (total() > W - 300 && size > 60) { size -= 6; ctx.font = `400 ${size}px Bungee`; }
  const gx = (W - total()) / 2, gw = ctx.measureText(main).width;
  const y = sub ? H * 0.43 : H * 0.5;
  paintedText(ctx, main, gx, y, size, C.yellow, '#7a1a10', C.red, r, 'left');
  if (accent) { ctx.font = `400 ${size}px Bungee`; paintedText(ctx, accent, gx + gw + gap(), y, size, C.red, '#000', C.yellow, r, 'left'); }
  if (sub) {
    ctx.fillStyle = C.blue; ctx.fillRect(170, H * 0.72, W - 340, 104);
    ctx.font = '400 66px Bungee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.paperHi;
    let s = 66; while (ctx.measureText(sub).width > W - 400 && s > 30) { s -= 2; ctx.font = `400 ${s}px Bungee`; }
    ctx.fillText(sub, W / 2, H * 0.72 + 54);
  }
  ctx.fillStyle = '#c9c4ba';
  for (const [x, yy] of [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]]) { ctx.beginPath(); ctx.arc(x, yy, 12, 0, 7); ctx.fill(); }
  grime(ctx, W, H, r, 1.4);
  return tex(c, { aniso: 8 });
}

// Torres: ventanas encendidas sobre fondo negro (emissive)
export function windowsTexture(r) {
  const [c, ctx] = canvas(256, 512);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 512);
  const warm = ['#ffb35a', '#ffd08a', '#ff8f3a'], cool = ['#7fb4ff', '#a8e0ff'];
  for (let y = 10; y < 512; y += 32) for (let x = 10; x < 256; x += 30) {
    const k = r();
    if (k < 0.62) continue;
    ctx.fillStyle = k > 0.93 ? cool[Math.floor(r() * 2)] : warm[Math.floor(r() * 3)];
    ctx.globalAlpha = 0.35 + r() * 0.65; ctx.fillRect(x, y, 16, 20);
  }
  ctx.globalAlpha = 1;
  return tex(c, { repeat: true });
}

// Fachada colonial pastusa: muro encalado, zócalo, ventanas de madera, balcón, puerta de arco
export function facadeTextures(r, wall = '#d8d0bf') {
  const W = 512, H = 512;
  const [c, ctx] = canvas(W, H);
  const [e, ex] = canvas(W, H);
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  // manchas de humedad y ceniza
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.05 + r() * 0.08; ctx.fillStyle = r() > 0.5 ? '#6a6052' : '#3c362d';
    ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 10 + r() * 60, 6 + r() * 40, 0, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // zócalo
  ctx.fillStyle = '#5b2a1c'; ctx.fillRect(0, H - 70, W, 70);
  // cornisa
  ctx.fillStyle = '#b8ae9a'; ctx.fillRect(0, 0, W, 18);
  // vanos: dos pisos
  const cols = 3;
  for (let k = 0; k < cols; k++) {
    const x = 40 + k * (W - 80) / cols + 20, w = (W - 80) / cols - 40;
    // piso alto: ventana con balcón de madera
    const lit = r() > 0.45, warm = r() > 0.2;
    ctx.fillStyle = '#3d2416'; ctx.fillRect(x - 6, 70, w + 12, 170);
    ctx.fillStyle = lit ? (warm ? '#ffcc80' : '#9fe7f0') : '#1a1512'; ctx.fillRect(x, 78, w, 150);
    ctx.fillStyle = '#3d2416'; ctx.fillRect(x + w / 2 - 3, 78, 6, 150); ctx.fillRect(x, 150, w, 5);
    if (lit) { ex.fillStyle = warm ? '#ffb35a' : '#46d6e6'; ex.globalAlpha = 0.85; ex.fillRect(x, 78, w, 150); ex.globalAlpha = 1; }
    // baranda
    ctx.fillStyle = '#4a2b18'; ctx.fillRect(x - 14, 228, w + 28, 10);
    for (let b = x - 10; b < x + w + 12; b += 12) ctx.fillRect(b, 238, 4, 30);
    ctx.fillRect(x - 14, 266, w + 28, 8);
    // piso bajo: puerta de arco o tienda
    const shop = r() > 0.5;
    ctx.fillStyle = '#2a1a10';
    if (shop) { ctx.fillRect(x - 4, 320, w + 8, H - 390); const on = r() > 0.4; if (on) { ctx.fillStyle = '#ff9a3c'; ctx.globalAlpha = 0.85; ctx.fillRect(x + 4, 330, w - 8, H - 410); ctx.globalAlpha = 1; ex.fillStyle = '#ff9a3c'; ex.globalAlpha = 0.7; ex.fillRect(x + 4, 330, w - 8, H - 410); ex.globalAlpha = 1; } }
    else { ctx.beginPath(); ctx.moveTo(x, H - 70); ctx.lineTo(x, 360); ctx.arc(x + w / 2, 360, w / 2, Math.PI, 0); ctx.lineTo(x + w, H - 70); ctx.fill(); }
  }
  return { map: tex(c), emissive: tex(e) };
}

// Torre de concreto con ventanas (sin luz propia)
export function concreteTexture(r) {
  const [c, ctx] = canvas(256, 512);
  ctx.fillStyle = '#3a3733'; ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(0,0,0,${r() * 0.15})`; ctx.fillRect(r() * 256, r() * 512, 2 + r() * 10, 1 + r() * 4); }
  ctx.fillStyle = '#1a1816';
  for (let y = 10; y < 512; y += 32) for (let x = 10; x < 256; x += 30) ctx.fillRect(x, y, 16, 20);
  return tex(c, { repeat: true });
}

// Tejido andino (chumbe) en LED: rombos escalonados y chakanas
export function chumbeTexture(r) {
  const W = 128, H = 1024;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#050403'; ctx.fillRect(0, 0, W, H);
  const cols = [C.orange, C.yellow, C.red, C.cyan, '#e8e2d2'];
  const cell = 8;
  for (let y = 0; y < H; y += cell) {
    const row = Math.floor(y / cell);
    for (let x = 0; x < W; x += cell) {
      const col = Math.floor(x / cell);
      const k = (row % 16), m = Math.abs(col - 7.5);
      const diamond = Math.abs(m - Math.abs(k - 8)) < 1.1;
      const step = (row % 16 === 0) || (Math.abs(m - 3.5) < 0.6 && k > 5 && k < 11);
      if (diamond || step) { ctx.fillStyle = cols[(Math.floor(row / 16) + (step ? 1 : 0)) % cols.length]; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2); }
    }
  }
  return tex(c);
}

// Adoquín de plaza
export function stoneTexture(r) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#4a4740'; ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 24) for (let x = (y / 24) % 2 ? -12 : 0; x < 512; x += 24) {
    const v = 70 + Math.floor(r() * 40);
    ctx.fillStyle = `rgb(${v},${v - 3},${v - 8})`; ctx.fillRect(x + 2, y + 2, 20, 20);
  }
  const t = tex(c, { repeat: true }); return t;
}

// Páramo: pasto seco y musgo
export function paramoTexture(r) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#262a1c'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { ctx.fillStyle = r() > 0.5 ? '#3d4128' : '#55502f'; ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2, 3 + r() * 6); }
  return tex(c, { repeat: true });
}

// Barrido de escáner (líneas horizontales)
export function scanTexture() {
  const [c, ctx] = canvas(64, 256);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 8) { ctx.fillStyle = `rgba(70,214,230,${y % 32 === 0 ? 0.9 : 0.25})`; ctx.fillRect(0, y, 64, 2); }
  const t = tex(c); t.wrapT = THREE.RepeatWrapping; return t;
}

export function dotTexture() {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
