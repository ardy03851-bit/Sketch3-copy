'use strict';
/* =====================================================================
   INKBRAWL WARDROBE — accessories + real cloth.
   Loaded after build.js (before modes.js / menu.js).

   · A full wardrobe: hats, eyewear, back pieces and trails, all drawn in
     the same hand-inked style as the rest of the game (no image assets)
     — with proper shading, highlights and little animations.
   · Capes and scarves are proper cloth: a verlet particle chain pinned to
     the fighter's neck, solved every frame with gravity, wind, the
     fighter's own motion and terrain, then skinned into a ribbon.
   · The wardrobe screen (from the title screen) shows a live preview on
     your own character. Bots pick random outfits so the arena feels lived-in.
   Everything is saved in the ib_wardrobe cookie on this device.
   ===================================================================== */

/* ---------- the catalogue ---------- */
const GEAR_SLOTS = ['hat', 'eyes', 'back', 'trail'];
const GEAR = {
  hat: [
    { id: 'none', n: 'Bare head', d: 'The classic look.' },
    { id: 'tophat', n: 'Top hat', d: 'Fancy. Slightly haunted.' },
    { id: 'cap', n: 'Snap cap', d: 'Backwards, obviously.' },
    { id: 'crown', n: 'Crown', d: 'For the current champion.' },
    { id: 'wizard', n: 'Wizard hat', d: 'Stars not included.' },
    { id: 'party', n: 'Party hat', d: 'Every day is a party.' },
    { id: 'halo', n: 'Halo', d: 'Suspiciously shiny.' },
    { id: 'horns', n: 'Horns', d: 'Purely decorative. Probably.' },
    { id: 'bandana', n: 'Bandana', d: 'Ties itself. Magic.' },
    { id: 'beret', n: 'Beret', d: 'Très artistic.' },
    { id: 'prop', n: 'Propeller cap', d: 'Does not help you fly.' },
    { id: 'flower', n: 'Flower', d: 'Smells like paper.' },
    { id: 'bucket', n: 'Bucket', d: 'A helmet, basically.' },
    { id: 'pirate', n: 'Pirate hat', d: 'Yar.' },
    { id: 'chef', n: 'Chef hat', d: 'Soup of the day: ink.' },
    { id: 'viking', n: 'Viking helm', d: 'Raid included.' },
    { id: 'ninja', n: 'Ninja band', d: 'Silent but stylish.' },
    { id: 'cowboy', n: 'Cowboy hat', d: 'Howdy, partner.' },
    { id: 'straw', n: 'Straw sun hat', d: 'SPF 50, hand-woven.' },
    { id: 'cans', n: 'Headphones', d: 'Lo-fi beats to brawl to.' },
    { id: 'cat', n: 'Cat ears', d: 'Mood: feline.' },
  ],
  eyes: [
    { id: 'none', n: 'Natural', d: 'Two dots, as intended.' },
    { id: 'shades', n: 'Shades', d: 'Deal with it.' },
    { id: 'round', n: 'Round glasses', d: 'Very scholarly.' },
    { id: 'mono', n: 'Monocle', d: 'Quite so.' },
    { id: 'patch', n: 'Eye patch', d: 'Depth perception is overrated.' },
    { id: 'star', n: 'Star eyes', d: 'Full of ideas.' },
    { id: 'goggles', n: 'Goggles', d: 'Aviator approved.' },
    { id: 'heart', n: 'Heart specs', d: 'Sees the good in everyone.' },
    { id: 'visor', n: 'Cyber visor', d: 'Target acquired.' },
  ],
  back: [
    { id: 'none', n: 'Nothing', d: 'Free and unburdened.' },
    { id: 'cape', n: 'Hero cape', d: 'Real cloth. Flies when you run.' },
    { id: 'cape-long', n: 'Long cape', d: 'Extra dramatic cloth.' },
    { id: 'scarf', n: 'Scarf', d: 'Two cloth tails, very cozy.' },
    { id: 'wings', n: 'Paper wings', d: 'Flap flap.' },
    { id: 'pack', n: 'Backpack', d: 'Packed with spare pencils.' },
    { id: 'quiver', n: 'Quiver', d: 'Arrows sold separately.' },
    { id: 'shield', n: 'Back shield', d: 'Watch your back.' },
    { id: 'sword', n: 'Back katana', d: 'For emergencies.' },
    { id: 'jet', n: 'Jetpack', d: 'Purely cosmetic. Mostly.' },
  ],
  trail: [
    { id: 'none', n: 'No trail', d: 'Clean and quiet.' },
    { id: 'sparkle', n: 'Sparkles', d: 'Leave a little magic.' },
    { id: 'ink', n: 'Ink drips', d: 'Very on brand.' },
    { id: 'petals', n: 'Petals', d: 'Springtime brawler.' },
  ],
};
const gearById = (slot, id) => GEAR[slot].find(g => g.id === id) || GEAR[slot][0];

/* ---------- persistence ---------- */
const Wardrobe = {
  gear: { hat: 'none', eyes: 'none', back: 'none', trail: 'none' },
  load() { try { Object.assign(this.gear, JSON.parse(getCookie('ib_wardrobe') || '{}')); for (const s of GEAR_SLOTS) if (!GEAR[s].some(g => g.id === this.gear[s])) this.gear[s] = 'none'; } catch (e) { } },
  save() { setCookie('ib_wardrobe', JSON.stringify(this.gear)); },
};
Wardrobe.load();

