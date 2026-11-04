'use strict';
/* =====================================================================
   INKBRAWL EXPANSION — worlds, water, weather, weapons, modes and polish.
   Loaded after the core engine in index.html. It extends the core by
   replacing a handful of functions and adding new systems:
     A. biomes + world size        E. weapon mechanics + projectiles
     B. map generation + props     F. host rules (crates, zone, lightning)
     C. water (spring physics)     G. camera + rendering
     D. weather                    H. UI, settings, quality scaling
   ===================================================================== */

/* ---------- A. biomes ---------- */
Object.assign(THEMES[0], { name: 'Dust Bowl', style: 'float', weather: 'dust', wind: 18, props: [['boulder', .5], ['cactus', .35], ['bush', .2]], bgTrees: 'none', cloud: '#fff6e8', water: '#5aa6b8' });
Object.assign(THEMES[1], { name: 'Slate Cliffs', style: 'float', weather: 'none', wind: -30, props: [['pine', .6], ['boulder', .3]], bgTrees: 'pines', cloud: '#f1f3f5', water: '#4d8ea6' });
Object.assign(THEMES[2], { name: 'Moss Garden', style: 'float', weather: 'leaves', wind: 20, props: [['oak', .5], ['bush', .5], ['mushroom', .25]], bgTrees: 'oaks', leaf: ['#87a456', '#a4b85c', '#6f9a4f'], cloud: '#fffbe8', water: '#4fa0a0' });
Object.assign(THEMES[3], { name: 'Ember Hollow', style: 'float', weather: 'embers', wind: 30, props: [['dead', .6], ['boulder', .3]], bgTrees: 'dead', cloud: '#f2c3a6', water: '#c45a30' });
THEMES.push(
  { name: 'Rainy Meadow', style: 'ground', weather: 'rain', wind: -55, pits: 1, puddles: 4, skyT: '#aab7bf', skyB: '#cfd2c8', sun: '#e9eee9', sunKind: 'none', far: ['#97a99a', '#7d9281'], top: '#7b6a4c', mid: '#5c4d3a', deep: '#33291f', cap: '#6f9e4c', props: [['oak', .55], ['bush', .55], ['reeds', .3], ['mushroom', .12]], bgTrees: 'oaks', cloud: '#e4e8e8', overcast: .35, water: '#5f8fa3', leaf: ['#6f9e4c', '#8cb35a'] },
  { name: 'Thunderstorm Ridge', style: 'ground', weather: 'storm', wind: -130, pits: 2, puddles: 3, skyT: '#3c4152', skyB: '#69687a', sun: '#c7cbe0', sunKind: 'none', far: ['#4c5163', '#3c4050'], top: '#5e5a5c', mid: '#454146', deep: '#25232a', cap: '#5f7e58', props: [['pine', .5], ['dead', .35], ['barrel', .15]], bgTrees: 'pines', cloud: '#7d8092', overcast: .55, dark: .32, water: '#4a6475' },
  { name: 'Tropical Islands', style: 'sea', weather: 'none', wind: 25, skyT: '#8fd3ea', skyB: '#e9f3dc', sun: '#fff9dc', far: ['#9fd0c9', '#7fb9b2'], top: '#e6c98e', mid: '#c49a62', deep: '#7b5b3d', cap: '#e9d9a3', props: [['palm', .9], ['bush', .25], ['barrel', .08]], bgTrees: 'palms', cloud: '#ffffff', water: '#2ba6bd', shallow: '#7fe0d9' },
  { name: 'Sunset Lagoon', style: 'sea', weather: 'sparkle', wind: 15, skyT: '#f2a36b', skyB: '#f7d29a', sun: '#ffe7b0', far: ['#d68a6f', '#b86e62'], top: '#d9a46c', mid: '#a76e4b', deep: '#5b3a33', cap: '#efc27d', props: [['palm', .8], ['bush', .3]], bgTrees: 'palms', cloud: '#ffd9bd', water: '#e07a63', shallow: '#f5b88a', sunLow: true },
  { name: 'Pine Forest', style: 'ground', weather: 'fog', wind: 10, pits: 1, puddles: 1, skyT: '#c7d8cc', skyB: '#ecebd8', sun: '#fffdf0', far: ['#88a88f', '#6b8c74'], top: '#6e5a42', mid: '#4f4032', deep: '#2b231c', cap: '#5f8d4a', props: [['pine', 1], ['oak', .3], ['mushroom', .3], ['bush', .3]], bgTrees: 'pines', cloud: '#ffffff', fog: .45, water: '#4f8b88' },
  { name: 'Autumn Woods', style: 'ground', weather: 'leaves', wind: 45, pits: 1, puddles: 2, skyT: '#f0c99a', skyB: '#f6e2c3', sun: '#fff1d0', far: ['#d59b6a', '#b9784f'], top: '#8a5a3b', mid: '#66412f', deep: '#3a241e', cap: '#c8742f', props: [['autumn', 1], ['bush', .3], ['mushroom', .3]], bgTrees: 'autumn', cloud: '#fff2df', leaf: ['#d9573b', '#e9a23b', '#c8742f', '#b5452d'], water: '#6f8b8c' },
  { name: 'Snowfield', style: 'ground', weather: 'snow', wind: -35, pits: 1, puddles: 2, skyT: '#d7e3ee', skyB: '#f4f1ea', sun: '#ffffff', far: ['#bccbd8', '#9fb2c4'], top: '#eef1f2', mid: '#93a1ad', deep: '#4e5a68', cap: '#ffffff', props: [['snowpine', 1], ['boulder', .25]], bgTrees: 'snowpines', cloud: '#ffffff', water: '#7fb7d3', icy: true },
  { name: 'Night Swamp', style: 'ground', weather: 'fireflies', wind: 6, pits: 1, puddles: 4, swamp: true, skyT: '#1c2433', skyB: '#3b4a48', sun: '#e6f0d0', sunKind: 'moon', night: true, far: ['#2f3d3b', '#263230'], top: '#4b4a36', mid: '#35352a', deep: '#1c1c18', cap: '#5c7040', props: [['dead', .45], ['reeds', .7], ['mushroom', .25], ['lamp', .1]], bgTrees: 'dead', cloud: '#59625f', fog: .55, dark: .45, water: '#3c5a3d' },
  { name: 'Volcano', style: 'ground', weather: 'ash', wind: 35, pits: 1, lavaPools: 3, skyT: '#40272b', skyB: '#a3523b', sun: '#ffc07a', sunKind: 'none', far: ['#5c3030', '#3e2427'], top: '#4a3735', mid: '#33262a', deep: '#1a1216', cap: '#6b4a3a', props: [['dead', .45], ['boulder', .45], ['barrel', .1]], bgTrees: 'volcano', cloud: '#5b4040', dark: .25, water: '#ff6a1f', lava: true },
  { name: 'Sandstorm Canyon', style: 'ground', weather: 'sand', wind: 190, pits: 2, skyT: '#e7b46f', skyB: '#f0d3a0', sun: '#fff0c8', far: ['#d4955c', '#b97a4a'], top: '#d18b4c', mid: '#a5643a', deep: '#5f3626', cap: '#e8b16a', props: [['cactus', .8], ['boulder', .4], ['barrel', .25]], bgTrees: 'mesas', cloud: '#f7dcb5', haze: .3, water: '#5aa6b8' },
  { name: 'Cherry Blossom', style: 'ground', weather: 'petals', wind: 32, pits: 0, puddles: 2, pond: true, skyT: '#f5d6dc', skyB: '#fbf0e3', sun: '#fffaf2', far: ['#d9b3c0', '#c49aac'], top: '#7c6656', mid: '#5c4a41', deep: '#33282a', cap: '#86a65a', props: [['cherry', .9], ['bush', .3], ['lamp', .08]], bgTrees: 'cherry', cloud: '#ffffff', water: '#7fa9c0', leaf: ['#f7b6c8', '#f39bb4', '#fde2ea'] },
  { name: 'Midnight Harbor', style: 'sea', weather: 'drizzle', wind: -40, skyT: '#121b30', skyB: '#34405c', sun: '#f6f0d6', sunKind: 'moon', night: true, far: ['#25304a', '#1b2438'], top: '#6b6a72', mid: '#46454f', deep: '#24232b', cap: '#8b8677', props: [['lamp', .5], ['barrel', .35], ['crate', .25]], bgTrees: 'harbor', cloud: '#4a5570', dark: .38, water: '#1f4e6b', shallow: '#3c7590' }
);
const RARITY = { common: { c: '#7d756b', n: 'Common', w: 1 }, rare: { c: '#3f8a86', n: 'Rare', w: 1.15 }, epic: { c: '#7a5aa8', n: 'Epic', w: 1.3 }, legendary: { c: '#d08a25', n: 'Legendary', w: 1.5 }, mythic: { c: '#e055d8', n: 'Mythic', w: 1.7 } };
const rarityOf = w => RARITY[(w && w.rarity) || 'common'] || RARITY.common;

/* ---------- biome scripting ----------
   A biome file (biomes/<id>/<id>.js) can hand the engine functions as well
   as colours. The engine calls them at fixed moments with a small toolkit
   ("ctx"), so a new biome never needs edits to the engine files. Hooks:
     terrain(ctx)  draw the land shape        texture(ctx)    paint over the terrain texture
     background(ctx) paint the far backdrop   treeLine(ctx)   your own silhouette row
     onMap(ctx)    after a map is built       update(dt, t)   every frame
     drawSky / drawBack / drawFront / drawGlow (c, view, t)  extra draw layers
   Every hook is optional and errors are caught (logged once) so a broken
   biome can never crash a match. Full guide in README.md. */
const BiomeAPI = {
  errs: new Set(),
  ctx(extra) {
    return Object.assign({ th: T.theme, W, H, big: G.gameMode === 'expedition', seed: T.seed, time: Env.time, env: Env,
      surface: (x, fromY) => surfaceFromGrid(x, fromY), solid: (x, y) => solidAt(x, y), water: (x, y) => waterAt(x, y),
      fx: o => FX.add(Object.assign({ t: 0, life: 1 }, o)), glow: col => softSprite(col), mix, shade, rgba, fbm, lerp, clamp, rng, hash, smoothPath, TAU, INK }, extra || {});
  },
  terrainCtx(R, mc, seed, big, basins) {
    const th = T.theme; let dirty = true;
    return this.ctx({ R, mc, seed, big, scale: W / 1600, base: H - 300,
      fill: pts => { dirty = true; fillShape(mc, pts); },
      cut: pts => { dirty = true; mc.globalCompositeOperation = 'destination-out'; fillShape(mc, pts); mc.globalCompositeOperation = 'source-over'; },
      ground: (x0, x1, base, amp = 80, bottom = H + 140) => { dirty = true; fillShape(mc, groundPoly(x0, x1, base, amp, seed, bottom)); },
      island: (x0, x1, top, depth = 120, flat = false) => { dirty = true; fillShape(mc, islandPoly(R, x0, x1, top, depth, seed + ((x0 | 0) % 97), flat)); },
      seaIsland: (x0, x1, top, bottom = H + 120) => { dirty = true; fillShape(mc, seaIsland(x0, x1, top, seed + ((x0 | 0) % 53), bottom)); },
      platforms: (floorY, topY = 240) => { dirty = true; return platformTiers(R, mc, seed, floorY, topY); },
      rebuild: () => { rebuildGridFromMask(); dirty = false; },
      surface: (x, fromY) => { if (dirty) { rebuildGridFromMask(); dirty = false; } return surfaceFromGrid(x, fromY); },
      sea: level => { const b = makeSea(level, th); Env.water.push(b); return b; },
      basin: (kind = 'pond', base = H - 330) => { if (dirty) { rebuildGridFromMask(); dirty = false; } const n = basins.length; carveBasin(R, kind, basins, base); return basins.length > n ? basins[basins.length - 1] : null; },
    });
  },
};
function biomeHook(name, ...args) {
  const th = T.theme, f = th && th[name]; if (typeof f !== 'function') return undefined;
  try { return f.apply(th, args); }
  catch (e) { const k = (th.id || th.name) + '.' + name; if (!BiomeAPI.errs.has(k)) { BiomeAPI.errs.add(k); console.warn('Biome hook ' + k + ' failed:', e); } }
}
G.biome = 0; G.biomeChoice = -1; G.gameMode = 'arena';

/* world resizing (arena 1600x1000, Big Wilds 3600x1600). Terrain buffers scale
   with quality so phones never allocate desktop-sized bitmaps. */
const Settings = { graphics: 'auto', weather: true, shake: true, volume: .65, fps: false };
function readSettings() { try { const j = JSON.parse(getCookie('ib_settings') || '{}'); Object.assign(Settings, j); } catch (e) { } }
function saveSettings() { setCookie('ib_settings', JSON.stringify(Settings)); }
readSettings();
const deviceTier = (() => { const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4, px = screen.width * screen.height * Math.min(2, devicePixelRatio || 1) ** 2; if (mem <= 2 || cores <= 2) return 0; if (mem <= 4 || px > 5e6 || /iPhone|Android/.test(navigator.userAgent)) return 1; return 2; })();
function terrainQualityFor(w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), base = clamp(Math.round(Math.min(innerWidth / 1600, innerHeight / 1000) * dpr * 4) / 4, 1, 1.35);
  const pref = Settings.graphics === 'low' ? .75 : Settings.graphics === 'medium' ? .95 : Settings.graphics === 'high' ? 1.35 : [.8, 1, 1.25][deviceTier];
  const cap = Math.sqrt(9.5e6 / (w * h)); // keep each full terrain bitmap under ~38 MB
  return clamp(Math.min(base, pref, cap), .55, 1.35);
}
function setWorldSize(w, h) {
  const q = terrainQualityFor(w, h);
  if (w === W && h === H && T.mask && Math.abs(T.Q - q) < .01) return;
  W = w; H = h; GW = W / CELL; GH = H / CELL; T.grid = new Uint8Array(GW * GH); terrainInit(q); resize();
}

/* ---------- B. map generation ---------- */
const Env = { water: [], props: [], crates: [], bolts: [], weather: null, mini: null, zone: null, nextCrate: 0, nextBolt: 0, crateId: 1, burnT: 0, lavaT: 0, zoneT: 0, wind: 0, time: 0, ripples: [] };
function groundPoly(x0, x1, base, amp, seed, bottom) {
  const pts = [[x0, bottom]]; const n = Math.max(6, Math.round((x1 - x0) / 22));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, edge = Math.min(1, Math.min(t, 1 - t) * 9); pts.push([x, base + fbm(x * .0032, seed) * amp + fbm(x * .018, seed + 4) * 12 + (1 - edge) * 30]); }
  pts.push([x1, bottom]); return pts;
}
function seaIsland(x0, x1, top, seed, bottom) {
  const pts = [[x0 - 30, bottom]]; const n = Math.max(8, Math.round((x1 - x0) / 20));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, edge = Math.sin(t * Math.PI); pts.push([x, top + (1 - Math.pow(edge, .22)) * 260 + fbm(x * .006, seed) * 34 * edge + fbm(x * .03, seed + 5) * 6]); }
  pts.push([x1 + 30, bottom]); return pts;
}
function fillShape(mc, pts) { mc.beginPath(); smoothPath(mc, pts); mc.fill(); }
function surfaceFromGrid(x, fromY = 0) { const gx = clamp(x / CELL | 0, 0, GW - 1); for (let gy = Math.max(0, fromY / CELL | 0); gy < GH; gy++) if (T.grid[gy * GW + gx]) return gy * CELL; return null; }
function rebuildGridFromMask() {
  const small = mkCanvas(GW, GH), sc = small.getContext('2d', { willReadFrequently: true }); sc.drawImage(T.mask, 0, 0, GW, GH);
  const d = sc.getImageData(0, 0, GW, GH).data; for (let i = 0; i < GW * GH; i++) T.grid[i] = d[i * 4 + 3] > 120 ? 1 : 0;
}
/* map sizes: arena 1600x1000. Big Wilds = the same kind of map scaled up
   (4x the area by default, 6x / 9x as match options), with extra tiers of
   reachable platforms filling the height (tier gaps stay under jump reach). */
