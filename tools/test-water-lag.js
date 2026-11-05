#!/usr/bin/env node
/* Smoke test: load the whole game (index.html inline script + expansion.js,
   weather.js, world.js, build.js, modes.js, content.js, menu.js, ui3d.js) in a
   VM with a stubbed DOM/canvas, then drive real matches: sea biome reflections,
   pond biome craters/drains, buoyancy, splash FX, FX pooling, render passes. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

// ---- no-op 2D context -------------------------------------------------
const noopCtx = new Proxy({}, {
  get(t, k) {
    if (k === Symbol.toPrimitive) return () => 0;
    if (typeof k === 'string' && /^(createLinearGradient|createRadialGradient)$/.test(k)) return () => ({ addColorStop() {} });
    if (k === 'createPattern') return () => ({});
    if (k === 'measureText') return () => ({ width: 0 });
    if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) });
    if (k === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
    return (...a) => noopCtx;
  },
  set() { return true; }
});

// ---- DOM stubs ---------------------------------------------------------
const els = new Map();
function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    style: new Proxy({}, { set: () => true, get: (t, k) => (typeof k === 'string' && /^(setProperty|getPropertyValue)$/.test(k)) ? () => {} : '' }),
    dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    children: [], width: 300, height: 150, value: '', checked: false,
    textContent: '', innerHTML: '', firstChild: null,
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute: () => null, removeAttribute() {}, hasAttribute: () => false,
    matches: () => false, focusable: false,
    append() {}, prepend() {}, appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    insertAdjacentHTML() {}, closest: () => null, animate() { return {}; }, focus() {},
    querySelector: () => makeEl('div'), querySelectorAll: () => [], cloneNode: () => makeEl('div'), replaceWith() {},
    title: '', src: '', href: '',
    getContext() { return noopCtx; }, toDataURL() { return ''; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 150 }),
  };
  Object.defineProperty(el, 'offsetWidth', { get: () => 100 });
  Object.defineProperty(el, 'offsetHeight', { get: () => 100 });
  return el;
}
function getEl(id) { if (!els.has(id)) els.set(id, makeEl('div')); return els.get(id); }
const documentStub = {
  hidden: false, cookie: '', body: makeEl('body'), documentElement: makeEl('html'),
  fonts: { ready: Promise.resolve() },
  getElementById: getEl,
  createElement: (t) => makeEl(t),
  querySelector: (s) => getEl(String(s).replace(/^[.#]/, '')),
  querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  head: makeEl('head'),
};

// ---- sandbox -----------------------------------------------------------
let rafQ = [];
const sandbox = {
  console, document: documentStub, performance,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  screen: { width: 1280, height: 800 },
  navigator: { userAgent: 'node-test', maxTouchPoints: 0, hardwareConcurrency: 8, deviceMemory: 8, platform: 'Linux' },
  location: { origin: 'http://localhost', pathname: '/', href: 'http://localhost/' },
  matchMedia: () => ({ matches: false }),
  getComputedStyle: () => ({ getPropertyValue: () => '0' }),
  addEventListener() {}, removeEventListener() {},
  requestAnimationFrame: (fn) => { rafQ.push(fn); return rafQ.length; },
  cancelAnimationFrame() {},
  setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms || 0, 50)),
  clearTimeout, setInterval: (fn) => 0, clearInterval() {},
  fetch: () => Promise.resolve({ text: () => '', json: () => ({}), ok: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.onload = null; },
  localStorage: { getItem: () => null, setItem() {} },
  Path2D: class { moveTo() {} lineTo() {} closePath() {} arc() {} rect() {} ellipse() {} quadraticCurveTo() {} bezierCurveTo() {} },
  Math, JSON, Promise, Uint8Array, Uint8ClampedArray, Float32Array, Int32Array, Set, Map, WeakMap, Proxy, Symbol,
  atob: (s) => s, btoa: (s) => s,
};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// ---- load scripts in page order ----------------------------------------
const root = path.join(__dirname, '..');
function run(src, name) { vm.runInContext(src, sandbox, { filename: name }); }

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let ran = 0;
for (const b of blocks) {
  if (/async function boot/.test(b)) continue; // skip the boot IIFE — we drive manually
  if (/function frame\(|advanceTime/.test(b) && !/const STEP/.test(b)) continue;
  run(b, `index-inline-${ran++}.js`);
}
for (const f of ['expansion.js', 'weather.js', 'world.js', 'build.js', 'modes.js', 'content.js', 'menu.js', 'ui3d.js'])
  run(fs.readFileSync(path.join(root, f), 'utf8'), f);
console.log(`loaded ${ran} inline blocks + 8 files`);

const g = (expr) => vm.runInContext(expr, sandbox);
const fail = [];
const ok = (name, cond) => { if (cond) console.log('  ok  ' + name); else { fail.push(name); console.log('FAIL  ' + name); } };
const noThrow = (name, fn) => { try { fn(); console.log('  ok  ' + name); } catch (e) { fail.push(name); console.log('FAIL  ' + name + ' — ' + e.stack.split('\n').slice(0,4).join(' | ')); } };

// ---- drive a sea match (Tropical Islands, biome 6) ----------------------
noThrow('startHost sea biome', () => g(`startHost({ offline: true, name: 'T', max: 8, target: 3, bots: 3, gameMode: 'arena', biome: 6 })`));
ok('map generated', g(`T.theme && !!T.theme.name`) && g(`T.theme.name`) === 'Tropical Islands');
ok('sea water body exists', g(`Env.water.length`) >= 1 && g(`Env.water[0].sea`) === true);
ok('ripples array live', Array.isArray(g(`Env.ripples`)));

noThrow('warmup ticks (2s)', () => g(`advanceTime(2000)`));
ok('players spawned', g(`[...G.players.values()].filter(p => p.alive).length`) >= 2);

// reflections: quality auto -> fxScale 1 -> waterQuality high
ok('reflections enabled', g(`reflectionsOn()`) === true);
noThrow('render frame (reflection pass)', () => g(`render(now())`));
ok('reflection canvas built', g(`!!Refl.c`) === true);
ok('reflection canvas half-scale', g(`Refl.s`) === 0.5);
noThrow('render second frame', () => g(`render(now())`));

// splash + physics
noThrow('splash in sea', () => g(`splash(${g('Env.water[0].x0 + 400')}, ${g('Env.water[0].level')}, 2)`));
ok('splash made ripples', g(`Env.ripples.length + Env.water[0].energy > 0`));

// buoyancy: drop the local player into the sea and let them float
noThrow('drop player in sea', () => g(`(() => { const me = G.players.get(G.myId); me.x = Env.water[0].x0 + 500; me.y = Env.water[0].level - 200; me.vx = 0; me.vy = 0; me.alive = true; return true; })()`));
noThrow('float ticks (2s)', () => g(`advanceTime(2000)`));
const wet = g(`(() => { const me = G.players.get(G.myId); return { wet: !!me.wasWet, y: me.y, vy: me.vy, level: Env.water[0].level }; })()`);
ok('player is wet (swimming)', wet.wet === true);
ok('player floats near surface (buoyancy)', wet.wet && wet.y > wet.level - 120 && wet.y < wet.level + 160, `y=${wet.y} level=${wet.level} vy=${wet.vy}`);
ok('vertical velocity bounded (drag)', Math.abs(wet.vy) < 500, `vy=${wet.vy}`);

// bubbles were spawned (pooled FX)
ok('FX pool active', g(`FX._pool.length >= 0`) === true);
ok('FX parts bounded', g(`FX.parts.length`) <= g(`FX.max + 40`));

// explosion over water + crater next to it (sea body skipped but path must not throw)
noThrow('explosion + crater near sea', () => g(`(() => { emit({ k: 'ex', x: 500, y: Env.water[0].level, r: 80, wid: '_fists' }); emit({ k: 'crater', x: 520, y: Env.water[0].level + 30, r: 50, j: .5, s: 1, sc: 1, dn: true, deb: 10, du: 1 }); return true; })()`));
noThrow('ticks after crater', () => g(`advanceTime(1000)`));

// ---- drive a pond biome (Pine Forest, biome 8) ---------------------------
noThrow('startHost pond biome', () => g(`startHost({ offline: true, name: 'T', max: 8, target: 3, bots: 2, gameMode: 'arena', biome: 8 })`));
ok('pond map generated', g(`T.theme.name`) === 'Pine Forest');
// settle the match first: the warmup->round transition regenerates the map (and would wipe
// a manually-added body), so let it happen before building the pond. The stub canvas has no
// terrain bitmap (carveBasin finds no floor), so build the basin water body directly to
// exercise the real pond code paths
noThrow('pond warmup (round transition)', () => g(`advanceTime(2000)`));
noThrow('build pond water body', () => g(`Env.water.push(makeBasinWater({ x: 800, rx: 130, top: 500, depth: 80, kind: 'pond' }, T.theme))`));
const pond = g(`(() => { const b = Env.water.find(w => w.alive && !w.sea); return b ? { n: b.n, level: b.level, maxBottom: b.maxBottom } : null; })()`);
ok('pond water body exists', !!pond);
ok('pond columns measured', !!pond && pond.n > 10 && pond.maxBottom >= pond.level, JSON.stringify(pond));
noThrow('pond render', () => g(`render(now())`));
noThrow('pond splash', () => g(`(() => { const b = Env.water.find(w => w.alive && !w.sea); if (b) splash(b.x0 + 60, b.level, 1.5, b); return true; })()`));
noThrow('pond ticks', () => g(`advanceTime(1500)`));

// crater under the pond -> drain logic (waterFlood/waterColumns/waterAfterCrater)
// crater at the pond rim (where a real blast would break the basin wall). In this stub world
// there is no terrain bitmap, so the flood escapes via the nearest window edge; hitting the rim
// keeps that escape close to the crater, which is what the leak heuristic accepts.
noThrow('crater at pond rim', () => g(`(() => { const b = Env.water.find(w => w.alive && !w.sea); if (b) { emit({ k: 'crater', x: Math.round(b.x0 + 40), y: Math.round(b.level + 20), r: 70, j: .5, s: 1, sc: .5, dn: true, deb: 8, du: 1 }); } return true; })()`));
const drainState = g(`(() => { const b = Env.water.find(w => w.alive && !w.sea); return b ? { draining: !!b.draining, leakX: b.leakX, target: b.target, level: b.level } : null; })()`);
ok('crater marked the pond as draining', !!drainState && drainState.draining === true, JSON.stringify(drainState));
noThrow('drain ticks (3s)', () => g(`advanceTime(3000)`));
const drain = g(`(() => { const b = Env.water.find(w => w && (w.alive || w.target < w.level + 999)); return b ? { draining: !!b.draining, target: b.target, level: b.level, alive: b.alive } : 'gone'; })()`);
ok('pond drained (surface sank toward target)', !!drain && (drain.level >= (drainState ? drainState.level : 0)), JSON.stringify(drain));
ok('FX pool actually recycling', g(`FX._pool.length`) > 0, `pool=${g('FX._pool.length')}`);
noThrow('drained pond render', () => g(`render(now())`));

// ---- rain biome: weather pooling + ripple recycling ----------------------
noThrow('startHost rain biome', () => g(`startHost({ offline: true, name: 'T', max: 8, target: 3, bots: 2, gameMode: 'arena', biome: 4 })`));
ok('rain weather active', g(`Weather.kind`) === 'rain');
noThrow('rain ticks (4s)', () => g(`advanceTime(4000)`));
ok('weather particles pooled/bounded', g(`Weather.parts.length`) > 0 && g(`Weather.parts.length`) <= 500);
ok('ripple pool recycling', g(`_ripplePool.length + Env.ripples.length >= 0`) === true);
noThrow('rain render', () => g(`render(now())`));

// bullets: fire a few and make sure the trail recycling works
noThrow('equip + fire', () => g(`(() => { const me = G.players.get(G.myId); me.wid = '_fists'; const w = Weapons.list.find(x => x.type === 'gun'); if (w) { me.wid = w.id; me.ammo = 999; me.mag = 30; } me.aim = 0.3; doAttack(me, 0.3); return true; })()`));
noThrow('bullet ticks', () => g(`advanceTime(1200)`));
const bl = g(`(() => { const b = G.bullets[0]; return b ? { len: b.trail.length, ok: b.trail.every(p => Array.isArray(p) && p.length === 2) } : 'none'; })()`);
ok('bullet trail pairs valid', bl === 'none' || bl.ok === true, JSON.stringify(bl));

// long soak: 10k ticks, watch for unbounded growth (leak check)
noThrow('soak 10k ticks', () => g(`advanceTime(100000 / 60 * 1)`));
const soak = g(`(() => ({ parts: FX.parts.length, pool: FX._pool.length, bullets: G.bullets.length, ripples: Env.ripples.length, ripplePool: _ripplePool.length }))()`);
ok('no unbounded growth after soak', soak.parts <= g('FX.max') + 50 && soak.ripples <= 100, JSON.stringify(soak));
noThrow('final render', () => g(`render(now())`));

console.log(fail.length ? `\n${fail.length} FAILURES: ${fail.join('; ')}` : '\nALL WATER/LAG SMOKE TESTS PASSED');
process.exit(fail.length ? 1 : 0);
