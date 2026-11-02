/* Biome: Hexfall Heights
   A cascade of pastel hexagon platforms tumbling from the dawn sky like
   falling tiles, stitched together with little boardwalks. */
Biome({
  order: 331,
  name: "Hexfall Heights",
  inkhold: true,
  style: "float",
  weather: "petals",
  wind: 24,
  boulders: 2,
  skyT: "#f2c4d8",
  skyB: "#fbe8d8",
  sun: "#fff6d8",
  far: ["#d9a8c4", "#c495b4"],
  top: "#9db87a",
  mid: "#8a6f5c",
  deep: "#5c463c",
  cap: "#c8de9c",
  props: [["cherry", 0.5], ["lantern", 0.3], ["bush", 0.3], ["rock", 0.25]],
  under: [["flowers", 0.4], ["tallgrass", 0.3]],
  bgTrees: "cherry",
  cloud: "#ffffff",
  grass: 0.5,
  grassCol: ["#8fb06a", "#b2cf8a"],
  critters: 3,
  terrain(ctx) {
    const { R, mc, W, H } = ctx;
    const hexes = [];
    const hex = (cx, cy, r, flat = false) => {
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i / 6 * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * (flat ? .55 : 1)]); }
      mc.beginPath(); mc.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 6; i++) mc.lineTo(pts[i][0], pts[i][1]); mc.closePath(); mc.fill();
      return pts;
    };
    // the main cascade: big hexes stepping down from the top-left
    let x = 150, y = 240;
    while (x < W - 130) {
      const r = 100 + R() * 60;
      hexes.push([x, y, r]);
      hex(x, y, r, true);
      x += r * 1.25 + 30 + R() * 70;
      y += 55 + R() * 85;
    }
    // scattered smaller hexes for routes upward
    const nS = ctx.big ? 14 : 9;
    for (let i = 0; i < nS; i++) {
      const r = 55 + R() * 45;
      const px = 110 + R() * (W - 220 - r * 2);
      const py = 200 + R() * (H - 520);
      if (hexes.some(h => Math.hypot(h[0] - px, h[1] - py) < h[2] + r + 70)) continue;
      hexes.push([px, py, r]);
      hex(px, py, r, R() < .4);
    }
    // boardwalk bridges between some close hexes
    let bridges = 0;
    for (let i = 0; i < hexes.length && bridges < (ctx.big ? 8 : 5); i++) {
      const a = hexes[i];
      for (let j = i + 1; j < hexes.length; j++) {
        const b = hexes[j];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (d > a[2] + b[2] + 240 || d < a[2] + b[2] + 40) continue;
        const dx = (b[0] - a[0]) / d, dy = (b[1] - a[1]) / d;
        const wdt = 16;
        const ax = a[0] + dx * (a[2] * .8), ay = a[1] + dy * (a[2] * .55);
        const bx = b[0] - dx * (b[2] * .8), by = b[1] - dy * (b[2] * .55);
        mc.beginPath();
        mc.moveTo(ax - dy * wdt, ay + dx * wdt); mc.lineTo(bx - dy * wdt, by + dx * wdt);
        mc.lineTo(bx + dy * wdt, by - dx * wdt); mc.lineTo(ax + dy * wdt, ay - dx * wdt);
        mc.closePath(); mc.fill();
        bridges++; break;
      }
    }
  },
  texture(ctx) {
    // faint tile grout lines: each hex reads as a ceramic tile
    const { c, R, W, H } = ctx;
    c.strokeStyle = 'rgba(70,50,60,.10)'; c.lineWidth = 1.4;
    for (let i = 0; i < 90; i++) {
      const x = R() * W, y = R() * H, r = 40 + R() * 60;
      c.beginPath();
      for (let k = 0; k <= 6; k++) { const a = Math.PI / 6 + k / 6 * Math.PI * 2; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; k === 0 ? c.moveTo(px, py) : c.lineTo(px, py); }
      c.stroke();
    }
  },
});
