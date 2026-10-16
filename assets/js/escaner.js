// GALERAS 2037 · Escáner de planos
// Foto del Plano de Nivel A3 → 4 marcas de esquina → corrección de perspectiva → lectura de celdas → nivel 3D recorrible.
import * as THREE from 'three';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Geometría de la plantilla del kit: hoja de plano 312 × 273 mm, cuadrícula de 10 mm, marcas centradas a 11 mm de cada borde
const PLAN = { w: 312, h: 273, cell: 10, inset: 11 };
const COLS = 31, ROWS = 27, PX = 2;                 // 2 px por mm en la imagen corregida
const TIPOS = [
  { id: 'vacio', nombre: 'Borrar', color: '#3a3733' },
  { id: 'muro', nombre: 'Muro', color: '#141312' },
  { id: 'pista', nombre: 'Pista', color: '#c8261e', meta: 3 },
  { id: 'presion', nombre: 'Presión', color: '#f2c230', meta: 1 },
  { id: 'decision', nombre: 'Decisión', color: '#1f5fa8', meta: 1 },
  { id: 'salida', nombre: 'Salida', color: '#2e8b57', meta: 1 },
  { id: 'acceso', nombre: 'Acceso', color: '#f26b1d', meta: 1 },
  { id: 'hito', nombre: 'Hito', color: '#ffd36a', meta: 1 },
  { id: 'camara', nombre: 'Cámara', color: '#46d6e6' },
  { id: 'sonido', nombre: 'Sonido', color: '#a6ff7a' },
];
const T = Object.fromEntries(TIPOS.map((t, i) => [t.id, i]));
const ESQUINAS = ['arriba a la izquierda', 'arriba a la derecha', 'abajo a la derecha', 'abajo a la izquierda'];
const PLAN_PTS = [[PLAN.inset, PLAN.inset], [PLAN.w - PLAN.inset, PLAN.inset], [PLAN.w - PLAN.inset, PLAN.h - PLAN.inset], [PLAN.inset, PLAN.h - PLAN.inset]];

const st = { celula: 1, lugar: '', foto: null, esquinas: [], grid: new Uint8Array(COLS * ROWS), rect: null, tool: T.muro };

/* ---------- pasos ---------- */
function paso(id) {
  $$('.esc-paso').forEach(p => { p.hidden = p.id !== 'paso-' + id; });
  const orden = ['foto', 'esquinas', 'plano', 'mundo'], k = orden.indexOf(id);
  $$('.esc-pasos li').forEach((li, i) => { li.classList.toggle('is-on', i === k); li.classList.toggle('is-done', i < k); });
  if (id !== 'mundo') mundo.stop();
  scrollTo(0, 0);
}

/* ---------- guardado por célula ---------- */
const clave = () => `galeras-escaner-${st.celula}`;
function guardar() {
  try { localStorage.setItem(clave(), JSON.stringify({ lugar: st.lugar, grid: [...st.grid], rect: st.rect ? st.rect.toDataURL('image/jpeg', 0.72) : null })); } catch (_) { /* almacenamiento lleno o bloqueado */ }
}
function leerGuardado() { try { return JSON.parse(localStorage.getItem(clave()) || 'null'); } catch (_) { return null; } }
function refrescarGuardado() { $('#abrir-guardado').hidden = !leerGuardado(); }
$('#celula').addEventListener('change', e => { st.celula = Number(e.target.value); const g = leerGuardado(); $('#lugar').value = g?.lugar || ''; refrescarGuardado(); });
$('#lugar').addEventListener('input', e => { st.lugar = e.target.value.trim(); });
refrescarGuardado();

