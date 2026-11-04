/* Biome: The Emerald Tangle
   One biome per folder. The game finds this folder by itself; nothing else needs editing.
   Every field is explained in the README ("Adding biomes").
   A very lush, overgrown jungle: giant kapok trees, tree ferns, banana plants, monsteras,
   heliconias, bromeliads, orchids, a rafflesia or two, mossy logs, hanging lianas,
   water lilies and glowing bell flowers — plus its own blossom-drift weather,
   painted jungle backdrop, canopy tree line and mossy ground texture. */
/* iPad / low-tier guard: this biome is by far the heaviest on sprite memory
   (14 custom props x 3 variants at high sprite scale). On tablets we thin the
   plant cover and let world.js drop the sprite scale + cache cap so the whole
   jungle stays inside Safari's canvas memory budget. */
const PAD = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && !/iPhone|Android/.test(navigator.userAgent)) || (typeof deviceTier !== 'undefined' && deviceTier === 0);
Biome({
  order: 340, // position in the menu list (lower comes first)
  name: "The Emerald Tangle",  // shown in menus
  style: "ground",  // 'float' islands, 'ground' a big field, 'sea' islands in water
  weather: "bloomdrift",  // its own drifting petals + seeds (newWeather below)
  wind: 10,  // pushes particles and bullets a little
  pits: 1,
  puddles: 2,
  pond: true,  // a jungle pool for the water lilies
  skyT: "#8cc8a8",  // sky colour at the top
  skyB: "#f2edc4",  // sky colour at the horizon
  sun: "#fffbe0",  // sun / moon colour
  far: ["#7aae82", "#578a64"],  // distant hills, back to front
  top: "#578a36",  // grass / topsoil
  mid: "#46622c",  // dirt
  deep: "#24341c",  // deep rock
  cap: "#9cc45c",  // edge highlight
  props: [
    ["kapok", 0.4], ["treefern", 0.5], ["banana", 0.6], ["monstera", 0.55],
    ["heliconia", 0.5], ["bromeliad", 0.5], ["orchid", 0.4], ["rafflesia", 0.12],
    ["mosslog", 0.18], ["lianas", 0.22], ["fern", 0.6], ["bush", 0.4],
    ["rock", 0.18], ["mushroom", 0.2],
  ],
  under: [
    ["monstera", 0.3], ["orchid", 0.5], ["bromeliad", 0.4], ["glowbell", 0.35],
    ["giantlily", 0.15], ["fern", 0.7], ["tallgrass", 0.6], ["flowers", 0.4],
  ],
  bgTrees: "jungle",  // drawn by the treeLine hook below
  cloud: "#f2f8e4",
  water: "#3f9a82",
  shallow: "#8fe0b8",
  grass: PAD ? 0.9 : 1.45,
  grassCol: ["#578a36", "#a8c860"],
  leaf: ["#7fae58", "#a4c868", "#e8a0b8"],
  leafTone: "#5d8a44",
  critters: PAD ? 5 : 8,  // little animals that wander around (fewer on iPad)
  treeDensity: 1.15,  // how many trees
  plantDensity: PAD ? 1.4 : 2.4,  // a very large amount of small plants (thinned on iPad)
  thingDensity: PAD ? 1.05 : 1.8,  // room for all the landmarks as well
  haze: 0.15,
  newWeather: {
    // petals and winged seeds drifting down through the canopy
    bloomdrift: {
      label: 'Blossom drift', density: 120,
      spawn(p) { p.kind = Math.random() < .3 ? 1 : 0; },  // 0 petal, 1 seed
      update(p, dt) {
        p.x += (Math.sin(p.t * 1.3 + p.r) * 18 + wind() * .3) * dt;
        p.y += (26 + 22 * p.s) * dt;
        p.r += dt * (p.kind ? 2.4 : .8) * (p.s - .5);
        return hitGround(p);
      },
      draw(c, P) {
        c.fillStyle = 'rgba(244,196,214,.9)';
        c.beginPath();
        for (const p of P) { if (p.kind) continue; const r = 2.2 * p.s + 1; c.moveTo(p.x + r, p.y); c.arc(p.x, p.y, r, 0, TAU); }
        c.fill();
        c.strokeStyle = 'rgba(96,84,52,.8)'; c.lineWidth = 1;
        c.beginPath();
        for (const p of P) { if (!p.kind) continue; const r = 2.8 * p.s; c.moveTo(p.x - r, p.y); c.lineTo(p.x + r, p.y); c.moveTo(p.x, p.y - r * .5); c.lineTo(p.x, p.y + r * .5); }
        c.stroke();
      },
    },
  },
  newProps: {
    // The jungle giant: buttress roots, a tall trunk and a layered canopy dotted with blossoms.
    kapok: { w: 210, h: 250, tree: 1, mat: 'wood', leafy: 1, leafAnchor: [.5, .3], hp: 150, art(sp, d) {
      const { R, th, cx, h } = d;
      const wood = mix('#6d5238', th.deep, .14), lean = (R() - .5) * 9;
      inkPiece(sp, { fill: wood, light: lit(wood, .22), rim: 3.4, shape: x => {
        taperTrunk(x, cx, h, h * .3, 17, 9, lean, 1.2);
        // buttress roots
        for (const s of [-1, 1]) {
          x.beginPath(); x.moveTo(cx + s * 8, h); x.quadraticCurveTo(cx + s * 26, h - 30, cx + s * 46, h - 4);
          x.quadraticCurveTo(cx + s * 40, h + 2, cx + s * 20, h + 2); x.closePath(); x.fill();
        }
        branch(x, cx + lean * .6, h * .62, cx - 54, h * .42, 9, 3, 14);
        branch(x, cx + lean * .8, h * .52, cx + 52, h * .36, 8, 2.6, -12);
      }, detail: x => {
        marks(x, R, 11, cx - 8, h * .55, cx + 6, h - 16, rgbaC(INK, .34), 1.1, 9, '|');
        x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(cx - 40, h - 8); x.quadraticCurveTo(cx, h - 2, cx + 42, h - 6); x.stroke();
      } });
      const clumps = [[cx - 62, 78, 32], [cx - 30, 52, 34], [cx + 4, 44, 38], [cx + 38, 56, 33], [cx + 66, 80, 27], [cx - 6, 92, 30], [cx - 40, 110, 24]];
      inkPiece(sp, { layer: 'leaf', fill: '#3a5c30', light: '#63854a', dark: '#2c4725', rim: 6, line: 2.1, box: [cx - 96, 10, cx + 96, 132], shape: x => {
        for (const [px, py, r] of clumps) lobed(x, px, py, r, r * .82, 6, R, .24, R() * TAU);
      }, detail: x => { marks(x, R, 16, cx - 76, 18, cx + 76, 126, rgbaC(INK, .3), 1.2, 7, 'c'); } });
      const front = [[cx - 46, 66, 22], [cx - 12, 46, 26], [cx + 22, 46, 28], [cx + 48, 68, 21], [cx + 4, 80, 24], [cx - 30, 92, 19], [cx + 38, 94, 18]];
      inkPiece(sp, { layer: 'leaf', fill: '#6fa848', light: '#c4e88a', dark: '#4a7a34', rim: 4.5, line: 1.8, box: [cx - 90, 8, cx + 90, 122], shape: x => {
        for (const [px, py, r] of front) lobed(x, px, py, r, r * .85, 6, R, .2, R() * TAU);
      }, detail: x => {
        marks(x, R, 22, cx - 60, 20, cx + 60, 116, rgbaC(INK, .26), 1.2, 8, 'c');
        // pink blossoms scattered through the canopy
        dots(x, R, 9, cx - 66, 26, cx + 66, 104, '#f3b6c4', 1.6, 3);
        dots(x, R, 5, cx - 40, 30, cx + 40, 70, '#ffe4ea', 1.2, 2.2);
      } });
    } },

    // A tree fern: slender scarred trunk topped with a crown of arching fronds.
    treefern: { w: 110, h: 185, tree: 1, mat: 'wood', leafy: 1, leafAnchor: [.5, .25], hp: 60, art(sp, d) {
      const { R, th, cx, h } = d;
      const trunk = mix('#5c4a38', th.deep, .1), lean = (R() - .5) * 10;
      inkPiece(sp, { fill: trunk, light: lit(trunk, .2), rim: 3, shape: x => {
        taperTrunk(x, cx, h, h * .18, 9, 5, lean, 1.3);
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1;
        for (let yy = h - 14; yy > h * .25; yy -= 11) { x.beginPath(); x.moveTo(cx - 6 + (h - yy) * .004, yy); x.lineTo(cx + 6 - (h - yy) * .004, yy - 3); x.stroke(); }
      } });
      const topY = h * .17, n = 7 + (R() * 3 | 0);
      inkPiece(sp, { layer: 'leaf', fill: '#4e7c34', light: '#9cc458', rim: 2.6, line: 1.6, box: [cx - 55, 0, cx + 55, h * .3], shape: x => {
        for (let i = 0; i < n; i++) {
          const a = -Math.PI + (i + .5) / n * Math.PI, L = 44 + R() * 12;
          const frond = (t) => [cx + lean + Math.cos(a) * L * t, topY + Math.sin(a) * L * .55 * t + t * t * 14];
          // leaflets along each frond
          for (let k = 0; k <= 9; k++) {
            const t = k / 9, [fx, fy] = frond(t), ll = (1 - Math.abs(t - .35)) * 7 + 2;
            x.save(); x.translate(fx, fy); x.rotate(a + Math.PI / 2 + (k % 2 ? .35 : -.35));
            x.beginPath(); x.ellipse(0, 0, 2.2, ll, 0, 0, TAU); x.fill(); x.restore();
          }
        }
      }, detail: x => {
        x.fillStyle = '#6d9a44'; x.beginPath(); x.ellipse(cx + lean, topY - 4, 5, 7, 0, 0, TAU); x.fill();
      } });
    } },

    // A banana plant: a stubby stem with a fan of big paddle leaves and a reddish bud.
    banana: { w: 130, h: 165, mat: 'leaf', leafy: 1, hp: 30, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#8a9a5c', light: '#c0cc7e', rim: 3, shape: x => {
        x.beginPath(); x.ellipse(cx, h - 8, 13, 8, 0, 0, TAU); x.fill();
      } });
      const leaves = [];
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * .92 + (i + .5) / 6 * Math.PI * .84, L = 52 + R() * 22;
        leaves.push([a, L]);
      }
      inkPiece(sp, { layer: 'leaf', fill: '#578a36', light: '#a4c860', rim: 2.8, line: 1.8, shape: x => {
        for (const [a, L] of leaves) {
          const tipX = cx + Math.cos(a) * L, tipY = h - 12 + Math.sin(a) * L * .8 - 6;
          const nx = -(tipY - (h - 12)), ny = tipX - cx, nl = Math.hypot(nx, ny) || 1;
          const wHalf = 8.5;
          x.beginPath(); x.moveTo(cx, h - 12);
          x.quadraticCurveTo((cx + tipX) / 2 + nx / nl * wHalf * 1.6, (h - 12 + tipY) / 2 + ny / nl * wHalf * 1.6, tipX, tipY);
          x.quadraticCurveTo((cx + tipX) / 2 - nx / nl * wHalf * 1.6, (h - 12 + tipY) / 2 - ny / nl * wHalf * 1.6, cx, h - 12);
          x.closePath(); x.fill();
        }
      }, detail: x => {
        for (const [a, L] of leaves) {
          const tipX = cx + Math.cos(a) * L, tipY = h - 12 + Math.sin(a) * L * .8 - 6;
          x.strokeStyle = rgbaC('#2c4720', .5); x.lineWidth = 1.4;
          x.beginPath(); x.moveTo(cx, h - 12); x.quadraticCurveTo((cx + tipX) / 2, (h - 12 + tipY) / 2, tipX, tipY); x.stroke();
        }
      } });
      inkPiece(sp, { layer: 'leaf', fill: '#a45848', light: '#c97a62', rim: 2.4, shape: x => {
        x.save(); x.translate(cx - 4, h - 42); x.rotate(-.5);
        x.beginPath(); x.ellipse(0, 0, 6, 13, 0, 0, TAU); x.fill(); x.restore();
      }, detail: x => { dots(x, R, 4, cx - 10, h - 50, cx + 2, h - 34, rgbaC('#5c2c22', .5), .8, 1.4); } });
    } },

    // Monstera: three big split-leaf philodendron leaves with pale slits.
    monstera: { w: 116, h: 104, mat: 'leaf', leafy: 1, small: 1, hp: 20, art(sp, d) {
      const { R, cx, h } = d;
      // stems are the base layer (drawn first) so the split leaves can sway above them
      inkPiece(sp, { fill: '#578a36', light: '#a4c860', rim: 2, line: 1.4, hatch: false, shape: x => {
        for (const [bx, tx, ty] of [[cx, cx - 30, h - 26], [cx + 4, cx + 30, h - 28], [cx - 2, cx, h - 42]]) {
          x.lineWidth = 3; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx, (h + ty) / 2, tx, ty); x.stroke();
        }
      } });
      const leaf = (lx, ly, r, rot) => inkPiece(sp, { layer: 'leaf', fill: '#3f6e2e', light: '#7fae58', rim: 3, line: 1.7, shape: x => {
        x.save(); x.translate(lx, ly); x.rotate(rot);
        lobed(x, 0, 0, r, r * .62, 5, R, .26);
        x.restore();
      }, detail: x => {
        x.save(); x.translate(lx, ly); x.rotate(rot);
        x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1.1;
        x.beginPath(); x.moveTo(0, r * .5); x.lineTo(0, -r * .55); x.stroke();
        for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(0, -r * .3 + k * r * .28); x.lineTo(s * r * .5, -r * .38 + k * r * .28); x.stroke(); } }
        x.restore();
      } });
      leaf(cx - 30, h - 26, 26, -.35);
      leaf(cx + 30, h - 28, 25, .4);
      leaf(cx, h - 42, 30, -.05);
    } },

    // Heliconia: a drooping zig-zag stem with red-and-gold lobster-claw bracts.
    heliconia: { w: 68, h: 124, mat: 'leaf', leafy: 1, small: 1, hp: 20, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#4e7c34', light: '#9cc458', rim: 2.2, hatch: false, shape: x => {
        x.lineWidth = 3.4; x.beginPath(); x.moveTo(cx, h);
        x.quadraticCurveTo(cx + 2, h - 60, cx + 12, h - 88); x.stroke();
        x.beginPath(); x.ellipse(cx - 14, h - 34, 15, 6, -.5, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(cx - 20, h - 58, 13, 5, -.35, 0, TAU); x.fill();
      } });
      inkPiece(sp, { layer: 'leaf', fill: '#c4482e', light: '#e87a4a', rim: 2.6, line: 1.6, shape: x => {
        const bx = cx + 12; let by = h - 86;
        for (let i = 0; i < 6; i++) {
          const s = i % 2 ? 1 : -1, w = 13 - i * 1.2;
          x.beginPath(); x.moveTo(bx, by);
          x.lineTo(bx + s * w, by - 3); x.lineTo(bx + s * (w - 2), by + 5 - i);
          x.lineTo(bx, by + 4 - i); x.closePath(); x.fill();
          by -= 6.5;
        }
      }, detail: x => { dots(x, R, 6, cx + 4, h - 88, cx + 20, h - 58, '#f2c230', 1, 1.8); } });
    } },

    // A bromeliad: a spiky rosette of leaves with a pink-and-violet heart.
    bromeliad: { w: 88, h: 68, mat: 'leaf', leafy: 1, small: 1, hp: 20, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { layer: 'leaf', fill: '#4e7c34', light: '#8ab455', rim: 2.6, line: 1.6, shape: x => {
        const leaf = (a, L, w) => { x.save(); x.translate(cx, h - 6); x.rotate(a);
          x.beginPath(); x.moveTo(0, 4); x.quadraticCurveTo(-w, -L * .5, 0, -L); x.quadraticCurveTo(w, -L * .5, 0, 4); x.closePath(); x.fill(); x.restore(); };
        // leaves that point downwards must stay short enough to fit the sprite
        // margin below the base (8px), or the tips get cut off
        for (const a of [-2.6, -2.1, -1.35, -.7, -.15, .5, 1.2, 1.9, 2.5]) {
          let L = 34 + R() * 12;
          if (Math.cos(a) < 0) L = Math.min(L, 14 / -Math.cos(a));
          leaf(a, L, 7);
        }
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .28); x.lineWidth = .9;
        for (const a of [-1.8, -.4, .9]) { x.beginPath(); x.moveTo(cx, h - 6); x.lineTo(cx + Math.sin(a) * 36, h - 6 - Math.cos(a) * 38); x.stroke(); }
      } });
      inkPiece(sp, { layer: 'leaf', fill: '#c4588a', light: '#e88ab4', rim: 2.2, line: 1.5, shape: x => {
        x.beginPath(); x.ellipse(cx, h - 40, 7, 11, 0, 0, TAU); x.fill();
      }, detail: x => { dots(x, R, 5, cx - 4, h - 46, cx + 4, h - 34, '#f2e0f0', .8, 1.5); } });
    } },

    // An epiphytic orchid: thick aerial roots, a slim stem and two spotted blossoms.
    orchid: { w: 54, h: 78, mat: 'leaf', leafy: 1, small: 1, hp: 10, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#8aa05c', light: '#c0cc7e', rim: 1.8, hatch: false, shape: x => {
        x.lineWidth = 2.4; x.beginPath(); x.moveTo(cx - 3, h); x.quadraticCurveTo(cx - 8, h - 10, cx - 6, h - 18); x.stroke();
        x.beginPath(); x.moveTo(cx + 3, h); x.quadraticCurveTo(cx + 9, h - 9, cx + 7, h - 16); x.stroke();
        x.lineWidth = 2; x.beginPath(); x.moveTo(cx, h - 14); x.quadraticCurveTo(cx + 1, h - 34, cx, h - 44); x.stroke();
      } });
      const bloom = (bx, by) => {
        inkPiece(sp, { layer: 'leaf', fill: '#f6e8ee', light: '#ffffff', rim: 2, line: 1.4, hatch: false, shape: x => {
          for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + .3; x.beginPath(); x.ellipse(bx + Math.cos(a) * 6.5, by + Math.sin(a) * 6.5, 5.5, 3, a, 0, TAU); x.fill(); }
        } });
        inkPiece(sp, { layer: 'leaf', fill: '#c4588a', light: '#e88ab4', rim: 1.6, line: 1.2, hatch: false, shape: x => {
          x.beginPath(); x.ellipse(bx, by + 2, 3.4, 4.4, 0, 0, TAU); x.fill();
        }, detail: x => { dots(x, R, 3, bx - 2, by, bx + 2, by + 4, '#f2c230', .7, 1.2); } });
      };
      bloom(cx, h - 48); bloom(cx + 6, h - 60);
    } },

    // The rafflesia: a giant five-lobed speckled flower lying flat on the jungle floor.
    rafflesia: { w: 98, h: 64, mat: 'leaf', small: 1, hp: 30, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#4e7c34', light: '#8ab455', rim: 2.4, line: 1.6, hatch: false, shape: x => {
        for (const [ox, s] of [[-30, -1], [28, 1]]) { x.beginPath(); x.ellipse(cx + ox, h - 6, 14, 5, s * .3, 0, TAU); x.fill(); }
      } });
      inkPiece(sp, { fill: '#b03a2e', light: '#d4644e', rim: 3.2, line: 2, shape: x => {
        lobed(x, cx, h - 22, 36, 24, 5, R, .14);
      }, detail: x => {
        dots(x, R, 16, cx - 30, h - 40, cx + 30, h - 8, 'rgba(246,232,200,.85)', .9, 2);
        x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1;
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .2; x.beginPath(); x.moveTo(cx + Math.cos(a) * 8, h - 22 + Math.sin(a) * 6); x.lineTo(cx + Math.cos(a) * 30, h - 22 + Math.sin(a) * 19); x.stroke(); }
      } });
      inkPiece(sp, { fill: '#7c2c22', light: '#a44a38', rim: 2.4, line: 1.6, shape: x => {
        x.beginPath(); x.ellipse(cx, h - 22, 9, 6, 0, 0, TAU); x.fill();
      }, detail: x => { dots(x, R, 8, cx - 6, h - 27, cx + 6, h - 17, '#f2d0b0', .7, 1.3); } });
    } },

    // A mossy fallen log you can stand on, with tiny mushrooms on its back.
    mosslog: { w: 164, h: 60, mat: 'wood', hp: 90, solid: 1, art(sp, d) {
      const { R, th, cx, h } = d;
      const wood = mix('#7c5c40', th.deep, .12);
      inkPiece(sp, { fill: wood, light: lit(wood, .22), rim: 3, shape: x => {
        x.beginPath(); x.moveTo(cx - 74, h - 4); x.quadraticCurveTo(cx - 78, h - 30, cx - 66, h - 34);
        x.lineTo(cx + 62, h - 36); x.quadraticCurveTo(cx + 76, h - 32, cx + 72, h - 6); x.closePath(); x.fill();
        // root end disc
        x.beginPath(); x.ellipse(cx - 68, h - 19, 7, 15, 0, 0, TAU); x.fill();
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1.1;
        for (const xx of [-38, -6, 26, 52]) { x.beginPath(); x.moveTo(cx + xx, h - 33); x.quadraticCurveTo(cx + xx + 2, h - 20, cx + xx, h - 7); x.stroke(); }
        x.strokeStyle = rgbaC(lit(wood, .4), .8); x.lineWidth = 1;
        x.beginPath(); x.ellipse(cx - 68, h - 19, 4, 8, 0, 0, TAU); x.stroke();
      } });
      inkPiece(sp, { fill: '#6d9a44', light: '#a8c860', rim: 2.2, line: 1.5, hatch: false, shape: x => {
        lobed(x, cx - 40, h - 35, 22, 7, 5, R, .3);
        lobed(x, cx + 6, h - 37, 18, 6, 5, R, .3);
        lobed(x, cx + 44, h - 35, 15, 5, 4, R, .3);
      }, detail: x => { dots(x, R, 10, cx - 60, h - 40, cx + 58, h - 30, '#8ab455', .8, 1.6); } });
      inkPiece(sp, { fill: '#d8c8a8', light: '#f0e4cc', rim: 1.6, line: 1.2, hatch: false, shape: x => {
        for (const [mx, mh] of [[cx - 24, 9], [cx + 30, 7]]) {
          x.fillRect(mx - 1.6, h - 40, 3.2, mh);
          x.beginPath(); x.ellipse(mx, h - 40, 5, 3, 0, Math.PI, TAU); x.fill();
        }
      }, detail: x => { x.fillStyle = rgbaC(INK, .5); x.beginPath(); x.arc(cx - 24, h - 42, 1.1, 0, TAU); x.arc(cx + 30, h - 41, 1, 0, TAU); x.fill(); } });
    } },

    // Hanging lianas: a snapped branch with leafy vines trailing down.
    lianas: { w: 132, h: 175, mat: 'leaf', leafy: 1, leafAnchor: [.5, .06], hp: 25, art(sp, d) {
      const { R, th, cx, h } = d;
      const wood = mix('#7c5c40', th.deep, .12);
      inkPiece(sp, { fill: wood, light: lit(wood, .2), rim: 2.8, shape: x => {
        x.beginPath(); x.moveTo(cx - 56, 2); x.quadraticCurveTo(cx, -6, cx + 54, 0);
        x.quadraticCurveTo(cx + 58, 4, cx + 50, 8); x.quadraticCurveTo(cx, 14, cx - 52, 7); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(cx - 50, 5); x.quadraticCurveTo(cx - 66, 18, cx - 60, 34); x.lineTo(cx - 54, 32); x.quadraticCurveTo(cx - 58, 18, cx - 46, 9); x.closePath(); x.fill();
      } });
      const vines = [];
      for (let i = 0; i < 4; i++) vines.push({ x0: cx - 48 + i * 26 + R() * 8, len: 60 + R() * (h - 80), ph: R() * 10 });
      inkPiece(sp, { layer: 'leaf', fill: '#4e7c34', rim: 0, line: 1.8, hatch: false, shape: x => {
        for (const v of vines) {
          x.lineWidth = 2.2; x.beginPath(); x.moveTo(v.x0, 8);
          const midX = v.x0 + Math.sin(v.ph) * 8;
          x.quadraticCurveTo(midX, 8 + v.len * .5, v.x0 + Math.sin(v.ph * 2) * 5, 8 + v.len); x.stroke();
          for (let k = 0; k < 5; k++) {
            const t = .2 + k / 5 * .75, lx = v.x0 + Math.sin(v.ph) * 8 * (1 - t) * 2 * t + Math.sin(v.ph * 2) * 5 * t, ly = 8 + v.len * t;
            x.beginPath(); x.ellipse(lx, ly, 2, 4.5, .3 * (k % 2 ? 1 : -1), 0, TAU); x.fill();
          }
        }
      }, detail: x => {
        dots(x, R, 8, cx - 50, 20, cx + 50, h - 20, '#6fa848', 1.4, 2.6);
      } });
    } },

    // Glowing bell flowers: curving stems with luminous teal bells.
    glowbell: { w: 58, h: 88, mat: 'leaf', leafy: 1, small: 1, hp: 10, glow: 'rgba(150,255,205,1)', glowAt: [0, 55], art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#578a36', light: '#a4c860', rim: 2, hatch: false, shape: x => {
        const stem = (bx, tx, ty) => { x.lineWidth = 2.2; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + (tx - bx) * .3, (h + ty) / 2, tx, ty); x.stroke(); };
        stem(cx, cx - 8, h - 46); stem(cx + 2, cx + 10, h - 58); stem(cx - 2, cx - 2, h - 66);
      } });
      inkPiece(sp, { layer: 'leaf', fill: '#3fb89a', light: '#8fe8c8', rim: 2, line: 1.4, hatch: false, shape: x => {
        const bell = (bx, by) => { x.beginPath(); x.moveTo(bx - 4, by); x.quadraticCurveTo(bx - 5, by + 9, bx, by + 11); x.quadraticCurveTo(bx + 5, by + 9, bx + 4, by); x.closePath(); x.fill(); };
        bell(cx - 8, h - 46); bell(cx + 10, h - 58); bell(cx - 2, h - 66);
      }, detail: x => {
        x.fillStyle = 'rgba(240,255,248,.9)';
        for (const [bx, by] of [[cx - 8, h - 35], [cx + 10, h - 47], [cx - 2, h - 55]]) { x.beginPath(); x.arc(bx, by, 1.4, 0, TAU); x.fill(); }
      } });
    } },

    // A giant water lily: a big pad with an upturned rim and one pink blossom.
    giantlily: { w: 96, h: 46, mat: 'leaf', leafy: 1, small: 1, hp: 15, art(sp, d) {
      const { R, cx, h } = d;
      inkPiece(sp, { fill: '#4e8a4a', light: '#8ec06a', rim: 2.6, line: 1.7, shape: x => {
        x.beginPath(); x.ellipse(cx, h - 10, 40, 15, 0, 0, TAU); x.fill();
        // notch
        x.fillStyle = 'rgba(31,28,36,.28)';
        x.beginPath(); x.moveTo(cx, h - 12); x.lineTo(cx + 12, h - 22); x.lineTo(cx + 14, h - 8); x.closePath(); x.fill();
      }, detail: x => {
        x.strokeStyle = rgbaC(INK, .25); x.lineWidth = .9;
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; x.beginPath(); x.moveTo(cx + Math.cos(a) * 6, h - 10 + Math.sin(a) * 2); x.lineTo(cx + Math.cos(a) * 36, h - 10 + Math.sin(a) * 13); x.stroke(); }
      } });
      inkPiece(sp, { layer: 'leaf', fill: '#f3b6c4', light: '#ffe4ea', rim: 2, line: 1.4, hatch: false, shape: x => {
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.beginPath(); x.ellipse(cx - 14 + Math.cos(a) * 5, h - 24 + Math.sin(a) * 5, 4.4, 2.6, a, 0, TAU); x.fill(); }
      } });
      inkPiece(sp, { layer: 'leaf', fill: '#f2c230', light: '#ffe27a', rim: 1.6, line: 1.2, hatch: false, shape: x => {
        x.beginPath(); x.arc(cx - 14, h - 24, 2.6, 0, TAU); x.fill();
      } });
    } },
  },

  // a misty jungle wall behind the hills, with light shafts through the canopy
  background(ctx) {
    const { x, R, W, H, M, big, fbm } = ctx;
    for (const [col, k] of [['rgba(66,104,70,.55)', 0], ['rgba(46,78,52,.7)', 1]]) {
      const base = H * .6 + k * H * .11;
      x.fillStyle = col; x.beginPath(); x.moveTo(-M, H + M);
      for (let px = -M; px <= W + M; px += 26) x.lineTo(px, base - (fbm(px * .003, T.seed + 50 + k) * .5 + .5) * (160 + k * 95));
      x.lineTo(W + M, H + M); x.closePath(); x.fill();
    }
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (big ? 7 : 4); i++) {
      const sx = R() * W, w0 = 26 + R() * 54, w1 = w0 * (1.9 + R());
      const g = x.createLinearGradient(0, -M, 0, H);
      g.addColorStop(0, 'rgba(255,250,205,.09)'); g.addColorStop(.65, 'rgba(255,250,205,.02)'); g.addColorStop(1, 'rgba(255,250,205,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(sx - w0 / 2, -M); x.lineTo(sx + w0 / 2, -M); x.lineTo(sx + w1, H); x.lineTo(sx - w1, H); x.closePath(); x.fill();
    }
    x.restore();
  },

  // the jungle tree line: round canopy blobs with vines trailing down
  treeLine(ctx) {
    const { x, R, th, M, col, edge, gyAt } = ctx;
    for (let px = -M; px < W + M;) {
      const gy = gyAt(px), hh = 42 + R() * 46;
      x.strokeStyle = col; x.lineWidth = 3.4;
      x.beginPath(); x.moveTo(px, gy); x.quadraticCurveTo(px + 3, gy - hh * .5, px + 6, gy - hh); x.stroke();
      x.fillStyle = mix(th.cap || '#7fae58', th.far[1], .3); x.strokeStyle = edge; x.lineWidth = 1.6;
      x.beginPath(); x.ellipse(px + 6, gy - hh, hh * .52, hh * .34, 0, 0, TAU); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(px + 6 - hh * .32, gy - hh * .8, hh * .3, hh * .22, 0, 0, TAU); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(px + 6 + hh * .32, gy - hh * .82, hh * .28, hh * .2, 0, 0, TAU); x.fill(); x.stroke();
      if (R() < .65) {
        x.strokeStyle = edge; x.lineWidth = 1.4;
        const vx = px + 6 + (R() - .5) * 26;
        x.beginPath(); x.moveTo(vx, gy - hh * .8); x.quadraticCurveTo(vx + 6, gy - hh * .4, vx, gy - 6); x.stroke();
      }
      px += 34 + R() * 30;
    }
  },

  // moss patches and tiny wildflowers along the ground
  texture(ctx) {
    const { c, R } = ctx;
    for (let x = 60; x < W - 60; x += 66 + R() * 58) {
      const gx = clamp(x / CELL | 0, 0, GW - 1); let gy = 0;
      while (gy < GH && !T.grid[gy * GW + gx]) gy++;
      if (gy < 2 || gy > GH - 3) continue;
      const sy = gy * CELL; if (sy < H * .3) continue;
      if (waterAt(x, sy)) continue;
      c.fillStyle = 'rgba(78,124,52,.4)';
      lobed(c, x, sy + 3, 14 + R() * 10, 4 + R() * 3, 5, R, .3);
      if (R() < .6) { c.fillStyle = ['#fff8e0', '#f3b6c4', '#e8d0f0'][(R() * 3) | 0]; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + (R() - .5) * 30, sy + 3 + R() * 6, .8 + R() * 1.3, 0, TAU); c.fill(); } }
    }
  },
});
