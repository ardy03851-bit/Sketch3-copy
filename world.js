'use strict';
/* =====================================================================
   INKBRAWL WORLD — loaded after expansion.js.
     A. colour helpers + the ink toolkit (one consistent hand-inked look)
     B. prop catalogue: every tree, plant, rock and object is drawn here
     C. placement: clusters, back layer, grass tufts, critters
     D. physics-based destruction (rigid-body debris, snapping, shattering)
     E. props interplay (bullets, blasts, fire, undercutting) + events
     F. new biomes + background tree lines
   Everything is drawn with the same rules: one ink outline around the
   whole silhouette (thicker on the shadow side), a slightly misregistered
   fill, a single light gradient from the sun side and hatching in shadow.
   ===================================================================== */

/* ---------- A. colours + ink toolkit ---------- */
function colArr(c) {
  if (Array.isArray(c)) return c; c = String(c || '#000');
  if (c[0] === '#') return hexToRgb(c);
  const m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
}
const toHex = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function mix(a, b, t) { const A = colArr(a), B = colArr(b); return toHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]); }
function lit(c, amt) { return mix(c, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt)); }
function rgbaC(c, a) { const A = colArr(c); return `rgba(${A[0] | 0},${A[1] | 0},${A[2] | 0},${a})`; }

const Ink = {
  bufs: [],
  buf(i, w, h) { let c = this.bufs[i]; if (!c) c = this.bufs[i] = mkCanvas(w, h); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, w, h); return c; },
  hatch: null,
  hatchPattern(x) { if (!this.hatch) { const c = mkCanvas(12, 12), h = c.getContext('2d'); h.strokeStyle = 'rgba(31,28,36,.55)'; h.lineWidth = 1.1; h.beginPath(); for (let k = -12; k < 24; k += 6) { h.moveTo(k, 12); h.lineTo(k + 12, 0); } h.stroke(); this.hatch = c; } return x.createPattern(this.hatch, 'repeat'); }
};
/* Draws one inked piece onto the sprite. spec.shape(ctx) fills the silhouette
   (strokes count too) in sprite units; detail(ctx) draws clipped marks.
   spec.layer: 'leaf' draws the piece onto the swaying leaf layer (if the sprite
   has one — see propSprite); anything else lands on the static base layer. */
function inkPiece(sp, spec) {
  const S = sp.S, M = sp.M, cw = sp.cw, ch = sp.ch;
  const m = Ink.buf(0, cw, ch), mx = m.getContext('2d'); mx.setTransform(S, 0, 0, S, M * S, M * S); mx.fillStyle = '#000'; mx.strokeStyle = '#000'; mx.lineJoin = 'round'; mx.lineCap = 'round'; spec.shape(mx);
  const lw = (spec.line ?? 2.3) * S;
  const b = Ink.buf(2, cw, ch), bx = b.getContext('2d'); bx.drawImage(m, 0, 0); bx.globalCompositeOperation = 'source-in'; bx.fillStyle = spec.fill; bx.fillRect(0, 0, cw, ch); bx.globalCompositeOperation = 'source-atop';
  const [gx0, gy0, gx1, gy1] = spec.box || [0, 0, sp.w, sp.h];
  const g = bx.createLinearGradient((M + gx0) * S, (M + gy0) * S, (M + gx1) * S, (M + gy1) * S); g.addColorStop(0, rgbaC(spec.light || lit(spec.fill, .35), .55)); g.addColorStop(.45, rgbaC(spec.fill, 0)); g.addColorStop(1, rgbaC(spec.dark || lit(spec.fill, -.35), .45)); bx.fillStyle = g; bx.fillRect(0, 0, cw, ch);
  const d = (spec.rim ?? 4) * S;
  if (d > 0) { const sh = Ink.buf(3, cw, ch), sx = sh.getContext('2d'); sx.drawImage(m, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = spec.dark || lit(spec.fill, -.3); sx.fillRect(0, 0, cw, ch); sx.globalCompositeOperation = 'destination-out'; sx.drawImage(m, -d, -d * 1.15);
    bx.globalAlpha = .9; bx.drawImage(sh, 0, 0); bx.globalAlpha = 1;
    if (spec.hatch !== false) { const ht = Ink.buf(4, cw, ch), hx = ht.getContext('2d'); hx.fillStyle = Ink.hatchPattern(hx); hx.save(); hx.scale(S / 1.6, S / 1.6); hx.fillRect(0, 0, cw * 1.6 / S, ch * 1.6 / S); hx.restore(); hx.globalCompositeOperation = 'destination-in'; hx.drawImage(sh, 0, 0); bx.globalAlpha = spec.hatchA ?? .5; bx.drawImage(ht, 0, 0); bx.globalAlpha = 1; } }
  if (spec.detail) { bx.setTransform(S, 0, 0, S, M * S, M * S); bx.lineJoin = 'round'; bx.lineCap = 'round'; spec.detail(bx); bx.setTransform(1, 0, 0, 1, 0, 0); }
  // compose the finished piece in its own buffer, then blit it to the layer(s)
  const pc = Ink.buf(5, cw, ch), px = pc.getContext('2d');
  if (lw > 0) { const ink = Ink.buf(1, cw, ch), ix = ink.getContext('2d'); ix.drawImage(m, 0, 0); ix.globalCompositeOperation = 'source-in'; ix.fillStyle = spec.ink || INK; ix.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; const k = 1 + .55 * Math.max(0, Math.cos(a - .85)); px.drawImage(ink, Math.cos(a) * lw * k, Math.sin(a) * lw * k); } }
  const mr = spec.misreg ?? .7;
  px.drawImage(b, -mr * S, -mr * .7 * S);
  const tgt = (spec.layer === 'leaf' && sp.leafX) ? sp.leafX : (sp.baseX || sp.x);
  // pc is already at layer pixel resolution (cw × ch): blit it 1:1. The layer
  // context still carries the sprite-unit transform (S scale + margin), and
  // drawing through it would scale every piece up by S again and push most of
  // the art outside the canvas (giant leaves, cut-off trees, stretched plants).
  if (tgt) { tgt.save(); tgt.setTransform(1, 0, 0, 1, 0, 0); tgt.drawImage(pc, 0, 0); tgt.restore(); }
}
/* scalloped outline: alternating outer/inner points through smoothPath */
function lobed(x, cx, cy, rx, ry, n, R, depth = .16, rot = 0) {
  const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU; const r = i % 2 ? 1 - depth * (.6 + R() * .6) : 1 + (R() - .5) * .12; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  x.beginPath(); smoothPath(x, pts); x.fill();
}
function wobblyPoly(x, pts, close = true) { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); if (close) x.closePath(); }
function taperTrunk(x, cx, base, top, w0, w1, lean = 0, flare = 1) {
  x.beginPath(); x.moveTo(cx - w0 * (1 + .5 * flare), base + 1); x.quadraticCurveTo(cx - w0 * .9, base - 6, cx - w0 * .8, base - 14);
  x.quadraticCurveTo(cx - w1 + lean * .4, (base + top) / 2, cx - w1 + lean, top); x.lineTo(cx + w1 + lean, top);
  x.quadraticCurveTo(cx + w1 + lean * .4, (base + top) / 2, cx + w0 * .8, base - 14); x.quadraticCurveTo(cx + w0 * .9, base - 6, cx + w0 * (1 + .5 * flare), base + 1); x.closePath(); x.fill();
}
function branch(x, x0, y0, x1, y1, w0, w1, bend = 0) {
  const steps = 6; const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1;
  for (let i = 0; i < steps; i++) { const t0 = i / steps, t1 = (i + 1) / steps; const b0 = Math.sin(t0 * Math.PI) * bend, b1 = Math.sin(t1 * Math.PI) * bend;
    x.lineWidth = lerp(w0, w1, t0); x.beginPath(); x.moveTo(lerp(x0, x1, t0) + nx / L * b0, lerp(y0, y1, t0) + ny / L * b0); x.lineTo(lerp(x0, x1, t1) + nx / L * b1, lerp(y0, y1, t1) + ny / L * b1); x.stroke(); }
}
function marks(x, R, n, x0, y0, x1, y1, col, lw = 1.1, len = 6, kind = 'c') {
  x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
  for (let i = 0; i < n; i++) { const px = lerp(x0, x1, R()), py = lerp(y0, y1, R());
    if (kind === 'c') { x.moveTo(px + len * .6, py); x.arc(px, py, len * .6, .1, 1.7); }
    else if (kind === 'v') { x.moveTo(px - len * .5, py - len * .3); x.lineTo(px, py + len * .2); x.lineTo(px + len * .5, py - len * .3); }
    else if (kind === '|') { x.moveTo(px, py); x.lineTo(px + (R() - .5) * 2, py + len); }
    else { x.moveTo(px, py); x.lineTo(px + len, py + (R() - .5) * 2); } }
  x.stroke();
}
function dots(x, R, n, x0, y0, x1, y1, col, r0 = 1.5, r1 = 3) { x.fillStyle = col; x.beginPath(); for (let i = 0; i < n; i++) { const px = lerp(x0, x1, R()), py = lerp(y0, y1, R()), r = lerp(r0, r1, R()); x.moveTo(px + r, py); x.arc(px, py, r, 0, TAU); } x.fill(); }

/* ---------- B. prop catalogue ---------- */
const PropArt = new Map();
const woodOf = th => mix('#6e4c36', th.deep || '#33291f', .2);
const leafOf = (th, k = 0) => mix(th.leafTone || th.cap, th.night ? '#1d2a3a' : '#2b4a22', .18 + k);
const PROPS = {
  oak: { w: 168, h: 184, tree: 1, mat: 'wood', leafy: 1, hp: 120, art: artBroadleaf },
  autumn: { w: 168, h: 184, tree: 1, mat: 'wood', leafy: 1, hp: 120, art: artBroadleaf },
  cherry: { w: 172, h: 170, tree: 1, mat: 'wood', leafy: 1, hp: 110, art: artBroadleaf },
  birch: { w: 120, h: 206, tree: 1, mat: 'wood', leafy: 1, hp: 90, leafAnchor: [.5, .3], art: artBirch },
  willow: { w: 190, h: 190, tree: 1, mat: 'wood', leafy: 1, hp: 130, leafAnchor: [.5, .28], art: artWillow },
  acacia: { w: 210, h: 172, tree: 1, mat: 'wood', leafy: 1, hp: 120, leafAnchor: [.5, .3], art: artAcacia },
  baobab: { w: 140, h: 176, tree: 1, mat: 'wood', leafy: 1, hp: 200, leafAnchor: [.5, .3], art: artBaobab },
  pine: { w: 104, h: 204, tree: 1, mat: 'wood', leafy: 1, hp: 110, leafAnchor: [.5, .55], art: artPine },
  snowpine: { w: 104, h: 204, tree: 1, mat: 'wood', leafy: 1, hp: 110, leafAnchor: [.5, .55], art: artPine },
  palm: { w: 176, h: 222, tree: 1, mat: 'wood', leafy: 1, hp: 100, leafAnchor: [.5, .22], art: artPalm },
  dead: { w: 126, h: 164, tree: 1, mat: 'wood', hp: 70, art: artDead },
  bamboo: { w: 78, h: 236, tree: 1, mat: 'wood', leafy: 1, hp: 80, leafAnchor: [.5, .45], art: artBamboo },
  giantshroom: { w: 128, h: 150, tree: 1, mat: 'soft', hp: 90, bounce: 128 * .78, bounceH: 112, art: artGiantShroom, glow: 'rgba(170,230,255,1)', glowNight: 1 },
  cactus: { w: 80, h: 118, tree: 1, mat: 'soft', hp: 70, noBurn: 1, art: artCactus },
  bush: { w: 92, h: 52, small: 1, mat: 'leaf', leafy: 1, hp: 30, art: artBush },
  fern: { w: 84, h: 56, small: 1, mat: 'leaf', leafy: 1, hp: 20, art: artFern },
  reeds: { w: 66, h: 80, small: 1, mat: 'leaf', leafy: 1, hp: 15, art: artReeds },
  lavender: { w: 74, h: 54, small: 1, mat: 'leaf', leafy: 1, hp: 15, art: artLavender },
  flowers: { w: 56, h: 38, small: 1, mat: 'leaf', leafy: 1, hp: 10, art: artFlowers },
  tallgrass: { w: 66, h: 58, small: 1, mat: 'leaf', leafy: 1, hp: 10, art: artTallGrass },
  mushroom: { w: 58, h: 50, small: 1, mat: 'soft', hp: 40, bounce: 54 * .5, bounceH: 38, art: artMushroom },
  pumpkin: { w: 50, h: 40, small: 1, mat: 'soft', hp: 35, art: artPumpkin, glow: 'rgba(255,170,70,1)', glowNight: 1 },
  rock: { w: 76, h: 46, mat: 'stone', hp: 200, noBurn: 1, art: artRock },
  gravestone: { w: 44, h: 60, mat: 'stone', hp: 120, noBurn: 1, art: artGrave },
  pillar: { w: 56, h: 150, tree: 1, mat: 'stone', hp: 220, noBurn: 1, art: artPillar },
  crystal: { w: 66, h: 86, mat: 'crystal', hp: 90, noBurn: 1, art: artCrystal, glow: 'rgba(170,150,255,1)' },
  barrel: { w: 36, h: 46, mat: 'metal', hp: 1, explode: 1, noBurn: 1, art: artBarrel },
  crate: { w: 44, h: 42, mat: 'wood', hp: 40, art: artCrate },
  lamp: { w: 46, h: 132, mat: 'metal', hp: 60, noBurn: 1, art: artLamp, glow: 'rgba(255,214,140,1)', glowAt: [14, 108] },
  lantern: { w: 46, h: 118, mat: 'wood', hp: 40, art: artLantern, glow: 'rgba(255,160,90,1)', glowAt: [12, 92] }
};
/* giant variants: the same art at 3x size and 3x hp — the art functions read
   d.w/d.h so they scale up naturally, and d.giant boosts the detail counts.
   placeProps rolls one of these instead of the normal kind ~6% of the time. */
for (const _k of ['oak', 'pine', 'palm', 'bamboo', 'cherry', 'birch', 'willow', 'acacia', 'baobab', 'bush', 'fern', 'reeds', 'lavender', 'flowers', 'tallgrass', 'mushroom', 'pumpkin']) {
  const b = PROPS[_k]; if (!b) continue;
  const g = Object.assign({}, b, { w: Math.round(b.w * 3), h: Math.round(b.h * 3), hp: b.hp * 3, giant: 1, art: (sp, d) => b.art(sp, Object.assign({}, d, { kind: _k, giant: 1 })) });
  if (b.bounce) { g.bounce = b.bounce * 3; g.bounceH = b.bounceH * 3; }
  PROPS['giant_' + _k] = g;
}
const PROP_SIZE = new Proxy({}, { get: (_, k) => { const d = PROPS[k]; return d ? [d.w, d.h] : [40, 40]; } });
const TREES = new Set(Object.keys(PROPS).filter(k => PROPS[k].tree));
const SPRITE_M = 8;
/* iPads (and low-memory devices) get a smaller sprite scale: Safari caps total
   canvas memory hard, and lush biomes with many custom props blow past it. */
const IS_PAD = (() => { try { return navigator.maxTouchPoints > 1 && !/iPhone|Android/.test(navigator.userAgent); } catch (e) { return false; } })();
function spriteScale() { return IS_PAD || deviceTier === 0 || Settings.graphics === 'low' ? 1.35 : deviceTier === 1 ? 1.5 : 1.8; }
function propArtMax() { return deviceTier === 0 ? 70 : deviceTier === 1 ? 105 : 140; }
function freeSprite(sp) { if (!sp) return; try { if (sp.base) sp.base.width = 0; if (sp.leaf) sp.leaf.width = 0; if (sp._comb) sp._comb.width = 0; if (sp.flat && sp.c) sp.c.width = 0; } catch (e) { } }
/* Builds (and caches) a prop sprite. Leafy props are built as TWO layers —
   sp.base (trunk/stem) and sp.leaf (the canopy) — so the canopy can sway on
   its own at draw time. sp.c (the flattened trunk+leaf sprite, used by
   cutPiece / makeStump / debris) is composed lazily on first access, so the
   split costs no extra steady-state memory. */