function bigMapSize() { const k = { 4: 2, 6: 2.45, 9: 3 }[(G.opts && G.opts.mapSize) || 4] || 2; return [Math.round(1600 * k / 40) * 40, Math.round(1000 * k / 40) * 40]; }
function platformTiers(R, mc, seed, floorY, topY, avoid) {
  const plats = []; let y = floorY - 175 - R() * 40, tier = 0;
  while (y > topY) { const per = Math.max(2, Math.round(W / (520 + R() * 160))); const slot = (W - 160) / per;
    for (let i = 0; i < per; i++) { if (R() < .18) continue; const w = 140 + R() * 170; const px = 80 + i * slot + (tier % 2 ? slot * .45 : 0) + R() * Math.max(10, slot - w - 60); if (px + w > W - 60) continue; const py = y + (R() - .5) * 50;
      if (avoid && avoid(px, px + w, py)) continue; if (plats.some(p => px < p.x + p.w + 60 && px + w + 60 > p.x && Math.abs(py - p.y) < 120)) continue; plats.push({ x: px, y: py, w }); fillShape(mc, islandPoly(R, px, px + w, py, 50 + R() * 50, seed + 300 + plats.length, R() < .6)); }
    y -= 190 + R() * 35; tier++; }
  return plats;
}
generateMap = function (seed) {
  const th = THEMES[(G.biome ?? (seed % THEMES.length)) % THEMES.length] || THEMES[0];
  const big = G.gameMode === 'expedition'; const [bw, bh] = big ? bigMapSize() : [1600, 1000];
  setWorldSize(bw, bh); const sx = W / 1600;
  const R = rng(seed); T.seed = seed; T.theme = th; T.craters = []; T.dirty = []; Env.water = []; Env.props = []; Env.crates = []; Env.bolts = []; Env.ripples = []; Env.wind = th.wind || 0; Env.zone = null;
  const mc = T.mctx; mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalCompositeOperation = 'source-over'; mc.clearRect(0, 0, T.mask.width, T.mask.height); mc.setTransform(T.Q, 0, 0, T.Q, 0, 0); mc.fillStyle = '#fff';
  const flat = !!(G.opts && G.opts.terrain === 'flat'); const style = flat ? 'flat' : th.style || 'float'; const basins = [];
  if (flat) {
    // Flat maps: one long, level field (a tiny hand-drawn wobble so it still looks inked)
    const base = H - 300; fillShape(mc, groundPoly(-60, W + 60, base, 3, seed, H + 140)); rebuildGridFromMask();
  } else if (typeof th.terrain === 'function') {
    // the biome file draws its own land (see README, "Biome scripting")
    biomeHook('terrain', BiomeAPI.terrainCtx(R, mc, seed, big, basins));
  } else if (style === 'sea') {
    const sea = H - 235; const n = Math.round(3 * sx); const margin = 40 * sx; const span = (W - margin * 2) / n; let x = margin;
    for (let i = 0; i < n; i++) { const w = span * (.66 + R() * .2), xx = x + R() * (span - w); fillShape(mc, seaIsland(xx, xx + w, sea - 45 - R() * 90, seed + i * 13, H + 120)); x += span; }
    if (big) platformTiers(R, mc, seed, sea - 120, 240); else { for (let i = 0; i < 3; i++) { const w = 130 + R() * 160, px = 80 + R() * (W - 160 - w), py = 260 + R() * (sea - 520); fillShape(mc, islandPoly(R, px, px + w, py, 55 + R() * 50, seed + 60 + i, true)); } }
    Env.water.push(makeSea(sea, th));
  } else if (style === 'ground') {
    const base = H - 330, amp = 80; const pits = []; const nPits = Math.round((th.pits || 0) * sx);
    for (let i = 0; i < nPits; i++) { const pw = 120 + R() * 70; const px = W * (.12 + (i + R() * .6) / Math.max(1, nPits) * .76); pits.push([px, px + pw]); }
    pits.sort((a, b) => a[0] - b[0]); let x0 = -60;
    for (const [a, b] of pits) { fillShape(mc, groundPoly(x0, a, base, amp, seed, H + 140)); x0 = b; }
    fillShape(mc, groundPoly(x0, W + 60, base, amp, seed, H + 140));
    if (big) platformTiers(R, mc, seed, base - 10, 240); else { const nI = 2 + (R() < .5 ? 1 : 0); for (let i = 0; i < nI; i++) { const w = 150 + R() * 170, px = 70 + R() * (W - 140 - w), py = 250 + R() * (base - 380); fillShape(mc, islandPoly(R, px, px + w, py, 60 + R() * 70, seed + 100 + i, i % 2 === 0)); } }
    rebuildGridFromMask();
    const kinds = []; for (let i = 0; i < Math.round(((th.puddles || 0)) * (big ? sx * .8 : 1)); i++) kinds.push(th.swamp ? 'swamp' : 'puddle'); for (let i = 0; i < Math.round((th.lavaPools || 0) * (big ? sx * .8 : 1)); i++) kinds.push('lava');
    if (th.pond || (big && !th.lava)) kinds.unshift('pond');
    for (const kind of kinds) carveBasin(R, kind, basins, base);
  } else {
    const nIsl = big ? Math.round(2.6 * sx) : 2 + (R() < .55 ? 1 : 0); const margin = 70 + R() * 50; const gapTot = (nIsl - 1) * (100 + R() * 50); const span = (W - margin * 2 - gapTot) / nIsl; let x = margin; const floor = H - 340;
    for (let i = 0; i < nIsl; i++) { const w = span * (.9 + R() * .2); const top = floor + R() * 120; fillShape(mc, islandPoly(R, x, x + w, top, 170 + R() * 120, seed + i * 31)); x += w + gapTot / Math.max(1, nIsl - 1); }
    if (big) platformTiers(R, mc, seed, floor, 240); else { const plats = []; const nP = 3 + (R() * 3 | 0);
      for (let i = 0; i < nP * 5 && plats.length < nP; i++) { const w = 150 + R() * 170, px = 80 + R() * (W - 160 - w), py = 280 + R() * 290; if (plats.some(p => px < p.x + p.w + 70 && px + w + 70 > p.x && Math.abs(py - p.y) < 130)) continue; plats.push({ x: px, y: py, w }); fillShape(mc, islandPoly(R, px, px + w, py, 60 + R() * 60, seed + 100 + i, true)); } }
  }
  // boulders (the original look)
  rebuildGridFromMask();
  const nB = flat ? 0 : Math.round((th.boulders ?? 4) * sx); for (let i = 0; i < nB; i++) { const bx = 120 + R() * (W - 240); const sy = surfaceFromGrid(bx); if (sy == null || basins.some(b => Math.abs(b.x - bx) < b.rx + 40)) continue; if (Env.water[0] && Env.water[0].sea && sy > Env.water[0].level - 20) continue; const r = 16 + R() * 22; const pts = []; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; const rr = r * (1 + (R() - .5) * .35); pts.push([bx + Math.cos(a) * rr * 1.25, sy + 6 + Math.sin(a) * rr]); } fillShape(mc, pts); }
  rebuildGridFromMask();
  for (const b of basins) Env.water.push(makeBasinWater(b, th));
  buildTexture(R); buildBackground(R); placeProps(rng(seed + 77), th); rebuildTerrainFull(); freeBuildBuffers(); buildMiniMap(); Weather.setup(th);
  biomeHook('onMap', BiomeAPI.ctx({ R: rng(seed + 99), seed }));
  R8.overlayKey = ''; R8.skyKey = '';
  if (typeof onMapGenerated === 'function') onMapGenerated(seed);
};
function carveBasin(R, kind, basins, base) {
  for (let tries = 0; tries < 30; tries++) {
    const big = kind === 'pond'; const rx = big ? 150 + R() * (G.gameMode === 'expedition' ? 220 : 80) : kind === 'lava' ? 70 + R() * 50 : 52 + R() * 52;
    const x = rx + 80 + R() * (W - rx * 2 - 160); const yl = surfaceFromGrid(x - rx, base - 260), yr = surfaceFromGrid(x + rx, base - 260), yc = surfaceFromGrid(x, base - 260);
    if (yl == null || yr == null || yc == null || Math.abs(yl - yr) > 26 || Math.abs(yc - (yl + yr) / 2) > 34 || yc < base - 230) continue;
    if (basins.some(b => Math.abs(b.x - x) < b.rx + rx + 70)) continue;
    let gap = false; for (let k = -rx - 30; k <= rx + 30; k += 12) { const s = surfaceFromGrid(x + k, base - 260); if (s == null || s > H - 30) { gap = true; break; } } if (gap) continue;
    const depth = big ? 70 + R() * 30 : kind === 'lava' ? 40 + R() * 20 : 24 + R() * 18; const top = Math.max(yl, yr);
    const mc = T.mctx; mc.globalCompositeOperation = 'destination-out'; mc.beginPath(); const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; const sy = Math.sin(a); pts.push([x + Math.cos(a) * rx * (1 + (R() - .5) * .05), top - 2 + (sy > 0 ? sy * depth : sy * 60)]); } smoothPath(mc, pts); mc.fill(); mc.globalCompositeOperation = 'source-over';
    basins.push({ x, rx, top, depth, kind }); rebuildGridFromMask(); return;
  }
}
function freeBuildBuffers() { for (const k of ['tmp', 'tmp2']) { T[k].width = 1; T[k].height = 1; } }
const _rebuildFull = rebuildTerrainFull;
rebuildTerrainFull = function () { for (const k of ['tmp', 'tmp2']) if (T[k].width !== T.out.width || T[k].height !== T.out.height) { T[k].width = T.out.width; T[k].height = T.out.height; } _rebuildFull(); freeBuildBuffers(); };
const _buildTexture = buildTexture;
buildTexture = function (R) {
  _buildTexture(R); const th = T.theme, c = T.tex.getContext('2d'); c.setTransform(T.Q, 0, 0, T.Q, 0, 0);
  if (th.icy) { c.fillStyle = 'rgba(210,235,255,.25)'; for (let i = 0; i < 260; i++) { c.beginPath(); c.arc(R() * W, R() * H, 2 + R() * 7, 0, TAU); c.fill(); } }
  if (th.lava) { c.strokeStyle = 'rgba(255,120,40,.22)'; c.lineWidth = 1.5; for (let i = 0; i < 70; i++) { let x = R() * W, y = H * .45 + R() * H * .55; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - .5) * 40; y += R() * 22; c.lineTo(x, y); } c.stroke(); } }
  if (th.style === 'sea') { c.fillStyle = 'rgba(255,248,225,.24)'; for (let i = 0; i < 900; i++) c.fillRect(R() * W, R() * H, 1.5, 1.5); }
  biomeHook('texture', BiomeAPI.ctx({ c, R }));

  c.setTransform(1, 0, 0, 1, 0, 0);
};

/* sky + parallax backdrop for each biome */
buildBackground = function (R) {
  const th = T.theme, big = W > 2000, M = big ? 620 : 520, s = big ? .36 : .55, bw = W + M * 2, bh = H + M * 2;
  const c = mkCanvas(bw * s, bh * s), x = c.getContext('2d'); x.scale(s, s); x.translate(M, M);
  const g = x.createLinearGradient(0, -M, 0, H + M); g.addColorStop(0, shade(th.skyT, th.night ? -.15 : .08)); g.addColorStop(.55, th.skyB); g.addColorStop(1, shade(th.skyB, -.12)); x.fillStyle = g; x.fillRect(-M, -M, bw, bh);
  if (th.night) { for (let i = 0; i < (big ? 420 : 180); i++) { const sx = -M + R() * bw, sy = -M + R() * (H * .62 + M); x.fillStyle = `rgba(255,250,230,${.25 + R() * .65})`; x.fillRect(sx, sy, 1.2 + R() * 1.8, 1.2 + R() * 1.8); } }
  const sx = W * (.18 + R() * .64), sy = th.sunLow ? H * .55 : H * (.14 + R() * .1);
  if (th.sunKind !== 'none') { const glowR = th.night ? 260 : 520; const sg = x.createRadialGradient(sx, sy, 10, sx, sy, glowR); sg.addColorStop(0, rgba(th.sun, th.night ? .5 : .95)); sg.addColorStop(.12, rgba(th.sun, th.night ? .18 : .55)); sg.addColorStop(1, rgba(th.sun, 0)); x.fillStyle = sg; x.fillRect(-M, -M, bw, bh);
    const sp = []; const rr = th.night ? 38 : th.sunLow ? 80 : 54; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; sp.push([sx + Math.cos(a) * rr * (1 + (R() - .5) * .04), sy + Math.sin(a) * rr * (1 + (R() - .5) * .04)]); } x.beginPath(); smoothPath(x, sp); x.fillStyle = rgba(th.sun, .95); x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(31,28,36,.2)'; x.stroke();
    if (th.night) { x.fillStyle = 'rgba(150,150,140,.22)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(sx - 12 + R() * 24, sy - 12 + R() * 24, 4 + R() * 7, 0, TAU); x.fill(); } } }
  T.sun = th.sunKind === 'none' ? null : { x: sx, y: sy };
  th.far.forEach((col, k) => { const base = H * .52 + k * H * .12; x.beginPath(); x.moveTo(-M, H + M);
    for (let px = -M; px <= W + M; px += 30) { let ry = base - (fbm(px * .0025, T.seed + k * 7) * .5 + .5) * (230 - k * 70) - Math.max(0, fbm(px * .01, k) * 30); if (th.bgTrees === 'mesas' && k === 0) ry = base - 140 - (fbm(px * .002, T.seed) > .1 ? 90 : 0); if (th.bgTrees === 'volcano' && k === 0) ry = Math.min(ry, base + 40 - Math.max(0, 420 - Math.abs(px - W * .62) * 1.1)); x.lineTo(px, ry); }
    x.lineTo(W + M, H + M); x.closePath(); const rg = x.createLinearGradient(0, base - 250, 0, H); rg.addColorStop(0, col); rg.addColorStop(1, shade(col, k ? -.18 : -.1)); x.fillStyle = rg; x.globalAlpha = .92; x.fill(); x.globalAlpha = 1; x.lineWidth = 2.2; x.strokeStyle = 'rgba(31,28,36,.22)'; x.stroke();
    if (k === 1) drawTreeLine(x, R, th, base, M); });
  if (th.bgTrees === 'volcano') { const vx = W * .62, vy = H * .52 - 300; const lg = x.createRadialGradient(vx, vy, 0, vx, vy, 260); lg.addColorStop(0, 'rgba(255,140,60,.55)'); lg.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = lg; x.fillRect(vx - 260, vy - 260, 520, 520); }
  if (th.style === 'sea') { const sea = Env.water[0].level; x.fillStyle = rgba(th.water, .55); x.fillRect(-M, sea - 26, bw, H + M); x.fillStyle = 'rgba(255,250,235,.32)'; for (let i = 0; i < 80; i++) x.fillRect(-M + R() * bw, sea - 22 + R() * 30, 20 + R() * 60, 1.5); }
  const hz = x.createLinearGradient(0, H * .42, 0, H + M); hz.addColorStop(0, rgba(th.skyB, 0)); hz.addColorStop(1, rgba(th.skyB, .5 + (th.haze || 0))); x.fillStyle = hz; x.fillRect(-M, H * .42, bw, H + M);
  biomeHook('background', BiomeAPI.ctx({ x, R, M, big }));
  T.bg = { c, M, s };
  const nC = (big ? 11 : 5) + (th.overcast ? 4 : 0); T.clouds = []; for (let i = 0; i < nC; i++) T.clouds.push({ x: R() * (W + 600) - 300, y: 50 + R() * H * .3, w: (140 + R() * 200) * (th.overcast ? 1.4 : 1), sp: (4 + R() * 8) * (1 + Math.abs(Env.wind) / 80) * Math.sign(Env.wind || 1), seed: R() * 1000 | 0 });
  for (const cl of T.clouds) { const cw = Math.ceil(cl.w * 1.3), ch = Math.ceil(cl.w * .5); const cc = mkCanvas(cw, ch), cx = cc.getContext('2d'); const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; const r = 1 + (hash(cl.seed, i) - .5) * .35; pts.push([cw / 2 + Math.cos(a) * cl.w * .5 * r, ch / 2 + Math.sin(a) * cl.w * .16 * r * (Math.sin(a) > 0 ? .6 : 1.1)]); }
    cx.beginPath(); smoothPath(cx, pts); cx.fillStyle = rgba(th.cloud || '#fffaf0', th.overcast ? .85 : .75); cx.fill(); cx.lineWidth = 1.6; cx.strokeStyle = 'rgba(31,28,36,.18)'; cx.stroke(); cl.sprite = cc; }
};
function drawTreeLine(x, R, th, base, M) {
  const kind = th.bgTrees; if (!kind || kind === 'none' || kind === 'mesas' || kind === 'volcano') return; const col = shade(th.far[1], -.22);
  x.fillStyle = col; x.strokeStyle = 'rgba(31,28,36,.25)'; x.lineWidth = 1.6;
  for (let px = -M; px < W + M; px += kind === 'harbor' ? 70 + R() * 90 : 18 + R() * 36) {
    const gy = base - (fbm(px * .0025, T.seed + 7) * .5 + .5) * 160 + 30; const h = 30 + R() * 50;
    x.beginPath();
    if (kind === 'pines' || kind === 'snowpines') { x.moveTo(px - h * .28, gy); x.lineTo(px, gy - h * 1.3); x.lineTo(px + h * .28, gy); }
    else if (kind === 'palms') { x.moveTo(px, gy); x.quadraticCurveTo(px + 8, gy - h * .6, px + 14, gy - h); x.lineWidth = 3; x.stroke(); x.lineWidth = 1.6; x.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .7; x.ellipse(px + 14 + Math.cos(a) * 12, gy - h + Math.sin(a) * 6 + 5, 14, 4, a, 0, TAU); } }
    else if (kind === 'harbor') { const bw = 28 + R() * 46, bh = 40 + R() * 90; x.rect(px, gy - bh, bw, bh); x.fill(); x.fillStyle = 'rgba(255,214,140,.75)'; for (let wy = gy - bh + 8; wy < gy - 8; wy += 14) for (let wx = px + 5; wx < px + bw - 6; wx += 10) if (R() < .35) x.fillRect(wx, wy, 4, 5); x.fillStyle = col; continue; }
    else if (kind === 'dead') { x.moveTo(px, gy); x.lineTo(px + 2, gy - h); x.moveTo(px + 1, gy - h * .6); x.lineTo(px + 12, gy - h * .9); x.moveTo(px + 1, gy - h * .45); x.lineTo(px - 10, gy - h * .75); x.lineWidth = 2.4; x.strokeStyle = col; x.stroke(); x.strokeStyle = 'rgba(31,28,36,.25)'; x.lineWidth = 1.6; continue; }
    else { x.ellipse(px, gy - h * .7, h * .42, h * .5, 0, 0, TAU); if (kind === 'cherry') x.fillStyle = shade('#e7a2b6', -.12); else if (kind === 'autumn') x.fillStyle = shade(R() < .5 ? '#c8742f' : '#b5452d', -.18); }
    x.fill(); if (kind !== 'palms') x.stroke(); x.fillStyle = col;
    if (kind === 'snowpines') { x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.moveTo(px - h * .12, gy - h * .8); x.lineTo(px, gy - h * 1.3); x.lineTo(px + h * .12, gy - h * .8); x.fill(); x.fillStyle = col; }
  }
}
function buildMiniMap() {
  const w = 170, h = Math.round(170 * H / W); const c = mkCanvas(w * 2, h * 2), x = c.getContext('2d'); x.drawImage(T.mask, 0, 0, c.width, c.height); x.globalCompositeOperation = 'source-in'; x.fillStyle = T.theme.mid; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'destination-over';
  x.fillStyle = shade(T.theme.skyB, -.05); x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'source-over';
  for (const b of Env.water) { x.fillStyle = rgba(b.color, .75); x.fillRect((Math.max(0, b.x0) / W) * c.width, (b.level / H) * c.height, ((Math.min(W, b.x1) - Math.max(0, b.x0)) / W) * c.width, b.sea ? c.height : (b.maxBottom - b.level) / H * c.height + 2); }
  Env.mini = c;
}

/* props live in world.js */

/* ---------- C. water: spring columns, splashes, buoyancy, leaks ----------
   Every body is a row of 8px columns. Each column has a displacement and a
   velocity; neighbours share energy, so a bullet makes a wave that travels.
   Puddles also know where their floor is. When a crater opens the floor or a
   wall, the body drains towards the lowest opening and pours out. */
const WSTEP = 8;
function makeSea(level, th) {
  const x0 = -420, x1 = W + 420, n = Math.ceil((x1 - x0) / WSTEP) + 1;
  return { kind: 'sea', sea: true, x0, x1, n, level, target: level, disp: new Float32Array(n), vel: new Float32Array(n), bottom: null, base: null, maxBottom: H + 300, color: th.water, shallow: th.shallow || shade(th.water, .3), lava: false, energy: 1, alive: true };
}
function makeBasinWater(b, th) {
  const lava = b.kind === 'lava'; const color = lava ? '#ff6a1f' : b.kind === 'swamp' ? '#4b6a42' : th.water;
  const x0 = b.x - b.rx - 10, x1 = b.x + b.rx + 10, n = Math.ceil((x1 - x0) / WSTEP) + 1; const level = b.top + 4;
  const body = { kind: b.kind, sea: false, x0, x1, n, level, target: level, disp: new Float32Array(n), vel: new Float32Array(n), bottom: new Float32Array(n), base: null, maxBottom: level, color, shallow: lava ? '#ffd27a' : shade(color, .28), lava, energy: 1, alive: true, leakX: null };
  body.floorMax = H + 40; waterColumns(body); body.base = Float32Array.from(body.bottom); body.floorMax = body.maxBottom; body.leakFree = waterFlood(body, body.level) === null; return body;
}
function waterColumns(b) {
  // floor of every column under the surface. Columns that open into a hole (the scan runs far
  // below the original floor) are clamped to the old floor so the pool never draws a strip of
  // water hanging down a shaft; the drain stream shows the water pouring out instead.
  let mx = b.level; const deep = b.floorMax + 240;
  if (!b.hole) b.hole = new Uint8Array(b.n);
  for (let i = 0; i < b.n; i++) {
    const x = b.x0 + i * WSTEP; b.hole[i] = 0;
    if (solidAt(x, b.level + 1)) { b.bottom[i] = b.level; continue; }
    let y = b.level; const lim = Math.min(H + 40, deep + 40); while (y < lim && !solidAt(x, y)) y += CELL;
    if (y >= deep && b.base) { b.hole[i] = 1; y = Math.max(b.level, Math.min(y, b.base[i] + 2)); }
    b.bottom[i] = y; if (y > mx) mx = y;
  }
  b.maxBottom = mx;
}
function waterAt(x, y) {
  for (const b of Env.water) { if (!b.alive || x < b.x0 || x > b.x1) continue; const i = clamp(Math.round((x - b.x0) / WSTEP), 0, b.n - 1); const s = b.level + b.disp[i]; if (y < s) continue; if (b.sea || y < b.bottom[i]) return b; }
  return null;
}
function waterSurfaceY(b, x) { const i = clamp(Math.round((x - b.x0) / WSTEP), 0, b.n - 1); return b.level + b.disp[i]; }
function waterPoke(b, x, force, spread = 1) { const i = Math.round((x - b.x0) / WSTEP); for (let k = -spread; k <= spread; k++) { const j = i + k; if (j >= 0 && j < b.n && (b.sea || b.bottom[j] > b.level)) b.vel[j] += force * (1 - Math.abs(k) / (spread + 1)); } b.energy = 1; }
function splash(x, y, power = 1, b = null) {
  b = b || waterAt(x, y + 4) || waterAt(x, y + 14); if (!b) return; const sy = waterSurfaceY(b, x); waterPoke(b, x, 160 * power, Math.round(1 + power * 2));
  if (!visibleWorld(x, sy, 120)) return; const n = Math.min(22, Math.round(4 + power * 9 * R8.fxScale));
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 1.5; const sp = (120 + Math.random() * 360) * Math.sqrt(power); FX.add({ k: 'drop', x: x + (Math.random() - .5) * 10, y: sy - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 1.6 + Math.random() * 2.8, color: b.lava ? '#ffb347' : b.shallow, life: 1.2, t: 0 }); }
  if (power > .6) FX.ring(x, sy, 18 + power * 18, b.lava ? 'rgba(255,180,90,.8)' : 'rgba(240,252,255,.75)', 2, .35);
  Audio2.play(b.lava ? 'sizzle' : 'splash', x, clamp(power * .6, .15, 1));
}
function updateWater(dt) {
  for (const b of Env.water) {
    if (!b.alive) continue;
    if (b.level < b.target - .5) updateWaterDrain(b, dt); else if (b.flow) b.flow = Math.max(0, b.flow - dt * 2);
    if (b.energy < .002) continue; let e = 0; const d = b.disp, v = b.vel, n = b.n, k = b.lava ? 50 : 90, damp = b.lava ? 6 : 3.4;
    for (let i = 0; i < n; i++) { v[i] += (-k * d[i] - damp * v[i]) * dt; }
    for (let pass = 0; pass < 2; pass++) for (let i = 1; i < n - 1; i++) { const l = (d[i] - d[i - 1]) * 18 * dt, r = (d[i] - d[i + 1]) * 18 * dt; v[i - 1] += l * 4; v[i + 1] += r * 4; }
    for (let i = 0; i < n; i++) { d[i] += v[i] * dt; if (d[i] > 28) d[i] = 28; else if (d[i] < -28) d[i] = -28; e += Math.abs(v[i]) + Math.abs(d[i]); }
    b.energy = e / n;
  }
  if (Env.time - (Env.ambT || 0) > .45) { Env.ambT = Env.time; for (const b of Env.water) if (b.alive && b.sea) waterPoke(b, b.x0 + Math.random() * (b.x1 - b.x0), (Math.random() - .5) * 60, 3); else if (b.alive && b.lava && Math.random() < .5) { const x = b.x0 + 20 + Math.random() * (b.x1 - b.x0 - 40); if (waterAt(x, b.level + 6)) { waterPoke(b, x, -50, 1); FX.add({ k: 'ember', x, y: b.level, vx: (Math.random() - .5) * 40, vy: -90 - Math.random() * 120, life: .9, t: 0, r: 2.2, color: '#ffb347' }); } } }
}
/* after a crater: refresh floors; find the height the pool can still hold */
/* where does the water go? flood the pool cells below a candidate surface on the terrain grid;
   if the flood leaves the basin (sideways or downwards) the pool still leaks at that height */
