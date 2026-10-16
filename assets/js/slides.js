import { loadImages } from './img.js';
import { qrSVG } from './qr.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const coarse = matchMedia('(pointer: coarse)').matches;
if (coarse) document.body.classList.add('touch');

const all = $$('.slide');
let showArchive = params.has('archivo');
let deck = [];          // slides visibles en este modo
let i = 0;
// Solo una ventana principal y su ventana de presentador comparten canal.
const SYNC = params.get('presentador') || Math.random().toString(36).slice(2, 9);
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('galeras-slides-' + SYNC) : null;

loadImages(document, '../assets/img/');

// QR del cierre: siempre apunta a la web donde estén publicadas estas slides
const siteURL = new URL('../', location.href).href.replace(/[?#].*$/, '');
$$('.qr').forEach(q => { try { q.innerHTML = qrSVG(siteURL); } catch (err) { console.error(err); } });
$$('[data-site-url]').forEach(el => { el.textContent = siteURL.replace(/^https?:\/\//, '').replace(/\/$/, ''); });

// visor de cámara en cada slide: esquinas y número de plano
all.forEach(sl => { const v = document.createElement('div'); v.className = 'visor'; v.setAttribute('aria-hidden', 'true'); v.innerHTML = '<i></i><i></i><i></i><i></i><span class="visor__id"></span>'; sl.append(v); });

/* ---------- curva de tensión (la misma del sitio) ---------- */
const ZONE_T = { 'Transmisión': 0.35, 'Experiencia': 0.5, 'Distopías': 0.72, 'Espacio': 0.6, 'Niebla': 1, 'Vertical slice': 0.82, 'Estreno': 0.45, 'Archivo': 0.15 };
function seismo(values, w, h, samples) {
  const pts = [];
  for (let k = 0; k <= samples; k++) {
    const u = k / samples, f = u * (values.length - 1), a0 = Math.floor(f), t = f - a0;
    const a = values[a0], b = values[Math.min(a0 + 1, values.length - 1)];
    const s = t * t * (3 - 2 * t), base = a + (b - a) * s;
    const wig = Math.sin(k * 1.9) * 0.5 + Math.sin(k * 4.3 + 1) * 0.35 + Math.sin(k * 9.7) * 0.15;
    const v = base + wig * (0.04 + base * 0.11);
    pts.push([u * w, h - 4 - v * (h - 8)]);
  }
  return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
}

function buildHudCurve() {
  const vals = deck.map(s => ZONE_T[s.dataset.zone] ?? 0.4);
  $('#hud-path').setAttribute('d', seismo(vals.length > 1 ? vals : [0.4, 0.4], 1000, 40, Math.max(60, vals.length * 4)));
}

// La revelación: la curva de la mañana con sus zonas
function buildRevealCurve() {
  const host = $('[data-curve]'); if (!host) return;
  const zones = [['8:00', 'Transmisión', 0.35], ['8:20', 'Experiencia', 0.5], ['9:00', 'Distopías', 0.72], ['9:45', 'Refugio', 0.18], ['10:00', 'Espacio', 0.6], ['10:50', 'Niebla de guerra', 1], ['11:20', 'Vertical slice', 0.82], ['12:05', 'Estreno', 0.45]];
  const W = 1660, H = 470, vals = zones.map(z => z[2]);
  const d = seismo(vals, W, H - 110, 130);
  let marks = '';
  zones.forEach((z, k) => {
    const x = k / (zones.length - 1) * W, y = (H - 110) - 4 - z[2] * (H - 118);
    const peak = z[2] === 1;
    marks += `<circle cx="${x}" cy="${y}" r="${peak ? 14 : 10}" class="${peak ? 'peak' : ''}"/>`;
    const anchor = k === 0 ? 'start' : k === zones.length - 1 ? 'end' : 'middle';
    const row = k % 2 ? 0 : 44;
    marks += `<line x1="${x}" y1="${y + 16}" x2="${x}" y2="${H - 76 + row}" class="tick"/><text x="${x}" y="${H - 50 + row}" text-anchor="${anchor}" class="t-time">${z[0]}</text><text x="${x}" y="${H - 24 + row}" text-anchor="${anchor}">${z[1]}</text>`;
  });
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}"><path d="${d}"/>${marks}</svg>`;
  const p = host.querySelector('path'); p.style.setProperty('--len', p.getTotalLength());
}

/* ---------- plano de la Célula 0 (mismo dibujo que la escena 3D) ---------- */
let planDone = false;
function ensurePlan() {
  if (planDone) return; planDone = true;
  const host = $('[data-plan]'); if (!host) return;
  import('./market.js').then(m => m.planCanvas()).then(c => {
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Plano de nivel de la Célula 0: mercado del Potrerillo 2037');
    host.append(c);
  }).catch(err => { console.error(err); host.textContent = 'El plano necesita el servidor local (node server.js).'; });
}

/* ---------- escala ---------- */
function leer() { return document.body.classList.contains('leer'); }
function fit() {
  const k = leer()
    ? (document.documentElement.clientWidth - (innerWidth > 900 ? 48 : 0)) / 1920
    : Math.min(innerWidth / 1920, (innerHeight) / 1080);
  document.documentElement.style.setProperty('--k', k.toFixed(4));
}

/* ---------- mazo visible ---------- */
function rebuild(keepEl) {
  deck = all.filter(s => showArchive || !s.classList.contains('archivo'));
  all.forEach(s => { s.hidden = !deck.includes(s); });
  i = Math.max(0, deck.indexOf(keepEl));
  buildHudCurve(); buildPanel(); render();
}

function render(fromRemote) {
  deck.forEach((s, k) => s.classList.toggle('is-active', k === i));
  const s = deck[i];
  $('#hud-zone').textContent = s.dataset.zone;
  $('#hud-count').textContent = `${i + 1} / ${deck.length}`;
  const vid = s.querySelector('.visor__id'); if (vid) vid.textContent = `Plano ${String(i + 1).padStart(2, '0')} / ${deck.length} · ${s.dataset.zone}`;
  const path = $('#hud-path'), L = path.getTotalLength();
  const pt = path.getPointAtLength(L * (deck.length > 1 ? i / (deck.length - 1) : 0));
  $('#hud-dot').setAttribute('cx', pt.x); $('#hud-dot').setAttribute('cy', pt.y);
  const tag = s.id ? s.id : String(i + 1);
  if (!leer()) history.replaceState(null, '', `${location.pathname}${location.search}#${tag}`);
  $$('#panel-list button').forEach(b => b.setAttribute('aria-current', Number(b.dataset.i) === i ? 'true' : 'false'));
  const np = $('#notes-panel'); if (!np.hidden) np.textContent = notesOf(s);
  if (s.querySelector('[data-plan]')) ensurePlan();
  if (!fromRemote) channel?.postMessage({ type: 'go', i, archive: showArchive });
  if (document.body.classList.contains('presenter')) renderPresenter();
}

function go(n, fromRemote) {
  const next = Math.max(0, Math.min(deck.length - 1, n));
  if (leer()) { deck[next].scrollIntoView({ behavior: 'smooth', block: 'start' }); i = next; render(fromRemote); return; }
  if (next === i && !fromRemote) return;
  i = next; render(fromRemote);
}
const notesOf = s => s.querySelector('.notes')?.textContent.trim() || 'Sin notas para esta slide.';

/* ---------- índice ---------- */
function buildPanel() {
  const ol = $('#panel-list'); ol.innerHTML = '';
  let zone = '';
  deck.forEach((s, k) => {
    if (s.dataset.zone !== zone) { zone = s.dataset.zone; const z = document.createElement('li'); z.className = 'z'; z.textContent = zone; ol.append(z); }
    const li = document.createElement('li'); if (s.classList.contains('archivo')) li.className = 'is-archive';
    li.innerHTML = `<button type="button" data-i="${k}"><span>${k + 1}</span>${s.dataset.title || 'Slide'}</button>`;
    ol.append(li);
  });
}
function togglePanel(force) {
  const p = $('#panel'), open = force ?? p.hidden;
  p.hidden = !open;
  if (open) ($('#panel-list button[aria-current="true"]') || $('#panel-close')).focus();
}
$('#panel-list').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; togglePanel(false); go(Number(b.dataset.i)); });
$('#panel-close').addEventListener('click', () => togglePanel(false));
$('#menu').addEventListener('click', () => togglePanel());
$('#prev').addEventListener('click', () => go(i - 1));
$('#next').addEventListener('click', () => go(i + 1));

/* ---------- temporizadores de misión ---------- */
const timers = new Map();
function fmt(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
function timerFor(s) {
  if (!s.dataset.timer) return null;
  if (!timers.has(s)) timers.set(s, { left: Number(s.dataset.timer) * 60, running: false, id: 0, el: s.querySelector('.timer') });
  return timers.get(s);
}
function paintTimer(t) {
  t.el.querySelector('.timer__t').textContent = fmt(Math.max(0, t.left));
  t.el.querySelector('.timer__hint').textContent = t.left <= 0 ? 'Tiempo' : t.running ? 'S para pausar' : 'S para iniciar';
  t.el.classList.toggle('is-running', t.running); t.el.classList.toggle('is-done', t.left <= 0);
}
function toggleTimer() {
  const t = timerFor(deck[i]); if (!t) return;
  if (t.running) { clearInterval(t.id); t.running = false; }
  else { if (t.left <= 0) t.left = Number(deck[i].dataset.timer) * 60; t.running = true; t.id = setInterval(() => { t.left -= 1; if (t.left <= 0) { clearInterval(t.id); t.running = false; } paintTimer(t); }, 1000); }
  paintTimer(t);
}
function resetTimer() { const t = timerFor(deck[i]); if (!t) return; clearInterval(t.id); t.running = false; t.left = Number(deck[i].dataset.timer) * 60; paintTimer(t); }

/* ---------- teclado y gestos ---------- */
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const panelOpen = !$('#panel').hidden;
  if (e.key === 'Escape') { togglePanel(false); $('#notes-panel').hidden = true; return; }
  if (panelOpen) return;
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); go(i + 1); break;
    case 'ArrowLeft': case 'PageUp': e.preventDefault(); go(i - 1); break;
    case 'Home': go(0); break;
    case 'End': go(deck.length - 1); break;
    case 'f': case 'F': document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); break;
    case 'n': case 'N': { const np = $('#notes-panel'); np.hidden = !np.hidden; np.textContent = notesOf(deck[i]); break; }
    case 'p': case 'P': window.open(`${location.pathname}?presentador=${SYNC}${showArchive ? '&archivo' : ''}#${i + 1}`, 'galeras-presentador', 'width=1100,height=760'); break;
    case 's': case 'S': toggleTimer(); break;
    case 'r': case 'R': resetTimer(); break;
    case 'a': case 'A': showArchive = !showArchive; rebuild(deck[i]); break;
    case 'l': case 'L': document.body.classList.toggle('leer'); fit(); if (leer()) deck[i].scrollIntoView({ block: 'start' }); else render(); break;
    case 'i': case 'I': togglePanel(true); break;
  }
});
let tx = null;
addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', e => {
  if (tx === null || leer()) return;
  const dx = e.changedTouches[0].clientX - tx; tx = null;
  if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
}, { passive: true });

