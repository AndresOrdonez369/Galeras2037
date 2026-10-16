// GALERAS 2037 — "Contrabando de Rostros": un nivel completo de Pasto 2037.
// Tour guiado por capítulos (scroll) + capa de diseñador + plano de papel + playtest + modo jugable.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LEVEL, MAP, CHAPTERS, PLAYTEST_NOTES, PRINCIPLES, INTERACTABLES, DATOS } from './level.js';
import { buildLayout } from './world/layout.js';
import { mapCanvas, planCanvas as drawPlan } from './world/plan.js';
import {
  C, clamp, lerp, smooth, mulberry32, canvas,
  SIGN_STYLES, signTexture, ledTexture, zincSignTexture, windowsTexture, facadeTextures,
  concreteTexture, chumbeTexture, stoneTexture, paramoTexture, scanTexture, dotTexture,
} from './world/textures.js';

export const planCanvas = drawPlan;

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const easeIO = t => t * t * (3 - 2 * t);

export async function createMarket(canvasEl, opts = {}) {
  const low = !!opts.lowPower;
  const reduced = !!opts.reducedMotion;
  const onEvent = opts.onEvent || (() => {});
  try {
    await Promise.race([
      Promise.all(['400 80px Bungee', '900 60px Doto', '700 20px Atkinson'].map(f => document.fonts.load(f))),
      new Promise(res => setTimeout(res, 2500)),
    ]);
  } catch (_) { /* respaldo */ }

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: !low, powerPreference: 'high-performance' });
  renderer.setPixelRatio(opts.pixelRatio || Math.min(window.devicePixelRatio || 1, low ? 1.2 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color('#47362d');
  scene.fog = new THREE.FogExp2(fogColor, 0.0092);
  scene.background = fogColor.clone();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1500);

  const r = mulberry32(7);
  const ITEMS = [...INTERACTABLES, ...DATOS];               // todo lo que se examina
  const L = LEVEL;
  const lay = buildLayout();
  const world = new THREE.Group(); scene.add(world);        // todo lo que se aplana
  const design = new THREE.Group(); scene.add(design);      // capa de diseñador
  const fadeMats = [];
  const extraLights = [];                                   // [luz, intensidad] que se apagan en el plano                                       // materiales que se apagan en el plano
  const dummy = new THREE.Object3D();
  const dot = dotTexture();
  // une las piezas de un grupo por material: muchas menos llamadas de dibujo (clave en celular)
  function mergeGeos(geos) {
    const names = ['position', 'normal', 'uv'].filter(n => geos.every(g => g.attributes[n]));
    const merged = new THREE.BufferGeometry();
    for (const n of names) {
      const size = geos[0].attributes[n].itemSize, arr = new Float32Array(geos.reduce((t, g) => t + g.attributes[n].array.length, 0));
      let off = 0; for (const g of geos) { arr.set(g.attributes[n].array, off); off += g.attributes[n].array.length; }
      merged.setAttribute(n, new THREE.BufferAttribute(arr, size));
    }
    merged.computeBoundingSphere();
    return merged;
  }
  function bake(g) {
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), byMat = new Map();
    g.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!byMat.has(o.material)) byMat.set(o.material, []);
      byMat.get(o.material).push(geo);
    });
    const out = new THREE.Group();
    out.position.copy(g.position); out.quaternion.copy(g.quaternion); out.scale.copy(g.scale);
    for (const [mat, geos] of byMat) out.add(new THREE.Mesh(mergeGeos(geos), mat));
    if (g.parent) { const p = g.parent; p.remove(g); p.add(out); }
    return out;
  }
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });

  /* ================= cielo, luces, suelo ================= */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#1e1724') }, horizon: { value: new THREE.Color('#654330') }, glow: { value: new THREE.Color('#ff6a26') }, fade: { value: 1 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; uniform float fade; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y*1.8+0.06,0.,1.); vec3 c = mix(horizon, top, pow(h,0.55));
      float g = pow(max(dot(normalize(vec3(-1.,0.2,0.)), normalize(vDir)),0.), 40.); c += glow*g*0.42;
      gl_FragColor = vec4(c*fade,1.); }`,
  }));
  sky.renderOrder = -10;
  scene.add(sky);
  // luz ambiental cálida: sigue siendo de noche, pero todo se lee
  const hemi = new THREE.HemisphereLight('#f2cdaa', '#5e4632', low ? 2.3 : 2.05); scene.add(hemi);
  scene.add(new THREE.AmbientLight('#ffd8b0', low ? 0.6 : 0.5));
  const moon = new THREE.DirectionalLight('#a9bfe8', 0.75); moon.position.set(30, 60, 40); scene.add(moon);
  const lavaKey = new THREE.DirectionalLight('#ff9455', 0.5); lavaKey.position.set(-50, 80, 120); scene.add(lavaKey); // el resplandor del volcán
  const sodium = [];
  const lightSpots = low
    ? [[2, -2], [-30, 2], [-62, -2], [-100, 10]]
    : [[3, -2], [-14, 2], [-30, -2], [-48, 1.5], [-64, -1.5], [-88, 12], [-112, 12], [-92, -16], [-140, 0]];
  for (const [x, z] of lightSpots) { const l = new THREE.PointLight(C.sodium, low ? 28 : 26, 32, 1.5); l.position.set(x, 4.6, z); world.add(l); sodium.push(l); }

  const [gc, gctx] = canvas(512, 512); const gr = mulberry32(11);
  gctx.fillStyle = '#c4c4c4'; gctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { const x = gr() * 512, y = gr() * 512, s = 10 + gr() * 60; gctx.fillStyle = `rgba(0,0,0,${0.2 + gr() * 0.5})`; gctx.beginPath(); gctx.ellipse(x, y, s, s * 0.5, gr() * 3, 0, 7); gctx.fill(); }
  const rough = new THREE.CanvasTexture(gc); rough.wrapS = rough.wrapT = THREE.RepeatWrapping; rough.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: '#3d3731', roughness: 1, metalness: 0.04, roughnessMap: rough }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(-90, 0, 0); scene.add(ground);
  const stone = stoneTexture(r); stone.repeat.set(12, 12);
  const plazaFloor = new THREE.Mesh(new THREE.PlaneGeometry(L.plaza.x0 - L.plaza.x1, L.plaza.z1 - L.plaza.z0), new THREE.MeshStandardMaterial({ map: stone, color: '#8d877c', roughness: 0.85 }));
  plazaFloor.rotation.x = -Math.PI / 2; plazaFloor.position.set((L.plaza.x0 + L.plaza.x1) / 2, 0.02, 0); world.add(plazaFloor);
  const paramoTex = paramoTexture(r); paramoTex.repeat.set(10, 10);
  const paramo = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: paramoTex, roughness: 1 }));
  paramo.rotation.x = -Math.PI / 2; paramo.position.set(-210, 0.015, 0); world.add(paramo);
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(60, 3.2), new THREE.MeshStandardMaterial({ map: stone, color: '#6e695f', roughness: 0.9 }));
  trail.rotation.x = -Math.PI / 2; trail.position.set(-180, 0.03, 0); world.add(trail);

  /* ================= manzanas ================= */
  const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const facadeVariants = ['#ddd5c4', '#d6c7a4', '#cfd6d9'].map(col => facadeTextures(r, col));
  const colonial = lay.blocks.filter(b => b.kind === 'colonial');
  facadeVariants.forEach((fv, vi) => {
    const set = colonial.filter((_, i) => i % 3 === vi);
    if (!set.length) return;
    const mat = new THREE.MeshStandardMaterial({ map: fv.map, emissive: '#ffffff', emissiveMap: fv.emissive, emissiveIntensity: 0.9, roughness: 0.92 });
    fadeMats.push([mat, 'emissiveIntensity', 0.9]);
    const im = new THREE.InstancedMesh(boxGeo, mat, set.length);
    set.forEach((b, i) => { dummy.position.set(b.x, 0, b.z); dummy.scale.set(b.w, b.h, b.d); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    world.add(im);
  });
  // tejados de barro: prisma
  const roofShape = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 0.5)]);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ color: C.tile, roughness: 0.9 }), colonial.length);
  colonial.forEach((b, i) => {
    const alongX = b.w >= b.d;
    dummy.position.set(b.x, b.h, b.z);
    if (alongX) { dummy.rotation.set(0, Math.PI / 2, 0); dummy.scale.set(b.d + 0.6, 2.6, b.w + 0.4); }
    else { dummy.rotation.set(0, 0, 0); dummy.scale.set(b.w + 0.6, 2.6, b.d + 0.4); }
    dummy.updateMatrix(); roofs.setMatrixAt(i, dummy.matrix);
  });
  world.add(roofs);
  // balcones de madera sobre la Calle Real
  const streetCol = colonial.filter(b => b.street);
  const balc = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.18, 1), new THREE.MeshStandardMaterial({ color: '#4a2b18', roughness: 0.8 }), streetCol.length * 2);
  let bi = 0;
  for (const b of streetCol) for (let k = 0; k < 2; k++) {
    const x = b.x - b.w * 0.25 + k * b.w * 0.5, z = b.side * (L.street.half - 0.45);
    dummy.position.set(x, 4.1, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(Math.min(2.4, b.w * 0.4), 1, 0.9); dummy.updateMatrix(); balc.setMatrixAt(bi++, dummy.matrix);
  }
  balc.count = bi; world.add(balc);

  // bodegas y torres del mercado, skyline
  const winTex = windowsTexture(r);
  const conc = concreteTexture(r);
  const lowB = lay.blocks.filter(b => b.kind === 'low');
  const towerB = [...lay.blocks.filter(b => b.kind === 'tower'), ...lay.skyline];
  const lowMat = new THREE.MeshStandardMaterial({ map: conc, color: '#e2d8ca', roughness: 0.95 });
  const lowIM = new THREE.InstancedMesh(boxGeo, lowMat, lowB.length);
  lowB.forEach((b, i) => { dummy.position.set(b.x, 0, b.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(b.w, b.h, b.d); dummy.updateMatrix(); lowIM.setMatrixAt(i, dummy.matrix); });
  world.add(lowIM);
  const towerMat = new THREE.MeshStandardMaterial({ color: '#756d62', roughness: 0.95, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 1.1 });
  fadeMats.push([towerMat, 'emissiveIntensity', 1.1]);
  const towerIM = new THREE.InstancedMesh(boxGeo, towerMat, towerB.length);
  towerB.forEach((b, i) => { dummy.position.set(b.x, 0, b.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(b.w, b.h, b.d); dummy.updateMatrix(); towerIM.setMatrixAt(i, dummy.matrix); });
  world.add(towerIM);
  // terrazas: tanques, paneles solares, antenas
  const roofy = [...lowB, ...towerB];
  const solar = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.08, 1), new THREE.MeshStandardMaterial({ color: '#1b2c4a', roughness: 0.3, metalness: 0.6 }), roofy.length * 2);
  let si = 0; const antPts = [];
  for (const b of roofy) {
    for (let k = 0; k < 2; k++) if (r() > 0.35) { dummy.position.set(b.x + (k - 0.5) * b.w * 0.4, b.h + 0.5, b.z); dummy.rotation.set(0, 0, 0.35); dummy.scale.set(b.w * 0.35, 1, b.d * 0.6); dummy.updateMatrix(); solar.setMatrixAt(si++, dummy.matrix); }
    if (r() > 0.5) { const x = b.x + (r() - 0.5) * b.w * 0.6; antPts.push(x, b.h, b.z, x, b.h + 3 + r() * 7, b.z); }
  }
  solar.count = si; world.add(solar);
  const antGeo = new THREE.BufferGeometry(); antGeo.setAttribute('position', new THREE.Float32BufferAttribute(antPts, 3));
  world.add(new THREE.LineSegments(antGeo, new THREE.LineBasicMaterial({ color: '#0d0c0b' })));
  // pendones de tejido andino en LED sobre las torres
  const chumbe = chumbeTexture(r); chumbe.wrapT = THREE.RepeatWrapping;
  const bannerMat = new THREE.MeshBasicMaterial({ map: chumbe, color: new THREE.Color(1, 1, 1).multiplyScalar(1.4), side: THREE.DoubleSide });
  const banners = towerB.filter(b => b.banner || (b.h > 22 && r() > 0.5)).slice(0, low ? 6 : 14);
  for (const b of banners) {
    const h = b.h * 0.7, m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, h), bannerMat);
    const face = Math.sign(-b.z) || 1;
    m.position.set(b.x, b.h * 0.55, b.z + face * (b.d / 2 + 0.05)); m.rotation.y = face > 0 ? 0 : Math.PI;
    world.add(m);
  }

  /* ================= Potrerillo: puestos, lonas, rótulos ================= */
  const postMat = new THREE.MeshStandardMaterial({ color: '#3a3833', roughness: 0.6, metalness: 0.5 });
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1, 0.08).translate(0, 0.5, 0), postMat, lay.stalls.length * 4);
  const counters = new THREE.InstancedMesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.9 }), lay.stalls.length);
  const goods = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.24, 0.3).translate(0, 0.12, 0), new THREE.MeshStandardMaterial({ roughness: 0.7 }), lay.stalls.length * 6);
  const goodsColors = ['#e8862a', '#c8261e', '#5f8a2e', '#f2c230', '#8c5a2b', '#d9d3c4', '#6a2a6a'];
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc27a').multiplyScalar(4) }), lay.stalls.length);
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.06, 0.06), new THREE.MeshBasicMaterial({ vertexColors: false, color: '#ffffff' }), lay.stalls.length);
  const tarps = [];
  const tarpSeg = low ? 4 : 8;
  let gi = 0;
  lay.stalls.forEach((s, i) => {
    const zIn = s.side * L.market.half, zOut = s.side * (L.market.half + 3);
    [[s.x + s.w / 2 - 0.1, zIn], [s.x - s.w / 2 + 0.1, zIn], [s.x + s.w / 2 - 0.1, zOut], [s.x - s.w / 2 + 0.1, zOut]].forEach(([x, z], k) => {
      dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, s.h + (k > 1 ? 0.5 : 0), 1); dummy.updateMatrix(); posts.setMatrixAt(i * 4 + k, dummy.matrix);
    });
    dummy.position.set(s.x, 0, zIn + s.side * 0.55); dummy.scale.set(s.w * 0.9, 0.95, 1); dummy.updateMatrix(); counters.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 6; k++) {
      dummy.position.set(s.x - s.w * 0.38 + k * s.w * 0.15, 0.95, zIn + s.side * (0.35 + r() * 0.4)); dummy.scale.set(1, 1 + r() * 0.6, 1); dummy.rotation.y = r() * 0.4; dummy.updateMatrix();
      goods.setMatrixAt(gi, dummy.matrix); goods.setColorAt(gi, new THREE.Color(goodsColors[Math.floor(r() * goodsColors.length)])); gi++;
    }
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(s.x, s.h - 0.25, s.side * (L.market.half + 1.4)); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); bulbs.setMatrixAt(i, dummy.matrix);
    dummy.position.set(s.x, s.h + 0.02, s.side * (L.market.half - 0.2)); dummy.scale.set(s.w, 1, 1); dummy.updateMatrix(); strips.setMatrixAt(i, dummy.matrix);
    strips.setColorAt(i, new THREE.Color(i % 3 ? C.cyan : C.orange).multiplyScalar(2.2));
    const geo = new THREE.PlaneGeometry(s.w + 0.3, 3.5, tarpSeg, tarpSeg);
    const mat = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.85, side: THREE.DoubleSide, emissive: s.color, emissiveIntensity: 0.12 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(s.x, s.h + 0.25, s.side * (L.market.half + 1.5)); mesh.rotation.x = -Math.PI / 2 + s.side * 0.16;
    world.add(mesh);
    tarps.push({ mesh, base: geo.attributes.position.array.slice(), phase: r() * 6.28, amp: 0.05 + r() * 0.08 });
  });
  goods.instanceColor.needsUpdate = true; strips.instanceColor.needsUpdate = true;
  world.add(posts, counters, goods, bulbs, strips);

  // cables con bombillos (mercado + Calle Real) y cuerdas sobre la plaza
  const cablePts = [], bulbPos = [];
  const addCable = (a, b, sag, withBulbs) => {
    const N = 16;
    for (let k = 0; k < N; k++) {
      const p = t => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, lerp(a[2], b[2], t)];
      const p0 = p(k / N), p1 = p((k + 1) / N);
      cablePts.push(...p0, ...p1);
      if (withBulbs && k % 2 === 0 && k > 0) bulbPos.push([p0[0], p0[1] - 0.18, p0[2]]);
    }
  };
  for (let x = 8; x > L.market.x1; x -= 6 + r() * 5) addCable([x, 8 + r() * 4, -7.4], [x, 8 + r() * 4, 7.4], 1 + r() * 1.4, r() > 0.4);
  for (let x = L.street.x0 - 2; x > L.street.x1; x -= 4 + r() * 3) addCable([x, 6.5 + r(), -L.street.half], [x - (r() - 0.5) * 3, 6.5 + r(), L.street.half], 0.6 + r() * 0.6, r() > 0.3);
  for (let k = 0; k < 6; k++) addCable([L.statue.x, 9, L.statue.z], [L.statue.x + Math.cos(k / 6 * Math.PI * 2) * 22, 7, L.statue.z + Math.sin(k / 6 * Math.PI * 2) * 21], 1.2, true);
  const cGeo = new THREE.BufferGeometry(); cGeo.setAttribute('position', new THREE.Float32BufferAttribute(cablePts, 3));
  world.add(new THREE.LineSegments(cGeo, new THREE.LineBasicMaterial({ color: '#0b0a09' })));
  const stringBulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(3.2) }), bulbPos.length);
  bulbPos.forEach((p, i) => { dummy.position.set(...p); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); stringBulbs.setMatrixAt(i, dummy.matrix); });
  world.add(stringBulbs);

  // rótulos pintados a mano
  const SIGNS_MARKET = [['CUY ASADO 24H'], ['SE REPARAN IMPLANTES'], ['MOPA-MOPA', 'BARNIZ ORIGINAL'], ['AGUA DEL PÁRAMO'], ['MEMORIAS USADAS'], ['TALCO', 'NO HAY'], ['HELADO DE PAILA'], ['RECARGAS NEURALES']];
  const SIGNS_STREET = [['BARNIZ DE PASTO'], ['SASTRERÍA'], ['SE ALQUILAN ROSTROS'], ['MÁSCARAS LEGALES'], ['ARREGLO DRONES'], ['CAFÉ DE NARIÑO']];
  const addSign = (lines, i, x, side, zFace, y, vertical) => {
    const style = SIGN_STYLES[i % SIGN_STYLES.length];
    const t = signTexture(vertical ? [lines[0].split(' ')[0]] : lines, style, r, vertical);
    const w = vertical ? 1.1 : 3.2, h = vertical ? 4.2 : 1.2;
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.32, side: THREE.DoubleSide });
    fadeMats.push([mat, 'emissiveIntensity', 0.32]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, side * (zFace - w / 2)); m.rotation.y = Math.PI / 2 + side * 0.05; world.add(m);
  };
  SIGNS_MARKET.forEach((s, i) => addSign(s, i, 4 - i * 5.2 - r() * 1.5, i % 2 ? 1 : -1, 7.1, 4.4 + r() * 2.4, i % 4 === 3));
  SIGNS_STREET.forEach((s, i) => {
    const side = i % 2 ? -1 : 1, x = L.street.x0 - 3 - i * 5.8;
    const t = signTexture(s, SIGN_STYLES[(i + 2) % SIGN_STYLES.length], r, false);
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.35 });
    fadeMats.push([mat, 'emissiveIntensity', 0.35]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.1), mat);
    m.position.set(x, 3.05, side * (L.street.half - 0.04)); m.rotation.y = side > 0 ? Math.PI : 0; world.add(m);
  });

  // portada del mercado y gran rótulo GALERAS 2037
  const gateTex = zincSignTexture(mulberry32(1915), { main: 'PLAZA DE MERCADO', accent: '', sub: 'EL POTRERILLO · PASTO 2037', W: 2048, H: 520 });
  const gateMat = new THREE.MeshStandardMaterial({ map: gateTex, roughness: 0.55, metalness: 0.3, emissive: '#ffffff', emissiveMap: gateTex, emissiveIntensity: 0.18, side: THREE.DoubleSide });
  fadeMats.push([gateMat, 'emissiveIntensity', 0.18]);
  const gatePlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.55), gateMat); gatePlane.rotation.y = Math.PI / 2; gatePlane.position.set(13, 7, 0); world.add(gatePlane);
  for (const z of [-5.4, 5.4]) { const p = new THREE.Mesh(boxGeo, postMat); p.scale.set(0.35, 8.3, 0.35); p.position.set(13, 0, z); world.add(p); }
  const heroTex = zincSignTexture(mulberry32(1993), { main: 'GALERAS', accent: '2037', sub: 'DEL PLANO AL MUNDO JUGABLE' });
  const heroMat = new THREE.MeshStandardMaterial({ map: heroTex, roughness: 0.55, metalness: 0.35, emissive: '#ffffff', emissiveMap: heroTex, emissiveIntensity: 0.22, side: THREE.DoubleSide });
  fadeMats.push([heroMat, 'emissiveIntensity', 0.22]);
  const heroSign = new THREE.Group();
  const heroPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.75), heroMat); heroPlane.rotation.y = Math.PI / 2; heroSign.add(heroPlane);
  heroSign.position.set(-19, 7.2, 0); world.add(heroSign);
  const hangGeo = new THREE.BufferGeometry(); hangGeo.setAttribute('position', new THREE.Float32BufferAttribute([-19, 9.07, -5.2, -19, 12.5, -7.6, -19, 9.07, 5.2, -19, 12.5, 7.6], 3));
  world.add(new THREE.LineSegments(hangGeo, new THREE.LineBasicMaterial({ color: '#0b0a09' })));
  const heroLight = new THREE.SpotLight('#ffd7a0', 60, 30, 0.6, 0.6, 1.4); heroLight.position.set(-10, 2.5, 0); heroLight.target = heroSign; world.add(heroLight);

  // pantalla LED cruzando la Calle Real
  const ledTex = ledTexture('BOLETÍN DE CENIZA · ALERTA NARANJA · USE MASCARILLA · CONTROL BIOMÉTRICO A 20 M · GALERAS 2037 · ');
  ledTex.repeat.set(0.42, 1);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.8), new THREE.MeshBasicMaterial({ map: ledTex, color: new THREE.Color(1, 1, 1).multiplyScalar(1.6) }));
  led.position.set(-46, 5.6, 0); led.rotation.y = Math.PI / 2; world.add(led);

  /* ================= Calle Real: el escáner ================= */
  const scanTex = scanTexture();
  const scanMat = additive('#46d6e6', 0.55, { map: scanTex, side: THREE.DoubleSide });
  const scanner = new THREE.Group(); scanner.position.set(L.scanner.x, 0, 0); world.add(scanner);
  const metal = new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: 0.4, metalness: 0.8 });
  for (const z of [-L.street.half + 0.3, L.street.half - 0.3]) { const p = new THREE.Mesh(boxGeo, metal); p.scale.set(0.45, 5.2, 0.45); p.position.z = z; scanner.add(p); }
  const beam = new THREE.Mesh(boxGeo, metal); beam.scale.set(0.5, 0.55, L.street.half * 2); beam.position.y = 5.1; scanner.add(beam);
  const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(L.street.half * 2 - 0.9, 5), scanMat); scanPlane.rotation.y = Math.PI / 2; scanPlane.position.y = 2.5; scanner.add(scanPlane);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.cyan).multiplyScalar(3) })); eye.position.set(0.3, 5.1, 0); scanner.add(eye);

  /* ================= San Juan Bautista ================= */
  const white = new THREE.MeshStandardMaterial({ color: '#e4ddcf', roughness: 0.9 });
  const sj = new THREE.Group(); sj.position.set(L.sanjuan.x, 0, L.sanjuan.z); world.add(sj);
  const sjBody = new THREE.Mesh(boxGeo, white); sjBody.scale.set(14, 9, 12); sjBody.position.z = 5; sj.add(sjBody);
  // espadaña escalonada
  const esp = new THREE.Mesh(boxGeo, white); esp.scale.set(7, 4.5, 1); esp.position.set(0, 9, -0.6); sj.add(esp);
  const esp2 = new THREE.Mesh(boxGeo, white); esp2.scale.set(3.4, 3, 1); esp2.position.set(0, 13.5, -0.6); sj.add(esp2);
  const darkMat = new THREE.MeshBasicMaterial({ color: '#120d0a' });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.2), darkMat); door.position.set(0, 2.1, -1.02); door.rotation.y = Math.PI; sj.add(door);
  // fachada de San Juan: cal con sillares, pilastras, cornisa, rosetón y espadaña con campanas
  const [sc, sctx] = canvas(512, 512); sctx.fillStyle = '#d9cfbd'; sctx.fillRect(0, 0, 512, 512);
  sctx.strokeStyle = 'rgba(90,76,60,.28)'; sctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 32) { sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(512, y); sctx.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 512; x += 64) { sctx.beginPath(); sctx.moveTo(x, y); sctx.lineTo(x, y + 32); sctx.stroke(); } }
  for (let i = 0; i < 60; i++) { sctx.fillStyle = `rgba(60,50,40,${0.04 + r() * 0.08})`; sctx.beginPath(); sctx.ellipse(r() * 512, 300 + r() * 212, 20 + r() * 60, 10 + r() * 30, 0, 0, 7); sctx.fill(); }
  const cal = new THREE.CanvasTexture(sc); cal.colorSpace = THREE.SRGBColorSpace; cal.wrapS = cal.wrapT = THREE.RepeatWrapping; cal.repeat.set(2, 2);
  const calMat = new THREE.MeshStandardMaterial({ map: cal, roughness: 0.95 });
  sjBody.material = calMat; esp.material = calMat; esp2.material = calMat;
  const stoneTrim = new THREE.MeshStandardMaterial({ color: '#a59a86', roughness: 0.9 });
  for (const x of [-6.4, -2.2, 2.2, 6.4]) { const p = new THREE.Mesh(boxGeo, stoneTrim); p.scale.set(0.7, 8.6, 0.35); p.position.set(x, 0, -1.15); sj.add(p); }
  const cornice = new THREE.Mesh(boxGeo, stoneTrim); cornice.scale.set(14.8, 0.45, 0.7); cornice.position.set(0, 8.7, -1.1); sj.add(cornice);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.22, 8, 24, Math.PI), stoneTrim); arch.position.set(0, 4.2, -1.12); sj.add(arch);
  const sjRose = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb35a').multiplyScalar(0.9), side: THREE.DoubleSide })); sjRose.position.set(0, 6.4, -1.08); sj.add(sjRose);
  const bronzeBell = new THREE.MeshStandardMaterial({ color: '#7a5a2a', metalness: 0.8, roughness: 0.35 });
  for (const [x, y] of [[-2, 9.6], [2, 9.6], [0, 13.6]]) {
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9), darkMat); hole.rotation.y = Math.PI; hole.position.set(x, y + 0.6, -1.12); sj.add(hole);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), bronzeBell); bell.position.set(x, y + 0.95, -1.25); sj.add(bell);
  }
  const altarGlow = new THREE.PointLight('#ffb35a', 6, 8, 1.8); altarGlow.position.set(-1, 1.6, -3); sj.add(altarGlow);
  const sjLight = new THREE.SpotLight('#ffd7a8', 16, 30, 0.6, 0.9, 1.4); sjLight.position.set(9, 0.4, -9); const sjT = new THREE.Object3D(); sjT.position.set(0, 9, -0.5); sj.add(sjT); sjLight.target = sjT; sj.add(sjLight); extraLights.push([sjLight, 16]);
  // velas y máscaras confiscadas (pista 2)
  const candles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd28a').multiplyScalar(1.5) }), 14);
  for (let k = 0; k < 14; k++) { dummy.position.set(-3 + (k % 7) * 0.5, 0.95 + (k > 6 ? 0.3 : 0), -2.6 - (k > 6 ? 0.3 : 0)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); candles.setMatrixAt(k, dummy.matrix); }
  sj.add(candles);
  const masks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI), new THREE.MeshStandardMaterial({ roughness: 0.5 }), 9);
  for (let k = 0; k < 9; k++) { dummy.position.set(-2.6 + (k % 5) * 0.55, 1.5 + Math.floor(k / 5) * 0.55, -2.35); dummy.rotation.set(0, Math.PI, 0); dummy.scale.set(1, 1.3, 0.6); dummy.updateMatrix(); masks.setMatrixAt(k, dummy.matrix); masks.setColorAt(k, new THREE.Color([C.red, C.yellow, C.blue, '#f4f1ea', C.green][k % 5])); }
  masks.instanceColor.needsUpdate = true; sj.add(masks);
  const altar = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#3a2a1c' })); altar.scale.set(4, 0.95, 0.9); altar.position.set(-1, 0, -2.6); sj.add(altar);

  /* ================= Plaza de Nariño ================= */
  // portales
  const colGeo = new THREE.CylinderGeometry(0.22, 0.26, 3.8, 10).translate(0, 1.9, 0);
  const arc = new THREE.InstancedMesh(colGeo, white, lay.arcades.length);
  lay.arcades.forEach((a, i) => { dummy.position.set(a.x, 0, a.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); arc.setMatrixAt(i, dummy.matrix); });
  world.add(arc);
  if (lay.arcades.length) {
    const xs = lay.arcades.map(a => a.x), z = lay.arcades[0].z;
    const slab = new THREE.Mesh(boxGeo, white); slab.scale.set(Math.max(...xs) - Math.min(...xs) + 3, 0.5, 3.6); slab.position.set((Math.max(...xs) + Math.min(...xs)) / 2, 3.8, z + 1.5); world.add(slab);
  }
  // estatua de Nariño con holograma
  const statue = new THREE.Group(); statue.position.set(L.statue.x, 0, L.statue.z); world.add(statue);
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#6d685f', roughness: 0.9 });
  [[3.4, 0.8, 0], [2.6, 1.6, 0.8], [1.8, 1.4, 2.4]].forEach(([s, h, y]) => { const p = new THREE.Mesh(boxGeo, stoneMat); p.scale.set(s, h, s); p.position.y = y; statue.add(p); });
  const bronze = new THREE.MeshStandardMaterial({ color: '#3b2f22', roughness: 0.45, metalness: 0.75 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 2.2, 12), bronze); body.position.y = 4.9; statue.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), bronze); head.position.y = 6.25; statue.add(head);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1.3), bronze); arm.position.set(0.25, 5.6, 0.55); arm.rotation.x = -0.6; statue.add(arm);
  const holoMat = additive('#46d6e6', 0.55, { side: THREE.DoubleSide });
  const rings = [2.2, 2.9, 3.6].map((rad, k) => { const t = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.04, 6, 64), holoMat); t.position.y = 4.4 + k * 1.1; t.rotation.x = Math.PI / 2; statue.add(t); return t; });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 14, 24, 1, true), additive('#46d6e6', 0.07, { side: THREE.DoubleSide })); column.position.y = 7; statue.add(column);

  // catedral: el Ojo de Atriz
  const cat = L.cathedral;
  const cath = new THREE.Group(); cath.position.set(cat.x, 0, cat.z); world.add(cath);
  const catWhite = new THREE.MeshStandardMaterial({ color: '#ece6da', roughness: 0.85, emissive: '#2a2622', emissiveIntensity: 0.4 });
  const nave = new THREE.Mesh(boxGeo, catWhite); nave.scale.set(cat.w - 10, 14, cat.d); cath.add(nave);
  const front = cat.d / 2;
  const towers = [-1, 1].map(s => {
    const t = new THREE.Group(); t.position.set(s * (cat.w / 2 - 2.6), 0, front - 2.6); cath.add(t);
    const tb = new THREE.Mesh(boxGeo, catWhite); tb.scale.set(5.2, 22, 5.2); t.add(tb);
    const tb2 = new THREE.Mesh(boxGeo, catWhite); tb2.scale.set(3.8, 4, 3.8); tb2.position.y = 22; t.add(tb2);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), catWhite); cap.position.y = 26; t.add(cap);
    return t;
  });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 4, 32), catWhite); drum.position.set(0, 16, -2); cath.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), catWhite); dome.position.set(0, 18, -2); cath.add(dome);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), darkMat); portal.position.set(0, 3.5, front + 0.02); cath.add(portal);
  // rosetón: chakana luminosa
  const chakanaShape = makeChakana(1);
  const chakMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(2.2) });
  const rose = new THREE.Mesh(new THREE.ShapeGeometry(chakanaShape), chakMat); rose.scale.setScalar(0.75); rose.position.set(0, 10.5, front + 0.03); cath.add(rose);
  const catLights = [-8, 8].map(dx => { const l = new THREE.SpotLight('#ffcf9a', 36, 40, 0.7, 0.7, 1.2); l.position.set(cat.x + dx, 0.5, cat.z + front + 9); const tg = new THREE.Object3D(); tg.position.set(cat.x + dx * 0.4, 14, cat.z + front); scene.add(tg); l.target = tg; world.add(l); return l; });
  // el ojo y su haz giratorio
  const eyeTower = towers[0];
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.cyan).multiplyScalar(3.5) })); ojo.position.y = 24; eyeTower.add(ojo);
  const beamPivot = new THREE.Group(); beamPivot.position.y = 24; eyeTower.add(beamPivot);
  const beamGeo = new THREE.ConeGeometry(2.6, 40, 24, 1, true).translate(0, -20, 0);
  const watchBeam = new THREE.Mesh(beamGeo, additive('#46d6e6', 0.06, { side: THREE.DoubleSide }));
  watchBeam.rotation.x = -Math.PI / 2 + 0.5; beamPivot.add(watchBeam);
  const watchLight = new THREE.SpotLight('#7fe9f5', 70, 60, 0.16, 0.6, 1.3); watchLight.position.set(0, 0, 0); beamPivot.add(watchLight);
  const watchTarget = new THREE.Object3D(); scene.add(watchTarget); watchLight.target = watchTarget;

  // carroza del Carnaval de Negros y Blancos, versión 2037: mitad papel maché pintado, mitad armazón de LED
  const fl = new THREE.Group(); fl.position.set(L.float.x, 0, L.float.z); fl.rotation.y = Math.PI / 2; world.add(fl);
  const fz = L.float.z;
  const keepPaint = new THREE.Plane(v3(0, 0, 1), -fz), keepWire = new THREE.Plane(v3(0, 0, -1), fz);
  const platform = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#6e1a14', roughness: 0.55 })); platform.scale.set(5.6, 1.1, 9.4); platform.position.y = 0.35; fl.add(platform);
  const skirt = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(1.1) })); skirt.scale.set(5.7, 0.08, 9.5); skirt.position.y = 0.42; fl.add(skirt);
  const skirt2 = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(C.cyan).multiplyScalar(1.1) })); skirt2.scale.set(5.7, 0.06, 9.5); skirt2.position.y = 1.38; fl.add(skirt2);
  for (const [x, z] of [[-2.6, -3.6], [2.6, -3.6], [-2.6, 3.6], [2.6, 3.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), metal); w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z); fl.add(w); }
  // la cabeza monumental: piel pintada con talco y carbón (Negros y Blancos)
  const [hc, hctx] = canvas(1024, 512);
  hctx.fillStyle = '#d98b62'; hctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 26; i++) { hctx.fillStyle = i % 2 ? 'rgba(18,16,16,.92)' : 'rgba(250,247,240,.95)'; hctx.beginPath(); hctx.ellipse(r() * 1024, 120 + r() * 300, 30 + r() * 90, 14 + r() * 40, r() * 3, 0, 7); hctx.fill(); }
  for (let i = 0; i < 40; i++) { hctx.fillStyle = [C.red, C.yellow, C.blue, C.green, '#e84a8a'][i % 5]; hctx.beginPath(); hctx.arc(r() * 1024, 20 + r() * 90, 6 + r() * 14, 0, 7); hctx.fill(); }
  const headTex = new THREE.CanvasTexture(hc); headTex.colorSpace = THREE.SRGBColorSpace;
  const headGeo = new THREE.SphereGeometry(3, 48, 32);
  const bigHead = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.75, clippingPlanes: [keepPaint] }));
  bigHead.scale.set(1, 1.12, 0.95); bigHead.position.y = 7.1; fl.add(bigHead);
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.86, 24, 16), new THREE.MeshBasicMaterial({ color: '#07090c', clippingPlanes: [keepWire] }));
  core.scale.copy(bigHead.scale); core.position.copy(bigHead.position); fl.add(core);
  const armature = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(3.02, 16, 12), 1), new THREE.LineBasicMaterial({ color: new THREE.Color(C.cyan).multiplyScalar(1.3), clippingPlanes: [keepWire] }));
  armature.scale.copy(bigHead.scale); armature.position.copy(bigHead.position); fl.add(armature);
  // rasgos: ojo pintado y ojo de LED, nariz, cejas, boca
  const eyeWhite = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.4 });
  const eyeBlack = new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.4 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 14), eyeWhite); eyeL.position.set(1.05, 7.75, 2.45); fl.add(eyeL);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), eyeBlack); pupil.position.set(1.05, 7.75, 3.0); fl.add(pupil);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.cyan).multiplyScalar(0.8) })); eyeR.position.set(-1.05, 7.75, 2.45); fl.add(eyeR);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.4, 14), new THREE.MeshStandardMaterial({ color: '#c8261e', roughness: 0.4 })); nose.rotation.x = Math.PI / 2; nose.position.set(0, 7.05, 3.05); fl.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.16, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#7a0d0d', roughness: 0.4 })); mouth.rotation.z = Math.PI; mouth.position.set(0, 6.25, 2.6); fl.add(mouth);
  for (const s of [-1, 1]) { const brow = new THREE.Mesh(boxGeo, eyeBlack); brow.scale.set(1.1, 0.22, 0.3); brow.position.set(s * 1.05, 8.55, 2.35); brow.rotation.z = s * 0.18; fl.add(brow); }
  // corona de chakana y ruana a rayas
  const crown = new THREE.Mesh(new THREE.ExtrudeGeometry(makeChakana(0.55), { depth: 0.3, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#3a2a0a', emissive: C.yellow, emissiveIntensity: 0.55 }));
  crown.position.set(0, 11.3, -0.15); fl.add(crown);
  const [rc, rctx] = canvas(512, 128); const stripes = ['#8a1e14', C.yellow, '#1f5fa8', '#2e8b57', '#3a2416', C.orange];
  for (let x = 0; x < 512; x += 16) { rctx.fillStyle = stripes[(x / 16) % stripes.length]; rctx.fillRect(x, 0, 16, 128); }
  const ruanaTex = new THREE.CanvasTexture(rc); ruanaTex.colorSpace = THREE.SRGBColorSpace;
  const ruana = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3.8, 32, 1, true), new THREE.MeshStandardMaterial({ map: ruanaTex, roughness: 0.8, side: THREE.DoubleSide })); ruana.position.y = 3.35; fl.add(ruana);
  // alas de cóndor hechas de paneles solares
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0); wingShape.lineTo(5.5, 1.6); wingShape.lineTo(6.6, 0.9); wingShape.lineTo(6.1, 0.3); wingShape.lineTo(6.9, -0.2); wingShape.lineTo(6.0, -0.6); wingShape.lineTo(6.6, -1.1); wingShape.lineTo(5.4, -1.3); wingShape.lineTo(2.2, -1.2); wingShape.lineTo(0, -0.6); wingShape.closePath();
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const wingMat = new THREE.MeshStandardMaterial({ color: '#1b2c4a', metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide });
  const wingEdge = new THREE.LineBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(2.2) });
  const floatWings = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * 1.6, 8.2, -2.2); g.scale.set(s, 1, 1); fl.add(g);
    g.add(new THREE.Mesh(wingGeo, wingMat), new THREE.LineSegments(new THREE.EdgesGeometry(wingGeo), wingEdge));
    return g;
  });
  // cabezudos en las esquinas
  const cabezudos = [];
  [[-2, 3.4, C.yellow], [2, 3.4, C.red], [-2, -3.4, '#f4f1ea'], [2, -3.4, C.blue]].forEach(([x, z, col], k) => {
    const g = new THREE.Group(); g.position.set(x, 0.9, z); fl.add(g);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.3, 10), new THREE.MeshStandardMaterial({ color: k % 2 ? '#1f5fa8' : '#8a1e14' })); b.position.y = 0.65; g.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })); h.position.y = 1.9; g.add(h);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#141312' })); hat.position.y = 2.85; g.add(hat);
    cabezudos.push(g);
  });
  // nube de talco
  const TALC = low ? 80 : 220;
  const talcPos = new Float32Array(TALC * 3), talcSeed = new Float32Array(TALC);
  for (let i = 0; i < TALC; i++) { talcSeed[i] = r(); talcPos[i * 3 + 1] = r() * 9; }
  const talcGeo = new THREE.BufferGeometry(); talcGeo.setAttribute('position', new THREE.BufferAttribute(talcPos, 3));
  const talc = new THREE.Points(talcGeo, new THREE.PointsMaterial({ map: dot, color: '#fffaf0', size: 0.22, transparent: true, opacity: 0.32, depthWrite: false }));
  world.add(talc);
  const floatLight = new THREE.SpotLight('#ffe2b8', 42, 34, 0.5, 0.85, 1.4); floatLight.position.set(4, 14, 11); const flT = new THREE.Object3D(); flT.position.set(0, 6.5, 0); fl.add(flT); floatLight.target = flT; fl.add(floatLight); extraLights.push([floatLight, 42]);

  /* ================= la plaza viva: árboles, faroles, bancas, personas ================= */
  const P = L.plaza;
  const treeSpots = [[-82, -19], [-82, 19], [-118, 19], [-118, -19], [-90, -20], [-110, 20], [-88, 20], [-120, 8], [-120, -8], [-84, -10]];
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 1, 8).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#3b2c1f' }), treeSpots.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#2f4a2a', roughness: 0.9, flatShading: true, emissive: '#0d1a0c', emissiveIntensity: 0.6 }), treeSpots.length);
  treeSpots.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 3.4, 1); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 4.6, z); dummy.scale.set(2.2, 2.5, 2.2); dummy.rotation.y = r() * 3; dummy.updateMatrix(); crowns.setMatrixAt(i, dummy.matrix);
    lay.colliders.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4 });
  });
  world.add(trunks, crowns);
  const lampSpots = [];
  for (let x = P.x0 - 4; x > P.x1 + 2; x -= 8) { lampSpots.push([x, P.z0 + 1.5], [x, P.z1 - 1.5]); }
  for (let z = P.z0 + 8; z < P.z1 - 4; z += 8) { if (Math.abs(z) > 5) lampSpots.push([P.x0 - 1.5, z], [P.x1 + 1.5, z]); }
  const lampPosts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8).translate(0, 2.1, 0), metal, lampSpots.length);
  const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf8a').multiplyScalar(3) }), lampSpots.length);
  lampSpots.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lampPosts.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 4.35, z); dummy.updateMatrix(); lamps.setMatrixAt(i, dummy.matrix);
  });
  world.add(lampPosts, lamps);
  const benchSpots = [[-92, 8, 0], [-108, 8, 0], [-92, -4, 0], [-104, 12, 1], [-86, 12, 1], [-114, 2, 1]];
  const benches = new THREE.InstancedMesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#4a2b18', roughness: 0.8 }), benchSpots.length);
  benchSpots.forEach(([x, z, rot], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, rot * Math.PI / 2, 0); dummy.scale.set(2.2, 0.48, 0.6); dummy.updateMatrix(); benches.setMatrixAt(i, dummy.matrix); });
  world.add(benches);
  // carrito de helado de paila
  const cart = new THREE.Group(); cart.position.set(-88, 0, 15); world.add(cart);
  const cartBox = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.5 })); cartBox.scale.set(1.6, 1, 0.9); cartBox.position.y = 0.4; cart.add(cartBox);
  const paila = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.3, 16), new THREE.MeshStandardMaterial({ color: '#b87333', metalness: 0.8, roughness: 0.3 })); paila.position.set(0.2, 1.55, 0); cart.add(paila);
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8), new THREE.MeshStandardMaterial({ color: C.red, side: THREE.DoubleSide })); umbrella.position.y = 2.6; cart.add(umbrella);
  const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), metal); uPole.position.y = 1.4; cart.add(uPole);
  lay.colliders.push({ minX: -89, maxX: -87, minZ: 14.4, maxZ: 15.6 });
  // holograma del Carnaval 2037
  const [bc, bctx] = canvas(1024, 256);
  bctx.fillStyle = 'rgba(0,0,0,0)'; bctx.fillRect(0, 0, 1024, 256);
  bctx.font = '400 92px Bungee'; bctx.textAlign = 'center'; bctx.textBaseline = 'middle'; bctx.fillStyle = '#ffd36a'; bctx.fillText('CARNAVAL 2037', 512, 96);
  bctx.font = '900 54px Doto'; bctx.fillStyle = '#7fe9f5'; bctx.fillText('NEGROS Y BLANCOS · 2 AL 7 DE ENERO', 512, 190);
  const billTex = new THREE.CanvasTexture(bc); billTex.colorSpace = THREE.SRGBColorSpace;
  const billboard = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: billTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  billboard.position.set(-101, 15, 22); billboard.rotation.y = Math.PI; world.add(billboard);
  // la vendedora de la Calle Real (Doña Rosario) con su mesa
  const stand = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#4a3a2a' })); stand.scale.set(1.6, 0.9, 0.8); stand.position.set(-42.6, 0, -3.15); world.add(stand);
  lay.colliders.push({ minX: -43.4, maxX: -41.8, minZ: -3.6, maxZ: -2.7 });

  // personas: ruanas de colores, sombreros, máscaras de ceniza
  const NPC = low ? 24 : 64;
  const npcs = [];
  const spots = [];
  for (let i = 0; i < NPC; i++) {
    const zone = i % 3;
    if (zone === 0) spots.push({ x: 10 - r() * 46, z: (r() > 0.5 ? 1 : -1) * (0.8 + r() * 1.6), walk: r() > 0.4, ax: 'x' });
    else if (zone === 1) spots.push({ x: -80 - r() * 40, z: -20 + r() * 40, walk: r() > 0.35, ax: 'c' });
    else spots.push({ x: -40 - r() * 34, z: (r() > 0.5 ? 1 : -1) * (0.6 + r() * 2.4), walk: r() > 0.5, ax: 'x' });
  }
  spots.push({ x: -42.6, z: -2.3, walk: false, ax: 'x', rosario: true });
  spots.push({ x: -122.7, z: 13.4, walk: false, ax: 'x', rosario: true, asador: true });
  const npcBody = new THREE.InstancedMesh(new THREE.ConeGeometry(0.34, 1.25, 10).translate(0, 0.62, 0), new THREE.MeshStandardMaterial({ roughness: 0.85 }), spots.length);
  const npcHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshStandardMaterial({ color: '#8a5a3c', roughness: 0.7 }), spots.length);
  const npcHat = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), new THREE.MeshStandardMaterial({ color: '#2a2622' }), spots.length);
  const npcLegs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.5, 0.18).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ color: '#1a1816' }), spots.length);
  const ruanaCols = ['#8a1e14', '#1f5fa8', '#3a2416', '#f2c230', '#2e8b57', '#6a2a6a', '#b9480b', '#d8d0bf'];
  spots.forEach((s, i) => { npcBody.setColorAt(i, new THREE.Color(s.asador ? '#ece5d6' : s.rosario ? C.red : ruanaCols[Math.floor(r() * ruanaCols.length)])); npcs.push({ ...s, ph: r() * 6.28, sp: 0.4 + r() * 0.6, rad: 3 + r() * 5, h: 0.92 + r() * 0.16 }); });
  npcBody.instanceColor.needsUpdate = true;
  world.add(npcBody, npcHead, npcHat, npcLegs);

  /* ================= lo que vuela: chivas, cóndor, drones de carga ================= */
  const [cc, cctx] = canvas(512, 256);
  const bands = [C.red, C.yellow, '#1f5fa8', '#2e8b57', C.orange];
  bands.forEach((col, k) => { cctx.fillStyle = col; cctx.fillRect(0, k * 52, 512, 52); });
  cctx.fillStyle = '#f4f1ea';
  for (let x = 10; x < 512; x += 46) { cctx.beginPath(); cctx.moveTo(x, 104); cctx.lineTo(x + 18, 86); cctx.lineTo(x + 36, 104); cctx.lineTo(x + 18, 122); cctx.closePath(); cctx.fill(); }
  cctx.fillStyle = '#141312'; for (let x = 30; x < 512; x += 64) cctx.fillRect(x, 150, 40, 42);
  const chivaTex = new THREE.CanvasTexture(cc); chivaTex.colorSpace = THREE.SRGBColorSpace;
  const chivaMat = new THREE.MeshStandardMaterial({ map: chivaTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: chivaTex, emissiveIntensity: 0.25 });
  fadeMats.push([chivaMat, 'emissiveIntensity', 0.25]);
  const chivaRoute = new THREE.CatmullRomCurve3([v3(30, 22, 0), v3(-10, 19, 10), v3(-50, 20, -6), v3(-90, 24, -22), v3(-130, 22, 6), v3(-100, 26, 28), v3(-50, 23, 14), v3(-5, 21, -12)], true);
  const chivas = [0, 0.5].map((off, k) => {
    const g = new THREE.Group(); world.add(g);
    const body = new THREE.Mesh(boxGeo, chivaMat); body.scale.set(2.6, 2, 6.4); g.add(body);
    const roof = new THREE.Mesh(boxGeo, metal); roof.scale.set(2.8, 0.15, 6.6); roof.position.y = 2.05; g.add(roof);
    for (let q = 0; q < 4; q++) { const bx = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: ['#7a5a3a', C.blue, C.orange, '#2e8b57'][(q + k) % 4] })); bx.scale.set(0.8, 0.6, 0.9); bx.position.set((q % 2 - 0.5) * 1.1, 2.15, (q - 1.5) * 1.3); g.add(bx); }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 6), additive(C.cyan, 0.5, { side: THREE.DoubleSide })); glow.rotation.x = Math.PI / 2; glow.position.y = -0.1; g.add(glow);
    for (const [x, z] of [[-1, -2.4], [1, -2.4], [-1, 2.4], [1, 2.4]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(3) })); t.position.set(x, -0.15, z); g.add(t); }
    return { g, off, speed: 0.012 + k * 0.004 };
  });
  // cóndor mecánico sobre la plaza
  const condor = new THREE.Group(); world.add(condor);
  const cBody = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: '#141416', metalness: 0.5, roughness: 0.4 })); cBody.scale.set(0.9, 0.7, 2.4); condor.add(cBody);
  const ruff = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.22, 8, 20), new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.6 })); ruff.position.z = 1.9; condor.add(ruff);
  const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshStandardMaterial({ color: '#3a2a2a' })); cHead.position.z = 2.5; condor.add(cHead);
  const cEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(3) })); cEye.position.set(0, 0.12, 2.85); condor.add(cEye);
  const featherShape = new THREE.Shape(); featherShape.moveTo(0, 0.8); featherShape.lineTo(7.5, 1.2); featherShape.lineTo(9.2, 0.2); featherShape.lineTo(8.4, -0.3); featherShape.lineTo(9.4, -0.8); featherShape.lineTo(8.2, -1.1); featherShape.lineTo(8.8, -1.6); featherShape.lineTo(7, -1.6); featherShape.lineTo(0, -0.8); featherShape.closePath();
  const fGeo = new THREE.ShapeGeometry(featherShape);
  const condorWings = [-1, 1].map(s => {
    const w = new THREE.Group(); w.scale.set(s, 1, 1); condor.add(w);
    const m = new THREE.Mesh(fGeo, new THREE.MeshStandardMaterial({ color: '#1a1a1d', metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; w.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(fGeo), new THREE.LineBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(2.2) })); e.rotation.x = -Math.PI / 2; e.position.y = 0.02; w.add(e);
    return w;
  });
  condor.scale.setScalar(1.3);


  /* ================= pista 1: talco escondido junto a la mesa del puesto ================= */
  const talcStash = new THREE.Group(); talcStash.position.set(-21, 0, 3.0); talcStash.rotation.y = 0.25; world.add(talcStash);
  const crate = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#6b4a2a', roughness: 0.85 })); crate.scale.set(0.7, 0.36, 0.5); talcStash.add(crate);
  const bagMat = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.95, emissive: '#ffffff', emissiveIntensity: 0.12 });
  for (const [x, y, z, k] of [[-0.18, 0.44, 0, 1], [0.15, 0.44, 0.05, 0.9], [0, 0.6, -0.02, 0.8], [0.45, 0.1, 0.25, 0.85], [-0.5, 0.1, 0.2, 0.75]]) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), bagMat); bag.scale.set(0.17 * k, 0.12 * k, 0.21 * k); bag.position.set(x, y, z); talcStash.add(bag);
  }
  const powder = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: '#f6f2e8', transparent: true, opacity: 0.55, depthWrite: false }));
  powder.rotation.x = -Math.PI / 2; powder.position.set(0.25, 0.02, 0.15); talcStash.add(powder);
  bake(talcStash);

  /* ================= cuyes voladores: el animal de Nariño, aumentado ================= */
  const [fc, fctx] = canvas(512, 256); const fr = mulberry32(23);
  fctx.fillStyle = '#c47a3c'; fctx.fillRect(0, 0, 512, 256);
  const furBlob = (col, n, s0, s1) => { fctx.fillStyle = col; for (let i = 0; i < n; i++) { const x = fr() * 512, y = 30 + fr() * 196, sz = s0 + fr() * (s1 - s0); fctx.beginPath(); fctx.ellipse(x, y, sz, sz * 0.7, fr() * 3, 0, 7); fctx.fill(); } };
  furBlob('#f2e8d6', 7, 34, 70); furBlob('#3d2618', 5, 26, 54);
  for (let i = 0; i < 2200; i++) { const x = fr() * 512, y = fr() * 256; fctx.strokeStyle = fr() > 0.5 ? 'rgba(255,240,220,.16)' : 'rgba(40,24,14,.2)'; fctx.beginPath(); fctx.moveTo(x, y); fctx.lineTo(x + (fr() - 0.5) * 5, y + 4 + fr() * 6); fctx.stroke(); }
  const furTex = new THREE.CanvasTexture(fc); furTex.colorSpace = THREE.SRGBColorSpace;
  const furMat = new THREE.MeshStandardMaterial({ map: furTex, roughness: 0.95, emissive: '#ffffff', emissiveMap: furTex, emissiveIntensity: 0.16 });
  fadeMats.push([furMat, 'emissiveIntensity', 0.16]);
  const pinkMat = new THREE.MeshStandardMaterial({ color: '#e4a593', roughness: 0.7, emissive: '#5a2a22', emissiveIntensity: 0.3 });
  const cuyEyeMat = new THREE.MeshStandardMaterial({ color: '#0b0a0a', roughness: 0.12, metalness: 0.4 });
  const cuyCyber = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.cyan).multiplyScalar(2) });
  const cuyLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(1.8) });
  const sphHi = new THREE.SphereGeometry(1, 28, 18), sphLo = new THREE.SphereGeometry(1, 10, 8);
  const podGeo = new THREE.CylinderGeometry(0.22, 0.3, 0.3, 12), jetGeo = new THREE.CircleGeometry(0.46, 20);
  const beltGeo = new THREE.TorusGeometry(1, 0.06, 6, 44), stripGeo = new THREE.TorusGeometry(1, 0.03, 4, 44);
  const [kc, kctx] = canvas(512, 128);
  kctx.fillStyle = '#0d0c0b'; kctx.fillRect(0, 0, 512, 128);
  kctx.font = '400 46px Bungee'; kctx.textAlign = 'center'; kctx.textBaseline = 'middle'; kctx.fillStyle = '#ffb23f'; kctx.fillText('CUY EXPRESS', 256, 46);
  kctx.font = '900 30px Doto'; kctx.fillStyle = '#7fe9f5'; kctx.fillText('ENVÍOS A TODO NARIÑO', 256, 98);
  const cuyAdTex = new THREE.CanvasTexture(kc); cuyAdTex.colorSpace = THREE.SRGBColorSpace;
  const cuyAdMat = new THREE.MeshBasicMaterial({ map: cuyAdTex, side: THREE.DoubleSide });
  const ruanaMat = new THREE.MeshStandardMaterial({ map: chumbe, roughness: 0.8, emissive: '#ffffff', emissiveMap: chumbe, emissiveIntensity: 0.22, side: THREE.DoubleSide });
  const parcelMat = new THREE.MeshStandardMaterial({ color: '#b9480b', roughness: 0.7 });
  // el cuy mira hacia +Z (sirve con lookAt)
  function makeCuy(big) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(sphHi, furMat); body.scale.set(1.05, 0.84, 1.5); g.add(body);
    const head = new THREE.Mesh(sphHi, furMat); head.scale.set(0.74, 0.68, 0.8); head.position.set(0, 0.2, 1.42); g.add(head);
    const nose = new THREE.Mesh(sphLo, pinkMat); nose.scale.set(0.2, 0.15, 0.12); nose.position.set(0, 0.1, 2.17); g.add(nose);
    for (const sd of [-1, 1]) {
      const ear = new THREE.Mesh(sphLo, pinkMat); ear.scale.set(0.26, 0.22, 0.07); ear.position.set(sd * 0.5, 0.74, 1.2); ear.rotation.set(0.3, sd * 0.7, sd * 0.5); g.add(ear);
      const eye = new THREE.Mesh(sphLo, sd > 0 ? cuyCyber : cuyEyeMat); eye.scale.setScalar(0.13); eye.position.set(sd * 0.47, 0.4, 1.84); g.add(eye);
      for (const zf of [0.85, -0.85]) { const foot = new THREE.Mesh(sphLo, pinkMat); foot.scale.set(0.18, 0.12, 0.26); foot.position.set(sd * 0.55, -0.76, zf); g.add(foot); }
    }
    const belt = new THREE.Mesh(beltGeo, metal); belt.scale.set(1.09, 0.88, 1); g.add(belt);
    const strip = new THREE.Mesh(stripGeo, cuyLed); strip.scale.set(1.12, 0.9, 1); strip.position.z = 0.12; g.add(strip);
    const jetMat = additive(C.cyan, 0.55, { side: THREE.DoubleSide });
    for (const [x, z] of [[-0.9, 0.7], [0.9, 0.7], [-0.9, -0.8], [0.9, -0.8]]) {
      const pod = new THREE.Mesh(podGeo, metal); pod.position.set(x, -0.66, z); g.add(pod);
      const jet = new THREE.Mesh(jetGeo, jetMat); jet.rotation.x = Math.PI / 2; jet.position.set(x, -0.84, z); g.add(jet);
    }
    if (big) {
      // globo de carnaval: ruana tejida sobre el lomo y pantallas de anuncio a los lados
      const ruana = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, 1.3), ruanaMat);
      ruana.scale.set(1.09, 0.9, 1.22); ruana.position.z = -0.2; g.add(ruana);
      for (const sd of [-1, 1]) { const ad = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.48), cuyAdMat); ad.position.set(sd * 1.17, -0.2, -0.15); ad.rotation.y = sd * Math.PI / 2; g.add(ad); }
    } else {
      const parcel = new THREE.Mesh(boxGeo, parcelMat); parcel.scale.set(0.7, 0.5, 0.7); parcel.position.y = -1.6; g.add(parcel);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), metal); cable.position.y = -1.0; g.add(cable);
    }
    return { g: bake(g), jetMat };
  }
  // dos cuyes gigantes de carnaval: uno cruza la ciudad, otro ronda el mercado
  const bigCuyes = (low ? [0] : [0, 1]).map(k => { const c = makeCuy(true); c.g.scale.setScalar(k ? 4.2 : 5.2); world.add(c.g); return { ...c, k }; });
  // cuyes mensajeros con paquetes
  // (instanciados: todos los mensajeros se dibujan con unas pocas llamadas)
  const SC = low ? 4 : 9, smallCuyes = [], cuyTpl = makeCuy(false);
  const cuyIMs = cuyTpl.g.children.map(m => { const im = new THREE.InstancedMesh(m.geometry, m.material, SC); im.frustumCulled = false; world.add(im); return im; });
  for (let k = 0; k < SC; k++) smallCuyes.push({ cx: lerp(6, -120, k / SC) + r() * 6, cz: (r() - 0.5) * 10, rad: 5 + r() * 8, h: 11 + r() * 5, sp: 0.22 + r() * 0.22, ph: r() * 6.3, dir: r() > 0.5 ? 1 : -1 });
  // el cuy mensajero del mercado, esperando su envío (se puede examinar)
  const perch = makeCuy(false); perch.g.scale.setScalar(0.6); perch.g.position.set(-6.5, 2.5, -2.1); perch.g.rotation.y = Math.PI / 2 + 0.35; world.add(perch.g);
  const perchSign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), cuyAdMat); perchSign.position.set(-7.2, 3.75, -2.5); perchSign.rotation.y = Math.PI / 2; world.add(perchSign);

  /* ================= guirnaldas de bombillos: calle, mercado y plaza ================= */
  const festoon = [], wire = [];
  const string = (a, b, n, drop) => {
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * drop;
      if (prev) wire.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
      if (i > 0 && i < n) festoon.push(p);
      prev = p;
    }
  };
  for (let x = 8; x > -36; x -= 5.5) string(v3(x, 5.4, -3.2), v3(x - 1.6, 5.4, 3.2), 9, 0.55);
  for (let x = -40; x > -75; x -= 5) { if (Math.abs(x - L.scanner.x) < 2.5) continue; string(v3(x, 6.3, -3.5), v3(x - 2, 6.3, 3.5), 10, 0.6); }
  for (const [x, z] of [[-78, 21], [-92, 23], [-108, 23], [-122, 21], [-100, 24], [-78, -21], [-90, -23], [-77, -6]]) string(v3(L.statue.x, 10.5, L.statue.z), v3(x, 4.8, z), 16, 1.3);
  const wireGeo = new THREE.BufferGeometry(); wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  world.add(new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: '#1a1714' })));
  const bulbIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }), festoon.length);
  const bulbCols = ['#ffcf8a', '#ffcf8a', C.orange, '#ff5a7a', C.cyan, '#a6ff7a', C.yellow].map(c => new THREE.Color(c).multiplyScalar(1.7));
  festoon.forEach((p, i) => { dummy.position.copy(p); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); bulbIM.setMatrixAt(i, dummy.matrix); bulbIM.setColorAt(i, p.x < -76 ? bulbCols[i % bulbCols.length] : bulbCols[i % 3]); });
  bulbIM.instanceColor.needsUpdate = true; world.add(bulbIM);

  /* ================= neones verticales con palabras de Nariño ================= */
  const neonMat = (word, col) => {
    const [nc, nctx] = canvas(128, 512);
    nctx.fillStyle = 'rgba(12,11,10,.92)'; nctx.fillRect(0, 0, 128, 512);
    nctx.strokeStyle = col; nctx.lineWidth = 6; nctx.shadowColor = col; nctx.shadowBlur = 18; nctx.strokeRect(9, 9, 110, 494);
    const chars = [...word], step = Math.min(78, 470 / chars.length);
    nctx.font = `400 ${Math.round(step * 0.8)}px Bungee`; nctx.textAlign = 'center'; nctx.textBaseline = 'middle'; nctx.fillStyle = '#fff6e6';
    chars.forEach((ch, i) => nctx.fillText(ch, 64, 256 + (i - (chars.length - 1) / 2) * step));
    nctx.globalCompositeOperation = 'source-atop'; nctx.fillStyle = col; nctx.globalAlpha = 0.55; nctx.fillRect(0, 0, 128, 512);
    const tx = new THREE.CanvasTexture(nc); tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(1.25, 1.25, 1.25), side: THREE.DoubleSide });
  };
  const NEON = [[4, -1, 'CUY', '#ff5a7a'], [-7, 1, 'PASTO', C.cyan], [-15, -1, 'PAILA', '#ffb23f'], [-29, 1, 'NARIÑO', '#a6ff7a'], [-34, -1, 'CHIVA', '#ff5a7a'],
    [-46, 1, 'BARNIZ', '#ff7a3a'], [-65, -1, 'GALERAS', C.cyan], [-71, 1, 'SANDONÁ', '#ffd36a']];
  for (const [x, side, word, col] of NEON) {
    const street = x < L.market.x1, zf = street ? L.street.half - 0.75 : 7.2, y = street ? 6.4 : 7.4, h = street ? 2.8 : 3.6;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h / 4 * 1.05, h), neonMat(word, col));
    m.position.set(x, y, side * zf); m.rotation.y = Math.PI / 2; world.add(m);
    const arm = new THREE.Mesh(boxGeo, metal); arm.scale.set(0.08, 0.08, 0.9); arm.position.set(x, y + h / 2 - 0.1, side * (zf + 0.45)); world.add(arm);
  }

  /* ================= asadero de cuy en la Plaza de Nariño ================= */
  const asa = new THREE.Group(); asa.position.set(-121.4, 0, 13); world.add(asa);
  const grill = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#2f2a26', metalness: 0.6, roughness: 0.5 })); grill.scale.set(1, 0.85, 2.4); asa.add(grill);
  const coals = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5a1e').multiplyScalar(1.5) })); coals.rotation.x = -Math.PI / 2; coals.position.y = 0.87; asa.add(coals);
  const skewer = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.7, 5), metal); skewer.rotation.x = Math.PI / 2; skewer.position.y = 1.18; asa.add(skewer);
  const roastMat = new THREE.MeshStandardMaterial({ color: '#8a3f17', roughness: 0.4, emissive: '#6a2008', emissiveIntensity: 0.45 });
  for (const z of [-0.75, 0, 0.75]) { const rc = new THREE.Mesh(sphLo, roastMat); rc.scale.set(0.15, 0.13, 0.32); rc.position.set(0, 1.18, z); asa.add(rc); }
  const canopy = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.8, side: THREE.DoubleSide })); canopy.scale.set(2.4, 0.08, 3.2); canopy.position.y = 2.45; asa.add(canopy);
  for (const [x, z] of [[-1.1, -1.5], [1.1, -1.5], [-1.1, 1.5], [1.1, 1.5]]) { const p = new THREE.Mesh(boxGeo, metal); p.scale.set(0.07, 2.45, 0.07); p.position.set(x, 0, z); asa.add(p); }
  const [ac, actx] = canvas(512, 128);
  actx.fillStyle = '#f2c230'; actx.fillRect(0, 0, 512, 128); actx.fillStyle = '#141312';
  actx.font = '400 54px Bungee'; actx.textAlign = 'center'; actx.textBaseline = 'middle'; actx.fillText('CUY ASADO', 256, 52);
  actx.font = '700 28px Atkinson'; actx.fillText('DON AURELIO · DESDE 1990', 256, 102);
  const asaTex = new THREE.CanvasTexture(ac); asaTex.colorSpace = THREE.SRGBColorSpace;
  const asaSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshStandardMaterial({ map: asaTex, emissive: '#ffffff', emissiveMap: asaTex, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
  asaSign.position.set(1.25, 2.85, 0); asaSign.rotation.y = Math.PI / 2; asa.add(asaSign);
  const coalLight = new THREE.PointLight('#ff7a2a', 14, 9, 1.6); coalLight.position.set(-121.4, 1.6, 13); world.add(coalLight); extraLights.push([coalLight, 14]);
  const smoke = [];
  for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#9a918a', transparent: true, depthWrite: false, opacity: 0 })); world.add(sp); smoke.push({ sp, t: i / 7 }); }
  lay.colliders.push({ minX: -122.6, maxX: -120.2, minZ: 11.5, maxZ: 14.5 });
  bake(asa);
  // kioscos de artesanos alrededor de la plaza: lo de siempre, con luz de 2037
  const kioskSign = (title, sub, bg, fg) => {
    const [kc2, k2] = canvas(512, 128);
    k2.fillStyle = bg; k2.fillRect(0, 0, 512, 128); k2.fillStyle = fg; k2.textAlign = 'center'; k2.textBaseline = 'middle';
    k2.font = '400 46px Bungee'; k2.fillText(title, 256, 50); k2.font = '700 26px Atkinson'; k2.fillText(sub, 256, 100);
    const tx = new THREE.CanvasTexture(kc2); tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: tx, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.45, side: THREE.DoubleSide });
  };
  const goodsCols = [C.red, C.yellow, '#1f5fa8', '#2e8b57', C.orange, '#f4f1ea', '#6a2a6a'];
  const KIOSKS = [
    [-95, 19.6, Math.PI, '#1f5fa8', 'BARNIZ', 'MOPA-MOPA · SIGLO XVI', '#f2c230', '#141312'],
    [-103.5, 19.6, Math.PI, '#2e8b57', 'RUANAS', 'LANA DE PÁRAMO', '#ede8dc', '#141312'],
    [-79.2, -15, -Math.PI / 2, '#8a1e14', 'MÁSCARAS', 'LEGALES · SIN REGISTRO', '#141312', '#ffb23f'],
  ];
  for (const [kx, kz, rot, col, title, sub, bg, fg] of KIOSKS) {
    const k = new THREE.Group(); k.position.set(kx, 0, kz); k.rotation.y = rot; world.add(k);
    const counter = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: '#4a2b18', roughness: 0.8 })); counter.scale.set(2.6, 0.95, 0.9); k.add(counter);
    for (let q = 0; q < 5; q++) { const g = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: goodsCols[(q * 3 + kx | 0) % goodsCols.length], roughness: 0.6 })); g.scale.set(0.34, 0.22 + (q % 2) * 0.16, 0.3); g.position.set(-1 + q * 0.5, 0.95, 0); k.add(g); }
    const roof = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, side: THREE.DoubleSide })); roof.scale.set(3, 0.08, 1.9); roof.position.set(0, 2.5, -0.35); k.add(roof);
    for (const px of [-1.4, 1.4]) { const p = new THREE.Mesh(boxGeo, metal); p.scale.set(0.07, 2.5, 0.07); p.position.set(px, 0, -1.2); k.add(p); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), kioskSign(title, sub, bg, fg)); sign.position.set(0, 2.95, 0.55); k.add(sign);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(1.6) })); strip.position.set(0, 2.44, 0.6); k.add(strip);
    bake(k);
    const hw = Math.abs(Math.sin(rot)) > 0.5 ? [0.6, 1.45] : [1.45, 0.6];
    lay.colliders.push({ minX: kx - hw[0], maxX: kx + hw[0], minZ: kz - hw[1], maxZ: kz + hw[1] });
  }


  /* ================= capa de información: placas de Pasto real ================= */
  const plaqueMat = d => {
    const [pc, px] = canvas(512, 320);
    px.fillStyle = 'rgba(8,20,24,.92)'; px.fillRect(0, 0, 512, 320);
    px.strokeStyle = '#46d6e6'; px.lineWidth = 8; px.strokeRect(6, 6, 500, 308);
    px.fillStyle = '#46d6e6'; px.fillRect(28, 30, 54, 54); px.fillStyle = '#081418'; px.font = '400 44px Bungee'; px.textAlign = 'center'; px.textBaseline = 'middle'; px.fillText('i', 55, 60);
    px.textAlign = 'left'; px.font = '900 30px Doto'; px.fillStyle = '#7fe9f5'; px.fillText('PASTO REAL', 100, 60);
    px.font = '400 40px Bungee'; px.fillStyle = '#fff6e6';
    const words = d.short.split(' '); let line = '', y = 150;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (px.measureText(t).width > 450 && line) { px.fillText(line, 30, y); line = w; y += 54; } else line = t; }
    px.fillText(line, 30, y);
    px.font = '700 24px Atkinson'; px.fillStyle = '#9fdfe8'; px.fillText('Acércate y pulsa E para leer', 30, 280);
    const tx = new THREE.CanvasTexture(pc); tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(1.1, 1.1, 1.1), side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
  };
  const plaques = [];
  for (const d of DATOS) {
    const [fx, fy, fz] = d.focus, g = new THREE.Group(); g.position.set(fx, 0, fz); world.add(g);
    g.rotation.y = Math.atan2(d.x - fx, d.z - fz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, fy - 0.45, 8).translate(0, (fy - 0.45) / 2, 0), metal); g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.12, 16), metal); base.position.y = 0.06; g.add(base);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32), additive(C.cyan, 0.5, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; g.add(ring);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), plaqueMat(d)); panel.position.y = fy; g.add(panel);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.12), additive(C.cyan, 0.12, { side: THREE.DoubleSide })); halo.position.set(0, fy, -0.02); g.add(halo);
    plaques.push({ g, panel, ring, id: d.id, y: fy });
    lay.colliders.push({ minX: fx - 0.25, maxX: fx + 0.25, minZ: fz - 0.25, maxZ: fz + 0.25 });
  }

  /* ================= observatorio del Galeras en la avenida ================= */
  const obs = new THREE.Group(); obs.position.set(-164, 0, -11); world.add(obs);
  const obsWall = new THREE.MeshStandardMaterial({ color: '#cfc8ba', roughness: 0.85 });
  const obsBase = new THREE.Mesh(boxGeo, obsWall); obsBase.scale.set(6, 3.2, 4.4); obs.add(obsBase);
  const obsDome = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#b9bdc2', metalness: 0.7, roughness: 0.35 })); obsDome.position.set(-1, 3.2, 0); obs.add(obsDome);
  const obsSlit = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange).multiplyScalar(1.4) })); obsSlit.scale.set(0.35, 1.7, 0.05); obsSlit.position.set(-1, 3.4, 1.86); obs.add(obsSlit);
  const obsMast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6, 6).translate(0, 3, 0), metal); obsMast.position.set(2.2, 3.2, -1.2); obs.add(obsMast);
  const obsDish = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, 1.1), new THREE.MeshStandardMaterial({ color: '#e7e2d6', metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide })); obsDish.position.set(2.2, 7.4, -1.2); obsDish.rotation.set(-1.1, 0, 0.4); obs.add(obsDish);
  const obsBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3a2a').multiplyScalar(2.5) })); obsBeacon.position.set(2.2, 9.3, -1.2); obs.add(obsBeacon);
  const [seisC, seisX] = canvas(512, 256);
  seisX.fillStyle = '#071012'; seisX.fillRect(0, 0, 512, 256);
  seisX.font = '900 21px Doto'; seisX.fillStyle = '#7fe9f5'; seisX.fillText('OBSERVATORIO VULCANOLÓGICO · PASTO', 16, 32);
  seisX.strokeStyle = '#ff6a3a'; seisX.lineWidth = 3; seisX.beginPath();
  for (let x = 0; x < 512; x += 4) { const a = x > 300 && x < 380 ? 60 : 10; const y = 150 + Math.sin(x * 0.9) * a * (0.4 + (x * 7 % 13) / 13); if (x) seisX.lineTo(x, y); else seisX.moveTo(x, y); }
  seisX.stroke(); seisX.font = '400 30px Bungee'; seisX.fillStyle = '#f2c230'; seisX.fillText('ALERTA AMARILLA', 18, 234);
  const seisTex = new THREE.CanvasTexture(seisC); seisTex.colorSpace = THREE.SRGBColorSpace; seisTex.wrapS = THREE.RepeatWrapping;
  const seisScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshBasicMaterial({ map: seisTex, color: new THREE.Color(1.15, 1.15, 1.15) }));
  seisScreen.position.set(0.6, 1.7, 2.23); obs.add(seisScreen);
  bake(obs);
  const obsLight = new THREE.PointLight('#9fe8ff', 10, 10, 1.6); obsLight.position.set(-163.4, 2.4, -7.6); world.add(obsLight); extraLights.push([obsLight, 10]);

  /* ================= salida: la puerta del páramo ================= */
  const gate = new THREE.Group(); gate.position.set(L.gate.x, 0, 0); world.add(gate);
  const gateStone = new THREE.MeshStandardMaterial({ color: '#3a3631', roughness: 0.9 });
  for (const z of [-5.2, 5.2]) {
    const p = new THREE.Mesh(boxGeo, gateStone); p.scale.set(1.4, 8, 1.4); p.position.z = z; gate.add(p);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 6.5), bannerMat); b.position.set(0.72, 4, z); b.rotation.y = Math.PI / 2; gate.add(b);
  }
  const lintel = new THREE.Mesh(boxGeo, gateStone); lintel.scale.set(1.4, 1, 12); lintel.position.y = 8; gate.add(lintel);
  const chak = new THREE.Mesh(new THREE.ExtrudeGeometry(chakanaShape, { depth: 0.5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#1a1714', emissive: C.orange, emissiveIntensity: 1.6 }));
  chak.scale.setScalar(1.15); chak.rotation.y = Math.PI / 2; chak.position.set(0, 12.6, 0); gate.add(chak);
  const portalGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 7.4), additive('#ff8a3a', 0.16, { side: THREE.DoubleSide })); portalGlow.rotation.y = Math.PI / 2; portalGlow.position.y = 3.8; gate.add(portalGlow);
  const curtainTex = scanTexture(); curtainTex.repeat.set(1, 3);
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 7.6), additive('#ff4a3a', 0.45, { side: THREE.DoubleSide, map: curtainTex })); curtain.rotation.y = Math.PI / 2; curtain.position.set(0.2, 3.8, 0); gate.add(curtain);
  // cintas de evacuación donde termina el nivel
  const [tc, tctx] = canvas(256, 32); for (let x = -32; x < 256; x += 32) { tctx.fillStyle = '#f2c230'; tctx.fillRect(x, 0, 32, 32); tctx.fillStyle = '#141312'; tctx.beginPath(); tctx.moveTo(x + 16, 0); tctx.lineTo(x + 32, 0); tctx.lineTo(x + 16, 32); tctx.lineTo(x, 32); tctx.closePath(); tctx.fill(); }
  const tapeTex = new THREE.CanvasTexture(tc); tapeTex.colorSpace = THREE.SRGBColorSpace; tapeTex.wrapS = THREE.RepeatWrapping;
  for (const [x, w] of [[29.6, 10], [-180.4, 8]]) {
    for (const y of [0.9, 1.4]) { const tp = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.16), new THREE.MeshBasicMaterial({ map: tapeTex.clone(), side: THREE.DoubleSide })); tp.material.map.repeat.set(w * 1.5, 1); tp.material.map.needsUpdate = true; tp.rotation.y = Math.PI / 2; tp.position.set(x, y, 0); world.add(tp); }
    for (const z of [-w / 2, w / 2]) { const p = new THREE.Mesh(boxGeo, metal); p.scale.set(0.1, 1.6, 0.1); p.position.set(x, 0, z); world.add(p); }
  }
  const gateLight = new THREE.PointLight('#ff9a3c', 40, 26, 1.5); gateLight.position.set(4, 5, 0); gate.add(gateLight);
  // cuando la puerta se abre, una columna de luz la hace visible desde todo el nivel (salida transformada)
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 80, 24, 1, true), additive('#4adf8a', 0, { side: THREE.DoubleSide }));
  pillar.position.set(-3, 40, 0); gate.add(pillar);
  // nube de talco cuando el jugador decide pintarse
  const BURST = 90, burstPos = new Float32Array(BURST * 3), burstVel = [];
  for (let k = 0; k < BURST; k++) { const a = r() * Math.PI * 2, u = r() * 2 - 1, sp = 1.5 + r() * 3; burstVel.push([Math.cos(a) * Math.sqrt(1 - u * u) * sp, Math.abs(u) * sp * 0.8 + 0.8, Math.sin(a) * Math.sqrt(1 - u * u) * sp]); }
  const burstGeo = new THREE.BufferGeometry(); burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  const burstMat = new THREE.PointsMaterial({ map: dot, color: '#ffffff', size: 0.5, transparent: true, opacity: 0, depthWrite: false });
  const burstPts = new THREE.Points(burstGeo, burstMat); burstPts.frustumCulled = false; scene.add(burstPts);
  const burst = { t0: -99, origin: v3(0, 0, 0) };

  // frailejones
  const FN = low ? 50 : 130;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1, 7).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#4a3d2c', roughness: 1 }), FN);
  const rosette = new THREE.InstancedMesh(new THREE.SphereGeometry(0.55, 10, 6), new THREE.MeshStandardMaterial({ color: '#8f9a74', roughness: 0.8, emissive: '#2b3322', emissiveIntensity: 0.4 }), FN);
  for (let k = 0; k < FN; k++) {
    let x, z; do { x = -150 - r() * 70; z = (r() - 0.5) * 80; } while (Math.abs(z) < 4.5);
    const h = 0.8 + r() * 1.8;
    dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, h, 1); dummy.updateMatrix(); trunk.setMatrixAt(k, dummy.matrix);
    dummy.position.set(x, h + 0.2, z); dummy.scale.set(1, 0.65, 1); dummy.updateMatrix(); rosette.setMatrixAt(k, dummy.matrix);
  }
  world.add(trunk, rosette);

  /* ================= el Galeras ================= */
  const volc = new THREE.Group(); volc.position.set(-640, 0, 10); volc.scale.setScalar(1.9); scene.add(volc);
  const vGeo = new THREE.CylinderGeometry(15, 170, 110, 96, 6, true);
  const vp = vGeo.attributes.position;
  for (let i = 0; i < vp.count; i++) {
    const x = vp.getX(i), y = vp.getY(i), z = vp.getZ(i);
    const a = Math.atan2(z, x), hgt = (y + 55) / 110;
    const k = 1 + (Math.sin(a * 7 + 0.6) * 4 + Math.sin(a * 17 + 1.3) * 1.6 + Math.sin(a * 3) * 3) / 60 * (1 - hgt);
    vp.setXYZ(i, x * k, y, z * k);
  }
  vGeo.computeVertexNormals();
  const vMesh = new THREE.Mesh(vGeo, new THREE.MeshStandardMaterial({ color: '#4a3428', roughness: 1, fog: false, side: THREE.DoubleSide }));
  vMesh.position.y = 55; volc.add(vMesh);
  const crater = new THREE.Mesh(new THREE.TorusGeometry(14, 2.2, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lava).multiplyScalar(3.5) }));
  crater.rotation.x = Math.PI / 2; crater.position.y = 110; volc.add(crater);
  const plume = [];
  for (let i = 0; i < (low ? 18 : 40); i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#3a302b', transparent: true, depthWrite: false, opacity: 0.3, fog: false }));
    volc.add(sp); plume.push({ sp, t: i / 40, seed: r() });
  }

  /* ================= drones, ceniza ================= */
  const DN = low ? 10 : 22;
  const drones = [];
  const droneMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), new THREE.MeshStandardMaterial({ color: '#15171a', metalness: 0.6, roughness: 0.4 }), DN);
  const dLightPos = new Float32Array(DN * 3), dLightCol = new Float32Array(DN * 3);
  for (let k = 0; k < DN; k++) drones.push({ cx: lerp(10, -130, k / DN) + r() * 8, cz: (r() - 0.5) * 16, rad: 4 + r() * 9, h: 11 + r() * 9, sp: 0.2 + r() * 0.35, ph: r() * 6.3, red: k % 3 === 0 });
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dLightPos, 3)); dGeo.setAttribute('color', new THREE.BufferAttribute(dLightCol, 3));
  const dLights = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.9, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: '#b9480b', roughness: 0.7 }), DN);
  world.add(droneMesh, dLights, crates);

  const ASH = low ? 900 : 2600;
  const ashPos = new Float32Array(ASH * 3), ashVel = new Float32Array(ASH);
  for (let i = 0; i < ASH; i++) { ashPos[i * 3] = 20 - r() * 80; ashPos[i * 3 + 1] = r() * 18; ashPos[i * 3 + 2] = (r() - 0.5) * 30; ashVel[i] = 0.25 + r() * 0.5; }
  const ashGeo = new THREE.BufferGeometry(); ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
  const ashMat = new THREE.PointsMaterial({ map: dot, color: '#cfc7b8', size: 0.07, transparent: true, opacity: 0.85, depthWrite: false });
  scene.add(new THREE.Points(ashGeo, ashMat));

  /* ================= capa de diseñador ================= */
  const ribbonMat = (color, dash) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, progress: { value: 1 }, time: { value: 0 }, opacity: { value: 0 }, dash: { value: dash } },
    vertexShader: 'attribute float u; attribute float s; varying float vU; varying float vS; void main(){ vU = u; vS = s; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 color; uniform float progress; uniform float time; uniform float opacity; uniform float dash; varying float vU; varying float vS;
      void main(){ if (vU > progress) discard; float edge = 1. - abs(vS*2.-1.); float d = dash > 0. ? step(.45, fract(vU*dash - time*.8)) : 1.;
      float head = smoothstep(progress-.02, progress, vU) * 2.;
      gl_FragColor = vec4(color * (0.55 + 0.45*d + head), opacity * (0.35 + 0.65*edge)); }`,
  });
  function ribbon(pts, width, color, dash, y = 0.08) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => v3(x, y, z)), false, 'centripetal');
    const N = 220, pos = [], us = [], ss = [], idx = [];
    const P = curve.getSpacedPoints(N);
    for (let i = 0; i <= N; i++) {
      const p = P[i], q = P[Math.min(N, i + 1)], o = P[Math.max(0, i - 1)];
      const dx = q.x - o.x, dz = q.z - o.z, len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len;
      pos.push(p.x + nx * width / 2, y, p.z + nz * width / 2, p.x - nx * width / 2, y, p.z - nz * width / 2);
      us.push(i / N, i / N); ss.push(0, 1);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('u', new THREE.Float32BufferAttribute(us, 1)); g.setAttribute('s', new THREE.Float32BufferAttribute(ss, 1)); g.setIndex(idx);
    const m = new THREE.Mesh(g, ribbonMat(color, dash)); m.renderOrder = 5; design.add(m);
    return { mesh: m, curve };
  }
  const critical = ribbon(L.path, 1.7, C.orange, 18);
  const detour = ribbon(L.detour, 0.6, C.yellow, 12);
  const branchA = ribbon(L.branchA, 0.7, '#4f8fe0', 6, 0.1);
  const branchB = ribbon(L.branchB, 0.7, '#ff4a3a', 6, 0.1);
  const ribbons = [critical, detour, branchA, branchB];

  const beacons = [];
  const beacon = (x, z, color, h = 9) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); design.add(g);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, h, 12, 1, true).translate(0, h / 2, 0), additive(color, 0.3, { side: THREE.DoubleSide }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 40), additive(color, 0.8, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1;
    g.add(col, ring); const b = { g, col, ring, base: [0.16, 0.7] }; beacons.push(b); return b;
  };
  beacon(L.acceso.x, L.acceso.z, C.orange, 6);
  const pistaBeacons = L.pistas.map(p => beacon(p.x, p.z, '#ff4a3a', 7));
  beacon(L.presion.x, L.presion.z, C.yellow, 8);
  beacon(L.decision.x, L.decision.z, '#4f8fe0', 8);
  beacon(L.salida.x, L.salida.z, C.green, 12);
  // cono de visión del panóptico
  const sight = new THREE.Mesh(new THREE.ConeGeometry(22, 34, 32, 1, true).translate(0, -17, 0), additive('#46d6e6', 0.0, { side: THREE.DoubleSide }));
  sight.position.set(cat.x - (cat.w / 2 - 2.6), 24, cat.z + front - 2.6);
  sight.lookAt(L.statue.x, 0, L.statue.z + 6); sight.rotateX(-Math.PI / 2);
  design.add(sight);
  // anillos de zona
  const zoneRing = (x, z, w, d, color) => {
    const pts = [v3(x - w / 2, 0.06, z - d / 2), v3(x + w / 2, 0.06, z - d / 2), v3(x + w / 2, 0.06, z + d / 2), v3(x - w / 2, 0.06, z + d / 2), v3(x - w / 2, 0.06, z - d / 2)];
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0 }));
    l.computeLineDistances(); design.add(l); return l;
  };
  const zones = [
    zoneRing((L.market.x0 + L.market.x1) / 2, 0, L.market.x0 - L.market.x1, 14, '#f26b1d'),
    zoneRing((L.street.x0 + L.street.x1) / 2, 0, L.street.x0 - L.street.x1, L.street.half * 2, '#f2c230'),
    zoneRing((L.plaza.x0 + L.plaza.x1) / 2, 0, L.plaza.x0 - L.plaza.x1, L.plaza.z1 - L.plaza.z0, '#46d6e6'),
    zoneRing(-190, 0, 60, 40, '#2e8b57'),
  ];

  /* ================= el plano de papel + playtest ================= */
  const mapCv = mapCanvas(lay);
  const mapTex = new THREE.CanvasTexture(mapCv); mapTex.colorSpace = THREE.SRGBColorSpace; mapTex.anisotropy = 8;
  // tótem "usted está aquí" en la plaza: el mismo plano del nivel
  const totem = new THREE.Group(); totem.position.set(-80.6, 0, 6.4); totem.rotation.y = Math.PI / 2; world.add(totem);
  const tPost = new THREE.Mesh(boxGeo, metal); tPost.scale.set(1.6, 2.9, 0.2); totem.add(tPost);
  const tMap = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.62), new THREE.MeshBasicMaterial({ map: mapTex })); tMap.position.set(0, 2.25, 0.11); totem.add(tMap);
  const tLed = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.16), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.led).multiplyScalar(2) })); tLed.position.set(0, 1.78, 0.11); totem.add(tLed);
  lay.colliders.push({ minX: -81, maxX: -80.2, minZ: 5.6, maxZ: 7.2 });
  // aviso oficial antes del escáner (telegrafiar la amenaza)
  const avisoTex = signTexture(['CONTROL BIOMÉTRICO', 'A 20 METROS · OJO DE ATRIZ'], SIGN_STYLES[0], r, false);
  const aviso = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1), new THREE.MeshStandardMaterial({ map: avisoTex, emissive: '#ffffff', emissiveMap: avisoTex, emissiveIntensity: 0.4 }));
  aviso.position.set(-52, 2.6, L.street.half - 0.05); aviso.rotation.y = Math.PI; world.add(aviso);
  // la máscara secreta del callejón
  const secretMask = new THREE.Group(); secretMask.position.set(-69.5, 0, 21.4); world.add(secretMask);
  const [mc, mctx] = canvas(256, 128); ['#c8261e', '#2e8b57', '#f2c230', '#1f5fa8'].forEach((col, k) => { mctx.fillStyle = col; mctx.fillRect(k * 64, 0, 64, 128); });
  const maskTex = new THREE.CanvasTexture(mc); maskTex.colorSpace = THREE.SRGBColorSpace;
  const maskMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI), new THREE.MeshStandardMaterial({ map: maskTex, roughness: 0.25, metalness: 0.2, emissive: '#3a2a10', emissiveIntensity: 0.6 }));
  maskMesh.position.y = 0.6; maskMesh.scale.set(1, 1.3, 0.6); secretMask.add(maskMesh);
  const maskGlow = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 32), additive(C.yellow, 0.6, { side: THREE.DoubleSide })); maskGlow.rotation.x = -Math.PI / 2; maskGlow.position.y = 0.05; secretMask.add(maskGlow);
  const paperMat = new THREE.MeshBasicMaterial({ map: mapTex, transparent: true, opacity: 0, fog: false, toneMapped: false, depthWrite: false });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(MAP.x1 - MAP.x0, MAP.z1 - MAP.z0), paperMat);
  paper.rotation.x = -Math.PI / 2; paper.position.set((MAP.x0 + MAP.x1) / 2, 1.0, (MAP.z0 + MAP.z1) / 2); paper.renderOrder = 10; scene.add(paper);
  const tableMat = new THREE.MeshBasicMaterial({ color: '#2a2622', transparent: true, opacity: 0, fog: false, depthWrite: false });
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), tableMat); table.rotation.x = -Math.PI / 2; table.position.set(-86, 0.9, 0); table.renderOrder = 9; scene.add(table);
  // ficha del jugador de prueba y su rastro
  const pathCurve = new THREE.CatmullRomCurve3(L.path.map(([x, z]) => v3(x, 1.15, z)), false, 'centripetal');
  const tokenMat = new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const token = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24), tokenMat); token.renderOrder = 12; scene.add(token);
  const TRN = 300, trailPts = pathCurve.getSpacedPoints(TRN);
  const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
  const trailMat = new THREE.LineBasicMaterial({ color: C.blue, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const trailLine = new THREE.Line(trailGeo, trailMat); trailLine.renderOrder = 11; scene.add(trailLine);
  const hesit = PLAYTEST_NOTES.map(n => { const m = new THREE.Mesh(new THREE.RingGeometry(2, 2.6, 40), new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(n.at[0], 1.12, n.at[2]); m.renderOrder = 12; scene.add(m); return m; });

  // en celular: fuera las luces pequeñas (la luz ambiental ya ilumina) 
  if (low) { const drop = []; world.traverse(o => { if (o.isPointLight && o.distance <= 10) drop.push(o); }); drop.forEach(l => l.parent.remove(l)); scene.remove(lavaKey); }

  /* ================= postproceso ================= */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.45, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ================= cámara del tour ================= */
  let aspect = 1;
  const top = { pos: v3(-86, 120, 0.001), look: v3(-86, 0, 0) };
  function frameTop() {
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(46) / 2);
    const mapW = (MAP.x1 - MAP.x0) * 1.02, mapH = (MAP.z1 - MAP.z0) * 1.06;
    let h = Math.max(mapH / k, mapW / (k * aspect));
    if (aspect < 1) h = Math.max(mapH / k, (mapW * 0.42) / (k * aspect)); // en celular: se ve el centro del nivel
    const cx = aspect < 1 ? -95 : (MAP.x0 + MAP.x1) / 2;
    top.pos.set(cx, h, 0.001); top.look.set(cx, 0, 0);
  }
  const UP_Y = v3(0, 1, 0), UP_TOP = v3(0, 0, -1);
  const keys = CHAPTERS.map((ch, i) => ({ ...ch, end: CHAPTERS[i + 1] ? CHAPTERS[i + 1].p : 1 }));
  function camOf(ch) {
    if (ch.cam.top) return { pos: top.pos, look: top.look, fov: 46, up: UP_TOP };
    return { pos: v3(...ch.cam.pos), look: v3(...ch.cam.look), fov: ch.cam.fov, up: UP_Y };
  }
  const tmpPos = v3(0, 0, 0), tmpLook = v3(0, 0, 0), tmpUp = v3(0, 1, 0);
  // devuelve { i, t (0–1 dentro del capítulo), hold (0–1 de la parte quieta) }
  function chapterAt(p) {
    let i = 0; while (i < keys.length - 1 && p >= keys[i + 1].p) i++;
    const k = keys[i], t = clamp((p - k.p) / Math.max(1e-4, k.end - k.p), 0, 1);
    return { i, t };
  }
  const HOLD = 0.58; // fracción del capítulo en la que la cámara se queda en su toma

  /* ================= estado ================= */
  const state = { p: 0, pS: 0, px: 0, py: 0, pxS: 0, pyS: 0, auto: false, autoT: 0, mode: 'tour', designerOn: false, designS: 0, fov: 52, lens: 0 };
  const play = { edgeT: 0, gateT: 0, hitEdge: false, hitGate: false, seen: new Set(), examined: new Set(), nearId: null, focus: null, ojoT: 0, x: 22, z: 0, yaw: Math.PI, pitch: 0.04, mx: 0, mz: 0, run: false, found: new Set(), alerts: 0, choice: null, nearDecision: false, done: false, t0: 0, lastX: 22, bob: 0 };
  const labelsOut = [];
  let phase = { chapter: 0, t: 0, flat: 0, paperA: 0 };

  function tour(p, t) {
    const { i, t: ct } = chapterAt(p);
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const ca = camOf(a), cb = camOf(b);
    const tt = ct < HOLD ? 0 : easeIO((ct - HOLD) / (1 - HOLD));
    tmpPos.lerpVectors(ca.pos, cb.pos, tt); tmpLook.lerpVectors(ca.look, cb.look, tt); tmpUp.lerpVectors(ca.up, cb.up, tt).normalize();
    // arco entre tomas a nivel de suelo: la cámara sube para no atravesar techos
    if (!a.cam.top && !b.cam.top && tt > 0 && tt < 1) {
      const dist = ca.pos.distanceTo(cb.pos);
      tmpPos.y += Math.sin(tt * Math.PI) * clamp(dist * 0.18, 0, 16);
    }
    // deriva lenta durante la toma quieta
    if (!a.cam.top && ct < HOLD && !reduced) { const d = ct / HOLD; tmpPos.x += (d - 0.5) * -1.4; tmpPos.y += Math.sin(t * 0.9) * 0.03; }
    let fov = lerp(ca.fov, cb.fov, tt);
    if (aspect < 0.8 && !(a.cam.top && b.cam.top)) fov = Math.min(88, fov * (aspect < 0.6 ? 1.45 : 1.25)); // celular vertical: más campo
    // paralaje del puntero a nivel de calle
    const streetW = a.cam.top ? 0 : 1 - tt * (b.cam.top ? 1 : 0);
    tmpLook.y += state.pyS * 2 * streetW; tmpLook.z += state.pxS * 4 * streetW;
    camera.position.copy(tmpPos); camera.up.copy(tmpUp); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(tmpLook);

    // del mundo al plano y de vuelta
    const ip = keys.findIndex(k => k.id === 'plano'), it = keys.findIndex(k => k.id === 'toma');
    const pPlano = keys[ip].p, pToma = keys[it].p, pSal = keys[ip - 1].p, pPlay = keys[it - 1].p;
    const into = smooth(pSal + (pPlano - pSal) * 0.62, pPlano, p);
    const out = smooth(pPlay + (pToma - pPlay) * 0.6, pToma - 0.01, p);
    const flat = into * (1 - out);
    const paperA = smooth(pPlano - 0.012, pPlano + 0.01, p) * (1 - smooth(pPlay + (pToma - pPlay) * 0.55, pPlay + (pToma - pPlay) * 0.8, p));

    // capa de diseñador según el capítulo
    let dTarget = (a.design || 0) * (1 - tt) + (b.design || 0) * tt;
    if (a.id === 'camino') critical.mesh.material.uniforms.progress.value = clamp(ct / HOLD, 0, 1);
    else if (keys.findIndex(k => k.id === 'camino') > i) critical.mesh.material.uniforms.progress.value = 0;
    else critical.mesh.material.uniforms.progress.value = 1;
    // playtest sobre el papel
    const playing = a.id === 'playtest' ? clamp(ct / 0.85, 0, 1) : (a.id === 'plano' ? 0 : (i > keys.findIndex(k => k.id === 'playtest') ? 1 : 0));
    const tokA = a.id === 'playtest' ? paperA : 0;
    return { i, ct, flat, paperA, dTarget, playing, tokA };
  }

  function applyCommon(flat, paperA, dTarget, dt) {
    world.scale.y = lerp(1, 0.012, flat);
    const life = 1 - flat * 0.92;
    for (const [m, k, v] of fadeMats) m[k] = v * life;
    sodium.forEach(l => { l.intensity = (low ? 28 : 26) * life; });
    heroLight.intensity = 60 * life; watchLight.intensity = 70 * life; catLights.forEach(l => { l.intensity = 36 * life; }); extraLights.forEach(([l, v]) => { l.intensity = v * life; }); gateLight.intensity = 40 * life;
    paperMat.opacity = paperA; tableMat.opacity = paperA;
    ashMat.opacity = 0.85 * (1 - flat) * (1 - paperA);
    bloom.strength = 0.6 * (1 - paperA * 0.95);
    sky.material.uniforms.fade.value = 1 - paperA;
    volc.visible = paperA < 0.4;
    scene.fog.density = 0.0092 * (1 - flat * 0.85);
    state.designS += (dTarget * (1 - flat) - state.designS) * Math.min(1, dt * 3);
    const d = state.designS;
    for (const rb of ribbons) rb.mesh.material.uniforms.opacity.value = d;
    for (const b of beacons) { b.col.material.opacity = b.base[0] * d; b.ring.material.opacity = b.base[1] * d; }
    zones.forEach(z => { z.material.opacity = d * 0.8; });
    design.visible = d > 0.01;
  }

  /* ================= modo jugable ================= */
  const R = 0.38;
  // Zonas caminables: solo el recorrido diseñado (x de mayor a menor, z de menor a mayor)
  const WALK = [
    [30, 12, -5, 5],          // llegada
    [13, -38, -3, 3],         // pasillo del Potrerillo
    [-38, -76.5, -3.3, 3.3],  // Calle Real
    [-43, -47, 3, 22.6],      // entrada al callejón
    [-43, -76.5, 18.6, 22.6], // callejón de San Juan
    [-52, -68, 22, 28.4],     // atrio de San Juan
    [-76, -124, -23.5, 23.5], // Plaza de Nariño
    [-124, -180, -3.9, 3.9],  // avenida al páramo
  ];
  const ZONE_OF = ['potrerillo', 'potrerillo', 'calle', 'sanjuan', 'sanjuan', 'sanjuan', 'plaza', 'avenida'];
  const walkable = (x, z) => WALK.some(([xa, xb, za, zb]) => x <= xa + R && x >= xb - R && z >= za && z <= zb);
  const gateOpen = () => play.found.size >= 3 && !!play.choice;
  function collide(nx, nz) {
    if (!walkable(nx, nz)) { play.hitEdge = true; return true; }
    if (!gateOpen() && nx < L.gate.x + 3.2 && Math.abs(nz) < 6) { play.hitGate = true; return true; }
    for (const c of lay.colliders) if (nx > c.minX - R && nx < c.maxX + R && nz > c.minZ - R && nz < c.maxZ + R) return true;
    return false;
  }
  function stepPlay(dt, t) {
    // plano detalle al examinar un objeto: la cámara se acerca sola
    if (play.focus) {
      // mientras el diálogo está abierto, el primer plano se sostiene (no inicia el regreso)
      play.focus.t = Math.max(play.focus.t - dt, play.hold ? play.focus.T * 0.25 : -1);
      const k = 1 - Math.max(0, play.focus.t) / play.focus.T, e = k < 0.75 ? Math.min(1, k * 3) : Math.max(0, (1 - k) / 0.25);
      camera.up.copy(UP_Y); camera.position.set(play.x, 1.68, play.z);
      tmpLook.set(play.x + Math.cos(play.yaw) * Math.cos(play.pitch), 1.68 + Math.sin(play.pitch), play.z + Math.sin(play.yaw) * Math.cos(play.pitch)).lerp(play.focus.target, easeIO(e));
      camera.fov = lerp(state.fovS, 28, easeIO(e)); camera.updateProjectionMatrix(); camera.lookAt(tmpLook);
      if (play.focus.t <= 0) { play.focus = null; onEvent({ type: 'enfoque', on: false }); }
      return play.choice === 'mascara';
    }
    const fwd = v3(Math.cos(play.yaw), 0, Math.sin(play.yaw)), right = v3(-Math.sin(play.yaw), 0, Math.cos(play.yaw));
    const speed = (play.run ? 8.5 : 5.2) * dt;
    const mv = fwd.multiplyScalar(play.mz).add(right.multiplyScalar(play.mx));
    if (mv.lengthSq() > 1) mv.normalize();
    const nx = play.x + mv.x * speed, nz = play.z + mv.z * speed;
    if (!collide(nx, play.z)) play.x = nx;
    if (!collide(play.x, nz)) play.z = nz;
    const moving = Math.abs(play.mx) + Math.abs(play.mz) > 0.05;
    play.bob += moving ? dt * (play.run ? 11 : 8) : 0;
    const eyeY = 1.68 + (moving && !reduced ? Math.sin(play.bob) * 0.04 : 0);
    camera.up.copy(UP_Y);
    camera.position.set(play.x, eyeY, play.z);
    state.fovS += (state.fov - state.fovS) * Math.min(1, dt * 5);
    camera.fov = state.fovS; camera.updateProjectionMatrix();
    camera.lookAt(play.x + Math.cos(play.yaw) * Math.cos(play.pitch), eyeY + Math.sin(play.pitch), play.z + Math.sin(play.yaw) * Math.cos(play.pitch));
    // locación (como el encabezado de escena de un guion)
    const zi = WALK.findIndex(([xa, xb, za, zb]) => play.x <= xa + R && play.x >= xb - R && play.z >= za && play.z <= zb);
    if (zi >= 0 && ZONE_OF[zi] !== play.zone) { play.zone = ZONE_OF[zi]; onEvent({ type: 'zona', id: play.zone }); }
    // principios de diseño que el jugador encuentra en el camino
    for (const pr of PRINCIPLES) if (!play.seen.has(pr.id) && Math.hypot(play.x - pr.x, play.z - pr.z) < pr.r) { play.seen.add(pr.id); onEvent({ type: 'principio', principio: pr, count: play.seen.size }); }
    // objetos que se pueden examinar (las pistas ahora se descubren mirando)
    let near = null;
    for (const it of ITEMS) { if (play.examined.has(it.id)) continue; const d = Math.hypot(play.x - it.x, play.z - it.z); if (d < it.r && (!near || d < near.d)) near = { it, d }; }
    const nid = near ? near.it.id : null;
    if (nid !== play.nearId) { play.nearId = nid; onEvent({ type: 'cerca', item: near ? near.it : null }); }
    // escáner
    if (play.lastX > L.scanner.x && play.x <= L.scanner.x && Math.abs(play.z) < L.street.half) { play.alerts++; onEvent({ type: 'escaner', alerts: play.alerts }); }
    play.lastX = play.x;
    // decisión
    const nearD = Math.hypot(play.x - L.decision.x, play.z - L.decision.z) < 4.2;
    if (nearD !== play.nearDecision && !play.choice) { play.nearDecision = nearD; onEvent({ type: nearD ? 'decision-cerca' : 'decision-lejos' }); }
    // salida
    // límites del nivel y puerta cerrada: siempre con explicación
    const now = performance.now();
    if (play.hitEdge && now - play.edgeT > 6000) { play.edgeT = now; onEvent({ type: 'limite' }); }
    if (play.hitGate && now - play.gateT > 5000) { play.gateT = now; onEvent({ type: 'salida-cerrada', found: play.found.size, choice: play.choice }); }
    play.hitEdge = play.hitGate = false;
    if (!play.done && play.x < L.gate.x + 2 && Math.abs(play.z) < 6) {
      if (gateOpen()) { play.done = true; onEvent({ type: 'fin', found: play.found.size, alerts: play.alerts, choice: play.choice, seconds: Math.round((performance.now() - play.t0) / 1000) }); }
      else if (!play.warned) { play.warned = true; onEvent({ type: 'salida-cerrada', found: play.found.size, choice: play.choice }); setTimeout(() => { play.warned = false; }, 4000); }
    }
    // el Ojo de Atriz: patrón que se puede leer. Sin pintura, su luz te registra; con máscara, te sigue.
    const inPlaza = play.x < L.plaza.x0 && play.x > L.plaza.x1;
    if (inPlaza && !play.choice) {
      const d = Math.hypot(play.x - watchTarget.position.x, play.z - watchTarget.position.z);
      if (d < 4.4 && performance.now() - play.ojoT > 3500) { play.ojoT = performance.now(); play.alerts++; onEvent({ type: 'ojo', alerts: play.alerts }); }
    }
    return inPlaza && play.choice === 'mascara';
  }

  /* ================= bucle ================= */
  const clock = new THREE.Clock();
  let running = false, raf = 0;
  const proj = v3(0, 0, 0);
  let simT = 0;
  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    step(Math.min(clock.getDelta(), 0.05));
  }
  function step(dt) {
    if (state.mode === 'shot' && state.shot.t !== undefined) simT = state.shot.t; // tiempo fijo: renders repetibles
    simT += dt; const t = simT;
    state.pxS += (state.px - state.pxS) * Math.min(1, dt * 2.5); state.pyS += (state.py - state.pyS) * Math.min(1, dt * 2.5);
    let tracking = false;
    if (state.mode === 'shot') {
      const sh = state.shot;
      applyCommon(sh.flat || 0, sh.paperA || 0, sh.design || 0, dt);
      for (const rb of ribbons) rb.mesh.material.uniforms.progress.value = 1;
      tokenMat.opacity = 0; trailMat.opacity = 0; hesit.forEach(h => { h.material.opacity = 0; });
      camera.up.set(0, 1, 0); camera.position.set(...sh.pos); camera.fov = sh.fov || 50; camera.updateProjectionMatrix(); camera.lookAt(...sh.look);
      phase = { chapter: -1, t: 0, flat: 0, paperA: 0 }; labelsOut.length = 0;
    } else if (state.mode === 'play') {
      tracking = stepPlay(dt, t);
      applyCommon(0, 0, state.designerOn ? 1 : 0, dt);
      for (const rb of ribbons) rb.mesh.material.uniforms.progress.value = 1;
      tokenMat.opacity = 0; trailMat.opacity = 0; hesit.forEach(h => { h.material.opacity = 0; });
      phase = { chapter: -1, t: 0, flat: 0, paperA: 0, play: true };
      labelsOut.length = 0;
    } else {
      if (state.auto) { state.autoT += dt; state.p = (state.autoT / 150) % 1; }
      state.pS += (state.p - state.pS) * (reduced ? 1 : Math.min(1, dt * 4));
      const res = tour(state.pS, t);
      applyCommon(res.flat, res.paperA, res.dTarget, dt);
      // playtest
      const u = res.playing;
      const pt = pathCurve.getPointAt(clamp(u, 0, 1));
      token.position.copy(pt); tokenMat.opacity = res.tokA; trailMat.opacity = res.tokA * 0.9;
      trailGeo.setDrawRange(0, Math.floor(TRN * u) + 1);
      PLAYTEST_NOTES.forEach((n, k) => { hesit[k].material.opacity = (u > n.u ? 1 : 0) * res.tokA * (0.6 + 0.4 * Math.sin(t * 4)); });
      phase = { chapter: res.i, t: res.ct, flat: res.flat, paperA: res.paperA, hold: res.ct < HOLD };
      // anotaciones ancladas al mundo
      labelsOut.length = 0;
      const ch = keys[res.i];
      const vis = res.ct > 0.04 && res.ct < HOLD + 0.05 ? 1 : 0;
      const list = ch.id === 'playtest' ? PLAYTEST_NOTES.map(n => ({ at: [n.at[0], 0.8, n.at[2]], tag: 'Playtest', title: n.text, text: '', u: n.u })) : ch.labels;
      list.forEach((lb, k) => {
        proj.set(lb.at[0], lb.at[1] * (ch.id === 'playtest' ? 1 : 1), lb.at[2]).project(camera);
        const on = proj.z < 1 && Math.abs(proj.x) < 1.15 && Math.abs(proj.y) < 1.15 && (lb.u === undefined || u > lb.u);
        labelsOut.push({ k, x: (proj.x * 0.5 + 0.5), y: (-proj.y * 0.5 + 0.5), on: on && vis, tag: lb.tag, title: lb.title, text: lb.text });
      });
    }

    // animación del mundo
    const windK = reduced ? 0.3 : 1;
    if (phase.flat < 0.98) for (const tp of tarps) {
      const arr = tp.mesh.geometry.attributes.position.array, base = tp.base;
      for (let i = 0; i < arr.length; i += 3) { const u = base[i], v = base[i + 1]; arr[i + 2] = -Math.cos(u * 1.1) * 0.12 + Math.sin(t * 1.6 * windK + tp.phase + u * 1.4 + v * 0.8) * tp.amp * (0.35 + Math.abs(v) / 1.75) * windK; }
      tp.mesh.geometry.attributes.position.needsUpdate = true;
    }
    heroSign.rotation.x = Math.sin(t * 0.7) * 0.025 * windK;
    ledTex.offset.x = (ledTex.offset.x + dt * 0.035) % 1;
    scanTex.offset.y = (scanTex.offset.y - dt * 0.6) % 1;
    chumbe.offset.y = (chumbe.offset.y + dt * 0.05) % 1;
    rings.forEach((rg, k) => { rg.rotation.z = t * (0.4 + k * 0.25) * (k % 2 ? -1 : 1); rg.position.y = 4.4 + k * 1.1 + Math.sin(t + k) * 0.08; });
    beamPivot.rotation.y = tracking ? beamPivot.rotation.y : t * 0.45;
    if (tracking) { watchTarget.position.set(play.x, 0, play.z); const dx = play.x - (cat.x - (cat.w / 2 - 2.6)), dz = play.z - (cat.z + front - 2.6); beamPivot.rotation.y = Math.atan2(dx, dz) + Math.PI; }
    else { watchTarget.position.set(cat.x - 6 + Math.cos(t * 0.45) * 18, 0, -4 + Math.sin(t * 0.45) * 14); }
    for (const b of beacons) { b.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.08); }
    if (state.mode === 'play') {
      pistaBeacons.forEach((b, k) => { const got = play.found.has(L.pistas[k].id); b.g.visible = true; b.col.material.opacity = got ? 0.05 : Math.max(b.col.material.opacity, 0.32); b.ring.material.opacity = got ? 0.1 : Math.max(b.ring.material.opacity, 0.85); });
      design.visible = true;
    }
    for (const rb of ribbons) rb.mesh.material.uniforms.time.value = t;
    // drones
    drones.forEach((d, k) => {
      const a = t * d.sp + d.ph;
      dummy.position.set(d.cx + Math.cos(a) * d.rad, d.h + Math.sin(t * 1.3 + k) * 0.4, d.cz + Math.sin(a) * d.rad); dummy.rotation.set(0, -a, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      droneMesh.setMatrixAt(k, dummy.matrix);
      dummy.position.y -= k % 2 ? 1.3 : 400; dummy.updateMatrix(); crates.setMatrixAt(k, dummy.matrix); dummy.position.y += k % 2 ? 1.3 : 400;
      dLightPos[k * 3] = dummy.position.x; dLightPos[k * 3 + 1] = dummy.position.y - 0.15; dLightPos[k * 3 + 2] = dummy.position.z;
      const on = (Math.sin(t * 6 + k) > 0.2) ? 1 : 0.15, c = new THREE.Color(d.red ? '#ff4a3a' : C.cyan);
      dLightCol[k * 3] = c.r * on; dLightCol[k * 3 + 1] = c.g * on; dLightCol[k * 3 + 2] = c.b * on;
    });
    crates.instanceMatrix.needsUpdate = true; droneMesh.instanceMatrix.needsUpdate = true; dGeo.attributes.position.needsUpdate = true; dGeo.attributes.color.needsUpdate = true;
    // chivas voladoras siguiendo su ruta
    for (const ch of chivas) {
      const u = (t * ch.speed + ch.off) % 1, p = chivaRoute.getPointAt(u), q = chivaRoute.getPointAt((u + 0.004) % 1);
      ch.g.position.copy(p); ch.g.position.y += Math.sin(t * 1.4 + ch.off * 9) * 0.3; ch.g.lookAt(q.x, ch.g.position.y, q.z);
    }
    // en renders aéreos se puede ocultar lo que vuela (fly: false)
    const fly = !(state.mode === 'shot' && state.shot.fly === false);
    bigCuyes.forEach(c => { c.g.visible = fly; }); cuyIMs.forEach(im => { im.visible = fly; }); chivas.forEach(ch => { ch.g.visible = fly; }); condor.visible = fly;
    // cuyes: el gigante cruza la ciudad hacia la cámara, el otro ronda el mercado, los mensajeros reparten
    for (const c of bigCuyes) {
      if (c.k === 0) { const x = -300 + ((t * 5 + 250) % 400), z = 4 + Math.sin(t * 0.2) * 6; c.g.position.set(x, 31 + Math.sin(t * 0.5) * 1.2, z); c.g.lookAt(x + 4, c.g.position.y, 4 + Math.sin((t + 0.8) * 0.2) * 6); }
      else { const a = t * 0.06 + 2; c.g.position.set(-30 + Math.cos(a) * 50, 38 + Math.sin(t * 0.4) * 1.5, Math.sin(a) * 26); c.g.lookAt(-30 + Math.cos(a + 0.05) * 50, c.g.position.y, Math.sin(a + 0.05) * 26); }
      c.g.rotateZ(Math.sin(t * 0.7 + c.k) * 0.06);
      c.jetMat.opacity = 0.42 + Math.sin(t * 20 + c.k) * 0.14;
    }
    smallCuyes.forEach((c, k) => {
      const a = (t * c.sp + c.ph) * c.dir;
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.85);
      dummy.position.set(c.cx + Math.cos(a) * c.rad, c.h + Math.sin(t * 1.7 + k) * 0.35, c.cz + Math.sin(a) * c.rad);
      dummy.lookAt(c.cx + Math.cos(a + 0.1 * c.dir) * c.rad, dummy.position.y, c.cz + Math.sin(a + 0.1 * c.dir) * c.rad);
      dummy.rotateZ(-0.22 * c.dir); dummy.updateMatrix();
      for (const im of cuyIMs) im.setMatrixAt(k, dummy.matrix);
    });
    for (const im of cuyIMs) im.instanceMatrix.needsUpdate = true;
    cuyTpl.jetMat.opacity = 0.42 + Math.sin(t * 20) * 0.14;
    dummy.scale.set(1, 1, 1);
    // el cuy mensajero despega cuando lo examinas, y vuelve después
    if (perch.fly !== null && perch.fly !== undefined) {
      const k = simT - perch.fly;
      if (k < 9) { perch.g.visible = true; perch.g.rotation.y = -Math.PI / 2 + Math.sin(k * 2) * 0.15; perch.g.position.set(-6.5 - k * k * 0.9, 2.5 + k * k * 0.45 + Math.sin(k * 6) * 0.08, -2.1 + Math.sin(k) * 0.6); }
      else if (k < 28) perch.g.visible = false;
      else { perch.fly = null; perch.g.visible = true; perch.g.rotation.y = Math.PI / 2 + 0.35; perch.g.position.set(-6.5, 2.5, -2.1); }
    } else perch.g.position.y = 2.5 + Math.sin(t * 2.2) * 0.06;
    const gateOpenNow = state.mode === 'play' && gateOpen();
    pillar.material.opacity += ((gateOpenNow ? 0.2 + Math.sin(t * 2) * 0.05 : 0) - pillar.material.opacity) * Math.min(1, dt * 2);
    pillar.visible = pillar.material.opacity > 0.005;
    chak.material.emissiveIntensity = gateOpenNow ? 2 + Math.sin(t * 3) * 0.6 : 1.6;
    const bk = simT - burst.t0;
    if (bk >= 0 && bk < 3) {
      for (let k = 0; k < BURST; k++) { const v = burstVel[k]; burstPos[k * 3] = burst.origin.x + v[0] * bk; burstPos[k * 3 + 1] = burst.origin.y + v[1] * bk - 0.6 * bk * bk; burstPos[k * 3 + 2] = burst.origin.z + v[2] * bk; }
      burstGeo.attributes.position.needsUpdate = true; burstMat.opacity = 0.9 * (1 - bk / 3); burstPts.visible = true;
    } else burstPts.visible = false;
    for (const pq of plaques) { const seen = state.mode === 'play' && play.examined.has(pq.id); pq.panel.position.y = pq.y + Math.sin(t * 1.3 + pq.y) * 0.04; pq.ring.material.opacity = seen ? 0.08 : 0.35 + Math.sin(t * 3) * 0.15; }
    obsBeacon.material.visible = Math.sin(t * 4) > 0;
    for (const sm of smoke) {
      sm.t = (sm.t + dt * 0.18) % 1;
      sm.sp.position.set(-121.4 + Math.sin(sm.t * 5 + sm.t) * 0.3, 1.4 + sm.t * 4.5, 13 + sm.t * 0.8);
      sm.sp.scale.setScalar(0.6 + sm.t * 2.2); sm.sp.material.opacity = 0.22 * Math.sin(sm.t * Math.PI) * (1 - phase.flat);
    }
    // cóndor dando vueltas sobre la plaza
    const ca = t * 0.11;
    condor.position.set(L.statue.x + Math.cos(ca) * 30, 36 + Math.sin(t * 0.4) * 2, L.statue.z + Math.sin(ca) * 26);
    condor.lookAt(L.statue.x + Math.cos(ca + 0.05) * 30, condor.position.y, L.statue.z + Math.sin(ca + 0.05) * 26);
    condor.rotateZ(-0.25);
    const flap = Math.sin(t * 1.6) * 0.22 * windK;
    condorWings[0].rotation.z = flap; condorWings[1].rotation.z = -flap;
    // carroza: la cabeza respira, las alas se abren, los cabezudos bailan
    bigHead.rotation.y = core.rotation.y = armature.rotation.y = Math.sin(t * 0.5) * 0.08;
    floatWings.forEach((w, k) => { w.rotation.z = (k ? -1 : 1) * (0.15 + Math.sin(t * 0.9) * 0.12); });
    cabezudos.forEach((g, k) => { g.position.y = 0.9 + Math.abs(Math.sin(t * 3 + k)) * 0.18; g.rotation.y = Math.sin(t * 1.5 + k) * 0.5; });
    eyeR.material.color.setScalar(1).multiply(new THREE.Color(C.cyan)).multiplyScalar(0.75 + Math.sin(t * 4) * 0.2);
    for (let i = 0; i < TALC; i++) {
      const j = i * 3, s = talcSeed[i];
      talcPos[j + 1] += dt * (0.5 + s * 0.8);
      if (talcPos[j + 1] > 10) talcPos[j + 1] = 1.2;
      const a = s * 40 + talcPos[j + 1] * 0.3;
      talcPos[j] = L.float.x + Math.cos(a) * (2 + talcPos[j + 1] * 0.35); talcPos[j + 2] = L.float.z + Math.sin(a) * (2 + talcPos[j + 1] * 0.35);
    }
    talcGeo.attributes.position.needsUpdate = true;
    const open = state.mode === 'shot' ? state.shot.gate !== 'closed' : state.mode !== 'play' || gateOpen();
    curtain.material.color.set(open ? '#4adf8a' : '#ff4a3a'); curtain.material.opacity = open ? 0.18 : 0.42 + Math.sin(t * 6) * 0.08; curtainTex.offset.y = (curtainTex.offset.y - dt * 0.5) % 1;
    maskMesh.rotation.y = t * 0.8; maskGlow.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
    billboard.material.opacity = 0.75 + Math.sin(t * 13) * 0.06 + (Math.sin(t * 0.7) > 0.97 ? -0.5 : 0);
    // personas caminando
    npcs.forEach((n, i) => {
      let x = n.x, z = n.z, yaw = n.ph;
      if (n.walk) {
        if (n.ax === 'c') { const a = t * n.sp * 0.25 + n.ph; x = n.x + Math.cos(a) * n.rad; z = n.z + Math.sin(a) * n.rad * 0.6; yaw = -a; }
        else { const k = Math.sin(t * n.sp * 0.18 + n.ph); x = n.x + k * 9; yaw = Math.cos(t * n.sp * 0.18 + n.ph) > 0 ? Math.PI / 2 : -Math.PI / 2; }
      } else if (n.rosario && state.mode === 'play' && Math.hypot(play.x - x, play.z - z) < 14) { yaw = Math.atan2(play.x - x, play.z - z); }
      const bob = n.walk ? Math.abs(Math.sin(t * 6 * n.sp + i)) * 0.05 : 0;
      dummy.rotation.set(0, yaw, 0); dummy.scale.set(1, n.h, 1);
      dummy.position.set(x, 0.42 + bob, z); dummy.updateMatrix(); npcBody.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0, z); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); npcLegs.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0.42 + 1.25 * n.h + 0.12 + bob, z); dummy.updateMatrix(); npcHead.setMatrixAt(i, dummy.matrix);
      dummy.position.y += 0.17; dummy.updateMatrix(); npcHat.setMatrixAt(i, dummy.matrix);
    });
    npcBody.instanceMatrix.needsUpdate = npcHead.instanceMatrix.needsUpdate = npcHat.instanceMatrix.needsUpdate = npcLegs.instanceMatrix.needsUpdate = true;

    // ceniza alrededor de la cámara
    if (ashMat.opacity > 0.01) {
      const cx = camera.position.x, cz = camera.position.z;
      for (let i = 0; i < ASH; i++) {
        const j = i * 3;
        ashPos[j + 1] -= ashVel[i] * dt * (reduced ? 0.4 : 1);
        ashPos[j] -= dt * 0.25; ashPos[j + 2] += Math.sin(t * 0.5 + i) * dt * 0.15;
        if (ashPos[j + 1] < 0 || Math.abs(ashPos[j] - cx) > 45) { ashPos[j + 1] = 17; ashPos[j] = cx + 8 - Math.random() * 60; ashPos[j + 2] = cz + (Math.random() - 0.5) * 30; }
      }
      ashGeo.attributes.position.needsUpdate = true;
    }
    for (const pl of plume) {
      pl.t = (pl.t + dt * 0.012 * (reduced ? 0.4 : 1)) % 1;
      const k = pl.t, s = 20 + k * 120;
      pl.sp.position.set(-k * 140 + Math.sin(pl.seed * 9 + k * 4) * 10, 112 + k * 150, Math.cos(pl.seed * 7) * 18 * k);
      pl.sp.scale.set(s, s, 1);
      pl.sp.material.opacity = 0.2 * Math.sin(k * Math.PI) * (1 - phase.paperA);
      const lit = Math.pow(1 - k, 3);
      pl.sp.material.color.setRGB(0.14 + 0.32 * lit, 0.11 + 0.06 * lit, 0.1);
    }
    composer.render();
  }

  function resize() {
    const w = canvasEl.clientWidth || window.innerWidth, h = canvasEl.clientHeight || window.innerHeight;
    aspect = w / h; camera.aspect = aspect; renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w * (low ? 0.35 : 0.5), h * (low ? 0.35 : 0.5));
    frameTop();
  }
  resize();

  const api = {
    chapters: CHAPTERS,
    jump(p) { state.p = state.pS = clamp(p, 0, 1); },
    renderOnce(n = 1) { for (let k = 0; k < n; k++) step(0.05); },
    shot(cfg) { if (cfg) { state.mode = 'shot'; state.shot = cfg; } else state.mode = 'tour'; },
    // fotograma actual como JPEG (para el storyboard del modo jugable)
    capture(width = 640) {
      step(0.001);
      const src = renderer.domElement, h = Math.round(width * src.height / src.width);
      const [c, ctx] = canvas(width, h); ctx.drawImage(src, 0, 0, width, h);
      return c.toDataURL('image/jpeg', 0.86);
    },
    setProgress(p) { state.p = clamp(p, 0, 1); },
    setPointer(x, y) { state.px = clamp(x, -1, 1); state.py = clamp(y, -1, 1); },
    setAuto(on) { state.auto = on; },
    labels: () => labelsOut,
    start() { if (!running) { running = true; clock.getDelta(); frame(); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    resize,
    get phase() { return phase; },
    play: {
      enter() {
        state.mode = 'play'; state.fov = 70; state.fovS = 70; perch.fly = null; perch.g.visible = true; burst.t0 = -99;
        secretMask.visible = true;
        Object.assign(play, { edgeT: 0, gateT: 0, x: 22, z: 0, yaw: Math.PI, pitch: 0.04, mx: 0, mz: 0, seen: new Set(), examined: new Set(), nearId: null, focus: null, ojoT: 0, found: new Set(), alerts: 0, choice: null, nearDecision: false, done: false, warned: false, zone: null, t0: performance.now(), lastX: 22 });
      },
      exit() { state.mode = 'tour'; state.designerOn = false; },
      input(o) { if ('mx' in o) play.mx = o.mx; if ('mz' in o) play.mz = o.mz; if ('run' in o) play.run = o.run; },
      look(dx, dy) { play.yaw += dx; play.pitch = clamp(play.pitch - dy, -0.9, 0.9); },
      interact() {
        if (!play.nearId || play.focus) return;
        const it = ITEMS.find(i => i.id === play.nearId);
        play.examined.add(it.id); play.nearId = null;
        play.focus = { target: v3(...it.focus), t: 2.6, T: 2.6 };
        onEvent({ type: 'enfoque', on: true, item: it });
        if (it.id === 'cuyexpress') perch.fly = simT;
        if (it.pista) play.found.add(it.pista);
        if (it.id === 'secreto') secretMask.visible = false;
        onEvent({ type: 'cerca', item: null });
        onEvent({ type: 'interaccion', item: it, found: play.found.size });
      },
      decide(c) {
        play.choice = c; play.nearDecision = false;
        if (c === 'pintarse') { burst.t0 = simT; burst.origin.set(play.x, 1.4, play.z); }
        onEvent({ type: 'decidido', choice: c });
      },
      setDesigner(on) { state.designerOn = on; },
      holdFocus(on) { play.hold = on; },
      setLens(mm) { state.fov = mm ? THREE.MathUtils.radToDeg(2 * Math.atan(12 / mm)) : 70; },
      get state() { return { found: play.found.size, alerts: play.alerts, choice: play.choice, seen: play.seen.size, datos: DATOS.filter(d => play.examined.has(d.id)).length }; },
      // solo para pruebas (?debug): poner al jugador en un punto
      teleport(x, z, yaw, pitch = 0.04) { play.x = play.lastX = x; play.z = z; play.yaw = yaw; play.pitch = pitch; },
      // posición y mirada del jugador (para el plano A3 del HUD)
      pose() { return { x: play.x, z: play.z, yaw: play.yaw, pitch: play.pitch, fov: camera.fov }; },
      // qué hay en el centro del cuadro: sirve para clasificar el plano que se toma
      shotInfo() {
        let near = null; const p = v3(0, 0, 0);
        for (const it of ITEMS) {
          p.set(...it.focus); const d = camera.position.distanceTo(p); proj.copy(p).project(camera);
          if (proj.z > 1 || Math.abs(proj.x) > 0.42 || Math.abs(proj.y) > 0.5) continue;
          if (!near || d < near.d) near = { id: it.id, d };
        }
        return { pitch: play.pitch, fov: camera.fov, near };
      },
      // etiquetas ancladas al mundo: lo que se puede examinar y el siguiente objetivo
      markers() {
        const out = [];
        if (play.focus) return out;
        const add = (id, x, y, z, label, kind) => {
          const d = Math.hypot(x - play.x, z - play.z); if (d > 40) return;
          proj.set(x, y, z).project(camera);
          if (proj.z > 1 || Math.abs(proj.x) > 1.05 || Math.abs(proj.y) > 1.05) return;
          out.push({ id, x: proj.x * 0.5 + 0.5, y: -proj.y * 0.5 + 0.5, d, label, kind, near: play.nearId === id });
        };
        for (const it of ITEMS) if (!play.examined.has(it.id)) add(it.id, it.focus[0], Math.max(it.focus[1], 1.1) + (it.dato ? 0.75 : 0.9), it.focus[2], it.label, it.dato ? 'dato' : it.pista ? 'pista' : 'objeto');
        if (play.found.size >= 3 && !play.choice) add('decision', L.decision.x, 3, L.decision.z, 'Decide aquí', 'decision');
        if (play.choice) add('salida', L.gate.x, 4.5, 0, 'Puerta del páramo', 'salida');
        return out;
      },
      // siguiente objetivo: ángulo relativo a la mirada (rad) y distancia (m)
      objective(meta) {
        let tgt, label;
        if (meta) { tgt = meta; label = meta.label; }
        else if (play.found.size < 3) {
          let best = null;
          for (const p of L.pistas) if (!play.found.has(p.id)) { const d = Math.hypot(p.x - play.x, p.z - play.z); if (!best || d < best.d) best = { p, d }; }
          tgt = best.p; label = 'Pista ' + best.p.id;
        } else if (!play.choice) { tgt = L.decision; label = 'La carroza'; }
        else { tgt = L.salida; label = 'Puerta del páramo'; }
        const dx = tgt.x - play.x, dz = tgt.z - play.z;
        let a = Math.atan2(dz, dx) - play.yaw; a = Math.atan2(Math.sin(a), Math.cos(a));
        return { angle: a, dist: Math.hypot(dx, dz), label, tx: tgt.x, tz: tgt.z };
      },
    },
    debug: { scene, renderer, camera },
  };
  return api;
}

// Chakana (cruz andina escalonada) de lado 6u, con hueco central.
function makeChakana(u) {
  const p = [[1, 3], [-1, 3], [-1, 2], [-2, 2], [-2, 1], [-3, 1], [-3, -1], [-2, -1], [-2, -2], [-1, -2], [-1, -3], [1, -3], [1, -2], [2, -2], [2, -1], [3, -1], [3, 1], [2, 1], [2, 2], [1, 2]];
  const s = new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x * u, y * u)));
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.75 * u, 0, Math.PI * 2, true); s.holes.push(hole);
  return s;
}