function propSprite(kind, variant, th, haze = 0) {
  const key = kind + '|' + variant + '|' + th.name + '|' + haze; let sp = PropArt.get(key);
  if (sp) { PropArt.delete(key); PropArt.set(key, sp); return sp; } // LRU touch
  const def = PROPS[kind] || PROPS.rock;
  const S = Math.min(spriteScale(), def.giant ? 1.4 : 9), M = SPRITE_M; const w = def.w, h = def.h;
  const cw = Math.ceil((w + M * 2) * S), ch = Math.ceil((h + M * 2) * S);
  sp = { S, M, w, h, key, cw, ch };
  const mkLayer = () => { const cc = mkCanvas(cw, ch), xx = cc.getContext('2d'); xx.setTransform(S, 0, 0, S, M * S, M * S); xx.lineJoin = 'round'; xx.lineCap = 'round'; return [cc, xx]; };
  let c, x;
  if (def.leafy) { // split sprite: base + leaf layers
    const [bc, bx] = mkLayer(), [lc, lx] = mkLayer();
    sp.base = bc; sp.leaf = lc; sp.baseX = bx; sp.leafX = lx; c = bc; x = bx;
  } else { const [cc, xx] = mkLayer(); c = cc; x = xx; sp.flat = 1; }
  sp.c = c; sp.x = x;
  const R = rng((hash(variant + 11, kind.length * 31 + kind.charCodeAt(0), th.name.length) * 1e9) | 0);
  try { def.art(sp, { R, th, v: variant, cx: w / 2, w, h, kind }); } catch (e) { console.warn('prop art', kind, e); }
  // atmospheric grade: every prop sits in its biome's light
  const grade = xx => { xx.setTransform(1, 0, 0, 1, 0, 0); xx.globalCompositeOperation = 'source-atop'; xx.fillStyle = rgbaC(th.skyB, (th.night ? .1 : .07) + haze * .4); xx.fillRect(0, 0, cw, ch); if (th.night) { xx.fillStyle = 'rgba(40,46,90,.16)'; xx.fillRect(0, 0, cw, ch); } xx.globalCompositeOperation = 'source-over'; };
  if (def.leafy) {
    grade(sp.baseX); grade(sp.leafX);
    // flattened sprite on demand (destruction time only) — keeps memory flat
    Object.defineProperty(sp, 'c', { configurable: true, get() { if (!sp._comb) { const comb = mkCanvas(cw, ch), cx2 = comb.getContext('2d'); cx2.drawImage(sp.base, 0, 0); cx2.drawImage(sp.leaf, 0, 0); grade(cx2); sp._comb = comb; } return sp._comb; } });
    sp.x = sp.baseX = sp.leafX = null;
  } else { grade(x); sp.x = null; }
  PropArt.set(key, sp);
  const cap = propArtMax();
  while (PropArt.size > cap) { const k = PropArt.keys().next().value; freeSprite(PropArt.get(k)); PropArt.delete(k); }
  return sp;
}
/* --- art --- */
function artBroadleaf(sp, d) {
  const { R, th, v, cx, w, h, kind } = d; const gi = d.giant ? 2 : 1; const wood = kind === 'cherry' ? mix('#5a3b3a', th.deep, .15) : woodOf(th);
  const pal = kind === 'autumn' ? [['#c9542f', '#e3923a'], ['#b8452c', '#d9733a'], ['#d58a2c', '#ecb44a'], ['#a8442f', '#cf6a35']][v % 4]
    : kind === 'cherry' ? ['#e58fac', '#f7c9d7'] : [leafOf(th, .08), lit(leafOf(th), .16)];
  const crownY = h * .38, lean = (R() - .5) * 10;
  const limbs = [[-38 - R() * 10, crownY + 8, 6], [34 + R() * 10, crownY + 2, 6], [lean - 4, crownY - 28, 5]];
  inkPiece(sp, { fill: wood, rim: 3, shape: x => { taperTrunk(x, cx, h, crownY + 10, 13, 7.5, lean); for (const [dx, dy, lw] of limbs) branch(x, cx + lean * .6, h * .6, cx + dx, dy, lw * 1.4, lw * .6, (R() - .5) * 8); },
    detail: x => { marks(x, R, 7 * gi, cx - 8, h * .55, cx + 6, h - 8, rgbaC(INK, .38), 1.1, 9, '|'); x.strokeStyle = rgbaC(INK, .3); x.beginPath(); x.arc(cx + 2, h * .7, 3, 0, TAU); x.stroke(); } });
  const clumps = []; const nC = 6 + (v % 3) + (d.giant ? 4 : 0);
  for (let i = 0; i < nC; i++) { const a = (i / nC) * TAU + R() * .5; const rr = 34 + R() * 12; clumps.push([cx + Math.cos(a) * (36 + R() * 14) + lean * .5, crownY - 4 + Math.sin(a) * (26 + R() * 8), rr]); }
  clumps.push([cx + lean * .5, crownY - 8, 46]);
  inkPiece(sp, { layer: 'leaf', fill: lit(pal[0], -.12), rim: 6, box: [cx - 80, crownY - 70, cx + 80, crownY + 50], shape: x => { for (const [px, py, r] of clumps) lobed(x, px, py, r, r * .86, 6, R, .14, R() * TAU); } });
  const front = clumps.filter((_, i) => i % 2 === 0).map(([px, py, r]) => [px - 6, py - 8, r * .7]);
  inkPiece(sp, { layer: 'leaf', fill: pal[0], light: pal[1], rim: 5, line: 1.8, box: [cx - 70, crownY - 70, cx + 70, crownY + 40], shape: x => { for (const [px, py, r] of front) lobed(x, px, py, r, r * .85, 5, R, .16, R() * TAU); },
    detail: x => { marks(x, R, 16 * gi, cx - 60, crownY - 50, cx + 60, crownY + 30, rgbaC(INK, .32), 1.2, 9, 'c');
      if (kind === 'cherry') dots(x, R, 34 * gi, cx - 64, crownY - 50, cx + 64, crownY + 30, '#fff3f6', 1.4, 2.8);
      else if (kind === 'oak' && v === 2) dots(x, R, 9 * gi, cx - 50, crownY - 30, cx + 50, crownY + 30, '#c9453a', 2, 3.2);
      dots(x, R, 14 * gi, cx - 60, crownY - 56, cx + 20, crownY - 10, rgbaC(pal[1], .7), 2, 4); } });
}
function artBirch(sp, d) {
  const { R, th, v, cx, h } = d; const bark = mix('#f1ece0', th.skyB, .1), leaf = th.leafTone || mix('#b9c45a', th.cap, .35);
  const lean = (R() - .5) * 14, top = h * .2;
  inkPiece(sp, { fill: bark, dark: '#bdb5a5', rim: 2.5, hatch: false, shape: x => { taperTrunk(x, cx, h, top, 8, 4, lean, .4); branch(x, cx + lean * .4, h * .45, cx - 26, h * .3, 4, 1.6, 4); branch(x, cx + lean * .6, h * .35, cx + 28, h * .2, 3.6, 1.4, -4); },
    detail: x => { x.fillStyle = INK; for (let i = 0; i < 9; i++) { const y = h * .25 + R() * h * .7, ww = 3 + R() * 6; x.fillRect(cx + lean * (1 - y / h) - 7 + R() * 6, y, ww, 1.6 + R() * 1.6); } } });
  const gi = d.giant ? 2 : 1;
  const cl = []; for (let i = 0; i < 6 + (d.giant ? 4 : 0); i++) cl.push([cx + lean * .7 + (R() - .5) * 64, h * (.12 + R() * .3), 18 + R() * 12]);
  inkPiece(sp, { layer: 'leaf', fill: lit(leaf, -.08), light: lit(leaf, .3), rim: 4, line: 1.9, shape: x => { for (const [px, py, r] of cl) lobed(x, px, py, r, r * .8, 6, R, .22); },
    detail: x => { marks(x, R, 14 * gi, cx - 50, 0, cx + 50, h * .45, rgbaC(INK, .3), 1, 6, 'v'); dots(x, R, 12 * gi, cx - 46, 0, cx + 30, h * .3, rgbaC(lit(leaf, .45), .8), 1.5, 3); } });
}
function artWillow(sp, d) {
  const { R, th, cx, w, h } = d; const wood = woodOf(th), leaf = mix(th.leafTone || th.cap, '#b4c76a', .3);
  inkPiece(sp, { fill: wood, rim: 3, shape: x => { taperTrunk(x, cx, h, h * .42, 17, 10, (R() - .5) * 8); branch(x, cx, h * .5, cx - 40, h * .3, 8, 3, 6); branch(x, cx, h * .5, cx + 44, h * .32, 8, 3, -6); } });
  const strands = []; for (let i = 0; i < 22 + (d.giant ? 14 : 0); i++) { const a = Math.PI + (i / 21) * Math.PI; strands.push([cx + Math.cos(a) * (70 + R() * 12), h * .3 + Math.sin(a) * 50, h * (.66 + R() * .22)]); }
  inkPiece(sp, { layer: 'leaf', fill: lit(leaf, -.1), light: lit(leaf, .25), rim: 5, line: 1.9, shape: x => { lobed(x, cx, h * .26, 78, 46, 8, R, .12); x.lineWidth = 9; for (const [sx, sy, ey] of strands) { x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + (R() - .5) * 14, (sy + ey) / 2, sx + (R() - .5) * 10, ey); x.stroke(); } },
    detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; for (const [sx, sy, ey] of strands) { x.beginPath(); x.moveTo(sx + 2, sy + 10); x.lineTo(sx + 1, ey - 6); x.stroke(); } marks(x, R, d.giant ? 20 : 10, cx - 60, h * .1, cx + 60, h * .4, rgbaC(INK, .28), 1, 7, 'c'); } });
}
function artAcacia(sp, d) {
  const { R, th, v, cx, w, h } = d; const wood = mix('#6b4a33', th.deep, .2), leaf = mix(th.leafTone || '#7f9a3e', th.cap, .25);
  const topY = h * .28; const forks = [[-58 - R() * 14, topY + 6], [52 + R() * 14, topY + 2], [(R() - .5) * 20, topY - 6]];
  inkPiece(sp, { fill: wood, rim: 3, shape: x => { taperTrunk(x, cx, h, h * .55, 11, 7, (R() - .5) * 10); for (const [dx, y] of forks) branch(x, cx, h * .58, cx + dx, y, 8, 3, (R() - .5) * 12); } });
  inkPiece(sp, { layer: 'leaf', fill: lit(leaf, -.08), light: lit(leaf, .28), rim: 5, line: 2, box: [0, topY - 40, w, topY + 30], shape: x => { lobed(x, cx, topY - 4, 98, 22, 10, R, .2); lobed(x, cx - 40, topY - 14, 50, 16, 6, R, .2); lobed(x, cx + 38, topY - 12, 52, 17, 6, R, .2); },
    detail: x => { marks(x, R, (d.giant ? 40 : 22), cx - 90, topY - 26, cx + 90, topY + 10, rgbaC(INK, .32), 1, 6, 'v'); } });
}
function artBaobab(sp, d) {
  const { R, th, cx, w, h } = d; const wood = mix('#9a7a62', th.top || '#8a6a4f', .3), leaf = mix(th.leafTone || '#7f9a3e', th.cap, .3);
  inkPiece(sp, { fill: wood, rim: 5, shape: x => { x.beginPath(); x.moveTo(cx - 40, h); x.bezierCurveTo(cx - 54, h * .7, cx - 30, h * .42, cx - 20, h * .3); x.lineTo(cx + 20, h * .3); x.bezierCurveTo(cx + 30, h * .42, cx + 56, h * .7, cx + 42, h); x.closePath(); x.fill(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .45; branch(x, cx + (i - 2.5) * 6, h * .32, cx + Math.cos(a) * (40 + R() * 20), h * .3 + Math.sin(a) * (30 + R() * 14), 7, 2.5, (R() - .5) * 8); } },
    detail: x => { x.strokeStyle = rgbaC(INK, .32); x.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const px = cx - 26 + i * 10; x.beginPath(); x.moveTo(px, h - 4); x.quadraticCurveTo(px + (R() - .5) * 10, h * .62, px * .7 + cx * .3, h * .36); x.stroke(); } } });
  const cl = []; for (let i = 0; i < 6 + (d.giant ? 5 : 0); i++) { const a = -Math.PI / 2 + (i - 2.5) * .45; cl.push([cx + Math.cos(a) * (46 + R() * 16), h * .28 + Math.sin(a) * (34 + R() * 10), 13 + R() * 6]); }
  inkPiece(sp, { layer: 'leaf', fill: leaf, rim: 3, line: 1.8, shape: x => { for (const [px, py, r] of cl) lobed(x, px, py, r, r * .7, 5, R, .2); } });
}
function artPine(sp, d) {
  const { R, th, v, cx, w, h, kind } = d; const snow = kind === 'snowpine'; const col = th.icy || snow ? mix('#3d6758', th.mid || '#3d6758', .15) : mix(lit(th.leafTone || th.cap, -.3), '#2f5a3e', .35);
  inkPiece(sp, { fill: woodOf(th), rim: 2, shape: x => taperTrunk(x, cx, h, h * .55, 8, 5, 0, .5) });
  const tiers = d.giant ? 8 : 5; const tierPts = [];
  for (let i = 0; i < tiers; i++) { const ty = 4 + i * (h - 8) / tiers, bw = 16 + i * 9 + R() * 4, by = ty + h * .2; const pts = [[cx, ty]]; const n = 4; for (let k = 1; k <= n; k++) pts.push([cx + bw * k / n, ty + (by - ty) * k / n + (k % 2 ? -4 : 3)]); pts.push([cx + bw * .4, by - 3]); pts.push([cx, by + 2]); pts.push([cx - bw * .4, by - 3]); for (let k = n; k >= 1; k--) pts.push([cx - bw * k / n, ty + (by - ty) * k / n + (k % 2 ? -4 : 3)]); tierPts.push(pts); }
  inkPiece(sp, { layer: 'leaf', fill: col, light: lit(col, .3), rim: 5, box: [cx - 50, 0, cx + 50, h * .9], shape: x => { for (const p of tierPts) { wobblyPoly(x, p); x.fill(); } },
    detail: x => { x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1.1; for (const p of tierPts) { const y = p[0][1] + h * .12; x.beginPath(); x.moveTo(cx - 6, y); x.lineTo(cx - 14, y + 7); x.moveTo(cx + 8, y + 3); x.lineTo(cx + 15, y + 10); x.stroke(); } } });
  if (snow) inkPiece(sp, { layer: 'leaf', fill: '#fbfdff', dark: '#cfdbe6', rim: 2.5, line: 1.5, hatch: false, shape: x => { for (const p of tierPts) { const ty = p[0][1], bw = Math.abs(p[1][0] - cx) * 4 * .82; x.beginPath(); x.moveTo(cx, ty + 1); x.quadraticCurveTo(cx - bw * .35, ty + h * .08, cx - bw * .75, ty + h * .15); x.quadraticCurveTo(cx - bw * .2, ty + h * .1, cx, ty + h * .12); x.quadraticCurveTo(cx + bw * .2, ty + h * .1, cx + bw * .75, ty + h * .15); x.quadraticCurveTo(cx + bw * .35, ty + h * .08, cx, ty + 1); x.fill(); } } });
}
function artPalm(sp, d) {
  const { R, th, v, cx, w, h } = d; const lean = ((v % 3) - 1) * 22 + (R() - .5) * 8; const tx = cx + lean, ty = h * .2; const wood = mix('#a07a4e', th.top || '#a07a4e', .2), leaf = mix('#5f9a3f', th.leafTone || th.cap, .2);
  inkPiece(sp, { fill: wood, rim: 3, shape: x => { x.beginPath(); x.moveTo(cx - 10, h); x.quadraticCurveTo(cx + lean * .1 - 7, h * .55, tx - 5, ty); x.lineTo(tx + 6, ty + 2); x.quadraticCurveTo(cx + lean * .15 + 8, h * .58, cx + 10, h); x.closePath(); x.fill(); },
    detail: x => { x.strokeStyle = rgbaC(INK, .5); x.lineWidth = 1.3; for (let i = 1; i < 11; i++) { const t = i / 11; const yy = h - (h - ty) * t; const xx = cx + lean * Math.pow(t, 1.7); x.beginPath(); x.moveTo(xx - 8, yy + 1); x.quadraticCurveTo(xx, yy + 4, xx + 8, yy - 1); x.stroke(); } } });
  const fr = []; for (let k = 0; k < 8 + (d.giant ? 5 : 0); k++) { const a = Math.PI * 1.02 + k / (8 + (d.giant ? 4 : 0)) * Math.PI * .96 + (R() - .5) * .2; fr.push([a, 64 + R() * 18]); }
  const frond = (x, a, L) => { const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .45 + 30; const mx = (tx + ex) / 2, my = ty + Math.sin(a) * 28 - 24; const pts = [[tx, ty]]; for (let i = 1; i <= 8; i++) { const t = i / 8; const px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * my + t * t * ey; pts.push([px, py - (i % 2 ? 8 : 3) * (1 - t * .7)]); } for (let i = 8; i >= 1; i--) { const t = i / 8; const px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * (my + 14) + t * t * ey; pts.push([px, py + (i % 2 ? 7 : 2) * (1 - t * .7)]); } wobblyPoly(x, pts); x.fill(); };
  inkPiece(sp, { layer: 'leaf', fill: lit(leaf, -.18), rim: 4, line: 1.9, shape: x => { for (const [a, L] of fr.filter((_, i) => i % 2)) frond(x, a, L); } });
  inkPiece(sp, { layer: 'leaf', fill: leaf, light: lit(leaf, .3), rim: 4, line: 1.9, shape: x => { for (const [a, L] of fr.filter((_, i) => i % 2 === 0)) frond(x, a, L * .95); },
    detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; for (const [a, L] of fr) { x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a) * L * .5, ty + Math.sin(a) * 28 - 14, tx + Math.cos(a) * L * .95, ty + Math.sin(a) * L * .45 + 28); x.stroke(); } } });
  inkPiece(sp, { layer: 'leaf', fill: '#6b4a35', rim: 2, line: 1.6, hatch: false, shape: x => { for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(tx - 6 + k * 6, ty + 8 + (k % 2) * 3, 4.6, 0, TAU); x.fill(); } } });
}
function artDead(sp, d) {
  const { R, th, cx, h } = d; const col = th.night ? '#56504a' : mix('#6a5646', th.deep, .2);
  const segs = []; const br = (x0, y0, a, L, dd) => { if (dd > 4 || L < 7) return; const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; segs.push([x0, y0, x1, y1, Math.max(1.6, 11 - dd * 2.4)]); br(x1, y1, a - .42 - R() * .35, L * .7, dd + 1); if (R() < .82) br(x1, y1, a + .38 + R() * .35, L * .66, dd + 1); };
  br(cx, h, -Math.PI / 2 + (R() - .5) * .2, h * .4, 0);
  inkPiece(sp, { fill: col, rim: 2, hatch: false, shape: x => { for (const [a, b, c2, d2, lw] of segs) { x.lineWidth = lw; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d2); x.stroke(); } x.beginPath(); x.moveTo(cx - 16, h); x.quadraticCurveTo(cx - 6, h - 12, cx - 5, h - 30); x.lineTo(cx + 5, h - 30); x.quadraticCurveTo(cx + 6, h - 12, cx + 17, h); x.fill(); },
    detail: x => marks(x, R, 6, cx - 4, h * .6, cx + 3, h - 6, rgbaC(INK, .4), 1, 8, '|') });
}
function artBamboo(sp, d) {
  const { R, th, cx, w, h } = d; const col = mix('#8db255', th.cap, .25); const n = (3 + (R() * 2 | 0)) + (d.giant ? 4 : 0); const st = [];
  for (let i = 0; i < n; i++) st.push([cx + (i - (n - 1) / 2) * 13 + (R() - .5) * 5, h * (.04 + R() * .22), 4.5 + R() * 1.5, (R() - .5) * 10]);
  inkPiece(sp, { fill: col, light: lit(col, .3), rim: 2.5, hatch: false, shape: x => { for (const [sx, top, r, lean] of st) { x.beginPath(); x.moveTo(sx - r, h); x.lineTo(sx - r + lean, top); x.lineTo(sx + r + lean, top); x.lineTo(sx + r, h); x.closePath(); x.fill(); } },
    detail: x => { x.strokeStyle = rgbaC(INK, .6); x.lineWidth = 1.5; for (const [sx, top, r, lean] of st) for (let y = h - 18 - R() * 8; y > top + 8; y -= 22 + R() * 8) { const k = 1 - (h - y) / (h - top); const xx = sx + lean * (1 - k); x.beginPath(); x.moveTo(xx - r - 1, y); x.quadraticCurveTo(xx, y + 2.5, xx + r + 1, y); x.stroke(); } } });
  const leaves = []; for (const [sx, top, r, lean] of st) for (let k = 0; k < (d.giant ? 7 : 4); k++) { const y = top + 10 + R() * h * .35, a = (R() < .5 ? -1 : 1) * (.3 + R() * .6); leaves.push([sx + lean * (1 - (h - y) / (h - top)), y, a, 16 + R() * 10]); }
  inkPiece(sp, { layer: 'leaf', fill: lit(col, -.08), rim: 3, line: 1.5, shape: x => { for (const [lx, ly, a, L] of leaves) { const dir = Math.sign(a); x.beginPath(); x.moveTo(lx, ly); x.quadraticCurveTo(lx + dir * L * .5, ly - 6 + Math.abs(a) * 4, lx + dir * L, ly + Math.abs(a) * 10); x.quadraticCurveTo(lx + dir * L * .5, ly + 4, lx, ly); x.fill(); } } });
}
function artGiantShroom(sp, d) {
  const { R, th, v, cx, w, h } = d; const capC = th.night ? ['#5fb6c9', '#8a7ad8', '#6fc7a5'][v % 3] : ['#d9573b', '#c95b8a', '#e9a23b'][v % 3];
  inkPiece(sp, { fill: '#efe3cb', dark: '#c9b89a', rim: 3, shape: x => { x.beginPath(); x.moveTo(cx - 17, h); x.quadraticCurveTo(cx - 10, h * .7, cx - 12, h * .42); x.lineTo(cx + 12, h * .42); x.quadraticCurveTo(cx + 10, h * .7, cx + 18, h); x.closePath(); x.fill(); },
    detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(cx - 8 + i * 5, h * .48); x.lineTo(cx - 9 + i * 6, h - 4); x.stroke(); } } });
  inkPiece(sp, { fill: '#e8d9bd', rim: 2, line: 1.8, hatch: false, shape: x => { x.beginPath(); x.ellipse(cx, h * .42, w * .38, 9, 0, 0, TAU); x.fill(); }, detail: x => { x.strokeStyle = rgbaC(INK, .35); x.lineWidth = .9; for (let i = -10; i <= 10; i++) { x.beginPath(); x.moveTo(cx + i * 4.4, h * .42 - 6); x.lineTo(cx + i * 3, h * .42 + 4); x.stroke(); } } });
  inkPiece(sp, { fill: capC, light: lit(capC, .4), rim: 6, box: [cx - 60, 0, cx + 60, h * .42], shape: x => { x.beginPath(); x.moveTo(cx - w * .48, h * .4); x.bezierCurveTo(cx - w * .5, h * .05, cx + w * .5, h * .05, cx + w * .48, h * .4); x.quadraticCurveTo(cx, h * .33, cx - w * .48, h * .4); x.fill(); },
    detail: x => { dots(x, R, 7, cx - 40, h * .1, cx + 40, h * .3, '#fff6e6', 3, 7); x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1.1; x.beginPath(); x.arc(cx - 30, h * .2, 6, .3, 1.6); x.stroke(); } });
}
function artCactus(sp, d) {
  const { R, th, v, cx, h } = d; const col = mix('#5f8f4a', th.cap, .12); const a1 = h * (.45 + R() * .15), a2 = h * (.32 + R() * .15);
  inkPiece(sp, { fill: col, light: lit(col, .3), rim: 4, shape: x => { x.lineWidth = 18; x.beginPath(); x.moveTo(cx, a1); x.lineTo(cx - 20, a1); x.quadraticCurveTo(cx - 27, a1, cx - 27, a1 - 9); x.lineTo(cx - 27, a1 - 30); x.stroke(); if (v !== 1) { x.beginPath(); x.moveTo(cx, a2); x.lineTo(cx + 20, a2); x.quadraticCurveTo(cx + 27, a2, cx + 27, a2 - 9); x.lineTo(cx + 27, a2 - 34); x.stroke(); }
      x.beginPath(); x.moveTo(cx - 13, h); x.lineTo(cx - 13, 16); x.quadraticCurveTo(cx, -2, cx + 13, 16); x.lineTo(cx + 13, h); x.closePath(); x.fill(); },
    detail: x => { x.strokeStyle = rgbaC(INK, .38); x.lineWidth = 1.2; x.beginPath(); for (const dx of [-5, 4]) { x.moveTo(cx + dx, 12); x.lineTo(cx + dx, h - 4); } x.stroke(); marks(x, R, 16, cx - 12, 14, cx + 12, h - 8, rgbaC(INK, .55), .9, 3, '-'); if (v === 2) dots(x, R, 1, cx - 2, 2, cx + 2, 6, '#e46a8f', 5, 5.5); } });
}
function artBush(sp, d) {
  const { R, th, v, cx, w, h } = d; const col = th.name === 'Cherry Blossom' ? '#e7a2b6' : mix(leafOf(th, .04), th.cap, .3);
  const cl = [[cx - 22, h - 16, 18], [cx + 18, h - 15, 17], [cx - 2, h - 25, 22], [cx + (R() - .5) * 20, h - 12, 15]];
  if (d.giant) for (let i = 0; i < 5; i++) cl.push([cx + (R() - .5) * 76, h - 14 - R() * 34, 12 + R() * 12]);
  inkPiece(sp, { layer: 'leaf', fill: col, light: lit(col, .3), rim: 5, box: [cx - 40, h - 50, cx + 40, h], shape: x => { for (const [px, py, r] of cl) lobed(x, px, py, r, r * .86, 6, R, .16); x.fillRect(cx - 36, h - 14, 72, 14); },
    detail: x => { marks(x, R, 9 * (d.giant ? 2 : 1), cx - 34, h - 42, cx + 34, h - 8, rgbaC(INK, .32), 1.1, 7, 'c'); if (v === 1) dots(x, R, 7 * (d.giant ? 2 : 1), cx - 30, h - 40, cx + 30, h - 12, '#c9453a', 2, 3); if (v === 2) dots(x, R, 6 * (d.giant ? 2 : 1), cx - 30, h - 40, cx + 30, h - 12, '#f4ead2', 2, 3.4); } });
}
function artFern(sp, d) {
  const { R, th, cx, w, h } = d; const col = mix(leafOf(th, .02), '#5f8d3d', .3); const fr = []; const nF = (d.giant ? 11 : 7); for (let i = 0; i < nF; i++) { const a = -Math.PI + (i + .5) / nF * Math.PI; fr.push([a, 30 + R() * 14]); }
  inkPiece(sp, { layer: 'leaf', fill: col, light: lit(col, .3), rim: 2, line: 1.6, hatch: false, shape: x => { for (const [a, L] of fr) { const ex = cx + Math.cos(a) * L * 1.1, ey = h + Math.sin(a) * L * .95; x.lineWidth = 2.6; x.beginPath(); x.moveTo(cx, h); x.quadraticCurveTo((cx + ex) / 2, ey - 10, ex, ey + 6); x.stroke(); for (let k = 2; k < 9; k++) { const t = k / 9; const px = lerp(cx, ex, t), py = lerp(h, ey + 6, t) - Math.sin(t * Math.PI) * 9; const ll = 7 * (1 - t * .6); x.lineWidth = 3.2 * (1 - t * .5); x.beginPath(); x.moveTo(px, py); x.lineTo(px - ll * .7, py - ll * .7); x.moveTo(px, py); x.lineTo(px + ll * .7, py - ll * .5); x.stroke(); } } } });
}
function artReeds(sp, d) {
  const { R, th, cx, w, h } = d; const col = mix('#7f9a4f', th.cap, .2); const st = []; const nR = (d.giant ? 16 : 8); for (let i = 0; i < nR; i++) st.push(8 + i * (w - 16) / Math.max(1, nR - 1) + R() * 4, 10 + R() * 26, (R() - .5) * 10);
  inkPiece(sp, { layer: 'leaf', fill: col, rim: 0, line: 1.4, hatch: false, shape: x => { for (let i = 0; i < st.length; i += 3) { const bx = st[i], top = st[i + 1], bend = st[i + 2]; x.lineWidth = 2.4; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + bend, h * .5, bx + bend * .6, top); x.stroke(); } } });
  inkPiece(sp, { layer: 'leaf', fill: '#6b4a35', rim: 1.5, line: 1.4, hatch: false, shape: x => { for (let i = 0; i < st.length; i += 3) { if ((i / 3) % 2) { const bx = st[i], top = st[i + 1], bend = st[i + 2]; x.beginPath(); x.ellipse(bx + bend * .6, top + 8, 3.2, 8.5, 0, 0, TAU); x.fill(); } } } });
}
function artLavender(sp, d) {
  const { R, th, cx, w, h } = d; const stem = mix('#7d9a55', th.cap, .3), flower = th.flower || '#9b7fc7'; const st = []; const nL = d.giant ? 18 : 11; for (let i = 0; i < nL; i++) { const a = -Math.PI / 2 + (i - (nL - 1) / 2) * (Math.PI / (nL + 4)) + (R() - .5) * .08; st.push([a, 30 + R() * 18]); }
  inkPiece(sp, { fill: lit(stem, -.1), rim: 2, line: 1.6, hatch: false, shape: x => { lobed(x, cx, h - 6, 26, 9, 6, R, .2); x.lineWidth = 2; for (const [a, L] of st) { x.beginPath(); x.moveTo(cx, h - 6); x.lineTo(cx + Math.cos(a) * L, h - 6 + Math.sin(a) * L); x.stroke(); } } });
  inkPiece(sp, { layer: 'leaf', fill: flower, light: lit(flower, .4), rim: 2, line: 1.4, hatch: false, shape: x => { for (const [a, L] of st) { const ex = cx + Math.cos(a) * L, ey = h - 6 + Math.sin(a) * L; for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(ex - Math.cos(a) * k * 4, ey - Math.sin(a) * k * 4, 2.8, 3.6, a, 0, TAU); x.fill(); } } } });
}
function artFlowers(sp, d) {
  const { R, th, v, cx, w, h } = d; const petal = ['#f4ead2', '#e9a23b', '#e58fac', '#7aa6d9'][v % 4]; const fl = []; for (let i = 0; i < 4; i++) fl.push([cx - 18 + i * 12 + (R() - .5) * 6, h - 16 - R() * 16]);
  inkPiece(sp, { fill: mix('#6f9a4f', th.cap, .3), rim: 0, line: 1.3, hatch: false, shape: x => { x.lineWidth = 2; for (const [fx, fy] of fl) { x.beginPath(); x.moveTo(fx + (R() - .5) * 4, h); x.quadraticCurveTo(fx + 4, (fy + h) / 2, fx, fy); x.stroke(); x.beginPath(); x.ellipse(fx + 4, (fy + h) / 2 + 4, 4, 2, .5, 0, TAU); x.fill(); } } });
  inkPiece(sp, { layer: 'leaf', fill: petal, rim: 1.5, line: 1.4, hatch: false, shape: x => { for (const [fx, fy] of fl) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(fx + Math.cos(a) * 3.6, fy + Math.sin(a) * 3.6, 3.2, 2, a, 0, TAU); x.fill(); } }, detail: x => { for (const [fx, fy] of fl) { x.fillStyle = '#e9a23b'; x.beginPath(); x.arc(fx, fy, 2, 0, TAU); x.fill(); } } });
}
function artTallGrass(sp, d) {
  const { R, th, cx, w, h } = d; const col = th.grassCol ? th.grassCol[0] : mix(th.cap, '#c9a14e', .2);
  inkPiece(sp, { layer: 'leaf', fill: col, light: lit(col, .3), rim: 0, line: 1.3, hatch: false, shape: x => { for (let i = 0; i < (d.giant ? 22 : 13); i++) { const bx = cx + (i - (d.giant ? 10 : 6)) * 3.6 + (R() - .5) * 3, top = 6 + R() * 22, bend = (R() - .5) * 22; x.beginPath(); x.moveTo(bx - 2.4, h); x.quadraticCurveTo(bx + bend * .3, h * .5, bx + bend, top); x.quadraticCurveTo(bx + bend * .3 + 1.5, h * .5, bx + 2.4, h); x.fill(); } } });
}
function artMushroom(sp, d) {
  const { R, th, v, cx, w, h } = d; const capC = th.night ? '#5fb6c9' : v ? '#d9573b' : '#c95b8a';
  inkPiece(sp, { fill: '#f3e8d2', dark: '#cbbb9f', rim: 2, hatch: false, shape: x => { x.beginPath(); x.moveTo(cx - 8, h); x.quadraticCurveTo(cx - 6, h - 18, cx - 7, h - 26); x.lineTo(cx + 7, h - 26); x.quadraticCurveTo(cx + 6, h - 18, cx + 8, h); x.closePath(); x.fill(); } });
  inkPiece(sp, { fill: capC, light: lit(capC, .4), rim: 4, shape: x => { x.beginPath(); x.moveTo(4, h - 22); x.quadraticCurveTo(4, 2, cx, 3); x.quadraticCurveTo(w - 4, 2, w - 4, h - 22); x.quadraticCurveTo(cx, h - 30, 4, h - 22); x.fill(); },
    detail: x => { x.fillStyle = '#fff6e6'; for (const [dx, dy, r] of [[-12, -8, 5], [8, -12, 4], [16, -2, 3.4], [-2, -2, 3]]) { x.beginPath(); x.arc(cx + dx, h - 24 + dy, r, 0, TAU); x.fill(); } } });
}
function artPumpkin(sp, d) {
  const { R, th, cx, w, h } = d;
  inkPiece(sp, { fill: '#e07a2e', light: '#f3b25a', rim: 4, shape: x => { for (const dx of [-11, 11, 0]) { x.beginPath(); x.ellipse(cx + dx, h - 15, dx ? 13 : 15, 15, 0, 0, TAU); x.fill(); } x.fillRect(cx - 2.5, h - 36, 5, 8); },
    detail: x => { x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1.1; x.beginPath(); x.moveTo(cx - 6, h - 28); x.quadraticCurveTo(cx - 9, h - 15, cx - 6, h - 2); x.moveTo(cx + 6, h - 28); x.quadraticCurveTo(cx + 9, h - 15, cx + 6, h - 2); x.stroke();
      if (th.night) { x.fillStyle = '#ffd27a'; wobblyPoly(x, [[cx - 9, h - 20], [cx - 4, h - 17], [cx - 9, h - 15]]); x.fill(); wobblyPoly(x, [[cx + 9, h - 20], [cx + 4, h - 17], [cx + 9, h - 15]]); x.fill(); wobblyPoly(x, [[cx - 8, h - 10], [cx - 3, h - 7], [cx, h - 10], [cx + 3, h - 7], [cx + 8, h - 10], [cx + 4, h - 5], [cx - 4, h - 5]]); x.fill(); } } });
}
function artRock(sp, d) {
  const { R, th, v, cx, w, h } = d; const col = mix(th.top || '#8d93a2', '#8a8a8a', .35); const pts = []; const n = 8; for (let i = 0; i < n; i++) { const a = Math.PI + i / (n - 1) * Math.PI; pts.push([cx + Math.cos(a) * (w * .44) * (1 + (R() - .5) * .2), h + Math.sin(a) * (h * .9) * (1 + (R() - .5) * .25)]); }
  inkPiece(sp, { fill: col, light: lit(col, .3), rim: 6, shape: x => { wobblyPoly(x, pts); x.fill(); },
    detail: x => { x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1.2; x.beginPath(); x.moveTo(pts[2][0], pts[2][1]); x.lineTo(cx - 4, h * .55); x.lineTo(pts[5][0], pts[5][1]); x.moveTo(cx - 4, h * .55); x.lineTo(cx + 2, h - 2); x.stroke(); if (!th.icy && !th.lava) { x.fillStyle = rgbaC(th.cap, .85); lobed(x, cx - 10, pts[3][1] + 3, 14, 4, 5, R, .3); } } });
}
function artGrave(sp, d) {
  const { R, th, v, cx, w, h } = d; const col = mix('#a3a2a0', th.top || '#999', .25); const tilt = (R() - .5) * .14;
  inkPiece(sp, { fill: col, light: lit(col, .3), rim: 4, shape: x => { x.save(); x.translate(cx, h); x.rotate(tilt); if (v % 3 === 2) { x.fillRect(-4, -h + 4, 8, h - 4); x.fillRect(-16, -h + 16, 32, 8); } else { x.beginPath(); x.moveTo(-17, 0); x.lineTo(-17, -h + 18); x.quadraticCurveTo(0, -h - 6, 17, -h + 18); x.lineTo(17, 0); x.fill(); } x.restore(); },
    detail: x => { x.save(); x.translate(cx, h); x.rotate(tilt); x.strokeStyle = rgbaC(INK, .5); x.lineWidth = 1.3; if (v % 3 !== 2) { x.beginPath(); x.moveTo(-8, -h + 24); x.lineTo(8, -h + 24); x.moveTo(-9, -h + 31); x.lineTo(7, -h + 31); x.moveTo(-6, -h + 38); x.lineTo(5, -h + 38); x.stroke(); } x.restore(); x.fillStyle = rgbaC(th.cap, .9); lobed(x, cx, h - 2, 20, 4, 5, R, .3); } });
}
function artPillar(sp, d) {
  const { R, th, v, cx, w, h } = d; const col = mix('#d8cfb8', th.top || '#d8cfb8', .3); const brk = h * (.05 + R() * .3);
  inkPiece(sp, { fill: col, light: lit(col, .3), rim: 5, shape: x => { x.fillRect(cx - 24, h - 12, 48, 12); x.fillRect(cx - 18, brk + 6, 36, h - brk - 14); wobblyPoly(x, [[cx - 18, brk + 8], [cx - 18, brk], [cx - 6, brk + 7], [cx + 4, brk - 4], [cx + 18, brk + 3], [cx + 18, brk + 8]]); x.fill(); if (v === 0) x.fillRect(cx - 23, brk + 2, 46, 8); },
    detail: x => { x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1.2; x.beginPath(); for (const dx of [-10, -3, 4, 11]) { x.moveTo(cx + dx, brk + 12); x.lineTo(cx + dx, h - 14); } x.stroke(); x.fillStyle = rgbaC(mix('#6f9a4f', th.cap, .3), .9); for (let i = 0; i < 3; i++) lobed(x, cx - 14 + R() * 28, brk + 20 + R() * (h - brk - 40), 6, 9, 4, R, .3); } });
}
function artCrystal(sp, d) {
  const { R, th, v, cx, w, h } = d; const col = th.icy ? '#bfe6f5' : th.crystal || ['#9b8af0', '#7fd6e0', '#e08fd0'][v % 3]; const shards = [];
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .32 + (R() - .5) * .15, L = (i === 2 ? .95 : .5 + R() * .35) * h, ww = 7 + R() * 6; shards.push([cx + (i - 2) * 8, a, L, ww]); }
  const shardPath = (x, [bx, a, L, ww]) => { const ex = bx + Math.cos(a) * L, ey = h + Math.sin(a) * L, nx = -Math.sin(a) * ww, ny = Math.cos(a) * ww; wobblyPoly(x, [[bx - nx, h - ny + 4], [bx - nx + Math.cos(a) * L * .78, h - ny + Math.sin(a) * L * .78], [ex, ey], [bx + nx + Math.cos(a) * L * .78, h + ny + Math.sin(a) * L * .78], [bx + nx, h + ny + 4]]); x.fill(); };
  inkPiece(sp, { fill: col, light: '#ffffff', dark: lit(col, -.35), rim: 4, hatch: false, shape: x => { for (const s of shards) shardPath(x, s); },
    detail: x => { x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.4; for (const [bx, a, L] of shards) { x.beginPath(); x.moveTo(bx + Math.cos(a) * L * .15 - 2, h + Math.sin(a) * L * .15); x.lineTo(bx + Math.cos(a) * L * .7 - 2, h + Math.sin(a) * L * .7); x.stroke(); } } });
}
function artBarrel(sp, d) {
  const { cx, w, h } = d;
  inkPiece(sp, { fill: '#c4452f', light: '#e9775a', rim: 4, shape: x => { x.beginPath(); x.moveTo(5, 3); x.quadraticCurveTo(0, h / 2, 5, h - 2); x.lineTo(w - 5, h - 2); x.quadraticCurveTo(w, h / 2, w - 5, 3); x.closePath(); x.fill(); },
    detail: x => { x.strokeStyle = INK; x.lineWidth = 2; for (const yy of [11, h - 11]) { x.beginPath(); x.moveTo(1, yy); x.lineTo(w - 1, yy); x.stroke(); } x.fillStyle = '#f4e3a1'; x.beginPath(); x.moveTo(cx, 15); x.lineTo(cx + 8, h - 15); x.lineTo(cx - 8, h - 15); x.closePath(); x.fill(); x.lineWidth = 1.4; x.stroke(); x.fillStyle = INK; x.fillRect(cx - 1.2, 20, 2.4, 7); x.fillRect(cx - 1.2, 29, 2.4, 2.4); } });
}
function artCrate(sp, d) {
  const { R, cx, w, h } = d;
  inkPiece(sp, { fill: '#b68650', light: '#d9aa6c', rim: 4, shape: x => x.fillRect(3, 3, w - 6, h - 6),
    detail: x => { x.strokeStyle = rgbaC(INK, .8); x.lineWidth = 2; x.strokeRect(7, 7, w - 14, h - 14); x.beginPath(); x.moveTo(8, 8); x.lineTo(w - 8, h - 8); x.stroke(); x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; marks(x, R, 5, 10, 10, w - 10, h - 10, rgbaC(INK, .3), 1, 8, '-'); } });
}
function artLamp(sp, d) {
  const { cx, w, h } = d;
  inkPiece(sp, { fill: '#3a3640', rim: 0, line: 1.6, hatch: false, shape: x => { x.lineWidth = 4.5; x.beginPath(); x.moveTo(cx, h); x.lineTo(cx, 24); x.quadraticCurveTo(cx, 12, cx + 12, 14); x.stroke(); x.fillRect(cx - 8, h - 6, 16, 6); } });
  inkPiece(sp, { fill: '#ffe2a0', light: '#fff6dc', rim: 2, line: 1.8, hatch: false, shape: x => { x.beginPath(); x.moveTo(cx + 5, 14); x.lineTo(cx + 19, 14); x.lineTo(cx + 16, 32); x.lineTo(cx + 8, 32); x.closePath(); x.fill(); } });
}
function artLantern(sp, d) {
  const { R, cx, w, h } = d;
  inkPiece(sp, { fill: '#5a4636', rim: 0, line: 1.6, hatch: false, shape: x => { x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 8, h); x.lineTo(cx - 8, 20); x.quadraticCurveTo(cx - 8, 10, cx + 12, 10); x.stroke(); x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx + 12, 10); x.lineTo(cx + 12, 18); x.stroke(); } });
  inkPiece(sp, { fill: '#d9573b', light: '#ffb07a', rim: 3, line: 1.8, hatch: false, shape: x => { x.beginPath(); x.ellipse(cx + 12, 30, 10, 13, 0, 0, TAU); x.fill(); x.fillRect(cx + 7, 16, 10, 3); x.fillRect(cx + 7, 42, 10, 3); }, detail: x => { x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1; for (const k of [-5, 0, 5]) { x.beginPath(); x.moveTo(cx + 12 + k, 19); x.quadraticCurveTo(cx + 12 + k * 1.5, 30, cx + 12 + k, 42); x.stroke(); } } });
}
/* ---------- C. placement: clusters, back layer, grass, critters ---------- */
function surfacesAt(x, y0 = 0, y1 = H) { const out = []; const gx = clamp(x / CELL | 0, 0, GW - 1); let prev = 1; for (let gy = Math.max(0, y0 / CELL | 0); gy < Math.min(GH, y1 / CELL | 0); gy++) { const v = T.grid[gy * GW + gx]; if (v && !prev) out.push(gy * CELL); prev = v; } return out; }
function propSpotOk(x, y, kind, list) {
  if (y == null || y > H - 40 || y < 60) return false; const def = PROPS[kind]; const hw = Math.min(16, def.w * .14);
  if (!solidAt(x - hw, y + 6) || !solidAt(x + hw, y + 6) || !solidAt(x, y + 10)) return false;
  if (solidRect(x - 6, y - Math.min(90, def.h * .6), x + 6, y - 4)) return false;
  if (waterAt(x, y - 6) || waterAt(x - 18, y + 6) || waterAt(x + 18, y + 6)) return false;
  const small = def.small, minD = small ? 26 : def.tree ? def.w * .42 : 46;
  for (const p of list) { const pd = PROPS[p.kind]; if (Math.abs(p.y - y) > 110) continue; const need = small && pd.small ? 22 : small || pd.small ? 10 : Math.max(minD, pd.w * .36); if (Math.abs(p.x - x) < need) return false; }
  return true;
}
function pickWeighted(R, arr) { const tot = arr.reduce((s, k) => s + k[1], 0); let r = R() * tot; for (const k of arr) { r -= k[1]; if (r <= 0) return k[0]; } return arr[0][0]; }
function placeProps(R, th) {
  Env.props = []; Env.backProps = []; Env.grass = []; Env.critters = []; Bodies.clear();
  const list = (th.props || []).map(k => [k[0] === 'boulder' ? 'rock' : k[0], k[1]]).filter(k => PROPS[k[0]]);
  const trees = list.filter(k => PROPS[k[0]].tree), smalls = list.filter(k => PROPS[k[0]].small), things = list.filter(k => !PROPS[k[0]].tree && !PROPS[k[0]].small);
  const under = (th.under || (th.icy ? [] : th.lava ? [] : th.style === 'sea' ? [['tallgrass', 1], ['bush', .6]] : [['bush', 1], ['fern', .6], ['tallgrass', .7], ['flowers', .4]])).filter(k => PROPS[k[0]]);
  const smallSet = smalls.length ? smalls.concat(under.map(k => [k[0], k[1] * .5])) : under;
  const scale = W / 1600, sea = th.style === 'sea'; const out = Env.props;
  const add = (kind, x, y, s) => {
    // rare giant variant of any plant kind (3x size, 3x hp — see PROPS)
    if (!kind.startsWith('giant_') && R() < .065 && PROPS['giant_' + kind]) kind = 'giant_' + kind;
    const def = PROPS[kind]; out.push({ id: 0, kind, x: Math.round(x), y: Math.round(y) + 3, s, variant: R() * 3 | 0, flip: R() < .5, seed: R() * 999 | 0, sway: R() * TAU, burn: 0, dead: false, leafT: 0, leafAng: 0, leafVel: 0, hp: def.hp, cut: 0, cutS: 0 });
  };
  const randSurf = x => { const s = surfacesAt(x); return s.length ? s[R() * s.length | 0] : null; };
  // groves: a lead tree, 0-2 companions, plants at their feet
  const nClusters = Math.round(scale * (sea ? 4 : 6) * (th.treeDensity ?? 1)); let tries = 0, made = 0;
  while (trees.length && made < nClusters && tries++ < nClusters * 30) {
    const x = 60 + R() * (W - 120); const y = randSurf(x); const kind = pickWeighted(R, trees); if (!propSpotOk(x, y, kind, out)) continue;
    made++; const s0 = .86 + R() * .3; add(kind, x, y, s0); const comp = R() * 3 | 0;
    for (let k = 0; k < comp; k++) { const dx = (R() < .5 ? -1 : 1) * (PROPS[kind].w * (.45 + R() * .35)); const xx = x + dx; const yy = surfaceFromGrid(xx, y - 80); const kk = R() < .75 ? kind : pickWeighted(R, trees); if (yy != null && Math.abs(yy - y) < 60 && propSpotOk(xx, yy, kk, out)) add(kk, xx, yy, s0 * (.72 + R() * .2)); }
    if (smallSet.length) for (let k = 0; k < 2 + (R() * 3 | 0); k++) { const xx = x + (R() - .5) * PROPS[kind].w * 1.1; const yy = surfaceFromGrid(xx, y - 60); const kk = pickWeighted(R, smallSet); if (yy != null && Math.abs(yy - y) < 50 && propSpotOk(xx, yy, kk, out)) add(kk, xx, yy, .8 + R() * .35); }
  }
  // scattered plants + objects
  const nSmall = Math.round(scale * (sea ? 5 : 9) * (th.plantDensity ?? 1)); tries = 0; let ns = 0;
  while (smallSet.length && ns < nSmall && tries++ < nSmall * 20) { const x = 40 + R() * (W - 80), y = randSurf(x), kk = pickWeighted(R, smallSet); if (propSpotOk(x, y, kk, out)) { add(kk, x, y, .8 + R() * .35); ns++; } }
  const nThings = Math.round(scale * (things.length ? 3.5 : 0) * (th.thingDensity ?? 1)); tries = 0; let nt = 0;
  while (nt < nThings && tries++ < nThings * 25) { const x = 50 + R() * (W - 100), y = randSurf(x), kk = pickWeighted(R, things); if (propSpotOk(x, y, kk, out)) { add(kk, x, y, kk === 'rock' ? .8 + R() * .5 : .9 + R() * .2); nt++; } }
  // draw order: big trees behind, small things in front, barrels last
  const ord = p => { const d = PROPS[p.kind]; return d.tree ? 0 : d.small ? 2 : 1; };
  out.sort((a, b) => ord(a) - ord(b) || a.x - b.x); out.forEach((p, i) => p.id = i);
  // hazed back layer peeking over the terrain (purely visual)
  if (trees.length && th.backLayer !== false) { const nb = Math.round(scale * (sea ? 6 : 12)); for (let i = 0; i < nb * 3 && Env.backProps.length < nb; i++) { const x = R() * W, s = surfacesAt(x); if (!s.length) continue; const y = s[0]; if (waterAt(x, y - 4) || y > H - 60) continue; Env.backProps.push({ kind: pickWeighted(R, trees), v: R() * 3 | 0, x, y: y + 18 + R() * 16, s: .55 + R() * .2, flip: R() < .5 }); } Env.backProps.sort((a, b) => a.s - b.s); }
  // grass tufts on every open top
  const dens = th.grass ?? .6; if (dens > 0) { const step = 13 / dens; for (let x = 6 + R() * 8; x < W - 6; x += step * (.6 + R() * .8)) for (const sy of surfacesAt(x)) { if (sy > H - 30 || solidAt(x, sy - 8) || solidAt(x, sy - 16) || waterAt(x, sy - 3)) continue; if (R() > .85) continue; Env.grass.push({ x, y: sy + 3, h: (8 + R() * 10) * (th.grassH || 1), n: 3 + (R() * 3 | 0), ph: R() * TAU, c: R() < .3 ? 1 : 0 }); } }
  // critters
  const nC = Math.round(scale * (th.critters ?? 5)); for (let i = 0; i < nC; i++) Critters.spawn(R, true);
}