// en modo lectura, la slide actual es la que está en pantalla
const readObserver = new IntersectionObserver(es => {
  if (!leer()) return;
  es.forEach(en => { if (en.isIntersecting) { const k = deck.indexOf(en.target); if (k >= 0 && k !== i) { i = k; render(true); } } });
}, { threshold: 0.55 });
all.forEach(s => readObserver.observe(s));

/* ---------- sincronía con la ventana de presentador ---------- */
channel?.addEventListener('message', ev => {
  const m = ev.data;
  if (m.type === 'go') { if (m.archive !== showArchive) { showArchive = m.archive; rebuild(deck[i]); } go(m.i, true); }
  if (m.type === 'timer') toggleTimer();
});

/* ---------- control del tiempo (ventana de presentador) ---------- */
// minuto de inicio y duración de cada zona desde que empieza el taller
const AGENDA = { 'Transmisión': [0, 20], 'Experiencia': [20, 40], 'Distopías': [60, 45], 'Refugio': [105, 15], 'Espacio': [120, 50], 'Niebla': [170, 30], 'Vertical slice': [200, 45], 'Estreno': [245, 25] };
const zoneKey = s => (s.dataset.title === 'Refugio' ? 'Refugio' : s.dataset.zone);
let inicio = 0;
try { inicio = Number(localStorage.getItem('galeras-inicio')) || 0; } catch (_) { /* sin almacenamiento */ }
const hhmm = ms => new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
function paintPlan(v) {
  const box = v.querySelector('.pv-plan'); if (!box) return;
  const s = deck[i], key = zoneKey(s), ag = AGENDA[key];
  box.querySelector('[data-a="start"]').textContent = inicio ? 'Reiniciar reloj del taller' : 'Empezar el taller (ahora)';
  if (!inicio || !ag) { box.querySelector('.pv-estado').textContent = inicio ? '' : 'Pulsa cuando empiece la Zona 1.'; box.querySelector('.pv-estado').className = 'pv-estado'; box.querySelector('.pv-saltar').textContent = ''; box.querySelector('.pv-hora').textContent = ''; return; }
  const e = (Date.now() - inicio) / 60000;
  const same = deck.filter(d => zoneKey(d) === key), k = same.indexOf(s);
  const planned = ag[0] + ag[1] * Math.max(0, k) / Math.max(1, same.length);
  const delta = Math.round(e - planned);
  box.querySelector('.pv-hora').textContent = `${key}: de ${hhmm(inicio + ag[0] * 60000)} a ${hhmm(inicio + (ag[0] + ag[1]) * 60000)}`;
  const est = box.querySelector('.pv-estado');
  if (Math.abs(delta) <= 3) { est.textContent = 'A tiempo'; est.className = 'pv-estado is-ok'; }
  else if (delta > 0) { est.textContent = `Vas ${delta} min tarde`; est.className = 'pv-estado is-tarde'; }
  else { est.textContent = `Vas ${-delta} min adelantado: dale más tiempo a la práctica`; est.className = 'pv-estado is-antes'; }
  const opt = deck.slice(i).filter(d => d.hasAttribute('data-opcional')).slice(0, 4).map(d => d.dataset.title);
  box.querySelector('.pv-saltar').textContent = delta > 3 && opt.length ? `Puedes saltar: ${opt.join(' · ')}` : '';
}