/* bots dress themselves — stable per id so they keep their outfit */
function botGear(id) {
  const R = rng([...String(id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 7));
  const pick = slot => { const g = GEAR[slot]; return g[1 + Math.floor(R() * (g.length - 1))].id; };
  return { hat: pick('hat'), eyes: pick('eyes'), back: pick('back'), trail: R() < .25 ? pick('trail') : 'none' };
}
function gearOf(p) {
  if (!p) return Wardrobe.gear;
  if (p.isBot) return p._gear || (p._gear = botGear(p.id));
  return p.id === G.myId ? Wardrobe.gear : (p._gear || (p._gear = { hat: 'none', eyes: 'none', back: 'none', trail: 'none' }));
}

/* ---------- cloth: verlet chains, one per cape/scarf wearer ---------- */
const Cloth = {
  chains: new Map(),
  get(p, n, segLen) {
    let ch = this.chains.get(p);
    if (!ch || ch.n !== n) {
      ch = { n, pts: [], last: null, ax: p.x, ay: p.y };
      for (let i = 0; i < n; i++) ch.pts.push({ x: p.x, y: p.y - 10 + i * segLen, px: p.x, py: p.y - 10 + i * segLen });
      this.chains.set(p, ch);
    }
    return ch;
  },
  drop(p) { this.chains.delete(p); },
  reset() { this.chains.clear(); },
};
const CLOTH_LEN = { cape: [6, 6.5], 'cape-long': [9, 7], scarf: [6, 5] }; // [segments, seg length]
const clothOf = kind => CLOTH_LEN[kind] || null;
function clothUpdate(p, dt, gear) {
  const g = gear || gearOf(p), kind = g.back;
  const spec = clothOf(kind);
  if (!spec) { Cloth.drop(p); return; }
  const [n, segLen] = spec;
  const scarf = kind === 'scarf';
  const ch = Cloth.get(p, n, segLen);
  // anchor: the neck, a touch behind the fighter's facing direction
  const ax = p.x - p.face * 5, ay = p.y - HH * .55;
  const vx = (ax - ch.ax) / Math.max(dt, .001), vy = (ay - ch.ay) / Math.max(dt, .001);
  ch.ax = ax; ch.ay = ay;
  const wind = (Env.wind || 0) * .55 + Math.sin(Env.time * 2.1 + p.seed) * 14;
  const g2 = scarf ? 900 : 1350; // scarves are light, capes hang heavier
  for (let i = 1; i < ch.pts.length; i++) {
    const q = ch.pts[i];
    const nx = q.x + (q.x - q.px) * .985 + (wind * .012 - vx * .055) * dt * 60 * .016 * 60;
    const ny = q.y + (q.y - q.py) * .985 + g2 * dt * dt * 60;
    q.px = q.x; q.py = q.y; q.x = nx; q.y = ny;
  }
  // pin the root, then relax distances (a few passes keeps it stable and cheap)
  const r0 = ch.pts[0]; r0.x = ax; r0.y = ay; r0.px = ax; r0.py = ay;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < ch.pts.length; i++) {
      const a = ch.pts[i - 1], b = ch.pts[i];
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || .001;
      const diff = (d - segLen) / d;
      const k = i === 1 ? 1 : .5;
      if (i > 1) { a.x += dx * diff * k; a.y += dy * diff * k; }
      b.x -= dx * diff * (i === 1 ? 1 : k); b.y -= dy * diff * (i === 1 ? 1 : k);
    }
    r0.x = ax; r0.y = ay;
  }
  // keep the cloth out of the ground
  for (let i = 1; i < ch.pts.length; i++) {
    const q = ch.pts[i];
    if (solidAt(q.x, q.y)) { let gy = q.y; for (let k = 0; k < 8 && solidAt(q.x, gy); k++) gy -= 4; q.y = gy; q.x += (Math.random() - .5) * 2; }
    q.x = clamp(q.x, 4, W - 4); q.y = Math.min(q.y, H - 4);
  }
}
function clothDraw(c, p, col, gear) {
  const g = gear || gearOf(p), kind = g.back;
  const spec = clothOf(kind);
  if (!spec) return;
  const ch = Cloth.chains.get(p); if (!ch) return;
  const [n0] = spec;
  const scarf = kind === 'scarf';
  const w0 = scarf ? 7 : 15, w1 = scarf ? 3.4 : 10;
  const n = ch.pts.length;
  // ribbon polygon: offset each point perpendicular to the chain direction
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = ch.pts[Math.max(0, i - 1)], b = ch.pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (n - 1));
    left.push([ch.pts[i].x - dy * w, ch.pts[i].y + dx * w]);
    right.push([ch.pts[i].x + dy * w, ch.pts[i].y - dx * w]);
  }
  c.save();
  c.beginPath();
  c.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) c.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
  c.closePath();
  const gr = c.createLinearGradient(ch.pts[0].x, ch.pts[0].y, ch.pts[n - 1].x, ch.pts[n - 1].y);
  gr.addColorStop(0, shadeC(col, .18)); gr.addColorStop(.62, col); gr.addColorStop(1, shadeC(col, -.36));
  c.fillStyle = gr; c.fill();
  c.lineWidth = 2.4; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  // fold lines so it reads as fabric
  c.strokeStyle = rgbaC(INK, .22); c.lineWidth = 1.1;
  for (const f of [.3, .55, .8]) {
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const q = ch.pts[i];
      const a = ch.pts[Math.max(0, i - 1)], b = ch.pts[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = lerp(w0, w1, t) * (0.6 * Math.sin(t * 9 + p.seed) * .5 + f - .2);
      const x = q.x - dy * w, y = q.y + dx * w;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  }
  // hem: a darker band along the bottom edge
  const hi = n - 1, hp = ch.pts[hi];
  const a = ch.pts[Math.max(0, hi - 1)];
  let dx = hp.x - a.x, dy = hp.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  c.beginPath();
  c.moveTo(hp.x - dy * w1 * .9, hp.y + dx * w1 * .9);
  c.lineTo(hp.x + dy * w1 * .9, hp.y - dx * w1 * .9);
  c.strokeStyle = rgbaC(INK, .5); c.lineWidth = 3; c.stroke();
  // gold clasp at the neck
  if (!scarf) {
    c.fillStyle = '#ffd36b'; c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.arc(ch.pts[0].x, ch.pts[0].y + 1, 3, 0, TAU); c.fill(); c.stroke();
  }
  c.restore();
}

/* ---------- accessory art (all procedural, ink & paper) ----------
   Every piece gets a vertical light gradient (light top-left, darker
   bottom-right), a paper-tone highlight and a crisp ink outline, so the
   whole catalogue reads like it was drawn by the same hand. */