/* little birds (bats at night) that perch on tree tops and ground and scatter */
const Critters = {
  spawn(R = Math.random, init = false) {
    const trees = Env.props.filter(p => !p.dead && !p.cut && PROPS[p.kind].tree && PROPS[p.kind].leafy);
    let x, y; if (trees.length && R() < .65) { const t = trees[R() * trees.length | 0]; const d = PROPS[t.kind]; x = t.x + (R() - .5) * d.w * .4 * t.s; y = t.y - d.h * t.s * (.92 + R() * .04); } else { x = 40 + R() * (W - 80); y = surfaceFromGrid(x); if (y == null || waterAt(x, y - 4)) return; }
    const me = G.players && G.players.get(G.myId); if (!init && me && Math.hypot(me.x - x, me.y - y) < 400) return;
    Env.critters.push({ x, y, st: 0, vx: 0, vy: 0, t: R() * 5, face: R() < .5 ? -1 : 1, hop: 0, col: T.theme.night ? '#2b2733' : ['#6e5a4a', '#c0603e', '#4e6c8a', '#8a7a52'][R() * 4 | 0], gone: 0 });
  },
  scare(x, y, r) { for (const c of Env.critters) if (c.st === 0 && Math.hypot(c.x - x, c.y - y) < r) this.flee(c, x); },
  flee(c, fromX) { c.st = 1; c.vx = (c.x >= fromX ? 1 : -1) * (160 + Math.random() * 140); c.vy = -320 - Math.random() * 160; c.face = Math.sign(c.vx); c.t = 0; if (visibleWorld(c.x, c.y, 0) && Math.random() < .5) Audio2.play('swing', c.x, .15, 2.4); },
  update(dt) {
    const ps = []; for (const p of G.players.values()) if (p.alive) ps.push(p);
    let k = 0; for (const c of Env.critters) {
      c.t += dt;
      if (c.st === 0) { if (!visibleWorld(c.x, c.y, 300)) { Env.critters[k++] = c; continue; }
        for (const p of ps) if (Math.abs(p.x - c.x) < 120 && Math.abs(p.y - c.y) < 110 && (Math.abs(p.vx) > 40 || Math.abs(p.x - c.x) < 60)) { this.flee(c, p.x); break; }
        if (c.st === 0) { for (const b of G.bullets) if (!b.dead && Math.abs(b.x - c.x) < 70 && Math.abs(b.y - c.y) < 70) { this.flee(c, b.x); break; } }
        if (c.st === 0) { if (c.hop > 0) c.hop = Math.max(0, c.hop - dt * 4); else if (Math.random() < dt * .7) { c.hop = 1; if (Math.random() < .4) c.face *= -1; } if (!solidAt(c.x, c.y + 3) && !Env.props.some(p => !p.dead && Math.abs(p.x - c.x) < 60 && Math.abs(p.y - PROPS[p.kind].h * p.s - c.y) < 30)) this.flee(c, c.x - c.face); }
      } else { c.vy += (c.vy > -120 ? -520 : -60) * dt + Math.sin(c.t * 9) * 30 * dt; c.vx *= Math.exp(-.2 * dt); c.vx += c.face * 120 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.t > 6 || c.y < -400 || c.x < -200 || c.x > W + 200) { if (Math.random() < .7) Critters.spawn(); continue; } }
      Env.critters[k++] = c;
    } Env.critters.length = k;
  },
  draw(c, t) {
    for (const b of Env.critters) { if (!visibleWorld(b.x, b.y, 20)) continue; c.save(); c.translate(b.x, b.y - (b.st ? 0 : 4 + Math.sin(b.hop * Math.PI) * 4)); c.scale(b.face, 1);
      c.lineWidth = 1.6; c.strokeStyle = INK; c.fillStyle = b.col; const bat = T.theme.night;
      if (b.st) { const f = Math.sin(t * 28 + b.x) * (bat ? 7 : 6); c.beginPath(); c.moveTo(-2, 0); c.quadraticCurveTo(-7, -f - 2, -12, -f); c.moveTo(2, 0); c.quadraticCurveTo(7, -f - 2, 12, -f); c.lineWidth = 3.4; c.stroke(); c.lineWidth = 1.6; c.strokeStyle = b.col; c.stroke(); c.strokeStyle = INK; }
      c.beginPath(); c.ellipse(0, 0, 5.5, 3.8, -.15, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(4.5, -3.2, 2.9, 0, TAU); c.fill(); c.stroke();
      if (!bat) { c.fillStyle = '#e9a23b'; c.beginPath(); c.moveTo(7, -3.6); c.lineTo(10, -2.6); c.lineTo(7, -1.8); c.fill(); c.fillStyle = 'rgba(255,250,235,.6)'; c.beginPath(); c.ellipse(-1, -1.4, 2.6, 1.2, -.2, 0, TAU); c.fill(); } else { c.beginPath(); c.moveTo(3, -5.4); c.lineTo(3.8, -8); c.lineTo(5.4, -5.6); c.fillStyle = b.col; c.fill(); c.stroke(); }
      c.fillStyle = INK; c.fillRect(5, -4.2, 1.3, 1.3); if (!b.st) { c.lineWidth = 1.1; c.beginPath(); c.moveTo(-1, 3.5); c.lineTo(-1, 5.5); c.moveTo(1.5, 3.5); c.lineTo(1.5, 5.5); c.stroke(); }
      c.restore(); }
  }
};

