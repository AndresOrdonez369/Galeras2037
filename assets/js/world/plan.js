// El plano de papel del nivel, dibujado como en la plantilla A3 del taller.
import { LEVEL, MAP, CHAPTERS } from '../level.js';
import { buildLayout } from './layout.js';
import { C, canvas, mulberry32 } from './textures.js';

export const PLAN_W = 2480;
export const PLAN_H = Math.round(PLAN_W * (MAP.z1 - MAP.z0) / (MAP.x1 - MAP.x0));
export const px = x => (x - MAP.x0) / (MAP.x1 - MAP.x0) * PLAN_W;
export const pz = z => (z - MAP.z0) / (MAP.z1 - MAP.z0) * PLAN_H;

export async function planCanvas() {
  try { await Promise.all(['400 40px Bungee', '700 26px Atkinson'].map(f => document.fonts.load(f))); } catch (_) { /* respaldo */ }
  return mapCanvas(buildLayout());
}

export function mapCanvas(lay) {
  const W = PLAN_W, H = PLAN_H, r = mulberry32(369), L = LEVEL;
  const [c, ctx] = canvas(W, H);
  const m = W / (MAP.x1 - MAP.x0);
  const j = () => (r() - 0.5) * 5;

  // papel + cuadrícula + marcas del escáner
  ctx.fillStyle = C.paperHi; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(120,105,80,${r() * 0.06})`; ctx.fillRect(r() * W, r() * H, 1 + r() * 3, 1); }
  ctx.strokeStyle = 'rgba(31,95,168,.2)'; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += m * 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += m * 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (const [x, y] of [[24, 24], [W - 84, 24], [24, H - 84], [W - 84, H - 84]]) { ctx.fillStyle = C.marker; ctx.fillRect(x, y, 60, 60); ctx.fillStyle = C.paperHi; ctx.fillRect(x + 18, y + 18, 24, 24); }

  // zonas (lavado de acuarela)
  const wash = (x0, x1, z0, z1, col) => { ctx.fillStyle = col; ctx.fillRect(px(x0), pz(z0), px(x1) - px(x0), pz(z1) - pz(z0)); };
  wash(L.market.x1, L.market.x0, -7, 7, 'rgba(242,107,29,.10)');
  wash(L.plaza.x1, L.plaza.x0, L.plaza.z0, L.plaza.z1, 'rgba(31,95,168,.08)');
  wash(-192, -150, -40, 40, 'rgba(46,139,87,.10)');

  // puestos (lápiz)
  ctx.strokeStyle = 'rgba(40,36,30,.55)'; ctx.lineWidth = 3;
  for (const s of lay.stalls) {
    const z0 = s.side * L.market.half, z1 = s.side * (L.market.half + 3);
    ctx.strokeRect(px(s.x - s.w / 2), pz(Math.min(z0, z1)), s.w * m, Math.abs(z1 - z0) * m);
  }
  // muros: marcador
  ctx.fillStyle = C.marker;
  const block = (x, z, w, d) => {
    const x0 = px(x - w / 2), x1 = px(x + w / 2), y0 = pz(z - d / 2), y1 = pz(z + d / 2);
    ctx.beginPath(); ctx.moveTo(x0 + j(), y0 + j()); ctx.lineTo(x1 + j(), y0 + j()); ctx.lineTo(x1 + j(), y1 + j()); ctx.lineTo(x0 + j(), y1 + j()); ctx.closePath(); ctx.fill();
  };
  for (const b of lay.blocks) block(b.x, b.z, b.w, b.d);
  // portales
  for (const a of lay.arcades) { ctx.beginPath(); ctx.arc(px(a.x), pz(a.z), 5, 0, 7); ctx.fill(); }
  // catedral y San Juan: rayados
  const hatch = (x, z, w, d) => {
    block(x, z, w, d);
    ctx.save(); ctx.beginPath(); ctx.rect(px(x - w / 2), pz(z - d / 2), w * m, d * m); ctx.clip();
    ctx.strokeStyle = C.paperHi; ctx.lineWidth = 3;
    for (let k = -H; k < W; k += 16) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + H, H); ctx.stroke(); }
    ctx.restore();
  };
  hatch(L.cathedral.x, L.cathedral.z, L.cathedral.w, L.cathedral.d);
  hatch(L.sanjuan.x, L.sanjuan.z + 5, 14, 12);
  // estatua, carroza, escáner, puerta
  ctx.strokeStyle = C.marker; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(px(L.statue.x), pz(L.statue.z), 2.4 * m, 0, 7); ctx.stroke();
  ctx.strokeStyle = C.blue; ctx.setLineDash([10, 8]); ctx.strokeRect(px(L.float.x - 3), pz(L.float.z - 2), 6 * m, 4 * m); ctx.setLineDash([]);
  ctx.fillStyle = C.yellow; ctx.fillRect(px(L.scanner.x) - 6, pz(-L.street.half), 12, L.street.half * 2 * m);

  // camino crítico, desvío y ramas de la decisión
  const route = (pts, col, wdt, dash) => {
    ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.setLineDash(dash); ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z)))); ctx.stroke(); ctx.setLineDash([]);
  };
  route(L.path, 'rgba(242,107,29,.95)', 7, [26, 14]);
  route(L.detour, 'rgba(20,19,18,.7)', 4, [12, 10]);
  route(L.branchA, 'rgba(31,95,168,.95)', 5, [8, 8]);
  route(L.branchB, 'rgba(200,38,30,.95)', 5, [8, 8]);
  // flechas sobre el camino
  ctx.fillStyle = C.orange;
  for (let i = 1; i < L.path.length; i += 2) {
    const [ax, az] = L.path[i - 1], [bx, bz] = L.path[i];
    const a = Math.atan2(pz(bz) - pz(az), px(bx) - px(ax));
    ctx.save(); ctx.translate((px(ax) + px(bx)) / 2, (pz(az) + pz(bz)) / 2); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // zonas sonoras
  ctx.strokeStyle = 'rgba(46,139,87,.6)'; ctx.lineWidth = 4; ctx.setLineDash([10, 12]);
  for (const [x, z, rr] of L.soundZones) { ctx.beginPath(); ctx.arc(px(x), pz(z), rr * m, 0, 7); ctx.stroke(); }
  ctx.setLineDash([]);

  // cámaras: una por capítulo con toma
  let n = 0;
  for (const ch of CHAPTERS) {
    if (!ch.cam || ch.cam.top || n >= 6 || ch.id === 'llegada' || ch.id === 'camino') continue;
    const [x, , z] = ch.cam.pos, [lx, , lz] = ch.cam.look;
    if (x < MAP.x0 || x > MAP.x1) continue;
    n++;
    const a = Math.atan2(pz(lz) - pz(z), px(lx) - px(x)), s = 22;
    ctx.save(); ctx.translate(px(x), pz(z)); ctx.rotate(a);
    ctx.fillStyle = 'rgba(31,95,168,.15)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 4.6, -s * 1.9); ctx.lineTo(s * 4.6, s * 1.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(s * 0.9, 0); ctx.lineTo(-s * 0.6, -s * 0.75); ctx.lineTo(-s * 0.6, s * 0.75); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.font = '400 28px Bungee'; ctx.fillStyle = C.blue; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(n), px(x), pz(z) + (z > 0 ? 38 : -38));
  }

  // stickers
  const sticker = (x, z, col, rad = 22) => {
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.arc(px(x) + 3, pz(z) + 4, rad, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px(x), pz(z), rad, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(px(x) - rad * 0.3, pz(z) - rad * 0.3, rad * 0.32, 0, 7); ctx.fill();
  };
  L.pistas.forEach(p => sticker(p.x, p.z, C.red));
  sticker(L.presion.x, L.presion.z, C.yellow, 26);
  sticker(L.decision.x, L.decision.z, C.blue, 26);
  sticker(L.salida.x, L.salida.z, C.green, 28);
  const star = (cx, cy, R) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); };
  ctx.fillStyle = C.orange; star(px(L.acceso.x), pz(L.acceso.z), 32); ctx.fill();

  // nombres de lugares, a mano
  ctx.fillStyle = 'rgba(20,19,18,.82)'; ctx.font = '400 30px Bungee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const place = (t, x, z, rot = 0) => { ctx.save(); ctx.translate(px(x), pz(z)); ctx.rotate(rot); ctx.fillText(t, 0, 0); ctx.restore(); };
  place('POTRERILLO', -12, -13);
  place('CALLE REAL', -57, -13);
  place('PLAZA DE NARIÑO', -100, 15);
  place('CATEDRAL', -100, -45 + 3);
  place('SAN JUAN', -60, 40);
  place('PÁRAMO', -178, -16);
  ctx.font = '400 22px Bungee'; place('desvío', -40, 13, -Math.PI / 2);

  // título y leyenda
  ctx.fillStyle = C.marker; ctx.font = '400 38px Bungee'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('PLANO DE NIVEL · CONTRABANDO DE ROSTROS', 120, H - 132);
  ctx.font = '700 25px Atkinson'; ctx.fillStyle = 'rgba(20,19,18,.75)';
  ctx.fillText('Célula 0 · Pasto 2037 · versión 2 · 1 cuadro = 4 m', 122, H - 96);
  const lx = W - 800, ly = H - 200;
  ctx.fillStyle = 'rgba(237,232,220,.94)'; ctx.fillRect(lx - 24, ly - 48, 720, 172);
  ctx.strokeStyle = C.marker; ctx.lineWidth = 3; ctx.strokeRect(lx - 24, ly - 48, 720, 172);
  const items = [[C.orange, 'acceso'], [C.red, 'pista'], [C.yellow, 'presión'], [C.blue, 'decisión'], [C.green, 'salida']];
  ctx.font = '700 27px Atkinson'; ctx.textBaseline = 'middle';
  items.forEach(([col, label], i) => {
    const x = lx + (i % 3) * 228, y = ly + Math.floor(i / 3) * 56;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 14, y, 14, 0, 7); ctx.fill();
    ctx.fillStyle = C.marker; ctx.fillText(label, x + 38, y + 1);
  });
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(lx + 456 + 30, ly + 56); ctx.lineTo(lx + 456 + 4, ly + 40); ctx.lineTo(lx + 456 + 4, ly + 72); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.marker; ctx.fillText('cámara', lx + 456 + 38, ly + 57);
  ctx.fillRect(lx, ly + 100, 56, 10); ctx.fillText('muro', lx + 70, ly + 105);
  ctx.strokeStyle = C.orange; ctx.lineWidth = 6; ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.moveTo(lx + 228, ly + 105); ctx.lineTo(lx + 300, ly + 105); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillText('camino crítico', lx + 312, ly + 105);
  return c;
}
