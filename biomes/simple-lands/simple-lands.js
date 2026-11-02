/* Biome: The Simple Lands
   One biome per folder. The game finds this folder by itself; nothing else needs editing.
   A contour-map meadow: stepped mesas, gorge viaducts, orchards, flowers and
   hand-drawn village details. Every field is explained in the README. */
// ---------------------------------------------------------------------------
// Terrain generator for this biome. The engine calls terrain(ctx) below; these
// helpers are private to this file. (They used to live in expansion.js.)
// ---------------------------------------------------------------------------
/* The Simple Lands: a contour-map landscape built from stacked terraces.
   Each mesa has one to three inset shelves, so its silhouette climbs in
   broad hand-drawn steps. Gorges split the mesas, stone viaducts bridge
   them, and ziggurat spires + floating stones add alternative routes.
   Used by this biome's terrain() hook below. */
function terraceTop(x0, x1, top, seed, idx) {
  const n = Math.max(5, Math.round((x1 - x0) / 26)), pts = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, px = lerp(x0, x1, t);
    const lip = (1 - Math.min(1, Math.min(t, 1 - t) * 8)) * 6;
    pts.push([px, top + (fbm(px * .018, seed + idx * 19) - .5) * 9 + lip]);
  }
  return pts;
}
function terraceBlock(mc, x0, x1, top, seed, idx, bottom = H + 140) {
  const pts = [[x0 - 5, bottom], [x0 + 1, top + 30], [x0 - 1, top + 12]];
  for (const p of terraceTop(x0, x1, top, seed, idx)) pts.push(p);
  pts.push([x1 + 1, top + 12], [x1 - 1, top + 30], [x1 + 5, bottom]);
  fillShape(mc, pts);
}
function terraceLand(R, mc, seed, base) {
  const scale = W / 1600, count = 5 + (R() * 4 | 0), slot = (W + 160) / count;
  const gaps = []; const bigGap = R() < .72 ? (R() * Math.max(1, count - 1) | 0) : -1;
  let gapTotal = 0;
  for (let i = 0; i < count - 1; i++) { const g = (i === bigGap ? 235 + R() * 105 : 46 + R() * 92) * scale; gaps.push(g); gapTotal += g; }
  const raw = []; let rawTotal = 0;
  for (let i = 0; i < count; i++) { const w = slot * (.66 + R() * .38); raw.push(w); rawTotal += w; }
  const fit = (W + 160 - gapTotal) / rawTotal;
  let x = -80, top = base - 70 - R() * 60;
  const parts = [];
  for (let i = 0; i < count; i++) {
    if (i) x += gaps[i - 1];
    const w = i === count - 1 ? W + 80 - x : raw[i] * fit;
    if (i) top = clamp(top + (R() - .5) * (R() < .18 ? 250 : 170), base - 225, base + 20);
    const part = { x0: x, x1: x + w, top };
    const layers = [{ x0: part.x0, x1: part.x1, top }];
    terraceBlock(mc, part.x0, part.x1, top, seed, i * 7 + 1);
    let cx0 = part.x0, cx1 = part.x1, cy = top;
    const tiers = 1 + (R() < .72 ? 1 : 0) + (R() < .32 ? 1 : 0);
    for (let k = 0; k < tiers; k++) {
      const narrow = Math.min(96, (cx1 - cx0) * .22);
      const li = 34 + R() * Math.max(8, narrow - 24), ri = 34 + R() * Math.max(8, narrow - 24);
      if (cx1 - cx0 - li - ri < 118) break;
      const rise = 58 + R() * 34, nt = Math.max(base - 382, cy - rise);
      if (cy - nt < 30) break;
      cx0 += li; cx1 -= ri; cy = nt;
      terraceBlock(mc, cx0, cx1, cy, seed, i * 7 + k * 3 + 3);
      layers.push({ x0: cx0, x1: cx1, top: cy });
    }
    part.layers = layers; parts.push(part);
    x += w;
  }
  // buttress steps jutting into the gorges make the cliff walls read as terraces too
  for (let i = 1; i < parts.length; i++) {
    const a = parts[i - 1], b = parts[i];
    if (b.x0 - a.x1 < 46 || R() > .55) continue;
    const w = 28 + R() * 24;
    if (R() < .5) terraceBlock(mc, b.x0 - w, b.x0 + 4, b.top + 55 + R() * 20, seed, 900 + i);
    else terraceBlock(mc, a.x1 - 4, a.x1 + w, a.top + 55 + R() * 20, seed, 920 + i);
  }
  return parts;
}
function stoneBridge(R, mc, x0, x1, y0, y1) {
  const gap = x1 - x0, l = x0 - 34, r = x1 + 34, n = Math.max(6, Math.round((r - l) / 22));
  const hump = Math.min(17, gap * .07), top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, px = lerp(l, r, t), yy = lerp(y0, y1, t);
    top.push([px, yy + 4 - Math.sin(t * Math.PI) * hump]);
    bot.push([px, yy + 31 - Math.sin(t * Math.PI) * (hump + 4)]);
  }
  bot.reverse(); fillShape(mc, top.concat(bot));
  const piers = gap > 210 ? [.32, .68] : [.5];
  for (const t of piers) {
    const px = lerp(x0, x1, t), py = lerp(y0, y1, t) + 27, w = 9 + R() * 4;
    fillShape(mc, [[px - w, py - 4], [px - w * 1.65, H + 140], [px + w * 1.65, H + 140], [px + w, py - 4]]);
  }
  for (const [px, py, dir] of [[l + 4, y0, -1], [r - 4, y1, 1]]) {
    fillShape(mc, [[px, py + 6], [px + dir * (18 + R() * 7), py + 15], [px + dir * (13 + R() * 6), py + 30], [px, py + 32]]);
  }
}
function stoneSpire(R, mc, cx, baseY, h, w, seed) {
  const tiers = 3 + (R() < .4 ? 1 : 0);
  let y = baseY, ww = w, lean = (R() - .5) * 6;
  for (let i = 0; i < tiers; i++) {
    const bh = h / tiers * (.82 + R() * .3), top = Math.max(120, y - bh);
    const cxx = cx + lean * (i / tiers), w2 = Math.max(16, ww * (.78 + R() * .12));
    terraceBlock(mc, cxx - w2 / 2, cxx + w2 / 2, top, seed, 700 + i * 5);
    y = top; ww = w2;
  }
}
function steppingStone(R, mc, x, y, w, seed) {
  const th = 30 + R() * 24, pts = [];
  for (const p of terraceTop(x, x + w, y, seed, 600)) pts.push(p);
  pts.push([x + w + 7, y + th * .38], [x + w - 12, y + th * .9], [x + w * .62, y + th], [x + w * .28, y + th * .9], [x + 10, y + th * .76], [x - 7, y + th * .34]);
  fillShape(mc, pts);
}
function simpleLand(R, mc, seed, base, big) {
  const parts = terraceLand(R, mc, seed, base);
  for (let i = 1; i < parts.length; i++) {
    const a = parts[i - 1], b = parts[i];
    if (b.x0 - a.x1 > 32) stoneBridge(R, mc, a.x1, b.x0, a.top, b.top);
  }
  const ledges = [];
  for (const p of parts) for (const l of p.layers) if (l.x1 - l.x0 > 120) ledges.push(l);
  const used = [], nSpire = (big ? 3 : 2) + (R() < .5 ? 1 : 0) + (R() < .28 ? 1 : 0);
  for (let i = 0; i < nSpire; i++) {
    const L = ledges[(R() * ledges.length) | 0]; if (!L) break;
    const w = 42 + R() * 28, h = 110 + R() * 85;
    if (L.x1 - L.x0 < w * 2.8) continue;
    const cx = L.x0 + w * 1.5 + R() * (L.x1 - L.x0 - w * 3);
    if (used.some(u => Math.abs(u.x - cx) < 175 && Math.abs(u.y - L.top) < 90)) continue;
    used.push({ x: cx, y: L.top });
    stoneSpire(R, mc, cx, L.top, h, w, seed + i * 29);
  }
  const sets = (big ? 2 : 1) + (R() < .7 ? 1 : 0) + (R() < .35 ? 1 : 0);
  for (let s = 0; s < sets; s++) {
    const p = parts[1 + ((R() * Math.max(1, parts.length - 2)) | 0)] || parts[0];
    const dir = p.x0 + (p.x1 - p.x0) * .5 < W * .5 ? 1 : -1, n = 3 + (R() * 3 | 0);
    let x = clamp(p.x0 + (p.x1 - p.x0) * (.3 + R() * .4), 60, W - 180);
    let y = p.top - 65 - R() * 60;
    for (let i = 0; i < n; i++) {
      const w = 54 + R() * 44;
      x = clamp(x + dir * (88 + R() * 34) * (W / 1600), 30, W - 40 - w);
      y = clamp(y - Math.sin((i + .5) / n * Math.PI) * 34 + (R() - .5) * 16, 170, base - 55);
      steppingStone(R, mc, x, y, w, seed + s * 41 + i * 7);
    }
  }
  return parts;
}