/* grass tufts: inked, swaying with the wind, parting around players */
function drawGrass(c, V, t) {
  const g = Env.grass; if (!g || !g.length) return; const th = T.theme; const cols = th.grassCol || [mix(th.cap, '#3e5a2a', .25), lit(th.cap, .12)];
  const near = []; for (const p of G.players.values()) if (p.alive && visibleWorld(p.x, p.y, 60)) near.push(p);
  for (const b of Env.bodies) if (b.awake && b.r > 10 && visibleWorld(b.x, b.y, 40)) near.push(b);
  const wind = Env.wind || 0, wk = 1 + Math.abs(wind) / 60; const gust = (gustAt((V.x0 + V.x1) / 2, t) - .5); const paths = [new Path2D(), new Path2D()];
  for (const q of g) { if (q.x < V.x0 - 20 || q.x > V.x1 + 20 || q.y < V.y0 - 20 || q.y > V.y1 + 30) continue;
    let bend = Math.sin(t * 2.1 + q.ph + q.x * .013) * .16 * wk + Math.sin(t * 4.7 + q.ph * 1.7) * .03 + wind * .0035 + gust * .12 * wk; for (const p of near) { const dx = q.x - p.x, dy = q.y - (p.y + (p.vx !== undefined && p.hp !== undefined ? HH : 0)); if (Math.abs(dx) < 34 && Math.abs(dy) < 34) bend += Math.sign(dx || 1) * (1 - Math.abs(dx) / 34) * .95; }
    const P = paths[q.c]; for (let i = 0; i < q.n; i++) { const o = (i - (q.n - 1) / 2) * 3.2, hh = q.h * (.7 + .3 * Math.sin(i * 2.3 + q.ph)), bb = bend + (i - (q.n - 1) / 2) * .22; const tx = q.x + o + Math.sin(bb) * hh, ty = q.y - Math.cos(bb) * hh; P.moveTo(q.x + o, q.y); P.quadraticCurveTo(q.x + o + Math.sin(bb) * hh * .2, q.y - hh * .6, tx, ty); } }
  c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 3.3; c.stroke(paths[0]); c.stroke(paths[1]); c.lineWidth = 1.6; c.strokeStyle = cols[0]; c.stroke(paths[0]); c.strokeStyle = cols[1]; c.stroke(paths[1]);
}
function drawBackProps(c, V) {
  const th = T.theme; const t = now(); const swayOn = Settings.leafSway !== false;
  for (const b of Env.backProps || []) { const d = PROPS[b.kind]; if (b.x + d.w * b.s < V.x0 || b.x - d.w * b.s > V.x1 || b.y - d.h * b.s > V.y1 || b.y < V.y0) continue;
    const sp = propSprite(b.kind, b.v, th, .28); const split = swayOn && sp.leaf;
    c.save(); c.translate(b.x, b.y); if (b.flip) c.scale(-1, 1); const s = b.s;
    const dx = -(d.w / 2 + SPRITE_M) * s, dy = -(d.h + SPRITE_M) * s, dw = (d.w + SPRITE_M * 2) * s, dh = (d.h + SPRITE_M * 2) * s;
    c.drawImage(split ? sp.base : sp.c, dx, dy, dw, dh);
    if (split) { // cheap open-loop sway for the hazed background layer
      const anch = d.leafAnchor || (d.tree ? [.5, .38] : [.5, .96]);
      const ax = (anch[0] - .5) * d.w * s, ay = (anch[1] - 1) * d.h * s;
      const ang = clamp((Env.wind || 0) * .0035, -.2, .2) + Math.sin(t * 1.1 + b.x * .01) * .018;
      c.translate(ax, ay); c.rotate(ang * .45); c.transform(1, 0, -ang * 1.7, 1, 0, 0); c.translate(-ax, -ay);
      c.drawImage(sp.leaf, dx, dy, dw, dh);
    }
    c.restore(); }
}