const PAPER = '#f6efdd';
function hatFill(c, y0, y1, base) {
  const g = c.createLinearGradient(0, y0, y0 + (y1 - y0) * .4, y1);
  g.addColorStop(0, shadeC(base, .3)); g.addColorStop(.5, base); g.addColorStop(1, shadeC(base, -.24));
  return g;
}
function sheen(c, x, y, w, h, a) { c.save(); c.globalAlpha = a == null ? .35 : a; c.fillStyle = '#fffdf6'; c.beginPath(); c.ellipse(x, y, w, h, -.5, 0, TAU); c.fill(); c.restore(); }
function star5(c, x, y, r, fill) {
  c.save(); c.translate(x, y); c.beginPath();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a2) * r * .45, Math.sin(a2) * r * .45); }
  c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } c.restore();
}
function drawHat(c, kind, x, y, col, t, seed) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  const F = (fill) => { c.fillStyle = fill; };
  const S = (w) => { c.lineWidth = w || 2.2; c.strokeStyle = INK; c.stroke(); };
  const wob = Math.sin(t * 6 + seed) * .8;
  switch (kind) {
    case 'tophat': {
      c.translate(0, -1 + wob * .4); c.rotate(-.04);
      // brim
      F(hatFill(c, -6, 0, '#2b2731')); c.beginPath(); c.ellipse(0, -2, 17, 4.6, 0, 0, TAU); c.fill(); S();
      // crown
      F(hatFill(c, -23, -2, '#2b2731')); c.beginPath(); c.moveTo(-10, -2); c.lineTo(-10.5, -22); c.quadraticCurveTo(0, -25, 10.5, -22); c.lineTo(10, -2); c.closePath(); c.fill(); S();
      sheen(c, -4, -18, 3.4, 5.5, .18);
      // ribbon + gold buckle
      F(shadeC(col, -.1)); c.fillRect(-10.4, -9, 20.8, 5); c.strokeRect(-10.4, -9, 20.8, 5);
      F('#ffd36b'); c.strokeRect(-3, -9.6, 6, 6.2); c.fillRect(-3, -9.6, 6, 6.2); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(-3, -9.6, 6, 6.2);
      break;
    }
    case 'cap': {
      c.translate(0, -2 + wob * .3);
      F(hatFill(c, -13, 0, col)); c.beginPath(); c.arc(0, 0, 13, Math.PI, 0); c.closePath(); c.fill(); S();
      // panel seam + button
      c.strokeStyle = rgbaC(INK, .35); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -13); c.lineTo(0, 0); c.stroke();
      F(shadeC(col, -.28)); c.beginPath(); c.arc(0, -13, 2.2, 0, TAU); c.fill(); S(1.4);
      // backwards brim
      F(hatFill(c, -3, 5, shadeC(col, -.15))); c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-20, 2, -21, 6); c.quadraticCurveTo(-16, 6, -13, 4); c.closePath(); c.fill(); S();
      sheen(c, -5, -8, 4, 2.4, .3);
      break;
    }
    case 'crown': {
      c.translate(0, -4);
      F(hatFill(c, -10, 3, '#ffd36b'));
      c.beginPath(); c.moveTo(-11, 3); c.lineTo(-11, -6); c.lineTo(-5.5, -1); c.lineTo(0, -10); c.lineTo(5.5, -1); c.lineTo(11, -6); c.lineTo(11, 3); c.closePath(); c.fill(); S();
      // gem band
      F('#e055d8'); for (const [cx, cc] of [[-6.5, '#e055d8'], [0, '#6fc3e8'], [6.5, '#e055d8']]) { c.fillStyle = cc; c.beginPath(); c.arc(cx, .6, 1.8, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = rgbaC(INK, .6); c.stroke(); }
      // orbs on the points
      F('#ffd36b'); for (const px of [-11, 0, 11]) { c.beginPath(); c.arc(px, px === 0 ? -11 : -7, 1.7, 0, TAU); c.fill(); S(1.2); }
      sheen(c, -5, -4, 2.6, 1.6, .5);
      break;
    }
    case 'wizard': {
      c.translate(0, -2); c.rotate(Math.sin(t * 1.4 + seed) * .05);
      // floppy brim with a gentle wave
      F(hatFill(c, -6, 4, '#4a3f63')); c.beginPath();
      c.moveTo(-16, 2);
      c.quadraticCurveTo(-8, -3 + Math.sin(t * 2) * 1.2, 0, -2);
      c.quadraticCurveTo(8, -3 + Math.cos(t * 2) * 1.2, 16, 2);
      c.quadraticCurveTo(8, 6, 0, 5); c.quadraticCurveTo(-8, 6, -16, 2);
      c.closePath(); c.fill(); S();
      // crooked cone
      F(hatFill(c, -26, 0, '#4a3f63')); c.beginPath(); c.moveTo(-11, 1); c.quadraticCurveTo(-6, -12, 1, -27); c.quadraticCurveTo(9, -13, 12, 1); c.closePath(); c.fill(); S();
      // band + stars and a moon
      F('#ffd36b'); c.fillRect(-11.2, -3.4, 23, 3.6); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(-11.2, -3.4, 23, 3.6);
      F('#ffd36b'); star5(c, -5, -8, 2.6, '#ffd36b'); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
      star5(c, 3, -15, 2.2, '#ffd36b'); c.stroke();
      c.save(); c.translate(6, -21); c.rotate(.4); c.beginPath(); c.arc(0, 0, 2.4, .6, 4.2); c.fillStyle = '#ffd36b'; c.fill(); c.lineWidth = 1; c.stroke(); c.restore();
      break;
    }
    case 'party': {
      c.translate(0, -1); c.rotate(Math.sin(t * 2 + seed) * .06);
      F(hatFill(c, -24, 2, col)); c.beginPath(); c.moveTo(-8, 2); c.lineTo(0, -24); c.lineTo(8, 2); c.closePath(); c.fill(); S();
      // diagonal candy stripes
      c.save(); c.beginPath(); c.moveTo(-8, 2); c.lineTo(0, -24); c.lineTo(8, 2); c.closePath(); c.clip();
      F(PAPER); for (let i = -4; i < 5; i++) { c.save(); c.translate(i * 6 - 2, 0); c.rotate(.42); c.fillRect(-2, -30, 4, 44); c.restore(); }
      c.restore();
      c.beginPath(); c.moveTo(-8, 2); c.lineTo(0, -24); c.lineTo(8, 2); c.closePath(); S();
      // pompom
      F('#ffd36b'); for (const [px, py, pr] of [[-1.6, -1, 2], [1.6, -1, 2], [0, 1.6, 2], [0, -3.4, 2]]) { c.beginPath(); c.arc(px, py - 26, pr, 0, TAU); c.fill(); }
      c.beginPath(); c.arc(0, -26.6, 3.2, 0, TAU); S(1.6);
      break;
    }
    case 'halo': {
      c.translate(0, -22 + Math.sin(t * 2 + seed) * 1.6);
      // glow
      const gg = c.createRadialGradient(0, 0, 2, 0, 0, 16); gg.addColorStop(0, 'rgba(255,224,130,.55)'); gg.addColorStop(1, 'rgba(255,224,130,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
      c.strokeStyle = '#ffd36b'; c.lineWidth = 3.6; c.beginPath(); c.ellipse(0, 0, 11, 3.6, 0, 0, TAU); c.stroke();
      c.strokeStyle = '#fff6da'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, -.6, 11, 3.6, 0, Math.PI * .15, Math.PI * .85); c.stroke();
      c.strokeStyle = rgbaC(INK, .3); c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 11, 3.6, 0, 0, TAU); c.stroke();
      break;
    }
    case 'horns': {
      for (const s of [-1, 1]) {
        const hg = c.createLinearGradient(s * 4, 2, s * 14, -14); hg.addColorStop(0, '#f2ead8'); hg.addColorStop(1, '#cbbf9f');
        F(hg); c.beginPath(); c.moveTo(s * 8, 2); c.quadraticCurveTo(s * 15, -5, s * 10, -15); c.quadraticCurveTo(s * 7.5, -6, s * 4, 1); c.closePath(); c.fill(); S(2);
        sheen(c, s * 11, -10, 1.6, 3.2, .55);
      }
      break;
    }
    case 'bandana': {
      F(hatFill(c, -12, 2, col)); c.beginPath(); c.moveTo(-14, -4); c.quadraticCurveTo(0, -15, 14, -4); c.quadraticCurveTo(0, 3, -14, -4); c.closePath(); c.fill(); S();
      // knot + two waving tails
      const wv = Math.sin(t * 5 + seed);
      F(shadeC(col, -.15)); c.beginPath(); c.arc(14, -4, 3.4, 0, TAU); c.fill(); S(1.8);
      c.beginPath(); c.moveTo(14, -4); c.quadraticCurveTo(20 + wv * 2, -2, 23 + wv * 3, 4); c.quadraticCurveTo(19 + wv * 2, 3, 15, 0); c.closePath(); F(col); c.fill(); S(1.8);
      c.beginPath(); c.moveTo(15, -2); c.quadraticCurveTo(22 + wv * 2, 1, 24 + wv * 3, 8); c.quadraticCurveTo(19, 6, 15, 2); c.closePath(); F(shadeC(col, -.1)); c.fill(); S(1.8);
      // polka dots
      F(PAPER); for (const [dx, dy] of [[-9, -6], [-3, -8], [3, -8], [9, -6], [-6, -3], [6, -3]]) { c.beginPath(); c.arc(dx, dy, 1.3, 0, TAU); c.fill(); }
      break;
    }
    case 'beret': {
      c.translate(0, -3); c.rotate(-.14 + Math.sin(t + seed) * .02);
      F(hatFill(c, -9, 3, '#c94f42')); c.beginPath(); c.ellipse(1, -3, 13.5, 6.8, 0, 0, TAU); c.fill(); S();
      sheen(c, -4, -6, 4.4, 2, .35);
      // little stem
      c.beginPath(); c.moveTo(1, -9); c.lineTo(4, -14); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
      break;
    }
    case 'prop': {
      c.translate(0, -3);
      F(hatFill(c, -12, 0, col)); c.beginPath(); c.arc(0, 0, 12, Math.PI, 0); c.closePath(); c.fill(); S();
      F(PAPER); for (const [px, py] of [[-6, -4], [0, -6.5], [6, -4]]) { c.beginPath(); c.arc(px, py, 1.7, 0, TAU); c.fill(); }
      // hub + spinning blades with a motion blur disc
      c.save(); c.translate(0, -12);
      c.fillStyle = '#8e9aa4'; c.beginPath(); c.arc(0, 0, 2.4, 0, TAU); c.fill(); S(1.4);
      c.rotate(t * 12 + seed); F('#8e9aa4'); c.fillRect(-1.3, -13, 2.6, 26); c.fillRect(-13, -1.3, 26, 2.6); S(1.2);
      c.restore();
      c.strokeStyle = rgbaC(INK, .18); c.lineWidth = 1; c.beginPath(); c.arc(0, -12, 13, 0, TAU); c.stroke();
      break;
    }
    case 'flower': {
      c.translate(6, -10); c.rotate(Math.sin(t * 1.6 + seed) * .08);
      // stem + leaf
      c.strokeStyle = '#5d8a44'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, 9); c.quadraticCurveTo(-3, 4, 0, 0); c.stroke();
      F('#6f9a4f'); c.beginPath(); c.moveTo(-1, 5); c.quadraticCurveTo(-7, 4, -8, 0); c.quadraticCurveTo(-3, 1, -1, 5); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
      // layered petals
      F('#f39bb4'); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; c.beginPath(); c.ellipse(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 3.5, 3.5, 0, 0, TAU); c.fill(); }
      F('#fde2ea'); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2 + TAU / 12; c.beginPath(); c.ellipse(Math.cos(a) * 4, Math.sin(a) * 4, 2.6, 2.6, 0, 0, TAU); c.fill(); }
      F('#ffd36b'); c.beginPath(); c.arc(0, 0, 2.8, 0, TAU); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
      F('#c98a2e'); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.arc(Math.cos(a) * 1.2, Math.sin(a) * 1.2, .5, 0, TAU); c.fill(); }
      break;
    }
    case 'bucket': {
      c.translate(0, -3);
      const bg = c.createLinearGradient(-12, -14, 12, 2); bg.addColorStop(0, '#b7c2cb'); bg.addColorStop(.5, '#8e9aa4'); bg.addColorStop(1, '#6d7883');
      F(bg); c.beginPath(); c.moveTo(-12, 2); c.lineTo(-9, -14); c.lineTo(9, -14); c.lineTo(12, 2); c.closePath(); c.fill(); S();
      // rim + rivets + a dent highlight
      c.strokeStyle = rgbaC(INK, .4); c.lineWidth = 1.3; c.beginPath(); c.moveTo(-10.5, -3); c.lineTo(10.5, -3); c.stroke();
      F('#d7dee4'); for (const rx of [-8, -3, 2, 7]) { c.beginPath(); c.arc(rx, -10, 1, 0, TAU); c.fill(); }
      sheen(c, -5, -8, 2.6, 3.4, .4);
      break;
    }
    case 'pirate': {
      c.translate(0, -3);
      F(hatFill(c, -14, 4, '#2b2731')); c.beginPath(); c.moveTo(-16, 3); c.quadraticCurveTo(0, -17, 16, 3); c.quadraticCurveTo(0, 7, -16, 3); c.closePath(); c.fill(); S();
      // gold trim
      c.strokeStyle = '#ffd36b'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-14, 4); c.quadraticCurveTo(0, -13, 14, 4); c.stroke();
      // skull & crossbones
      F(PAPER); c.beginPath(); c.arc(0, -4.5, 3.2, 0, TAU); c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
      c.fillRect(-1.6, -2.6, 3.2, 1.2); c.strokeRect(-1.6, -2.6, 3.2, 1.2);
      F(INK); for (const ex of [-1.3, 1.3]) { c.beginPath(); c.arc(ex, -5, .7, 0, TAU); c.fill(); }
      c.strokeStyle = PAPER; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-5, -1.5); c.lineTo(5, -7); c.moveTo(-5, -7); c.lineTo(5, -1.5); c.stroke();
      // feather
      c.save(); c.translate(9, -10); c.rotate(.5); F('#e05555'); c.beginPath(); c.ellipse(0, 0, 2, 6, 0, 0, TAU); c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); c.restore();
      break;
    }
    case 'chef': {
      c.translate(0, -4);
      F(PAPER); c.beginPath(); c.ellipse(0, -12, 13, 9, 0, 0, TAU); c.fill(); S();
      c.fillRect(-8, -12, 16, 11); c.strokeRect(-8, -12, 16, 11);
      // puffs
      F('#fffdf6'); for (const px of [-6, 0, 6]) { c.beginPath(); c.arc(px, -17, 4.4, 0, TAU); c.fill(); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); }
      // band + pleats
      c.strokeStyle = rgbaC(INK, .3); c.lineWidth = 1; for (const px of [-4, 0, 4]) { c.beginPath(); c.moveTo(px, -13); c.lineTo(px, -2); c.stroke(); }
      c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-8, -2); c.lineTo(8, -2); c.stroke();
      sheen(c, -4, -8, 3, 2, .5);
      break;
    }
    case 'viking': {
      c.translate(0, -3);
      const vg = hatFill(c, -13, 3, '#8e9aa4');
      F(vg); c.beginPath(); c.arc(0, 0, 13, Math.PI, 0); c.closePath(); c.fill(); S();
      // nose guard
      F('#7d8893'); c.beginPath(); c.moveTo(-2.4, -8); c.lineTo(2.4, -8); c.lineTo(1.6, 6); c.lineTo(-1.6, 6); c.closePath(); c.fill(); S(1.8);
      // rivets + brow ridge
      F('#d7dee4'); for (const rx of [-8, -4, 4, 8]) { c.beginPath(); c.arc(rx, -6, 1.1, 0, TAU); c.fill(); }
      // horns
      for (const s of [-1, 1]) {
        const hg = c.createLinearGradient(s * 10, -8, s * 18, -20); hg.addColorStop(0, '#f2ead8'); hg.addColorStop(1, '#cbbf9f');
        F(hg); c.beginPath(); c.moveTo(s * 10, -6); c.quadraticCurveTo(s * 18, -8, s * 16, -20); c.quadraticCurveTo(s * 13, -12, s * 8, -3); c.closePath(); c.fill(); S(2);
      }
      sheen(c, -4, -9, 4, 2.2, .35);
      break;
    }
    case 'ninja': {
      c.translate(0, -2 + wob * .2);
      F('#22202b'); c.beginPath(); c.moveTo(-14, -5); c.quadraticCurveTo(0, -9, 14, -5); c.lineTo(14, -1); c.quadraticCurveTo(0, 3, -14, -1); c.closePath(); c.fill(); S();
      // steel plate with scratches
      F('#9aa6b0'); c.beginPath(); c.roundRect(-5.5, -5.4, 11, 5, 1.5); c.fill(); S(1.6);
      c.strokeStyle = rgbaC(INK, .4); c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -4); c.lineTo(3, -2); c.moveTo(-2, -1.5); c.lineTo(4, -4.5); c.stroke();
      // tails streaming behind
      const wv = Math.sin(t * 6 + seed) * 3;
      c.beginPath(); c.moveTo(14, -3); c.quadraticCurveTo(22, -4 + wv, 28, -1 + wv * 1.4); c.lineWidth = 4.5; c.strokeStyle = '#22202b'; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.moveTo(14, -1); c.quadraticCurveTo(21, 2 + wv, 26, 5 + wv); c.lineWidth = 3.5; c.stroke();
      break;
    }
    case 'cowboy': {
      c.translate(0, -2 + wob * .25);
      // wide brim with a dip front and back
      F(hatFill(c, -5, 4, '#a9743f')); c.beginPath();
      c.moveTo(-18, 1); c.quadraticCurveTo(-8, -3, 0, -1); c.quadraticCurveTo(8, -3, 18, 1);
      c.quadraticCurveTo(8, 6, 0, 6); c.quadraticCurveTo(-8, 6, -18, 1); c.closePath(); c.fill(); S();
      // crown with a centre crease
      F(hatFill(c, -12, 0, '#b98349')); c.beginPath(); c.moveTo(-9, 1); c.quadraticCurveTo(-9, -10, -4, -11); c.lineTo(4, -11); c.quadraticCurveTo(9, -10, 9, 1); c.closePath(); c.fill(); S();
      c.strokeStyle = rgbaC(INK, .5); c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -11); c.lineTo(0, -6); c.stroke();
      // band + star
      F('#6b4a26'); c.fillRect(-9, -2.4, 18, 3); c.strokeRect(-9, -2.4, 18, 3);
      star5(c, 0, -1, 2.2, '#ffd36b'); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
      sheen(c, -5, -8, 3, 1.8, .3);
      break;
    }
    case 'straw': {
      c.translate(0, -2 + wob * .25);
      F(hatFill(c, -6, 5, '#e8cf8f')); c.beginPath(); c.ellipse(0, 1, 17, 5, 0, 0, TAU); c.fill(); S();
      // weave arcs on the brim
      c.strokeStyle = rgbaC(INK, .28); c.lineWidth = 1; for (const r of [6, 11, 15]) { c.beginPath(); c.ellipse(0, 1, r, r * .3, 0, 0, Math.PI); c.stroke(); }
      // dome + ribbon
      F(hatFill(c, -11, 1, '#eddaa4')); c.beginPath(); c.arc(0, 1, 9.5, Math.PI, 0); c.closePath(); c.fill(); S();
      F('#c94f42'); c.fillRect(-9.5, -2.6, 19, 3.4); c.strokeRect(-9.5, -2.6, 19, 3.4);
      sheen(c, -3, -7, 3.4, 1.8, .4);
      break;
    }
    case 'cans': {
      c.translate(0, -2);
      // band over the head
      c.strokeStyle = INK; c.lineWidth = 4.5; c.beginPath(); c.arc(0, 2, 15, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.strokeStyle = '#4a4656'; c.lineWidth = 2.6; c.beginPath(); c.arc(0, 2, 15, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
      // ear cups with cushions
      for (const s of [-1, 1]) {
        const cg = c.createLinearGradient(s * 12 - 5, -12, s * 12 + 5, 4); cg.addColorStop(0, shadeC(col, .25)); cg.addColorStop(1, shadeC(col, -.25));
        F(cg); c.beginPath(); c.roundRect(s * 12 - 5, -10, 10, 16, 5); c.fill(); S();
        F('#2b2731'); c.beginPath(); c.roundRect(s * 12 - 3, -7, 6, 10, 3); c.fill();
        sheen(c, s * 12 - 1.5, -6, 1.8, 3, .4);
      }
      break;
    }
    case 'cat': {
      c.translate(0, -1);
      for (const s of [-1, 1]) {
        const wv = Math.sin(t * 3 + seed + (s > 0 ? 1 : 0)) * .1;
        c.save(); c.translate(s * 7, -4); c.rotate(s * (.25 + wv));
        const eg = c.createLinearGradient(0, -12, 0, 2); eg.addColorStop(0, shadeC(col, .3)); eg.addColorStop(1, shadeC(col, -.2));
        F(eg); c.beginPath(); c.moveTo(-5, 2); c.lineTo(-2.5, -12); c.lineTo(3.5, -3); c.closePath(); c.fill(); S(2);
        F('#f7b6c8'); c.beginPath(); c.moveTo(-2.8, 0); c.lineTo(-1.6, -8); c.lineTo(1.8, -2.6); c.closePath(); c.fill();
        c.restore();
      }
      break;
    }
  }
  c.restore();
}
function drawEyes(c, kind, x, y, col, t, seed) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = INK;
  switch (kind) {
    case 'shades': {
      c.fillStyle = '#1f1c24'; c.beginPath(); c.roundRect(-9.5, -3.6, 8.6, 6.8, 2.4); c.roundRect(.9, -3.6, 8.6, 6.8, 2.4); c.fill();
      c.lineWidth = 1.8; c.beginPath(); c.roundRect(-9.5, -3.6, 8.6, 6.8, 2.4); c.roundRect(.9, -3.6, 8.6, 6.8, 2.4); c.stroke();
      // glossy streak + bridge + arms
      c.fillStyle = 'rgba(255,255,255,.4)'; c.save(); c.rotate(-.2); c.fillRect(-8.4, -2.8, 2.4, 5.4); c.fillRect(2, -2.8, 2.4, 5.4); c.restore();
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-8.4, .6, 6.4, 1.6); c.fillRect(2, .6, 6.4, 1.6);
      c.lineWidth = 1.8; c.beginPath(); c.moveTo(-1, -.6); c.quadraticCurveTo(0, -1.6, 1, -.6); c.moveTo(-9.5, -1.5); c.quadraticCurveTo(-11.5, -3.4, -12.5, -2.2); c.moveTo(9.5, -1.5); c.quadraticCurveTo(11.5, -3.4, 12.5, -2.2); c.stroke();
      break;
    }
    case 'round': {
      c.lineWidth = 1.9; c.beginPath(); c.arc(-5, 0, 4.2, 0, TAU); c.moveTo(9.2, 0); c.arc(5, 0, 4.2, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-.8, -.4); c.quadraticCurveTo(0, -1.4, .8, -.4); c.stroke();
      c.beginPath(); c.moveTo(-9.2, -1.2); c.quadraticCurveTo(-11.5, -3, -12.3, -1.6); c.moveTo(9.2, -1.2); c.quadraticCurveTo(11.5, -3, 12.3, -1.6); c.stroke();
      // glare dot
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-6.4, -1.4, 1.1, 0, TAU); c.arc(3.6, -1.4, 1.1, 0, TAU); c.fill();
      break;
    }
    case 'mono': {
      c.lineWidth = 1.9; c.beginPath(); c.arc(4, 0, 4.6, 0, TAU); c.stroke();
      const mg = c.createRadialGradient(2.6, -1.6, .5, 4, 0, 5.4); mg.addColorStop(0, 'rgba(230,250,255,.95)'); mg.addColorStop(.5, 'rgba(190,225,235,.55)'); mg.addColorStop(1, 'rgba(160,200,215,.7)');
      c.fillStyle = mg; c.beginPath(); c.arc(4, 0, 4.6, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(2.4, -1.8, 1.2, 0, TAU); c.fill();
      // gold chain
      c.strokeStyle = '#c9a25a'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(8.4, 1.4); c.quadraticCurveTo(11.5, 4.5, 9.5, 7.5); c.stroke();
      c.strokeStyle = rgbaC(INK, .5); c.lineWidth = .8; c.setLineDash([1.4, 1.6]); c.stroke(); c.setLineDash([]);
      break;
    }
    case 'patch': {
      c.fillStyle = '#1f1c24'; c.beginPath(); c.roundRect(-8.8, -3.6, 7.4, 7.2, 2.2); c.fill();
      c.lineWidth = 1.5; c.beginPath(); c.roundRect(-8.8, -3.6, 7.4, 7.2, 2.2); c.stroke();
      // strap across the other eye
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(-2, -2.2); c.quadraticCurveTo(3.5, -5.4, 9.5, -3.2); c.stroke();
      // stitch marks
      c.strokeStyle = rgbaC('#1f1c24', .9); c.lineWidth = 1; for (const [a, b] of [[-7, -1], [-4.5, -1]]) { c.beginPath(); c.moveTo(a - .8, b - 1.4); c.lineTo(a + .8, b + 1.4); c.stroke(); }
      break;
    }
    case 'star': {
      for (const sx of [-5, 5]) {
        const tw = 1 + Math.sin(t * 5 + seed + sx) * .12;
        c.save(); c.translate(sx, 0); c.scale(tw, tw);
        const sg = c.createRadialGradient(0, -.8, .4, 0, 0, 4.6); sg.addColorStop(0, '#fff3c4'); sg.addColorStop(.6, '#ffd36b'); sg.addColorStop(1, '#e8a53a');
        c.fillStyle = sg; c.beginPath();
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; c.lineTo(Math.cos(a) * 4.2, Math.sin(a) * 4.2); c.lineTo(Math.cos(a2) * 1.9, Math.sin(a2) * 1.9); }
        c.closePath(); c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
        c.restore();
      }
      break;
    }
    case 'goggles': {
      // strap
      c.strokeStyle = '#5b4632'; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, -1); c.quadraticCurveTo(0, -4.5, 12, -1); c.stroke();
      for (const s of [-1, 1]) {
        // brass frame + tinted lens
        c.fillStyle = '#c9a25a'; c.beginPath(); c.roundRect(s * 5.5 - 5, -4.4, 10, 8.8, 4.4); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
        const lg = c.createLinearGradient(s * 5.5 - 4, -4, s * 5.5 + 4, 4); lg.addColorStop(0, 'rgba(200,235,240,.95)'); lg.addColorStop(.45, 'rgba(120,180,195,.75)'); lg.addColorStop(1, 'rgba(90,140,160,.85)');
        c.fillStyle = lg; c.beginPath(); c.roundRect(s * 5.5 - 3.6, -3, 7.2, 6, 3); c.fill();
        c.fillStyle = 'rgba(255,255,255,.75)'; c.save(); c.rotate(-.25); c.fillRect(s * 5.5 - 2.6, -2.4, 2, 4.6); c.restore();
      }
      break;
    }
    case 'heart': {
      for (const s of [-1, 1]) {
        const hg = c.createLinearGradient(s * 5, -4, s * 5, 4); hg.addColorStop(0, '#ffb3c9'); hg.addColorStop(1, '#e0558a');
        c.fillStyle = hg; c.beginPath();
        c.moveTo(s * 5, 3.6); c.quadraticCurveTo(s * 5 - 4.8, -.4, s * 5 - 3.4, -2.6); c.quadraticCurveTo(s * 5 - 1.2, -4.4, s * 5, -1.6);
        c.quadraticCurveTo(s * 5 + 1.2, -4.4, s * 5 + 3.4, -2.6); c.quadraticCurveTo(s * 5 + 4.8, -.4, s * 5, 3.6);
        c.closePath(); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(s * 5 - 1.8, -1.8, 1, 0, TAU); c.fill();
      }
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(-1.2, -.4); c.quadraticCurveTo(0, -1.6, 1.2, -.4); c.stroke();
      break;
    }
    case 'visor': {
      const vg = c.createLinearGradient(0, -4, 0, 4); vg.addColorStop(0, '#8ef0e2'); vg.addColorStop(.5, '#3ec5c9'); vg.addColorStop(1, '#1d8fa8');
      c.fillStyle = vg; c.beginPath(); c.roundRect(-11.5, -4, 23, 8, 4); c.fill();
      c.lineWidth = 1.9; c.strokeStyle = INK; c.stroke();
      // scanline + shine
      c.strokeStyle = 'rgba(20,40,50,.35)'; c.lineWidth = 1; for (const yy of [-2, 0, 2]) { c.beginPath(); c.moveTo(-10, yy); c.lineTo(10, yy); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.5)'; c.save(); c.rotate(-.15); c.fillRect(-8.5, -3, 3.4, 6.2); c.restore();
      // side clips
      c.fillStyle = '#2b2731'; c.beginPath(); c.roundRect(-13.5, -2.6, 3, 5.2, 1.4); c.roundRect(10.5, -2.6, 3, 5.2, 1.4); c.fill();
      break;
    }
  }
  c.restore();
}
function drawBack(c, kind, p, col, t) {
  switch (kind) {
    case 'wings': {
      const flap = Math.sin(t * 7 + p.seed) * .35 + (p.grounded ? 0 : .5);
      c.save(); c.translate(p.x - p.face * 4, p.y - 4); c.lineJoin = 'round';
      for (const s of [-1, 1]) {
        c.save(); c.rotate(s * (.55 + flap * .4));
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-14 * s, -18, -26 * s, -8); c.quadraticCurveTo(-16 * s, -2, -12 * s, 8); c.quadraticCurveTo(-6 * s, 4, 0, 0);
        const wg = c.createLinearGradient(-20 * s, -14, 0, 6); wg.addColorStop(0, '#fdf8ec'); wg.addColorStop(1, '#e8ddc4');
        c.fillStyle = wg; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
        // feather lines
        c.strokeStyle = rgbaC(INK, .3); c.lineWidth = 1.1;
        for (const [fx, fy] of [[-10, -8], [-16, -3], [-12, 3]]) { c.beginPath(); c.moveTo(fx * s, fy); c.quadraticCurveTo(fx * s - 4 * s, fy + 4, fx * s - 2 * s, fy + 8); c.stroke(); }
        c.restore();
      }
      c.restore(); break;
    }
    case 'pack': {
      c.save(); c.translate(p.x - p.face * 13, p.y + 2); c.lineJoin = 'round';
      const pg = c.createLinearGradient(-7, -10, 7, 10); pg.addColorStop(0, '#c99a63'); pg.addColorStop(.55, '#b98652'); pg.addColorStop(1, '#96683c');
      c.fillStyle = pg; c.beginPath(); c.roundRect(-7, -10, 14, 20, 4); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      // flap + buckles + a pencil
      c.fillStyle = '#8a5f36'; c.beginPath(); c.roundRect(-6, -9, 12, 6, 2); c.fill(); c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = rgbaC(INK, .45); c.lineWidth = 1.3; c.beginPath(); c.moveTo(-5, -1); c.lineTo(5, -1); c.moveTo(-5, 4); c.lineTo(5, 4); c.stroke();
      c.fillStyle = '#ffd36b'; for (const bx of [-3.4, 3.4]) { c.beginPath(); c.roundRect(bx - 1.6, -7, 3.2, 4, 1); c.fill(); c.lineWidth = 1.1; c.stroke(); }
      c.save(); c.rotate(.5); c.fillStyle = '#ffd36b'; c.fillRect(-1, -17, 2, 8); c.fillStyle = '#f6b26b'; c.beginPath(); c.moveTo(-1, -17); c.lineTo(0, -20); c.lineTo(1, -17); c.closePath(); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke(); c.restore();
      c.restore(); break;
    }
    case 'quiver': {
      c.save(); c.translate(p.x - p.face * 11, p.y); c.rotate(-.5 * p.face); c.lineJoin = 'round';
      const qg = c.createLinearGradient(-5, -11, 5, 11); qg.addColorStop(0, '#a37c52'); qg.addColorStop(1, '#7c5a37');
      c.fillStyle = qg; c.beginPath(); c.roundRect(-5, -11, 10, 22, 4); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = '#c9b48a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-5, -4); c.lineTo(5, -4); c.stroke();
      // arrows with fletching
      for (const [ox, oy] of [[-2.4, -9], [1.4, -8.4]]) {
        c.strokeStyle = '#c9b48a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + 1.6, oy - 6.5); c.stroke();
        c.fillStyle = '#e05555'; c.beginPath(); c.moveTo(ox, oy - 6.5); c.lineTo(ox - 1.8, oy - 8.4); c.lineTo(ox + .6, oy - 8.8); c.closePath(); c.fill();
        c.fillStyle = '#6f9a4f'; c.beginPath(); c.moveTo(ox + 1.6, oy - 6.5); c.lineTo(ox + .4, oy - 8.6); c.lineTo(ox + 2.8, oy - 8); c.closePath(); c.fill();
      }
      c.restore(); break;
    }
    case 'shield': {
      c.save(); c.translate(p.x - p.face * 14, p.y + 1); c.lineJoin = 'round';
      const sg = c.createLinearGradient(-10, -12, 10, 12); sg.addColorStop(0, '#aab6c0'); sg.addColorStop(.55, '#8e9aa4'); sg.addColorStop(1, '#6d7883');
      c.fillStyle = sg; c.beginPath(); c.moveTo(0, -13); c.lineTo(10, -8); c.lineTo(10, 4); c.quadraticCurveTo(10, 10, 0, 13); c.quadraticCurveTo(-10, 10, -10, 4); c.lineTo(-10, -8); c.closePath(); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = rgbaC(INK, .45); c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -13); c.lineTo(0, 13); c.moveTo(-10, -2); c.lineTo(10, -2); c.stroke();
      // boss + emblem
      c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(0, -2, 3, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#e05555'; c.beginPath(); c.moveTo(0, 7); c.lineTo(2.6, 10); c.lineTo(-2.6, 10); c.closePath(); c.fill();
      c.restore(); break;
    }
    case 'sword': {
      c.save(); c.translate(p.x - p.face * 12, p.y - 2); c.rotate(-.62 * p.face); c.lineJoin = 'round';
      // blade peeking over the shoulder
      const bg2 = c.createLinearGradient(-2, -26, 2, -6); bg2.addColorStop(0, '#f2f5f8'); bg2.addColorStop(.5, '#c3cdd6'); bg2.addColorStop(1, '#9aa6b0');
      c.fillStyle = bg2; c.beginPath(); c.moveTo(-2, -6); c.lineTo(-1.4, -25); c.lineTo(0, -28); c.lineTo(1.4, -25); c.lineTo(2, -6); c.closePath(); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = rgbaC(INK, .35); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -24); c.lineTo(0, -7); c.stroke();
      // guard + wrapped handle
      c.fillStyle = '#c9a25a'; c.beginPath(); c.roundRect(-5, -6.6, 10, 3, 1.4); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#7c2d3e'; c.beginPath(); c.roundRect(-2, -4, 4, 12, 1.6); c.fill(); c.stroke();
      c.strokeStyle = rgbaC('#fff', .35); c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-2, -3 + i * 3); c.lineTo(2, -1.4 + i * 3); c.stroke(); }
      c.fillStyle = '#c9a25a'; c.beginPath(); c.roundRect(-2.4, 8, 4.8, 3, 1.2); c.fill(); c.lineWidth = 1.4; c.stroke();
      c.restore(); break;
    }
    case 'jet': {
      c.save(); c.translate(p.x - p.face * 13, p.y + 1); c.lineJoin = 'round';
      // twin tanks
      for (const s of [-1, 1]) {
        const jg = c.createLinearGradient(s * 4 - 4, -14, s * 4 + 4, 8); jg.addColorStop(0, '#c3cdd6'); jg.addColorStop(.5, '#8e9aa4'); jg.addColorStop(1, '#5f6a74');
        c.fillStyle = jg; c.beginPath(); c.roundRect(s * 4 - 4, -13, 8, 19, 3.4); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
        sheen(c, s * 4 - 1, -9, 1.5, 4, .4);
        // nozzle
        c.fillStyle = '#4a4656'; c.beginPath(); c.moveTo(s * 4 - 3, 6); c.lineTo(s * 4 + 3, 6); c.lineTo(s * 4 + 2, 10); c.lineTo(s * 4 - 2, 10); c.closePath(); c.fill(); c.lineWidth = 1.4; c.stroke();
      }
      // gauge + straps
      c.fillStyle = '#2b2731'; c.beginPath(); c.roundRect(-3, -11, 6, 6, 3); c.fill();
      c.fillStyle = '#6fc3e8'; c.beginPath(); c.arc(0, -8, 2, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = '#0e0d12'; c.stroke();
      c.strokeStyle = '#4a4656'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-8, -9); c.quadraticCurveTo(0, -16, 8, -9); c.stroke();
      c.restore();
      // thrust flames while airborne
      if (!p.grounded && p.alive !== false) {
        const fl = 8 + Math.sin(t * 30 + p.seed) * 4;
        for (const s of [-1, 1]) {
          const fx = p.x - p.face * 13 + s * 4, fy = p.y + 12;
          const fg = c.createLinearGradient(fx, fy, fx, fy + fl);
          fg.addColorStop(0, 'rgba(255,244,180,.95)'); fg.addColorStop(.5, 'rgba(255,160,60,.8)'); fg.addColorStop(1, 'rgba(255,90,40,0)');
          c.fillStyle = fg; c.beginPath(); c.moveTo(fx - 3, fy); c.quadraticCurveTo(fx, fy + fl * 1.2, fx + 3, fy); c.closePath(); c.fill();
        }
        if (Math.random() < .5) FX.add({ k: 'spark', x: p.x - p.face * 13 + (Math.random() - .5) * 8, y: p.y + 14, vx: (Math.random() - .5) * 40, vy: 60 + Math.random() * 80, life: .4, t: 0, color: Math.random() < .5 ? '#ffb347' : '#ff8a3c', w: 1.8 });
      }
      break;
    }
  }
}