let _wStamp = null, _wStampN = 1;
function waterFlood(b, L) {
  if (!_wStamp || _wStamp.length !== GW * GH) { _wStamp = new Uint32Array(GW * GH); _wStampN = 1; }
  const st = ++_wStampN; const gy0 = Math.min(GH - 1, Math.ceil((L + 1) / CELL));
  const gxa = Math.max(0, Math.floor((b.x0 - 14) / CELL)), gxb = Math.min(GW - 1, Math.ceil((b.x1 + 14) / CELL)), gyMax = Math.min(GH - 2, Math.ceil((b.floorMax + 250) / CELL));
  const q = []; let seeds = 0;
  for (let i = 0; i < b.n; i++) { if (!(b.base[i] > L + 1)) continue; const gx = clamp(Math.round((b.x0 + i * WSTEP) / CELL), 0, GW - 1); const k = gy0 * GW + gx; if (!T.grid[k] && _wStamp[k] !== st) { _wStamp[k] = st; q.push(k); seeds++; } }
  if (!seeds) return 'dry';
  for (let h = 0; h < q.length; h++) {
    if (q.length > 26000) { const k = q[h]; return { x: (k % GW) * CELL, y: ((k / GW) | 0) * CELL }; }
    const k = q[h], gx = k % GW, gy = (k / GW) | 0;
    if (gx <= gxa || gx >= gxb || gy >= gyMax) return { x: gx * CELL, y: Math.min(gy * CELL, b.floorMax) };
    const nb = [k - 1, k + 1, k + GW]; if (gy > gy0) nb.push(k - GW);
    for (const n of nb) if (!T.grid[n] && _wStamp[n] !== st) { _wStamp[n] = st; q.push(n); }
  }
  return null;
}
function waterAfterCrater(cx, cy, r) {
  for (const b of Env.water) {
    if (!b.alive || b.sea || cx < b.x0 - r - 40 || cx > b.x1 + r + 40 || cy < b.level - r - 30 || cy > b.floorMax + r + 220) continue;
    let L = b.level, leak = null, first = null, target = b.level;
    for (let guard = 0; guard < 120; guard++) {
      const f = waterFlood(b, L);
      if (f === 'dry') { target = b.floorMax + 2; break; }
      if (!f) { target = L; break; }
      if (!b.leakFree && Math.abs(f.x - cx) > r + 70) { target = L; break; } // an old natural gap, not this crater
      if (!first) first = f; leak = f; L += CELL; target = L;
      if (L > b.floorMax + 2) { target = b.floorMax + 2; break; }
    }
    if (first && target > b.level + 1) { b.target = target; b.leakX = clamp(first.x, b.x0, b.x1); b.leakY = clamp(first.y, b.level, b.floorMax); b.draining = true; }
    waterColumns(b);
  }
}
function updateWaterDrain(b, dt) {
  // the surface sinks to the lowest opening; floors are re-measured every frame while draining
  const width = Math.max(60, b.x1 - b.x0), rate = clamp(60 * 260 / width, 34, 95);
  const old = b.level; b.level = Math.min(b.target, b.level + dt * rate); b.energy = 1; waterColumns(b);
  if ((old / 14 | 0) !== (b.level / 14 | 0)) waterPoke(b, b.leakX, 26, 2);
  b.flow = Math.min(1, (b.flow || 0) + dt * 3);
  if (b.leakX != null && visibleWorld(b.leakX, b.leakY, 220) && R8.fxScale > .35) {
    if (Math.random() < .55) FX.add({ k: 'drop', x: b.leakX + (Math.random() - .5) * 8, y: Math.max(b.level, b.leakY) + 4, vx: (Math.random() - .5) * 50, vy: 90 + Math.random() * 120, r: 1.6 + Math.random() * 2.2, color: b.shallow, life: 1.4, t: 0 });
  }
  if (b.level >= b.target - .5) { b.draining = false; if (b.level >= b.maxBottom - 1 || b.level >= b.floorMax) { b.alive = false; } buildMiniMap(); }
}
const _waterGrad = new WeakMap();
function waterGradient(c, b, view) {
  const y0 = b.level - 10, y1 = b.sea ? Math.min(H + 300, view.y1 + 50) : b.maxBottom + 6;
  const key = ((y0 / 4) | 0) + '|' + ((y1 / 8) | 0); let g = _waterGrad.get(b);
  if (g && g.key === key) return g.g;
  const gr = c.createLinearGradient(0, y0, 0, y1);
  if (b.lava) { gr.addColorStop(0, '#ffd27a'); gr.addColorStop(.18, '#ff7a24'); gr.addColorStop(1, '#a3261c'); }
  else { gr.addColorStop(0, rgba(b.shallow, .9)); gr.addColorStop(.18, rgba(b.color, .88)); gr.addColorStop(.6, rgba(shade(b.color, -.25), .92)); gr.addColorStop(1, rgba(shade(b.color, -.5), .96)); }
  _waterGrad.set(b, { key, g: gr }); return gr;
}
function drawWaterBack(c, view) {
  const t = Env.time;
  for (const b of Env.water) {
    if (!b.alive) continue; const x0 = Math.max(b.x0, view.x0 - 20), x1 = Math.min(b.x1, view.x1 + 20); if (x1 <= x0) continue; const i0 = Math.max(0, Math.floor((x0 - b.x0) / WSTEP)), i1 = Math.min(b.n - 1, Math.ceil((x1 - b.x0) / WSTEP));
    c.fillStyle = waterGradient(c, b, view); c.beginPath(); waterPath(c, b, i0, i1, view); c.fill();
    if (b.lava || R8.fxScale < .55) continue;
    // under-water light: drifting caustic bands (and sun shafts in the open sea), clipped to the water
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter';
    const deepY = b.sea ? Math.min(view.y1, b.level + 420) : b.maxBottom;
    c.strokeStyle = rgba(b.shallow, .13); c.lineWidth = 2.2; c.beginPath();
    for (let row = 0; row < 4; row++) { const y = b.level + 14 + row * 22 + Math.sin(t * .8 + row) * 3; if (y > deepY) break; for (let x = x0 - (x0 % 46); x < x1; x += 46) { const ph = x * .05 + t * (1.1 + row * .3) + row * 2; c.moveTo(x, y + Math.sin(ph) * 4); c.quadraticCurveTo(x + 12, y + Math.sin(ph + 1.4) * 6 - 3, x + 24, y + Math.sin(ph + 2.2) * 4); } }
    c.stroke();
    if (b.sea && !T.theme.night) {
      c.fillStyle = 'rgba(255,252,230,.05)';
      for (let k = 0; k < 6; k++) { const bx = x0 + ((k * 263 + t * 9) % Math.max(1, x1 - x0)), w = 26 + (k % 3) * 18, sk = 90 + (k % 2) * 60; c.beginPath(); c.moveTo(bx, b.level); c.lineTo(bx + w, b.level); c.lineTo(bx + w + sk, b.level + 380); c.lineTo(bx + sk - w * .6, b.level + 380); c.closePath(); c.fill(); }
    }
    c.restore();
  }
}
function waterPath(c, b, i0, i1, view) {
  if (b.sea) { c.moveTo(b.x0 + i0 * WSTEP, view.y1 + 60); for (let i = i0; i <= i1; i++) c.lineTo(b.x0 + i * WSTEP, b.level + b.disp[i]); c.lineTo(b.x0 + i1 * WSTEP, view.y1 + 60); c.closePath(); return; }
  let open = false;
  for (let i = i0; i <= i1 + 1; i++) { const wet = i <= i1 && b.bottom[i] > b.level + .5; const x = b.x0 + i * WSTEP;
    if (wet && !open) { open = true; c.moveTo(x - WSTEP / 2, Math.min(b.level + b.disp[i], b.bottom[i])); }
    if (wet) c.lineTo(x, Math.min(b.level + b.disp[i], b.bottom[i] - 1));
    if (!wet && open) { open = false; c.lineTo(x - WSTEP / 2, b.level + 1); for (let j = i - 1; j >= i0 && b.bottom[j] > b.level + .5; j--) c.lineTo(b.x0 + j * WSTEP, b.bottom[j] + 2); c.closePath(); } }
}
function drawWaterFront(c, view, t) {
  for (const b of Env.water) {
    if (!b.alive) continue; const x0 = Math.max(b.x0, view.x0 - 20), x1 = Math.min(b.x1, view.x1 + 20); if (x1 <= x0) continue; const i0 = Math.max(0, Math.floor((x0 - b.x0) / WSTEP)), i1 = Math.min(b.n - 1, Math.ceil((x1 - b.x0) / WSTEP));
    if (!b.lava) { c.globalAlpha = b.sea ? .32 : .24; c.fillStyle = b.color; c.beginPath(); waterPath(c, b, i0, i1, view); c.fill(); c.globalAlpha = 1; }
    // the surface line: one path reused for the soft band, the ink line and the paper highlight
    c.beginPath(); let pen = false, segs = 0;
    for (let i = i0; i <= i1; i++) { const wet = b.sea || b.bottom[i] > b.level + .5; const x = b.x0 + i * WSTEP, y = Math.min(b.level + b.disp[i], b.sea ? 1e9 : b.bottom[i] - 1); if (!wet) { pen = false; continue; } if (pen) c.lineTo(x, y); else { c.moveTo(x, y); segs++; } pen = true; }
    if (!segs) continue;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (!b.lava && R8.fxScale > .45) { c.lineWidth = 9; c.strokeStyle = rgba(b.shallow, .28); c.save(); c.translate(0, 5); c.stroke(); c.restore(); }
    c.lineWidth = 2.6; c.strokeStyle = b.lava ? 'rgba(80,20,10,.75)' : 'rgba(31,28,36,.55)'; c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = b.lava ? '#ffe8a8' : 'rgba(255,255,250,.85)'; c.save(); c.translate(0, 2.4); c.stroke(); c.restore();
    if (R8.fxScale > .5) {
      // drifting glints + crest foam where the surface is moving
      c.strokeStyle = b.lava ? 'rgba(255,240,180,.65)' : 'rgba(255,255,250,.55)'; c.lineWidth = 1.5; c.beginPath();
      for (let k = 0; k < (b.x1 - b.x0) / 70; k++) { const gx = b.x0 + ((k * 97 + t * (14 + (k % 3) * 9)) % (b.x1 - b.x0)); if (gx < x0 || gx > x1) continue; const i = Math.round((gx - b.x0) / WSTEP); if (!b.sea && b.bottom[i] < b.level + 12) continue; const gy = b.level + b.disp[i] + 7 + (k % 4) * 6; c.moveTo(gx, gy); c.lineTo(gx + 10 + (k % 3) * 6, gy); }
      c.stroke();
      if (!b.lava && b.energy > .05) {
        c.fillStyle = 'rgba(255,255,252,.8)'; c.beginPath();
        for (let i = Math.max(1, i0); i < Math.min(b.n - 1, i1); i++) { const v = b.vel[i]; if (v > -26 || !(b.sea || b.bottom[i] > b.level + 3)) continue; const x = b.x0 + i * WSTEP, y = b.level + b.disp[i]; const r = Math.min(3.2, -v / 40); c.moveTo(x + r, y - 1); c.arc(x, y - 1, r, 0, TAU); }
        c.fill();
      }
      if (!b.lava && !b.sea) {
        // foam at the shore where the water meets the bank
        c.fillStyle = 'rgba(255,255,250,.6)'; c.beginPath();
        for (let i = Math.max(1, i0); i <= Math.min(b.n - 2, i1); i++) {
          const wet = b.bottom[i] > b.level + .5; if (!wet) continue; const edgeL = !(b.bottom[i - 1] > b.level + .5), edgeR = !(b.bottom[i + 1] > b.level + .5); if (!edgeL && !edgeR) continue;
          const x = b.x0 + i * WSTEP + (edgeL ? -3 : 3), y = b.level + b.disp[i]; for (let k = 0; k < 3; k++) { const ox = (edgeL ? 1 : -1) * k * 4, r = 1.6 + Math.sin(t * 3 + i + k) * .6; c.moveTo(x + ox + r, y); c.arc(x + ox, y, r, 0, TAU); }
        }
        c.fill();
      }
    }
    // a pouring stream while the pool drains out of a hole or a broken wall
    if (b.draining && b.leakX != null && !b.lava) {
      const sx = b.leakX, sy = Math.max(b.level + 2, b.leakY - 2), gy = groundBelow(sx, sy + 6, 420), ey = gy == null ? sy + 420 : gy, w = 3 + 5 * (b.flow || 0);
      const wob = Math.sin(t * 18) * 1.5; c.fillStyle = rgba(b.shallow, .8); c.beginPath(); c.moveTo(sx - w, sy); c.quadraticCurveTo(sx - w * .6 + wob, (sy + ey) / 2, sx - w * .45, ey); c.lineTo(sx + w * .45, ey); c.quadraticCurveTo(sx + w * .6 - wob, (sy + ey) / 2, sx + w, sy); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,250,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx - w * .2, sy + 4); c.lineTo(sx - w * .1 + wob, ey - 4); c.stroke();
      if (gy != null) { c.fillStyle = 'rgba(255,255,250,.75)'; c.beginPath(); for (let k = 0; k < 5; k++) { const a = t * 9 + k * 1.3; const r = 2.2 + Math.sin(a) * 1.2; c.moveTo(sx + Math.cos(k * 1.7) * w * 1.6 + r, ey - 2 - Math.abs(Math.sin(a)) * 5); c.arc(sx + Math.cos(k * 1.7) * w * 1.6, ey - 2 - Math.abs(Math.sin(a)) * 5, r, 0, TAU); } c.fill(); }
    }
  }
}
/* ---------- D. weather (pooled; one draw call per layer) ---------- */
const Weather = {
  kind: 'none', parts: [], n: 0, flash: 0, fog: [], view: null,
  setup(th) { this.kind = th.weather || 'none'; this.parts = []; this.flash = 0; const big = W > 2000; this.fog = []; if (th.fog) for (let i = 0; i < (big ? 8 : 4); i++) this.fog.push({ x: Math.random() * W, y: H * (.35 + Math.random() * .45), w: 500 + Math.random() * 500, sp: 6 + Math.random() * 10, a: th.fog * (.5 + Math.random() * .5) }); this.resize(); },
  density() { const base = { rain: 260, storm: 420, drizzle: 120, snow: 170, leaves: 34, petals: 60, ash: 120, embers: 60, fireflies: 34, sand: 190, dust: 40, sparkle: 26, fog: 18 }[this.kind] || 0; return Settings.weather ? Math.round(base * R8.fxScale) : 0; },
  resize() { const n = this.density(); while (this.parts.length < n) this.parts.push(this.spawn({}, true)); this.parts.length = n; },
  spawn(p, anywhere) { const v = this.view || { x0: 0, y0: 0, x1: W, y1: H }; const w = v.x1 - v.x0, h = v.y1 - v.y0; p.x = v.x0 - 120 + Math.random() * (w + 240); p.y = anywhere ? v.y0 + Math.random() * h : v.y0 - 20 - Math.random() * 80; p.t = Math.random() * 10; p.s = .6 + Math.random() * .8; p.r = Math.random() * TAU;
    if (this.kind === 'fireflies' || this.kind === 'sparkle' || this.kind === 'fog') p.y = v.y0 + Math.random() * h; if (this.kind === 'sand') { p.x = (Env.wind > 0 ? v.x0 - 60 : v.x1 + 60) - Math.random() * 40 * Math.sign(Env.wind); p.y = v.y0 + Math.random() * h; } if (this.kind === 'embers' || this.kind === 'ash' && Math.random() < .3) { if (!anywhere) p.y = v.y1 + 20; p.up = true; } else p.up = false; return p; },
  update(dt, view) {
    this.view = view; if (this.flash > 0) this.flash -= dt * 2.4; const n = this.parts.length; if (!n) return; const wind = Env.wind, k = this.kind; const v = view;
    for (let i = 0; i < n; i++) { const p = this.parts[i]; p.t += dt;
      switch (k) {
        case 'rain': case 'storm': case 'drizzle': { const sp = (k === 'storm' ? 1450 : k === 'drizzle' ? 760 : 1080) * p.s; p.x += wind * 2.2 * dt; p.y += sp * dt; p.vx = wind * 2.2; p.vy = sp;
          if (solidAt(p.x, p.y)) { if (Math.random() < .35 && R8.fxScale > .4) FX.add({ k: 'drop', x: p.x, y: p.y - 3, vx: (Math.random() - .5) * 90, vy: -90 - Math.random() * 110, r: 1.1, color: 'rgba(225,238,245,.85)', life: .3, t: 0 }); this.spawn(p); }
          else { const b = waterAt(p.x, p.y); if (b) { if (!b.lava && Math.random() < .5) waterPoke(b, p.x, 22, 0); if (Math.random() < .3) Env.ripples.push({ x: p.x, y: waterSurfaceY(b, p.x), t: 0 }); this.spawn(p); } }
          break; }
        case 'snow': p.x += (wind + Math.sin(p.t * 1.7 + p.r) * 30) * dt; p.y += 70 * p.s * dt; if (solidAt(p.x, p.y) || waterAt(p.x, p.y)) this.spawn(p); break;
        case 'leaves': case 'petals': p.x += (wind * 1.4 + Math.sin(p.t * 2 + p.r) * 40) * dt; p.y += (k === 'petals' ? 52 : 70) * p.s * dt; p.r += dt * (1.5 + p.s); if (solidAt(p.x, p.y) || waterAt(p.x, p.y)) this.spawn(p); break;
        case 'ash': case 'embers': p.x += (wind + Math.sin(p.t + p.r) * 20) * dt; p.y += (p.up ? -55 : 40) * p.s * dt; break;
        case 'fireflies': p.x += Math.cos(p.t * .8 + p.r) * 26 * dt; p.y += Math.sin(p.t * 1.1 + p.r * 2) * 20 * dt; break;
        case 'sparkle': p.x += wind * .3 * dt; break;
        case 'sand': p.x += wind * (4 + p.s * 3) * dt; p.y += Math.sin(p.t * 3 + p.r) * 20 * dt; break;
        case 'dust': p.x += (wind + Math.sin(p.t + p.r) * 12) * dt; p.y += Math.cos(p.t * .7 + p.r) * 8 * dt; break;
      }
      if (p.y > v.y1 + 40 || p.y < v.y0 - 140 || p.x < v.x0 - 220 || p.x > v.x1 + 220) this.spawn(p, k === 'fireflies' || k === 'sparkle' || k === 'dust' || k === 'sand' || k === 'fog');
    }
  },
  draw(c, t) {
    const n = this.parts.length, k = this.kind; if (!n) return; const P = this.parts;
    if (k === 'rain' || k === 'storm' || k === 'drizzle') { c.strokeStyle = T.theme.night ? 'rgba(170,190,220,.45)' : 'rgba(80,96,118,.42)'; c.lineWidth = k === 'storm' ? 1.5 : 1.2; c.beginPath(); const L = k === 'drizzle' ? .012 : .02; for (let i = 0; i < n; i++) { const p = P[i]; c.moveTo(p.x, p.y); c.lineTo(p.x - (p.vx || 0) * L, p.y - (p.vy || 900) * L); } c.stroke(); c.strokeStyle = 'rgba(240,248,255,.32)'; c.lineWidth = .7; c.stroke(); }
    else if (k === 'snow') { c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(31,28,36,.25)'; c.lineWidth = .8; c.beginPath(); for (let i = 0; i < n; i++) { const p = P[i]; c.moveTo(p.x + 2.6 * p.s, p.y); c.arc(p.x, p.y, 2.6 * p.s, 0, TAU); } c.fill(); c.stroke(); }
    else if (k === 'leaves' || k === 'petals') { const cols = T.theme.leaf || ['#d9573b', '#e9a23b']; for (let j = 0; j < cols.length; j++) { c.fillStyle = cols[j]; c.beginPath(); for (let i = j; i < n; i += cols.length) { const p = P[i]; const sx = (k === 'petals' ? 4 : 6) * p.s; c.moveTo(p.x + Math.cos(p.r) * sx, p.y + Math.sin(p.r) * sx * .45); c.ellipse(p.x, p.y, sx, sx * .45 * Math.abs(Math.cos(p.t * 3 + p.r)) + .8, p.r, 0, TAU); } c.fill(); } }
    else if (k === 'ash') { c.fillStyle = 'rgba(70,62,62,.55)'; c.beginPath(); for (let i = 0; i < n; i++) { const p = P[i]; if (p.up) continue; c.rect(p.x, p.y, 2.4 * p.s, 2.4 * p.s); } c.fill(); }
    else if (k === 'sand') { c.strokeStyle = 'rgba(214,160,92,.45)'; c.lineWidth = 1.4; c.beginPath(); for (let i = 0; i < n; i++) { const p = P[i]; c.moveTo(p.x, p.y); c.lineTo(p.x - Env.wind * .12 * p.s, p.y); } c.stroke(); }
    else if (k === 'dust') { c.fillStyle = 'rgba(255,240,215,.5)'; c.beginPath(); for (let i = 0; i < n; i++) { const p = P[i]; c.rect(p.x, p.y, 2, 2); } c.fill(); }
  },
  drawGlow(c, t) {
    const k = this.kind; if (k !== 'embers' && k !== 'ash' && k !== 'fireflies' && k !== 'sparkle') return; const P = this.parts;
    const spr = softSprite(k === 'fireflies' ? 'rgba(210,255,140,1)' : k === 'sparkle' ? 'rgba(255,245,210,1)' : 'rgba(255,150,60,1)');
    for (const p of P) { if (k === 'ash' && !p.up) continue; const a = k === 'fireflies' ? .5 + .5 * Math.sin(p.t * 3 + p.r * 5) : k === 'sparkle' ? Math.max(0, Math.sin(p.t * 2.2 + p.r * 4)) : .8; if (a < .05) continue; c.globalAlpha = a * .9; const r = (k === 'fireflies' ? 12 : 7) * p.s; c.drawImage(spr, p.x - r, p.y - r, r * 2, r * 2); }
    c.globalAlpha = 1;
  },
  drawFog(c, t, view) { if (!this.fog.length) return; const spr = fogSprite(); for (const f of this.fog) { const x = ((f.x + t * f.sp) % (W + 1000)) - 500; if (x + f.w < view.x0 || x > view.x1) continue; c.globalAlpha = f.a; c.drawImage(spr, x, f.y - 90, f.w, 180); } c.globalAlpha = 1; }
};
let _fog = null; function fogSprite() { if (_fog) return _fog; const c = mkCanvas(256, 64), x = c.getContext('2d'); const g = x.createRadialGradient(128, 32, 4, 128, 32, 128); g.addColorStop(0, 'rgba(240,240,232,.9)'); g.addColorStop(1, 'rgba(240,240,232,0)'); x.setTransform(1, 0, 0, .25, 0, 24); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return _fog = c; }

/* ---------- E. weapon mechanics ----------
   All fields are optional, so the original weapon scripts keep working.
   Projectile simulation runs on every peer (for visuals); only the host's
   copy (b.auth) deals damage or carves terrain. */
Env.beams = []; Env.zaps = []; Env.ropes = [];
const pw = b => Weapons.byId[b.wid] || W_DEFAULTS.gun;
const ptype = w => (w.projectile && w.projectile.type) || (w.beam ? 'beam' : 'bullet');
function rayEnd(x, y, a, range) { const dx = Math.cos(a), dy = Math.sin(a); let d = 0; for (; d < range; d += 6) { const px = x + dx * d, py = y + dy * d; if (solidAt(px, py) || px < -200 || px > W + 200 || py > H + 200) break; } return [x + dx * d, y + dy * d, d < range]; }
function fireBeam(e, w, auth) {
  const [ex, ey, hitWall] = rayEnd(e.x, e.y, e.a, w.range || 2400); const col = (w.projectile && w.projectile.color) || w.vfx.tracer;
  Env.beams.push({ x0: e.x, y0: e.y, x1: ex, y1: ey, t: 0, life: .32, color: col, glow: (w.projectile && w.projectile.glow) || '#fff', w: (w.projectile && w.projectile.size) || 6 });
  FX.light(ex, ey, 220, w.vfx.light || col, .2, 1.2); FX.sparks(ex, ey, e.a + Math.PI, 14, col); for (let d = 0; d < Math.hypot(ex - e.x, ey - e.y); d += 90) FX.add({ k: 'spark', x: e.x + Math.cos(e.a) * d, y: e.y + Math.sin(e.a) * d, vx: (Math.random() - .5) * 200, vy: (Math.random() - .5) * 200, life: .25, t: 0, color: col, w: 1.4 });
  const wb = waterHitAlong(e.x, e.y, ex, ey); if (wb) splash(wb[0], wb[1], .9);
  if (!auth) return; let left = (w.pierce | 0) + 1; const hits = [];
  for (const p of G.players.values()) { if (!p.alive || p.id === e.id) continue; const t = ((p.x - e.x) * Math.cos(e.a) + (p.y - e.y) * Math.sin(e.a)); if (t < 0 || t > Math.hypot(ex - e.x, ey - e.y) + 10) continue; const px = e.x + Math.cos(e.a) * t, py = e.y + Math.sin(e.a) * t; if (Math.abs(px - p.x) < HW + 6 && Math.abs(py - p.y) < HH + 6) hits.push([t, p, py]); }
  hits.sort((a, b) => a[0] - b[0]);
  for (const [, p, py] of hits) { if (left-- <= 0) break; const head = py < p.y - HH * .35; hostDamage(p, Math.round(w.damage * (head ? w.headshot || 1 : 1)), e.id, w.id, Math.cos(e.a) * w.knockback, Math.sin(e.a) * w.knockback * .5 - 160, p.x, py, head); }
  if (hitWall) hostImpact({ x: ex, y: ey, owner: e.id }, w, false); propHitLine(e.x, e.y, ex, ey, w, e.id);
}
function waterHitAlong(x0, y0, x1, y1) { if (!Env.water.length) return null; const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16); for (let i = 1; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (waterAt(x, y)) return [x, y]; } return null; }
const _spawnBullets = spawnBullets;
spawnBullets = function (e, auth) {
  const w = Weapons.byId[e.wid]; if (!w || w.type !== 'gun') return;
  if (e.sub) { // cluster bomblets from a grenade blast
    const R = rng(e.s), cl = w.cluster; for (let i = 0; i < cl.count; i++) { const a = -Math.PI / 2 + (i / Math.max(1, cl.count - 1) - .5) * 2.2 + (R() - .5) * .3, sp = 420 + R() * 260; G.bullets.push(mkBullet(e, w, a, sp, auth, { sub: 1, fuse: .55 + R() * .35, bounces: 3 })); } return;
  }
  if (w.beam) return fireBeam(e, w, auth);
  const R = rng(e.s); for (let i = 0; i < Math.max(1, w.bullets | 0); i++) { const a = e.a + (R() - .5) * 2 * w.spread; G.bullets.push(mkBullet(e, w, a, w.bulletSpeed * (1 - R() * .04), auth)); }
};
function mkBullet(e, w, a, sp, auth, o = {}) {
  const pr = w.projectile || {}; return Object.assign({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, owner: e.id, wid: e.wid, dist: 0, bounces: w.bounces | 0, auth, trail: [[e.x, e.y]], dead: false, born: now(), grace: 0,
    type: ptype(w), t: 0, life: w.life || 0, fuse: w.fuse || 0, pierce: w.pierce | 0, hits: null, rot: Math.random() * TAU, ret: false, wet: false, fxT: 0, size: pr.size || 3, color: pr.color || w.vfx.tracer, glow: pr.glow || null }, o);
}
function bulletDie(b, w, how) {
  if (b.dead) return; b.dead = true; b.fade = 0; const ex = b.sub ? w.cluster && { radius: w.cluster.radius, damage: w.cluster.damage, knockback: 600, crater: w.cluster.crater, selfDamage: .5 } : w.explosion;
  if (b.type === 'bubble') { FX.ring(b.x, b.y, b.size * 2, 'rgba(230,250,255,.9)', 2, .25); for (let i = 0; i < 6; i++) FX.add({ k: 'drop', x: b.x, y: b.y, vx: (Math.random() - .5) * 220, vy: (Math.random() - .5) * 220, r: 1.6, color: 'rgba(200,240,255,.9)', life: .5, t: 0 }); Audio2.play('bubble', b.x, .4, 1.6); }
  if (b.type === 'flame') FX.smoke(b.x, b.y, 1, 10, 'rgba(90,80,80,.35)');
  if (b.auth && ex) hostExplode(b.x, b.y, ex, b.owner, b.wid, !!b.sub);
  if (b.auth && !b.sub && w.cluster && how !== 'water') emit({ k: 'shot', id: b.owner, wid: b.wid, x: Math.round(b.x), y: Math.round(b.y - 6), a: 0, s: randSeed(), sub: 1 });
}
function nearestEnemy(b, maxD) { let best = null, bd = maxD; for (const p of G.players.values()) { if (!p.alive || p.id === b.owner) continue; const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < bd) { bd = d; best = p; } } return best; }
updateBullets = function (dt) {
  for (const b of G.bullets) {
    if (b.dead) { b.fade = (b.fade || 0) + dt; continue; }
    const w = pw(b); b.t += dt; b.rot += ((w.projectile && w.projectile.spin) || 0) * dt;
    if (b.hookT != null) { b.hookT -= dt; const o = G.players.get(b.owner); if (b.hookT <= 0 || !o || !o.alive) { b.dead = true; b.fade = 0; if (o) o.grap = null; } continue; }
    if (b.life && b.t > b.life) { bulletDie(b, w, 'life'); continue; }
    if (b.fuse && b.t > b.fuse) { bulletDie(b, w, 'fuse'); continue; }
    if (w.drag) { const k = Math.exp(-w.drag * dt); b.vx *= k; b.vy *= k; }
    if (b.type === 'flame' || b.type === 'bubble') b.vx += Env.wind * (b.type === 'bubble' ? .5 : .9) * dt;
    if (w.homing) { const q = nearestEnemy(b, 640); if (q) { const a = Math.atan2(b.vy, b.vx), want = Math.atan2(q.y - b.y, q.x - b.x), sp = Math.hypot(b.vx, b.vy); const na = a + clamp(angDiff(want, a), -w.homing * dt, w.homing * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; } }
    if (b.ret) { const o = G.players.get(b.owner); if (!o || !o.alive) { b.dead = true; b.fade = 0; continue; } const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy), sp = Math.max(900, Math.hypot(b.vx, b.vy)); b.vx = lerp(b.vx, dx / d * sp * 1.1, 1 - Math.exp(-7 * dt)); b.vy = lerp(b.vy, dy / d * sp * 1.1, 1 - Math.exp(-7 * dt)); if (d < 30) { b.dead = true; b.fade = .2; Audio2.play('tink', b.x, .5); continue; } }
    if (w.pull && w.pull.radius) for (const p of G.players.values()) { if (!p.alive || !controlledHere(p) || p.id === b.owner) continue; const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if (d < w.pull.radius && d > 8) { const f = (1 - d / w.pull.radius) * w.pull.force * dt; p.vx += dx / d * f; p.vy += dy / d * f; p.grounded = false; } }
    const sp = Math.hypot(b.vx, b.vy); const n = Math.max(1, Math.ceil(sp * dt / 5)); const h = dt / n;
    for (let i = 0; i < n && !b.dead; i++) {
      b.vy += (w.bulletGravity || 0) * h; b.x += b.vx * h; b.y += b.vy * h; b.dist += sp * h;
      if (Env.water.length) { const wb = waterAt(b.x, b.y); if (wb && !b.wet) { b.wet = true; splash(b.x, b.y, clamp(sp / 2400, .25, 1.2) * (b.type === 'rocket' || b.type === 'grenade' ? 1.5 : 1), wb); if (wb.lava) { if (b.type !== 'beam') { bulletDie(b, w, 'lava'); break; } } else if (b.type === 'flame') { FX.smoke(b.x, b.y, 2, 12, 'rgba(235,240,245,.6)'); Audio2.play('sizzle', b.x, .25); bulletDie(b, w, 'water'); break; } else if (b.type === 'bubble') { b.vy = -300; } else { b.vx *= .45; b.vy *= .45; } } else if (!wb && b.wet) { b.wet = false; if (b.vy < 0) splash(b.x, b.y + 4, .35); } if (b.wet && Math.random() < .25 && R8.fxScale > .4) FX.add({ k: 'drop', x: b.x, y: b.y, vx: 0, vy: -60, r: 1.5, color: 'rgba(230,248,255,.7)', life: .4, t: 0, bub: 1 }); }
      if (!w.passTerrain && !b.ret && solidAt(b.x, b.y)) {
        if (b.type === 'hook') { b.vx = b.vy = 0; if (w.grapple) { b.hookT = .9; const o = G.players.get(b.owner); if (o) o.grap = { x: b.x, y: b.y, sp: w.grapple, t: .9, b }; } else { b.dead = true; b.fade = 0; } FX.sparks(b.x, b.y, Math.atan2(-b.vy, -b.vx), 6, '#fff2cc'); Audio2.play('tink', b.x, .8, .7); if (b.auth) hostImpact(b, w, false); break; }
        if (b.type === 'boomerang' || w.returns) { b.ret = true; FX.sparks(b.x, b.y, Math.atan2(-b.vy, -b.vx), 8, w.vfx.tracer); if (b.auth) hostImpact(b, w, true); break; }
        if (b.bounces > 0) { const [nx, ny] = surfaceNormal(b.x, b.y); const d = b.vx * nx + b.vy * ny; const k = w.bounciness ?? .8; b.vx -= (1 + k) * d * nx; b.vy -= (1 + k) * d * ny; b.vx *= .92; b.x += nx * 6; b.y += ny * 6; b.bounces--; if (b.type === 'grenade') { if (Math.abs(d) > 120) Audio2.play('tink', b.x, .5, .6); } else { FX.sparks(b.x, b.y, Math.atan2(b.vy, b.vx), 6, w.vfx.tracer); if (b.auth) hostImpact(b, w, true); } continue; }
        if (b.type === 'grenade' && b.fuse) { b.vx = 0; b.vy = 0; b.y -= 4; continue; }
        if (b.type !== 'flame' && b.type !== 'bubble') FX.sparks(b.x, b.y, Math.atan2(-b.vy, -b.vx), 10 * (w.vfx.sparks ?? 1), w.vfx.tracer);
        if (b.auth && !w.explosion) hostImpact(b, w, false); if (b.auth && w.ignites) igniteNear(b.x, b.y, 40);
        bulletDie(b, w, 'wall'); break;
      }
      for (const p of G.players.values()) {
        if (!p.alive || (p.id === b.owner && !b.deflected)) continue; if (b.hits && b.hits.has(p.id)) continue;
        const r = Math.max(3, b.size * .6); if (Math.abs(b.x - p.x) < HW + r && Math.abs(b.y - p.y) < HH + r) {
          if (b.auth) { const head = b.y < p.y - HH * .35; const dmg = Math.round(w.damage * (head ? (w.headshot || 1) : 1)); const l = Math.hypot(b.vx, b.vy) || 1; let kx = b.vx / l * w.knockback, ky = b.vy / l * w.knockback * .5 - 140;
            if (w.pullToShooter) { const o = G.players.get(b.owner); if (o) { const dx = o.x - p.x, dy = o.y - p.y, dd = Math.hypot(dx, dy) || 1; kx = dx / dd * w.pullToShooter; ky = dy / dd * w.pullToShooter * .6 - 300; } }
            hostDamage(p, dmg, b.owner, b.wid, kx, ky, b.x, b.y, head); if (w.onHit) try { w.onHit({ x: b.x, y: b.y, target: p.id, shooter: b.owner }, HookAPI); } catch (er) { } }
          if (b.type === 'hook' && w.pullToShooter) Env.ropes.push({ a: b.owner, x: b.x, y: b.y, t: .25 });
          if (b.pierce > 0) { b.pierce--; (b.hits || (b.hits = new Set())).add(p.id); FX.sparks(b.x, b.y, Math.atan2(b.vy, b.vx), 5, w.vfx.tracer); }
          else bulletDie(b, w, 'player');
          break;
        }
      }
      if (b.dead) break;
      if (!b.ret && b.dist > (w.range || 1600)) { if (w.returns || b.type === 'boomerang') { b.ret = true; } else { if (!w.explosion) FX.smoke(b.x, b.y, 1, 10, 'rgba(240,232,220,.5)'); bulletDie(b, w, 'range'); } }
      if (b.x < -400 || b.x > W + 400 || b.y > H + 300 || b.y < -1500) { b.dead = true; b.fade = 1; }
    }
    if (!b.dead && Env.props.length) propHitPoint(b, w);
    if (!b.dead) bulletTrailFx(b, w, dt);
    b.trail.push([b.x, b.y]); if (b.trail.length > (b.type === 'flame' ? 2 : 6)) b.trail.shift();
  }
  let k = 0; for (const b of G.bullets) if (!b.dead || b.fade < .12) G.bullets[k++] = b; G.bullets.length = k;
  for (const arr of [Env.beams, Env.zaps, Env.ropes]) { let j = 0; for (const z of arr) { z.t += dt; if (z.t < (z.life || .3)) arr[j++] = z; } arr.length = j; }
};
function bulletTrailFx(b, w, dt) {
  b.fxT -= dt; if (b.fxT > 0 || !visibleWorld(b.x, b.y, 60)) return; const tr = w.projectile && w.projectile.trail; const q = R8.fxScale;
  if (b.type === 'rocket') { b.fxT = .025 / q; FX.smoke(b.x - b.vx * .01, b.y - b.vy * .01, 1, 9, 'rgba(225,220,212,.6)', -b.vx * .05, -b.vy * .05); FX.light(b.x, b.y, 70, (w.projectile && w.projectile.glow) || '#ffb35c', .05, .8); }
  else if (b.type === 'flame') { b.fxT = .05 / q; FX.light(b.x, b.y, 50 + b.t * 90, '#ff8a3c', .06, .5); }
  else if (tr === 'sparkle') { b.fxT = .04 / q; FX.add({ k: 'spark', x: b.x, y: b.y, vx: (Math.random() - .5) * 90, vy: (Math.random() - .5) * 90, life: .25, t: 0, color: b.glow || b.color, w: 1.3 }); }
  else if (tr === 'smoke') { b.fxT = .04 / q; FX.smoke(b.x, b.y, 1, 7, 'rgba(225,220,212,.45)'); }
  else b.fxT = 1;
}
/* explosions + area effects (host) */
function hostExplode(x, y, ex, by, wid, small = false) {
  x = Math.round(x); y = Math.round(y); const r = ex.radius || 90;
  if (ex.crater) emit({ k: 'crater', x, y, r: ex.crater, j: .55, s: randSeed(), sc: 1, dn: true, deb: Math.round(ex.crater / (small ? 3 : 1.6)), du: 1.6 });
  emit({ k: 'ex', x, y, r, wid, sm: small ? 1 : 0 });
  for (const p of G.players.values()) { if (!p.alive) continue; const d = Math.hypot(p.x - x, p.y - y); if (d > r + HW) continue; if (!lineOfSight(x, y - 4, p.x, p.y) && d > r * .45) continue; const f = clamp(1 - d / (r + HW), 0, 1); const a = Math.atan2(p.y - y - 10, p.x - x); const self = p.id === by ? (ex.selfDamage ?? .5) : 1; const dmg = Math.round((ex.damage || 40) * (.35 + .65 * f) * self); const kb = (ex.knockback || 900) * (.4 + .6 * f) * (p.id === by ? 1.15 : 1); hostDamage(p, dmg, by, wid, Math.cos(a) * kb, Math.sin(a) * kb - 260 * f, p.x, p.y); }
  propsBlast(x, y, r, by);
  const w = Weapons.byId[wid]; if (w && w.onExplode) try { w.onExplode({ x, y, radius: r, shooter: by }, HookAPI); } catch (er) { }
}
function fxExplosion(e) {
  const r = e.r, big = !e.sm; const q = R8.fxScale; const w = Weapons.byId[e.wid]; const glow = (w && w.projectile && w.projectile.glow) || '#ffb35c';
  FX.light(e.x, e.y, r * 3.4, glow, .32, 1.6); FX.ring(e.x, e.y, r, 'rgba(255,246,228,.95)', big ? 5 : 3, .35); if (big) FX.ring(e.x, e.y, r * 1.5, rgba(INK, .35), 2, .5);
  FX.smoke(e.x, e.y, Math.round((big ? 9 : 4) * q) + 1, r * .45, 'rgba(70,60,62,.5)', 0, -60); FX.smoke(e.x, e.y, Math.round((big ? 6 : 3) * q) + 1, r * .35, rgba(glow, .55), 0, -40);
  for (let i = 0; i < Math.round((big ? 22 : 9) * q); i++) { const a = Math.random() * TAU, sp = 300 + Math.random() * 700; FX.add({ k: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: .3 + Math.random() * .5, t: 0, color: Math.random() < .5 ? glow : '#fff1d0', w: 2 }); }
  for (let i = 0; i < Math.round((big ? 8 : 3) * q); i++) FX.add({ k: 'ember', x: e.x, y: e.y, vx: (Math.random() - .5) * 500, vy: -200 - Math.random() * 500, life: .9 + Math.random() * .8, t: 0, r: 2.5, color: glow, g: 1 });
  FX.flash(e.x, e.y, -Math.PI / 2, big ? 2.2 : 1.2); splash(e.x, e.y, big ? 2.2 : 1.1);
  const me = G.players.get(G.myId); const near = me ? clamp(1 - Math.hypot(me.x - e.x, me.y - e.y) / (r * 6), 0, 1) : .5; G.trauma = Math.min(1, G.trauma + (big ? .75 : .35) * near); if (big && near > .6) G.flash = Math.max(G.flash, .12 * near);
  Audio2.play('boom', e.x, big ? 1 : .5, big ? 1 : 1.4);
}
function chainZap(src, w, by) {
  const ch = w.chain; let from = src; const hit = new Set([src.id, by]); const pts = [[src.x, src.y]];
  for (let i = 0; i < ch.count; i++) { let best = null, bd = ch.range; for (const p of G.players.values()) { if (!p.alive || hit.has(p.id)) continue; const d = Math.hypot(p.x - from.x, p.y - from.y); if (d < bd && lineOfSight(from.x, from.y, p.x, p.y)) { bd = d; best = p; } } if (!best) break; hit.add(best.id); pts.push([best.x, best.y]); hostDamage(best, ch.damage, by, w.id, (best.x - from.x) * .5, -220, best.x, best.y); from = best; }
  if (pts.length > 1) emit({ k: 'zap', pts: pts.map(p => [Math.round(p[0]), Math.round(p[1])]), c: (w.projectile && w.projectile.color) || '#b98cff' });
}
const _hostDamage = hostDamage;
hostDamage = function (q, dmg, by, wid, kx, ky, x, y, head = false) {
  if (!q.alive || q.spawnT > .2 || !(G.phase === 'fight' || G.phase === 'warmup')) return;
  const w = Weapons.byId[wid]; const st = q.status || {};
  if (st.freeze > 0 && dmg > 0) dmg = Math.round(dmg * 1.25); // frozen targets shatter
  if (st.bubble > 0 && dmg > 0 && wid !== (st.bubbleBy || '')) { st.bubble = 0; emit({ k: 'st', id: q.id, s: { bubble: 0 }, pop: 1 }); }
  const before = q.hp; _hostDamage(q, dmg, by, wid, kx, ky, x, y, head); const dealt = before - q.hp;
  if (!w || dmg <= 0) return; const attacker = by && G.players.get(by);
  if (w.status && q.alive) { const s = {}; const S = w.status; if (S.burn) s.burn = Math.max(st.burn || 0, S.burn); if (S.shock) s.shock = Math.max(st.shock || 0, S.shock); if (S.bubble && !(st.bubble > 0)) { s.bubble = S.bubble; s.bubbleBy = wid; } if (S.chill) { const c = (st.chill || 0) + S.chill; if (c >= 3) { s.chill = 0; s.freeze = 1.3; } else s.chill = c; } if (Object.keys(s).length) { Object.assign(st, s); q.status = st; emit({ k: 'st', id: q.id, s }); } }
  if (w.lifesteal && attacker && attacker !== q && attacker.alive && dealt > 0) { attacker.hp = Math.min(maxHp(), attacker.hp + Math.round(dealt * w.lifesteal)); emit({ k: 'heal', id: attacker.id, hp: attacker.hp, n: Math.round(dealt * w.lifesteal) }); }
  if (w.chain && !G._chaining && attacker !== q) { G._chaining = true; try { chainZap(q, w, by); } finally { G._chaining = false; } }
};
HookAPI.heal = (id, n) => { const p = G.players.get(id); if (p && p.alive) { p.hp = Math.min(maxHp(), p.hp + n); emit({ k: 'heal', id, hp: p.hp, n }); } };
HookAPI.status = (id, s) => { const p = G.players.get(id); if (p && p.alive) { p.status = Object.assign(p.status || {}, s); emit({ k: 'st', id, s }); } };
HookAPI.explode = (x, y, r, dmg, by) => hostExplode(x, y, { radius: r, damage: dmg, knockback: 900, crater: r * .45, selfDamage: .5 }, by, '_fists');
HookAPI.shockwave = (x, y, r, dmg, by) => hostShockwave(x, y, { radius: r, damage: dmg, knockback: 800, crater: r * .2 }, by, '_fists');
function hostShockwave(x, y, s, by, wid) {
  x = Math.round(x); y = Math.round(y); if (s.crater) emit({ k: 'crater', x, y, r: s.crater, j: .8, s: randSeed(), sc: .1, dn: true, deb: Math.round(s.crater / 1.5), du: 2.4 });
  emit({ k: 'ex', x, y, r: s.radius, wid, sw: 1 });
  for (const p of G.players.values()) { if (!p.alive || p.id === by) continue; const d = Math.hypot(p.x - x, p.y - y); if (d > s.radius) continue; const f = 1 - d / s.radius; const dir = Math.sign(p.x - x) || 1; hostDamage(p, Math.round(s.damage * (.5 + .5 * f)), by, wid, dir * s.knockback * (.5 + .5 * f), -s.knockback * .6, p.x, p.y); }
  propsBlast(x, y, s.radius * .8, by);
}
/* melee extras: combos, full spins, shockwaves */
const _startSwing = startSwing;
startSwing = function (p, a) {
  const w = weaponOf(p); const t = now(); let n = 0;
  if (w.combo) { n = (t - (p.lastSwingT || 0) < w.combo.window + (w.swingTime || .2)) ? ((p.comboN || 0) + 1) % w.combo.hits : 0; p.comboN = n; }
  p.lastSwingT = t; _startSwing(p, a);
  if (p.swing) { p.swing.mult = w.combo ? (w.combo.damageMult[n] ?? 1) : 1; p.swing.fin = w.combo && n === w.combo.hits - 1; if ((w.arc || 0) >= 300) { const dir = Math.cos(a) >= 0 ? 1 : -1; p.swing.a0 = a - dir * Math.PI; p.swing.a1 = a + dir * Math.PI; } if (p.swing.fin) { FX.ring(p.x, p.y, (w.reach || 80) * 1.1, rgba(w.vfx.trail || '#fff', .8), 3, .3); Audio2.play('swing', p.x, 1, .7); } }
};
const _hostSwingStep = hostSwingStep;
hostSwingStep = function (p) {
  const sw = p.swing; const w = Weapons.byId[sw.wid] || FISTS; const base = w.damage; w.damage = Math.round(base * (sw.mult || 1));
  try {
    if ((w.arc || 0) >= 300) { const prog = easeOut(clamp(sw.t / sw.dur, 0, 1)); const span = Math.abs(sw.a1 - sw.a0) * prog, dir = Math.sign(sw.a1 - sw.a0); const reach = w.reach || 60;
      for (const q of G.players.values()) { if (q === p || !q.alive || sw.hit.has(q.id)) continue; const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d > reach + 18) continue; let rel = (Math.atan2(dy, dx) - sw.a0) * dir; rel = ((rel % TAU) + TAU) % TAU; if (rel > span + .3 && d > 28) continue; sw.hit.add(q.id); const kd = Math.sign(dx) || 1; hostDamage(q, w.damage, p.id, w.id, kd * w.knockback, -w.knockback * .45, q.x - dx * .3, q.y - dy * .3); if (w.onHit) try { w.onHit({ x: q.x, y: q.y, target: q.id, shooter: p.id }, HookAPI); } catch (er) { } } }
    _hostSwingStep(p);
  } finally { w.damage = base; }
  if (w.shockwave && !sw.shocked && sw.t / sw.dur > .55) { sw.shocked = true; const cur = currentWeaponAngle(p), reach = (w.reach || 80) * .9; let hx = p.x + Math.cos(cur) * reach, hy = p.y + Math.sin(cur) * reach; const g = groundBelow(hx, hy, 80); if (g != null) hy = g; hostShockwave(hx, hy, w.shockwave, p.id, w.id); }
  propMelee(p, w, sw);
};
/* attacks: magazines, reloads, bursts, charge, spin-up, boomerang limit */
function magOf(w) { return w.magazine | 0; }
function beginReload(p) { const w = weaponOf(p); if (!magOf(w) || p.reloadEnd > now() || (p.mag | 0) >= magOf(w) || (w.ammo > 0 && p.ammo <= (p.mag | 0))) return; p.reloadEnd = now() + (w.reloadTime || 1.2); p.reloadDur = w.reloadTime || 1.2; if (p.id === G.myId) Audio2.play('reload', p.x); }
function refillMag(p) { const w = weaponOf(p); if (magOf(w)) p.mag = w.ammo > 0 ? Math.min(magOf(w), p.ammo) : magOf(w); else p.mag = null; p.reloadEnd = 0; }
function canFire(p, w) {
  const st = p.status || {}; if (st.freeze > 0 || st.bubble > 0) return false;
  if (magOf(w)) { if (p.reloadEnd > now()) return false; if ((p.mag ?? magOf(w)) <= 0) { beginReload(p); return false; } }
  if (w.returns && G.bullets.some(b => !b.dead && b.owner === p.id && b.wid === w.id)) return false; return true;
}
const _doAttack = doAttack;
function fireNow(p, aim) { const w = weaponOf(p); const before = p.nextAtk; p.nextAtk = 0; _doAttack(p, aim); if (w.type === 'gun' && magOf(w) && p.mag != null) { p.mag--; if (p.mag <= 0) setTimeout(() => beginReload(p), 120); } return before; }
doAttack = function (p, aim) {
  if (!p.alive || !canAttackPhase()) return; const t = now(); if (t < p.nextAtk) return; const w = weaponOf(p);
  if (!canFire(p, w)) { if (w.returns) return; if (t > (p.emptyT || 0)) { p.emptyT = t + .3; Audio2.play('empty', p.x); } return; }
  if (w.type !== 'gun') { _doAttack(p, aim); return; }
  if (w.ammo > 0 && p.ammo <= 0) { _doAttack(p, aim); return; }
  let rate = Math.max(.1, w.fireRate); if (w.spinUp) { rate *= .3 + .7 * (p.spin || 0); p.spinHold = .25; }
  if (w.charge && !p.charging) { p.charging = { t: 0, dur: w.charge }; p.nextAtk = t + w.charge + 1 / rate; Audio2.play('charge', p.x, .6); return; }
  if (w.charge) return;
  fireNow(p, aim); p.nextAtk = t + 1 / rate;
  if (w.burst && w.burst.count > 1) { p.burstLeft = w.burst.count - 1; p.burstT = w.burst.delay || .06; p.nextAtk = t + 1 / rate + (w.burst.count - 1) * (w.burst.delay || .06); }
};
const _hostAttack = hostAttack;
hostAttack = function (pid, a, x, y, s, remote = false) {
  const p = G.players.get(pid); if (!p) return; const w = weaponOf(p);
  if (w.type === 'gun' && (w.burst || w.spinUp || w.charge)) p.hostNext = Math.min(p.hostNext || 0, now() + (w.burst ? (w.burst.delay || .06) * .5 : 0));
  if (remote && w.type === 'gun' && magOf(w)) { if (p.reloadEnd > now() + .2) return; if (p.mag != null) { p.mag--; if (p.mag <= 0) beginReload(p); } }
  _hostAttack(pid, a, x, y, s, remote);
};
function updateWeaponTimers(dt) {
  const t = now();
  for (const p of G.players.values()) {
    const w = weaponOf(p); const st = p.status;
    if (st) { for (const k of ['burn', 'shock', 'freeze', 'bubble']) if (st[k] > 0) st[k] = Math.max(0, st[k] - dt); if (st.chill > 0) st.chill = Math.max(0, st.chill - dt * .6);
      if (st.burn > 0 && visibleWorld(p.x, p.y, 40) && Math.random() < dt * 22 * R8.fxScale) FX.add({ k: 'ember', x: p.x + (Math.random() - .5) * PW, y: p.y + (Math.random() - .3) * PH * .6, vx: (Math.random() - .5) * 40, vy: -80 - Math.random() * 90, life: .5, t: 0, r: 3.2, color: '#ff9a3c', g: -1 });
      if (st.burn > 0 && waterAt(p.x, p.y)) { st.burn = 0; FX.smoke(p.x, p.y, 3, 14, 'rgba(235,240,245,.6)'); Audio2.play('sizzle', p.x, .4); } }
    if (!p.alive) { p.charging = null; p.burstLeft = 0; continue; }
    if (w.spinUp) { if (p.spinHold > 0) { p.spinHold -= dt; p.spin = Math.min(1, (p.spin || 0) + dt / w.spinUp); } else p.spin = Math.max(0, (p.spin || 0) - dt * 1.4); } else p.spin = 0;
    if (p.reloadEnd && t >= p.reloadEnd) { refillMag(p); if (p.id === G.myId) Audio2.play('reload', p.x, .6, 1.4); }
    if (!controlledHere(p)) continue;
    if (p.charging) { p.charging.t += dt; if (p.charging.t >= p.charging.dur) { p.charging = null; if (canAttackPhase() && weaponOf(p).charge) fireNow(p, p.aim); } }
    if (p.burstLeft > 0) { p.burstT -= dt; if (p.burstT <= 0) { if (canFire(p, w) && !(w.ammo > 0 && p.ammo <= 0)) { fireNow(p, p.aim); p.burstLeft--; p.burstT = (w.burst && w.burst.delay) || .06; } else p.burstLeft = 0; } }
  }
}
/* sprite + player overlays */
let _hideWeapon = false;
const _drawWeaponSprite = drawWeaponSprite;
drawWeaponSprite = function (c, w, hx, hy, a, alpha = 1) { if (_hideWeapon) return; _drawWeaponSprite(c, w, hx, hy, a, alpha); };
const _drawPlayer = drawPlayer;
drawPlayer = function (c, p, t) {
  if (!p.alive) return; const w = weaponOf(p); const st = p.status || {};
  _hideWeapon = !!(w.hideWhileFlying && G.bullets.some(b => !b.dead && b.owner === p.id && b.wid === w.id));
  if (st.shock > 0) { c.save(); c.translate((Math.random() - .5) * 3, 0); _drawPlayer(c, p, t); c.restore(); } else _drawPlayer(c, p, t);
  _hideWeapon = false;
  if (p.charging) { const k = clamp(p.charging.t / p.charging.dur, 0, 1); const [mx, my] = muzzlePos(p); const col = (w.projectile && w.projectile.glow) || '#bff3ff'; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .4 + .6 * k; const r = 8 + k * 26 + Math.sin(t * 40) * 3; c.drawImage(softSprite(rgba(col, 1)), mx - r, my - r, r * 2, r * 2); c.restore(); c.strokeStyle = rgba(col, .8); c.lineWidth = 2; c.beginPath(); c.arc(mx, my, 26 * (1 - k) + 4, 0, TAU); c.stroke(); }
  if (st.freeze > 0) { c.save(); c.globalAlpha = .78; c.fillStyle = 'rgba(190,232,255,.62)'; c.strokeStyle = '#eaf8ff'; c.lineWidth = 2; c.beginPath(); const pts = [[-HW - 7, -HH - 8], [HW + 5, -HH - 11], [HW + 9, HH + 3], [-HW - 5, HH + 5]]; c.moveTo(p.x + pts[0][0], p.y + pts[0][1]); for (const q of pts) c.lineTo(p.x + q[0], p.y + q[1]); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(31,28,36,.5)'; c.lineWidth = 1.2; c.stroke(); c.globalAlpha = .9; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(p.x - HW, p.y - HH + 2); c.lineTo(p.x - HW + 9, p.y - HH - 3); c.stroke(); c.restore(); }
  else if (st.chill > 0) { c.fillStyle = `rgba(170,225,255,${Math.min(.45, st.chill * .15)})`; c.fillRect(p.x - HW, p.y - HH, PW, PH); }
  if (st.bubble > 0) { const r = PH * .9 + Math.sin(t * 6) * 2; c.save(); c.fillStyle = 'rgba(190,240,255,.22)'; c.strokeStyle = 'rgba(31,28,36,.45)'; c.lineWidth = 1.6; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, r - 6, -2.4, -1.6); c.stroke(); c.restore(); }
  if (st.shock > 0 && Math.random() < .5) { c.strokeStyle = '#d9c4ff'; c.lineWidth = 1.6; c.beginPath(); let x = p.x + (Math.random() - .5) * PW, y = p.y - HH; c.moveTo(x, y); for (let i = 0; i < 4; i++) { x += (Math.random() - .5) * 14; y += PH / 4; c.lineTo(x, y); } c.stroke(); }
  if (p.grap) { const [hx, hy] = handPos(p); c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + p.grap.x) / 2, (hy + p.grap.y) / 2 + 12, p.grap.x, p.grap.y); c.stroke(); c.strokeStyle = '#d9c39a'; c.lineWidth = 1; c.stroke(); }
};
function drawLasers(c) {
  for (const p of G.players.values()) { if (!p.alive || !p.aiming) continue; const w = weaponOf(p); if (!w.laser) continue; const [mx, my] = muzzlePos(p); const [ex, ey] = rayEnd(mx, my, p.aim, Math.min(w.range || 2000, 2200));
    const col = (w.projectile && w.projectile.color) || '#ff4f4f'; c.save(); c.globalAlpha = .18; c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.moveTo(mx, my); c.lineTo(ex, ey); c.stroke(); c.globalAlpha = .85; c.strokeStyle = w.beam ? col : '#ff4f4f'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 2.6, 0, TAU); c.fill(); c.restore(); }
}
/* projectile art */
const _drawBullets = drawBullets;
drawBullets = function (c) {
  const all = G.bullets; const plain = []; const fancy = [];
  for (const b of all) ((b.type === 'bullet' && !pw(b).projectileSprite) ? plain : fancy).push(b);
  G.bullets = plain; try { _drawBullets(c); } finally { G.bullets = all; }
  for (const b of fancy) {
    const w = pw(b); const f = b.dead ? clamp(1 - b.fade / .12, 0, 1) : 1; if (f <= 0) continue; const a = Math.atan2(b.vy, b.vx), s = b.size; c.save(); c.globalAlpha = f; c.translate(b.x, b.y); c.lineJoin = 'round';
    if (w.projectileSprite && w.img) { const sz = Math.max(6, +w.projectileSize || 16); c.rotate(w.projectile && w.projectile.spin ? b.rot : a); c.drawImage(w.img, -sz / 2, -sz / 2, sz, sz); }
    else switch (b.type) {
      case 'rocket': c.rotate(a); c.fillStyle = b.color; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(s * 1.8, 0); c.quadraticCurveTo(s * .9, -s * .75, -s * 1.3, -s * .6); c.lineTo(-s * 1.3, s * .6); c.quadraticCurveTo(s * .9, s * .75, s * 1.8, 0); c.fill(); c.stroke(); c.fillStyle = '#d9573b'; c.beginPath(); c.moveTo(-s * .9, -s * .5); c.lineTo(-s * 1.7, -s * 1.1); c.lineTo(-s * 1.4, -s * .2); c.closePath(); c.moveTo(-s * .9, s * .5); c.lineTo(-s * 1.7, s * 1.1); c.lineTo(-s * 1.4, s * .2); c.closePath(); c.fill(); c.stroke(); c.globalCompositeOperation = 'lighter'; c.drawImage(softSprite(rgba(b.glow || '#ffb35c', 1)), -s * 4.5, -s * 1.6, s * 3.2, s * 3.2); break;
      case 'grenade': { c.rotate(b.rot); c.fillStyle = b.color; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-s * .35, -s * .35, s * .35, 0, TAU); c.fill(); c.fillStyle = INK; c.fillRect(-2, -s - 4, 4, 5); const blink = b.fuse ? Math.sin(b.t * (6 + b.t * 16)) > 0 : true; if (blink) { c.rotate(-b.rot); c.globalCompositeOperation = 'lighter'; c.drawImage(softSprite(rgba(b.glow || '#ffd28a', 1)), -s * 1.6, -s * 1.6 - s, s * 3.2, s * 3.2); } break; }
      case 'orb': { const g = b.glow || '#fff'; c.globalCompositeOperation = 'lighter'; c.drawImage(softSprite(rgba(g, 1)), -s * 3, -s * 3, s * 6, s * 6); c.globalCompositeOperation = 'source-over'; c.fillStyle = b.color; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 3; i++) c.arc(0, 0, s * (1.25 + i * .25), b.rot + i * 2, b.rot + i * 2 + 1.6); c.stroke(); if (w.pull) { c.globalAlpha = .18 * f; c.setLineDash([3, 9]); c.beginPath(); c.arc(0, 0, w.pull.radius * (.6 + .4 * Math.sin(b.t * 5)), 0, TAU); c.stroke(); c.setLineDash([]); } break; }
      case 'bubble': { const r = s * (1 + Math.sin(b.t * 9) * .06); c.fillStyle = 'rgba(190,240,255,.28)'; c.strokeStyle = 'rgba(31,28,36,.55)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, r * .68, -2.5, -1.7); c.stroke(); break; }
      case 'boomerang': c.rotate(b.rot); c.fillStyle = b.color; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(-s, -s * .2); c.quadraticCurveTo(0, -s * .9, s, -s * .2); c.lineTo(s * .8, s * .2); c.quadraticCurveTo(0, -s * .35, -s * .8, s * .2); c.closePath(); c.fill(); c.stroke(); break;
      case 'flame': { const k = b.life ? b.t / b.life : .5; const r = s * (.6 + k * 2.2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = f * (1 - k * .7); c.drawImage(softSprite(k < .45 ? 'rgba(255,214,120,1)' : 'rgba(255,110,40,1)'), -r, -r, r * 2, r * 2); break; }
      case 'shard': c.rotate(a); c.fillStyle = b.color; c.strokeStyle = 'rgba(31,28,36,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(s * 1.6, 0); c.lineTo(0, -s * .45); c.lineTo(-s * 1.2, 0); c.lineTo(0, s * .45); c.closePath(); c.fill(); c.stroke(); c.globalCompositeOperation = 'lighter'; c.drawImage(softSprite(rgba(b.glow || '#e6f8ff', 1)), -s * 2, -s * 2, s * 4, s * 4); break;
      case 'hook': { c.restore(); c.save(); const o = G.players.get(b.owner); if (o && o.alive) { const [hx, hy] = handPos(o); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + b.x) / 2, (hy + b.y) / 2 + 14, b.x, b.y); c.stroke(); } c.translate(b.x, b.y); c.rotate(b.hookT != null ? (b.ha ?? (b.ha = a)) : a); c.fillStyle = b.color; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(s * 1.4, 0); c.lineTo(-s * .4, -s * .8); c.lineTo(0, 0); c.lineTo(-s * .4, s * .8); c.closePath(); c.fill(); c.stroke(); break; }
      default: c.fillStyle = b.color; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill();
    }
    c.restore();
  }
  // beams + chain lightning + yanks
  c.save(); c.lineCap = 'round';
  for (const z of Env.beams) { const k = z.t / z.life; c.globalAlpha = 1 - k; c.strokeStyle = rgba(INK, .5); c.lineWidth = z.w * (1.4 - k) + 3; c.beginPath(); c.moveTo(z.x0, z.y0); c.lineTo(z.x1, z.y1); c.stroke(); c.strokeStyle = z.color; c.lineWidth = z.w * (1.3 - k); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, z.w * .35 * (1 - k)); c.stroke(); }
  for (const z of Env.zaps) { c.globalAlpha = 1 - z.t / .3; c.strokeStyle = z.c; c.lineWidth = 2.4; c.beginPath(); c.moveTo(z.pts[0][0], z.pts[0][1]); for (let i = 1; i < z.pts.length; i++) { const [x0, y0] = z.pts[i - 1], [x1, y1] = z.pts[i]; for (let s = 1; s <= 6; s++) c.lineTo(lerp(x0, x1, s / 6) + (s < 6 ? (Math.random() - .5) * 18 : 0), lerp(y0, y1, s / 6) + (s < 6 ? (Math.random() - .5) * 18 : 0)); } c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke(); }
  for (const z of Env.ropes) { const o = G.players.get(z.a); if (!o) continue; c.globalAlpha = 1 - z.t / .3; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(z.x, z.y); c.stroke(); }
  c.restore();
};