/* ---------- D. physics-based destruction ---------- */
/* pieces are cut from the prop sprites themselves (jagged cuts and Voronoi
   cells with shared, hashed edge jitter so neighbouring shards still fit). */
function clipHalf(poly, ax, ay, nx, ny) { // keep (p-a)·n <= 0
  const out = []; for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length]; const dp = (P[0] - ax) * nx + (P[1] - ay) * ny, dq = (Q[0] - ax) * nx + (Q[1] - ay) * ny; if (dp <= 0) out.push(P); if ((dp <= 0) !== (dq <= 0)) { const k = dp / (dp - dq); out.push([P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]); } } return out;
}
function jitterPoly(poly, amt) { // midpoint displacement keyed on the edge so both neighbours agree
  const out = []; for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length]; out.push(P); const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]); if (L < 10) continue;
    const [A, B] = (P[0] < Q[0] || (P[0] === Q[0] && P[1] < Q[1])) ? [P, Q] : [Q, P]; const nx = -(B[1] - A[1]) / L, ny = (B[0] - A[0]) / L;
    for (const f of [.33, .66]) { const h = (hash(Math.round(A[0] * 10 + B[0] * 7 + f * 13), Math.round(A[1] * 10 + B[1] * 7)) - .5) * Math.min(L * .3, amt); out.push([lerp(P[0], Q[0], f) + nx * h, lerp(P[1], Q[1], f) + ny * h]); } }
  return out;
}
function voronoiCells(x0, y0, x1, y1, seeds) {
  return seeds.map((s, i) => { let poly = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; for (let j = 0; j < seeds.length && poly.length; j++) { if (j === i) continue; const o = seeds[j]; poly = clipHalf(poly, (s[0] + o[0]) / 2, (s[1] + o[1]) / 2, o[0] - s[0], o[1] - s[1]); } return poly; }).filter(p => p.length > 2);
}
function cutPiece(src, poly, inkEdge = 1) {
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (const p of poly) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); }
  bx0 = Math.max(0, Math.floor(bx0) - 2); by0 = Math.max(0, Math.floor(by0) - 2); bx1 = Math.min(src.width, Math.ceil(bx1) + 2); by1 = Math.min(src.height, Math.ceil(by1) + 2); const w = bx1 - bx0, h = by1 - by0; if (w < 4 || h < 4) return null;
  const c = mkCanvas(w, h), x = c.getContext('2d'); x.translate(-bx0, -by0); x.beginPath(); poly.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.save(); x.clip(); x.drawImage(src, 0, 0); x.restore();
  if (inkEdge) { x.globalCompositeOperation = 'source-atop'; x.strokeStyle = INK; x.lineWidth = 4.2 * inkEdge; x.lineJoin = 'round'; x.stroke(); x.globalCompositeOperation = 'source-over'; }
  // alpha → area, centroid and a convex hull (with edge midpoints) for collisions
  const d = x.getImageData(0, 0, w, h).data; const st = Math.max(2, Math.round(Math.min(w, h) / 12)); let n = 0, sx = 0, sy = 0; const pts = [];
  for (let yy = 0; yy < h; yy += st) for (let xx = 0; xx < w; xx += st) if (d[(yy * w + xx) * 4 + 3] > 60) { n++; sx += xx; sy += yy; pts.push([xx, yy]); }
  if (n < 3) return null; const hull = convexHull(pts); return { c, ox: bx0, oy: by0, w, h, area: n * st * st, cx: sx / n, cy: sy / n, hull };
}
function convexHull(P) {
  P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 3) return P; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); let h = lo.concat(up); while (h.length > 10) h = h.filter((_, i) => i % 2 === 0 || i === h.length - 1); return h;
}
const MAT = { wood: { e: .22, mu: .7, rho: 1, float: 1 }, leaf: { e: .1, mu: .9, rho: .5, float: 1 }, soft: { e: .35, mu: .8, rho: .7, float: 1 }, stone: { e: .12, mu: .8, rho: 2.4, float: 0 }, crystal: { e: .3, mu: .4, rho: 1.8, float: 0 }, metal: { e: .25, mu: .5, rho: 2, float: 0 }, plank: { e: .2, mu: .7, rho: 1, float: 1 } };
Env.bodies = [];
const Bodies = {
  get list() { return Env.bodies; },
  max() { const n = G.players.size; return Math.round((60 + 100 * clamp(R8.fxScale || .6, 0, 1)) * (n > 40 ? .55 : n > 20 ? .75 : 1)); },
  clear() { Env.bodies = []; },
  /* piece: from cutPiece. k: world units per piece px. (wx,wy): world position of the piece centroid. */
  add(piece, k, wx, wy, a, fs, mat, o = {}) {
    if (!piece) return null; const m = MAT[mat] || MAT.wood; const hull = piece.hull.map(p => [(p[0] - piece.cx) * k * fs, (p[1] - piece.cy) * k]); const ext = [];
    for (let i = 0; i < hull.length; i++) { const P = hull[i], Q = hull[(i + 1) % hull.length]; ext.push(P); if (Math.hypot(Q[0] - P[0], Q[1] - P[1]) > 16) ext.push([(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]); }
    let r2 = 0; for (const p of ext) r2 = Math.max(r2, p[0] * p[0] + p[1] * p[1]); const area = piece.area * k * k; const mass = Math.max(4, area * m.rho * .01);
    const b = { img: piece.c, pcx: piece.cx, pcy: piece.cy, pw: piece.w, ph: piece.h, k, fs, x: wx, y: wy, a: a || 0, vx: o.vx || 0, vy: o.vy || 0, va: o.va || 0, hull: ext, r: Math.sqrt(r2), m: mass, I: mass * (r2 * .35 + 4), mat, M: m, gen: o.gen || 0, t: 0, life: (o.life || 9) + Math.random() * 4, awake: true, rest: 0, leafy: o.leafy, kind: o.kind, src: o.src, alpha: 1, hitT: 0 };
    Env.bodies.push(b); const mx = this.max(); if (Env.bodies.length > mx) { const old = Env.bodies.findIndex(q => !q.dying); if (old >= 0) Env.bodies[old].dying = 1; if (Env.bodies.length > mx + 30) Env.bodies.splice(0, Env.bodies.length - mx - 30); }
    return b;
  },
  /* body from a whole (or cut) prop sprite. src may be the prop sprite canvas or a stump. */
  fromCanvas(src, poly, pr, mat, o) {
    const sp = propSprite(pr.kind, pr.variant, T.theme); const piece = cutPiece(src, poly || [[0, 0], [src.width, 0], [src.width, src.height], [0, src.height]], poly ? 1 : 0); if (!piece) return null;
    const S = sp.S, M = sp.M, d = PROPS[pr.kind]; const ax = (M + d.w / 2) * S, ay = (M + d.h) * S; const k = pr.s / S, fs = pr.flip ? -1 : 1;
    const wx = pr.x + (piece.ox + piece.cx - ax) * k * fs, wy = pr.y + (piece.oy + piece.cy - ay) * k; return this.add(piece, k, wx, wy, 0, fs, mat, Object.assign({ leafy: d.leafy, kind: pr.kind }, o));
  },
  shatterCanvas(src, pr, n, cx, cy, power, mat, R, o = {}) { // Voronoi-fracture a prop
    const sp = propSprite(pr.kind, pr.variant, T.theme); const S = sp.S, M = sp.M, d = PROPS[pr.kind]; const w = src.width, h = src.height; const x0 = M * S * .5, y0 = (M + d.h * (1 - (o.top || 1))) * S - 2, x1 = w - M * S * .5, y1 = (M + d.h * (1 - (o.bot || 0))) * S + 2;
    const seeds = []; for (let i = 0; i < n; i++) seeds.push([lerp(x0, x1, .1 + R() * .8), lerp(y0, y1, .08 + R() * .84)]); const out = [];
    for (const cell of voronoiCells(x0, y0, x1, y1, seeds)) { const b = this.fromCanvas(src, jitterPoly(cell, 7 * S), pr, mat, o); if (!b) continue; const dx = b.x - cx, dy = b.y - cy, L = Math.hypot(dx, dy) || 1; const sp2 = power * (.6 + R() * .6); b.vx += dx / L * sp2 + (R() - .5) * 60; b.vy += dy / L * sp2 - power * .35 - R() * 80; b.va += (R() - .5) * power * .025; b.gen = o.gen ?? 1; out.push(b); }
    return out;
  },
  fracture(b) { // secondary break of a body on a hard landing
    const n = b.r > 50 ? 4 : 3; const R = rng((b.x * 7 + b.y * 13) | 0); const w = b.pw, h = b.ph; const seeds = []; for (let i = 0; i < n; i++) seeds.push([w * (.15 + R() * .7), h * (.15 + R() * .7)]);
    const ca = Math.cos(b.a), sa = Math.sin(b.a); let made = 0;
    for (const cell of voronoiCells(0, 0, w, h, seeds)) { const piece = cutPiece(b.img, jitterPoly(cell, 10), .8); if (!piece) continue; const lx = (piece.ox + piece.cx - b.pcx) * b.k * b.fs, ly = (piece.oy + piece.cy - b.pcy) * b.k;
      const wx = b.x + lx * ca - ly * sa, wy = b.y + lx * sa + ly * ca; const q = this.add(piece, b.k, wx, wy, b.a, b.fs, b.mat, { gen: b.gen + 1, leafy: b.leafy, kind: b.kind, life: 6 }); if (!q) continue; made++;
      const rx = wx - b.x, ry = wy - b.y; q.vx = b.vx - b.va * ry + (Math.random() - .5) * 120 + rx * 2; q.vy = b.vy * -.2 + b.va * rx - 80 - Math.random() * 140; q.va = b.va * .5 + (Math.random() - .5) * 6; }
    if (made) { b.dead = true; if (b.leafy) leafBurst({ kind: b.kind }, b.x, b.y, 10); FX.dustPuff(b.x, b.y + b.r * .4, 8, 1.2); Audio2.play('debris', b.x, .7); }
  },
  wake(x, y, r) { for (const b of Env.bodies) if (!b.awake && Math.abs(b.x - x) < r + b.r && Math.abs(b.y - y) < r + b.r) { b.awake = true; b.rest = 0; } },
  blast(x, y, r) { for (const b of Env.bodies) { const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy); if (d > r * 2.2) continue; const f = (1 - d / (r * 2.2)) * 1400 / Math.sqrt(b.m * .08 + 1); b.vx += dx / (d || 1) * f; b.vy += dy / (d || 1) * f - f * .4; b.va += (Math.random() - .5) * f * .02; b.awake = true; b.rest = 0; } },
  update(dt) {
    const L = Env.bodies; if (!L.length) return; const ps = []; for (const p of G.players.values()) if (p.alive) ps.push(p); const steps = 2, h = dt / steps; let k = 0;
    for (const b of L) {
      if (b.dead) continue; b.t += dt; if (b.dying || b.t > b.life) { b.alpha -= dt * 1.2; if (b.alpha <= 0) continue; }
      for (const p of ps) { const dx = b.x - p.x, dy = b.y - p.y; if (Math.abs(dx) < b.r + HW && Math.abs(dy) < b.r + HH) { if (Math.abs(p.vx) > 60 || p.vy > 200) { b.awake = true; b.rest = 0; b.vx += (p.vx * .9 - b.vx) * clamp(40 / b.m, .05, .6); b.vy -= clamp(Math.abs(p.vx) * .25, 0, 160) * clamp(30 / b.m, .05, .6) * dt * 10; b.va += Math.sign(p.vx) * clamp(4 / Math.sqrt(b.m), .02, .4); } } }
      if (!b.awake) { if (b.y > H + 80) continue; L[k++] = b; continue; }
      for (let s = 0; s < steps; s++) this.step(b, h);
      if (b.fracture && !b.dead) { b.fracture = false; if (L.length < this.max()) this.fracture(b); }
      if (b.dead || b.y > H + 120 || b.x < -300 || b.x > W + 300) continue; L[k++] = b;
    } L.length = k;
    // cheap separation so piles do not interpenetrate too much
    if (L.length < 140) for (let i = 0; i < L.length; i++) { const a = L[i]; if (!a.awake || a.r < 8) continue; for (let j = 0; j < L.length; j++) { if (i === j) continue; const b = L[j]; if (b.r < 8) continue; const dx = a.x - b.x, dy = a.y - b.y, rr = (a.r + b.r) * .5; if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue; const d = Math.hypot(dx, dy) || 1; if (d >= rr) continue; const push = (rr - d) * .5, ma = b.m / (a.m + b.m); a.x += dx / d * push * ma; a.y += dy / d * push * ma; if (!b.awake && push > 1.5) { b.awake = true; } } }
  },
  step(b, dt) {
    const M = b.M; const wa = waterAt(b.x, b.y);
    if (wa) { if (wa.lava) { b.vy = Math.min(b.vy + 300 * dt, 50); b.vx *= Math.exp(-3 * dt); b.va *= Math.exp(-3 * dt); b.life = Math.min(b.life, b.t + 1.2); if (Math.random() < dt * 6) FX.smoke(b.x, b.y, 1, 8, 'rgba(80,70,70,.45)', 0, -50); }
      else { if (!b.wet) { b.wet = 1; splash(b.x, b.y, clamp(Math.abs(b.vy) / 900 + b.r / 120, .2, 1.4), wa); } const depth = b.y - waterSurfaceY(wa, b.x); b.vy += (M.float ? -GRAV * clamp(.6 + depth / 30, .6, 1.6) : -GRAV * .55) * dt; b.vy *= Math.exp(-3 * dt); b.vx = b.vx * Math.exp(-1.6 * dt) + (Env.wind || 0) * .3 * dt; b.va *= Math.exp(-2.5 * dt); if (M.float && Math.abs(depth) < 8) b.va += -Math.sin(b.a * 2) * 3 * dt; } }
    else b.wet = 0;
    b.vy = Math.min(b.vy + GRAV * dt, 1600); b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
    const ca = Math.cos(b.a), sa = Math.sin(b.a); const pts = []; let cx = 0, cy = 0;
    for (const p of b.hull) { const wx = b.x + p[0] * ca - p[1] * sa, wy = b.y + p[0] * sa + p[1] * ca; if (solidAt(wx, wy)) { pts.push(wx, wy); cx += wx; cy += wy; } }
    const n = pts.length / 2; if (!n) { b.contact = 0; if (Math.hypot(b.vx, b.vy) > 90 || Math.abs(b.va) > 1.2) b.rest = 0; return; }
    cx /= n; cy /= n; let [nx, ny] = surfaceNormal(cx, cy); if (!nx && !ny) { nx = 0; ny = -1; }
    let ox = 0, oy = 0; for (let i = 0; i < 10; i++) { let any = false; for (let q = 0; q < pts.length; q += 2) if (solidAt(pts[q] + ox, pts[q + 1] + oy)) { any = true; break; } if (!any) break; ox += nx; oy += ny; }
    b.x += ox; b.y += oy; let imp = 0;
    for (let q = 0; q < pts.length; q += 2) { const rx = pts[q] - b.x, ry = pts[q + 1] - b.y; let vx = b.vx - b.va * ry, vy = b.vy + b.va * rx; const vn = vx * nx + vy * ny; if (vn >= 0) continue; imp = Math.max(imp, -vn);
      const rn = rx * ny - ry * nx; const e = -vn > 150 ? M.e : 0; const j = -(1 + e) * vn / (1 / b.m + rn * rn / b.I) / n; b.vx += j * nx / b.m; b.vy += j * ny / b.m; b.va += rn * j / b.I;
      vx = b.vx - b.va * ry; vy = b.vy + b.va * rx; const tx = -ny, ty = nx, vt = vx * tx + vy * ty, rt = rx * ty - ry * tx; let jt = -vt / (1 / b.m + rt * rt / b.I) / n; jt = clamp(jt, -M.mu * j, M.mu * j); b.vx += jt * tx / b.m; b.vy += jt * ty / b.m; b.va += rt * jt / b.I; }
    if (imp > 380 && b.t - b.hitT > .15) { b.hitT = b.t; if (visibleWorld(cx, cy, 60)) { FX.dustPuff(cx, cy, Math.round(clamp(imp / 200, 2, 8)), clamp(b.r / 40, .5, 1.5)); Audio2.play(b.mat === 'stone' || b.mat === 'metal' || b.mat === 'crystal' ? 'clang' : 'land', cx, clamp(imp / 1400 * b.r / 40, .08, .7), b.r > 40 ? .7 : 1.2); } if (b.leafy && b.gen === 0) leafBurst({ kind: b.kind }, cx, cy - 20, 6); }
    if (imp > 520 && b.gen < 1 && b.r > 22) b.fracture = true;
    b.contact = 1; b.va *= Math.exp(-3 * dt); b.vx *= Math.exp(-.8 * dt);
    if (Math.hypot(b.vx, b.vy) < 60 && Math.abs(b.va) < .8) { b.rest += dt; if (b.rest > .3) { b.awake = false; b.vx = b.vy = b.va = 0; } } else b.rest = Math.max(0, b.rest - dt * .5);
  },
  draw(c, V) {
    const L = Env.bodies; if (!L.length) return; const M0 = c.getTransform(); const s = Math.hypot(M0.a, M0.b) || 1; const lowQ = (R8.fxScale ?? 1) < .5;
    for (const b of L) {
      if (b.alpha <= .02 || b.x + b.r < V.x0 || b.x - b.r > V.x1 || b.y + b.r < V.y0 || b.y - b.r > V.y1) continue;
      if (lowQ && b.r < 5) continue;
      // big sprite canvases are drawn shrunk every frame, which is slow on weak GPUs: keep a copy at screen resolution
      let img = b.img, k = b.k; const need = s * 1.15;
      if (1 / k > need * 1.3 && b.pw * b.ph > 900) {
        if (!b.lo || Math.abs(b.lo.s - need) / need > .35) { const f = need * k; const w = Math.max(2, Math.ceil(b.pw * f)), h = Math.max(2, Math.ceil(b.ph * f)); const cc = b.lo && b.lo.c.width === w && b.lo.c.height === h ? b.lo.c : mkCanvas(w, h); const x = cc.getContext('2d'); x.clearRect(0, 0, w, h); x.drawImage(b.img, 0, 0, w, h); b.lo = { c: cc, s: need, f }; }
        img = b.lo.c; }
      const ca = Math.cos(b.a), sa = Math.sin(b.a), fs = b.fs < 0 ? -1 : 1;
      c.setTransform(M0.a * ca * fs + M0.c * sa * fs, M0.b * ca * fs + M0.d * sa * fs, -M0.a * sa + M0.c * ca, -M0.b * sa + M0.d * ca, M0.a * b.x + M0.c * b.y + M0.e, M0.b * b.x + M0.d * b.y + M0.f);
      c.globalAlpha = b.alpha < 1 ? Math.max(0, b.alpha) : 1; c.drawImage(img, -b.pcx * k, -b.pcy * k, b.pw * k, b.ph * k);
    }
    c.setTransform(M0); c.globalAlpha = 1;
  }
};