Biome({
  order: 320, // position in the menu list (lower comes first)
  name: "The Simple Lands",  // shown in menus
  style: "stepped",  // stacked terraces, gorges, viaducts and floating stones (see README)

  // ----- scripting hooks (see README, "Biome scripting") -----
  // the land: terraces, gorges, bridges, spires and floating stones
  terrain(ctx) { simpleLand(ctx.R, ctx.mc, ctx.seed, H - 300, ctx.big); },
  // contour lines across the rock and tiny wildflowers on every ledge
  texture(ctx) {
    const { c, R } = ctx;

    c.lineWidth = 1.2;
    for (let y = H * .38; y < H; y += 34 + R() * 24) {
      c.strokeStyle = `rgba(31,28,36,${(.03 + R() * .035).toFixed(3)})`; c.beginPath(); c.moveTo(0, y);
      for (let x = 0; x <= W; x += 48) c.lineTo(x, y + Math.sin(x * .007 + y) * 5 + (fbm(x * .005, y) - .5) * 8);
      c.stroke();
    }
    const cols = ['#fff8df', '#f3b6c4', '#f2c230', '#c7dd8a'];
    for (let x = 42; x < W - 42; x += 54 + R() * 64) {
      const gx = clamp(x / CELL | 0, 0, GW - 1); let gy = 0;
      while (gy < GH && !T.grid[gy * GW + gx]) gy++;
      if (gy < 2 || gy > GH - 3) continue;
      const sy = gy * CELL; if (sy < H * .24) continue;
      c.strokeStyle = 'rgba(74,98,52,.5)'; c.lineWidth = .9;
      c.beginPath(); c.moveTo(x - 2, sy + 8); c.lineTo(x - 3, sy + 2); c.moveTo(x + 2, sy + 8); c.lineTo(x + 4, sy + 3); c.stroke();
      c.fillStyle = cols[(R() * cols.length) | 0];
      for (let k = 0; k < 2 + (R() * 3 | 0); k++) { c.beginPath(); c.arc(x + (R() - .5) * 26, sy + 3 + R() * 9, .8 + R() * 1.5, 0, TAU); c.fill(); }
    }
  },
  // the round orchard silhouettes on the far hills
  treeLine(ctx) {
    const { x, R, th, M, col, edge, gyAt } = ctx;
    for (let px = -M; px < W + M;) {
      const gy = gyAt(px), h = 30 + R() * 50; x.fillStyle = col; x.strokeStyle = edge; x.lineWidth = 1.6; x.beginPath();
      const hh = 34 + R() * 48, lean = (R() - .5) * 8;
      x.strokeStyle = col; x.lineWidth = 3.2; x.beginPath(); x.moveTo(px, gy); x.quadraticCurveTo(px + lean * .4, gy - hh * .4, px + lean, gy - hh * .62); x.stroke();
      x.fillStyle = mix(th.cap || '#7fae58', th.far[1], .38); x.strokeStyle = edge; x.lineWidth = 1.4;
      x.beginPath(); x.ellipse(px + lean, gy - hh * .72, hh * .29, hh * .33, 0, 0, TAU); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(px + lean - hh * .17, gy - hh * .62, hh * .18, hh * .22, 0, 0, TAU); x.fill(); x.stroke();
      px += 38 + R() * 42;
    }
  },
  weather: "petals",  // gentle petals drifting over the terraces
  wind: 12,  // pushes particles and bullets a little
  skyT: "#96c9e6",  // sky colour at the top
  skyB: "#f7eac8",  // sky colour at the horizon
  sun: "#fff8dc",  // sun / moon colour
  far: ["#b5d0a2", "#8daf84"],  // distant hills, back to front
  top: "#7cae54",  // grass / topsoil
  mid: "#77563a",  // dirt
  deep: "#3c2d26",  // deep rock
  cap: "#c8e284",  // edge highlight
  props: [
    ["simpletree", 0.82], ["daisy", 0.5], ["clover", 0.38], ["cairn", 0.28],
    ["signpost", 0.15], ["bench", 0.13], ["beehive", 0.15], ["picnic", 0.15],
    ["flowercart", 0.12], ["well", 0.09], ["windmill", 0.07], ["birdhouse", 0.14],
    ["rock", 0.3], ["bush", 0.2], ["lantern", 0.06], ["crate", 0.04],
  ],
  under: [["clover", 0.9], ["daisy", 0.55], ["tallgrass", 0.5], ["flowers", 0.35]],
  bgTrees: "orchard",  // round orchard silhouettes behind the map
  cloud: "#fffaf0",
  grass: 1.15,
  grassCol: ["#79a548", "#c0dc7c"],
  leaf: ["#fff6d8", "#f7d97e", "#f3b6c4"],
  critters: 8,  // little animals that wander around
  treeDensity: 1.0,  // how many trees
  plantDensity: 1.6,  // how many small plants
  thingDensity: 2.4,  // room for the village landmarks as well as rocks
  newProps: {
    // A broad orchard tree with layered leaf clusters and tiny fruit. No swing.
    simpletree: { w: 176, h: 200, tree: 1, mat: 'wood', leafy: 1, hp: 120, art(sp, d) {
      const { R, th, cx, h } = d;
      const wood = mix('#7b573d', th.deep, .16), lean = (R() - .5) * 7;
      inkPiece(sp, { fill: wood, light: lit(wood, .22), rim: 3, shape: x => {
        taperTrunk(x, cx, h, h * .32, 15, 8, lean, 1.35);
        branch(x, cx + lean * .6, h * .58, cx - 50, h * .35, 8, 2.8, 10);
        branch(x, cx + lean * .8, h * .48, cx + 46, h * .28, 7, 2.5, -9);
        branch(x, cx + lean, h * .41, cx - 10, h * .19, 5.5, 1.8, 5);
        for (const [sx, ex] of [[-1, -38], [1, 36]]) {
          x.beginPath(); x.moveTo(cx + sx * 10, h - 34);
          x.quadraticCurveTo(cx + sx * 27, h - 14, cx + sx * (ex + 4), h);
          x.lineTo(cx + sx * (ex - 8), h);
          x.quadraticCurveTo(cx + sx * 19, h - 11, cx + sx * 3, h - 18);
          x.closePath(); x.fill();
        }
      }, detail: x => {
        marks(x, R, 9, cx - 8, h * .5, cx + 5, h - 14, rgbaC(INK, .34), 1.1, 9, '|');
        x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1.2;
        x.beginPath(); x.arc(cx + 4, h * .72, 4, .2, 4.6); x.stroke();
        x.beginPath(); x.moveTo(cx - 10, h * .9); x.quadraticCurveTo(cx + 2, h * .94, cx + 12, h * .88); x.stroke();
      } });
      const clumps = [[cx - 56, 82, 30], [cx - 34, 58, 28], [cx - 2, 52, 34], [cx + 30, 62, 32], [cx + 58, 78, 26], [cx + 12, 82, 28], [cx - 16, 102, 24]];
      inkPiece(sp, { fill: '#416635', light: '#6f9553', dark: '#314c29', rim: 6, line: 2.1, box: [cx - 84, 14, cx + 84, 132], shape: x => {
        for (const [px, py, r] of clumps) lobed(x, px, py, r, r * .84, 6, R, .24, R() * TAU);
      }, detail: x => { marks(x, R, 15, cx - 68, 22, cx + 68, 124, rgbaC(INK, .3), 1.2, 7, 'c'); } });
      const front = [[cx - 44, 68, 21], [cx - 18, 48, 24], [cx + 14, 44, 27], [cx + 42, 62, 22], [cx + 4, 78, 23], [cx - 28, 88, 19], [cx + 34, 90, 18]];
      inkPiece(sp, { fill: '#79ad4f', light: '#c9e98b', dark: '#4f7938', rim: 4.5, line: 1.8, box: [cx - 78, 14, cx + 78, 122], shape: x => {
        for (const [px, py, r] of front) lobed(x, px, py, r, r * .85, 6, R, .2, R() * TAU);
        lobed(x, cx - 54, 108, 11, 8, 5, R, .3);
        lobed(x, cx + 50, 112, 10, 7, 5, R, .3);
      }, detail: x => {
        marks(x, R, 20, cx - 58, 24, cx + 58, 116, rgbaC(INK, .28), 1.2, 8, 'c');
        dots(x, R, 14, cx - 44, 28, cx + 46, 96, '#fff4d0', 1.2, 2.5);
        dots(x, R, 7, cx - 32, 34, cx + 28, 70, '#f2c230', 1.8, 2.8);
        for (let i = 0; i < 5; i++) { const px = cx - 42 + R() * 88, py = 28 + R() * 66; x.strokeStyle = rgbaC('#dff0a4', .7); x.lineWidth = 1.3; x.beginPath(); x.arc(px, py, 4, .4, 2.2); x.stroke(); }
      } });
    } },

    // A big friendly daisy with a second bud, layered petals and veined leaves.
    daisy: { w: 62, h: 70, small: 1, mat: 'leaf', leafy: 1, hp: 10, art(sp, d) {
      const { R, cx, h } = d; const top = h * .31, budY = h * .5;
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 2, hatch: false, shape: x => {
        const stem = (bx, tx, ty) => { x.lineWidth = 2.6; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + (tx - bx) * .25, (h + ty) * .5, tx, ty); x.stroke(); };
        stem(cx, cx - 2, top + 7); stem(cx + 4, cx + 12, budY + 3);
        const leaf = (lx, ly, L, a) => { x.save(); x.translate(lx, ly); x.rotate(a); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(L * .55, -L * .4, L, 0); x.quadraticCurveTo(L * .55, L * .4, 0, 0); x.fill(); x.restore(); };
        leaf(cx, h - 5, 17, -.28); leaf(cx + 1, h - 12, 20, .18); leaf(cx + 3, h - 22, 14, -.3);
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .35); x.lineWidth = .9;
        for (const [x0, y0, x1, y1] of [[cx, h, cx - 2, top + 8], [cx + 4, h, cx + 12, budY + 4], [cx + 3, h - 15, cx + 15, h - 22], [cx - 1, h - 8, cx - 12, h - 17]]) { x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); }
      } });
      inkPiece(sp, { fill: '#f6e8c6', light: '#fffdf2', rim: 2, line: 1.5, hatch: false, shape: x => { x.beginPath(); x.ellipse(cx + 13, budY, 4.5, 7, -.25, 0, TAU); x.fill(); } });
      inkPiece(sp, { fill: '#f2e4c1', light: '#fff6dc', rim: 2.2, line: 1.6, shape: x => {
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .1; x.beginPath(); x.ellipse(cx + Math.cos(a) * 9.5, top + Math.sin(a) * 9.5, 7.5, 3.5, a, 0, TAU); x.fill(); }
      } });
      inkPiece(sp, { fill: '#fffdf2', light: '#ffffff', rim: 2.2, line: 1.6, hatch: false, shape: x => {
        for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + .28; x.beginPath(); x.ellipse(cx + Math.cos(a) * 7, top + Math.sin(a) * 7, 6, 3, a, 0, TAU); x.fill(); }
      }, detail: x => { marks(x, R, 5, cx - 8, top - 6, cx + 8, top + 8, rgbaC(INK, .18), .8, 3, '-'); } });
      inkPiece(sp, { fill: '#e9b52a', light: '#ffe27a', rim: 2, line: 1.5, shape: x => { x.beginPath(); x.arc(cx, top, 6, 0, TAU); x.fill(); }, detail: x => { dots(x, R, 8, cx - 3, top - 3, cx + 3, top + 3, rgbaC('#8a5e18', .8), .7, 1.3); } });
    } },

    // Low four-leaf clover tufts with tiny white flower heads.
    clover: { w: 74, h: 44, small: 1, mat: 'leaf', leafy: 1, hp: 10, art(sp, d) {
      const { R, cx, h } = d; const stems = [];
      for (let i = 0; i < 5; i++) { const bx = cx + (i - 2) * 12 + (R() - .5) * 5, tx = bx + (R() - .5) * 11, ty = 15 + R() * 9; stems.push([bx, tx, ty]); }
      inkPiece(sp, { fill: '#7aad4d', light: '#bde07f', rim: 2.2, line: 1.5, hatch: false, shape: x => {
        const leaflet = (px, py, r, a, n) => {
          x.save(); x.translate(px, py); x.rotate(a);
          for (let k = 0; k < n; k++) { x.save(); x.rotate(k / n * TAU); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-r * .95, -r * .55, -r * .75, -r * 1.55, 0, -r * 1.2); x.bezierCurveTo(r * .75, -r * 1.55, r * .95, -r * .55, 0, 0); x.fill(); x.restore(); }
          x.restore();
        };
        for (let i = 0; i < stems.length; i++) { const [bx, tx, ty] = stems[i]; x.lineWidth = 2.2; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + (tx - bx) * .4, h * .45, tx, ty); x.stroke(); leaflet(tx, ty, 6.4, (R() - .5) * 1.1, i === 2 ? 4 : 3); }
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1;
        for (const [bx, tx, ty] of stems) { x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx, ty - 8); x.stroke(); }
      } });
      inkPiece(sp, { fill: '#fff9e8', light: '#ffffff', rim: 1.7, line: 1.3, hatch: false, shape: x => {
        for (const i of [1, 3]) { const [bx, tx, ty] = stems[i]; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(tx + Math.cos(a) * 3.6, ty - 8 + Math.sin(a) * 3.6, 3.2, 1.9, a, 0, TAU); x.fill(); } }
      }, detail: x => { for (const i of [1, 3]) { const [bx, tx, ty] = stems[i]; x.fillStyle = '#e9b52a'; x.beginPath(); x.arc(tx, ty - 8, 1.5, 0, TAU); x.fill(); } } });
    } },

    // A friendly stack of chunky stones, mossy shoulders and a flower sprig on top.
    cairn: { w: 64, h: 76, mat: 'stone', hp: 130, noBurn: 1, art(sp, d) {
      const { R, th, cx, h } = d; const col = mix('#b7b1a2', th.mid, .18), stones = [];
      let y = h - 6;
      for (let i = 0; i < 4; i++) {
        const rw = 27 - i * 4.6 + R() * 2, rh = 11.5 - i * 1.6 + R() * .6, px = cx + (R() - .5) * 4;
        const pts = [[px - rw, y], [px - rw * .52, y - rh * .85], [px + rw * .25, y - rh], [px + rw * .92, y - rh * .6], [px + rw * 1.02, y + rh * .1], [px + rw * .55, y + rh * .62], [px - rw * .5, y + rh * .55], [px - rw * 1.04, y + rh * .15]];
        stones.push({ cy: y - rh, rw });
        inkPiece(sp, { fill: col, light: lit(col, .25), dark: lit(col, -.22), rim: 2.8, shape: x => { wobblyPoly(x, pts); x.fill(); }, detail: x => {
          x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1.1; x.beginPath(); x.moveTo(px - rw * .6, y - rh * .35); x.quadraticCurveTo(px, y - rh * .1, px + rw * .6, y - rh * .45); x.stroke();
          x.strokeStyle = rgbaC(lit(col, .45), .8); x.lineWidth = 1; x.beginPath(); x.moveTo(px - rw * .45, y - rh * .62); x.quadraticCurveTo(px, y - rh * .8, px + rw * .3, y - rh * .62); x.stroke();
        } });
        y -= rh;
      }
      const moss = stones[1];
      inkPiece(sp, { fill: '#7f9a45', light: '#b6d478', rim: 1.4, line: 1.2, hatch: false, shape: x => { lobed(x, cx + 4, moss.cy + 1, 9, 3.5, 4, R, .3); lobed(x, cx - 9, moss.cy + 4, 5, 2.5, 3, R, .3); } });
      const topY = stones[stones.length - 1].cy;
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        x.lineWidth = 2; x.beginPath(); x.moveTo(cx, topY + 2); x.quadraticCurveTo(cx - 2, topY - 5, cx + 1, topY - 9); x.stroke();
        x.beginPath(); x.ellipse(cx - 5, topY - 4, 4.5, 2.2, -.5, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(cx + 5, topY - 6, 4, 1.8, .5, 0, TAU); x.fill();
      } });
      inkPiece(sp, { fill: '#fff8e4', light: '#ffffff', rim: 1.5, line: 1.3, hatch: false, shape: x => {
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; x.beginPath(); x.ellipse(cx + 1 + Math.cos(a) * 5.5, topY - 11 + Math.sin(a) * 5.5, 4, 2.5, a, 0, TAU); x.fill(); }
        x.fillStyle = '#f2c230'; x.beginPath(); x.arc(cx + 1, topY - 11, 3, 0, TAU); x.fill();
      } });
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        for (let i = 0; i < 4; i++) { const bx = cx - 22 + i * 14 + R() * 3; x.beginPath(); x.moveTo(bx - 2, h); x.quadraticCurveTo(bx, h - 7, bx + 4, h - 11 - R() * 4); x.quadraticCurveTo(bx + 3, h - 5, bx + 2, h); x.fill(); }
      } });
    } },

    // A cheery two-arrow signpost with carved directions and flowers at its feet.
    signpost: { w: 92, h: 108, mat: 'wood', hp: 45, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#9a7448', th.mid, .16);
      inkPiece(sp, { fill: wood, light: lit(wood, .2), rim: 3, shape: x => {
        x.fillRect(cx - 4, h - 92, 8, 92);
        x.beginPath(); x.moveTo(cx - 7, h - 92); x.lineTo(cx, h - 100); x.lineTo(cx + 7, h - 92); x.closePath(); x.fill();
      }, detail: x => { marks(x, R, 6, cx - 2, h - 84, cx + 2, h - 10, rgbaC(INK, .38), 1, 8, '|'); } });
      const board = (y, dir, icon) => {
        const l = cx - 36, r = cx + 34;
        const pts = dir > 0 ? [[l, y], [r - 8, y], [r, y + 8], [r - 8, y + 17], [l, y + 17]] : [[l + 8, y], [r, y], [r, y + 17], [l + 8, y + 17], [l, y + 8]];
        inkPiece(sp, { fill: '#d9b071', light: '#f3d49b', rim: 2.6, line: 1.6, shape: x => { wobblyPoly(x, pts); x.fill(); }, detail: x => {
          x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1.1; x.beginPath(); x.moveTo(l + 6, y + 5); x.lineTo(r - 7, y + 5); x.moveTo(l + 6, y + 9); x.lineTo(r - 12, y + 9); x.stroke();
          x.strokeStyle = rgbaC(INK, .7); x.lineWidth = 1.6;
          if (icon === 0) { const mx = cx - 8, my = y + 11; x.beginPath(); x.moveTo(mx, my + 3); x.bezierCurveTo(mx - 8, my - 5, mx - 2, my - 9, mx, my - 3); x.bezierCurveTo(mx + 2, my - 9, mx + 8, my - 5, mx, my + 3); x.stroke(); }
          else { x.beginPath(); x.moveTo(cx - 16, y + 14); x.lineTo(cx - 10, y + 8); x.lineTo(cx - 4, y + 14); x.stroke(); x.strokeRect(cx - 13, y + 14, 8, 4); x.beginPath(); x.moveTo(cx - 10, y + 18); x.lineTo(cx - 10, y + 16); x.lineTo(cx - 8, y + 16); x.lineTo(cx - 8, y + 18); x.stroke(); }
        } });
      };
      board(h - 86, 1, 0); board(h - 56, -1, 1);
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        for (let i = 0; i < 5; i++) { const bx = cx - 26 + i * 12 + R() * 3; x.beginPath(); x.moveTo(bx - 2, h); x.quadraticCurveTo(bx, h - 8, bx + 4, h - 12 - R() * 5); x.quadraticCurveTo(bx + 3, h - 5, bx + 2, h); x.fill(); }
      } });
      inkPiece(sp, { fill: '#f3b6c4', light: '#ffe4ea', rim: 1.3, line: 1.1, hatch: false, shape: x => {
        for (const [fx, fy] of [[cx - 28, h - 10], [cx + 24, h - 7]]) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 3, 1.8, a, 0, TAU); x.fill(); }
      } });
    } },

    // A slatted park bench with an open book and a daisy left on the seat.
    bench: { w: 104, h: 58, mat: 'wood', hp: 50, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#b0814f', th.mid, .14);
      inkPiece(sp, { fill: wood, light: '#dcaf74', rim: 3, shape: x => {
        x.fillRect(cx - 40, h - 46, 5, 26); x.fillRect(cx + 35, h - 46, 5, 26);
        for (let i = 0; i < 3; i++) x.fillRect(cx - 40, h - 45 + i * 8, 80, 5);
        x.fillRect(cx - 44, h - 22, 88, 7);
        x.fillRect(cx - 39, h - 15, 5, 15); x.fillRect(cx + 34, h - 15, 5, 15);
        x.fillRect(cx - 44, h - 31, 6, 9); x.fillRect(cx + 38, h - 31, 6, 9);
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1;
        x.beginPath(); for (const yy of [h - 40, h - 32, h - 18]) { x.moveTo(cx - 38, yy); x.lineTo(cx + 38, yy); } x.stroke();
        x.strokeStyle = rgbaC(INK, .16); x.lineWidth = 1.1; marks(x, R, 8, cx - 36, h - 40, cx + 36, h - 6, rgbaC(INK, .16), 1.1, 10, '|');
      } });
      inkPiece(sp, { fill: '#fff6dc', light: '#ffffff', rim: 1.2, line: 1.1, hatch: false, shape: x => {
        x.beginPath(); x.moveTo(cx - 9, h - 23); x.quadraticCurveTo(cx - 4, h - 27, cx, h - 24); x.quadraticCurveTo(cx + 4, h - 27, cx + 9, h - 23); x.lineTo(cx + 9, h - 18); x.quadraticCurveTo(cx + 4, h - 22, cx, h - 19); x.quadraticCurveTo(cx - 4, h - 22, cx - 9, h - 18); x.closePath(); x.fill();
        x.strokeStyle = rgbaC(INK, .45); x.lineWidth = .8; x.beginPath(); x.moveTo(cx, h - 24); x.lineTo(cx, h - 19); x.stroke();
      } });
      inkPiece(sp, { fill: '#f3b6c4', light: '#ffe4ea', rim: 1.2, line: 1, hatch: false, shape: x => {
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(cx + 22 + Math.cos(a) * 3, h - 26 + Math.sin(a) * 3, 2.7, 1.6, a, 0, TAU); x.fill(); }
        x.fillStyle = '#f2c230'; x.beginPath(); x.arc(cx + 22, h - 26, 1.8, 0, TAU); x.fill();
      } });
    } },

    // A sleepy skep beehive on a stump, with two very busy bees.
    beehive: { w: 54, h: 60, small: 1, mat: 'soft', hp: 24, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#8a6244', light: '#b38a60', rim: 2.4, shape: x => { x.fillRect(cx - 15, h - 14, 30, 14); x.beginPath(); x.ellipse(cx, h - 14, 15, 4, 0, 0, TAU); x.fill(); },
        detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; for (const dx of [-8, 0, 8]) { x.beginPath(); x.moveTo(cx + dx, h - 4); x.lineTo(cx + dx + 1, h - 12); x.stroke(); } } });
      inkPiece(sp, { fill: '#d9a94a', light: '#f3cf80', rim: 2.6, shape: x => {
        for (let i = 0; i < 5; i++) { const ww = 12 + i * 3.2, yy = h - 17 - i * 6.8; x.beginPath(); x.ellipse(cx, yy, ww, 4.8, 0, 0, TAU); x.fill(); }
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1;
        for (let i = 0; i < 5; i++) { const ww = 12 + i * 3.2, yy = h - 17 - i * 6.8; x.beginPath(); x.moveTo(cx - ww, yy); x.quadraticCurveTo(cx, yy + 2, cx + ww, yy); x.stroke(); }
        x.fillStyle = rgbaC(INK, .72); x.beginPath(); x.ellipse(cx, h - 24, 4, 5, 0, 0, TAU); x.fill();
        x.fillStyle = '#8a6244'; x.beginPath(); x.ellipse(cx, h - 47, 4, 2.6, 0, 0, TAU); x.fill();
      } });
      // two small bees: cream wings behind dark bodies, with no long trails
      inkPiece(sp, { fill: '#fff6dc', light: '#ffffff', rim: 1.2, line: 1.1, hatch: false, shape: x => {
        for (const [bx, by] of [[cx - 19, h - 38], [cx + 18, h - 27]]) {
          x.beginPath(); x.ellipse(bx - 1, by - 5, 2.8, 1.2, -.6, 0, TAU); x.fill();
          x.beginPath(); x.ellipse(bx + 4, by - 5, 2.5, 1.1, -.2, 0, TAU); x.fill();
        }
      } });
      inkPiece(sp, { fill: '#3a3640', rim: 0, line: 1.2, hatch: false, shape: x => {
        for (const [bx, by] of [[cx - 19, h - 38], [cx + 18, h - 27]]) {
          x.beginPath(); x.ellipse(bx + 1, by, 3.8, 2.3, -.25, 0, TAU); x.fill();
          x.beginPath(); x.arc(bx + 4, by - 1.5, 1.8, 0, TAU); x.fill();
        }
      }, detail: x => {
        for (const [bx, by] of [[cx - 19, h - 38], [cx + 18, h - 27]]) {
          x.strokeStyle = 'rgba(242,194,48,.8)'; x.lineWidth = .8; x.beginPath(); x.moveTo(bx, by - 1.5); x.lineTo(bx + 2, by + 1.5); x.stroke();
          x.fillStyle = '#1f1c24'; x.beginPath(); x.arc(bx + 5, by - 2, .5, 0, TAU); x.fill();
        }
      } });
      inkPiece(sp, { fill: '#f3b6c4', light: '#ffe4ea', rim: 1.2, line: 1.1, hatch: false, shape: x => {
        for (const [fx, fy] of [[cx - 23, h - 6], [cx + 22, h - 8]]) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(fx + Math.cos(a) * 2.8, fy + Math.sin(a) * 2.8, 2.4, 1.4, a, 0, TAU); x.fill(); }
      } });
    } },

    // A landmark windmill: stone base, cream tower, timber cap and four lattice sails.
    windmill: { w: 158, h: 236, mat: 'stone', hp: 260, noBurn: 1, art(sp, d) {
      const { R, th, cx, h } = d;
      const cream = '#eadcc0', wood = mix('#8a5f43', th.deep, .12), hubY = h * .37;
      inkPiece(sp, { fill: '#f0dbaa', light: '#fff6dc', rim: 3, line: 2, box: [cx - 84, 0, cx + 84, hubY + 30], shape: x => {
        for (let k = 0; k < 4; k++) { x.save(); x.translate(cx, hubY); x.rotate(k / 4 * TAU + .45); x.beginPath(); x.moveTo(20, -5); x.lineTo(70, -12); x.lineTo(74, 16); x.lineTo(20, 8); x.closePath(); x.fill(); x.restore(); }
      }, detail: x => {
        for (let k = 0; k < 4; k++) { x.save(); x.translate(cx, hubY); x.rotate(k / 4 * TAU + .45);
          x.strokeStyle = rgbaC(INK, .45); x.lineWidth = 1; for (let r = 30; r < 72; r += 10) { x.beginPath(); x.moveTo(r, -8); x.lineTo(r + 2, 14); x.stroke(); }
          x.beginPath(); x.moveTo(24, 0); x.lineTo(72, 0); x.stroke();
          x.strokeStyle = 'rgba(138,95,67,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(22, 6); x.lineTo(73, 12); x.stroke();
          x.restore(); }
      } });
      inkPiece(sp, { fill: wood, light: lit(wood, .2), rim: 2, line: 1.6, hatch: false, shape: x => {
        for (let k = 0; k < 4; k++) { x.save(); x.translate(cx, hubY); x.rotate(k / 4 * TAU + .45); x.lineWidth = 3.8; x.beginPath(); x.moveTo(12, 0); x.lineTo(80, 0); x.stroke(); x.lineWidth = 1.8; x.beginPath(); x.moveTo(20, -7); x.lineTo(73, -14); x.moveTo(20, 9); x.lineTo(73, 17); x.stroke(); x.restore(); }
      } });
      inkPiece(sp, { fill: cream, light: '#fff8e6', dark: '#c8b894', rim: 4, box: [cx - 35, 90, cx + 35, h], shape: x => {
        x.beginPath(); x.moveTo(cx - 35, h); x.lineTo(cx - 23, h * .36); x.lineTo(cx + 23, h * .36); x.lineTo(cx + 35, h); x.closePath(); x.fill();
        x.fillRect(cx - 38, h - 14, 76, 14);
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .25); x.lineWidth = 1.1;
        for (let yy = h - 22; yy > h * .48; yy -= 18) { x.beginPath(); x.moveTo(cx - 34 + (h - yy) * .02, yy); x.quadraticCurveTo(cx, yy + 3, cx + 34 - (h - yy) * .02, yy); x.stroke(); }
        x.fillStyle = '#6b4a33'; x.beginPath(); x.moveTo(cx - 10, h); x.lineTo(cx - 10, h - 25); x.quadraticCurveTo(cx, h - 35, cx + 10, h - 25); x.lineTo(cx + 10, h); x.fill();
        for (const [wy, ww] of [[h * .66, 7], [h * .52, 5]]) { x.fillStyle = '#6b4a33'; x.fillRect(cx - ww, wy, ww * 2, ww * 1.6); }
      } });
      inkPiece(sp, { fill: wood, light: lit(wood, .22), rim: 3, shape: x => {
        x.beginPath(); x.moveTo(cx - 27, h * .36); x.quadraticCurveTo(cx, h * .26, cx + 27, h * .36); x.closePath(); x.fill();
        x.fillRect(cx - 5, hubY - 5, 10, 14);
      } });
      inkPiece(sp, { fill: '#5a4030', light: '#8a6548', rim: 2, shape: x => { x.beginPath(); x.arc(cx, hubY, 6, 0, TAU); x.fill(); } });
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        for (let i = 0; i < 7; i++) { const bx = cx - 42 + i * 13 + R() * 3; x.beginPath(); x.moveTo(bx - 2, h); x.quadraticCurveTo(bx, h - 9, bx + 4, h - 14 - R() * 6); x.quadraticCurveTo(bx + 3, h - 6, bx + 2, h); x.fill(); }
      } });
    } },

    // A stone well with a shingled roof, rope and a little bucket.
    well: { w: 100, h: 118, mat: 'stone', hp: 180, noBurn: 1, art(sp, d) {
      const { R, th, cx, h } = d; const stone = mix('#b7b1a2', th.mid, .18), wood = mix('#8a6244', th.deep, .12);
      inkPiece(sp, { fill: stone, light: lit(stone, .22), rim: 3, shape: x => {
        x.beginPath(); x.moveTo(cx - 34, h); x.lineTo(cx - 30, h * .58); x.quadraticCurveTo(cx, h * .48, cx + 30, h * .58); x.lineTo(cx + 34, h); x.closePath(); x.fill();
        x.beginPath(); x.ellipse(cx, h * .58, 30, 8, 0, 0, TAU); x.fill();
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1.1;
        for (const yy of [h * .72, h * .86]) { x.beginPath(); x.moveTo(cx - 32, yy); x.quadraticCurveTo(cx, yy + 4, cx + 32, yy); x.stroke(); }
        for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(cx + i * 12, h * .6); x.lineTo(cx + i * 12, h - 4); x.stroke(); }
        x.fillStyle = 'rgba(31,28,36,.45)'; x.beginPath(); x.ellipse(cx, h * .58, 21, 4, 0, 0, TAU); x.fill();
        x.fillStyle = 'rgba(111,154,58,.55)'; lobed(x, cx - 22, h * .7, 8, 4, 4, R, .3); lobed(x, cx + 17, h * .82, 10, 4, 4, R, .3);
      } });
      inkPiece(sp, { fill: wood, light: lit(wood, .2), rim: 2.4, line: 1.8, hatch: false, shape: x => {
        x.fillRect(cx - 25, h - 76, 5, 50); x.fillRect(cx + 20, h - 76, 5, 50); x.fillRect(cx - 30, h - 79, 60, 5);
      }, detail: x => { marks(x, R, 5, cx - 23, h - 70, cx - 18, h - 30, rgbaC(INK, .35), .9, 9, '|'); } });
      inkPiece(sp, { fill: '#a4634a', light: '#c98565', rim: 3, shape: x => {
        x.beginPath(); x.moveTo(cx - 34, h * .31); x.lineTo(cx, h * .22); x.lineTo(cx + 34, h * .31); x.lineTo(cx + 28, h * .37); x.lineTo(cx, h * .3); x.lineTo(cx - 28, h * .37); x.closePath(); x.fill();
      }, detail: x => { x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(cx + i * 13, h * .31); x.lineTo(cx + i * 9, h * .25); x.stroke(); } } });
      inkPiece(sp, { fill: '#6b4a33', rim: 0, line: 1.4, hatch: false, shape: x => { x.lineWidth = 1.6; x.beginPath(); x.moveTo(cx, h * .3); x.lineTo(cx, h * .48); x.stroke(); } });
      inkPiece(sp, { fill: '#a07a4e', light: '#d9b071', rim: 2.4, shape: x => {
        x.beginPath(); x.moveTo(cx - 9, h * .48); x.lineTo(cx + 9, h * .48); x.lineTo(cx + 7, h * .57); x.lineTo(cx - 7, h * .57); x.closePath(); x.fill();
        x.lineWidth = 1.6; x.beginPath(); x.arc(cx, h * .48, 9, Math.PI, 0); x.stroke();
      } });
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        for (let i = 0; i < 6; i++) { const bx = cx - 30 + i * 12 + R() * 4; x.beginPath(); x.moveTo(bx - 2, h); x.quadraticCurveTo(bx, h - 8, bx + 4, h - 13 - R() * 5); x.quadraticCurveTo(bx + 3, h - 6, bx + 2, h); x.fill(); }
      } });
    } },

    // A checked picnic blanket, basket, cups and a daisy.
    picnic: { w: 118, h: 46, small: 1, mat: 'soft', hp: 10, art(sp, d) {
      const { R, cx, h } = d; const l = 6, r = 112, t = 17, b = h;
      inkPiece(sp, { fill: '#f7ead0', light: '#fff8e8', rim: 2.4, shape: x => {
        x.beginPath(); x.moveTo(l + 10, t); x.lineTo(r - 10, t); x.lineTo(r, b); x.lineTo(l, b); x.closePath(); x.fill();
      }, detail: x => {
        x.strokeStyle = 'rgba(190,75,65,.6)'; x.lineWidth = 2.2;
        for (let k = 0; k < 5; k++) { const tt = k / 5; x.beginPath(); x.moveTo(lerp(l + 10, r - 10, tt), t); x.lineTo(lerp(l, r, tt), b); x.stroke(); }
        for (let k = 1; k < 3; k++) { const yy = lerp(t, b, k / 3); x.beginPath(); x.moveTo(lerp(l + 10, l, k / 3), yy); x.lineTo(lerp(r - 10, r, k / 3), yy); x.stroke(); }
        x.strokeStyle = rgbaC(INK, .22); x.lineWidth = 1; x.beginPath(); x.moveTo(l + 4, b - 3); x.quadraticCurveTo(cx, b - 7, r - 4, b - 3); x.stroke();
      } });
      inkPiece(sp, { fill: '#b0814f', light: '#d9aa6c', rim: 2.6, shape: x => {
        x.fillRect(cx + 16, h - 24, 26, 18);
        x.beginPath(); x.arc(cx + 29, h - 24, 9, Math.PI, 0); x.stroke();
      }, detail: x => { x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1; for (const yy of [h - 19, h - 14]) { x.beginPath(); x.moveTo(cx + 17, yy); x.lineTo(cx + 41, yy); x.stroke(); } x.beginPath(); x.moveTo(cx + 24, h - 24); x.lineTo(cx + 24, h - 6); x.moveTo(cx + 34, h - 24); x.lineTo(cx + 34, h - 6); x.stroke(); } });
      inkPiece(sp, { fill: '#fff6dc', light: '#ffffff', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        for (const [px, py] of [[cx - 30, h - 12], [cx - 13, h - 8]]) { x.beginPath(); x.ellipse(px, py, 6, 2.5, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(px + 1, py - 3, 3, 1.5, 0, 0, TAU); x.fill(); }
      } });
      inkPiece(sp, { fill: '#fff6dc', light: '#ffffff', rim: 1.4, line: 1.2, hatch: false, shape: x => { x.beginPath(); x.arc(cx - 2, h - 22, 4, 0, TAU); x.fill(); x.strokeStyle = rgbaC(INK, .4); x.lineWidth = .8; x.beginPath(); x.arc(cx - 2, h - 22, 2, 0, TAU); x.stroke(); } });
      inkPiece(sp, { fill: '#f3b6c4', light: '#ffe4ea', rim: 1.2, line: 1, hatch: false, shape: x => {
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(cx - 44 + Math.cos(a) * 3, h - 20 + Math.sin(a) * 3, 2.7, 1.6, a, 0, TAU); x.fill(); }
        x.fillStyle = '#f2c230'; x.beginPath(); x.arc(cx - 44, h - 20, 1.8, 0, TAU); x.fill();
      } });
    } },

    // A wooden flower cart piled high with daisies and tulips.
    flowercart: { w: 122, h: 84, mat: 'wood', hp: 60, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#a87a4c', th.mid, .16);
      inkPiece(sp, { fill: '#6b4a33', light: '#9a744e', rim: 3, shape: x => { x.beginPath(); x.arc(cx + 28, h - 18, 17, 0, TAU); x.fill(); }, detail: x => {
        x.strokeStyle = '#d9b071'; x.lineWidth = 2;
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.beginPath(); x.moveTo(cx + 28, h - 18); x.lineTo(cx + 28 + Math.cos(a) * 14, h - 18 + Math.sin(a) * 14); x.stroke(); }
        x.beginPath(); x.arc(cx + 28, h - 18, 11, 0, TAU); x.stroke(); x.fillStyle = wood; x.beginPath(); x.arc(cx + 28, h - 18, 4, 0, TAU); x.fill();
      } });
      inkPiece(sp, { fill: wood, light: '#d9aa6c', rim: 3, shape: x => {
        x.beginPath(); x.moveTo(cx - 44, h - 22); x.lineTo(cx + 26, h - 22); x.lineTo(cx + 20, h); x.lineTo(cx - 38, h); x.closePath(); x.fill();
        x.fillRect(cx - 46, h - 30, 72, 9);
        x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 44, h - 28); x.lineTo(cx - 54, h - 40); x.stroke();
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .32); x.lineWidth = 1.1;
        for (const xx of [-34, -18, -2, 14]) { x.beginPath(); x.moveTo(cx + xx, h - 21); x.lineTo(cx + xx - 4, h - 2); x.stroke(); }
        x.beginPath(); x.moveTo(cx - 42, h - 27); x.lineTo(cx + 24, h - 27); x.stroke();
      } });
      inkPiece(sp, { fill: '#5f8a45', light: '#9bc06a', rim: 3, line: 1.6, shape: x => {
        for (let i = 0; i < 9; i++) { const px = cx - 38 + R() * 62, py = h - 34 - R() * 16; lobed(x, px, py, 9 + R() * 5, 5 + R() * 3, 5, R, .25); }
      } });
      const bloom = (col, light, n) => inkPiece(sp, { fill: col, light, rim: 2, line: 1.4, hatch: false, shape: x => {
        for (let i = 0; i < n; i++) { const px = cx - 36 + R() * 58, py = h - 42 - R() * 26, r = 4 + R() * 3; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(px + Math.cos(a) * r * .8, py + Math.sin(a) * r * .8, r, r * .55, a, 0, TAU); x.fill(); } }
      }, detail: x => { dots(x, R, n * 2, cx - 30, h - 60, cx + 20, h - 34, rgbaC('#8a5e18', .7), .8, 1.4); } });
      bloom('#f3b6c4', '#ffe4ea', 5); bloom('#fff8e4', '#ffffff', 4); bloom('#e9b52a', '#ffe27a', 3);
      inkPiece(sp, { fill: '#f3b6c4', light: '#ffe4ea', rim: 1.2, line: 1, hatch: false, shape: x => {
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(cx - 48 + Math.cos(a) * 3, h - 45 + Math.sin(a) * 3, 2.6, 1.5, a, 0, TAU); x.fill(); }
      } });
    } },

    // A tall birdhouse on a post, with a bluebird on the roof.
    birdhouse: { w: 54, h: 112, small: 1, mat: 'wood', hp: 28, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#a07a4e', th.mid, .15);
      inkPiece(sp, { fill: wood, light: lit(wood, .2), rim: 2.6, line: 1.6, shape: x => {
        x.fillRect(cx - 3, h * .5, 6, h * .5);
        x.beginPath(); x.moveTo(cx - 16, h * .57); x.lineTo(cx, h * .5); x.lineTo(cx + 16, h * .57); x.closePath(); x.fill();
      }, detail: x => { marks(x, R, 4, cx - 2, h * .58, cx + 2, h - 6, rgbaC(INK, .35), .9, 8, '|'); } });
      inkPiece(sp, { fill: '#f2e6cf', light: '#fffaf0', rim: 2.4, shape: x => { x.fillRect(cx - 18, h * .2, 36, h * .37); }, detail: x => {
        x.strokeStyle = rgbaC(INK, .25); x.lineWidth = 1; for (let yy = h * .26; yy < h * .55; yy += 10) { x.beginPath(); x.moveTo(cx - 16, yy); x.lineTo(cx + 16, yy); x.stroke(); }
      } });
      inkPiece(sp, { fill: '#a4634a', light: '#c98565', rim: 2.6, shape: x => {
        x.beginPath(); x.moveTo(cx - 24, h * .23); x.lineTo(cx, h * .1); x.lineTo(cx + 24, h * .23); x.lineTo(cx + 18, h * .28); x.lineTo(cx, h * .19); x.lineTo(cx - 18, h * .28); x.closePath(); x.fill();
      }, detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(cx + i * 8, h * .23); x.lineTo(cx + i * 5, h * .13); x.stroke(); } } });
      inkPiece(sp, { fill: '#3a2e28', rim: 0, line: 1.4, hatch: false, shape: x => {
        x.beginPath(); x.arc(cx, h * .36, 6, 0, TAU); x.fill();
        x.fillStyle = '#6b4a33'; x.beginPath(); x.arc(cx, h * .42, 2.5, 0, TAU); x.fill();
        x.lineWidth = 3; x.strokeStyle = '#6b4a33'; x.beginPath(); x.moveTo(cx, h * .42); x.lineTo(cx, h * .46); x.stroke();
      } });
      inkPiece(sp, { fill: '#4e7fa8', light: '#84b4d8', rim: 1.8, line: 1.2, hatch: false, shape: x => {
        x.beginPath(); x.ellipse(cx + 8, h * .16, 5, 3.4, -.15, 0, TAU); x.fill();
        x.beginPath(); x.arc(cx + 13, h * .13, 3, 0, TAU); x.fill();
        x.beginPath(); x.moveTo(cx + 16, h * .13); x.lineTo(cx + 20, h * .14); x.lineTo(cx + 16, h * .16); x.closePath(); x.fill();
        x.fillStyle = '#2f5d80'; x.beginPath(); x.ellipse(cx + 6, h * .16, 3, 1.6, .4, 0, TAU); x.fill();
      }, detail: x => { x.fillStyle = '#1f1c24'; x.beginPath(); x.arc(cx + 14, h * .125, .8, 0, TAU); x.fill(); } });
      inkPiece(sp, { fill: '#6f9a3a', light: '#a8c966', rim: 1.4, line: 1.2, hatch: false, shape: x => {
        for (let i = 0; i < 5; i++) { const bx = cx - 20 + i * 10 + R() * 3; x.beginPath(); x.moveTo(bx - 2, h); x.quadraticCurveTo(bx, h - 8, bx + 4, h - 13 - R() * 5); x.quadraticCurveTo(bx + 3, h - 6, bx + 2, h); x.fill(); }
      } });
    } },
  },
});
