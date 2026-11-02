/* Biome: The Simple Lands
   One biome per folder. The game finds this folder by itself; nothing else needs editing.
   A stepped doodle landscape: flat terraces, little gorges with stone bridges,
   ink spires and floating stepping stones. Every field is explained in the README. */
Biome({
  order: 320, // position in the menu list (lower comes first)
  name: "The Simple Lands",  // shown in menus
  style: "stepped",  // terraces, gorges, bridges and floating stones (see README)
  weather: "petals",  // gentle petals drifting over the terraces
  wind: 14,  // pushes particles and bullets a little
  skyT: "#9ccfe8",  // sky colour at the top
  skyB: "#f7edc9",  // sky colour at the horizon
  sun: "#fff7d6",  // sun / moon colour
  far: ["#b2cfa4", "#8fb58c"],  // distant hills, back to front
  top: "#7fae58",  // grass / topsoil
  mid: "#6d5338",  // dirt
  deep: "#3a2e28",  // deep rock
  cap: "#c1db7c",  // edge highlight
  props: [["simpletree", 0.75], ["daisy", 0.5], ["clover", 0.35], ["cairn", 0.28], ["signpost", 0.2], ["bench", 0.16], ["beehive", 0.16], ["rock", 0.32], ["bush", 0.22], ["lantern", 0.08], ["crate", 0.05]],
  under: [["clover", 0.8], ["daisy", 0.5], ["tallgrass", 0.55], ["flowers", 0.4]],
  bgTrees: "round",  // round doodle silhouettes behind the map
  cloud: "#fffaf0",
  grass: 1.15,
  grassCol: ["#7cab4c", "#bedd78"],
  leaf: ["#fff6d8", "#f7d97e", "#f3b6c4"],
  critters: 7,  // little animals that wander around
  treeDensity: 0.9,  // how many trees
  plantDensity: 1.45,  // how many small plants
  newProps: {
    // A round lollipop tree with a plank swing under the crown.
    simpletree: { w: 152, h: 170, tree: 1, mat: 'wood', leafy: 1, hp: 110, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#8a6a4f', th.deep, .18);
      inkPiece(sp, { fill: wood, rim: 3, shape: x => {
        taperTrunk(x, cx, h, h * .32, 12, 7, 0, .9);
        branch(x, cx, h * .56, cx - 34, h * .38, 6, 2.5, 8);
        branch(x, cx, h * .5, cx + 36, h * .36, 6, 2.5, -8);
      }, detail: x => { marks(x, R, 7, cx - 6, h * .58, cx + 5, h - 8, rgbaC(INK, .36), 1.1, 9, '|'); } });
      const crown = [[cx - 36, h * .22, 25], [cx + 32, h * .24, 26], [cx - 2, h * .14, 31]];
      inkPiece(sp, { fill: '#7fae58', light: '#c0de78', rim: 5, line: 1.9, box: [cx - 70, 0, cx + 70, h * .38], shape: x => {
        for (const [px, py, r] of crown) lobed(x, px, py, r, r * .9, 7, R, .15);
      }, detail: x => {
        marks(x, R, 11, cx - 56, h * .04, cx + 56, h * .32, rgbaC(INK, .28), 1.1, 7, 'c');
        dots(x, R, 8, cx - 50, h * .08, cx + 50, h * .28, '#fff4d2', 1.6, 2.9);
      } });
      inkPiece(sp, { fill: '#6a4a33', rim: 0, line: 1.5, hatch: false, shape: x => {
        x.strokeStyle = '#5a4534'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(cx - 16, h * .26); x.quadraticCurveTo(cx - 24, h * .48, cx - 26, h * .64); x.stroke();
        x.moveTo(cx + 14, h * .25); x.quadraticCurveTo(cx + 6, h * .46, cx + 4, h * .64); x.stroke();
      } });
      inkPiece(sp, { fill: '#c08a4a', light: '#e3b877', rim: 2, line: 1.4, hatch: false, shape: x => {
        x.beginPath(); x.moveTo(cx - 33, h * .63); x.lineTo(cx + 8, h * .63); x.lineTo(cx + 6, h * .68); x.lineTo(cx - 31, h * .68); x.fill();
      } });
    } },

    // A big friendly daisy, the signature flower of the Simple Lands.
    daisy: { w: 56, h: 62, small: 1, mat: 'leaf', leafy: 1, hp: 10, art(sp, d) {
      const { R, cx, h } = d; const top = h * .34 + R() * 6;
      inkPiece(sp, { fill: '#6f9a3a', light: '#9cc458', rim: 2, hatch: false, shape: x => {
        x.lineWidth = 3; x.beginPath(); x.moveTo(cx, h); x.quadraticCurveTo(cx - 4, h * .6, cx, top + 8); x.stroke();
        x.beginPath(); x.ellipse(cx - 9, h * .62, 8, 3.5, -.45, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(cx + 9, h * .74, 8, 3.5, .45, 0, TAU); x.fill();
      } });
      inkPiece(sp, { fill: '#fff8e4', light: '#ffffff', rim: 2, shape: x => {
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * 9, top + Math.sin(a) * 9, 6.5, 3.4, a, 0, TAU); x.fill(); }
      } });
      inkPiece(sp, { fill: '#f2c230', light: '#ffe27a', rim: 2, shape: x => { x.beginPath(); x.arc(cx, top, 5.5, 0, TAU); x.fill(); } });
    } },

    // Low clover tufts that carpet the terrace edges.
    clover: { w: 64, h: 34, small: 1, mat: 'leaf', leafy: 1, hp: 10, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#6f9c46', light: '#a9d17a', rim: 1.6, line: 1.3, hatch: false, shape: x => {
        for (let i = 0; i < 5; i++) {
          const bx = cx + (i - 2) * 10 + (R() - .5) * 4, top = 7 + R() * 10;
          x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + 2, h * .5, bx, top + 4); x.stroke();
          for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * TAU / 3; x.beginPath(); x.ellipse(bx + Math.cos(a) * 4.4, top + Math.sin(a) * 4.4, 4.2, 2.6, a, 0, TAU); x.fill(); }
        }
      } });
    } },

    // A friendly stack of stones with a flower on top.
    cairn: { w: 56, h: 70, mat: 'stone', hp: 130, noBurn: 1, art(sp, d) {
      const { R, th, cx, h } = d; const col = mix('#b7b1a2', th.mid, .22);
      const stones = [[h - 11, 23, 8], [h - 28, 19, 7], [h - 43, 15, 6], [h - 55, 10, 5]];
      inkPiece(sp, { fill: col, light: lit(col, .28), rim: 3, shape: x => {
        for (const [py, rx, ry] of stones) { x.beginPath(); x.ellipse(cx + (R() - .5) * 3, py, rx, ry, (R() - .5) * .12, 0, TAU); x.fill(); }
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .34); x.lineWidth = 1.1;
        for (const [py, rx] of stones) { x.beginPath(); x.moveTo(cx - rx * .4, py + 1); x.quadraticCurveTo(cx + rx * .2, py + 3, cx + rx * .5, py); x.stroke(); }
      } });
      inkPiece(sp, { fill: '#fff8e4', light: '#ffffff', rim: 1.5, line: 1.3, hatch: false, shape: x => {
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * 5.5, h - 64 + Math.sin(a) * 5.5, 4, 2.4, a, 0, TAU); x.fill(); }
        x.fillStyle = '#f2c230'; x.beginPath(); x.arc(cx, h - 64, 3, 0, TAU); x.fill();
      } });
    } },

    // A cheery two-arrow signpost. No reading required.
    signpost: { w: 78, h: 94, mat: 'wood', hp: 45, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#a07a4e', th.mid, .18);
      inkPiece(sp, { fill: wood, rim: 3, shape: x => { x.fillRect(cx - 3, h - 82, 6, 82); },
        detail: x => marks(x, R, 5, cx - 2, h - 74, cx + 2, h - 14, rgbaC(INK, .4), 1, 7, '|') });
      const board = (y, dir) => {
        const l = cx - 32, r = cx + 30;
        inkPiece(sp, { fill: '#d9b071', light: '#f3d49b', rim: 2.6, shape: x => {
          x.beginPath(); x.moveTo(l, y); x.lineTo(r - (dir > 0 ? 6 : 0), y); x.lineTo(r, y + 8); x.lineTo(r - (dir > 0 ? 6 : 0), y + 16); x.lineTo(l, y + 16); x.closePath(); x.fill();
        }, detail: x => {
          x.strokeStyle = rgbaC(INK, .45); x.lineWidth = 1.2;
          x.beginPath(); x.moveTo(l + 6, y + 6); x.lineTo(r - 10, y + 6); x.moveTo(l + 6, y + 11); x.lineTo(r - 16, y + 11); x.stroke();
          if (dir > 0) { x.beginPath(); x.moveTo(r - 9, y + 3); x.lineTo(r - 3, y + 8); x.lineTo(r - 9, y + 13); x.stroke(); }
        } });
      };
      board(h - 80, 1); board(h - 52, -1);
    } },

    // A little park bench with a flower left on it.
    bench: { w: 92, h: 50, mat: 'wood', hp: 50, art(sp, d) {
      const { R, th, cx, h } = d; const wood = mix('#b0814f', th.mid, .16);
      inkPiece(sp, { fill: wood, light: '#dcaf74', rim: 3, shape: x => {
        x.fillRect(cx - 39, h - 18, 78, 7);
        x.fillRect(cx - 39, h - 38, 78, 6);
        x.fillRect(cx - 34, h - 38, 5, 20);
        x.fillRect(cx + 29, h - 38, 5, 20);
        x.fillRect(cx - 36, h - 14, 5, 14);
        x.fillRect(cx + 31, h - 14, 5, 14);
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .34); x.lineWidth = 1.1;
        x.beginPath(); for (const yy of [h - 16, h - 35]) { x.moveTo(cx - 37, yy); x.lineTo(cx + 37, yy); } x.stroke();
      } });
      inkPiece(sp, { fill: '#fff8e4', rim: 1.4, line: 1.2, hatch: false, shape: x => { x.beginPath(); x.ellipse(cx + 30, h - 20, 7, 3.2, -.3, 0, TAU); x.fill(); } });
    } },

    // A sleepy beehive with two very small, very busy bees.
    beehive: { w: 48, h: 48, small: 1, mat: 'soft', hp: 24, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#d9a94a', light: '#f3cf80', rim: 2.6, shape: x => {
        for (let i = 0; i < 4; i++) { const ww = 12 + i * 4, yy = h - 8 - i * 8; x.beginPath(); x.ellipse(cx, yy, ww, 5, 0, 0, TAU); x.fill(); }
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const ww = 12 + i * 4, yy = h - 8 - i * 8; x.beginPath(); x.moveTo(cx - ww, yy); x.quadraticCurveTo(cx, yy + 2, cx + ww, yy); x.stroke(); }
        x.fillStyle = rgbaC(INK, .7); x.beginPath(); x.arc(cx, h - 16, 3, 0, TAU); x.fill();
      } });
      inkPiece(sp, { fill: '#3a3640', rim: 0, line: 1.2, hatch: false, shape: x => {
        for (const [bx, by] of [[cx - 17, h - 34], [cx + 16, h - 42]]) {
          x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + 4, by - 5); x.stroke();
          x.beginPath(); x.ellipse(bx + 3, by - 4, 3, 1.4, -.5, 0, TAU); x.fill();
        }
      } });
    } },
  },
});