/* ---------- 1 · foto ---------- */
async function cargarFoto(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image(); img.src = url; await img.decode();
  const k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  st.foto = c; st.esquinas = []; st.lugar = $('#lugar').value.trim();
  paso('esquinas'); dibujarEsquinas();
}
$('#foto-cam').addEventListener('change', e => cargarFoto(e.target.files[0]));
$('#foto-file').addEventListener('change', e => cargarFoto(e.target.files[0]));
$('#sin-foto').addEventListener('click', () => { st.lugar = $('#lugar').value.trim(); st.rect = null; st.grid = new Uint8Array(COLS * ROWS); paso('plano'); iniciarEditor(); });
$('#abrir-guardado').addEventListener('click', async () => {
  const g = leerGuardado(); if (!g) return;
  st.lugar = g.lugar || ''; $('#lugar').value = st.lugar; st.grid = Uint8Array.from(g.grid);
  st.rect = null;
  if (g.rect) { const im = new Image(); im.src = g.rect; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); st.rect = c; }
  paso('plano'); iniciarEditor();
});

/* ---------- 2 · esquinas ---------- */
const cEsq = $('#c-esq');
function dibujarEsquinas() {
  const f = st.foto; cEsq.width = f.width; cEsq.height = f.height;
  const x = cEsq.getContext('2d'); x.drawImage(f, 0, 0);
  const r = Math.max(10, f.width * 0.012);
  if (st.esquinas.length === 4) {
    x.fillStyle = 'rgba(242,194,48,.18)'; x.strokeStyle = '#f2c230'; x.lineWidth = Math.max(3, f.width * 0.003);
    x.beginPath(); st.esquinas.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill(); x.stroke();
  }
  st.esquinas.forEach(([px, py], i) => {
    x.fillStyle = '#f2c230'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    x.fillStyle = '#141312'; x.font = `700 ${Math.round(r * 1.2)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1), px, py + 1);
  });
  const n = st.esquinas.length;
  $('#instr-esquina').innerHTML = n < 4 ? `Toca la marca negra de <b>${ESQUINAS[n]}</b> (${n + 1} de 4)` : 'Listo. Arrastra un punto si quedó corrido, o <b>lee el plano</b>.';
  $('#leer').disabled = n < 4;
}
// ajusta el toque al centro de la marca negra más cercana
// (la figura oscura más cercana al toque, rellenada por conexión: así la mesa o una sombra no la desplazan)
function ajustarAMarca(px, py) {
  const f = st.foto, R = Math.round(f.width * 0.03);
  const x0 = Math.max(0, Math.round(px - R)), y0 = Math.max(0, Math.round(py - R)), w = Math.min(f.width - x0, R * 2), h = Math.min(f.height - y0, R * 2);
  const d = f.getContext('2d', { willReadFrequently: true }).getImageData(x0, y0, w, h).data;
  const lum = new Float32Array(w * h); for (let i = 0; i < w * h; i++) lum[i] = d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2];
  const orden = Float32Array.from(lum).sort(), papel = orden[Math.floor(orden.length * 0.8)], umbral = papel * 0.45;
  const cx = Math.round(px - x0), cy = Math.round(py - y0);
  let semilla = -1, mejor = Infinity;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (lum[k] < umbral) { const dd = (i - cx) ** 2 + (j - cy) ** 2; if (dd < mejor) { mejor = dd; semilla = k; } } }
  if (semilla < 0) return [px, py];
  const vist = new Uint8Array(w * h), pila = [semilla]; vist[semilla] = 1; let sx = 0, sy = 0, n = 0;
  while (pila.length) {
    const k = pila.pop(), i = k % w, j = (k - i) / w; sx += i; sy += j; n++;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj, nk = nj * w + ni; if (ni >= 0 && nj >= 0 && ni < w && nj < h && !vist[nk] && lum[nk] < umbral) { vist[nk] = 1; pila.push(nk); } }
  }
  return n > 20 ? [x0 + sx / n, y0 + sy / n] : [px, py];
}
const aFoto = e => { const b = cEsq.getBoundingClientRect(); return [(e.clientX - b.left) * cEsq.width / b.width, (e.clientY - b.top) * cEsq.height / b.height]; };
let arrastre = -1;
cEsq.addEventListener('pointerdown', e => {
  const [px, py] = aFoto(e), tol = cEsq.width * 0.03;
  arrastre = st.esquinas.findIndex(([qx, qy]) => Math.hypot(qx - px, qy - py) < tol);
  if (arrastre >= 0) { cEsq.setPointerCapture(e.pointerId); return; }
  if (st.esquinas.length < 4) { st.esquinas.push(ajustarAMarca(px, py)); dibujarEsquinas(); }
});
cEsq.addEventListener('pointermove', e => { if (arrastre < 0) return; st.esquinas[arrastre] = aFoto(e); dibujarEsquinas(); });
cEsq.addEventListener('pointerup', () => { if (arrastre >= 0) { st.esquinas[arrastre] = ajustarAMarca(...st.esquinas[arrastre]); dibujarEsquinas(); } arrastre = -1; });
$('#rehacer').addEventListener('click', () => { st.esquinas = []; dibujarEsquinas(); });
$('#leer').addEventListener('click', () => { rectificar(); leerCeldas(); guardar(); paso('plano'); iniciarEditor(); });

/* ---------- homografía (plano en mm → foto en px) ---------- */
function homografia(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  for (let c = 0; c < 8; c++) {                       // eliminación gaussiana con pivoteo
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return (x, y) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
}
function rectificar() {
  const H = homografia(PLAN_PTS, st.esquinas), f = st.foto;
  const src = f.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, f.width, f.height).data;
  const W = PLAN.w * PX, Hh = PLAN.h * PX, out = document.createElement('canvas'); out.width = W; out.height = Hh;
  const ctx = out.getContext('2d', { willReadFrequently: true }), img = ctx.createImageData(W, Hh), d = img.data;
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const [u, v] = H(x / PX, y / PX), ui = Math.round(u), vi = Math.round(v), o = (y * W + x) * 4;
    if (ui < 0 || vi < 0 || ui >= f.width || vi >= f.height) { d[o] = d[o + 1] = d[o + 2] = 240; d[o + 3] = 255; continue; }
    const s = (vi * f.width + ui) * 4; d[o] = src[s]; d[o + 1] = src[s + 1]; d[o + 2] = src[s + 2]; d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); st.rect = out;
}

/* ---------- lectura de celdas ---------- */
function rgbAhsv(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
  let h = 0; if (dd) { if (mx === r) h = ((g - b) / dd) % 6; else if (mx === g) h = (b - r) / dd + 2; else h = (r - g) / dd + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? dd / mx : 0, mx];
}
function leerCeldas() {
  const c = st.rect, d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  // blanco del papel: mediana del brillo, para compensar la luz de cada foto
  const lums = []; for (let i = 0; i < d.length; i += 4 * 37) lums.push(d[i] + d[i + 1] + d[i + 2]);
  lums.sort((a, b) => a - b); const papel = lums[Math.floor(lums.length * 0.6)] || 600;
  const g = new Uint8Array(COLS * ROWS), cs = PLAN.cell * PX;
  for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
    if ((r < 2 || r > ROWS - 3) && (q < 2 || q > COLS - 3)) continue;   // marcas de esquina
    let oscuros = 0, n = 0, sr = 0, sg = 0, sb = 0, nc = 0;
    for (let y = r * cs + 3; y < (r + 1) * cs - 3; y++) for (let x = q * cs + 3; x < (q + 1) * cs - 3; x++) {
      const o = (y * c.width + x) * 4, R = d[o], G = d[o + 1], B = d[o + 2], l = R + G + B; n++;
      const [, s, v] = rgbAhsv(R, G, B);
      if (s > 0.38 && v > 0.28) { sr += R; sg += G; sb += B; nc++; } else if (l < papel * 0.42) oscuros++;
    }
    let tipo = T.vacio;
    if (nc > n * 0.35) {
      const [h] = rgbAhsv(sr / nc, sg / nc, sb / nc);
      tipo = h < 14 || h >= 335 ? T.pista : h < 38 ? T.acceso : h < 70 ? T.presion : h < 170 ? T.salida : h < 260 ? T.decision : T.pista;
    } else if (oscuros > n * 0.2) tipo = T.muro;
    g[r * COLS + q] = tipo;
  }
  st.grid = g;
}

/* ---------- 3 · editor ---------- */
const cPlano = $('#c-plano');
function iniciarEditor() {
  const herr = $('#herramientas'); herr.innerHTML = '';
  TIPOS.forEach((t, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === st.tool));
    b.innerHTML = `<i style="--c:${t.color}"></i>${t.nombre}`;
    b.addEventListener('click', () => { st.tool = i; $$('button', herr).forEach((x, k) => x.setAttribute('aria-checked', String(k === i))); });
    herr.append(b);
  });
  dibujarPlano(); contar();
}
function dibujarPlano() {
  const W = PLAN.w * PX, H = PLAN.h * PX, cs = PLAN.cell * PX; cPlano.width = W; cPlano.height = H;
  const x = cPlano.getContext('2d');
  x.fillStyle = '#ede8dc'; x.fillRect(0, 0, W, H);
  if (st.rect && $('#ver-foto').checked) { x.globalAlpha = 0.85; x.drawImage(st.rect, 0, 0); x.globalAlpha = 1; }
  x.strokeStyle = 'rgba(31,95,168,.35)'; x.lineWidth = 1;
  for (let q = 0; q <= COLS; q++) { x.beginPath(); x.moveTo(q * cs + .5, 0); x.lineTo(q * cs + .5, H); x.stroke(); }
  for (let r = 0; r <= ROWS; r++) { x.beginPath(); x.moveTo(0, r * cs + .5); x.lineTo(W, r * cs + .5); x.stroke(); }
  for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
    const t = st.grid[r * COLS + q]; if (!t) continue;
    x.fillStyle = TIPOS[t].color; x.globalAlpha = t === T.muro ? 0.82 : 0.9;
    if (t === T.muro) x.fillRect(q * cs + 1, r * cs + 1, cs - 2, cs - 2);
    else { x.beginPath(); x.arc(q * cs + cs / 2, r * cs + cs / 2, cs * 0.42, 0, 7); x.fill(); }
    x.globalAlpha = 1;
  }
}
const celdaDe = e => { const b = cPlano.getBoundingClientRect(); return [Math.floor((e.clientX - b.left) / b.width * COLS), Math.floor((e.clientY - b.top) / b.height * ROWS)]; };
let pintando = false;
function pintar(e) { const [q, r] = celdaDe(e); if (q < 0 || r < 0 || q >= COLS || r >= ROWS) return; st.grid[r * COLS + q] = st.tool; dibujarPlano(); }
cPlano.addEventListener('pointerdown', e => { pintando = true; cPlano.setPointerCapture(e.pointerId); pintar(e); });
cPlano.addEventListener('pointermove', e => { if (pintando) pintar(e); });
cPlano.addEventListener('pointerup', () => { if (pintando) { pintando = false; contar(); guardar(); } });
$('#ver-foto').addEventListener('change', dibujarPlano);
$('#volver-esq').addEventListener('click', () => { if (st.foto) { paso('esquinas'); dibujarEsquinas(); } else paso('foto'); });

// los stickers ocupan varias celdas: se agrupan en piezas (componentes conectados)
function piezas(tipo) {
  const vist = new Uint8Array(COLS * ROWS), out = [];
  for (let i = 0; i < st.grid.length; i++) {
    if (st.grid[i] !== tipo || vist[i]) continue;
    const pila = [i], celdas = []; vist[i] = 1;
    while (pila.length) {
      const k = pila.pop(); celdas.push(k); const q = k % COLS, r = Math.floor(k / COLS);
      for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nq = q + dq, nr = r + dr, nk = nr * COLS + nq; if (nq >= 0 && nr >= 0 && nq < COLS && nr < ROWS && !vist[nk] && st.grid[nk] === tipo) { vist[nk] = 1; pila.push(nk); } }
    }
    out.push({ q: celdas.reduce((a, k) => a + (k % COLS), 0) / celdas.length, r: celdas.reduce((a, k) => a + Math.floor(k / COLS), 0) / celdas.length, n: celdas.length });
  }
  return out;
}
function contar() {
  const filas = [], falta = [];
  for (const t of TIPOS) {
    if (t.id === 'vacio') continue;
    const n = t.id === 'muro' ? st.grid.filter(v => v === T.muro).length : piezas(T[t.id]).length;
    const ok = !t.meta || n >= t.meta;
    if (!ok) falta.push(`${t.meta - n} ${t.nombre.toLowerCase()}`);
    filas.push(`<li class="${t.meta ? (ok ? 'ok' : 'falta') : ''}"><i style="--c:${t.color}"></i><span>${t.nombre}${t.meta ? ` <small>(plantilla: ${t.meta})</small>` : ''}</span><b>${n}${t.id === 'muro' ? ' celdas' : ''}</b></li>`);
  }
  $('#cuenta').innerHTML = filas.join('');
  $('#veredicto').textContent = falta.length ? `Le falta: ${falta.join(', ')}. Se puede levantar igual, pero el nivel no se leerá completo.` : 'El plano tiene todo lo de la plantilla: acceso, 3 pistas, presión, decisión, salida e hito.';
}
$('#levantar').addEventListener('click', () => { guardar(); paso('mundo'); mundo.construir(); });
$('#volver-plano').addEventListener('click', () => { paso('plano'); iniciarEditor(); });

/* ---------- 4 · mundo 3D ---------- */
const mundo = (() => {
  const canvas = $('#c-3d'), S = 1.2, ALTO = 3.4;           // 1 celda = 1,2 m; muros de 3,4 m
  const W = COLS * S, D = ROWS * S;
  let renderer, scene, camera, raf = 0, t0 = 0, modo = 'revelar', muros, features = [], pisoMat;
  const pj = { x: W / 2, z: D / 2, yaw: 0, pitch: 0, mv: 0 }, teclas = new Set();
  const celdaEn = (x, z) => { const q = Math.floor(x / S), r = Math.floor(z / S); return q < 0 || r < 0 || q >= COLS || r >= ROWS ? T.muro : st.grid[r * COLS + q]; };

  function construir() {
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      addEventListener('resize', ajustar);
    }
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#14111a'); scene.fog = new THREE.FogExp2('#1d1820', 0.014);
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);
    scene.add(new THREE.HemisphereLight('#c9bfd8', '#2a2018', 1.25));
    const sol = new THREE.DirectionalLight('#ffb27a', 0.45); sol.position.set(-20, 40, 10); scene.add(sol);
    const luna = new THREE.DirectionalLight('#9fb8e8', 1.1); luna.position.set(30, 30, -20); scene.add(luna);
    // el papel es el piso: la foto corregida (o una cuadrícula) bajo el nivel
    const pc = document.createElement('canvas'); pc.width = PLAN.w * PX; pc.height = PLAN.h * PX;
    const px = pc.getContext('2d'); px.fillStyle = '#ede8dc'; px.fillRect(0, 0, pc.width, pc.height);
    if (st.rect) px.drawImage(st.rect, 0, 0);
    px.strokeStyle = 'rgba(31,95,168,.35)'; for (let q = 0; q <= COLS; q++) { px.beginPath(); px.moveTo(q * 20, 0); px.lineTo(q * 20, pc.height); px.stroke(); } for (let r = 0; r <= ROWS; r++) { px.beginPath(); px.moveTo(0, r * 20); px.lineTo(pc.width, r * 20); px.stroke(); }
    const tex = new THREE.CanvasTexture(pc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    pisoMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, color: '#bdb6aa' });
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(PLAN.w / PLAN.cell * S, PLAN.h / PLAN.cell * S), pisoMat);
    piso.rotation.x = -Math.PI / 2; piso.position.set(PLAN.w / PLAN.cell * S / 2, 0, PLAN.h / PLAN.cell * S / 2); scene.add(piso);
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#2a221c', roughness: 1 }));
    suelo.rotation.x = -Math.PI / 2; suelo.position.set(W / 2, -0.02, D / 2); scene.add(suelo);
    // muros: un solo dibujo instanciado; crecen desde el papel
    const celdasMuro = []; st.grid.forEach((v, i) => { if (v === T.muro) celdasMuro.push(i); });
    const geo = new THREE.BoxGeometry(S, 1, S).translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#cfc3ae', roughness: 0.9 });
    muros = new THREE.InstancedMesh(geo, mat, Math.max(1, celdasMuro.length)); muros.count = celdasMuro.length; muros.userData.celdas = celdasMuro;
    const tonos = ['#d8cbb4', '#cdb99a', '#e2d7c3', '#c9b48f'];
    celdasMuro.forEach((k, i) => muros.setColorAt(i, new THREE.Color(tonos[(k * 7) % tonos.length])));
    if (muros.instanceColor) muros.instanceColor.needsUpdate = true;
    scene.add(muros); fijarAltura(0.02);
    // piezas: pistas, presión, decisión, salida, acceso, hito, cámaras
    features = [];
    const add = (tipo, f) => {
      const x = (f.q + 0.5) * S, z = (f.r + 0.5) * S, col = new THREE.Color(TIPOS[tipo].color), g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      const alto = tipo === T.hito ? 16 : tipo === T.salida ? 12 : 6;
      const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, alto, 16, 1, true).translate(0, alto / 2, 0), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const aro = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      aro.rotation.x = -Math.PI / 2; aro.position.y = 0.04;
      const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 }));
      gema.position.y = 2.2; g.add(columna, aro, gema);
      if (tipo === T.hito) { const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 10, 8).translate(0, 5, 0), new THREE.MeshStandardMaterial({ color: '#3a3631', roughness: 0.8 })); g.add(torre); gema.position.y = 11; gema.scale.setScalar(2); }
      if (tipo === T.camara) { columna.visible = false; const cono = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 4, 1, true), new THREE.MeshBasicMaterial({ color: col, wireframe: true })); cono.rotation.z = Math.PI / 2; cono.position.y = 1.6; g.add(cono); }
      const luz = new THREE.PointLight(col, tipo === T.acceso ? 1.2 : 2.4, 6, 1.8); luz.position.y = 1.8; g.add(luz);
      features.push({ g, gema, tipo });
    };
    for (const nombre of ['pista', 'presion', 'decision', 'salida', 'acceso', 'hito', 'camara']) for (const f of piezas(T[nombre])) add(T[nombre], f);
    // inicio del jugador: el acceso, o el centro
    const acc = piezas(T.acceso)[0], hito = piezas(T.hito)[0] || piezas(T.salida)[0];
    pj.x = acc ? (acc.q + 0.5) * S : W / 2; pj.z = acc ? (acc.r + 0.5) * S : D / 2;
    pj.yaw = hito ? Math.atan2((hito.r + 0.5) * S - pj.z, (hito.q + 0.5) * S - pj.x) : 0; pj.pitch = 0;
    $('#slug-t').textContent = `EXT. ${(st.lugar || 'Pasto 2037').toUpperCase()} · NOCHE`;
    $('#slug-r').textContent = `Célula ${st.celula} · del plano al mundo jugable`;
    ajustar(); poner('revelar'); t0 = performance.now(); arrancar();
  }
  function fijarAltura(k) {
    const m = new THREE.Matrix4(), cel = muros.userData.celdas;
    cel.forEach((c, i) => { const q = c % COLS, r = Math.floor(c / COLS); m.makeScale(1, Math.max(0.02, k) * ALTO, 1).setPosition((q + 0.5) * S, 0, (r + 0.5) * S); muros.setMatrixAt(i, m); });
    muros.instanceMatrix.needsUpdate = true;
  }
  function ajustar() { if (!renderer) return; const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function poner(m) {
    modo = m; $$('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    $('#paso-mundo').classList.toggle('is-recorrer', m === 'recorrer');
    $('#ayuda-mundo').hidden = m !== 'recorrer';
    if (m === 'revelar') t0 = performance.now();
  }
  const ease = u => u * u * (3 - 2 * u);
  function cuadro() {
    raf = requestAnimationFrame(cuadro);
    const t = (performance.now() - t0) / 1000, cx = W / 2, cz = D / 2, R = Math.max(W, D);
    let crecer = 1;
    if (modo === 'revelar') {
      // del plano al mundo: cenital sobre el papel → los muros suben → la cámara baja en órbita
      crecer = ease(Math.min(1, Math.max(0, (t - 0.8) / 2.4)));
      const k = ease(Math.min(1, Math.max(0, (t - 1.2) / 3.5))), a = -Math.PI / 2 + t * 0.12;
      const alt = R * 1.25 * (1 - k) + R * 0.42 * k, rad = 0.01 + R * 0.62 * k;
      camera.position.set(cx + Math.cos(a) * rad, alt, cz + Math.sin(a) * rad); camera.fov = 50; camera.lookAt(cx, 0, cz);
      if (t > 4.8) poner('orbita');
    } else if (modo === 'orbita') {
      const a = -Math.PI / 2 + 0.58 + (performance.now() - t0) / 1000 * 0.08;
      camera.position.set(cx + Math.cos(a) * R * 0.62, R * 0.42, cz + Math.sin(a) * R * 0.62); camera.lookAt(cx, 1.5, cz);
    } else if (modo === 'plano') {
      camera.position.set(cx, R * 1.25, cz + 0.01); camera.lookAt(cx, 0, cz); crecer = 0.02;
    } else {
      const f = (teclas.has('w') || teclas.has('arrowup') ? 1 : 0) - (teclas.has('s') || teclas.has('arrowdown') ? 1 : 0) + pj.mv;
      const giro = (teclas.has('d') || teclas.has('arrowright') ? 1 : 0) - (teclas.has('a') || teclas.has('arrowleft') ? 1 : 0);
      pj.yaw += giro * 0.035;
      const nx = pj.x + Math.cos(pj.yaw) * f * 0.09, nz = pj.z + Math.sin(pj.yaw) * f * 0.09;
      if (celdaEn(nx, pj.z) !== T.muro) pj.x = nx; if (celdaEn(pj.x, nz) !== T.muro) pj.z = nz;
      camera.position.set(pj.x, 1.65, pj.z); camera.fov = 65;
      camera.lookAt(pj.x + Math.cos(pj.yaw) * Math.cos(pj.pitch), 1.65 + Math.sin(pj.pitch), pj.z + Math.sin(pj.yaw) * Math.cos(pj.pitch));
    }
    camera.updateProjectionMatrix();
    fijarAltura(crecer);
    for (const f of features) { f.gema.rotation.y = t * 1.4; f.gema.position.y = (f.tipo === T.hito ? 11 : 2.2) + Math.sin(t * 2 + f.g.position.x) * 0.15; }
    renderer.render(scene, camera);
  }
  function arrancar() { cancelAnimationFrame(raf); cuadro(); }
  function stop() { cancelAnimationFrame(raf); }
  // controles
  $$('[data-modo]').forEach(b => b.addEventListener('click', () => poner(b.dataset.modo)));
  addEventListener('keydown', e => { if (!$('#paso-mundo').hidden) teclas.add(e.key.toLowerCase()); });
  addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
  let mira = null;
  canvas.addEventListener('pointerdown', e => { if (modo !== 'recorrer') return; mira = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!mira || mira.id !== e.pointerId) return; pj.yaw += (e.clientX - mira.x) * 0.005; pj.pitch = Math.max(-0.8, Math.min(0.8, pj.pitch - (e.clientY - mira.y) * 0.005)); mira.x = e.clientX; mira.y = e.clientY; });
  canvas.addEventListener('pointerup', () => { mira = null; });
  $$('[data-mv]').forEach(b => {
    b.addEventListener('pointerdown', () => { pj.mv = Number(b.dataset.mv); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { pj.mv = 0; });
  });
  $('#captura').addEventListener('click', () => {
    if (!renderer) return; renderer.render(scene, camera);
    const a = document.createElement('a'); a.download = `galeras-2037-celula-${st.celula}.png`; a.href = canvas.toDataURL('image/png'); a.click();
  });
  return { construir, stop };
})();

// solo para pruebas (?debug): cargar una foto sintética y simular los toques
if (new URLSearchParams(location.search).has('debug')) window.escaner = {
  st, PLAN, COLS, ROWS, T, homografia,
  usarFoto(c) { st.foto = c; st.esquinas = []; paso('esquinas'); dibujarEsquinas(); },
  tocar(px, py) { st.esquinas.push(ajustarAMarca(px, py)); dibujarEsquinas(); },
};
