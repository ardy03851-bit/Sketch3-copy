/* Biome: Paper Peaks
   An origami world: sharp folded-paper ridges with creased ledges
   jutting out of the steep faces. Bright, crisp, and pointy. */
Biome({
  order: 332,
  name: "Paper Peaks",
  inkhold: true,
  style: "ground",
  weather: "sparkle",
  wind: 10,
  boulders: 3,
  skyT: "#dce8f4",
  skyB: "#fdf6e8",
  sun: "#fffaf0",
  far: ["#c4d4e6", "#a8bcd4"],
  top: "#f2ead6",
  mid: "#d8cdb2",
  deep: "#a89a7c",
  cap: "#ffffff",
  props: [["pine", 0.5], ["rock", 0.35], ["lamp", 0.2], ["bush", 0.2]],
  under: [["tallgrass", 0.3], ["flowers", 0.25]],
  bgTrees: "pines",
  cloud: "#ffffff",
  grass: 0.15,
  grassCol: ["#cfc4a4", "#e2d9c0"],
  critters: 2,
  terrain(ctx) {
    const { R, mc, W, H } = ctx;
    const sharp = pts => { mc.beginPath(); mc.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) mc.lineTo(pts[i][0], pts[i][1]); mc.closePath(); mc.fill(); };
    // folded ridges: a zigzag of peaks and valleys across the whole width
    const peaks = [];
    const outline = [[-60, H + 200]];
    let x = -60;
    let first = true;
    while (x < W + 60) {
      const halfBase = first ? 200 + R() * 140 : 130 + R() * 190; first = false;
      const peakY = H - 250 - R() * 330;
      const valleyY = H - 130 - R() * 70;
      outline.push([x + halfBase, peakY]);
      outline.push([x + halfBase * 2, valleyY]);
      peaks.push([x + halfBase, peakY, halfBase]);
      x += halfBase * 2;
    }
    outline.push([W + 60, H + 200]);
    sharp(outline);
    // creased ledges: small triangles jutting out of the steep faces
    for (const [px, py] of peaks) {
      const n = 1 + (R() * 2 | 0);
      for (let i = 0; i < n; i++) {
        const side = R() < .5 ? -1 : 1;
        const ly = py + 100 + R() * 220;
        if (ly > H - 200) continue;
        const lw = 46 + R() * 64;
        sharp([[px, ly - 16], [px + side * lw, ly + 14], [px, ly + 44]]);
      }
    }
    // a couple of floating paper cranes' perches high up
    const nP = ctx.big ? 7 : 4;
    for (let i = 0; i < nP; i++) {
      const w = 120 + R() * 130;
      const px = 90 + R() * (W - 180 - w);
      const py = 170 + R() * 240;
      sharp([[px, py], [px + w, py - 14], [px + w * .8, py + 34], [px + w * .2, py + 40]]);
    }
  },
  texture(ctx) {
    // creases: light fold lines running down the faces
    const { c, R, W, H } = ctx;
    c.strokeStyle = 'rgba(120,105,80,.16)'; c.lineWidth = 1.2; c.lineCap = 'round';
    for (let i = 0; i < 110; i++) {
      let x = R() * W, y = 200 + R() * (H - 300);
      c.beginPath(); c.moveTo(x, y);
      const n = 3 + (R() * 3 | 0);
      for (let k = 0; k < n; k++) { x += (R() - .5) * 70; y += 30 + R() * 60; c.lineTo(x, y); }
      c.stroke();
    }
  },
});
