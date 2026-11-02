/* Biome: Glowworm Grotto
   A deep cavern lit by glowworm threads, luminous fungi and crystals, with an
   underground lake. Shows off the scripting hooks: its own terrain(),
   a painted cave backdrop (background), a hanging rock ceiling with
   glowworm threads (drawSky / drawFront) and soft light (drawGlow). */
const GROTTO = { teal: 'rgba(120,255,220,1)', ceil: '#141626', rock: '#232842' };
Biome({
  order: 215,
  name: "Glowworm Grotto",
  style: "ground",
  weather: "spores",
  wind: 4,
  skyT: "#0b0d1c",
  skyB: "#1c2a3e",
  sun: "#9fffe6",
  sunKind: "none",
  night: true,
  dark: 0.3,
  far: ["#1f2a40", "#172033"],
  top: "#3d4a5e",
  mid: "#2a3146",
  deep: "#141826",
  cap: "#5fd8c0",
  water: "#2e7f8f",
  shallow: "#5fe0d0",
  cloud: "#1c2236",
  grass: 0.3,
  grassCol: ["#2e5a5a", "#6ad8b8"],
  leaf: ["#8affd8", "#6ad0ff", "#c8ff9a"],
  bgTrees: "shrooms",
  critters: 1,
  boulders: 6,
  thingDensity: 1.8,
  plantDensity: 1.3,
  crateRate: 0.9,
  props: [["glowshroom", 0.8], ["stalagmite", 0.5], ["crystal", 0.35], ["giantshroom", 0.2], ["rock", 0.2]],
  under: [["mushroom", 0.5], ["fern", 0.4]],
  newProps: {
    glowshroom: { w: 58, h: 74, mat: 'leaf', hp: 30, small: 1, glow: 'rgba(110,255,220,1)', glowAt: [0, 52], art(sp, d) {
      const { R, cx, h } = d; const caps = [[0, 60, 22, 1], [-17, 34, 13, .8], [16, 28, 11, .7]]; const hue = ['#5fe8c8', '#7ac8ff', '#b2ff8a'][d.v % 3];
      for (const [ox, top, r] of caps) inkPiece(sp, { fill: '#d8e6dc', rim: 2, shape: x => { x.beginPath(); x.moveTo(cx + ox - r * .22, h); x.quadraticCurveTo(cx + ox - r * .3, h - top * .5, cx + ox - r * .15, h - top); x.lineTo(cx + ox + r * .15, h - top); x.quadraticCurveTo(cx + ox + r * .3, h - top * .5, cx + ox + r * .22, h); x.fill(); } });
      for (const [ox, top, r] of caps) inkPiece(sp, { fill: hue, light: '#f0fff8', rim: 3, shape: x => { x.beginPath(); x.ellipse(cx + ox, h - top, r, r * .62, 0, Math.PI, TAU); x.quadraticCurveTo(cx + ox, h - top + r * .3, cx + ox - r, h - top); x.fill(); },
        detail: x => { dots(x, R, 6, cx + ox - r * .7, h - top - r * .5, cx + ox + r * .7, h - top - 2, 'rgba(255,255,255,.75)', 1, 2.2); } });
    } },
    stalagmite: { w: 46, h: 96, mat: 'stone', hp: 120, noBurn: 1, art(sp, d) {
      const { R, cx, h } = d; const tall = 70 + R() * 26;
      inkPiece(sp, { fill: '#4a5470', light: '#7a88a8', rim: 4, shape: x => { x.beginPath(); x.moveTo(cx - 22, h + 2); x.quadraticCurveTo(cx - 12, h - tall * .4, cx - 2 + (R() - .5) * 4, h - tall); x.quadraticCurveTo(cx + 10, h - tall * .45, cx + 22, h + 2); x.fill(); },
        detail: x => { x.strokeStyle = 'rgba(160,190,220,.35)'; x.lineWidth = 1.2; for (let k = 0; k < 5; k++) { const y = h - 10 - k * tall * .17; x.beginPath(); x.moveTo(cx - 18 + k * 3, y); x.quadraticCurveTo(cx, y - 4, cx + 18 - k * 3, y); x.stroke(); } x.fillStyle = 'rgba(120,255,220,.5)'; x.beginPath(); x.arc(cx - 2, h - tall + 6, 1.8, 0, TAU); x.fill(); } });
    } },
  },
  // the cavern floor: a rolling floor with rock shelves and an underground lake
  terrain(ctx) {
    const { R, W, H, big, scale } = ctx; const base = H - 330;
    ctx.ground(-60, W + 60, base, 45);
    if (big) ctx.platforms(base - 10, 300);
    else { const n = 3; for (let i = 0; i < n; i++) { const w = 150 + R() * 150, px = 90 + (i + R() * .5) * (W - 260) / n, py = 300 + R() * 220; ctx.island(px, px + w, py, 50 + R() * 50, true); } }
    ctx.rebuild(); ctx.basin('pond', base);
    for (let i = 0; i < Math.round(scale); i++) ctx.basin('puddle', base);
  },
  // a cave instead of a sky: rock walls, faint glowing veins and far fungus
  background(ctx) {
    const { x, R, W, H, M, TAU } = ctx;
    const g = x.createLinearGradient(0, -M, 0, H); g.addColorStop(0, '#05060d'); g.addColorStop(.5, 'rgba(14,18,34,.85)'); g.addColorStop(1, 'rgba(20,34,48,.2)'); x.fillStyle = g; x.fillRect(-M, -M, W + M * 2, H + M);
    for (let i = 0; i < 9; i++) { const px = -M + R() * (W + M * 2), w = 80 + R() * 180; x.fillStyle = `rgba(${30 + R() * 14 | 0},${36 + R() * 14 | 0},${60 + R() * 20 | 0},.75)`; x.beginPath(); x.moveTo(px - w, H + M); x.quadraticCurveTo(px - w * .3, H * .3, px, -M); x.quadraticCurveTo(px + w * .4, H * .35, px + w, H + M); x.fill(); }
    x.lineWidth = 1.6; for (let i = 0; i < 26; i++) { let px = -M + R() * (W + M * 2), py = R() * H * .7; x.strokeStyle = `rgba(110,255,220,${.08 + R() * .12})`; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (R() - .5) * 60; py += R() * 40; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(150,255,230,${.2 + R() * .5})`; x.beginPath(); x.arc(-M + R() * (W + M * 2), -M + R() * (H * .5 + M), .8 + R() * 1.4, 0, TAU); x.fill(); }
  },
  onMap(ctx) {
    const { R, W } = ctx; T.clouds = [];
    // ceiling outline + stalactites + glowworm threads, built once per map
    const pts = [], n = Math.ceil((W + 400) / 34); for (let i = 0; i <= n; i++) { const px = -200 + i * 34; pts.push([px, 58 + ctx.fbm(px * .004, ctx.seed + 3) * 46 + (R() < .16 ? 50 + R() * 70 : 0)]); }
    this._ceil = pts; this._threads = [];
    for (let px = -100; px < W + 100; px += 9 + R() * 22) { const top = 60 + ctx.fbm(px * .004, ctx.seed + 3) * 46; this._threads.push({ x: px, y: top, len: 20 + R() * 120, ph: R() * TAU, beads: 2 + (R() * 4 | 0) }); }
    this._glow = ctx.glow(GROTTO.teal);
  },
  drawSky(c, V, t) {
    if (!this._ceil) return; const pts = this._ceil, top = V.y0 - 400;
    if (pts[0][1] + 140 < V.y0) return;
    c.save(); c.beginPath(); c.moveTo(pts[0][0], top); for (const [px, py] of pts) c.lineTo(px, py); c.lineTo(pts[pts.length - 1][0], top); c.closePath();
    const g = c.createLinearGradient(0, top, 0, 190); g.addColorStop(0, '#07080f'); g.addColorStop(.8, GROTTO.ceil); g.addColorStop(1, GROTTO.rock); c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = 'rgba(8,8,14,.9)'; c.stroke(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(110,255,220,.18)'; c.stroke(); c.restore();
  },
  drawFront(c, V, t) {
    if (!this._threads || V.y0 > 260) return; c.strokeStyle = 'rgba(190,255,240,.22)'; c.lineWidth = 1; c.beginPath();
    for (const th of this._threads) { if (th.x < V.x0 - 20 || th.x > V.x1 + 20) continue; const sw = Math.sin(t * .8 + th.ph) * 2; c.moveTo(th.x, th.y); c.lineTo(th.x + sw, th.y + th.len); } c.stroke();
  },
  drawGlow(c, V, t) {
    if (!this._threads || V.y0 > 260) return; const g = this._glow;
    for (const th of this._threads) { if (th.x < V.x0 - 20 || th.x > V.x1 + 20) continue; const sw = Math.sin(t * .8 + th.ph) * 2;
      for (let k = 1; k <= th.beads; k++) { const y = th.y + th.len * k / th.beads, a = .35 + .3 * Math.sin(t * 2 + th.ph + k); const r = 7 + k; c.globalAlpha = a; c.drawImage(g, th.x + sw * k / th.beads - r, y - r, r * 2, r * 2); } }
    c.globalAlpha = 1;
  },
});