/* ---------- E. props interplay ---------- */
for (const k in PROPS) { const d = PROPS[k]; d.solid = d.mat === 'stone' || d.mat === 'crystal' || d.mat === 'metal' || k === 'crate'; }
PROPS.giantshroom.bounce = 50; PROPS.giantshroom.bounceH = 104; PROPS.mushroom.bounce = 27; PROPS.mushroom.bounceH = 38;
/* bouncy giants: bounce values are assigned here (after the giant wrapper above ran),
   so scale the giant variants to match — 3x bounce, 3x bounce height */
if (PROPS.giant_bush) { PROPS.giant_bush.bounce = 81; PROPS.giant_bush.bounceH = 114; }
if (PROPS.giant_mushroom) { PROPS.giant_mushroom.bounce = 81; PROPS.giant_mushroom.bounceH = 114; }
function propBox(pr) { const d = PROPS[pr.kind], s = pr.s; const top = pr.y - d.h * s * (pr.cut || .98); if (d.tree) { const hw = pr.cut ? Math.max(10, d.w * .12) : d.w * .32; return [pr.x - hw * s, top, pr.x + hw * s, pr.y]; } return [pr.x - d.w * .42 * s, top, pr.x + d.w * .42 * s, pr.y]; }
function leafColsOf(kind0) { const kind = String(kind0 || '').replace(/^giant_/, ''); const th = T.theme; if (kind === 'cherry') return ['#f39bb4', '#fde2ea', '#f7b6c8']; if (kind === 'autumn') return ['#d9573b', '#e9a23b', '#c8742f']; if (kind === 'lavender') return ['#9b7fc7', '#b9a0e0', '#7d9a55']; if (kind === 'bamboo') return ['#8fae4a', '#a8c060']; if (th.leaf) return th.leaf; return [leafOf(th), lit(leafOf(th), .18), mix(leafOf(th), '#c9a14e', .25)]; }
function leafBurst(pr, x, y, n = 5) {
  if (!visibleWorld(x, y, 60)) return; const cols = leafColsOf(pr.kind); const cnt = Math.round(n * R8.fxScale) + 1;
  for (let i = 0; i < cnt; i++) {
    const flut = Math.random(); // variety of leaf behaviours: floaters, spinners and darters
    FX.add({ k: 'leaf', x: x + (Math.random() - .5) * 30, y: y + (Math.random() - .5) * 26,
      vx: (Math.random() - .5) * 220 + (Env.wind || 0) * .5, vy: -40 - Math.random() * 150,
      life: 1.5 + flut * 2 + Math.random(), t: 0, r: 2.6 + Math.random() * 4.4,
      color: cols[i % cols.length], rot: Math.random() * TAU });
  }
}
function chipsFx(pr, x, y, a, n = 4) {
  if (!visibleWorld(x, y, 40)) return; const d = PROPS[pr.kind];
  if (d.mat === 'stone' || d.mat === 'metal') { FX.sparks(x, y, a + Math.PI, n + 2, d.mat === 'metal' ? '#fff1d0' : '#d8d0c4'); FX.smoke(x, y, 1, 8, 'rgba(200,190,175,.45)', 0, -20); return; }
  if (d.mat === 'crystal') { FX.sparks(x, y, a + Math.PI, n + 4, T.theme.crystal || '#c8b8ff'); FX.light(x, y, 60, '#b9a8ff', .12, .4); return; }
  const col = d.mat === 'wood' ? lit(woodOf(T.theme), .2) : leafOf(T.theme); for (let i = 0; i < n; i++) FX.add({ k: 'leaf', x, y, vx: Math.cos(a + Math.PI + (Math.random() - .5) * 1.6) * (120 + Math.random() * 160), vy: -80 - Math.random() * 140, life: 1 + Math.random(), t: 0, r: 2 + Math.random() * 2, color: col, rot: Math.random() * TAU });
}
function propHitFx(pr, x, y, a) { const d = PROPS[pr.kind]; pr.shake = 1; if (now() - pr.leafT < .08) return; pr.leafT = now(); if (d.leafy) leafBurst(pr, x, y, d.small ? 4 : 3); if (!d.small || d.mat !== 'leaf') chipsFx(pr, x, y, a, 3); if (d.mat === 'stone' || d.mat === 'metal') Audio2.play('tink', x, .3, 1.3); }
/* host only: hp bookkeeping → a 'pbreak' event that every peer plays the same way */
function propDamage(pr, dmg, by, hx, hy, dir, close = false) {
  if (!G.isHost || pr.dead || pr.dying) return; const d = PROPS[pr.kind];
  if (d.explode) { hostBarrel(pr, by); return; }
  pr.hp -= dmg; if (pr.hp > 0) return; pr.dying = true;
  const f = clamp(Math.round(220 + dmg * 6), 220, 1000);
  if (d.tree && !pr.cut && !close) emit({ k: 'pbreak', id: pr.id, m: 'snap', d: dir || 1, f, s: randSeed(), cy: +(.1 + Math.random() * .12).toFixed(2) });
  else emit({ k: 'pbreak', id: pr.id, m: d.small ? 'pop' : 'shatter', d: dir || 1, f, s: randSeed(), x: Math.round(hx ?? pr.x), y: Math.round(hy ?? pr.y - 20) });
}
function propHitPoint(b, w) {
  for (const pr of Env.props) {
    if (pr.dead) continue; const bx = propBox(pr); if (b.x < bx[0] || b.x > bx[2] || b.y < bx[1] || b.y > bx[3]) continue;
    const d = PROPS[pr.kind]; const set = b.ph || (b.ph = new Set()); if (set.has(pr.id)) continue; set.add(pr.id);
    propHitFx(pr, b.x, b.y, Math.atan2(b.vy || 0, b.vx || 1));
    if (b.auth) { if (w.ignites && !d.noBurn && !pr.burn && !pr.charred) emit({ k: 'pburn', id: pr.id }); propDamage(pr, (w.damage || 10) * (w.propDamage ?? 1) * (b.type === 'flame' ? .35 : 1), b.owner, b.x, b.y, Math.sign(b.vx || 1)); }
    if (d.solid && b.type !== 'flame' && b.type !== 'beam') { bulletDie(b, w, 'prop'); return; }
  }
}
function propHitLine(x0, y0, x1, y1, w, by) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16)); const fake = { x: 0, y: 0, vx: x1 - x0, vy: y1 - y0, auth: G.isHost, owner: by, type: 'beam', dead: false }; for (let i = 0; i <= n; i++) { fake.x = lerp(x0, x1, i / n); fake.y = lerp(y0, y1, i / n); propHitPoint(fake, w); } }
function propMelee(p, w, sw) { // melee chops trees, smashes crates and pots
  if (!Env.props.length) return; const a = currentWeaponAngle(p), reach = (w.reach || 70) + 10;
  for (const pr of Env.props) { if (pr.dead || Math.abs(pr.x - p.x) > reach + 120) continue; const key = 'pr' + pr.id; if (sw.hit.has(key)) continue; const bx = propBox(pr);
    for (let i = 1; i <= 4; i++) { const hx = p.x + Math.cos(a) * reach * i / 4, hy = p.y + Math.sin(a) * reach * i / 4; if (hx < bx[0] || hx > bx[2] || hy < bx[1] || hy > bx[3]) continue; sw.hit.add(key); emit({ k: 'phit', id: pr.id, x: Math.round(hx), y: Math.round(hy), a: +a.toFixed(2) }); if (w.ignites && !PROPS[pr.kind].noBurn && !pr.burn) emit({ k: 'pburn', id: pr.id }); propDamage(pr, (w.damage || 20) * 1.6 * (w.propDamage ?? 1), p.id, hx, hy, Math.sign(Math.cos(a)) || 1); break; } }
}
function igniteNear(x, y, r) { if (!G.isHost) return; for (const pr of Env.props) { const d = PROPS[pr.kind]; if (pr.dead || pr.burn || pr.charred || d.noBurn || d.mat === 'stone') continue; if (Math.abs(pr.x - x) < r + d.w * .3 * pr.s && y > pr.y - d.h * pr.s - r && y < pr.y + r) emit({ k: 'pburn', id: pr.id }); } }
function hostBarrel(pr, by) { if (pr.dead || pr.armed) return; pr.armed = true; setTimeout(() => { if (!G.isHost || pr.dead) return; emit({ k: 'boom', id: pr.id }); hostExplode(pr.x, pr.y - 20, { radius: 125, damage: 52, knockback: 1150, crater: 40, selfDamage: 1 }, by, '_barrel'); }, 110); }
function propsBlast(x, y, r, by) {
  for (const pr of Env.props) { if (pr.dead || pr.dying) continue; const d = PROPS[pr.kind]; const cy = pr.y - d.h * pr.s * (pr.cut || 1) * .4; const dist = Math.hypot(pr.x - x, cy - y); const reach = r + d.w * pr.s * .35; if (dist > reach) continue;
    if (d.explode) { hostBarrel(pr, by); continue; } const f = 1 - dist / reach, dir = Math.sign(pr.x - x) || 1;
    if (d.small || (!d.tree && f > .45) || f > .72) propDamage(pr, 9999, by, x, y, dir, true);
    else if (d.tree && !pr.cut && (f > .25 || pr.hp < d.hp * .5)) propDamage(pr, 9999, by, x, y, dir);
    else propDamage(pr, 120 * f + 15, by, x, y, dir); }
  for (const c of Env.crates) if (Math.hypot(c.x - x, c.y - y) < r * .6 && !c.gone) { c.gone = true; emit({ k: 'cpick', id: c.id, pid: null }); }
}
function jaggedCut(R, y, w, S) { const pts = []; const mid = w * (.35 + R() * .3); for (let x = -4; x <= w + 4; x += 4 * S) { const near = Math.abs(x - mid) < 10 * S; pts.push([x, y + (R() - .5) * 7 * S + (near ? -(R() * 12 + 6) * S : 0)]); } return pts; }
function makeStump(pr) {
  const sp = propSprite(pr.kind, pr.variant, T.theme); const d = PROPS[pr.kind]; const S = sp.S, M = sp.M; const R = rng(pr.cutS | 0); const line = jaggedCut(R, (M + d.h * (1 - pr.cut)) * S, sp.c.width, S);
  const c = mkCanvas(sp.c.width, sp.c.height), x = c.getContext('2d'); x.beginPath(); line.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.lineTo(sp.c.width + 4, sp.c.height + 4); x.lineTo(-4, sp.c.height + 4); x.closePath(); x.save(); x.clip(); x.drawImage(sp.c, 0, 0); x.restore();
  x.globalCompositeOperation = 'source-atop'; x.strokeStyle = INK; x.lineWidth = 4 * S * .6; x.stroke(); x.fillStyle = d.mat === 'stone' ? 'rgba(255,250,240,.25)' : 'rgba(255,226,170,.5)'; x.beginPath(); line.forEach((p, i) => i ? x.lineTo(p[0], p[1] + 3 * S) : x.moveTo(p[0], p[1] + 3 * S)); x.lineTo(sp.c.width, line[line.length - 1][1] - 2 * S); x.lineTo(0, line[0][1] - 2 * S); x.closePath(); x.fill(); x.globalCompositeOperation = 'source-over';
  pr.stump = c; return line;
}
function breakProp(e) {
  const pr = Env.props[e.id]; if (!pr || pr.dead) return; const d = PROPS[pr.kind]; const sp = propSprite(pr.kind, pr.variant, T.theme); const R = rng(e.s | 0); const mat = d.mat; const vis = visibleWorld(pr.x, pr.y - d.h * pr.s * .5, 300);
  pr.dying = false; pr.burnT = 0;
  if (e.m === 'snap' && !pr.cut) {
    pr.cut = e.cy || .15; pr.cutS = e.s | 0; const line = makeStump(pr); const top = line.slice().concat([[sp.c.width + 4, -4], [-4, -4]]);
    const b = Bodies.fromCanvas(sp.c, top, pr, mat, { vx: e.d * e.f * .55, vy: -50, va: e.d * (.5 + e.f / 1400), life: 14, gen: 0 }); if (b) b.gen = 0;
    pr.hp = Math.max(20, d.hp * .45); const cy = pr.y - d.h * pr.s * pr.cut;
    if (vis) { chipsFx(pr, pr.x, cy, e.d > 0 ? Math.PI : 0, 10); if (d.leafy) leafBurst(pr, pr.x, pr.y - d.h * pr.s * .7, 14); Audio2.play('debris', pr.x, 1, .7); Audio2.play('land', pr.x, .5, .6); G.trauma = Math.min(1, G.trauma + .08); }
    if (pr.burn > 0 && b) b.burnT = pr.burn; Critters.scare(pr.x, pr.y - d.h * pr.s, 300); return;
  }
  const src = pr.stump || sp.c; const top = pr.cut || 1; const cx = e.x ?? pr.x, cy = e.y ?? pr.y - 20;
  if (e.m === 'pop') { if (vis) { if (d.leafy) leafBurst(pr, pr.x, pr.y - d.h * pr.s * .5, 10); if (pr.kind === 'mushroom' || pr.kind === 'pumpkin') FX.ink(pr.x, pr.y - 16, 8, pr.kind === 'pumpkin' ? '#e9a23b' : '#d9573b', .7); Audio2.play('debris', pr.x, .4, 1.6); }
    if (d.mat !== 'leaf') Bodies.shatterCanvas(src, pr, 3, cx, cy, e.f * .6, mat, R, { top, life: 5 }); pr.dead = true; return; }
  const n = d.tree ? (pr.cut ? 3 : 6) : d.mat === 'crystal' ? 6 : 4;
  Bodies.shatterCanvas(src, pr, n, cx, cy, e.f, mat, R, { top, life: 9 });
  if (vis) { if (d.leafy) leafBurst(pr, pr.x, pr.y - d.h * pr.s * .6, 18); chipsFx(pr, pr.x, pr.y - d.h * pr.s * top * .5, -Math.PI / 2, 8); FX.dustPuff(pr.x, pr.y, 8, 1.2); Audio2.play(d.mat === 'stone' || d.mat === 'crystal' ? 'clang' : 'debris', pr.x, .9, .8); }
  pr.dead = true; Critters.scare(pr.x, pr.y, 260);
}
function toppleProp(pr, dir) { // ground vanished: the whole thing becomes a rigid body
  if (pr.dead) return; const sp = propSprite(pr.kind, pr.variant, T.theme); const d = PROPS[pr.kind];
  Bodies.fromCanvas(pr.stump || sp.c, null, pr, d.mat, { vx: dir * 40, vy: 0, va: dir * (d.tree ? .5 : .2), life: 14, gen: d.tree ? 0 : 1 }); pr.dead = true;
}
function propsAfterCrater(e) {
  for (const pr of Env.props) { if (pr.dead || Math.abs(pr.x - e.x) > e.r + 80 || Math.abs(pr.y - e.y) > e.r + 80) continue; const d = PROPS[pr.kind]; const hw = Math.min(14, d.w * .14 * pr.s);
    if (solidAt(pr.x - hw, pr.y + 3) || solidAt(pr.x + hw, pr.y + 3) || solidAt(pr.x, pr.y + 8)) continue; toppleProp(pr, Math.sign(pr.x - e.x) || 1); }
  if (Env.grass) Env.grass = Env.grass.filter(g => Math.abs(g.x - e.x) > e.r + 6 || Math.abs(g.y - e.y) > e.r + 6 || solidAt(g.x, g.y));
  for (const c of Env.critters || []) if (c.st === 0 && Math.abs(c.x - e.x) < e.r + 30 && Math.abs(c.y - e.y) < e.r + 30) Critters.flee(c, e.x);
  Bodies.wake(e.x, e.y, e.r + 60);
}
function propsSupportPass() { for (const pr of Env.props) { if (pr.dead) continue; const d = PROPS[pr.kind]; const hw = Math.min(14, d.w * .14 * pr.s); if (!(solidAt(pr.x - hw, pr.y + 3) || solidAt(pr.x + hw, pr.y + 3) || solidAt(pr.x, pr.y + 8))) pr.dead = true; } if (Env.grass) Env.grass = Env.grass.filter(g => solidAt(g.x, g.y)); }
function propsBurnFx(pr, dt) { const d = PROPS[pr.kind]; if (!visibleWorld(pr.x, pr.y - 60, 120)) return; const h = d.h * pr.s * (pr.cut || 1); if (Math.random() < dt * 30 * R8.fxScale) FX.add({ k: 'ember', x: pr.x + (Math.random() - .5) * d.w * .5 * pr.s, y: pr.y - h * (.3 + Math.random() * .6), vx: (Math.random() - .5) * 40 + Env.wind * .5, vy: -60 - Math.random() * 120, life: .7 + Math.random() * .6, t: 0, r: 4 + Math.random() * 4, color: Math.random() < .5 ? '#ff8a3c' : '#ffd27a', g: -1 }); if (Math.random() < dt * 4) FX.smoke(pr.x, pr.y - h * .8, 1, 18, 'rgba(70,60,60,.4)', Env.wind * .4, -50); FX.light(pr.x, pr.y - h * .55, 150, '#ff8a3c', .06, .9); }
/* ---------- leaf sway: gust field + per-prop spring-damper ----------
   Every leafy prop's canopy angle is a damped spring chasing a target that
   combines the biome wind with a travelling gust field, so canopies overshoot
   and settle like real foliage instead of just bobbing on a sine. */