let clockStart = Date.now();
function renderPresenter() {
  let v = $('.presenter-view');
  if (!v) {
    v = document.createElement('div'); v.className = 'presenter-view';
    v.innerHTML = `<div><h1 class="pv-title"></h1><div class="pv-notes"></div><p class="pv-next"></p>
      <div class="pv-row"><button class="tarp-plate tarp-plate--paper" data-a="prev">Anterior</button><button class="tarp-plate" data-a="next">Siguiente</button><button class="tarp-plate tarp-plate--blue" data-a="timer">Temporizador</button></div></div>
      <div><p class="led">Tiempo de sesión</p><div class="pv-clock">00:00</div><p class="pv-zone led"></p>
        <div class="pv-plan"><p class="led">Plan del taller</p><p class="pv-hora"></p><p class="pv-estado"></p><p class="pv-saltar"></p><button class="tarp-plate tarp-plate--paper" data-a="start">Empezar el taller (ahora)</button></div></div>`;
    document.body.append(v);
    v.addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'prev') go(i - 1); if (a === 'next') go(i + 1);
      if (a === 'timer') channel?.postMessage({ type: 'timer' });
      if (a === 'start') { inicio = Date.now(); try { localStorage.setItem('galeras-inicio', String(inicio)); } catch (_) { /* sin almacenamiento */ } paintPlan(v); }
    });
    setInterval(() => { v.querySelector('.pv-clock').textContent = fmt((Date.now() - (inicio || clockStart)) / 1000); paintPlan(v); }, 1000);
  }
  const s = deck[i], n = deck[i + 1];
  v.querySelector('.pv-title').textContent = `${i + 1}/${deck.length} · ${s.dataset.title}${s.hasAttribute('data-opcional') ? ' · opcional' : ''}`;
  v.querySelector('.pv-notes').textContent = notesOf(s);
  v.querySelector('.pv-next').textContent = n ? `Siguiente: ${n.dataset.title}` : 'Fin';
  v.querySelector('.pv-zone').textContent = s.dataset.zone;
  paintPlan(v);
}

/* ---------- arranque ---------- */
if (params.has('presentador')) document.body.classList.add('presenter');
if (params.has('leer') || (innerWidth < 900 && innerHeight > innerWidth)) document.body.classList.add('leer');
buildRevealCurve();
deck = all.filter(s => showArchive || !s.classList.contains('archivo'));
const h = decodeURIComponent(location.hash.slice(1));
let start = deck[0];
if (h) {
  const byId = all.find(s => s.id === h);
  if (byId) { if (byId.classList.contains('archivo')) showArchive = true; start = byId; }
  else if (/^\d+$/.test(h)) start = deck[Math.min(deck.length, Number(h)) - 1] || deck[0];
} else if (params.has('archivo')) start = $('#archivo');
fit();
rebuild(start);
if (leer() && start !== deck[0]) setTimeout(() => start.scrollIntoView({ block: 'start' }), 60);
addEventListener('resize', fit);
addEventListener('hashchange', () => {
  const h = decodeURIComponent(location.hash.slice(1));
  const byId = deck.findIndex(s => s.id === h);
  const k = byId >= 0 ? byId : (/^\d+$/.test(h) ? Number(h) - 1 : -1);
  if (k >= 0 && k !== i) go(k);
});