/* trails: little particles behind moving fighters */
function gearTrail(p, t, dt) {
  const g = gearOf(p); if (g.trail === 'none' || !p.alive) return;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp < 120 || Math.random() > dt * 14) return;
  const x = p.x - p.face * HW * .7 + (Math.random() - .5) * 8, y = p.y + (Math.random() - .5) * PH * .8;
  if (g.trail === 'sparkle') FX.add({ k: 'spark', x, y, vx: -p.vx * .08, vy: -40 - Math.random() * 60, life: .5, t: 0, color: Math.random() < .5 ? '#ffd36b' : '#fff8ec', w: 1.6 });
  else if (g.trail === 'ink') FX.add({ k: 'spark', x, y, vx: -p.vx * .06, vy: 30 + Math.random() * 50, life: .6, t: 0, color: rgbaC(INK, .8), w: 2.2 });
  else if (g.trail === 'petals') FX.add({ k: 'spark', x, y, vx: -p.vx * .05 + (Math.random() - .5) * 40, vy: 20 + Math.random() * 40, life: .9, t: 0, color: ['#f7b6c8', '#fde2ea', '#f39bb4'][Math.random() * 3 | 0], w: 1.8 });
}

/* ---------- hook into the game ---------- */
{
  const lastT = new Map();
  const _drawPlayerW = drawPlayer;
  drawPlayer = function (c, p, t) {
    if (!p.alive) return;
    const prev = lastT.get(p);
    const dt = prev == null ? .016 : clamp(t - prev, 0, .05);
    lastT.set(p, t);
    const g = gearOf(p);
    // cloth first (behind the body)
    if (dt > 0) clothUpdate(p, dt, g);
    clothDraw(c, p, p.color, g);
    drawBack(c, g.back, p, p.color, t);
    _drawPlayerW(c, p, t);
    // face + hat on top
    const ch = p.char && Chars.byId[p.char];
    const topY = p.y - HH - (ch ? 4 : 2);
    if (g.eyes !== 'none') drawEyes(c, g.eyes, p.x + p.face * 2, p.y - 6, p.color, t, p.seed);
    if (g.hat !== 'none') drawHat(c, g.hat, p.x, topY, p.color, t, p.seed);
    if (dt > 0) gearTrail(p, t, dt);
  };
  const _stopW = stopSession;
  stopSession = function (k) { Cloth.reset(); lastT.clear(); return _stopW(k); };
  const _startRoundW = startRound;
  startRound = function () { Cloth.reset(); lastT.clear(); return _startRoundW(); };
}