function gustAt(x, t) { return fbm(x * .005 + t * .45, 911, 3); }
function leafTarget(pr, gust) {
  const d = PROPS[pr.kind], wind = Env.wind || 0;
  const g = gust ? gustAt(pr.x, now()) : .5;
  const k = d.tree ? .0042 : .0095; // wind speed → canopy angle
  const amp = d.tree ? .022 : .052, freq = d.tree ? 1.1 : 2.1;
  return clamp(wind * k * (.6 + g), -.3, .3) + Math.sin(now() * freq + pr.seed * .071) * amp * (.45 + g);
}
function leafSwayStep(pr, dt) {
  const d = PROPS[pr.kind];
  const off = !visibleWorld(pr.x, pr.y - d.h * pr.s * .4, 140);
  if (off) { pr.leafAng = leafTarget(pr, 0); pr.leafVel = 0; return; } // snap while offscreen (invisible)
  const target = leafTarget(pr, 1);
  const stiff = d.tree ? 30 : d.small ? 95 : 60;   // trees: slow & heavy, bushes: fast & light
  const damp = d.tree ? 4.2 : 7;
  pr.leafVel += (target - pr.leafAng) * stiff * dt;
  pr.leafVel *= Math.exp(-damp * dt);
  pr.leafAng = clamp(pr.leafAng + pr.leafVel * dt, -.55, .55);
}
function updateProps(dt) {
  const rain = Weather.kind === 'rain' || Weather.kind === 'storm' || Weather.kind === 'drizzle'; const wk = 1 + Math.abs(Env.wind || 0) / 80;
  const swayOn = Settings.leafSway !== false;
  for (const pr of Env.props) {
    if (pr.dead) continue; pr.sway += dt * wk; if (pr.shake) pr.shake = Math.max(0, pr.shake - dt * 3); if (pr.squish) pr.squish = Math.max(0, pr.squish - dt * 3.2);
    if (pr.burn > 0) { pr.burn -= dt * (rain ? 2.2 : 1); propsBurnFx(pr, dt); if (G.isHost) { pr.hp -= dt * 7; if (pr.hp <= 0) propDamage(pr, 1, null, pr.x, pr.y - 40, Env.wind >= 0 ? 1 : -1); }
      if (pr.burn <= 0) { pr.burn = 0; pr.charred = true; const d = PROPS[pr.kind]; if (d.tree && d.leafy && !pr.cut && pr.kind !== 'cactus') { pr.kind = 'dead'; pr.hp = Math.min(pr.hp, PROPS.dead.hp); } FX.smoke(pr.x, pr.y - 60, 4, 30, 'rgba(60,52,52,.5)'); } }
    else if (swayOn && PROPS[pr.kind].leafy && !pr.cut) leafSwayStep(pr, dt);
  }
  // falling trees keep shedding leaves as they tumble
  for (const b of Env.bodies) if (b.leafy && b.gen === 0 && b.awake && Math.abs(b.va) > .7 && Math.random() < dt * 7) leafBurst({ kind: b.kind }, b.x, b.y, 2);
}
/* Draws the swaying leaf layer of a prop: rotation + shear around the leaf
   anchor (bottom center for bushes → the top waves while the base stays
   grounded; crown base for trees), a slow "breathe" squash/stretch, a fast
   per-plant jiggle and a sub-pixel drift for small plants. */
