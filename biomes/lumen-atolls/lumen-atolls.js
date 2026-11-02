/* Biome: Lumen Atolls
   Night islands over glowing water: a scatter of round coral atolls with
   stepping stones between them. Inkhold's home turf. */
Biome({
  order: 330,
  name: "Lumen Atolls",
  inkhold: true,
  style: "sea",
  weather: "fireflies",
  wind: 0,
  boulders: 2,
  skyT: "#0e1430",
  skyB: "#27406b",
  sun: "#dff4ff",
  sunKind: "moon",
  night: true,
  far: ["#1b2a4a", "#141f38"],
  top: "#8fd8c0",
  mid: "#3e7d8f",
  deep: "#1d3a52",
  cap: "#d8f8ec",
  water: "#2a6d8f",
  shallow: "#4fa8b8",
  props: [["palm", 0.5], ["crystal", 0.45], ["rock", 0.3], ["lantern", 0.25]],
  under: [["tallgrass", 0.35], ["mushroom", 0.2]],
  bgTrees: "palms",
  cloud: "#23355c",
  dark: 0.3,
  grass: 0.25,
  grassCol: ["#5fae94", "#8fd8c0"],
  crystal: "#9ff2e0",
  critters: 2,
  terrain(ctx) {
    const { R, fill, sea, W, H } = ctx;
    const waterLevel = H - 250;
    sea(waterLevel);
    // atolls: wobbly round islands rising from the sea floor
    const atolls = [];
    const n = ctx.big ? 13 : 8;
    for (let i = 0; i < n; i++) {
      const r = 95 + R() * 85;
      let best = null;
      for (let t = 0; t < 40; t++) {
        const x = 130 + R() * (W - 260);
        const y = waterLevel - 130 - R() * (waterLevel - 420);
        if (atolls.some(a => Math.hypot(a.x - x, a.y - y) < a.r + r + 120)) continue;
        best = { x, y, r }; break;
      }
      if (!best) continue;
      atolls.push(best);
      const pts = [];
      const m = 30, ph = R() * TAU;
      for (let k = 0; k <= m; k++) {
        const a = k / m * Math.PI * 2;
        const rr = r * (0.8 + 0.14 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 7 + ph * 2));
        pts.push([best.x + Math.cos(a) * rr, best.y + Math.sin(a) * rr * 0.68]);
      }
      fill([[best.x - r, H + 220], ...pts, [best.x + r, H + 220]]);
    }
    // stepping stones between neighbouring atolls
    for (let i = 0; i < atolls.length; i++) {
      const a = atolls[i];
      let near = null, nd = 1e9;
      for (const b of atolls) { if (b === a) continue; const d = Math.hypot(b.x - a.x, b.y - a.y); if (d < nd) { nd = d; near = b; } }
      if (!near || nd > 700) continue;
      const steps = Math.max(2, Math.round(nd / 170));
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const x = a.x + (near.x - a.x) * t + (R() - .5) * 40;
        const y = a.y + (near.y - a.y) * t + (R() - .5) * 30 - 30;
        const r = 34 + R() * 26;
        const pts = [];
        for (let k = 0; k < 12; k++) { const ang = k / 12 * Math.PI * 2; const rr = r * (0.85 + R() * 0.3); pts.push([x + Math.cos(ang) * rr * 1.15, y + Math.sin(ang) * rr * 0.6]); }
        fill([[x - r * 1.2, H + 220], ...pts, [x + r * 1.2, H + 220]]);
      }
    }
    // a few lily-pad platforms drifting above the atolls
    const nP = ctx.big ? 9 : 5;
    for (let i = 0; i < nP; i++) {
      const w = 110 + R() * 120;
      const px = 90 + R() * (W - 180 - w);
      const py = 190 + R() * (waterLevel - 560);
      const pts = [];
      for (let k = 0; k < 14; k++) { const ang = k / 14 * Math.PI * 2; pts.push([px + w / 2 + Math.cos(ang) * w / 2 * (0.9 + 0.1 * Math.sin(ang * 3)), py + Math.sin(ang) * 16]); }
      fill(pts);
    }
  },
  texture(ctx) {
    // glowing speckles on the atoll tops: the lumen in Lumen Atolls
    const { c, R, W, H } = ctx;
    for (let i = 0; i < 160; i++) {
      const x = R() * W, y = R() * H;
      c.fillStyle = R() < .5 ? 'rgba(160,255,220,.20)' : 'rgba(120,220,255,.14)';
      c.beginPath(); c.arc(x, y, 1.5 + R() * 3.5, 0, TAU); c.fill();
    }
  },
});
