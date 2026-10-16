import { loadImages } from './img.js';
import { CHAPTERS, MAP, PRINCIPLES, INTERACTABLES, ZONES, DATOS, LECCIONES } from './level.js';
import { sonido } from './sonido.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const params = new URLSearchParams(location.search);
const root = document.documentElement;
if (coarse) root.classList.add('touch');

loadImages(document, 'assets/img/');

/* ---------- Curva de tensión del taller (sismógrafo) ---------- */
const tensions = $$('.zona').map(z => Number(z.dataset.tension));
function seismo(values, w, h, samples, axis = 'x') {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples, f = u * (values.length - 1), k = Math.floor(f), t = f - k;
    const a = values[k], b = values[Math.min(k + 1, values.length - 1)];
    const s = t * t * (3 - 2 * t), base = a + (b - a) * s;
    const wig = Math.sin(i * 1.9) * 0.5 + Math.sin(i * 4.3 + 1) * 0.35 + Math.sin(i * 9.7) * 0.15;
    const v = base + wig * (0.04 + base * 0.11);
    if (axis === 'x') pts.push([u * w, h - 8 - v * (h - 22)]);
    else pts.push([w / 2 + (v - 0.5) * w * 0.9, u * h]);
  }
  return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
}
const sp = $('#sismo-path');
if (sp && tensions.length) {
  sp.setAttribute('d', seismo(tensions, 1000, 160, 240));
  const len = sp.getTotalLength();
  sp.style.setProperty('--len', len); sp.style.setProperty('--off', reduced ? 0 : len);
  new IntersectionObserver((es, ob) => es.forEach(e => { if (e.isIntersecting) { sp.style.setProperty('--off', 0); ob.disconnect(); } }), { threshold: 0.3 }).observe(sp);
}
const railPath = $('#rail-path'), railDot = $('#rail-dot');
if (railPath && tensions.length) railPath.setAttribute('d', seismo([0.2, ...tensions, 0.1], 24, 1000, 260, 'y'));

/* ---------- El nivel: recorrido por capítulos ---------- */
const stage = $('.mercado'), stageInner = $('.mercado__stage'), canvas = $('#market');
const cap = $('#capitulo'), capKicker = $('#cap-kicker'), capTitle = $('#cap-title'), capText = $('#cap-text'), capActions = $('#cap-actions');
const cue = $('.scroll-cue'), lb = $('.letterbox'), tc = $('#timecode');
const railList = $('#rail-list'), railMini = $('#rail-mini'), anno = $('#anno');
stage.style.setProperty('--chapters', CHAPTERS.length);
let market = null, current = -1, heroVisible = true;

CHAPTERS.forEach((ch, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" data-i="${i}"><span>${String(i).padStart(2, '0')}</span>${ch.kicker.includes('·') && i ? ch.kicker.split('·')[1].trim() : 'Llegada'}</button>`;
  railList.append(li);
});
railList.addEventListener('click', e => { const b = e.target.closest('button'); if (b) goChapter(Number(b.dataset.i)); });

function stageRange() { const top = stage.getBoundingClientRect().top + scrollY; return { top, len: Math.max(1, stage.offsetHeight - innerHeight) }; }
function goChapter(i) {
  const { top, len } = stageRange();
  const next = CHAPTERS[i + 1] ? CHAPTERS[i + 1].p : 1;
  const p = CHAPTERS[i].p + (next - CHAPTERS[i].p) * 0.12;
  scrollTo({ top: top + p * len, behavior: reduced ? 'auto' : 'smooth' });
}
function heroProgress() { const r = stage.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); }
function chapterOf(p) { let i = 0; while (i < CHAPTERS.length - 1 && p >= CHAPTERS[i + 1].p) i++; return i; }

function setChapter(i) {
  if (i === current) return;
  const first = current === -1;
  current = i;
  const ch = CHAPTERS[i];
  const paint = () => {
    capKicker.textContent = ch.kicker; capTitle.textContent = ch.title; capText.textContent = ch.text;
    $('#cap-cine').innerHTML = `<span>En cine</span>${ch.cine || ''}`;
    $('#cap-pasto').innerHTML = `<span>En Pasto</span>${ch.pasto || ''}`;
    cap.classList.toggle('is-paper', ch.id === 'plano' || ch.id === 'playtest');
    capActions.hidden = !(ch.id === 'llegada' || ch.id === 'toma');
    if (ch.id === 'toma' && !capActions.querySelector('[href="#taller"]')) {
      const a = document.createElement('a'); a.className = 'tarp-plate tarp-plate--paper'; a.href = '#taller'; a.textContent = 'Recorrer el taller'; capActions.append(a);
    }
    cap.classList.remove('is-swapping');
  };
  if (first || reduced) paint(); else { cap.classList.add('is-swapping'); setTimeout(paint, 260); }
  $$('#rail-list button').forEach(b => b.setAttribute('aria-current', Number(b.dataset.i) === i ? 'step' : 'false'));
  railMini.innerHTML = `${String(i).padStart(2, '0')} / ${String(CHAPTERS.length - 1).padStart(2, '0')} · ${i ? ch.kicker.split('·')[1].trim() : 'Llegada'}<i><b></b></i>`;
}

let frames = 0;
function updateHero(p) {
  setChapter(chapterOf(p));
  cue.classList.toggle('is-off', p > 0.02);
  const bar = railMini.querySelector('b'); if (bar) bar.style.setProperty('--rp', (p * 100).toFixed(1) + '%');
  // franjas de cine 2.39:1 en la toma final
  const pT = CHAPTERS.find(c => c.id === 'toma').p;
  const k = clamp((p - pT) / 0.045, 0, 1);
  if (!root.classList.contains('lente')) {
    const h = Math.max(0, (innerHeight - innerWidth / 2.39) / 2);
    lb.style.setProperty('--lb', (h * k).toFixed(1) + 'px');
    lb.style.setProperty('--lbt', k > 0.9 ? 1 : 0);
  }
  if (k > 0.9 || root.classList.contains('lente')) {
    frames++;
    tc.textContent = `00:00:${String(Math.floor(frames / 24) % 60).padStart(2, '0')}:${String(frames % 24).padStart(2, '0')}`;
  }
}

