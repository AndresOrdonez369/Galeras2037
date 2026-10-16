// Prueba del escáner con una foto sintética (abrir /escaner/?debug y ejecutar: import('/tools/prueba-escaner.js').then(m => m.run()))
// Dibuja un plano A3 con la geometría del kit, lo deforma en perspectiva con luz despareja y simula los 4 toques.
export async function run({ hito = true, levantar = true } = {}) {
  const E = window.escaner, k = 3, PW = 312 * k, PH = 273 * k;
  const p = document.createElement('canvas'); p.width = PW; p.height = PH; const x = p.getContext('2d');
  x.fillStyle = '#f3efe4'; x.fillRect(0, 0, PW, PH);
  x.strokeStyle = 'rgba(31,95,168,.3)'; x.lineWidth = 1;
  for (let i = 0; i <= 31; i++) { x.beginPath(); x.moveTo(i * 30, 0); x.lineTo(i * 30, PH); x.stroke(); }
  for (let j = 0; j <= 27; j++) { x.beginPath(); x.moveTo(0, j * 30); x.lineTo(PW, j * 30); x.stroke(); }
  for (const [mx, my] of [[4, 4], [294, 4], [4, 255], [294, 255]]) { x.fillStyle = '#111'; x.fillRect(mx * k, my * k, 42, 42); x.fillStyle = '#f3efe4'; x.fillRect(mx * k + 12, my * k + 12, 18, 18); }
  x.strokeStyle = '#141312'; x.lineWidth = 12; x.lineCap = 'round';
  const L = (a, b, c, d) => { x.beginPath(); x.moveTo(a * 30 + 15, b * 30 + 15); x.lineTo(c * 30 + 15, d * 30 + 15); x.stroke(); };
  L(4, 4, 26, 4); L(4, 4, 4, 22); L(4, 22, 12, 22); L(16, 22, 26, 22); L(26, 4, 26, 22); L(14, 4, 14, 14); L(8, 10, 14, 10); L(20, 10, 20, 22);
  const sticker = (q, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(q * 30 + 15, r * 30 + 15, 28, 0, 7); x.fill(); };
  sticker(6, 6, '#d42a1e'); sticker(17, 7, '#d42a1e'); sticker(23, 19, '#d42a1e'); sticker(10, 16, '#f2c230'); sticker(17, 16, '#1f5fa8'); sticker(14, 23, '#f26b1d'); sticker(23, 6, '#2e8b57');
  x.strokeStyle = 'rgba(80,80,80,.5)'; x.lineWidth = 2; x.setLineDash([8, 8]); x.beginPath(); x.arc(9 * 30, 7 * 30, 50, 0, 7); x.stroke(); x.setLineDash([]);
  const FW = 1500, FH = 1150, f = document.createElement('canvas'); f.width = FW; f.height = FH; const fx = f.getContext('2d');
  const quad = [[150, 120], [1380, 190], [1330, 1060], [100, 985]], esq = [[0, 0], [PW, 0], [PW, PH], [0, PH]];
  const inv = E.homografia(quad, esq), src = x.getImageData(0, 0, PW, PH).data, img = fx.createImageData(FW, FH), d = img.data;
  for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) {
    const [u, v] = inv(i, j), o = (j * FW + i) * 4, luz = 0.78 + 0.22 * (i / FW) - 0.08 * (j / FH);
    if (u < 0 || v < 0 || u >= PW || v >= PH) { d[o] = 90; d[o + 1] = 74; d[o + 2] = 58; d[o + 3] = 255; continue; }
    const s = (Math.floor(v) * PW + Math.floor(u)) * 4; d[o] = src[s] * luz; d[o + 1] = src[s + 1] * luz; d[o + 2] = src[s + 2] * luz; d[o + 3] = 255;
  }
  fx.putImageData(img, 0, 0);
  document.querySelector('#lugar').value = 'Plaza del Carnaval'; document.querySelector('#lugar').dispatchEvent(new Event('input'));
  E.usarFoto(f);
  const fwd = E.homografia(esq, quad);
  const centros = [[11, 11], [301, 11], [301, 262], [11, 262]].map(([a, b]) => fwd(a * k, b * k));
  centros.forEach(([cx, cy], i) => E.tocar(cx + (i % 2 ? 9 : -7), cy + (i < 2 ? 8 : -6)));
  const error = E.st.esquinas.map((q, i) => Math.round(Math.hypot(q[0] - centros[i][0], q[1] - centros[i][1]) * 10) / 10);
  document.querySelector('#leer').click();
  if (hito) { E.st.grid[13 * E.COLS + 10] = E.T.hito; document.querySelector('#ver-foto').dispatchEvent(new Event('change')); }
  if (levantar) document.querySelector('#levantar').click();
  return { error };
}
