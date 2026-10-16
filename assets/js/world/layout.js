// Trazado del nivel: puestos, manzanas coloniales, torres y colisiones, a partir de LEVEL.
import { LEVEL } from '../level.js';
import { C, mulberry32 } from './textures.js';

// Cada bloque: { x, z, w (eje X), d (eje Z), h, kind: 'colonial' | 'tower' | 'low' }
export function buildLayout() {
  const r = mulberry32(2037);
  const L = LEVEL;
  const stalls = [], blocks = [], colliders = [];
  const tarpColors = [C.blue, C.orange, C.blue, '#2b6fb8', '#e2621b', '#3a78a8', C.yellow, '#9a3a22'];

  // Puestos del Potrerillo
  for (const side of [-1, 1]) {
    let x = L.market.x0 - 2;
    while (x > L.market.x1 + 2) {
      const w = 2.8 + r() * 1.2;
      if (r() > 0.05) stalls.push({ x: x - w / 2, side, w, color: tarpColors[Math.floor(r() * tarpColors.length)], h: 2.6 + r() * 0.5 });
      x -= w + 0.25;
    }
  }
  for (const s of stalls) {
    const zIn = s.side * L.market.half;
    colliders.push(box(s.x, zIn + s.side * 0.55, s.w * 0.9, 1));
  }

  // Mercado: mezcla de bodegas bajas y torres nuevas
  for (const side of [-1, 1]) {
    let x = L.market.x0 + 2;
    while (x > L.market.x1) {
      const w = 5 + r() * 7, d = 6 + r() * 6, tall = r() > 0.62;
      const h = tall ? 16 + r() * 16 : 5 + r() * 5;
      blocks.push({ x: x - w / 2, z: side * (7.6 + d / 2), w: w - 0.4, d, h, kind: tall ? 'tower' : 'low' });
      x -= w;
    }
  }

  // Calle Real: fachadas coloniales continuas; abertura del callejón al norte
  const A = L.alley;
  for (const side of [-1, 1]) {
    let x = L.street.x0;
    while (x > L.street.x1 + 1) {
      const w = Math.min(5 + r() * 3, x - L.street.x1);
      const x0 = x, x1 = x - w;
      const cut = side === 1 && x1 < A.x + A.w / 2 && x0 > A.x - A.w / 2;
      if (cut) {
        // dos bloques, dejando el paso del callejón
        if (x0 > A.x + A.w / 2 + 0.5) pushColonial(blocks, (x0 + A.x + A.w / 2) / 2, side, x0 - (A.x + A.w / 2), r, 14.4);
        if (A.x - A.w / 2 > x1 + 0.5) pushColonial(blocks, (A.x - A.w / 2 + x1) / 2, side, (A.x - A.w / 2) - x1, r, 14.4);
      } else pushColonial(blocks, x - w / 2, side, w, r, side === 1 ? 14.4 : 9 + r() * 3);
      x -= w;
    }
  }

  // Lado norte del callejón (tras el atrio de San Juan)
  for (const [a, b] of [[L.street.x0, -51], [-70, L.plaza.x0]]) {
    let x = a;
    while (x > b + 0.5) { const w = Math.min(5 + r() * 3, x - b); blocks.push({ x: x - w / 2, z: 22.6 + 4, w: w - 0.3, d: 8, h: 7 + r() * 3, kind: 'colonial' }); x -= w; }
  }

  // Plaza de Nariño: manzanas con portales
  const P = L.plaza;
  const arcades = [];
  // este (lado de la calle): dos tramos
  sideRow(blocks, arcades, r, 'x', P.x0 + 4, [[P.z0, -L.street.half], [L.street.half, 16]], 8);
  // oeste (lado de la avenida)
  sideRow(blocks, arcades, r, 'x', P.x1 - 4, [[P.z0, -L.avenue.half], [L.avenue.half, P.z1]], 8);
  // norte, con portales
  rowAlong(blocks, arcades, r, P.x0 - 4, P.x1 + 4, P.z1 + 4, 8, true);
  // sur: a los lados de la catedral
  const cat = L.cathedral;
  rowAlong(blocks, arcades, r, P.x0 - 0.5, cat.x + cat.w / 2 + 1, P.z0 - 4, 8, false);
  rowAlong(blocks, arcades, r, cat.x - cat.w / 2 - 1, P.x1 + 0.5, P.z0 - 4, 8, false);

  // Avenida al páramo: casas bajas que se acaban
  for (const side of [-1, 1]) {
    let x = L.avenue.x0 - 9;
    while (x > -152) { const w = 5 + r() * 4; const d = 7 + r() * 3; blocks.push({ x: x - w / 2, z: side * (L.avenue.half + d / 2), w: w - 0.5, d, h: 4 + r() * 3, kind: 'colonial' }); x -= w + (r() > 0.6 ? 3 : 0); }
  }

  // Skyline: torres del Pasto nuevo detrás de todo
  const skyline = [];
  for (let x = 16; x > -150; x -= 7 + r() * 8) {
    for (const side of [-1, 1]) {
      if (r() < 0.25) continue;
      const w = 6 + r() * 7, d = 6 + r() * 7, h = 18 + r() * 34;
      skyline.push({ x, z: side * (48 + r() * 40), w, d, h, kind: 'tower', banner: r() > 0.6 });
    }
  }

  for (const b of blocks) colliders.push(box(b.x, b.z, b.w, b.d));
  // hitos
  colliders.push(box(cat.x, cat.z, cat.w, cat.d));
  colliders.push(box(L.sanjuan.x, L.sanjuan.z + 5, 14, 12));
  colliders.push(box(L.statue.x, L.statue.z, 3.2, 3.2));
  colliders.push(box(L.float.x, L.float.z, 9.6, 6));
  colliders.push(box(L.scanner.x, -L.street.half + 0.3, 0.6, 0.6), box(L.scanner.x, L.street.half - 0.3, 0.6, 0.6));
  colliders.push(box(L.gate.x, -5.2, 1.2, 1.2), box(L.gate.x, 5.2, 1.2, 1.2));
  for (const a of arcades) colliders.push(box(a.x, a.z, 0.5, 0.5));

  return { stalls, blocks, skyline, arcades, colliders };
}

function box(x, z, w, d) { return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }; }

function pushColonial(blocks, cx, side, w, r, d) {
  const L = LEVEL;
  blocks.push({ x: cx, z: side * (L.street.half + d / 2), w: w - 0.3, d, h: 7 + r() * 3.5, kind: 'colonial', street: true, side });
}

// fila a lo largo de Z en una X fija (lados este/oeste de la plaza)
function sideRow(blocks, arcades, r, _axis, x, spans, d) {
  for (const [z0, z1] of spans) {
    let z = z0;
    while (z < z1 - 0.5) {
      const w = Math.min(6 + r() * 3, z1 - z);
      blocks.push({ x, z: z + w / 2, w: d, d: w - 0.3, h: 8 + r() * 3, kind: 'colonial' });
      z += w;
    }
  }
}

// fila a lo largo de X en una Z fija (lados norte/sur)
function rowAlong(blocks, arcades, r, xa, xb, z, d, portales) {
  let x = xa;
  while (x > xb + 0.5) {
    const w = Math.min(6 + r() * 3, x - xb);
    blocks.push({ x: x - w / 2, z, w: w - 0.3, d, h: 8 + r() * 3, kind: 'colonial' });
    x -= w;
  }
  if (portales) for (let px = xa - 1.5; px > xb + 1; px -= 3.2) arcades.push({ x: px, z: z - d / 2 - 1.6 });
}