/* ---------- anotaciones ancladas al mundo ---------- */
const pool = [];
function annoItem(k) {
  if (!pool[k]) {
    const el = document.createElement('div'); el.className = 'anno__item';
    el.innerHTML = '<span class="anno__dot"></span><span class="anno__line"></span><span class="anno__card"><span class="anno__tag"></span><span class="anno__title"></span><span class="anno__text"></span></span>';
    anno.append(el); pool[k] = { el, key: '' };
  }
  return pool[k];
}
function drawLabels() {
  if (!market) return;
  const list = market.labels(), W = stageInner.clientWidth, H = stageInner.clientHeight;
  list.forEach((lb, k) => {
    const it = annoItem(k), key = lb.tag + lb.title;
    if (it.key !== key) { it.key = key; it.el.querySelector('.anno__tag').textContent = lb.tag; it.el.querySelector('.anno__title').textContent = lb.title; it.el.querySelector('.anno__text').textContent = lb.text || ''; }
    const x = clamp(lb.x, 0.04, 0.96) * W, y = clamp(lb.y, W < 760 ? 0.24 : 0.2, 0.92) * H;
    it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    it.el.classList.toggle('is-left', lb.x > 0.6);
    it.el.classList.toggle('is-on', !!lb.on);
  });
  for (let k = list.length; k < pool.length; k++) pool[k].el.classList.remove('is-on');
}

/* ---------- arranque de la escena ---------- */
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch (_) { return false; }
}
async function initMarket() {
  if (!webglOK()) { root.classList.add('no-webgl'); return; }
  try {
    const { createMarket } = await import('./market.js');
    market = await createMarket(canvas, { lowPower: coarse || innerWidth < 760, reducedMotion: reduced, onEvent: e => game.onEvent(e) });
    window.galeras = market;
    requestAnimationFrame(() => requestAnimationFrame(() => stageInner.classList.add('is-live')));
    setTimeout(() => stageInner.classList.add('is-live'), 1500);
  } catch (err) {
    console.error(err); root.classList.add('no-webgl'); return;
  }
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting || root.classList.contains('jugando'); heroVisible ? market.start() : market.stop(); }, { threshold: 0 }).observe(stage);
  addEventListener('resize', () => market.resize());
  if (!coarse) addEventListener('pointermove', e => { if (!root.classList.contains('jugando')) market.setPointer(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); }, { passive: true });
  if (params.has('transmision')) { root.classList.add('transmision'); market.setAuto(true); }
  market.setProgress(heroProgress());
  const deep = location.hash.match(/^#nivel-(d+)$/);
  if (deep) setTimeout(() => goChapter(clamp(Number(deep[1]), 0, CHAPTERS.length - 1)), 50);
  const loop = () => {
    requestAnimationFrame(loop);
    if (!heroVisible) return;
    if (params.has('transmision') && market.phase.chapter >= 0) {
      setChapter(market.phase.chapter);
    }
    drawLabels();
    game.tick();
  };
  loop();
}