function drawLeafLayer(c, pr, d, sp, t) {
  if (!sp.leaf) return;
  const anch = d.leafAnchor || (d.tree ? [.5, .38] : [.5, .96]);
  const ax = (anch[0] - .5) * d.w, ay = (anch[1] - 1) * d.h;
  const flip = pr.flip ? -1 : 1;
  const ang = (pr.leafAng || 0) * flip;
  const jig = d.small ? Math.sin(t * 3.1 + pr.seed * 2.3) * .016 : 0; // per-plant jiggle
  const br = d.small ? 1 + Math.sin(t * 2.2 + pr.seed) * .024 : 1 + Math.sin(t * 1.4 + pr.seed) * .007; // breathe
  if (d.small) c.translate(Math.sin(t * 3.3 + pr.seed * 1.7) * .7, Math.cos(t * 2.6 + pr.seed) * .5); // sub-pixel drift
  c.translate(ax, ay);
  c.rotate(ang * .45 + jig);
  c.transform(1, 0, -ang * 1.7, 1, 0, 0); // shear: the higher the foliage, the further it leans
  c.scale(1 + (br - 1) * .4, br);
  c.translate(-ax, -ay);
  c.drawImage(sp.leaf, -(d.w / 2 + SPRITE_M), -(d.h + SPRITE_M), d.w + SPRITE_M * 2, d.h + SPRITE_M * 2);
}
function drawProps(c, V, t) {
  const th = T.theme; const wk = 1 + Math.abs(Env.wind || 0) / 60;
  const swayOn = Settings.leafSway !== false;
  // shadows: soft penumbra + darker core, nudged downwind
  const sh1 = new Path2D(), sh2 = new Path2D();
  for (const pr of Env.props) { if (pr.dead) continue; const d = PROPS[pr.kind]; if (d.small || pr.x < V.x0 - 100 || pr.x > V.x1 + 100 || pr.y < V.y0 || pr.y > V.y1 + 20) continue; const rx = Math.min(60, d.w * .26) * pr.s; const ox = (Env.wind || 0) * .05; sh1.moveTo(pr.x + rx + ox, pr.y - 1); sh1.ellipse(pr.x + ox, pr.y - 1, rx, 4.5 * pr.s, 0, 0, TAU); sh2.moveTo(pr.x + rx * .62 + ox, pr.y - 1); sh2.ellipse(pr.x + ox, pr.y - 1, rx * .62, 3 * pr.s, 0, 0, TAU); }
  c.fillStyle = rgbaC(INK, .1); c.fill(sh1); c.fillStyle = rgbaC(INK, .1); c.fill(sh2);
  for (const pr of Env.props) {
    if (pr.dead) continue; const d = PROPS[pr.kind]; const s = pr.s; if (pr.x + d.w * s < V.x0 - 60 || pr.x - d.w * s > V.x1 + 60 || pr.y - d.h * s > V.y1 || pr.y < V.y0 - 20) continue;
    const sp = propSprite(pr.kind, pr.variant, th);
    const split = swayOn && sp.leaf && !pr.cut && !pr.charred && pr.burn <= 0;
    const src = pr.stump || (split ? sp.base : sp.c); c.save(); c.translate(pr.x, pr.y);
    let rot = 0; if ((d.tree || d.leafy) && !pr.cut && d.mat !== 'stone') rot = (Math.sin(pr.sway + pr.seed) * .016 + Math.sin(pr.sway * 1.7 + pr.seed) * .006) * wk * (d.small ? 2.2 : 1) + Math.sin(t * 40) * .03 * (pr.shake || 0) + (Env.wind || 0) * .00025;
    else if (pr.shake) rot = Math.sin(t * 50) * .02 * pr.shake;
    c.rotate(rot); let sx = s, sy = s; if (pr.squish) { sy *= 1 - .35 * Math.sin(pr.squish * Math.PI); sx *= 1 + .2 * Math.sin(pr.squish * Math.PI); } if (pr.flip) sx = -sx;
    const dx = -(d.w / 2 + SPRITE_M), dy = -(d.h + SPRITE_M), dw = d.w + SPRITE_M * 2, dh = d.h + SPRITE_M * 2; c.scale(sx, sy); c.drawImage(src, dx, dy, dw, dh);
    if (split) drawLeafLayer(c, pr, d, sp, t);
    if (pr.charred || pr.burn > 0) { c.globalAlpha = pr.charred ? .55 : .3 + .2 * Math.sin(t * 20); c.globalCompositeOperation = 'multiply'; c.drawImage(src, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    c.restore();
  }
  Bodies.draw(c, V); drawGrass(c, V, t); Critters.draw(c, t);
}
function drawPropLights(c, t) {
  const th = T.theme; const nightish = th.night || th.dark > .2; for (const pr of Env.props) { if (pr.dead || pr.cut) continue; const d = PROPS[pr.kind]; if (!d.glow || (d.glowNight && !nightish)) continue; if (!visibleWorld(pr.x, pr.y - d.h * pr.s * .5, 200)) continue;
    const ga = d.glowAt || [0, d.h * .6]; const gx = pr.x + ga[0] * pr.s * (pr.flip ? -1 : 1), gy = pr.y - ga[1] * pr.s; const r = (Math.max(90, d.w * .9) + Math.sin(t * 3 + pr.seed) * 6) * pr.s; c.globalAlpha = nightish ? .55 : .22; c.drawImage(softSprite(d.glow), gx - r, gy - r, r * 2, r * 2); }
  c.globalAlpha = 1;
}
function propsNetState() { const out = []; for (const pr of Env.props) { const d = PROPS[pr.kind]; if (pr.dead || pr.cut || pr.burn > 0 || pr.charred || pr.hp < d.hp) out.push([pr.id, pr.cut || 0, pr.cutS || 0, pr.burn > 0 ? +pr.burn.toFixed(1) : 0, pr.charred ? 1 : 0, pr.dead ? 1 : 0, Math.round(pr.hp), pr.kind]); } return out; }
function applyPropsNetState(arr) {
  if (!Array.isArray(arr)) return; for (const v of arr) { if (!Array.isArray(v)) { const q = Env.props[v.id]; if (q && v.dead) q.dead = true; continue; } const pr = Env.props[v[0]]; if (!pr) continue;
    if (v[7] && PROPS[v[7]]) pr.kind = v[7]; pr.burn = v[3]; pr.charred = !!v[4]; pr.dead = !!v[5]; pr.hp = v[6]; if (v[1] && !pr.dead) { pr.cut = v[1]; pr.cutS = v[2]; makeStump(pr); } }
}
const _applyEventWorld = applyEvent;
applyEvent = function (e) {
  switch (e.k) {
    case 'pbreak': breakProp(e); return;
    case 'phit': { const pr = Env.props[e.id]; if (pr && !pr.dead) { propHitFx(pr, e.x, e.y, e.a); pr.leafT = 0; } return; }
    case 'pburn': { const pr = Env.props[e.id]; if (pr && !pr.dead && !pr.charred && !PROPS[pr.kind].noBurn) { pr.burn = 7; Audio2.play('flame', pr.x, .5, .7); } return; }
    case 'boom': { const pr = Env.props[e.id]; if (pr && !pr.dead) { Bodies.shatterCanvas(propSprite(pr.kind, pr.variant, T.theme).c, pr, 5, pr.x, pr.y - 4, 1100, 'metal', rng(pr.seed), { life: 7 }); pr.dead = true; } return; }
    case 'pfall': { const pr = Env.props[e.id]; if (pr && !pr.dead) toppleProp(pr, e.dir || 1); return; }
  }
  return _applyEventWorld(e);
};
const _fxExplosionWorld = fxExplosion;
fxExplosion = function (e) { _fxExplosionWorld(e); Bodies.blast(e.x, e.y, e.r); Critters.scare(e.x, e.y, e.r * 5); if (Env.grass) for (const g of Env.grass) if (Math.abs(g.x - e.x) < e.r && Math.abs(g.y - e.y) < e.r) g.ph += 2; };
const _drawWaterBackWorld = drawWaterBack;
drawWaterBack = function (c, V) { drawBackProps(c, V); _drawWaterBackWorld(c, V); };
const _updateEnvWorld = updateEnvironment;
updateEnvironment = function (dt) { _updateEnvWorld(dt); if (G.mode !== 'play') return; Bodies.update(Math.min(dt, 1 / 30)); Critters.update(dt); };
Env.grass = Env.grass || []; Env.backProps = Env.backProps || []; Env.critters = Env.critters || [];

/* ---------- F. biomes ---------- */
{ const up = (name, o) => { const t = THEMES.find(q => q.name === name); if (t) Object.assign(t, o); };
  up('Dust Bowl', { grass: .25, props: [['cactus', .5], ['rock', .45], ['bush', .2], ['dead', .15], ['barrel', .1]], under: [['tallgrass', 1]], grassCol: ['#a88a4a', '#d8b86a'] });
  up('Slate Cliffs', { grass: .5, props: [['pine', .7], ['birch', .2], ['rock', .4], ['fern', .3]] });
  up('Moss Garden', { grass: .95, props: [['oak', .55], ['giantshroom', .12], ['bush', .5], ['fern', .5], ['mushroom', .25], ['rock', .2], ['lantern', .06]] });
  up('Ember Hollow', { grass: .15, props: [['dead', .6], ['rock', .4], ['barrel', .1]], under: [], grassCol: ['#6a4a3a', '#9a6a4a'], critters: 1 });
  up('Rainy Meadow', { grass: 1, props: [['oak', .5], ['birch', .25], ['bush', .55], ['reeds', .3], ['flowers', .3], ['mushroom', .12]] });
  up('Thunderstorm Ridge', { grass: .6, props: [['pine', .5], ['dead', .35], ['rock', .3], ['barrel', .15]], critters: 2 });
  up('Tropical Islands', { grass: .3, props: [['palm', .9], ['bush', .25], ['rock', .2], ['barrel', .08], ['crate', .06]], grassCol: ['#7f9a4f', '#b8c46a'] });
  up('Sunset Lagoon', { grass: .3, props: [['palm', .8], ['bush', .3], ['rock', .2], ['lantern', .05]] });
  up('Pine Forest', { grass: .7, props: [['pine', 1], ['oak', .25], ['fern', .5], ['mushroom', .3], ['bush', .3], ['rock', .2]], treeDensity: 1.3 });
  up('Autumn Woods', { grass: .7, props: [['autumn', 1], ['birch', .25], ['bush', .3], ['mushroom', .3], ['pumpkin', .12]], grassCol: ['#8a7a3a', '#c8a050'] });
  up('Snowfield', { grass: .15, props: [['snowpine', 1], ['rock', .3], ['lantern', .04]], grassCol: ['#a9b9a0', '#f1f6f2'], critters: 3 });
  up('Night Swamp', { grass: .65, props: [['dead', .4], ['willow', .3], ['reeds', .7], ['mushroom', .25], ['lantern', .1], ['lamp', .04]], grassCol: ['#3e4a2a', '#5c7040'] });
  up('Volcano', { grass: 0, props: [['dead', .45], ['rock', .5], ['barrel', .1]], under: [], critters: 0 });
  up('Sandstorm Canyon', { grass: .1, props: [['cactus', .8], ['rock', .5], ['barrel', .25], ['crate', .1]], under: [['tallgrass', 1]], critters: 1 });
  up('Cherry Blossom', { grass: .85, props: [['cherry', .9], ['bush', .3], ['flowers', .3], ['lantern', .1], ['rock', .1]] });
  up('Midnight Harbor', { grass: 0, props: [['lamp', .5], ['barrel', .35], ['crate', .35]], under: [], critters: 2 });
}
THEMES.push(
  { name: 'Bamboo Valley', style: 'ground', weather: 'leaves', wind: 28, pits: 1, puddles: 1, pond: true, skyT: '#cfe3c6', skyB: '#f3ecd4', sun: '#fffbe8', far: ['#a3c49a', '#7fa77d'], top: '#7a6b4a', mid: '#57503a', deep: '#2f2b22', cap: '#8fae4a', props: [['bamboo', 1], ['fern', .5], ['rock', .25], ['lantern', .1]], under: [['fern', 1], ['tallgrass', .6]], bgTrees: 'bamboo', cloud: '#ffffff', water: '#5f9c8c', leaf: ['#8fae4a', '#a8c060', '#6f8f3a'], grass: .8, treeDensity: 1.5 },
  { name: 'Savanna Sunset', style: 'ground', weather: 'dust', wind: 22, pits: 1, puddles: 1, skyT: '#f19a5c', skyB: '#f6d58e', sun: '#ffe2a0', sunLow: true, far: ['#c97a52', '#a65a44'], top: '#b07a46', mid: '#865530', deep: '#4a2e1f', cap: '#d2a850', props: [['acacia', .8], ['baobab', .25], ['tallgrass', .7], ['rock', .3]], under: [['tallgrass', 1]], bgTrees: 'acacias', cloud: '#ffd7a8', water: '#6c9aa0', grass: .7, grassCol: ['#a8823a', '#e0b860'], leafTone: '#7d8a3a' },
  { name: 'Birch Grove', style: 'ground', weather: 'leaves', wind: 18, pits: 1, puddles: 2, skyT: '#dde7ea', skyB: '#f3efe2', sun: '#fffdf2', far: ['#b6c8b4', '#93ad97'], top: '#806a50', mid: '#5e4d3c', deep: '#33291f', cap: '#a8b85a', props: [['birch', 1], ['bush', .35], ['flowers', .35], ['fern', .3], ['mushroom', .15]], bgTrees: 'birches', cloud: '#ffffff', water: '#6a9fb0', leaf: ['#c8c860', '#e0c860', '#a8b85a'], grass: .9, leafTone: '#a8b85a' },
  { name: 'Willow Marsh', style: 'ground', weather: 'drizzle', wind: -14, pits: 1, puddles: 4, swamp: true, skyT: '#b9c4bb', skyB: '#dfe0cf', sun: '#f2f4e6', sunKind: 'none', far: ['#8ea08e', '#728a78'], top: '#5e5a40', mid: '#45422f', deep: '#25241a', cap: '#7a9a50', props: [['willow', 1], ['reeds', .8], ['bush', .3], ['lantern', .08]], under: [['reeds', 1], ['tallgrass', .6]], bgTrees: 'willows', cloud: '#e6ebe4', overcast: .3, fog: .3, water: '#5d7f62', grass: .8, grassCol: ['#5c6a3a', '#8aa05a'] },
  { name: 'Crystal Hollow', style: 'float', weather: 'sparkle', wind: 6, skyT: '#1d1a36', skyB: '#4b3a6a', sun: '#d8ccff', sunKind: 'moon', night: true, far: ['#3a2f5a', '#2a2346'], top: '#4e4766', mid: '#352f4a', deep: '#1a1726', cap: '#6a7fb0', props: [['crystal', .8], ['giantshroom', .3], ['rock', .3], ['mushroom', .3]], under: [['mushroom', .4], ['fern', .6]], bgTrees: 'crystals', cloud: '#5a4e80', dark: .35, water: '#5a7ad0', crystal: '#a99cf5', grass: .35, grassCol: ['#4a5a8a', '#8aa0d0'], critters: 2 },
  { name: 'Mushroom Grove', style: 'ground', weather: 'fireflies', wind: 8, pits: 1, puddles: 2, skyT: '#5a4a6a', skyB: '#c98a8a', sun: '#ffd8b0', sunLow: true, far: ['#6a4a64', '#523a52'], top: '#6a5244', mid: '#4a3a34', deep: '#261e1e', cap: '#8a9a5a', props: [['giantshroom', 1], ['mushroom', .6], ['fern', .4], ['lantern', .08]], under: [['mushroom', .8], ['fern', .6], ['flowers', .3]], bgTrees: 'shrooms', cloud: '#d8a0a8', dark: .18, water: '#6a8ab0', grass: .7, treeDensity: 1.2 },
  { name: 'Haunted Hill', style: 'ground', weather: 'fog', wind: -20, pits: 1, puddles: 1, skyT: '#1a1c2a', skyB: '#4a4458', sun: '#f2ecd0', sunKind: 'moon', night: true, far: ['#2e2c3c', '#24222f'], top: '#4a4440', mid: '#33302d', deep: '#1a1816', cap: '#5a6040', props: [['dead', .7], ['gravestone', .6], ['pumpkin', .35], ['lantern', .1]], under: [['tallgrass', .6], ['pumpkin', .2]], bgTrees: 'graves', cloud: '#4a4a5a', fog: .5, dark: .4, water: '#3a4a50', grass: .5, grassCol: ['#3a4030', '#5a6448'], critters: 4 },
  { name: 'Sunken Ruins', style: 'sea', weather: 'sparkle', wind: 12, skyT: '#9ad0d8', skyB: '#eef0dc', sun: '#fffbe0', far: ['#9cc4bc', '#7aa8a4'], top: '#c8b890', mid: '#9a8a68', deep: '#5a5040', cap: '#a8b870', props: [['pillar', .7], ['palm', .4], ['rock', .3], ['bush', .3], ['fern', .2]], bgTrees: 'ruins', cloud: '#ffffff', water: '#2f9aa8', shallow: '#80d4cc', grass: .4 },
  { name: 'Desert Oasis', style: 'ground', weather: 'sand', wind: 60, pits: 1, pond: true, skyT: '#f0c888', skyB: '#f8e6c0', sun: '#fff4d4', far: ['#e0a870', '#c48858'], top: '#e0b070', mid: '#b88050', deep: '#6a4430', cap: '#ecc480', props: [['palm', .7], ['cactus', .5], ['rock', .3], ['crate', .1], ['lantern', .05]], under: [['tallgrass', 1], ['bush', .3]], bgTrees: 'mesas', cloud: '#fae6c8', haze: .2, water: '#3fa8b4', grass: .2, grassCol: ['#8a9a4a', '#c8c870'] },
  { name: 'Glacier Peaks', style: 'float', weather: 'snow', wind: -50, skyT: '#c8dcec', skyB: '#eef2f2', sun: '#ffffff', far: ['#a8c0d4', '#88a4bc'], top: '#e8f0f4', mid: '#8aa0b4', deep: '#4a5a70', cap: '#ffffff', props: [['snowpine', .8], ['crystal', .3], ['rock', .4]], under: [], bgTrees: 'snowpines', cloud: '#ffffff', water: '#7ab8d8', icy: true, grass: .1, grassCol: ['#9ab0a8', '#eef6f4'], critters: 2 },
  { name: 'Lavender Fields', style: 'ground', weather: 'petals', wind: 24, pits: 0, puddles: 1, skyT: '#d8d0ec', skyB: '#f8eee0', sun: '#fffaf0', far: ['#b8a8d0', '#9a88b8'], top: '#7a6650', mid: '#5a4a3c', deep: '#30281f', cap: '#8aa05a', props: [['lavender', 1], ['oak', .25], ['flowers', .4], ['rock', .1], ['lantern', .05]], under: [['lavender', 1], ['flowers', .5]], bgTrees: 'lavrows', cloud: '#ffffff', water: '#7a9ac0', leaf: ['#b9a0e0', '#9b7fc7', '#f7e0f0'], flower: '#9b7fc7', grass: .9, leafTone: '#7d9a55', plantDensity: 2.2, treeDensity: .5 }
);
const _drawTreeLineOld = drawTreeLine;
drawTreeLine = function (x, R, th, base, M) {
  const kind = th.bgTrees; const NEW = ['bamboo', 'birches', 'acacias', 'crystals', 'graves', 'ruins', 'shrooms', 'willows', 'lavrows'];
  const custom = typeof th.treeLine === 'function';
  if (!custom && !NEW.includes(kind)) return _drawTreeLineOld(x, R, th, base, M);
  const col = mix(th.far[1], '#1f1c24', .22), edge = 'rgba(31,28,36,.25)'; x.lineJoin = 'round'; x.lineCap = 'round';
  const gyAt = px => base - (fbm(px * .0025, T.seed + 7) * .5 + .5) * 160 + 30;
  // a biome file can draw its own silhouette row (see README, "Biome scripting")
  if (custom) { biomeHook('treeLine', BiomeAPI.ctx({ x, R, base, M, col, edge, gyAt })); return; }
  for (let px = -M; px < W + M;) {
    const gy = gyAt(px), h = 30 + R() * 50; x.fillStyle = col; x.strokeStyle = edge; x.lineWidth = 1.6; x.beginPath();
    if (kind === 'bamboo') { const n = 2 + (R() * 3 | 0); for (let i = 0; i < n; i++) { const bx = px + i * 7, hh = h * 1.6 + R() * 30; x.lineWidth = 5; x.strokeStyle = col; x.beginPath(); x.moveTo(bx, gy); x.quadraticCurveTo(bx + 4, gy - hh * .5, bx + 8, gy - hh); x.stroke(); for (let k = 1; k < 4; k++) { x.fillStyle = col; x.beginPath(); x.ellipse(bx + 8 * k / 4 + 6, gy - hh * k / 4, 9, 2.5, -.4, 0, TAU); x.fill(); } } px += 22 + R() * 30; continue; }
    if (kind === 'birches') { x.fillStyle = mix(th.far[1], '#f4f0e6', .45); x.fillRect(px - 2.5, gy - h * 1.3, 5, h * 1.3); x.fillStyle = col; x.beginPath(); x.ellipse(px, gy - h * 1.25, h * .3, h * .42, 0, 0, TAU); x.fill(); x.stroke(); px += 18 + R() * 30; continue; }
    if (kind === 'acacias') { x.lineWidth = 3; x.strokeStyle = col; x.beginPath(); x.moveTo(px, gy); x.quadraticCurveTo(px + 3, gy - h * .6, px - 6, gy - h); x.moveTo(px + 1, gy - h * .5); x.lineTo(px + 14, gy - h * .95); x.stroke(); x.beginPath(); x.ellipse(px + 2, gy - h - 2, h * .7, h * .14, 0, 0, TAU); x.fill(); x.stroke(); px += 70 + R() * 110; continue; }
    if (kind === 'crystals') { const c2 = mix(th.crystal || '#a99cf5', th.far[1], .55); x.fillStyle = c2; for (let i = 0; i < 3; i++) { const ox = px + (i - 1) * 9, hh = h * (.6 + R() * .7), lean = (i - 1) * .2; x.beginPath(); x.moveTo(ox - 6, gy); x.lineTo(ox + Math.sin(lean) * hh - 2, gy - hh); x.lineTo(ox + Math.sin(lean) * hh + 3, gy - hh - 6); x.lineTo(ox + 6, gy); x.closePath(); x.fill(); x.stroke(); } px += 40 + R() * 60; continue; }
    if (kind === 'graves') { if (R() < .4) { x.lineWidth = 2.4; x.strokeStyle = col; x.beginPath(); x.moveTo(px, gy); x.lineTo(px + 2, gy - h * 1.2); x.moveTo(px + 1, gy - h * .7); x.lineTo(px + 14, gy - h); x.moveTo(px + 1, gy - h * .5); x.lineTo(px - 12, gy - h * .8); x.stroke(); } else { x.beginPath(); x.moveTo(px - 6, gy); x.lineTo(px - 6, gy - 12); x.arc(px, gy - 12, 6, Math.PI, 0); x.lineTo(px + 6, gy); x.closePath(); x.fill(); x.stroke(); } px += 26 + R() * 40; continue; }
    if (kind === 'ruins') { const bw = 14 + R() * 10, bh = h * (.8 + R() * 1.2); x.fillStyle = mix(th.far[1], '#e8e0c8', .2); x.beginPath(); x.moveTo(px, gy); x.lineTo(px, gy - bh); for (let k = 0; k < 4; k++) x.lineTo(px + bw * (k + 1) / 4, gy - bh + (R() - .3) * 10); x.lineTo(px + bw, gy); x.closePath(); x.fill(); x.stroke(); if (R() < .3) { x.fillRect(px - 4, gy - bh - 6, bw + 40, 6); } px += 60 + R() * 120; continue; }
    if (kind === 'shrooms') { const c2 = R() < .5 ? mix('#c95b8a', th.far[1], .5) : mix('#d9573b', th.far[1], .5); x.fillStyle = col; x.fillRect(px - 3, gy - h, 6, h); x.fillStyle = c2; x.beginPath(); x.ellipse(px, gy - h, h * .45, h * .22, 0, Math.PI, 0); x.closePath(); x.fill(); x.stroke(); px += 30 + R() * 50; continue; }
    if (kind === 'willows') { x.beginPath(); x.ellipse(px, gy - h, h * .5, h * .35, 0, Math.PI, 0); x.fill(); x.lineWidth = 2; x.strokeStyle = col; x.beginPath(); for (let k = -4; k <= 4; k++) { x.moveTo(px + k * h * .11, gy - h); x.quadraticCurveTo(px + k * h * .13, gy - h * .5, px + k * h * .12, gy - h * .1); } x.stroke(); x.fillRect(px - 2.5, gy - h, 5, h); px += 40 + R() * 50; continue; }
    if (kind === 'lavrows') { x.fillStyle = mix(th.flower || '#9b7fc7', th.far[1], .45); for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(px + k * 12, gy - 5, 7, 6, 0, Math.PI, 0); x.fill(); } px += 80 + R() * 30; continue; }
    px += 40;
  }
};

/* welcome-packet extension point used by build.js / modes.js */
const NetExt = { hooks: [], add(h) { this.hooks.push(h); }, pack() { const o = {}; for (const h of this.hooks) try { if (h.pack) o[h.key] = h.pack(); } catch (e) { console.warn(e); } return o; }, pre(ext) { for (const h of this.hooks) try { if (h.pre && ext) h.pre(ext[h.key]); } catch (e) { console.warn(e); } }, post(ext) { for (const h of this.hooks) try { if (h.post && ext) h.post(ext[h.key]); } catch (e) { console.warn(e); } } };

/* late joiners get the current water levels too (pools may already be drained or draining) */
NetExt.add({ key: 'w',
  pack: () => Env.water.map(b => [Math.round(b.level * 10) / 10, Math.round(b.target * 10) / 10, b.alive ? 1 : 0, b.leakX == null ? null : Math.round(b.leakX), Math.round(b.leakY || 0)]),
  post: v => { if (!Array.isArray(v)) return; v.forEach((a, i) => { const b = Env.water[i]; if (!b || b.sea || !Array.isArray(a)) return; b.level = +a[0] || b.level; b.target = +a[1] || b.target; b.alive = !!a[2]; b.leakX = a[3]; b.leakY = a[4]; b.draining = b.level < b.target - .5; waterColumns(b); }); } });