/* ---------- the wardrobe screen ---------- */
const WardrobeUI = {
  el: null, slot: 'hat', raf: 0, parts: [],
  ensure() {
    if (this.el) return this.el;
    const s = document.createElement('section'); s.className = 'screen hidden'; s.id = 'wardrobe'; $('#ui').insertBefore(s, $('#hud'));
    s.innerHTML = `<div class="card" style="max-width:640px">
      <h2><svg class="ico" style="width:28px;height:28px"><use href="#i-hat"/></svg>Wardrobe</h2>
      <p class="sub">Dress your scribble. Capes and scarves are real cloth — they swing, trail and catch the wind in battle.</p>
      <div class="wd-tabs" id="wdTabs"></div>
      <div class="wd-main"><div class="wd-preview"><canvas id="wdCanvas" width="300" height="340"></canvas><div class="wd-name" id="wdName"></div><div class="wd-desc" id="wdDesc"></div></div><div class="wd-grid" id="wdGrid"></div></div>
      <div class="row" style="justify-content:space-between;margin-top:14px">
        <button class="btn ghost small" id="wdBack"><svg class="ico"><use href="#i-back"/></svg>Back</button>
        <div class="row"><button class="btn small" id="wdSlot">Shuffle tab</button><button class="btn small gold" id="wdRandom">Surprise me</button><button class="btn primary" id="wdDone"><svg class="ico"><use href="#i-play"/></svg>Done</button></div>
      </div></div>`;
    this.el = s;
    s.addEventListener('click', e => this.click(e));
    this.buildTabs();
    return s;
  },
  buildTabs() {
    const names = { hat: 'Hats', eyes: 'Eyewear', back: 'Back & cloth', trail: 'Trails' };
    $('#wdTabs').innerHTML = GEAR_SLOTS.map(s => `<button data-slot="${s}" class="${this.slot === s ? 'on' : ''}">${names[s]}</button>`).join('');
  },
  renderGrid() {
    const g = Wardrobe.gear[this.slot];
    $('#wdGrid').innerHTML = GEAR[this.slot].map(it => `<button class="wd-item${it.id === g ? ' on' : ''}" data-item="${it.id}"><canvas width="72" height="72" data-ic="${it.id}"></canvas><b>${esc(it.n)}</b><small>${esc(it.d)}</small></button>`).join('');
    for (const cv of $('#wdGrid').querySelectorAll('canvas')) this.drawIcon(cv, cv.dataset.ic);
    this.describe();
  },
  describe() {
    const it = gearById(this.slot, Wardrobe.gear[this.slot]);
    $('#wdName').textContent = it.n; $('#wdDesc').textContent = it.d;
  },
  /* the little catalogue icons: the item drawn on a plain head/body */
  drawIcon(cv, id) {
    const x = cv.getContext('2d'); x.clearRect(0, 0, 72, 72);
    // a soft ground shadow + shaded dummy body
    x.save(); x.translate(36, 46); x.lineJoin = 'round';
    x.fillStyle = 'rgba(30,20,24,.14)'; x.beginPath(); x.ellipse(0, 24, 14, 3.4, 0, 0, TAU); x.fill();
    const bg = x.createLinearGradient(-13, -22, 13, 14); bg.addColorStop(0, '#d8c9a2'); bg.addColorStop(.55, '#c9b48a'); bg.addColorStop(1, '#a8946f');
    x.fillStyle = bg; x.strokeStyle = INK; x.lineWidth = 2.4;
    x.beginPath(); x.roundRect(-13, -22, 26, 36, 7); x.fill(); x.stroke();
    x.fillStyle = INK; x.beginPath(); x.arc(-4.5, -12, 2, 0, TAU); x.arc(4.5, -12, 2, 0, TAU); x.fill();
    x.restore();
    const col = '#d9573b';
    if (this.slot === 'hat') drawHat(x, id, 36, 24, col, 1.2, 3);
    else if (this.slot === 'eyes') drawEyes(x, id, 36, 34, col, 1.2, 3);
    else if (this.slot === 'back') {
      if (clothOf(id)) {
        const fake = { x: 36, y: 46, face: 1, seed: 3, color: col };
        const [n, seg] = clothOf(id);
        const pts = [{ x: 31, y: 34 }]; for (let i = 1; i < n; i++) pts.push({ x: 31 - i * seg * .35, y: 34 + i * seg * .9 });
        const save = Cloth.chains; Cloth.chains = new Map([[fake, { n, pts, ax: 31, ay: 34, last: 0 }]]);
        clothDraw(x, fake, col, { back: id }); Cloth.chains = save;
      } else drawBack(x, id, { x: 36, y: 46, face: 1, seed: 3, grounded: true, alive: false }, col, 1.2);
    } else if (id !== 'none') {
      // trail samples
      if (id === 'sparkle') for (const [px, py, r] of [[20, 22, 3], [46, 30, 4], [30, 52, 3]]) { x.fillStyle = '#ffd36b'; star5(x, px, py, r, '#ffd36b'); x.lineWidth = 1; x.strokeStyle = INK; x.stroke(); }
      else if (id === 'ink') for (const [px, py, r] of [[22, 24, 3], [44, 34, 4], [30, 54, 3]]) { x.fillStyle = '#1f1c24'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); x.beginPath(); x.moveTo(px, py - r); x.lineTo(px, py - r - 4); x.strokeStyle = '#1f1c24'; x.lineWidth = 1.4; x.stroke(); }
      else for (const [px, py, r] of [[20, 24, 4], [46, 32, 5], [30, 54, 4]]) { x.fillStyle = '#f7b6c8'; x.beginPath(); x.ellipse(px, py, r, r * .7, .5, 0, TAU); x.fill(); x.lineWidth = 1.2; x.strokeStyle = INK; x.stroke(); }
    }
  },
  /* live rotating preview of your own fighter wearing the outfit */
  preview(t) {
    const cv = $('#wdCanvas'); if (!cv) return;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 300, 340);
    const col = UI.color, cx = 150, cy = 238, S = 1.5;
    const g = Wardrobe.gear;
    const face = Math.sin(t * .7) > 0 ? 1 : -1;
    const fake = { x: cx, y: cy, face, vx: 0, vy: 0, seed: 3, color: col, grounded: true, alive: true, _gear: g };
    // cloth preview
    const kind = g.back;
    if (clothOf(kind)) {
      const [n, seg] = clothOf(kind);
      const neckY = cy - 16;
      let ch = this.pch;
      if (!ch || ch.kind !== kind) { ch = this.pch = { kind, pts: [] }; for (let i = 0; i < n; i++) ch.pts.push({ x: cx, y: neckY + i * seg, px: cx, py: neckY + i * seg }); }
      const ax = cx - face * 5, ay = neckY;
      const breeze = Math.sin(t * .9) * 2.6; // a gentle side wind so the cloth is visible from behind
      for (let i = 1; i < ch.pts.length; i++) { const q = ch.pts[i]; const nx = q.x + (q.x - q.px) * .96 + Math.sin(t * 1.7 + i) * .5 + breeze, ny = q.y + (q.y - q.py) * .96 + 1.6; q.px = q.x; q.py = q.y; q.x = nx; q.y = ny; }
      ch.pts[0].x = ax; ch.pts[0].y = ay;
      for (let pass = 0; pass < 3; pass++) for (let i = 1; i < ch.pts.length; i++) {
        const a = ch.pts[i - 1], b = ch.pts[i]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || .001, diff = (d - seg) / d;
        if (i > 1) { a.x += dx * diff * .5; a.y += dy * diff * .5; }
        b.x -= dx * diff * .5; b.y -= dy * diff * .5; ch.pts[0].x = ax; ch.pts[0].y = ay;
      }
      const save = Cloth.chains; Cloth.chains = new Map([[fake, { n, pts: ch.pts, ax, ay, last: 0 }]]); clothDraw(x, fake, col, g); Cloth.chains = save;
    } else drawBack(x, kind, fake, col, t);
    // body (own character art if picked, else the jelly block)
    const ch2 = UI.char && Chars.byId[UI.char];
    x.save(); x.translate(cx, cy); x.scale(S, S);
    if (ch2) x.drawImage(ch2.sprite, -HW, -HH, PW, PH);
    else {
      const gr = x.createLinearGradient(-HW, -HH, HW, HH); gr.addColorStop(0, shadeC(col, .24)); gr.addColorStop(.52, col); gr.addColorStop(1, shadeC(col, -.3));
      x.fillStyle = gr; x.strokeStyle = INK; x.lineWidth = 2.6; x.beginPath(); x.roundRect(-HW, -HH, PW, PH, 8); x.fill(); x.stroke();
    }
    x.restore();
    if (g.eyes !== 'none') drawEyes(x, g.eyes, cx + face * 2, cy - 10, col, t, 3);
    if (g.hat !== 'none') drawHat(x, g.hat, cx, cy - HH * S - 4, col, t, 3);
    // a little floor line
    x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 2; x.setLineDash([5, 6]); x.beginPath(); x.moveTo(50, cy + HH * S * 1.15 + 8); x.lineTo(250, cy + HH * S * 1.15 + 8); x.stroke(); x.setLineDash([]);
  },
  loop() {
    const step = ts => {
      this.raf = 0; if (UI.cur !== 'wardrobe') return;
      this.preview(ts / 1000);
      this.raf = requestAnimationFrame(step);
    };
    if (!this.raf) this.raf = requestAnimationFrame(step);
  },
  open() { this.ensure(); this.buildTabs(); this.renderGrid(); UI.show('wardrobe'); this.loop(); },
  click(e) {
    let b;
    if ((b = e.target.closest('[data-slot]'))) { this.slot = b.dataset.slot; Audio2.play('ui'); this.buildTabs(); this.renderGrid(); return; }
    if ((b = e.target.closest('[data-item]'))) { Wardrobe.gear[this.slot] = b.dataset.item; Wardrobe.save(); Audio2.play('ui', undefined, .8, 1.3); this.renderGrid(); return; }
    if (e.target.closest('#wdSlot')) {
      const g = GEAR[this.slot]; Wardrobe.gear[this.slot] = g[Math.floor(Math.random() * g.length)].id;
      Wardrobe.save(); Audio2.play('ui'); this.renderGrid(); return;
    }
    if (e.target.closest('#wdRandom')) {
      for (const s of GEAR_SLOTS) Wardrobe.gear[s] = GEAR[s][Math.floor(Math.random() * GEAR[s].length)].id;
      Wardrobe.save(); Audio2.play('ui'); this.renderGrid(); return;
    }
    if (e.target.closest('#wdDone') || e.target.closest('#wdBack')) { Audio2.play('ui'); UI.show('title'); return; }
  },
};