function onScroll() {
  if (params.has('transmision') || root.classList.contains('jugando')) return;
  const p = heroProgress();
  if (market) market.setProgress(p);
  updateHero(p);
  const total = root.scrollHeight - innerHeight, q = clamp(scrollY / Math.max(1, total), 0, 1);
  if (railPath && railDot) { const L = railPath.getTotalLength(), pt = railPath.getPointAtLength(L * q); railDot.setAttribute('cx', pt.x); railDot.setAttribute('cy', pt.y); }
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();
initMarket();
// línea de tiempo cine–juegos: flechas
$$('[data-cruce]').forEach(b => b.addEventListener('click', () => { const t = $('.cruce__track'); t.scrollBy({ left: Number(b.dataset.cruce) * t.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' }); }));
// enlaces directos a una sección (#aprender, #slides…): saltar cuando el recorrido ya tiene su altura final
function irAlAncla() { const id = decodeURIComponent(location.hash.slice(1)); const el = id && !/^nivel-/.test(id) && document.getElementById(id); if (el && !stage.contains(el)) el.scrollIntoView(); }
addEventListener('load', () => requestAnimationFrame(irAlAncla));

/* ---------- Modo jugable ---------- */
// Tres capas que se ven al jugar: LEVEL (el espacio), GAME (reglas y decisiones), CINE (los planos que ruedas).
const juego = $('#juego'), decision = $('#j-decision'), end = $('#j-end'), helpPanel = $('#j-helppanel'), mapFig = $('#j-map');
const keys = new Set();
const QUIEN_CORTO = { cuyexpress: 'Cuy Express' };
const discOf = tag => (/^Game/.test(tag) ? 'game' : /^Pasto/.test(tag) ? 'pasto' : 'level');
const ALL_PRIN = [...PRINCIPLES, ...INTERACTABLES];
const ITEM_POS = Object.fromEntries(INTERACTABLES.map(i => [i.id, { x: i.x, z: i.z, label: QUIEN_CORTO[i.id] || i.title }]));
const TOTAL = { level: ALL_PRIN.filter(p => discOf(p.tag) === 'level').length, game: ALL_PRIN.filter(p => discOf(p.tag) === 'game').length, cine: 3, pasto: DATOS.length };
const SHOTS = {
  general: { name: 'Plano general', txt: 'Dónde estamos.' },
  detalle: { name: 'Plano detalle', txt: 'La pista, de cerca.' },
  contrapicado: { name: 'Contrapicado', txt: 'Desde abajo: el poder.' },
  medio: { name: 'Plano medio', txt: 'Quién y qué hace.' },
};
const KEYS_DESK = [['W A S D', 'Caminar'], ['Arrastrar', 'Mirar'], ['Shift', 'Correr'], ['E', 'Examinar'], ['F', 'Tomar plano'], ['C', 'Lente'], ['M', 'Plano A3'], ['L', 'Capa de diseñador']];
const KEYS_TOUCH = [['Joystick', 'Caminar'], ['Arrastrar', 'Mirar'], ['Botón amarillo', 'Examinar'], ['Botón rojo', 'Tomar plano']];
const keysHTML = (coarse ? KEYS_TOUCH : KEYS_DESK).map(([k, v]) => `<div><dt><kbd>${k}</kbd></dt><dd>${v}</dd></div>`).join('');
$('#j-keys2').innerHTML = keysHTML;

/* ---------- El guía: cuadro de diálogo central, una página a la vez (como en los juegos clásicos) ---------- */
// Mientras el cuadro está abierto el juego se pausa. E, Espacio, Enter o un toque pasan a la siguiente página.
const DISC = { level: 'Level design', game: 'Game design', cine: 'Cine', pasto: 'Pasto real' };
const ICONOS = {
  pista: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
  dato: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M7 10h10M7 14h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  persona: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  objeto: '<svg viewBox="0 0 24 24"><path d="M12 3l8 9-8 9-8-9z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
};
const HABLA = { cuyexpress: '¡Mira cómo despego! Reparto paquetes por todo Nariño, de día y de noche.' };
const QUIEN = { cuyexpress: 'Cuy Express', vendedora: 'Doña Rosario', asadero: 'El asadero' };
$('#j-pips').innerHTML = LECCIONES.map(l => `<i data-disc="${l.disc}"></i>`).join('');
$('#jg-ruta').innerHTML = LECCIONES.map((l, k) => `<li data-disc="${l.disc}"><b>${k + 1}</b><span>${l.concepto}</span></li>`).join('');
const guia = {
  el: $('#j-guia'), cola: [], abierta: false, pag: null, raf: 0, tipeando: false,
  decir(pags) { this.cola.push(...pags); if (!this.abierta) this.abrir(); },
  abrir() {
    this.abierta = true; game.pause(true); market.play.holdFocus(true); juego.classList.add('is-guia'); $('#j-act').hidden = true;
    this.el.hidden = false; this.el.focus({ preventScroll: true }); this.siguiente();
  },
  siguiente() {
    if (this.tipeando) { this.completar(); return; }
    const p = this.cola.shift();
    if (p) this.mostrar(p); else this.cerrar();
  },
  mostrar(p) {
    this.pag = p; const el = this.el, r = p.retrato || 'cuy';
    el.dataset.tipo = p.tipo || 'habla'; el.dataset.disc = p.disc || 'guia';
    $('#jg-nombre').textContent = p.quien || 'Cuy Express';
    $('#jg-retrato').dataset.r = r; $('#jg-icono').innerHTML = ICONOS[r] || '';
    $('#jg-k').textContent = p.k || ''; $('#jg-t').textContent = p.t || '';
    $('#jg-logro').hidden = !p.logro;
    if (p.logro) { $('#jg-logro-c').textContent = p.logro.concepto; $('#jg-logro-t').textContent = p.logro.texto; }
    $('#jg-dl').innerHTML = (p.dl || []).filter(d => d[1]).map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    $('#jg-teclas').textContent = p.teclas || '';
    $('#jg-ruta').hidden = !p.ruta; $('#jg-saltar').hidden = !p.intro;
    $('#jg-sig-t').textContent = this.cola.length ? 'Seguir' : (p.cierre || 'Seguir jugando');
    el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in');
    // texto letra por letra; lo que falta ya ocupa su lugar (invisible), así el cuadro no salta
    const txt = p.texto || '', tx = $('#jg-texto');
    tx.innerHTML = '<span></span><span class="jguia__resto" aria-hidden="true"></span>';
    const [vis, resto] = tx.children;
    if (reduced || !txt) { vis.textContent = txt; this.tipeando = false; el.classList.add('is-listo'); return; }
    el.classList.remove('is-listo'); this.tipeando = true; resto.textContent = txt;
    const t0 = performance.now();
    const paso = now => {
      const n = Math.min(txt.length, Math.floor((now - t0) / 1000 * 62));
      vis.textContent = txt.slice(0, n); resto.textContent = txt.slice(n);
      if (n < txt.length) this.raf = requestAnimationFrame(paso); else { this.tipeando = false; el.classList.add('is-listo'); }
    };
    this.raf = requestAnimationFrame(paso);
  },
  completar() {
    cancelAnimationFrame(this.raf); this.tipeando = false;
    const [vis, resto] = $('#jg-texto').children; vis.textContent = this.pag.texto || ''; resto.textContent = '';
    this.el.classList.add('is-listo');
  },
  cerrar() {
    cancelAnimationFrame(this.raf); this.tipeando = false; this.cola = [];
    if (!this.abierta) return;
    this.abierta = false; this.el.hidden = true; juego.classList.remove('is-guia'); market.play.holdFocus(false);
    if (game.on && helpPanel.hidden && end.hidden) { game.pause(false); game.alSeguir(); }
  },
  saltar() { this.cola = this.cola.filter(p => !p.intro); this.tipeando = false; this.siguiente(); },
};
guia.el.addEventListener('click', e => { if (e.target.closest('#jg-saltar')) guia.saltar(); else guia.siguiente(); });

// el plano A3 del nivel, el mismo del taller, como minimapa
let mapReady = false;
async function drawMap() {
  if (mapReady) return; mapReady = true;
  try {
    const [{ mapCanvas }, { buildLayout }] = await Promise.all([import('./world/plan.js'), import('./world/layout.js')]);
    const src = mapCanvas(buildLayout()), c = $('#j-map-c');
    c.height = Math.round(c.width * src.height / src.width);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  } catch (err) { console.error(err); mapReady = false; }
}
const mapPct = (x, z) => [clamp((x - MAP.x0) / (MAP.x1 - MAP.x0) * 100, 1, 99), clamp((z - MAP.z0) / (MAP.z1 - MAP.z0) * 100, 2, 98)];

const TOAST_TAG = { principio: 'Principio', pista: 'Pista', alerta: 'Alerta', logro: 'Logro', bloqueo: 'Límite', info: 'Aviso', cine: 'Cine', pasto: 'Pasto real' };
const game = {
  on: false, paused: false, savedY: 0, lensIdx: 0, look: null, shots: [], learned: [], kinds: new Set(), secret: false, gateWas: false, walk: 0, last: null, cur: 0, examined: new Set(), fin: false, slugPend: null,
  enter() {
    if (!market) return;
    this.savedY = scrollY;
    root.classList.add('jugando'); juego.hidden = false; heroVisible = true;
    guia.cerrar(); [decision, end, helpPanel].forEach(el => { el.hidden = true; });
    $('#j-act').hidden = true; $('#j-toasts').innerHTML = ''; $('#j-tira').innerHTML = ''; $('#j-marks').innerHTML = ''; $('#j-registro').hidden = true;
    delete juego.dataset.choice; mapFig.classList.remove('is-big'); $('#j-mapbtn').setAttribute('aria-pressed', 'false');
    $('#j-visor').hidden = true; $('#j-enfoque').hidden = true; juego.classList.remove('is-visor', 'fx-talco', 'fx-escaneo'); root.classList.remove('enfoque');
    this.zone = null; this.shots = []; this.learned = []; this.kinds = new Set(); this.secret = false; this.gateWas = false; this.last = null; this.cur = 0; this.examined = new Set(); this.fin = false; this.slugPend = null;
    market.play.enter(); market.start(); market.resize(); drawMap();
    this.on = true; this.hud(); sonido.start();
    // el guía se presenta, muestra la ruta de 9 lecciones y da la primera
    guia.decir([
      { intro: true, t: 'Pasto, 2037', texto: '¡Quiubo! Soy el Cuy Express, el mensajero del mercado. Hoy te acompaño por este nivel.' },
      { intro: true, t: 'Contrabando de Rostros', texto: 'En este Carnaval, pintarse es contrabando: el talco esconde tu rostro de las cámaras del Ojo de Atriz.' },
      { intro: true, tipo: 'ruta', t: 'Tu ruta: 9 lecciones', ruta: true, texto: 'En un solo nivel vas a practicar tres oficios: diseñar el espacio, diseñar las reglas y filmar. Una lección a la vez.', teclas: 'Azul: level design · Naranja: game design · Rojo: cine' },
      { intro: true, t: 'Cómo se juega', texto: coarse ? 'Camina con el joystick y mira arrastrando el dedo. Para seguir leyendo, toca este cuadro.' : 'Camina con W A S D y mira arrastrando el mouse. Para seguir leyendo, pulsa E o Espacio.' },
      this.paginaLeccion(0, null),
    ]);
  },
  // empezar a jugar ya (pruebas): sin diálogo
  start() { guia.cerrar(); this.pause(false); },
  // al cerrar el diálogo: el encabezado de escena que quedó pendiente
  alSeguir() { if (this.slugPend) { this.slug(this.slugPend); this.slugPend = null; } },
  // las 9 lecciones: cuál está cumplida
  hecha(L, s = market.play.state) {
    switch (L.id) {
      case 'examinar': return this.examined.has('cuyexpress');
      case 'pista1': return s.found >= 1;
      case 'pista2': return s.found >= 2;
      case 'pista3': return s.found >= 3;
      case 'decision': return !!s.choice;
      case 'salida': return this.fin;
      default: return this.kinds.has(L.id);
    }
  },
  paginaLeccion(i, antes) {
    const L = LECCIONES[i];
    return { tipo: 'leccion', disc: L.disc, k: `Lección ${i + 1} de ${LECCIONES.length} · ${DISC[L.disc]}`, t: L.objetivo, texto: L.explica, cierre: '¡A jugar!',
      logro: antes ? { concepto: antes.concepto, texto: antes.aprendiste } : null, teclas: L.teclas ? L.teclas[coarse ? 'tactil' : 'pc'] : '' };
  },
  // avanza la ruta; si se cumplió la lección actual, el guía felicita y da la siguiente
  revisar(s) {
    const hechas = [];
    while (this.cur < LECCIONES.length && this.hecha(LECCIONES[this.cur], s)) hechas.push(LECCIONES[this.cur++]);
    if (hechas.length && this.cur < LECCIONES.length) { sonido.play('logro'); guia.decir([this.paginaLeccion(this.cur, hechas[0])]); }
  },
  repetir() { if (this.on && !this.paused && this.cur < LECCIONES.length) guia.decir([{ ...this.paginaLeccion(this.cur, null), cierre: 'Seguir jugando' }]); },
  slug(id) {
    const z = ZONES[id]; if (!z) return;
    const el = $('#j-slug'); $('#j-slug-t').textContent = z.slug; $('#j-slug-r').textContent = z.role;
    el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on'); sonido.play('zona');
    clearTimeout(this.slugT); this.slugT = setTimeout(() => el.classList.remove('is-on'), 3400);
  },
  pause(on) { this.paused = on; if (on) market.play.input({ mx: 0, mz: 0, run: false }); },
  exit() {
    if (!this.on) return;
    this.on = false; guia.cerrar(); this.pause(true); market.play.exit(); sonido.stop();
    root.classList.remove('jugando', 'lente', 'enfoque'); juego.hidden = true; this.lensIdx = 0; $('#j-visor').hidden = true; juego.classList.remove('is-visor');
    $('#j-lens-t').textContent = 'Lente'; $('#j-lens').setAttribute('aria-pressed', 'false'); $('#j-design').setAttribute('aria-pressed', 'false');
    market.resize(); scrollTo({ top: this.savedY }); onScroll();
  },
  count() {
    const n = { level: 0, game: 0 };
    this.learned.forEach(l => { n[l.disc] = (n[l.disc] || 0) + 1; });
    return { level: n.level, game: n.game, cine: this.kinds.size, pasto: market.play.state.datos };
  },
  hud() {
    const s = market.play.state;
    this.revisar(s);
    const i = Math.min(this.cur, LECCIONES.length - 1), L = LECCIONES[i];
    $('#j-ruta-n').textContent = `${i + 1}/${LECCIONES.length}`; $('#j-ruta-t').textContent = L.objetivo;
    $('#j-ruta').dataset.disc = L.disc;
    $('#j-ruta-k').textContent = L.teclas ? L.teclas[coarse ? 'tactil' : 'pc'] : '';
    [...$('#j-pips').children].forEach((p, k) => { p.classList.toggle('is-done', this.hecha(LECCIONES[k], s)); p.classList.toggle('is-now', k === this.cur); });
    $('#j-shot-n').textContent = `${this.shots.length}/6`;
    // la puerta se abre: suena una sola vez (la lección 9 lo explica)
    if (s.found >= 3 && s.choice && !this.gateWas) { this.gateWas = true; sonido.play('puerta'); }
  },
  toast(type, title, body, ms = 3600) {
    const box = $('#j-toasts');
    const el = document.createElement('div'); el.className = `jtoast jtoast--${type}`;
    el.innerHTML = `<span class="jtoast__tag">${TOAST_TAG[type]}</span><b>${title}</b>${body ? `<p>${body}</p>` : ''}`;
    box.prepend(el); while (box.children.length > 2) box.lastChild.remove();
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 400); }, ms);
  },
  // examinar: primero habla lo examinado (personaje, pista, placa) y luego el guía da la lección
  paginas(c, kind) {
    const dato = kind === 'dato', disc = dato ? 'pasto' : discOf(c.tag);
    if (!dato && !this.learned.some(l => l.title === c.title)) this.learned.push({ tag: c.tag, title: c.title, disc });
    const persona = c.id in QUIEN, limpio = (t, p) => (t || '').replace(p, '');
    const habla = { tipo: 'habla', disc, quien: QUIEN[c.id] || (dato ? 'Placa · Pasto real' : c.pista ? `Pista ${market.play.state.found} de 3` : 'Lo que encontraste'),
      retrato: c.id === 'cuyexpress' ? 'cuy' : dato ? 'dato' : c.pista ? 'pista' : persona ? 'persona' : 'objeto',
      t: persona ? '' : c.title, texto: HABLA[c.id] || c.text };
    const aprende = dato
      ? { tipo: 'aprende', disc, k: c.tag, t: c.why, dl: [['Tu A3', c.taller]] }
      : { tipo: 'aprende', disc, k: c.tag, t: c.principle || c.text, dl: [['En cine', limpio(c.cine, /^En cine:\s*/)], ['Tu A3', limpio(c.taller, /^En tu A3:\s*/)]] };
    return [habla, aprende];
  },
  onEvent(e) {
    if (!this.on) return;
    if (e.type === 'zona') { this.zone = e.id; if (!this.paused) this.slug(e.id); else this.slugPend = e.id; return; }
    // plano detalle automático al examinar: franjas de cine y rótulo
    if (e.type === 'enfoque') { root.classList.toggle('enfoque', e.on); $('#j-enfoque').hidden = !e.on; if (e.on) sonido.play('lente'); return; }
    // los principios del camino no interrumpen: un aviso corto arriba
    if (e.type === 'principio') { const p = e.principio; if (!this.learned.some(l => l.title === p.title)) this.learned.push({ tag: p.tag, title: p.title, disc: discOf(p.tag) }); this.toast('principio', p.tag.replace(/^.*·\s*/, ''), p.text, 4200); sonido.play('examinar'); }
    if (e.type === 'cerca') { $('#j-act').hidden = !e.item; if (e.item) $('#j-act-label').textContent = e.item.label; }
    if (e.type === 'interaccion') {
      const it = e.item; this.examined.add(it.id);
      const pags = this.paginas(it, it.dato ? 'dato' : it.pista ? 'pista' : 'objeto');
      if (it.dato && market.play.state.datos === DATOS.length) pags.push({ tipo: 'habla', disc: 'pasto', t: 'Pasto real: 6 de 6', texto: 'Leíste todas las placas. Tu mundo quedó anclado a la ciudad real.' });
      if (it.id === 'secreto') { this.secret = true; pags.push({ tipo: 'habla', t: 'Secreto encontrado', texto: 'Nadie te obligó a buscarlo. Eso es premiar la curiosidad.' }); }
      sonido.play(it.pista ? 'pista' : it.dato ? 'dato' : 'examinar');
      guia.decir(pags);
    }
    if (e.type === 'escaner') { sonido.play('alerta'); this.toast('alerta', 'El arco te registró', 'Por San Juan no hay cámaras.', 4600); }
    if (e.type === 'ojo') { sonido.play('alerta'); this.toast('alerta', 'El Ojo te vio', 'Su luz gira igual: cruza por la sombra.', 4600); }
    if (e.type === 'limite') { sonido.play('limite'); this.toast('bloqueo', 'Por aquí no se pasa', 'Sigue las calles iluminadas.'); }
    if (e.type === 'decision-cerca') { decision.hidden = false; sonido.play('decision'); }
    if (e.type === 'decision-lejos') decision.hidden = true;
    if (e.type === 'decidido') {
      decision.hidden = true; juego.dataset.choice = e.choice;
      const fx = e.choice === 'pintarse' ? 'fx-talco' : 'fx-escaneo'; juego.classList.add(fx); setTimeout(() => juego.classList.remove(fx), 1500);
      if (e.choice === 'pintarse') this.toast('logro', 'Te pintaste con talco', 'Las cámaras ya no te ven.');
      else { $('#j-registro').hidden = false; this.toast('info', 'Máscara legal', 'Pasas, pero quedas registrado.'); }
    }
    if (e.type === 'salida-cerrada') { sonido.play('limite'); this.toast('bloqueo', 'Puerta cerrada', e.found < 3 ? `Faltan ${3 - e.found} pista${3 - e.found > 1 ? 's' : ''}.` : 'Primero decide en la carroza.'); }
    if (e.type === 'fin') { this.fin = true; this.finish(e); }
    this.hud();
  },
  finish(e) {
    this.pause(true); sonido.play('logro');
    const n = this.count(), mm = Math.floor(e.seconds / 60), ss = String(e.seconds % 60).padStart(2, '0');
    $('#j-end-title').textContent = e.choice === 'pintarse' ? 'Saliste al páramo sin rostro' : 'Saliste al páramo registrado';
    const T = [['level', 'Level design', 'El espacio te guió'], ['game', 'Game design', 'Reglas y decisiones'], ['cine', 'Cine', 'Planos que rodaste'], ['pasto', 'Pasto real', 'Datos de la ciudad']];
    $('#j-end-triada').innerHTML = T.map(([k, a, b]) => `<li data-k="${k}"><b>${n[k]}<small>/${TOTAL[k]}</small></b><span>${a}</span><em>${b}</em></li>`).join('');
    const M = [['Tiempo', `${mm}:${ss}`], ['Pistas', `${e.found}/3`], ['Alertas', e.alerts], ['Decisión', e.choice === 'pintarse' ? 'Talco' : 'Máscara'], ['Secreto', this.secret ? 'Sí' : 'No']];
    $('#j-metrics').innerHTML = M.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const read = [e.alerts ? `Te registraron ${e.alerts} ${e.alerts > 1 ? 'veces' : 'vez'}: ¿se leían los avisos?` : 'Nadie te registró: leíste los avisos.', e.choice === 'pintarse' ? 'Elegiste desaparecer.' : 'Elegiste la vigilancia.'];
    const faltan = ['general', 'detalle', 'contrapicado'].filter(k => !this.kinds.has(k));
    if (faltan.length) read.push(`Te faltó rodar: ${faltan.map(k => SHOTS[k].name.toLowerCase()).join(', ')}.`);
    $('#j-read').textContent = read.join(' ');
    const story = $('#j-story'); story.innerHTML = '';
    this.shots.forEach((sh, k) => { const f = document.createElement('figure'); f.innerHTML = `<img alt="Plano ${k + 1}: ${SHOTS[sh.kind].name}" src="${sh.src}"><figcaption>${k + 1} · ${SHOTS[sh.kind].name}</figcaption>`; story.append(f); });
    $('#j-story-wrap').hidden = !this.shots.length; $('#j-download').hidden = !this.shots.length;
    $('#j-end-ruta').innerHTML = LECCIONES.map((l, k) => `<li data-disc="${l.disc}" class="${this.hecha(l) ? 'is-done' : ''}"><b>${k + 1}</b><span>${l.concepto}</span><em>${DISC[l.disc]}</em></li>`).join('');
    guia.cerrar(); end.hidden = false;
  },
  tick() {
    if (!this.on) return;
    if (!this.paused) {
      const f = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
      const st = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      if (!this.stickOn) market.play.input({ mz: f, mx: st, run: keys.has('shift') });
    }
    const L = LECCIONES[this.cur], meta = L && L.meta && ITEM_POS[L.meta], o = market.play.objective(meta), p = market.play.pose();
    $('#j-flecha').style.setProperty('--a', (o.angle * 180 / Math.PI).toFixed(1) + 'deg');
    $('#j-obj').textContent = o.label; $('#j-dist').textContent = Math.round(o.dist) + ' m';
    // pasos: un sonido cada 1,4 m recorridos
    if (this.last) { this.walk += Math.hypot(p.x - this.last.x, p.z - this.last.z); if (this.walk > 1.4) { this.walk = 0; sonido.play('paso'); } }
    this.last = p;
    // plano A3: dónde estoy y a dónde voy
    const [yx, yz] = mapPct(p.x, p.z), [ox, oz] = mapPct(o.tx, o.tz), yo = $('#j-map-yo'), ob = $('#j-map-obj');
    yo.style.left = yx + '%'; yo.style.top = yz + '%'; yo.style.setProperty('--r', (p.yaw * 180 / Math.PI).toFixed(1) + 'deg');
    ob.style.left = ox + '%'; ob.style.top = oz + '%';
    this.marks();
    // visor de cine: qué tipo de plano estás encuadrando, en vivo
    if (!$('#j-visor').hidden) {
      const kind = this.classify(market.play.shotInfo()), sec = (performance.now() - this.visorT0) / 1000;
      $('#jv-tipo').dataset.tipo = kind; $('#jv-tipo-t').textContent = SHOTS[kind].name;
      $('#jv-tipo-h').textContent = kind === 'medio' ? 'F para rodar' : this.kinds.has(kind) ? 'Ya lo rodaste' : 'F para rodar · cuenta para la misión';
      $('#jv-tc').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}:${String(Math.floor((sec % 1) * 24)).padStart(2, '0')}`;
    }
  },
  marks() {
    const box = $('#j-marks'), list = this.paused ? [] : market.play.markers().sort((a, b) => a.d - b.d), rc = canvas.getBoundingClientRect(), placed = [];
    while (box.children.length < list.length) { const el = document.createElement('div'); el.className = 'jmark'; el.innerHTML = '<i></i><b></b><span></span>'; box.append(el); }
    [...box.children].forEach((el, k) => {
      const m = list[k]; el.hidden = !m; if (!m) return;
      el.dataset.kind = m.kind; el.classList.toggle('is-near', m.near);
      const half = (el.children[1].offsetWidth || 140) / 2 + 8, px = clamp(m.x * rc.width, half, rc.width - half);
      el.style.transform = `translate(${(rc.left + px).toFixed(1)}px, ${(rc.top + m.y * rc.height).toFixed(1)}px)`;
      el.style.opacity = m.near ? 1 : clamp(1.3 - m.d / 34, 0.45, 1).toFixed(2);
      el.children[1].textContent = m.label;
      // si choca con una etiqueta más cercana, solo queda el rombo y la distancia
      const w = el.children[1].offsetWidth || 120, x0 = rc.left + px - w / 2, y0 = rc.top + m.y * rc.height - 46;
      const hit = placed.some(p => x0 < p[2] && p[0] < x0 + w && y0 < p[3] && p[1] < y0 + 34);
      el.classList.toggle('is-tapada', hit && !m.near); if (!hit) placed.push([x0, y0, x0 + w, y0 + 34]);
      el.children[2].textContent = m.near ? (coarse ? 'Toca el botón amarillo' : 'Pulsa E') : Math.round(m.d) + ' m';
    });
  },
  // tipo de plano según la cámara: inclinación, lente y lo que hay en el centro del cuadro
  classify(i) {
    if (i.pitch > 0.26) return 'contrapicado';
    if (i.near && (i.near.d < 3.4 || (i.fov < 26 && i.near.d < 16))) return 'detalle';
    if (i.fov >= 48 && Math.abs(i.pitch) < 0.26) return 'general';
    return 'medio';
  },
  shoot() {
    if (!this.on || this.paused) return;
    if (this.shots.length >= 6) { this.toast('info', 'Storyboard completo', 'Seis planos, como en la plantilla.'); return; }
    const kind = this.classify(market.play.shotInfo()), src = market.capture(640), fresh = kind !== 'medio' && !this.kinds.has(kind);
    this.shots.push({ src, kind }); sonido.play('plano');
    if (kind !== 'medio') this.kinds.add(kind);
    const img = document.createElement('img'); img.src = src; img.alt = SHOTS[kind].name; $('#j-tira').append(img);
    const fl = document.createElement('div'); fl.className = 'juego__flash'; document.body.append(fl); setTimeout(() => fl.remove(), 400);
    this.toast('cine', SHOTS[kind].name + (fresh ? ' ✓' : ''), this.kinds.size === 3 && fresh ? '¡Rodaste los 3 planos!' : SHOTS[kind].txt, 2800);
    if (this.kinds.size === 3 && fresh) sonido.play('logro');
    this.hud();
  },
  download() {
    if (!this.shots.length) return;
    const cols = 3, w = 640, h = 360, pad = 16, rows = Math.ceil(this.shots.length / cols);
    const c = document.createElement('canvas'); c.width = cols * w + (cols + 1) * pad; c.height = rows * (h + 44) + (rows + 1) * pad + 70;
    const x = c.getContext('2d'); x.fillStyle = '#ede8dc'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#141312'; x.font = '400 34px Bungee, sans-serif'; x.fillText('STORYBOARD · GALERAS 2037', pad, 48);
    let done = 0;
    this.shots.forEach((sh, k) => { const im = new Image(); im.onload = () => {
      const cx = pad + (k % cols) * (w + pad), cy = 70 + pad + Math.floor(k / cols) * (h + 44 + pad);
      x.drawImage(im, cx, cy, w, h); x.fillStyle = '#f2c230'; x.fillRect(cx, cy, 44, 34); x.fillStyle = '#141312'; x.font = '400 24px Bungee, sans-serif'; x.fillText(String(k + 1), cx + 12, cy + 26);
      x.font = '700 24px Atkinson, sans-serif'; x.fillText(SHOTS[sh.kind].name, cx, cy + h + 32);
      if (++done === this.shots.length) { const a = document.createElement('a'); a.download = 'storyboard-galeras-2037.jpg'; a.href = c.toDataURL('image/jpeg', 0.9); a.click(); }
    }; im.src = sh.src; });
  },
};
if (params.has('debug')) window.juego = game; // solo para pruebas
// ?debug&jugar=x,z,yaw[,pitch]&lente=N (N toques de C): deja el juego listo para capturas
if (params.has('debug') && params.has('jugar')) (async function prueba() {
  while (!market) await new Promise(r => setTimeout(r, 100));
  game.enter(); game.start();
  const [x, z, yaw, pitch] = params.get('jugar').split(',').map(Number); market.play.teleport(x, z, yaw, pitch || 0.04);
  for (let k = 0; k < Number(params.get('lente') || 0); k++) $('#j-lens').click();
  $('#j-toasts').innerHTML = '';
  const acc = params.get('accion');
  if (acc) setTimeout(() => { if (acc === 'e') market.play.interact(); else market.play.decide(acc); }, 400);
})();
$$('[data-play]').forEach(b => b.addEventListener('click', () => game.enter()));
$('#j-ruta').addEventListener('click', () => game.repetir());
$('#j-exit').addEventListener('click', () => game.exit());
$('#j-helpbtn').addEventListener('click', () => { helpPanel.hidden = false; game.pause(true); $('#j-help-close').focus(); });
$('#j-help-close').addEventListener('click', () => { helpPanel.hidden = true; game.pause(false); });
$('#j-shot').addEventListener('click', () => game.shoot());
$('#j-download').addEventListener('click', () => game.download());
$('#j-act').addEventListener('click', () => market.play.interact());
const toggleMap = () => { const big = mapFig.classList.toggle('is-big'); $('#j-mapbtn').setAttribute('aria-pressed', String(big)); $('#j-map-paper').setAttribute('aria-label', big ? 'Achicar el plano' : 'Agrandar el plano'); };
$('#j-mapbtn').addEventListener('click', toggleMap);
$('#j-map-paper').addEventListener('click', toggleMap);
$('#j-sound').addEventListener('click', e => { const on = sonido.toggle(); e.currentTarget.setAttribute('aria-pressed', String(on)); if (on) sonido.start(); });
$('#j-sound').setAttribute('aria-pressed', String(sonido.on));
$$('[data-goto]').forEach(b => b.addEventListener('click', () => goChapter(Number(b.dataset.goto))));
$('#cap-min').addEventListener('click', e => { const min = cap.classList.toggle('is-min'); e.currentTarget.setAttribute('aria-expanded', String(!min)); });
if (innerWidth < 760) { cap.classList.add('is-min'); $('#cap-min').setAttribute('aria-expanded', 'false'); }
$('#j-leave').addEventListener('click', () => game.exit());
$('#j-again').addEventListener('click', () => { end.hidden = true; game.enter(); });
$('#j-designer-view').addEventListener('click', () => {
  end.hidden = true; game.pause(false); market.play.setDesigner(true); $('#j-design').setAttribute('aria-pressed', 'true');
  game.toast('info', 'Capa de diseñador', 'Naranja: ruta mínima. Amarilla: desvío.', 5000);
});
$$('[data-choice]').forEach(b => b.addEventListener('click', () => market.play.decide(b.dataset.choice)));
$('#j-design').addEventListener('click', e => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); market.play.setDesigner(on);
  if (on) game.toast('info', 'Capa de diseñador', 'Así ve el nivel quien lo diseñó.');
});
const LENSES = [0, 24, 35, 85];
const LENS_TXT = { 24: 'Gran angular: el espacio.', 35: 'Natural: como mira una persona.', 85: 'Tele: aísla rostros y detalles.' };
$('#j-lens').addEventListener('click', e => {
  game.lensIdx = (game.lensIdx + 1) % LENSES.length; const mm = LENSES[game.lensIdx];
  market.play.setLens(mm); root.classList.toggle('lente', mm > 0); sonido.play('lente');
  $('#j-lens-t').textContent = mm ? `${mm} mm` : 'Lente'; e.currentTarget.setAttribute('aria-pressed', String(mm > 0));
  $('#j-visor').hidden = !mm; juego.classList.toggle('is-visor', mm > 0); $('#jv-lente').textContent = `${mm} mm · 2.39:1`;
  if (mm && !game.visorT0) game.visorT0 = performance.now(); if (!mm) game.visorT0 = 0;
  lb.style.removeProperty('--lb');
  if (mm) game.toast('cine', `Lente de ${mm} mm`, LENS_TXT[mm], 2600);
});
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target instanceof HTMLInputElement) return;
  const k = e.key.toLowerCase();
  if (game.on) {
    if (k === 'escape') { if (!helpPanel.hidden) $('#j-help-close').click(); else if (guia.abierta) guia.cerrar(); else if (mapFig.classList.contains('is-big')) toggleMap(); else game.exit(); return; }
    if (guia.abierta) { if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); if (!e.repeat) guia.siguiente(); } return; }
    if (!decision.hidden && (k === '1' || k === '2')) { market.play.decide(k === '1' ? 'pintarse' : 'mascara'); return; }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { keys.add(k); e.preventDefault(); }
    if (game.paused) return;
    if (k === 'l') $('#j-design').click();
    if (k === 'c') $('#j-lens').click();
    if (k === 'm') toggleMap();
    if (k === 'f') game.shoot();
    if (k === 'e') market.play.interact();
    return;
  }
  if (k === 't') { const u = new URL(location.href); if (u.searchParams.has('transmision')) u.searchParams.delete('transmision'); else u.searchParams.set('transmision', ''); location.href = u.toString(); }
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

// mirar arrastrando (mouse o dedo fuera del joystick)
canvas.addEventListener('pointerdown', e => {
  if (!game.on || game.paused) return;
  game.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!game.on || !game.look || game.look.id !== e.pointerId) return;
  const k = e.pointerType === 'touch' ? 0.006 : 0.0045;
  market.play.look((e.clientX - game.look.x) * k, (e.clientY - game.look.y) * k);
  game.look.x = e.clientX; game.look.y = e.clientY;
});
const endLook = e => { if (game.look && game.look.id === e.pointerId) game.look = null; };
canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);

// joystick táctil
const stick = $('#stick'), knob = $('#stick-knob');
stick.addEventListener('pointerdown', e => { if (game.paused) return; game.stickOn = e.pointerId; stick.setPointerCapture(e.pointerId); moveStick(e); });
stick.addEventListener('pointermove', e => { if (game.stickOn === e.pointerId) moveStick(e); });
const endStick = e => { if (game.stickOn !== e.pointerId) return; game.stickOn = null; knob.style.setProperty('--kx', '0px'); knob.style.setProperty('--ky', '0px'); market.play.input({ mx: 0, mz: 0, run: false }); };
stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
function moveStick(e) {
  const r = stick.getBoundingClientRect(), R = r.width / 2;
  let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
  const d = Math.hypot(dx, dy), m = Math.min(1, d / (R - 10));
  if (d > 0) { dx = dx / d * m * (R - 26); dy = dy / d * m * (R - 26); }
  knob.style.setProperty('--kx', dx.toFixed(1) + 'px'); knob.style.setProperty('--ky', dy.toFixed(1) + 'px');
  market.play.input({ mx: dx / (R - 26) || 0, mz: -(dy / (R - 26)) || 0, run: m > 0.92 });
}