/* ---------- F. movement: swimming, wall jumps, bounce pads, grapple, status ---------- */
function wallDir(p, pref = 0) { const l = solidRect(p.x - HW - 5, p.y - HH + 8, p.x - HW - 1, p.y + HH - 10), r = solidRect(p.x + HW + 1, p.y - HH + 8, p.x + HW + 5, p.y + HH - 10); if (l && r) return pref || 0; return l ? -1 : r ? 1 : 0; }
const _physicsStep = physicsStep;
physicsStep = function (p, dt) {
  const inp = p.input, st = p.status || {}, w = weaponOf(p); const mx0 = inp.mx; const held = (st.freeze > 0 || st.bubble > 0);
  let ms = w.moveSpeed || 1; if (st.shock > 0) ms *= .5; if (st.chill > 0) ms *= 1 - Math.min(.45, st.chill * .15); if (w.spinUp && p.spin > .3) ms *= .85;
  if (held) { inp.mx = 0; inp.jump = false; } else inp.mx *= ms;
  if (p.grap) { const g = p.grap; g.t -= dt; const dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy); if (d < 40 || g.t <= 0 || inp.jump || held) { p.grap = null; if (g.b) g.b.hookT = 0; if (d < 60) p.vy = Math.min(p.vy, -380); } else { const k = 1 - Math.exp(-9 * dt); p.vx = lerp(p.vx, dx / d * g.sp, k); p.vy = lerp(p.vy, dy / d * g.sp - 120, k); p.grounded = false; p.lungeT = Math.max(p.lungeT, dt * 2); p.jumps = 1; } }
  const water = Env.water.length ? waterAt(p.x, p.y + 4) : null; const depth = water ? p.y + 4 - waterSurfaceY(water, p.x) : 0;
  if (water && depth < 34) p.coyote = Math.max(p.coyote, .05);
  if (inp.jump && !p.grounded && p.coyote <= 0 && !water && groundBelow(p.x, p.y + HH, 14) == null) { const wd = wallDir(p, Math.sign(inp.mx)); if (wd) { inp.jump = false; p.vy = -JUMP * .92; p.vx = -wd * 560; p.lungeT = .13; p.face = -wd; p.sq = 1.2; p.sqv = 0; FX.dustPuff(p.x + wd * HW, p.y, 5, .7); FX.ring(p.x + wd * HW, p.y, 18, 'rgba(255,248,232,.8)'); Audio2.play('jump2', p.x, 1, 1.15); } }
  const ovx = p.vx; _physicsStep(p, dt); inp.mx = mx0;
  if (held) { p.vx *= Math.exp(-6 * dt); if (st.bubble > 0) { p.vy = approach(p.vy, -130, 2400 * dt); p.vx = approach(p.vx, Env.wind * .6, 300 * dt); } }
  if (water) { const buoy = GRAV * clamp(.7 + depth / 50, .7, 1.3); p.vy -= buoy * dt; p.vx *= Math.exp(-2.3 * dt); p.vy *= Math.exp(-(water.lava ? 5 : 2.6) * dt); if (inp.jumpHeld && !held && depth > 20) p.vy -= 700 * dt; p.vy = clamp(p.vy, -560, 420); p.jumps = 1;
    if (!p.wasWet) { splash(p.x, p.y, clamp(Math.abs(p.vy) / 800 + .3, .3, 1.8), water); p.vy *= .45; } if (Math.random() < dt * 3 && depth > 30 && !water.lava) FX.add({ k: 'drop', x: p.x, y: p.y - 10, vx: 0, vy: -70, r: 2, color: 'rgba(235,250,255,.75)', life: .6, t: 0, bub: 1 }); if (Math.abs(p.vx) > 120 && depth < 26 && Math.random() < dt * 8) waterPoke(water, p.x, 40, 1); }
  else if (p.wasWet && p.vy < -200) splash(p.x, p.y + HH, .45);
  p.wasWet = !!water;
  if (T.theme.icy && p.grounded && !held) { p.vx = lerp(ovx, p.vx, .22); if (Math.abs(p.vx) > 200 && Math.random() < dt * 10) FX.add({ k: 'spark', x: p.x, y: p.y + HH, vx: -p.vx * .2, vy: -60, life: .25, t: 0, color: '#eaf8ff', w: 1.2 }); }
  if (!p.grounded && !water && p.vy > 120 && inp.mx && !held) { const wd = wallDir(p, Math.sign(inp.mx)); if (wd === Math.sign(inp.mx)) { p.vy = Math.min(p.vy, 230); p.slideT = (p.slideT || 0) + dt; if (p.slideT > .08) { p.slideT = 0; FX.add({ k: 'smoke', x: p.x + wd * HW, y: p.y + HH * .4, vx: -wd * 20, vy: -10, r: 4, gr: 9, life: .4, t: 0, color: rgba(T.theme.cap, .5), rot: 0 }); } } }
  if (p.vy > 40 && Env.props.length) for (const pr of Env.props) { const d = PROPS[pr.kind]; if (!d.bounce || pr.dead || pr.cut) continue; const top = pr.y - d.bounceH * pr.s; if (Math.abs(p.x - pr.x) < d.bounce * pr.s && p.y + HH >= top - 8 && p.y + HH <= top + 20) { p.vy = pr.kind === 'giantshroom' ? -1500 : -1320; p.grounded = false; p.jumps = 1; p.sq = 1.4; p.sqv = 0; pr.squish = 1; FX.ring(pr.x, top, 34, 'rgba(255,248,232,.9)', 3, .3); Audio2.play('boing', pr.x); break; } }
};
findSpawns = function (n, R = Math.random) {
  const spots = []; for (let i = 0; i < 260 && spots.length < n * 4; i++) { const x = 60 + R() * (W - 120); const y = surfaceFromGrid(x); if (y == null || y > H - 40) continue; if (solidRect(x - HW - 4, y - PH - 50, x + HW + 4, y - 2)) continue; if (waterAt(x, y - 6) || waterAt(x, y - HH)) continue; if (Env.zone && (x < Env.zone.x0 + 60 || x > Env.zone.x1 - 60)) continue; spots.push([x, y - HH - 2]); }
  if (!spots.length) spots.push([W / 2, 200]); const pick = []; while (pick.length < n) { let best = null, bd = -1; for (const s of spots) { const d = pick.length ? Math.min(...pick.map(p => Math.hypot(p[0] - s[0], p[1] - s[1]))) : R(); if (d > bd) { bd = d; best = s; } } pick.push(best); } return pick;
};

