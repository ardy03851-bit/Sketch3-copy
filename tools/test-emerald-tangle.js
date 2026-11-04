#!/usr/bin/env node
/* Smoke test for biomes/emerald-tangle: run the Biome() call, every newProps art
   function and every hook against mocked ink helpers and a no-op canvas. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

// ---- no-op 2D context -------------------------------------------------
const noopCtx = new Proxy({}, { get(t, k) {
  if (k === Symbol.toPrimitive) return () => 0;
  return (typeof k === 'string' && /^(createLinearGradient|createRadialGradient|createPattern|measureText)$/.test(k))
    ? () => ({ addColorStop() {}, width: 0 })
    : (...a) => noopCtx;
}, set() { return true; } });

// ---- mocked globals ---------------------------------------------------
let calls = 0;
const R = () => 0.42;
const sandbox = {
  console,
  TAU: Math.PI * 2, INK: '#1f1c24', W: 1600, H: 1000, CELL: 20, GW: 80, GH: 50,
  T: { theme: { deep: '#24341c', mid: '#46622c', cap: '#9cc45c', far: ['#7aae82', '#578a64'] }, grid: new Uint8Array(80 * 50), seed: 7 },
  rgbaC: (c, a) => `rgba(${c},${a})`,
  mix: (a, b) => a, lit: c => c, shade: c => c, rgba: (c, a) => [c, a],
  fbm: () => 0.5, lerp: (a, b, t) => a + (b - a) * t, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  rng: () => R, hash: () => 0.5, smoothPath: () => {},
  lobed: () => { calls++; }, marks: () => {}, dots: () => {},
  taperTrunk: () => {}, branch: () => {}, wobblyPoly: () => {},
  inkPiece: (sp, spec) => { calls++; if (typeof spec.shape !== 'function') throw new Error('shape missing'); spec.shape(noopCtx); if (spec.detail) spec.detail(noopCtx); },
  waterAt: () => null, hitGround: () => false, wind: () => 10,
  softSprite: () => ({}), mkCanvas: () => ({ width: 64, height: 64 }),
  Weather: { register: (n, d) => { sandbox._weather[n] = d; } },
  _weather: {}, _def: null,
};
sandbox.Biome = d => { sandbox._def = d; };

const src = fs.readFileSync(path.join(__dirname, '..', 'biomes', 'emerald-tangle', 'emerald-tangle.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'emerald-tangle.js' });

const def = sandbox._def;
const fail = [];
const ok = (name, fn) => { try { fn(); console.log('  ok  ' + name); } catch (e) { fail.push(name + ': ' + e.message); console.log('FAIL  ' + name + ' — ' + e.message); } };

console.log('Biome def: ' + (def ? def.name : 'NONE') + ' (order ' + def.order + ')');
console.log('props: ' + def.props.map(p => p[0] + '@' + p[1]).join(', '));
console.log('newProps: ' + Object.keys(def.newProps).join(', '));
console.log('newWeather: ' + Object.keys(def.newWeather).join(', '));

// weather def (content.js registers def.newWeather through Weather.register)
ok('weather bloomdrift update+draw', () => {
  const w = def.newWeather.bloomdrift;
  const p = { x: 10, y: 10, t: 0, s: 1, r: 0, kind: 0 };
  w.spawn(p, { y1: 500 }, false);
  w.update(p, 0.016);
  w.draw(noopCtx, [p, Object.assign({}, p, { kind: 1 })]);
});

// every prop art function, 3 variants, flipped sizes
for (const [kind, spec] of Object.entries(def.newProps)) {
  ok('art ' + kind, () => {
    for (let v = 0; v < 3; v++) {
      const sp = { S: 1.8, M: 12, c: { width: 400, height: 400 }, x: noopCtx, w: spec.w, h: spec.h };
      spec.art(sp, { R, th: sandbox.T.theme, v, cx: spec.w / 2, w: spec.w, h: spec.h, kind });
    }
  });
}

// hooks
ok('background(ctx)', () => def.background({ x: noopCtx, R, W: 1600, H: 1000, M: 520, big: false, fbm: () => 0.5, th: sandbox.T.theme, seed: 7 }));
ok('treeLine(ctx)', () => def.treeLine({ x: noopCtx, R, th: sandbox.T.theme, M: 520, col: '#556', edge: '#334', gyAt: () => 700 }));
ok('texture(ctx)', () => def.texture({ c: noopCtx, R, W: 1600, H: 1000 }));

console.log(fail.length ? '\n' + fail.length + ' FAILURES' : '\nALL PASS');
process.exit(fail.length ? 1 : 0);
