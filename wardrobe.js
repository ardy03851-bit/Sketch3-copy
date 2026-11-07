'use strict';
/* =====================================================================
   INKBRAWL WARDROBE — accessories + real cloth.
   Loaded after build.js (before modes.js / menu.js).

   · A full wardrobe: hats, eyewear, back pieces and trails, all drawn in
     the same hand-inked style as the rest of the game (no image assets).
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
  ],
  eyes: [
    { id: 'none', n: 'Natural', d: 'Two dots, as intended.' },
    { id: 'shades', n: 'Shades', d: 'Deal with it.' },
    { id: 'round', n: 'Round glasses', d: 'Very scholarly.' },
    { id: 'mono', n: 'Monocle', d: 'Quite so.' },
    { id: 'patch', n: 'Eye patch', d: 'Depth perception is overrated.' },
    { id: 'star', n: 'Star eyes', d: 'Full of ideas.' },
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
  load() { try { Object.assign(this.gear, JSON.parse(getCookie('ib_wardrobe') || '{}')); for (const s of GEAR_SLOTS) if (!gearById(s, this.gear[s]).id || !GEAR[s].some(g => g.id === this.gear[s])) this.gear[s] = 'none'; } catch (e) { } },
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
function clothUpdate(p, dt) {
  const g = gearOf(p), kind = g.back;
  if (kind !== 'cape' && kind !== 'cape-long' && kind !== 'scarf') { Cloth.drop(p); return; }
  const scarf = kind === 'scarf';
  const n = scarf ? 7 : (kind === 'cape-long' ? 12 : 9);
  const segLen = scarf ? 5 : 7.5;
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
  // pin the root, then relax distances (two passes keeps it stable and cheap)
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
function clothDraw(c, p, col) {
  const g = gearOf(p), kind = g.back;
  if (kind !== 'cape' && kind !== 'cape-long' && kind !== 'scarf') return;
  const ch = Cloth.chains.get(p); if (!ch) return;
  const scarf = kind === 'scarf';
  const w0 = scarf ? 7 : 13, w1 = scarf ? 3 : 8.5;
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
  gr.addColorStop(0, shadeC(col, .12)); gr.addColorStop(1, shadeC(col, -.34));
  c.fillStyle = gr; c.fill();
  c.lineWidth = 2.4; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  // a couple of fold lines so it reads as fabric
  c.strokeStyle = rgbaC(INK, .25); c.lineWidth = 1.1;
  for (const f of [.35, .68]) {
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
  c.restore();
}

/* ---------- accessory art (all procedural, ink & paper) ---------- */
function drawHat(c, kind, x, y, col, t, seed) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  const F = (fill) => { c.fillStyle = fill; };
  const S = () => { c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); };
  const wob = Math.sin(t * 6 + seed) * .8;
  switch (kind) {
    case 'tophat':
      c.translate(0, -1 + wob * .4); F('#2b2731'); c.beginPath(); c.ellipse(0, -2, 17, 4.5, 0, 0, TAU); c.fill(); S();
      c.fillRect(-10, -22, 20, 20); c.strokeRect(-10, -22, 20, 20);
      F(col); c.fillRect(-10, -9, 20, 5); c.strokeRect(-10, -9, 20, 5); break;
    case 'cap':
      c.translate(0, -2 + wob * .3); F(col); c.beginPath(); c.arc(0, 0, 13, Math.PI, 0); c.closePath(); c.fill(); S();
      c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-20, 2, -21, 6); c.lineTo(-13, 4); c.closePath(); F(shadeC(col, -.15)); c.fill(); S(); break;
    case 'crown':
      c.translate(0, -4); F('#ffd36b'); c.beginPath(); c.moveTo(-11, 3); c.lineTo(-11, -6); c.lineTo(-5.5, -1); c.lineTo(0, -9); c.lineTo(5.5, -1); c.lineTo(11, -6); c.lineTo(11, 3); c.closePath(); c.fill(); S();
      c.fillStyle = '#e055d8'; for (const cx of [-6, 0, 6]) { c.beginPath(); c.arc(cx, 0, 1.6, 0, TAU); c.fill(); } break;
    case 'wizard':
      c.translate(0, -2); c.rotate(Math.sin(t * 1.4 + seed) * .04); F('#4a3f63'); c.beginPath(); c.moveTo(-13, 2); c.quadraticCurveTo(-4, -12, 2, -26); c.quadraticCurveTo(8, -12, 13, 2); c.closePath(); c.fill(); S();
      F('#ffd36b'); for (const [sx, sy] of [[-5, -4], [2, -12], [-1, -18]]) { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; c.lineTo(sx + Math.cos(a) * 2.6, sy + Math.sin(a) * 2.6); c.lineTo(sx + Math.cos(a2) * 1.2, sy + Math.sin(a2) * 1.2); } c.closePath(); c.fill(); } break;
    case 'party':
      c.translate(0, -1); c.rotate(Math.sin(t * 2 + seed) * .05); F(col); c.beginPath(); c.moveTo(-8, 2); c.lineTo(0, -24); c.lineTo(8, 2); c.closePath(); c.fill(); S();
      F('#fff8ec'); for (let i = 0; i < 3; i++) { c.save(); c.beginPath(); c.moveTo(-8 + i * 5.3, 2 - i * 7); c.lineTo(-3 + i * 5.3, 2 - i * 7); c.lineTo(-5.5 + i * 5.3, -2 - i * 7); c.closePath(); c.fill(); c.restore(); }
      c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(0, -26, 2.4, 0, TAU); c.fill(); S(); break;
    case 'halo':
      c.translate(0, -22 + Math.sin(t * 2 + seed) * 1.6); c.strokeStyle = '#ffd36b'; c.lineWidth = 3.4; c.beginPath(); c.ellipse(0, 0, 11, 3.6, 0, 0, TAU); c.stroke();
      c.strokeStyle = rgbaC(INK, .35); c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 11, 3.6, 0, 0, TAU); c.stroke(); break;
    case 'horns':
      F('#e8e0cf'); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 8, 2); c.quadraticCurveTo(s * 14, -6, s * 9, -14); c.quadraticCurveTo(s * 7, -6, s * 4, 1); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); } break;
    case 'bandana':
      F(col); c.beginPath(); c.moveTo(-14, -4); c.quadraticCurveTo(0, -14, 14, -4); c.quadraticCurveTo(0, 2, -14, -4); c.closePath(); c.fill(); S();
      c.beginPath(); c.moveTo(14, -4); c.quadraticCurveTo(20, -2, 22 + Math.sin(t * 5 + seed) * 2, 4); c.lineWidth = 2.2; c.strokeStyle = col; c.stroke();
      F('#fff8ec'); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-9 + i * 6, -6, 1.2, 0, TAU); c.fill(); } break;
    case 'beret':
      c.translate(0, -3); c.rotate(-.12 + Math.sin(t + seed) * .02); F('#3d3a4a'); c.beginPath(); c.ellipse(1, -3, 13, 6.5, 0, 0, TAU); c.fill(); S();
      c.beginPath(); c.moveTo(1, -9); c.lineTo(4, -13); c.lineWidth = 2; c.stroke(); break;
    case 'prop':
      c.translate(0, -3); F(col); c.beginPath(); c.arc(0, 0, 12, Math.PI, 0); c.closePath(); c.fill(); S();
      c.fillStyle = '#fff8ec'; c.beginPath(); c.arc(-6, -3, 1.6, 0, TAU); c.arc(0, -5, 1.6, 0, TAU); c.arc(6, -3, 1.6, 0, TAU); c.fill();
      c.save(); c.translate(0, -12); c.rotate(t * 9 + seed); F('#8e9aa4'); c.fillRect(-1.4, -1.4, 14, 2.8); c.fillRect(-1.4, -1.4, 2.8, 14); c.restore(); break;
    case 'flower':
      c.translate(6, -10); c.rotate(Math.sin(t * 1.6 + seed) * .08); F('#6f9a4f'); c.lineWidth = 2; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(-3, 3, 0, 0); c.stroke();
      F('#f39bb4'); for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; c.beginPath(); c.ellipse(Math.cos(a) * 4.4, Math.sin(a) * 4.4, 3.4, 3.4, 0, 0, TAU); c.fill(); }
      F('#ffd36b'); c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); break;
    case 'bucket':
      c.translate(0, -3); F('#8e9aa4'); c.beginPath(); c.moveTo(-12, 2); c.lineTo(-9, -14); c.lineTo(9, -14); c.lineTo(12, 2); c.closePath(); c.fill(); S();
      c.strokeStyle = rgbaC(INK, .35); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-10.5, -3); c.lineTo(10.5, -3); c.stroke(); break;
    case 'pirate':
      c.translate(0, -3); F('#2b2731'); c.beginPath(); c.moveTo(-15, 2); c.quadraticCurveTo(0, -16, 15, 2); c.quadraticCurveTo(0, 6, -15, 2); c.closePath(); c.fill(); S();
      F('#fff8ec'); c.beginPath(); c.moveTo(-3, -8); c.lineTo(3, -5); c.lineTo(-2, -2); c.closePath(); c.fill(); c.lineWidth = 1.4; c.stroke(); break;
    case 'chef':
      c.translate(0, -4); F('#fff8ec'); c.beginPath(); c.ellipse(0, -12, 13, 9, 0, 0, TAU); c.fill(); S();
      c.fillRect(-8, -12, 16, 10); c.strokeRect(-8, -12, 16, 10); break;
  }
  c.restore();
}
function drawEyes(c, kind, x, y, col, t, seed) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = INK;
  switch (kind) {
    case 'shades':
      c.fillStyle = '#1f1c24'; c.beginPath(); c.roundRect(-9, -3.2, 8, 6, 2); c.roundRect(1, -3.2, 8, 6, 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-8, -2.4, 3, 2); c.fillRect(2, -2.4, 3, 2);
      c.lineWidth = 1.8; c.beginPath(); c.moveTo(-1, 0); c.lineTo(1, 0); c.moveTo(-9, -1.5); c.quadraticCurveTo(-11, -3, -12, -2); c.moveTo(9, -1.5); c.quadraticCurveTo(11, -3, 12, -2); c.stroke(); break;
    case 'round':
      c.lineWidth = 1.8; c.beginPath(); c.arc(-5, 0, 4, 0, TAU); c.moveTo(9, 0); c.arc(5, 0, 4, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-1, 0); c.lineTo(1, 0); c.stroke(); break;
    case 'mono':
      c.lineWidth = 1.8; c.beginPath(); c.arc(4, 0, 4.4, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(190,225,235,.5)'; c.beginPath(); c.arc(4, 0, 4.4, 0, TAU); c.fill();
      c.strokeStyle = '#c9a25a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(8, 1); c.quadraticCurveTo(11, 4, 9, 7); c.stroke(); break;
    case 'patch':
      c.fillStyle = '#1f1c24'; c.beginPath(); c.roundRect(-8.5, -3.4, 7, 6.6, 2); c.fill();
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(3, -5, 9, -3); c.stroke(); break;
    case 'star':
      c.fillStyle = '#ffd36b'; for (const sx of [-5, 5]) { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; c.lineTo(sx + Math.cos(a) * 3.4, Math.sin(a) * 3.4); c.lineTo(sx + Math.cos(a2) * 1.5, Math.sin(a2) * 1.5); } c.closePath(); c.fill(); } break;
  }
  c.restore();
}
function drawBack(c, kind, p, col, t) {
  switch (kind) {
    case 'wings': {
      const flap = Math.sin(t * 7 + p.seed) * .35 + (p.grounded ? 0 : .5);
      c.save(); c.translate(p.x - p.face * 4, p.y - 4); c.lineJoin = 'round';
      for (const s of [-1, 1]) {
        c.save(); c.rotate(s * (.55 + flap * .4) - (s === 1 ? 0 : 0));
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-14 * s, -18, -26 * s, -8); c.quadraticCurveTo(-16 * s, -2, -12 * s, 8); c.quadraticCurveTo(-6 * s, 4, 0, 0);
        c.fillStyle = '#f4ecdc'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
        c.restore();
      }
      c.restore(); break;
    }
    case 'pack': {
      c.save(); c.translate(p.x - p.face * 13, p.y + 2); c.lineJoin = 'round';
      c.fillStyle = '#b98652'; c.beginPath(); c.roundRect(-7, -10, 14, 20, 4); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = rgbaC(INK, .4); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-5, -4); c.lineTo(5, -4); c.moveTo(-5, 2); c.lineTo(5, 2); c.stroke();
      c.restore(); break;
    }
    case 'quiver': {
      c.save(); c.translate(p.x - p.face * 11, p.y); c.rotate(-.5 * p.face); c.lineJoin = 'round';
      c.fillStyle = '#8d6542'; c.beginPath(); c.roundRect(-5, -11, 10, 22, 4); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = '#c9b48a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, -9); c.lineTo(2, -15); c.moveTo(1, -9); c.lineTo(5, -14); c.stroke();
      c.restore(); break;
    }
    case 'shield': {
      c.save(); c.translate(p.x - p.face * 14, p.y + 1); c.lineJoin = 'round';
      c.fillStyle = '#8e9aa4'; c.beginPath(); c.moveTo(0, -12); c.lineTo(10, -8); c.lineTo(10, 4); c.quadraticCurveTo(10, 10, 0, 13); c.quadraticCurveTo(-10, 10, -10, 4); c.lineTo(-10, -8); c.closePath(); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = rgbaC(INK, .4); c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 13); c.moveTo(-10, -2); c.lineTo(10, -2); c.stroke();
      c.restore(); break;
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
    if (dt > 0) clothUpdate(p, dt);
    clothDraw(c, p, p.color);
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
  stopSession = function (k) { Cloth.reset(); return _stopW(k); };
  const _startRoundW = startRound;
  startRound = function () { Cloth.reset(); return _startRoundW(); };
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
        <div class="row"><button class="btn small gold" id="wdRandom">Surprise me</button><button class="btn primary" id="wdDone"><svg class="ico"><use href="#i-play"/></svg>Done</button></div>
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
    x.save(); x.translate(36, 46); x.lineJoin = 'round';
    x.fillStyle = '#c9b48a'; x.strokeStyle = INK; x.lineWidth = 2.4;
    x.beginPath(); x.roundRect(-13, -22, 26, 36, 7); x.fill(); x.stroke();
    x.fillStyle = INK; x.beginPath(); x.arc(-4.5, -12, 2, 0, TAU); x.arc(4.5, -12, 2, 0, TAU); x.fill();
    x.restore();
    const col = '#d9573b';
    if (this.slot === 'hat') drawHat(x, id, 36, 24, col, 1.2, 3);
    else if (this.slot === 'eyes') drawEyes(x, id, 36, 34, col, 1.2, 3);
    else if (this.slot === 'back') {
      if (id === 'cape' || id === 'cape-long' || id === 'scarf') {
        const fake = { x: 36, y: 46, face: 1, seed: 3, color: col };
        const n = id === 'scarf' ? 7 : id === 'cape-long' ? 12 : 9, seg = id === 'scarf' ? 5 : 7.5;
        const pts = [{ x: 31, y: 34 }]; for (let i = 1; i < n; i++) pts.push({ x: 31 - i * seg * .35, y: 34 + i * seg * .9 });
        const save = Cloth.chains; Cloth.chains = new Map([[fake, { n, pts, ax: 31, ay: 34, last: 0 }]]);
        clothDraw(x, fake, col); Cloth.chains = save;
      } else drawBack(x, id, { x: 36, y: 46, face: 1, seed: 3, grounded: true }, col, 1.2);
    } else if (id !== 'none') {
      for (const [px, py, pc] of [[20, 20, '#ffd36b'], [48, 30, '#f7b6c8'], [32, 52, id === 'ink' ? '#1f1c24' : '#f39bb4']]) { x.fillStyle = pc; x.beginPath(); x.arc(px, py, 2.6, 0, TAU); x.fill(); }
    }
  },
  /* live rotating preview of your own fighter wearing the outfit */
  preview(t) {
    const cv = $('#wdCanvas'); if (!cv) return;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 300, 340);
    const col = UI.color, cx = 150, cy = 250;
    const g = Wardrobe.gear;
    const fake = { x: cx, y: cy, face: Math.sin(t * .7) > 0 ? 1 : -1, vx: 0, vy: 0, seed: 3, color: col, grounded: true, alive: true };
    // cloth preview
    const kind = g.back;
    if (kind === 'cape' || kind === 'cape-long' || kind === 'scarf') {
      const n = kind === 'scarf' ? 7 : kind === 'cape-long' ? 12 : 9, seg = kind === 'scarf' ? 5 : 7.5;
      let ch = this.pch;
      if (!ch || ch.kind !== kind) { ch = this.pch = { kind, pts: [] }; for (let i = 0; i < n; i++) ch.pts.push({ x: cx, y: 34 + i * seg, px: cx, py: 34 + i * seg }); }
      const ax = cx - fake.face * 5, ay = 34;
      for (let i = 1; i < ch.pts.length; i++) { const q = ch.pts[i]; const nx = q.x + (q.x - q.px) * .96 + Math.sin(t * 1.7 + i) * .5, ny = q.y + (q.y - q.py) * .96 + 1.6; q.px = q.x; q.py = q.y; q.x = nx; q.y = ny; }
      ch.pts[0].x = ax; ch.pts[0].y = ay;
      for (let pass = 0; pass < 3; pass++) for (let i = 1; i < ch.pts.length; i++) {
        const a = ch.pts[i - 1], b = ch.pts[i]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || .001, diff = (d - seg) / d;
        if (i > 1) { a.x += dx * diff * .5; a.y += dy * diff * .5; }
        b.x -= dx * diff * .5; b.y -= dy * diff * .5; ch.pts[0].x = ax; ch.pts[0].y = ay;
      }
      const save = Cloth.chains; Cloth.chains = new Map([[fake, { n, pts: ch.pts, ax, ay, last: 0 }]]); clothDraw(x, fake, col); Cloth.chains = save;
    } else drawBack(x, kind, fake, col, t);
    // body (own character art if picked, else the jelly block)
    const ch2 = UI.char && Chars.byId[UI.char];
    x.save(); x.translate(cx, cy); x.scale(1.15, 1.15);
    if (ch2) x.drawImage(ch2.sprite, -HW, -HH, PW, PH);
    else {
      const gr = x.createLinearGradient(-HW, -HH, HW, HH); gr.addColorStop(0, shadeC(col, .24)); gr.addColorStop(.52, col); gr.addColorStop(1, shadeC(col, -.3));
      x.fillStyle = gr; x.strokeStyle = INK; x.lineWidth = 2.6; x.beginPath(); x.roundRect(-HW, -HH, PW, PH, 8); x.fill(); x.stroke();
    }
    x.restore();
    if (g.eyes !== 'none') drawEyes(x, g.eyes, cx + fake.face * 2, cy - 7, col, t, 3);
    if (g.hat !== 'none') drawHat(x, g.hat, cx, cy - HH - 3, col, t, 3);
    // a little floor line
    x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 2; x.setLineDash([5, 6]); x.beginPath(); x.moveTo(50, cy + HH * 1.15 + 8); x.lineTo(250, cy + HH * 1.15 + 8); x.stroke(); x.setLineDash([]);
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
addEventListener('DOMContentLoaded', () => { });
(function wireWardrobe() {
  const go = () => { Audio2.init(); Audio2.play('ui'); WardrobeUI.open(); };
  const t = setInterval(() => {
    const b = $('#bWardrobe');
    if (b) { clearInterval(t); b.addEventListener('click', go); }
    else if (window.UI && UI.cur) { /* title built without the chip: nothing to wire */ }
  }, 200);
  setTimeout(() => clearInterval(t), 10000);
})();