/* props interplay lives in world.js */

/* ---------- G. host rules: crates, lightning, lava, burning, the storm wall ---------- */
function rollCrateWeapon() { const list = Weapons.list.filter(w => w.weight > 0); if (!list.length) return null; let tot = 0; for (const w of list) tot += w.weight * rarityOf(w).w * rarityOf(w).w; let r = Math.random() * tot; for (const w of list) { r -= w.weight * rarityOf(w).w * rarityOf(w).w; if (r <= 0) return w; } return list[0]; }
const _hostRules = hostRules;
hostRules = function () {
  _hostRules(); const t = now(); const all = [...G.players.values()]; const live = G.phase === 'fight' || G.phase === 'warmup'; const big = G.gameMode === 'expedition';
  Env.burnT += STEP; if (Env.burnT >= .5) { Env.burnT = 0;
    for (const p of all) { if (!p.alive) continue; const st = p.status || {}; if (st.burn > 0) hostDamage(p, 3, p.lastHitT && t - p.lastHitT < 5 ? p.lastHitBy : null, '_burn', 0, -40, p.x, p.y - 10); if (Env.zone && (p.x < Env.zone.x0 || p.x > Env.zone.x1)) hostDamage(p, 6, p.lastHitT && t - p.lastHitT < 6 ? p.lastHitBy : null, '_zone', Math.sign((Env.zone.x0 + Env.zone.x1) / 2 - p.x) * 200, -120, p.x, p.y - 10); }
    for (const pr of Env.props) { if (!pr.burn || pr.dead) continue; for (const p of all) if (p.alive && Math.abs(p.x - pr.x) < 46 * pr.s && p.y > pr.y - PROP_SIZE[pr.kind][1] * pr.s && p.y < pr.y + 10 && !(p.status && p.status.burn > 0)) HookAPI.status(p.id, { burn: 1.6 }); if (Math.random() < .2) for (const q of Env.props) if (q !== pr && !q.burn && !q.dead && TREES.has(q.kind) && q.kind !== 'cactus' && Math.abs(q.x - pr.x) < 140) { emit({ k: 'pburn', id: q.id }); break; } }
  }
  Env.lavaT += STEP; if (Env.lavaT >= .3) { Env.lavaT = 0; for (const p of all) { if (!p.alive) continue; const wb = waterAt(p.x, p.y + HH - 4); if (wb && wb.lava) { hostDamage(p, 9, p.lastHitT && t - p.lastHitT < 5 ? p.lastHitBy : null, '_lava', 0, -980, p.x, p.y); if (p.alive) HookAPI.status(p.id, { burn: 2 }); } } }
  if (!live) { Env.nextCrate = Math.max(Env.nextCrate, t + 6); return; }
  if (!Env.nextCrate) Env.nextCrate = t + 8;
  if (t > Env.nextCrate) { Env.nextCrate = t + (big ? 6 + Math.random() * 5 : 11 + Math.random() * 7) / Math.max(.2, +T.theme.crateRate || 1); const alive = Env.crates.filter(c => !c.gone).length;
    if (alive < (big ? 6 : 2)) for (let tries = 0; tries < 20; tries++) { let x = 80 + Math.random() * (W - 160); if (Env.zone) x = Env.zone.x0 + 60 + Math.random() * Math.max(10, Env.zone.x1 - Env.zone.x0 - 120); const y = surfaceFromGrid(x); if (y == null || y > H - 40 || waterAt(x, y - 6)) continue; const hp = Math.random() < .3; const w = hp ? null : rollCrateWeapon(); emit({ k: 'crate', id: Env.crateId++, x: Math.round(x), kind: hp || !w ? 'health' : 'weapon', wid: w ? w.id : null }); break; } }
  for (const c of Env.crates) { if (c.gone || !c.landed) continue; for (const p of all) { if (!p.alive || Math.abs(p.x - c.x) > 34 || Math.abs(p.y - (c.y - 18)) > 40) continue; if (c.kind === 'health' && p.hp >= maxHp()) continue; c.gone = true; emit({ k: 'cpick', id: c.id, pid: p.id });
      if (c.kind === 'health') HookAPI.heal(p.id, Math.round(45 * maxHp() / 100)); else { const w = Weapons.byId[c.wid]; if (w) { p.wid = w.id; p.ammo = w.ammo || 0; p.uses = 0; p.hostNext = 0; emit({ k: 'arm', id: p.id, wid: w.id, ammo: w.ammo || 0, cr: 1 }); } } break; } }
  if ((Weather.kind === 'storm' || T.theme.lightning) && G.phase === 'fight') { if (!Env.nextBolt) Env.nextBolt = t + 6; if (t > Env.nextBolt) { Env.nextBolt = t + (5 + Math.random() * 8) / Math.max(.2, +T.theme.lightning || 1); const tgt = all.filter(p => p.alive); let x = tgt.length && Math.random() < .6 ? tgt[Math.random() * tgt.length | 0].x + (Math.random() - .5) * 260 : 60 + Math.random() * (W - 120); x = clamp(x, 40, W - 40); const y = surfaceFromGrid(x) ?? H; emit({ k: 'bolt', x: Math.round(x), y: Math.round(y), d: 1.1 }); } }
  for (const b of Env.bolts) if (!b.hosted && t >= b.at) { b.hosted = true; hostExplode(b.x, b.y - 10, { radius: 85, damage: 44, knockback: 950, crater: 26, selfDamage: 1 }, null, '_bolt'); igniteNear(b.x, b.y, 60); }
};
function updateCrates(dt) {
  for (const c of Env.crates) { if (c.gone) continue; const sup = solidAt(c.x - 10, c.y + 1) || solidAt(c.x + 10, c.y + 1) || solidAt(c.x, c.y + 1); const wb = waterAt(c.x, c.y - 4);
    if (sup) { if (!c.landed) { c.landed = true; FX.dustPuff(c.x, c.y, 8, 1); Audio2.play('land', c.x, .7); } }
    else if (wb && !wb.lava) { c.y = waterSurfaceY(wb, c.x) + 10; c.landed = true; c.bob = (c.bob || 0) + dt; }
    else { c.landed = false; c.y += (c.y < 0 || !c.chute ? 150 : 150) * dt; c.chute = true; if (wb && wb.lava) c.gone = true; if (c.y > H + 60) c.gone = true; } }
  let k = 0; for (const c of Env.crates) if (!c.gone) Env.crates[k++] = c; Env.crates.length = k;
}
function drawCrates(c, t) {
  for (const cr of Env.crates) { const w = cr.wid && Weapons.byId[cr.wid]; const col = cr.kind === 'health' ? '#d9573b' : rarityOf(w).c; const y = cr.y, x = cr.x; c.save(); c.translate(x, y); if (!cr.landed) c.rotate(Math.sin(t * 2 + cr.id) * .12);
    if (!cr.landed) { c.strokeStyle = 'rgba(31,28,36,.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-15, -34); c.lineTo(-30, -88); c.moveTo(15, -34); c.lineTo(30, -88); c.stroke(); c.beginPath(); c.moveTo(-40, -86); c.quadraticCurveTo(0, -140, 40, -86); c.quadraticCurveTo(20, -96, 0, -88); c.quadraticCurveTo(-20, -96, -40, -86); c.fillStyle = '#f3e8d2'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.fillStyle = rgba(col, .6); c.beginPath(); c.moveTo(-14, -90); c.quadraticCurveTo(0, -128, 14, -90); c.fill(); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35 + .2 * Math.sin(t * 4); c.drawImage(softSprite(rgba(col, 1)), -40, -58, 80, 80); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = cr.kind === 'health' ? '#f6efe2' : '#b68650'; c.strokeStyle = INK; c.lineWidth = 2.4; c.fillRect(-17, -34, 34, 34); c.strokeRect(-17, -34, 34, 34); c.fillStyle = col;
    if (cr.kind === 'health') { c.fillRect(-4, -28, 8, 22); c.fillRect(-11, -21, 22, 8); } else { c.fillRect(-17, -22, 34, 9); c.lineWidth = 1.6; c.strokeRect(-17, -22, 34, 9); }
    c.restore(); }
}
/* lightning */
function updateBolts(dt) { const t = now(); for (const b of Env.bolts) { if (!b.struck && t >= b.at) { b.struck = true; b.path = []; let x = b.x + (Math.random() - .5) * 120, y = -200; while (y < b.y) { b.path.push([x, y]); y += 30 + Math.random() * 40; x += (Math.random() - .5) * 50; } b.path.push([b.x, b.y]); Weather.flash = 1; const me = G.players.get(G.myId); G.flash = Math.max(G.flash, .28); setTimeout(() => Audio2.play('thunder', b.x, 1), 60 + Math.random() * 200); } } let k = 0; for (const b of Env.bolts) if (t < b.at + .45) Env.bolts[k++] = b; Env.bolts.length = k; }
function drawBolts(c, t) { const tt = now(); for (const b of Env.bolts) { if (!b.struck) { const k = 1 - (b.at - tt) / 1.1; c.save(); c.globalAlpha = .25 + .5 * k * (Math.sin(tt * 40) > 0 ? 1 : .4); c.strokeStyle = '#fff6c8'; c.lineWidth = 2; c.setLineDash([4, 6]); c.beginPath(); c.arc(b.x, b.y, 70 - k * 30, 0, TAU); c.stroke(); c.restore(); continue; } const k = (tt - b.at) / .45; c.save(); c.globalAlpha = 1 - k; c.lineJoin = 'round'; c.strokeStyle = rgba(INK, .6); c.lineWidth = 9; c.beginPath(); b.path.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.strokeStyle = '#fff6c8'; c.lineWidth = 5; c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.restore(); } }
/* the storm wall (Big Wilds only) */
function updateZone() {
  if (G.gameMode !== 'expedition' || G.phase !== 'fight' || !(G.opts && G.opts.storm)) { Env.zone = null; return; }
  const elapsed = (G.roundLen || 150) - (G.phaseEnd - now()); const k = clamp((elapsed - 35) / 95, 0, 1); const e = k * k * (3 - 2 * k); const cx = W * (.3 + hash(T.seed) * .4); const half = lerp(W * .5 + 260, 380, e);
  Env.zone = { x0: cx - half, x1: cx + half, k };
}
function drawZone(c, view, t) {
  const z = Env.zone; if (!z || z.k <= 0) return; c.save();
  for (const [a, b, edge, dir] of [[view.x0 - 50, z.x0, z.x0, 1], [z.x1, view.x1 + 50, z.x1, -1]]) { if (b <= a) continue; c.fillStyle = 'rgba(70,40,80,.32)'; c.fillRect(a, view.y0 - 50, b - a, view.y1 - view.y0 + 100);
    c.strokeStyle = 'rgba(180,120,255,.85)'; c.lineWidth = 3; c.beginPath(); for (let y = view.y0 - 40; y < view.y1 + 40; y += 24) c.lineTo(edge + Math.sin(y * .03 + t * 3) * 8, y); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
  c.restore();
}

/* ---------- events ---------- */
const _applyEvent = applyEvent;
applyEvent = function (e) {
  const p = e.id ? G.players.get(e.id) : null;
  switch (e.k) {
    case 'shot': if (e.sub) { spawnBullets(e, G.isHost); return; } break;
    case 'ex': if (e.sw) { FX.ring(e.x, e.y, e.r, 'rgba(255,246,228,.95)', 5, .35); FX.dustPuff(e.x, e.y, 16, 2.2); FX.light(e.x, e.y, e.r * 2, '#ffb35c', .2, 1); splash(e.x, e.y, 1.5); const me = G.players.get(G.myId); G.trauma = Math.min(1, G.trauma + (me && Math.hypot(me.x - e.x, me.y - e.y) < 500 ? .6 : .2)); Audio2.play('thump', e.x, 1); } else fxExplosion(e); return;
    case 'zap': Env.zaps.push({ pts: e.pts, c: e.c, t: 0, life: .3 }); for (const q of e.pts) FX.light(q[0], q[1], 120, '#b98cff', .15, 1); Audio2.play('zap', e.pts[0][0], .8, 1.3); return;
    case 'st': if (!p) return; p.status = Object.assign(p.status || {}, e.s); if (e.s.freeze) { FX.ring(p.x, p.y, 40, 'rgba(220,245,255,.95)', 3, .3); Audio2.play('freeze', p.x); } if (e.pop) { FX.ring(p.x, p.y, 44, 'rgba(230,250,255,.9)', 2, .25); Audio2.play('bubble', p.x, .7, 1.8); } if (e.s.bubble) Audio2.play('bubble', p.x, .7, .9); return;
    case 'heal': if (!p) return; p.hp = e.hp; if (e.n) FX.add({ k: 'num', x: p.x, y: p.y - 30, vy: -90, t: 0, life: .8, txt: '+' + e.n, col: '#6f9a4f' }); FX.ring(p.x, p.y, 34, 'rgba(160,220,140,.9)', 2.5, .3); return;
    case 'crate': Env.crates.push({ id: e.id, x: e.x, y: -60, kind: e.kind, wid: e.wid, landed: false }); if (G.mode === 'play' && G.gameMode === 'expedition') UI.hint(e.kind === 'health' ? 'A health drop is falling' : 'A supply drop is falling', 1.6); Audio2.play('whoosh', e.x, .3, .6); return;
    case 'cpick': { const c = Env.crates.find(q => q.id === e.id); if (c) { c.gone = true; FX.ring(c.x, c.y - 18, 46, 'rgba(255,250,236,.95)', 3, .3); FX.sparks(c.x, c.y - 18, -Math.PI / 2, 10, '#fff1d0'); } if (e.pid) Audio2.play('pickup', c ? c.x : W / 2); return; }
    case 'bolt': Env.bolts.push({ x: e.x, y: e.y, at: now() + (e.d || 1), struck: false }); Audio2.play('charge', e.x, .35, .5); return;
  }
  _applyEvent(e);
  switch (e.k) {
    case 'crater': waterAfterCrater(e.x, e.y, e.r); propsAfterCrater(e); break;
    case 'spawn': if (p) { p.status = {}; p.grap = null; p.charging = null; p.spin = 0; p.burstLeft = 0; p.comboN = 0; refillMag(p); } break;
    case 'arm': if (p) { refillMag(p); p.charging = null; p.burstLeft = 0; if (e.cr && p.id === G.myId) { const w = weaponOf(p); UI.reveal(w); } } break;
    case 'die': if (p) { p.status = {}; p.grap = null; const k = e.by && G.players.get(e.by); p.streak = 0; if (k && k !== p) { k.streak = (k.streak || 0) + 1; if (k.id === G.myId && k.streak >= 2) UI.streak(k.streak); } } break;
    case 'round': if (e.ph === 'countdown') { Env.nextCrate = 0; Env.nextBolt = 0; for (const q of G.players.values()) { q.status = {}; q.streak = 0; } } break;
  }
};

/* ---------- audio ---------- */
const _audioInit = Audio2.init.bind(Audio2);
Audio2.init = function () { _audioInit(); if (this.master) this.master.gain.value = .85 * Settings.volume; };
const _play = Audio2.play.bind(Audio2); const lastPlay = {};
Audio2.play = function (kind, x = W / 2, v = 1, pitch = 1) {
  if (!this.ctx || this.muted || G.demo || Settings.volume <= 0) return; const tt = this.ctx.currentTime; const gap = { flame: .08, splash: .05, sizzle: .1, zap: .05, tink: .03, bubble: .05 }[kind]; if (gap) { if (tt - (lastPlay[kind] || 0) < gap) return; lastPlay[kind] = tt; }
  const me = G.players.get(G.myId); if (me && G.gameMode === 'expedition') { const d = Math.hypot(me.x - x, 0); v *= clamp(1.25 - d / 1600, .12, 1); x = W / 2 + clamp((x - me.x) / 1200, -1, 1) * W / 2; }
  const t = tt, P = pitch;
  switch (kind) {
    case 'rocket': this.noise(t, .5, 900 * P, 3000, 1.2, .35 * v, 'bandpass', x); this.tone(t, .25, 120 * P, 60, .5 * v, 'sine', x); break;
    case 'thump': this.tone(t, .35, 110 * P, 38, .9 * v, 'sine', x); this.noise(t, .4, 600, 60, .6, .55 * v, 'lowpass', x); break;
    case 'laser': this.tone(t, .35, 1900 * P, 180, .25 * v, 'sawtooth', x); this.tone(t, .2, 3800 * P, 800, .1 * v, 'square', x); this.noise(t, .25, 5000, 2000, 1, .2 * v, 'highpass', x); break;
    case 'zap': for (let i = 0; i < 3; i++) this.tone(t + i * .025, .05, 900 * P + Math.random() * 1600, 300, .07 * v, 'square', x); this.noise(t, .12, 4000, 1500, 2, .15 * v, 'bandpass', x); break;
    case 'flame': this.noise(t, .18, 700 * P, 300, .5, .12 * v, 'lowpass', x); break;
    case 'whoosh': this.noise(t, .3, 400 * P, 2400 * P, 1.6, .35 * v, 'bandpass', x); break;
    case 'bubble': this.tone(t, .12, 380 * P, 900 * P, .14 * v, 'sine', x); break;
    case 'splash': this.noise(t, .35 + v * .2, 1800, 300, .6, .32 * v, 'lowpass', x); this.noise(t + .03, .2, 5000, 2500, 1, .1 * v, 'highpass', x); break;
    case 'sizzle': this.noise(t, .35, 6000, 3000, .8, .1 * v, 'highpass', x); break;
    case 'thunder': this.noise(t, 2.2, 500, 40, .4, .9 * v, 'lowpass', x); this.noise(t + .15, 1.6, 260, 30, .5, .6 * v, 'lowpass', x); this.tone(t, .6, 60, 30, .5 * v, 'sine', x); break;
    case 'boom': this.noise(t, .9 * v + .3, 1300 * P, 50, .5, .9 * Math.min(1, v + .2), 'lowpass', x); this.tone(t, .5, 90 * P, 30, .9 * v, 'sine', x); this.noise(t + .05, .3, 3000, 600, .8, .2 * v, 'bandpass', x); break;
    case 'pickup': [660, 880, 1320].forEach((f, i) => this.tone(t + i * .06, .18, f, f, .1, 'triangle', x)); break;
    case 'reload': this.tone(t, .04, 1400 * P, 1200, .1 * v, 'square', x); this.tone(t + .12, .05, 900 * P, 800, .1 * v, 'square', x); break;
    case 'charge': this.tone(t, .5, 300 * P, 1600 * P, .08 * v, 'sawtooth', x); break;
    case 'boing': this.tone(t, .3, 220, 660, .22, 'sine', x); this.tone(t + .05, .25, 440, 990, .08, 'triangle', x); break;
    case 'freeze': this.tone(t, .4, 2400, 1200, .1, 'triangle', x); this.noise(t, .3, 7000, 3000, 2, .12, 'highpass', x); break;
    case 'streak': [523, 784, 1046].forEach((f, i) => this.tone(t + i * .05, .25, f, f * 1.02, .09, 'square')); break;
    default: _play(kind, x, v, pitch);
  }
};
shotFx = function (p, e) {
  const w = Weapons.byId[e.wid]; if (!w) return; const v = w.vfx; const mf = v.muzzleFlash ?? 1;
  if (mf > 0) { FX.flash(e.x, e.y, e.a, mf); FX.light(e.x, e.y, 210 * mf, v.light || '#ffb35c', .1, 1.2); }
  if ((v.smoke ?? 1) > 0) FX.smoke(e.x + Math.cos(e.a) * 8, e.y + Math.sin(e.a) * 8, Math.max(1, Math.round(3 * (v.smoke ?? 1) * R8.fxScale)), 11, 'rgba(225,218,208,.55)', Math.cos(e.a) * 90, Math.sin(e.a) * 90 - 20);
  FX.sparks(e.x, e.y, e.a, Math.round(4 * (v.sparks ?? 1) * R8.fxScale), v.tracer); if (v.shells && p) FX.shell(p.x, p.y - 4, p.face);
  if (p) { p.kick = 1; p.aim = e.a; }
  const st = (w.sound && w.sound.type) || 'shot'; Audio2.play(st === 'swing' || st === 'punch' ? 'shot' : st, e.x, w.sound.volume ?? 1, w.sound.pitch ?? 1);
  const me = G.players.get(G.myId); const near = me ? clamp(1 - Math.hypot(me.x - e.x, me.y - e.y) / 900, 0, 1) : .4; G.trauma = Math.min(1, G.trauma + (w.shake || 3) * .045 * (p && p.id === G.myId ? 1 : near));
};

/* ---------- H. camera, rendering, quality ---------- */
const QL = [{ q: 1, fx: 1, grain: 1 }, { q: .85, fx: .78, grain: 1 }, { q: .72, fx: .55, grain: 0 }, { q: .6, fx: .38, grain: 0 }];
let qLevel = 0, qLow = 0, qHigh = 0, qFloor = 0;
function baseQuality() { return Settings.graphics === 'high' ? 0 : Settings.graphics === 'medium' ? 1 : Settings.graphics === 'low' ? 2 : [2, 1, 0][deviceTier]; }
function applyQuality() { const L = QL[qLevel]; R8.quality = L.q; R8.fxScale = L.fx; R8.grainOn = !!L.grain; FX.max = Math.round(160 + 280 * L.fx); resize(); Weather.resize(); }
qLevel = qFloor = baseQuality(); R8.fxScale = QL[qLevel].fx; R8.grainOn = !!QL[qLevel].grain; R8.quality = QL[qLevel].q; FX.max = Math.round(160 + 280 * R8.fxScale);
function adaptQuality(fps) {
  const el = $('#fpsReadout'); if (Settings.fps && G.mode === 'play') { el.classList.remove('hidden'); el.textContent = `${Math.round(fps)} fps · ${['high', 'medium', 'low', 'lowest'][qLevel]} · ${FX.parts.length} fx`; } else el.classList.add('hidden');
  if (Settings.graphics !== 'auto' || G.mode !== 'play' || document.hidden) { qLow = qHigh = 0; return; }
  if (fps < 50) { qHigh = 0; if (++qLow >= 2 && qLevel < QL.length - 1) { qLevel++; qLow = 0; applyQuality(); } }
  else if (fps > 58.5) { qLow = 0; if (++qHigh >= 5 && qLevel > qFloor) { qLevel--; qHigh = 0; applyQuality(); } }
  else qLow = qHigh = 0;
}
const Cam = { x: 800, y: 500, snap: true };
function layoutCamera(dt) {
  const padTop = 58; const fit = Math.min(R8.cw / W, (R8.ch - padTop * .5) / H);
  if (G.gameMode !== 'expedition' || G.mode !== 'play') { R8.scale = fit; R8.ox = (R8.cw - W * fit) / 2; R8.oy = Math.max(padTop * .5, (R8.ch - H * fit) / 2 + padTop * .25); Cam.snap = true; return; }
  const s = Math.max(fit, R8.cw < R8.ch ? Math.min(1.1, Math.max(R8.cw / 1500, R8.ch / 1250)) : Math.min(R8.cw / 1500, R8.ch / 880)); const vw = R8.cw / s, vh = R8.ch / s;
  let tgt = G.players.get(G.myId); if (!tgt || !tgt.alive) { const k = tgt && tgt.lastHitBy && G.players.get(tgt.lastHitBy); tgt = (k && k.alive) ? k : [...G.players.values()].find(p => p.alive) || tgt; }
  let tx = tgt ? tgt.x : W / 2, ty = tgt ? tgt.y - 60 : H / 2;
  if (tgt && tgt.id === G.myId && tgt.aiming) { tx += Math.cos(tgt.aim) * 120; ty += Math.sin(tgt.aim) * 70; } if (tgt) tx += clamp(tgt.vx * .18, -120, 120);
  tx = vw >= W ? W / 2 : clamp(tx, vw / 2, W - vw / 2); ty = vh >= H + 260 ? H / 2 - 100 : clamp(ty, vh / 2 - 260, H - vh / 2 + 30);
  if (Cam.snap) { Cam.x = tx; Cam.y = ty; Cam.snap = false; } else { const k = 1 - Math.exp(-5.5 * dt); Cam.x = lerp(Cam.x, tx, k); Cam.y = lerp(Cam.y, ty, k); }
  R8.scale = s; R8.ox = R8.cw / 2 - Cam.x * s; R8.oy = R8.ch / 2 - Cam.y * s;
}
const View = { x0: 0, y0: 0, x1: 1600, y1: 1000 };
function currentView() { const s = R8.scale || 1; View.x0 = -R8.ox / s; View.y0 = -R8.oy / s; View.x1 = (R8.cw - R8.ox) / s; View.y1 = (R8.ch - R8.oy) / s; return View; }
function visibleWorld(x, y, m = 0) { const v = View; return x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m; }
const _buildOverlay = buildOverlay;
buildOverlay = function () { if (G.gameMode !== 'expedition') return _buildOverlay(); const sun = T.sun; T.sun = null; const c = _buildOverlay(); T.sun = sun; return c; };
let hpVig = null, hpKey = '';
function lowHpVignette() { const key = R8.cw + 'x' + R8.ch; if (hpKey === key) return hpVig; hpKey = key; const c = mkCanvas(R8.cw / 2, R8.ch / 2), x = c.getContext('2d'); const g = x.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * .3, c.width / 2, c.height / 2, Math.max(c.width, c.height) * .62); g.addColorStop(0, 'rgba(160,30,30,0)'); g.addColorStop(1, 'rgba(160,30,30,.7)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); return hpVig = c; }
const _fxUpdate = FX.update.bind(FX);
FX.update = function (dt) {
  for (const p of this.parts) switch (p.k) {
    case 'drop': if (p.bub) { p.y += p.vy * dt; p.x += Math.sin(p.t * 14) * 20 * dt; if (!waterAt(p.x, p.y)) p.t = p.life; break; } p.vy += GRAV * .9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vy > 0 && p.t > .05) { if (solidAt(p.x, p.y)) p.t = p.life; else if (Env.water.length) { const b = waterAt(p.x, p.y); if (b) { p.t = p.life; waterPoke(b, p.x, 14, 0); } } } break;
    case 'leaf': if (p.rest) break; p.vy = Math.min(90, p.vy + 260 * dt); p.vx = p.vx * Math.exp(-1.5 * dt) + Env.wind * .8 * dt; p.x += (p.vx + Math.sin(p.t * 4 + p.rot) * 30) * dt; p.y += p.vy * dt; p.rot += dt * 3; if (solidAt(p.x, p.y + 2)) p.rest = true; break;
    case 'ember': p.vx *= Math.exp(-1.2 * dt); p.vy = p.vy * Math.exp(-1.2 * dt) + (p.g === 1 ? 700 : -30) * dt; p.x += p.vx * dt; p.y += p.vy * dt; break;
  }
  _fxUpdate(dt);
};
const _drawParticles = drawParticles;
drawParticles = function (c, layer) {
  _drawParticles(c, layer); if (layer !== 1) return; const P = FX.parts;
  // drops are batched per colour (one fill per colour instead of one per drop) and stretched along their motion
  const groups = _dropGroups; groups.clear();
  for (const p of P) { if (p.k === 'drop' && visibleWorld(p.x, p.y, 10)) { if (p.bub) { c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(31,28,36,.3)'; c.lineWidth = .8; c.stroke(); continue; } let g = groups.get(p.color); if (!g) groups.set(p.color, g = []); g.push(p); }
    else if (p.k === 'leaf' && visibleWorld(p.x, p.y, 10)) { const k = p.t / p.life; c.globalAlpha = k > .8 ? (1 - k) / .2 : 1; c.fillStyle = p.color; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * .45 * Math.abs(Math.cos(p.rot)) + .8, p.rot, 0, TAU); c.fill(); c.globalAlpha = 1; } }
  for (const [col, g] of groups) { c.fillStyle = col; c.beginPath(); for (const p of g) { const r = p.r * (1 - p.t / p.life * .5), sp = Math.hypot(p.vx || 0, p.vy || 0), st = 1 + Math.min(1.1, sp / 700), a = Math.atan2(p.vy || 0, p.vx || 0); c.moveTo(p.x + Math.cos(a) * r * st, p.y + Math.sin(a) * r * st); c.ellipse(p.x, p.y, r * st, r / Math.sqrt(st), a, 0, TAU); } c.fill(); }
};
const _dropGroups = new Map();
function drawEmbers(c) { const spr = softSprite('rgba(255,150,60,1)'); for (const p of FX.parts) { if (p.k !== 'ember' || !visibleWorld(p.x, p.y, 20)) continue; const k = p.t / p.life; c.globalAlpha = (1 - k) * .9; const r = p.r * (1.6 - k); c.drawImage(spr, p.x - r * 2, p.y - r * 2, r * 4, r * 4); } c.globalAlpha = 1; }
function drawRipples(c) { if (!Env.ripples.length) return; c.strokeStyle = 'rgba(255,255,250,.55)'; c.lineWidth = 1; c.beginPath(); let k = 0; for (const r of Env.ripples) { r.t += R8.rdt || 1 / 60; if (r.t > .5) continue; Env.ripples[k++] = r; if (!visibleWorld(r.x, r.y, 10)) continue; const s = 2 + r.t * 22; c.moveTo(r.x + s, r.y); c.ellipse(r.x, r.y, s, s * .25, 0, 0, TAU); } Env.ripples.length = Math.min(k, 80); c.stroke(); }
function drawLavaGlow(c, t) { for (const b of Env.water) { if (!b.alive || !b.lava) continue; const w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2; c.globalAlpha = .45 + .1 * Math.sin(t * 2); c.drawImage(softSprite('rgba(255,120,40,1)'), cx - w * .8, b.level - w * .45, w * 1.6, w * .9); } c.globalAlpha = 1; }
function drawOffscreenArrows(c) {
  if (G.gameMode !== 'expedition') return; const m = 26; for (const p of G.players.values()) { if (!p.alive || p.id === G.myId) continue; const [sx, sy] = toScreen(p.x, p.y); if (sx > 0 && sx < R8.cw && sy > 0 && sy < R8.ch) continue;
    const cx = clamp(sx, m, R8.cw - m), cy = clamp(sy, 70, R8.ch - m); const a = Math.atan2(sy - cy, sx - cx); c.save(); c.translate(cx, cy); c.rotate(a); c.fillStyle = p.color; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(13, 0); c.lineTo(-8, -9); c.lineTo(-4, 0); c.lineTo(-8, 9); c.closePath(); c.fill(); c.stroke(); c.restore(); }
}
let lastRenderT = 0;
const _render = render;
render = function (t) {
  if (G.mode !== 'play') return _render(t);
  const dt = clamp(t - lastRenderT, 0, .1); lastRenderT = t; R8.rdt = dt; const c = ctx; const d = R8.dpr; c.setTransform(d, 0, 0, d, 0, 0);
  layoutCamera(dt); const V = currentView(); const th = T.theme; const big = G.gameMode === 'expedition';
  const skyKey = th.skyT + '|' + th.skyB + '|' + R8.ch; if (R8.skyKey !== skyKey) { const sk = c.createLinearGradient(0, 0, 0, R8.ch); sk.addColorStop(0, shade(th.skyT, .08)); sk.addColorStop(1, shade(th.skyB, -.12)); R8.skyGrad = sk; R8.skyKey = skyKey; }
  c.fillStyle = R8.skyGrad; c.fillRect(0, 0, R8.cw, R8.ch);
  const tr = Settings.shake ? G.trauma * G.trauma : 0; const shx = vnoise(t * 22, 1) * 14 * tr, shy = vnoise(t * 22, 2) * 14 * tr, rot = vnoise(t * 18, 3) * .012 * tr;
  c.save(); c.translate(R8.ox + W * R8.scale / 2 + shx, R8.oy + H * R8.scale / 2 + shy); c.rotate(rot); c.scale(R8.scale, R8.scale); c.translate(-W / 2, -H / 2);
  if (T.bg) { const b = T.bg; let px = 0, py = 0; if (big) { px = clamp((Cam.x - W / 2) * .42, -b.M + 30, b.M - 30); py = clamp((Cam.y - H / 2) * .3, -b.M + 30, b.M - 30); } c.drawImage(b.c, -b.M + px, -b.M + py, W + b.M * 2, H + b.M * 2); }
  if (Weather.flash > 0) { c.fillStyle = `rgba(240,240,255,${Weather.flash * .35})`; c.fillRect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0); }
  drawClouds(c, t); Weather.drawBack(c, V, t); biomeHook('drawSky', c, V, t);
  drawWaterBack(c, V); biomeHook('drawBack', c, V, t);
  if (T.out) { const Q = T.Q; const x0 = clamp(Math.floor(V.x0) - 2, 0, W), y0 = clamp(Math.floor(V.y0) - 2, 0, H), x1 = clamp(Math.ceil(V.x1) + 2, 0, W), y1 = clamp(Math.ceil(V.y1) + 2, 0, H); if (x1 > x0 && y1 > y0) c.drawImage(T.out, x0 * Q, y0 * Q, (x1 - x0) * Q, (y1 - y0) * Q, x0, y0, x1 - x0, y1 - y0); }
  drawProps(c, V, t); drawCrates(c, t);
  drawParticles(c, 0);
  drawLasers(c); const me = G.players.get(G.myId); if (me) drawAimGuide(c, me);
  const ps = [...G.players.values()]; for (const p of ps) if (p.alive && visibleWorld(p.x, p.y, 140)) drawPlayer(c, p, t);
  drawBullets(c);
  drawWaterFront(c, V, t); drawRipples(c);
  drawParticles(c, 1); biomeHook('drawFront', c, V, t);
  Weather.draw(c, t); drawZone(c, V, t); drawBolts(c, t);
  if (th.dark) { c.globalCompositeOperation = 'multiply'; c.fillStyle = th.night ? `rgba(70,80,130,${th.dark})` : `rgba(90,90,110,${th.dark})`; c.fillRect(V.x0 - 20, V.y0 - 20, V.x1 - V.x0 + 40, V.y1 - V.y0 + 40); c.globalCompositeOperation = 'source-over'; }
  c.save(); c.globalCompositeOperation = 'lighter'; drawPropLights(c, t); drawLavaGlow(c, t); drawEmbers(c); Weather.drawGlow(c, t); biomeHook('drawGlow', c, V, t);
  if (th.dark) for (const p of ps) { if (!p.alive || !visibleWorld(p.x, p.y, 120)) continue; c.globalAlpha = .28; c.drawImage(softSprite(rgba(p.color, 1)), p.x - 90, p.y - 90, 180, 180); } c.globalAlpha = 1; c.restore();
  drawAdditive(c);
  Weather.drawFog(c, t, V);
  c.textAlign = 'center'; c.font = '700 15px "Shantell Sans", sans-serif';
  for (const p of ps) { if (!p.alive || !visibleWorld(p.x, p.y, 80)) continue; const y = p.y - HH - 20; c.lineWidth = 4; c.strokeStyle = 'rgba(236,227,209,.9)'; c.strokeText(p.name, p.x, y); c.fillStyle = p.id === G.myId ? INK : 'rgba(31,28,36,.85)'; c.fillText(p.name, p.x, y);
    const bw = 38; c.fillStyle = 'rgba(31,28,36,.25)'; c.fillRect(p.x - bw / 2, y + 5, bw, 4.5); c.fillStyle = p.hp > maxHp() * .35 ? p.color : '#d9573b'; c.fillRect(p.x - bw / 2, y + 5, bw * clamp(p.hp / maxHp(), 0, 1), 4.5); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(p.x - bw / 2, y + 5, bw, 4.5);
    const w = weaponOf(p); if (magOf(w) && p.reloadEnd > now()) { const k = 1 - (p.reloadEnd - now()) / (p.reloadDur || w.reloadTime || 1.2); c.strokeStyle = '#3f8a86'; c.lineWidth = 3; c.beginPath(); c.arc(p.x + bw / 2 + 9, y + 7, 5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k, 0, 1)); c.stroke(); } }
  c.restore();
  const okey = T.seed + '|' + R8.cw + '|' + R8.ch + '|' + R8.dpr + '|' + G.gameMode; if (R8.overlayKey !== okey || !R8.overlay) { R8.overlayKey = okey; R8.overlay = buildOverlay(); }
  c.drawImage(R8.overlay, 0, 0, R8.cw, R8.ch);
  if (me && me.alive && me.hp < maxHp() * .35) { c.globalAlpha = clamp((maxHp() * .35 - me.hp) / (maxHp() * .35), 0, 1) * (.55 + .2 * Math.sin(t * 6)); c.drawImage(lowHpVignette(), 0, 0, R8.cw, R8.ch); c.globalAlpha = 1; }
  if (G.flash > 0) { c.fillStyle = `rgba(255,250,240,${G.flash})`; c.fillRect(0, 0, R8.cw, R8.ch); }
  drawOffscreenArrows(c);
  if (R8.grainOn) { if (!R8.grain) R8.grain = makeGrain(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .5; c.fillStyle = R8.grain; c.fillRect(0, 0, R8.cw, R8.ch); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
};
function updateEnvironment(dt) {
  Env.time += dt; if (G.mode !== 'play') return;
  updateWater(dt); updateZone(); updateProps(dt); updateCrates(dt); updateBolts(dt); Weather.update(dt, currentView()); biomeHook('update', dt, Env.time);
}

/* ---------- I. UI ---------- */
const NOTES = { arena: 'Classic: tight, destructible arenas. Last scribble standing wins.', expedition: 'The Big Wilds: the classic map, four times bigger, with tiers of platforms, supply drops, the Tool Box and optional teams or War mode.' };
function initExpansionUI() {
  const opts = '<option value="-1">Random</option>' + THEMES.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('');
  for (const id of ['#hostBiome', '#practiceBiome']) { const el = $(id); if (el) el.innerHTML = opts; }
  const pm = $('#practiceMode'), note = $('#modeNote'); const upd = () => { note.textContent = NOTES[pm.value] || ''; }; pm.addEventListener('change', upd); upd();
  const prefs = (() => { try { return JSON.parse(getCookie('ib_practice') || '{}'); } catch (e) { return {}; } })(); for (const k of ['Mode', 'Biome', 'Bots', 'Target']) if (prefs[k] != null && $('#practice' + k)) $('#practice' + k).value = prefs[k]; upd();
  $('#bPlayPractice').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); const v = k => $('#practice' + k).value; setCookie('ib_practice', JSON.stringify({ Mode: v('Mode'), Biome: v('Biome'), Bots: v('Bots'), Target: v('Target') })); startHost({ offline: true, name: 'Practice', max: 8, target: +v('Target'), bots: +v('Bots'), gameMode: v('Mode'), biome: +v('Biome') }); });
  const gs = $('#graphicsSetting'), ws = $('#weatherSetting'), ss = $('#shakeSetting'), vs = $('#volumeSetting'), fs = $('#fpsSetting');
  gs.value = Settings.graphics; ws.checked = Settings.weather; ss.checked = Settings.shake; vs.value = Math.round(Settings.volume * 100); fs.checked = Settings.fps;
  gs.addEventListener('change', () => { Settings.graphics = gs.value; qLevel = qFloor = baseQuality(); applyQuality(); saveSettings(); });
  ws.addEventListener('change', () => { Settings.weather = ws.checked; Weather.resize(); saveSettings(); });
  ss.addEventListener('change', () => { Settings.shake = ss.checked; saveSettings(); });
  vs.addEventListener('input', () => { Settings.volume = vs.value / 100; if (Audio2.master) Audio2.master.gain.value = .85 * Settings.volume; saveSettings(); });
  fs.addEventListener('change', () => { Settings.fps = fs.checked; saveSettings(); });
  let back = 'title'; $('#bSettings').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); back = 'title'; UI.show('settings'); });
  $('#bPauseSettings').addEventListener('click', () => { Audio2.play('ui'); back = 'pause'; UI.show('settings'); });
  $('#bSettingsBack').addEventListener('click', () => { Audio2.play('ui'); if (back === 'pause' && G.mode === 'play') { UI.renderPause(); UI.show('pause'); } else UI.show('title'); });
  addEventListener('keydown', e => { if (e.code === 'KeyR' && !e.repeat && G.mode === 'play' && Input.enabled && !(e.target && e.target.tagName === 'INPUT')) { const me = G.players.get(G.myId); if (me && me.alive) beginReload(me); } });
  $('#wcard').addEventListener('click', () => { const me = G.players.get(G.myId); if (me && me.alive && magOf(weaponOf(me))) beginReload(me); });
  const _stop = stopSession; stopSession = function (k) { const r = _stop(k); R8.menuDirty = true; Env.water = []; Env.props = []; Env.crates = []; Env.zone = null; Weather.parts.length = 0; setTimeout(() => { R8.menuDirty = true; }, 30); return r; };
  const _startMenu = startMenu; startMenu = function () { _startMenu(); R8.menuDirty = true; };
}
const _hudWeapon = UI.hudWeapon.bind(UI);
UI.hudWeapon = function (force) {
  const me = G.players.get(G.myId); _hudWeapon(force); if (!me) return; const w = weaponOf(me); const r = rarityOf(w); const card = $('#wcard');
  const rk = w.id + r.n; if (force || this._rk !== rk) { this._rk = rk; card.style.setProperty('--rarity', r.c); card.classList.toggle('rar-mythic', w.rarity === 'mythic'); $('#wcRarity').textContent = w.id === '_fists' ? 'bare hands' : r.n + (w.type === 'melee' ? ' melee' : ''); }
  if (magOf(w)) { const k = `${w.id}:${me.mag}:${me.ammo}`; if (force || this._mk !== k) { this._mk = k; const tot = w.ammo > 0 ? ` <small style="color:var(--ink-soft)">/ ${Math.max(0, me.ammo - (me.mag | 0))}</small>` : ''; $('#wcPips').innerHTML = `<span class="pip-count">${me.mag ?? magOf(w)}</span>${tot}`; } }
  const rl = me.reloadEnd > now() ? 1 - (me.reloadEnd - now()) / (me.reloadDur || w.reloadTime || 1.2) : (me.charging ? me.charging.t / me.charging.dur : (w.spinUp ? me.spin || 0 : 0)); $('#reloadBar').style.width = Math.round(clamp(rl, 0, 1) * 100) + '%';
  const st = me.status || {}; const parts = []; if (me.reloadEnd > now()) parts.push('reloading'); if (me.charging) parts.push('charging'); if (st.burn > 0) parts.push('burning'); if (st.freeze > 0) parts.push('frozen'); else if (st.chill > 0) parts.push('chilled'); if (st.shock > 0) parts.push('shocked'); if (st.bubble > 0) parts.push('bubbled'); if (me.wasWet) parts.push('swimming');
  const s = parts.join(' · '); const el = $('#statusText'); if (el.textContent !== s) el.textContent = s;
};
const _reveal = UI.reveal.bind(UI);
UI.reveal = function (w) { _reveal(w); if (G.demo) return; const r = rarityOf(w); const rc = $('#reveal .rc'); if (!rc) return; rc.style.setProperty('--rarity', r.c); rc.classList.toggle('rar-mythic', w.rarity === 'mythic'); rc.insertAdjacentHTML('afterbegin', `<div class="rarity-label">${w.id === '_fists' ? 'bare hands' : r.n}</div>`); if (w.description) rc.insertAdjacentHTML('beforeend', `<small>${esc(w.description)}</small>`); };
const _renderWeapons = UI.renderWeapons.bind(UI);
UI.renderWeapons = function () { _renderWeapons(); const items = Weapons.list.length ? Weapons.list : [FISTS]; const els = document.querySelectorAll('#wlist .witem'); els.forEach((el, i) => { const w = items[i]; if (!w) return; const r = rarityOf(w); el.style.setProperty('--rarity', r.c); el.classList.toggle('rar-mythic', w.rarity === 'mythic'); const tag = el.querySelector('.tag'); if (tag) tag.textContent = r.n + ' ' + w.type; if (w.description) el.insertAdjacentHTML('beforeend', `<small class="desc">${esc(w.description)}</small>`); }); };
UI.streak = function (n) { const names = ['', '', 'Double splat', 'Triple splat', 'Rampage', 'Unstoppable', 'Ink legend']; this.banner(names[Math.min(n, 6)], n + ' in a row', 1.1); Audio2.play('streak'); };
const _killfeed = UI.killfeed.bind(UI);
UI.killfeed = function (e) {
  const lbl = { _bolt: 'struck by lightning', _zone: 'caught in the storm', _lava: 'melted', _burn: 'burnt to a crisp', _barrel: 'barrel blast' }[e.wid];
  if (!lbl) return _killfeed(e); if (G.demo || G.mode !== 'play') return; const v = G.players.get(e.id), k = e.by && G.players.get(e.by); if (!v) return;
  const el = document.createElement('div'); el.className = 'kf'; el.innerHTML = (k && k !== v ? `<span class="c" style="background:${k.color}"></span>${esc(k.name)} ` : '') + `<svg class="ico" style="width:16px;height:16px"><use href="#i-skull"/></svg> ${lbl} <span class="c" style="background:${v.color}"></span>${esc(v.name)}`;
  $('#killfeed').prepend(el); const all = $('#killfeed').children; while (all.length > 5) all[all.length - 1].remove(); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4200);
  if (v.id === G.myId) this.hint(G.phase === 'warmup' ? 'Splat. Respawning…' : 'Splat. Back next round.', 2.2);
};
const _tickHud = UI.tickHud.bind(UI);
UI.tickHud = function () {
  _tickHud(); if (G.mode !== 'play') return;
  const chip = $('#roundChip'); let txt = T.theme.name; if (G.phase === 'fight') { const left = Math.max(0, G.phaseEnd - now()); txt += left > 0 ? ` · ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}` : ' · sudden death'; if (Env.zone && Env.zone.k > 0) txt += ' · storm closing'; } else if (G.phase === 'warmup') txt += ' · warm-up'; if (chip.textContent !== txt) chip.textContent = txt;
  const mm = $('#miniMap'); const show = G.gameMode === 'expedition'; mm.classList.toggle('hidden', !show); document.body.classList.toggle('gm-exp', show); if (!show || !Env.mini) return;
  const x = mm.getContext('2d'); const w = mm.width, h = mm.height; x.clearRect(0, 0, w, h); const sh = w * H / W, oy = (h - sh) / 2; x.drawImage(Env.mini, 0, oy, w, sh); const sx = w / W, sy = sh / H;
  if (Env.zone && Env.zone.k > 0) { x.fillStyle = 'rgba(90,40,110,.45)'; x.fillRect(0, oy, Math.max(0, Env.zone.x0 * sx), sh); x.fillRect(Env.zone.x1 * sx, oy, w, sh); }
  for (const c of Env.crates) { x.fillStyle = '#e9a23b'; x.fillRect(c.x * sx - 3, oy + Math.max(0, c.y) * sy - 3, 6, 6); }
  x.strokeStyle = 'rgba(31,28,36,.7)'; x.lineWidth = 2; const V = View; x.strokeRect(V.x0 * sx, oy + V.y0 * sy, (V.x1 - V.x0) * sx, (V.y1 - V.y0) * sy);
  for (const p of G.players.values()) { if (!p.alive) continue; x.fillStyle = p.color; x.beginPath(); x.arc(p.x * sx, oy + p.y * sy, p.id === G.myId ? 6 : 4.5, 0, TAU); x.fill(); x.strokeStyle = INK; x.lineWidth = p.id === G.myId ? 2.5 : 1.5; x.stroke(); }
};
