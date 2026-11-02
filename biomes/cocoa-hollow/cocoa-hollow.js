/* Biome: Cocoa Hollow (cozy)
   A snowed-in village at dusk: warm windows, chimney smoke, fairy lights,
   snowmen and stacked firewood. Everything here lives in this one file:
   colours, props (newProps), the backdrop village (background hook) and
   the chimney smoke / twinkling lights (drawBack + drawGlow hooks). */
const COCOA = { wall: ['#b8744c', '#9a5e44', '#c98a5a', '#8a6a8a'], roof: '#f4f0ec', warm: '#ffcf7a', bulbs: ['#ff6b6b', '#ffd36b', '#7be0a0', '#7ab8ff', '#ff9ad5'] };
function cocoaWindow(x, wx, wy, ww, wh) {
  x.fillStyle = '#ffd98a'; x.fillRect(wx, wy, ww, wh);
  const g = x.createRadialGradient(wx + ww / 2, wy + wh / 2, 1, wx + ww / 2, wy + wh / 2, ww); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,170,80,.0)'); x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
  x.strokeStyle = rgbaC(INK, .85); x.lineWidth = 2; x.strokeRect(wx, wy, ww, wh); x.lineWidth = 1.6; x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.moveTo(wx, wy + wh / 2); x.lineTo(wx + ww, wy + wh / 2); x.stroke();
  x.fillStyle = '#f7f4f0'; x.fillRect(wx - 3, wy + wh, ww + 6, 3.5);
}
Biome({
  order: 160,
  name: "Cocoa Hollow",
  style: "ground",
  weather: "flurries",
  wind: -14,
  pits: 0,
  puddles: 1,
  pond: true,
  skyT: "#2b2d5c",
  skyB: "#f0a774",
  sun: "#ffd7a0",
  sunLow: true,
  far: ["#8b7aa6", "#655985"],
  top: "#f4efe9",
  mid: "#8a6656",
  deep: "#3d2c31",
  cap: "#ffffff",
  water: "#9cc4dc",
  shallow: "#cfe6f2",
  cloud: "#d9c3d6",
  dark: 0.22,
  haze: 0.1,
  grass: 0.12,
  grassCol: ["#b7a68a", "#efe6d6"],
  leaf: ["#ffffff", "#f3eef8", "#e6eef8"],
  bgTrees: "snowpines",
  critters: 3,
  treeDensity: 0.8,
  thingDensity: 1.8,
  props: [["cottage", 1.1], ["snowpine", 0.7], ["snowman", 0.3], ["woodpile", 0.3], ["fairypost", 0.25], ["lantern", 0.08]],
  under: [["woodpile", 0.2], ["snowman", 0.15]],
  plantDensity: 0.4,
  newProps: {
    cottage: { w: 132, h: 128, mat: 'plank', hp: 160, glow: 'rgba(255,190,110,1)', glowAt: [-22, 46], art(sp, d) {
      const { R, cx, h } = d; const wall = COCOA.wall[d.v % COCOA.wall.length];
      // chimney
      inkPiece(sp, { fill: '#8c5446', rim: 3, shape: x => x.fillRect(cx + 26, h - 122, 16, 40), detail: x => { x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1; for (let y = h - 116; y < h - 84; y += 7) { x.beginPath(); x.moveTo(cx + 26, y); x.lineTo(cx + 42, y); x.stroke(); } } });
      // walls
      inkPiece(sp, { fill: wall, rim: 4, shape: x => x.fillRect(cx - 52, h - 74, 104, 74),
        detail: x => { x.strokeStyle = rgbaC(INK, .25); x.lineWidth = 1.2; for (let y = h - 66; y < h; y += 9) { x.beginPath(); x.moveTo(cx - 52, y + R() * 2); x.lineTo(cx + 52, y + R() * 2); x.stroke(); }
          cocoaWindow(x, cx - 38, h - 58, 22, 20); cocoaWindow(x, cx + 18, h - 58, 22, 20);
          x.fillStyle = '#5a3426'; x.fillRect(cx - 9, h - 38, 18, 38); x.strokeStyle = rgbaC(INK, .8); x.lineWidth = 2; x.strokeRect(cx - 9, h - 38, 18, 38); x.fillStyle = '#ffd36b'; x.beginPath(); x.arc(cx + 5, h - 19, 1.8, 0, TAU); x.fill();
          // wreath
          x.strokeStyle = '#3f7a4a'; x.lineWidth = 3.5; x.beginPath(); x.arc(cx, h - 30, 5, 0, TAU); x.stroke(); x.fillStyle = '#e04848'; x.fillRect(cx - 2, h - 27, 4, 3); } });
      // snowy roof
      inkPiece(sp, { fill: '#f7f3ee', light: '#ffffff', dark: '#c9cfe0', rim: 4, shape: x => { x.beginPath(); x.moveTo(cx - 66, h - 68); x.lineTo(cx, h - 118); x.lineTo(cx + 66, h - 68); x.quadraticCurveTo(cx + 40, h - 60, cx + 20, h - 66); x.quadraticCurveTo(cx, h - 58, cx - 22, h - 66); x.quadraticCurveTo(cx - 44, h - 60, cx - 66, h - 68); x.fill(); },
        detail: x => { x.fillStyle = '#7a4a3a'; x.beginPath(); x.moveTo(cx - 60, h - 70); x.lineTo(cx - 64, h - 66); x.lineTo(cx + 64, h - 66); x.lineTo(cx + 60, h - 70); x.fill(); } });
      // fairy lights along the eave
      const x = sp.x; for (let i = 0; i < 9; i++) { const t = i / 8, px = cx - 54 + t * 108, py = h - 66 + Math.sin(t * Math.PI * 4) * 2.5 + 3; x.fillStyle = COCOA.bulbs[(i + d.v) % 5]; x.beginPath(); x.arc(px, py, 2.6, 0, TAU); x.fill(); x.strokeStyle = rgbaC(INK, .6); x.lineWidth = 1; x.stroke(); }
      // snow drift at the base
      inkPiece(sp, { fill: '#f6f2ee', rim: 2, line: 1.6, shape: x => { x.beginPath(); x.ellipse(cx - 40, h - 2, 22, 7, 0, 0, TAU); x.ellipse(cx + 44, h - 2, 18, 6, 0, 0, TAU); x.fill(); } });
    } },
    snowman: { w: 56, h: 78, mat: 'leaf', hp: 30, noBurn: 1, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#f7f4f1', light: '#ffffff', dark: '#b8c3dc', rim: 4, shape: x => { x.beginPath(); x.arc(cx, h - 18, 18, 0, TAU); x.arc(cx, h - 46, 13, 0, TAU); x.arc(cx, h - 66, 10, 0, TAU); x.fill(); },
        detail: x => { x.fillStyle = rgbaC(INK, .85); for (const y of [h - 50, h - 42, h - 22]) { x.beginPath(); x.arc(cx, y, 1.8, 0, TAU); x.fill(); } x.beginPath(); x.arc(cx - 4, h - 69, 1.6, 0, TAU); x.arc(cx + 4, h - 69, 1.6, 0, TAU); x.fill();
          x.fillStyle = '#f08a3a'; x.beginPath(); x.moveTo(cx, h - 66); x.lineTo(cx + 12, h - 64); x.lineTo(cx, h - 63); x.fill(); } });
      inkPiece(sp, { fill: ['#d84a4a', '#3f7a8a', '#e0a040'][d.v % 3], rim: 2, shape: x => { x.fillRect(cx - 11, h - 59, 22, 5); x.fillRect(cx + 4, h - 58, 6, 16); },
        detail: x => { x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.5; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(cx - 8 + k * 5, h - 59); x.lineTo(cx - 8 + k * 5, h - 54); x.stroke(); } } });
      inkPiece(sp, { fill: '#6a4632', rim: 0, shape: x => { x.lineWidth = 2.4; x.beginPath(); x.moveTo(cx - 12, h - 48); x.lineTo(cx - 27, h - 58 - R() * 4); x.moveTo(cx - 22, h - 55); x.lineTo(cx - 25, h - 62); x.moveTo(cx + 12, h - 48); x.lineTo(cx + 27, h - 56); x.stroke(); } });
      inkPiece(sp, { fill: '#2e2a34', rim: 2, shape: x => { x.fillRect(cx - 12, h - 77, 24, 3); x.fillRect(cx - 8, h - 90, 16, 13); } });
    } },
    woodpile: { w: 66, h: 40, mat: 'wood', hp: 50, solid: true, art(sp, d) {
      const { R, cx, h } = d; const logs = [[-20, 8], [0, 8], [20, 8], [-10, 24], [10, 24], [0, 39]];
      inkPiece(sp, { fill: '#9a6a44', rim: 3, shape: x => { x.beginPath(); for (const [ox, oy] of logs) { if (oy > 30 && R() < .3) continue; x.moveTo(cx + ox + 9.5, h - oy); x.arc(cx + ox, h - oy, 9.5, 0, TAU); } x.fill(); },
        detail: x => { for (const [ox, oy] of logs) { x.fillStyle = '#e2b886'; x.beginPath(); x.arc(cx + ox, h - oy, 6.5, 0, TAU); x.fill(); x.strokeStyle = 'rgba(120,70,40,.7)'; x.lineWidth = 1; x.beginPath(); x.arc(cx + ox, h - oy, 3.8, 0, TAU); x.moveTo(cx + ox + 1.6, h - oy); x.arc(cx + ox, h - oy, 1.6, 0, TAU); x.stroke(); } } });
      inkPiece(sp, { fill: '#f7f3ef', rim: 2, line: 1.6, shape: x => { x.beginPath(); x.ellipse(cx, h - 46, 12, 4, 0, 0, TAU); x.ellipse(cx - 12, h - 31, 9, 3, 0, 0, TAU); x.ellipse(cx + 12, h - 31, 9, 3, 0, 0, TAU); x.fill(); } });
    } },
    fairypost: { w: 70, h: 120, mat: 'wood', hp: 50, glow: 'rgba(255,200,140,1)', glowAt: [0, 96], art(sp, d) {
      const { cx, h } = d;
      inkPiece(sp, { fill: '#7a5038', rim: 3, shape: x => { x.fillRect(cx - 4, h - 112, 8, 112); x.fillRect(cx - 30, h - 104, 60, 5); } });
      inkPiece(sp, { fill: '#f7f3ef', rim: 2, line: 1.6, shape: x => { x.beginPath(); x.ellipse(cx, h - 114, 9, 4, 0, 0, TAU); x.ellipse(cx - 18, h - 106, 12, 3, 0, 0, TAU); x.ellipse(cx + 18, h - 106, 12, 3, 0, 0, TAU); x.fill(); } });
      const x = sp.x; x.strokeStyle = rgbaC(INK, .7); x.lineWidth = 1.2;
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 28, h - 100); x.quadraticCurveTo(cx + s * 34, h - 60, cx + s * 30, h - 22); x.stroke();
        for (let i = 0; i < 6; i++) { const t = i / 5, px = cx + s * (28 + Math.sin(t * Math.PI) * 4.5), py = h - 98 + t * 74; x.fillStyle = COCOA.bulbs[(i + (s > 0 ? 2 : 0)) % 5]; x.beginPath(); x.arc(px, py, 2.6, 0, TAU); x.fill(); x.stroke(); } }
      x.fillStyle = '#c8402e'; x.beginPath(); x.moveTo(cx, h - 98); x.lineTo(cx - 7, h - 91); x.lineTo(cx + 7, h - 91); x.fill();
    } },
  },
  // a sleepy village on the far hill (painted once into the backdrop)
  background(ctx) {
    const { x, R, W, H, fbm, TAU } = ctx; const base = H * .64;
    const hill = px => base - (fbm(px * .0025, ctx.seed + 7) * .5 + .5) * 160 - Math.max(0, fbm(px * .01, 1) * 30);
    for (let px = 40 + R() * 120; px < W - 40; px += 70 + R() * 170) {
      const y = hill(px) + 16, w = 26 + R() * 22, wh = 18 + R() * 12, steeple = R() < .12;
      x.fillStyle = '#4f4468'; x.fillRect(px - w / 2, y - wh, w, wh + 30);
      x.beginPath(); x.moveTo(px - w / 2 - 5, y - wh + 1); x.lineTo(px, y - wh - (steeple ? 46 : 16)); x.lineTo(px + w / 2 + 5, y - wh + 1); x.closePath(); x.fill();
      x.fillStyle = 'rgba(238,236,246,.9)'; x.beginPath(); x.moveTo(px - w / 2 - 5, y - wh + 1); x.lineTo(px, y - wh - (steeple ? 46 : 16)); x.lineTo(px + w / 2 + 5, y - wh + 1); x.lineTo(px + w / 2, y - wh + 4); x.lineTo(px - w / 2, y - wh + 4); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,205,120,.95)'; const n = 1 + (R() * 2 | 0); for (let k = 0; k < n; k++) x.fillRect(px - w / 2 + 5 + k * (w - 14) / Math.max(1, n - 1 || 1), y - wh * .6, 5, 5);
      const g = x.createRadialGradient(px, y - wh * .5, 0, px, y - wh * .5, 40); g.addColorStop(0, 'rgba(255,190,110,.28)'); g.addColorStop(1, 'rgba(255,190,110,0)'); x.fillStyle = g; x.fillRect(px - 40, y - wh * .5 - 40, 80, 80);
    }
  },
  onMap(ctx) {
    // remember where the chimneys are for the smoke
    this._smoke = ctx.env.props.filter(p => p.kind === 'cottage').map(p => ({ p, ph: ctx.R() * 10 }));
    this._puff = ctx.glow('rgba(232,228,240,1)');
  },
  drawBack(c, V, t) {
    if (!this._smoke) return; const sp = this._puff;
    for (const s of this._smoke) { const p = s.p; if (p.dead || p.cut) continue; const k = p.s || 1, cx = p.x + (p.flip ? -34 : 34) * k, cy = p.y - 124 * k; if (cx < V.x0 - 120 || cx > V.x1 + 120 || cy > V.y1 + 50 || cy < V.y0 - 300) continue;
      for (let i = 0; i < 6; i++) { const f = ((t * .22 + s.ph + i / 6) % 1); const r = (8 + f * 34) * k; c.globalAlpha = .34 * (1 - f) * Math.min(1, f * 6); c.drawImage(sp, cx + Math.sin(f * 5 + s.ph) * 10 * k + f * f * 40 * Math.sign(Env.wind || -1) - r, cy - f * 150 * k - r, r * 2, r * 2); } }
    c.globalAlpha = 1;
  },
  drawGlow(c, V, t) {
    if (!this._smoke) return; const g = this._puff;
    for (const s of this._smoke) { const p = s.p; if (p.dead || p.cut) continue; const k = p.s || 1; const wx = p.x + (p.flip ? -29 : 29) * k, wy = p.y - 48 * k; if (wx < V.x0 - 100 || wx > V.x1 + 100) continue;
      c.globalAlpha = .16 + Math.sin(t * 2.3 + s.ph) * .04; c.drawImage(T.theme._warm || (T.theme._warm = softSprite('rgba(255,180,100,1)')), wx - 60 * k, wy - 60 * k, 120 * k, 120 * k); }
    c.globalAlpha = 1;
  },
});