/* ---------- wardrobe styles ---------- */
{
  const st = document.createElement('style'); st.id = 'wardrobeStyles';
  st.textContent = `
#wardrobe .wd-tabs{display:flex;gap:8px;margin:4px 0 14px;border-bottom:1px solid var(--mm-line);padding-bottom:10px;flex-wrap:wrap}
#wardrobe .wd-tabs button{border:1px solid var(--mm-line);background:transparent;border-radius:9px;padding:8px 14px;font:600 11.5px var(--mm-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--mm-dim);cursor:pointer;transition:background .15s,color .15s,border-color .15s}
#wardrobe .wd-tabs button.on{background:#ece6d8;color:#15121a;border-color:transparent}
#wardrobe .wd-main{display:flex;gap:16px;align-items:flex-start}
#wardrobe .wd-preview{flex:none;width:200px;text-align:center}
#wardrobe #wdCanvas{width:200px;height:226px;border:1px solid var(--mm-line);border-radius:12px;background:rgba(255,255,255,.03)}
#wardrobe .wd-name{font:700 16px var(--mm-disp);color:var(--mm-text);margin-top:8px}
#wardrobe .wd-desc{font:400 12px/1.5 var(--mm-ui);color:var(--mm-faint);min-height:34px}
#wardrobe .wd-grid{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;max-height:44vh;overflow-y:auto;padding:2px;touch-action:pan-y}
#wardrobe .wd-item{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid var(--mm-line);background:rgba(255,255,255,.03);border-radius:10px;padding:6px 4px;cursor:pointer;transition:border-color .13s,background .13s,transform .13s}
#wardrobe .wd-item:hover{border-color:var(--mm-line-2);transform:translateY(-2px)}
#wardrobe .wd-item.on{border-color:var(--mm-accent);background:rgba(226,84,58,.1)}
#wardrobe .wd-item canvas{width:56px;height:56px}
#wardrobe .wd-item b{font:700 12px var(--mm-ui);color:var(--mm-text);text-align:center}
#wardrobe .wd-item small{font:400 10px/1.35 var(--mm-ui);color:var(--mm-faint);text-align:center;min-height:26px}
@media(max-width:640px){#wardrobe .wd-main{flex-direction:column}#wardrobe .wd-preview{width:100%}#wardrobe .wd-grid{max-height:none;width:100%}}
`;
  document.head.append(st);
}

/* wire the wardrobe chip on the title screen */
(function wireWardrobe() {
  const go = () => { Audio2.init(); Audio2.play('ui'); WardrobeUI.open(); };
  const t = setInterval(() => {
    const b = $('#bWardrobe');
    if (b) { clearInterval(t); b.addEventListener('click', go); }
  }, 200);
  setTimeout(() => clearInterval(t), 10000);
})();
