// GALERAS 2037 · sonido sintetizado (sin archivos): ambiente de ciudad, pasos y señales del juego.
// «El sonido es la mitad»: cada acción del jugador tiene respuesta. Arranca solo tras un gesto del usuario.
let ctx = null, master = null, bed = null, noiseBuf = null;
let on = true;
try { on = localStorage.getItem('galeras-sonido') !== '0'; } catch (_) { /* sin almacenamiento */ }
const VOL = 0.5;

function noiseBuffer() {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function env(g, t, peak, a, dcy) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
}
function tone(freq, { at = 0, dur = 0.25, type = 'sine', gain = 0.12, to = null, attack = 0.01 } = {}) {
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  env(g, t, gain, attack, dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + attack + dur + 0.05);
}
function hiss({ at = 0, dur = 0.08, type = 'bandpass', freq = 1200, q = 1, gain = 0.08, to = null } = {}) {
  const t = ctx.currentTime + at, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuffer(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  env(g, t, gain, 0.005, dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
}

const FX = {
  paso() { hiss({ dur: 0.07, freq: 700 + Math.random() * 500, q: 0.8, gain: 0.05 }); },
  examinar() { tone(660, { dur: 0.18, type: 'triangle', gain: 0.09 }); tone(990, { at: 0.09, dur: 0.3, type: 'triangle', gain: 0.08 }); },
  pista() { [523, 659, 784].forEach((f, k) => tone(f, { at: k * 0.09, dur: 0.35, type: 'triangle', gain: 0.1 })); },
  dato() { tone(880, { dur: 0.25, gain: 0.06 }); tone(1320, { at: 0.07, dur: 0.4, gain: 0.05 }); },
  logro() { [523, 659, 784, 1046].forEach((f, k) => tone(f, { at: k * 0.08, dur: 0.4, type: 'triangle', gain: 0.09 })); },
  alerta() { [880, 660, 880, 660].forEach((f, k) => tone(f, { at: k * 0.16, dur: 0.12, type: 'square', gain: 0.035 })); },
  limite() { tone(110, { dur: 0.3, gain: 0.18, to: 70 }); },
  plano() { hiss({ dur: 0.03, type: 'highpass', freq: 2500, gain: 0.14 }); hiss({ at: 0.09, dur: 0.05, type: 'highpass', freq: 1800, gain: 0.1 }); },
  decision() { [392, 494, 587].forEach(f => tone(f, { dur: 0.9, gain: 0.05, attack: 0.08 })); },
  puerta() { tone(220, { dur: 0.7, type: 'triangle', gain: 0.08, to: 880 }); },
  zona() { hiss({ dur: 0.9, type: 'bandpass', freq: 300, to: 2400, q: 0.7, gain: 0.04 }); },
  lente() { hiss({ dur: 0.05, type: 'highpass', freq: 3000, gain: 0.06 }); tone(1500, { at: 0.04, dur: 0.05, type: 'square', gain: 0.02 }); },
};

// ambiente: rumor de ciudad (ruido grave) + un zumbido eléctrico que respira
function startBed() {
  if (bed) return;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
  const g1 = ctx.createGain(); g1.gain.value = 0.05;
  src.connect(lp).connect(g1).connect(master); src.start();
  const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 55;
  const hf = ctx.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 180;
  const g2 = ctx.createGain(); g2.gain.value = 0.012;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; const lg = ctx.createGain(); lg.gain.value = 0.008;
  lfo.connect(lg).connect(g2.gain); hum.connect(hf).connect(g2).connect(master); hum.start(); lfo.start();
  bed = { stop() { [src, hum, lfo].forEach(n => { try { n.stop(); } catch (_) { /* ya parado */ } }); } };
}

export const sonido = {
  get on() { return on; },
  start() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? VOL : 0; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      startBed();
    } catch (_) { ctx = null; }
  },
  stop() { if (bed) { bed.stop(); bed = null; } },
  toggle() {
    on = !on;
    try { localStorage.setItem('galeras-sonido', on ? '1' : '0'); } catch (_) { /* sin almacenamiento */ }
    if (master) master.gain.setTargetAtTime(on ? VOL : 0, ctx.currentTime, 0.05);
    return on;
  },
  play(name) { if (!ctx || !on || !FX[name]) return; try { FX[name](); } catch (_) { /* audio no disponible */ } },
};
