'use strict';
/* =====================================================================
   INKBRAWL BUILD — loaded after world.js.
   Free-form building: planks, beams, stone blocks, metal plates, glass,
   light bulbs, springs and TNT, plus dig and fill tools.
     · Every piece is a real rotated box stamped into the collision grid
       (value 2, terrain is 1), so players, bullets and debris all collide
       with it without any special cases.
     · Pieces have hit points; when they break or lose their support they
       turn into rigid bodies (world.js Bodies) and tumble.
     · The host is authoritative: clients send tool actions through the
       normal 'atk' message, the host validates and emits 'bp' / 'bx'.
   Used by the Tool Box weapon (weapons/toolbox) and the War mode kit.
   ===================================================================== */

const BUILD = {
  plank:    { n: 'Plank',    w: 72,  h: 10, hp: 60,  mat: 'plank',   solid: 1, cost: 1, fill: '#c08a52', light: '#e2b077' },
  beam:     { n: 'Beam',     w: 128, h: 14, hp: 130, mat: 'wood',    solid: 1, cost: 2, fill: '#8d6542', light: '#b88a5c' },
  wall:     { n: 'Stone',    w: 36,  h: 36, hp: 220, mat: 'stone',   solid: 1, cost: 2, fill: '#a39d90', light: '#cfc8b8' },
  brick:    { n: 'Brick',    w: 24,  h: 24, hp: 120, mat: 'stone',   solid: 1, cost: 1, fill: '#b8654a', light: '#dc8d6c' },
  crate:    { n: 'Crate',    w: 34,  h: 34, hp: 80,  mat: 'wood',    solid: 1, cost: 1, fill: '#b98652', light: '#ddb07a' },
  sandbag:  { n: 'Sandbags', w: 48,  h: 18, hp: 280, mat: 'wood',    solid: 1, cost: 2, fill: '#c9b48a', light: '#e6d6ae' },
  metal:    { n: 'Metal',    w: 60,  h: 12, hp: 340, mat: 'metal',   solid: 1, cost: 3, fill: '#8e9aa4', light: '#c9d3da' },
  glass:    { n: 'Glass',    w: 40,  h: 40, hp: 14,  mat: 'crystal', solid: 1, cost: 1, fill: '#bfe2e8', light: '#ffffff', alpha: .62 },
  ladder:   { n: 'Ladder',   w: 28,  h: 76, hp: 50,  mat: 'plank',   solid: 0, cost: 1, fill: '#b07c48', light: '#d6a36e', ladder: 1 },
  bulb:     { n: 'Bulb',     w: 16,  h: 20, hp: 8,   mat: 'crystal', solid: 0, cost: 1, fill: '#ffe39a', light: '#fff8de', glow: 1 },
  torch:    { n: 'Torch',    w: 12,  h: 34, hp: 12,  mat: 'wood',    solid: 0, cost: 1, fill: '#8d6542', light: '#b88a5c', glow: 1, flame: 1 },
  banner:   { n: 'Banner',   w: 30,  h: 64, hp: 40,  mat: 'plank',   solid: 0, cost: 2, fill: '#8d6542', light: '#b88a5c', banner: 1 },
  campfire: { n: 'Campfire', w: 38,  h: 16, hp: 40,  mat: 'wood',    solid: 0, cost: 2, fill: '#8d6542', light: '#b88a5c', glow: 1, flame: 1, heal: 1 },
  spring:   { n: 'Spring',   w: 44,  h: 14, hp: 70,  mat: 'metal',   solid: 1, cost: 2, fill: '#d9573b', light: '#f08a6a', bounce: 1 },
  spikes:   { n: 'Spikes',   w: 44,  h: 12, hp: 90,  mat: 'metal',   solid: 1, cost: 2, fill: '#9aa4ac', light: '#d6dee4', spikes: 1 },
  tnt:      { n: 'TNT',      w: 28,  h: 28, hp: 1,   mat: 'wood',    solid: 1, cost: 3, fill: '#c9452e', light: '#ea7a5a', tnt: 1 },
  fence:    { n: 'Fence',    w: 64,  h: 30, hp: 70,  mat: 'plank',   solid: 1, cost: 1, fill: '#b98a5e', light: '#dcb384' },
  pillar:   { n: 'Pillar',   w: 28,  h: 88, hp: 300, mat: 'stone',   solid: 1, cost: 2, fill: '#a8a29a', light: '#cfc9bb' },
  catwalk:  { n: 'Catwalk',  w: 104, h: 12, hp: 240, mat: 'metal',   solid: 1, cost: 3, fill: '#8e9aa4', light: '#c9d3da' },
  log:      { n: 'Log',     w: 90,  h: 26, hp: 90,  mat: 'wood',    solid: 1, cost: 1, fill: '#8a6543', light: '#b08a5c' },
  window:   { n: 'Window',  w: 36,  h: 36, hp: 150, mat: 'stone',   solid: 1, cost: 2, fill: '#a39d90', light: '#cfc8b8' },
  door:     { n: 'Door',    w: 34,  h: 62, hp: 110, mat: 'wood',    solid: 0, cost: 2, fill: '#8d6542', light: '#b88a5c' },
  haybale:  { n: 'Haybale', w: 56,  h: 40, hp: 420, mat: 'wood',    solid: 1, cost: 2, fill: '#d9b45e', light: '#f0d68a' },
  shelf:    { n: 'Shelf',   w: 84,  h: 8,  hp: 70,  mat: 'plank',   solid: 1, cost: 1, fill: '#c08a52', light: '#e2b077' },
  gate:     { n: 'Gate',    w: 14,  h: 84, hp: 380, mat: 'metal',   solid: 1, cost: 3, fill: '#8e9aa4', light: '#c9d3da' },
  statue:   { n: 'Statue',  w: 40,  h: 56, hp: 500, mat: 'stone',   solid: 1, cost: 4, fill: '#a8a29a', light: '#cfc9bb' },
  shroom:   { n: 'Shroom',  w: 46,  h: 34, hp: 60,  mat: 'wood',    solid: 1, cost: 2, fill: '#d9573b', light: '#f08a6a', bounce: 1 },
  barrel:   { n: 'Barrel',  w: 34,  h: 44, hp: 60,  mat: 'wood',    solid: 1, cost: 3, fill: '#8a6543', light: '#b08a5c', tnt: 1, boomR: 155, boomD: 70 },
  mine:     { n: 'Mine',    w: 26,  h: 16, hp: 1,   mat: 'metal',   solid: 1, cost: 3, fill: '#6a6470', light: '#9aa4ac', tnt: 1, mine: 1, glow: 1 },
};
const TOOL_INFO = { dig: { n: 'Dig', cost: 0 }, fill: { n: 'Fill', cost: 1 }, repair: { n: 'Repair', cost: 1 }, recycle: { n: 'Recycle', cost: 0 } };
const BUILD_TIPS = { plank: 'light and cheap', beam: 'long and sturdy', wall: 'heavy stone block', brick: 'small stone block', crate: 'wooden box', sandbag: 'soaks up bullets', metal: 'very tough strip', glass: 'see-through, fragile', ladder: 'climb it: hold jump, down to slide', bulb: 'lights the dark', torch: 'a flickering light', banner: 'War: your team respawns here', campfire: 'slowly heals your team', spring: 'launches you up', spikes: 'hurts enemies who touch it', tnt: 'shoot it', fence: 'a quick wooden barrier', pillar: 'tall stone column', catwalk: 'long metal platform', log: 'a chunky fallen log', window: 'a wall you can see and shoot through', door: 'decoration you can walk through', haybale: 'huge, cheap, bullet-spongey', shelf: 'a skinny little ledge', gate: 'a portcullis of iron bars', statue: 'a hero of the arena, very tough', shroom: 'a bouncy toadstool', barrel: 'boom barrel: bigger blast than TNT', mine: 'trips when an enemy walks near', dig: 'carve the ground', fill: 'add ground', repair: 'fix a piece', recycle: 'take a piece back' };
const BUILD_TABS = [['Build', ['plank', 'beam', 'shelf', 'wall', 'brick', 'window', 'door', 'crate', 'sandbag', 'haybale', 'metal', 'glass', 'ladder', 'fence', 'pillar', 'gate', 'catwalk', 'log', 'statue']], ['Gadgets', ['bulb', 'torch', 'banner', 'campfire', 'spring', 'shroom', 'spikes', 'tnt', 'barrel', 'mine']], ['Tools', ['dig', 'fill', 'repair', 'recycle']]];
const ALL_TOOLS = BUILD_TABS.flatMap(t => t[1]);
const BUILD_REACH = 165, BUILD_CAP = 900;

const Build = {
  pieces: new Map(), nextId: 1, own: null, sel: 0, rot: 0, tab: 0, snap: true, supportDirty: false, kitAllowed: () => false, tickT: 0, healT: 0, mineT: 0,
  spec: { ladder: new Set(), spikes: new Set(), heal: new Set(), banner: new Set(), mine: new Set() },
  reset() { this.pieces = new Map(); this.nextId = 1; this.own = new Int32Array(GW * GH); this.supportDirty = false; for (const k in this.spec) this.spec[k].clear(); },
};
Build.reset();

/* ---------- sprites (same ink rules as the props) ---------- */
const PieceArt = new Map();
function pieceSprite(kind) {
  let sp = PieceArt.get(kind); if (sp) return sp; const d = BUILD[kind]; const S = spriteScale(), M = 5; const w = d.w, h = d.h;
  const c = mkCanvas((w + M * 2) * S, (h + M * 2) * S), x = c.getContext('2d'); sp = { c, x, S, M, w, h, cw: c.width, ch: c.height };
  const R = rng(kind.length * 977 + kind.charCodeAt(0));
  x.setTransform(S, 0, 0, S, M * S, M * S); x.lineJoin = 'round'; x.lineCap = 'round';
  const rr = (x, x0, y0, ww, hh, r) => { x.beginPath(); x.moveTo(x0 + r, y0); x.lineTo(x0 + ww - r, y0); x.quadraticCurveTo(x0 + ww, y0, x0 + ww, y0 + r); x.lineTo(x0 + ww, y0 + hh - r); x.quadraticCurveTo(x0 + ww, y0 + hh, x0 + ww - r, y0 + hh); x.lineTo(x0 + r, y0 + hh); x.quadraticCurveTo(x0, y0 + hh, x0, y0 + hh - r); x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0); x.closePath(); x.fill(); };
  const wob = (x, pts) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); };
  try {
    if (kind === 'plank' || kind === 'beam') {
      const j = () => (R() - .5) * 1.2; inkPiece(sp, { fill: d.fill, light: d.light, rim: 2.5, line: 2, hatchA: .3, shape: x => wob(x, [[1 + j(), 1 + j()], [w * .33, j()], [w * .7, .6 + j()], [w - 1 + j(), 1 + j()], [w - .5, h - 1 + j()], [w * .6, h + j() * .5], [w * .25, h - .3 + j()], [.5 + j(), h - 1]]),
        detail: x => { x.strokeStyle = rgbaC(INK, .32); x.lineWidth = .9; for (let i = 0; i < (kind === 'beam' ? 4 : 2); i++) { const yy = h * (.3 + i * (.45 / Math.max(1, (kind === 'beam' ? 3 : 1)))); x.beginPath(); x.moveTo(4 + R() * 6, yy); x.bezierCurveTo(w * .3, yy + (R() - .5) * 3, w * .6, yy + (R() - .5) * 3, w - 4 - R() * 8, yy + (R() - .5) * 2); x.stroke(); }
          x.beginPath(); x.ellipse(w * (.4 + R() * .2), h * .5, 3.2, 1.4, 0, 0, TAU); x.stroke(); x.fillStyle = rgbaC(INK, .75); for (const xx of [5, w - 5]) for (const yy of kind === 'beam' ? [4, h - 4] : [h / 2]) { x.beginPath(); x.arc(xx, yy, 1.2, 0, TAU); x.fill(); } } });
    } else if (kind === 'wall') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 4, shape: x => wob(x, [[1, 2], [w * .5, .5], [w - 1.5, 1.5], [w - .5, h * .5], [w - 1, h - 1], [w * .5, h - .4], [1.5, h - 1], [.4, h * .5]]),
        detail: x => { x.strokeStyle = rgbaC(INK, .45); x.lineWidth = 1.2; x.beginPath(); x.moveTo(1, h * .5); x.lineTo(w - 1, h * .5 + 1); x.moveTo(w * .5, 1); x.lineTo(w * .52, h * .5); x.moveTo(w * .3, h * .5); x.lineTo(w * .28, h - 1); x.moveTo(w * .78, h * .5); x.lineTo(w * .8, h - 1); x.stroke(); dots(x, R, 6, 3, 3, w - 3, h - 3, rgbaC(INK, .22), .6, 1.2); } });
    } else if (kind === 'metal') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2.5, line: 2, hatch: false, shape: x => rr(x, 0, 0, w, h, 2),
        detail: x => { x.fillStyle = rgbaC(INK, .7); for (const xx of [4, w / 2, w - 4]) { x.beginPath(); x.arc(xx, h / 2, 1.3, 0, TAU); x.fill(); } x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(8, 2.6); x.lineTo(w * .45, 2.6); x.stroke(); x.strokeStyle = rgbaC(INK, .25); x.beginPath(); x.moveTo(w * .55, h - 2.6); x.lineTo(w - 8, h - 2.6); x.stroke(); } });
    } else if (kind === 'glass') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 0, line: 1.8, hatch: false, misreg: .3, shape: x => rr(x, 0, 0, w, h, 2),
        detail: x => { x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2; x.beginPath(); x.moveTo(7, h - 10); x.lineTo(w - 12, 6); x.moveTo(14, h - 6); x.lineTo(w - 6, 13); x.stroke(); x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1.2; x.strokeRect(3, 3, w - 6, h - 6); } });
    } else if (kind === 'bulb') {
      inkPiece(sp, { fill: '#7a7480', rim: 1.5, line: 1.6, hatch: false, shape: x => x.fillRect(w / 2 - 4.5, 0, 9, 7) , detail: x => { x.strokeStyle = rgbaC(INK, .5); x.lineWidth = .9; for (const yy of [2, 4.5]) { x.beginPath(); x.moveTo(w / 2 - 4.5, yy); x.lineTo(w / 2 + 4.5, yy + 1); x.stroke(); } } });
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatch: false, shape: x => { x.beginPath(); x.moveTo(w / 2 - 4, 6); x.quadraticCurveTo(0, 9, 1, 14); x.arc(w / 2, 13.5, w / 2 - 1, Math.PI, 0, true); x.quadraticCurveTo(w, 9, w / 2 + 4, 6); x.closePath(); x.fill(); },
        detail: x => { x.strokeStyle = '#e9a23b'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(w / 2 - 2, 7); x.lineTo(w / 2 - 2, 11); x.lineTo(w / 2, 13); x.lineTo(w / 2 + 2, 11); x.lineTo(w / 2 + 2, 7); x.stroke(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(w / 2 - 3, 13, 1.6, 2.6, .3, 0, TAU); x.fill(); } });
    } else if (kind === 'spring') {
      inkPiece(sp, { fill: '#6a6470', rim: 1.5, line: 1.8, hatch: false, shape: x => { x.fillRect(2, h - 4, w - 4, 4); x.lineWidth = 2.6; x.beginPath(); x.moveTo(8, h - 4); for (let i = 0; i < 6; i++) x.lineTo(8 + (i + .5) * (w - 16) / 6, i % 2 ? h - 4 : 5); x.lineTo(w - 8, h - 4); x.stroke(); } });
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 2, hatch: false, shape: x => rr(x, 0, 0, w, 5, 2), detail: x => { x.fillStyle = 'rgba(255,240,220,.7)'; x.fillRect(6, 1.2, w * .4, 1.3); } });
    } else if (kind === 'tnt') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3.5, line: 2.1, shape: x => rr(x, 0, 3, w, h - 3, 3),
        detail: x => { x.fillStyle = '#f4e3a1'; x.fillRect(0, h * .42, w, h * .28); x.strokeStyle = INK; x.lineWidth = 1.3; x.beginPath(); x.moveTo(0, h * .42); x.lineTo(w, h * .42); x.moveTo(0, h * .7); x.lineTo(w, h * .7); x.stroke(); x.fillStyle = INK; x.font = '900 7.5px "Shantell Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TNT', w / 2, h * .57); x.strokeStyle = rgbaC(INK, .55); x.lineWidth = 1; for (const xx of [w * .3, w * .7]) { x.beginPath(); x.moveTo(xx, 4); x.lineTo(xx, h * .42); x.stroke(); } } });
      x.setTransform(S, 0, 0, S, M * S, M * S); x.strokeStyle = INK; x.lineWidth = 1.6; x.beginPath(); x.moveTo(w / 2, 3.5); x.quadraticCurveTo(w / 2 + 4, -1, w / 2 + 7, -2.5); x.stroke(); x.fillStyle = '#ffcf5a'; x.beginPath(); x.arc(w / 2 + 7.5, -3, 1.8, 0, TAU); x.fill();
    } else if (kind === 'brick') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, shape: x => rr(x, 0, 0, w, h, 2.5),
        detail: x => { x.strokeStyle = 'rgba(240,228,206,.75)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(1, h * .5); x.lineTo(w - 1, h * .5); x.moveTo(w * .5, 1); x.lineTo(w * .5, h * .5); x.moveTo(w * .25, h * .5); x.lineTo(w * .25, h - 1); x.moveTo(w * .75, h * .5); x.lineTo(w * .75, h - 1); x.stroke(); dots(x, R, 5, 2, 2, w - 2, h - 2, rgbaC(INK, .25), .5, 1); } });
    } else if (kind === 'crate') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2.2, shape: x => rr(x, 0, 0, w, h, 2),
        detail: x => { x.strokeStyle = rgbaC(INK, .55); x.lineWidth = 1.4; x.strokeRect(4, 4, w - 8, h - 8); x.beginPath(); x.moveTo(5, 5); x.lineTo(w - 5, h - 5); x.stroke(); x.strokeStyle = rgbaC(INK, .25); x.lineWidth = .9; for (const yy of [h * .35, h * .65]) { x.beginPath(); x.moveTo(5, yy); x.lineTo(w - 5, yy + .6); x.stroke(); } x.fillStyle = rgbaC(INK, .7); for (const [a, b] of [[2.5, 2.5], [w - 2.5, 2.5], [2.5, h - 2.5], [w - 2.5, h - 2.5]]) { x.beginPath(); x.arc(a, b, 1.1, 0, TAU); x.fill(); } } });
    } else if (kind === 'sandbag') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, shape: x => { const bw = w / 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(bw * (i + .5), h * .72, bw * .56, h * .3, 0, 0, TAU); x.fill(); } for (let i = 0; i < 2; i++) { x.beginPath(); x.ellipse(bw * (i + 1), h * .3, bw * .56, h * .3, 0, 0, TAU); x.fill(); } },
        detail: x => { x.strokeStyle = rgbaC(INK, .35); x.lineWidth = .9; const bw = w / 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(bw * (i + .5) - 3, h * .72); x.lineTo(bw * (i + .5) + 3, h * .74); x.stroke(); } dots(x, R, 10, 2, 2, w - 2, h - 2, rgbaC(INK, .2), .4, .9); } });
    } else if (kind === 'ladder') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatchA: .2, shape: x => { x.fillRect(2, 0, 4.5, h); x.fillRect(w - 6.5, 0, 4.5, h); for (let yy = 7; yy < h - 2; yy += 11) x.fillRect(3, yy, w - 6, 3.4); },
        detail: x => { x.fillStyle = rgbaC(INK, .6); for (let yy = 7; yy < h - 2; yy += 11) for (const xx of [4.2, w - 4.2]) { x.beginPath(); x.arc(xx, yy + 1.7, .9, 0, TAU); x.fill(); } } });
    } else if (kind === 'torch') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 1.5, line: 1.8, shape: x => { x.beginPath(); x.moveTo(w / 2 - 2, h); x.lineTo(w / 2 - 3.2, 9); x.lineTo(w / 2 + 3.2, 9); x.lineTo(w / 2 + 2, h); x.closePath(); x.fill(); } });
      inkPiece(sp, { fill: '#5b4a3c', rim: 1.5, line: 1.8, hatch: false, shape: x => rr(x, w / 2 - 5, 5, 10, 6, 2), detail: x => { x.strokeStyle = rgbaC(INK, .4); x.lineWidth = .8; x.beginPath(); x.moveTo(w / 2 - 4, 8); x.lineTo(w / 2 + 4, 8.5); x.stroke(); } });
    } else if (kind === 'banner') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 1.5, line: 1.8, shape: x => { x.fillRect(2, 0, 4, h); x.fillRect(0, h - 4, 12, 4); } , detail: x => { x.fillStyle = '#e9c25a'; x.beginPath(); x.arc(4, 1, 2.6, 0, TAU); x.fill(); } });
    } else if (kind === 'campfire') {
      inkPiece(sp, { fill: '#8a8478', light: '#bdb6a6', rim: 2, line: 1.8, hatch: false, shape: x => { for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(3 + i * (w - 6) / 5, h - 3, 3.6, 2.8, 0, 0, TAU); x.fill(); } } });
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, shape: x => { x.save(); x.translate(w / 2, h - 6); x.rotate(-.35); x.fillRect(-13, -2.6, 26, 5.2); x.rotate(.7); x.fillRect(-13, -2.6, 26, 5.2); x.restore(); } });
    } else if (kind === 'spikes') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatch: false, shape: x => { x.fillRect(0, h - 4, w, 4); const n = 6; x.beginPath(); x.moveTo(0, h - 3); for (let i = 0; i < n; i++) { x.lineTo((i + .5) * w / n, 0); x.lineTo((i + 1) * w / n, h - 3); } x.closePath(); x.fill(); },
        detail: x => { x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = .9; const n = 6; for (let i = 0; i < n; i++) { x.beginPath(); x.moveTo((i + .5) * w / n - .5, 2); x.lineTo((i + .25) * w / n, h - 5); x.stroke(); } x.fillStyle = '#7a3a2a'; x.fillRect(0, h - 4, w, 1.3); } });
    } else if (kind === 'fence') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatchA: .25, shape: x => { const pw = w / 4; for (let i = 0; i < 4; i++) { const px = pw * i + 3, pt = 2 + (i % 2) * 3; x.beginPath(); x.moveTo(px, h - 2); x.lineTo(px, pt + 5); x.lineTo(px + (pw - 6) / 2, pt); x.lineTo(px + pw - 6, pt + 5); x.lineTo(px + pw - 6, h - 2); x.closePath(); x.fill(); } for (const yy of [h * .3, h * .72]) x.fillRect(1, yy, w - 2, 3.6); },
        detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = .9; for (let i = 0; i < 4; i++) { const cx = w / 4 * i + w / 8 + 1; x.beginPath(); x.moveTo(cx, 6); x.lineTo(cx, h - 5); x.stroke(); } x.fillStyle = rgbaC(INK, .6); for (const yy of [h * .3 + 1.8, h * .72 + 1.8]) for (const xx of [3, w - 3]) { x.beginPath(); x.arc(xx, yy, 1, 0, TAU); x.fill(); } } });
    } else if (kind === 'pillar') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, shape: x => { rr(x, 2, 6, w - 4, h - 11, 2.5); x.fillRect(0, 1, w, 6); x.fillRect(0, h - 6, w, 5); },
        detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; for (const yy of [h * .3, h * .52, h * .74]) { x.beginPath(); x.moveTo(3, yy); x.lineTo(w - 3, yy + 1); x.stroke(); } x.strokeStyle = rgbaC(INK, .18); x.lineWidth = .8; x.beginPath(); x.moveTo(w * .35, 8); x.lineTo(w * .4, h - 8); x.stroke(); dots(x, R, 5, 4, 10, w - 4, h - 10, rgbaC(INK, .2), .5, 1.2); } });
    } else if (kind === 'catwalk') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2.5, line: 1.8, hatch: false, shape: x => rr(x, 0, 0, w, h, 2),
        detail: x => { x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1; for (let xx = 7; xx < w - 8; xx += 8) { x.beginPath(); x.moveTo(xx, 2.5); x.lineTo(xx + 4, h - 2.5); x.stroke(); } x.fillStyle = rgbaC(INK, .7); for (const xx of [5, w / 2, w - 5]) { x.beginPath(); x.arc(xx, h / 2, 1.3, 0, TAU); x.fill(); } x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(9, 2.6); x.lineTo(w * .4, 2.6); x.stroke(); } });
    } else if (kind === 'log') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, hatchA: .3, shape: x => { x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 3, 0, 0, TAU); x.fill(); },
        detail: x => { x.strokeStyle = rgbaC(INK, .55); x.lineWidth = 1.5; x.beginPath(); x.ellipse(w - 11, h / 2, 4, h / 2 - 7, 0, 0, TAU); x.stroke(); x.beginPath(); x.ellipse(w - 11, h / 2, 1.7, h / 4 - 1, 0, 0, TAU); x.stroke(); x.strokeStyle = rgbaC(INK, .25); x.lineWidth = .9; x.beginPath(); x.moveTo(10, h * .32); x.quadraticCurveTo(w * .4, h * .26, w - 18, h * .34); x.stroke(); x.beginPath(); x.moveTo(12, h * .68); x.quadraticCurveTo(w * .4, h * .74, w - 18, h * .66); x.stroke(); } });
    } else if (kind === 'window') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, shape: x => rr(x, 0, 0, w, h, 2.5),
        detail: x => { x.fillStyle = '#bfe2e8'; x.fillRect(5, 5, w - 10, h - 10); x.strokeStyle = rgbaC(INK, .5); x.lineWidth = 1.2; x.strokeRect(5, 5, w - 10, h - 10); x.beginPath(); x.moveTo(w / 2, 5); x.lineTo(w / 2, h - 5); x.moveTo(5, h / 2); x.lineTo(w - 5, h / 2); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(8, h - 10); x.lineTo(w - 14, 9); x.stroke(); x.strokeStyle = rgbaC(INK, .35); x.strokeRect(1, 1, w - 2, h - 2); } });
    } else if (kind === 'door') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, hatchA: .2, shape: x => rr(x, 2, 2, w - 4, h - 4, 4),
        detail: x => { x.strokeStyle = rgbaC(INK, .4); x.lineWidth = 1.2; x.strokeRect(6, 8, w - 12, h * .34); x.strokeRect(6, h * .46, w - 12, h * .42); x.fillStyle = '#e9c25a'; x.beginPath(); x.arc(w - 9, h * .62, 2.4, 0, TAU); x.fill(); x.strokeStyle = rgbaC(INK, .6); x.lineWidth = 1; x.stroke(); x.strokeStyle = rgbaC(INK, .3); x.lineWidth = 1; x.beginPath(); x.moveTo(2, 2); x.lineTo(w - 2, 2); x.stroke(); } });
    } else if (kind === 'haybale') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 4, line: 2.2, hatchA: .25, shape: x => rr(x, 1, 2, w - 2, h - 4, 9),
        detail: x => { x.strokeStyle = rgbaC(INK, .3); x.lineWidth = .9; for (let i = 0; i < 9; i++) { const yy = 6 + i * (h - 12) / 8; x.beginPath(); x.moveTo(5, yy); x.bezierCurveTo(w * .3, yy + (R() - .5) * 3, w * .7, yy + (R() - .5) * 3, w - 5, yy); x.stroke(); } x.strokeStyle = '#b0883c'; x.lineWidth = 2.2; for (const xx of [w * .25, w * .75]) { x.beginPath(); x.moveTo(xx, 3); x.lineTo(xx + 1, h - 3); x.stroke(); } } });
    } else if (kind === 'shelf') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatchA: .3, shape: x => rr(x, 0, 0, w, h, 2),
        detail: x => { x.fillStyle = rgbaC(INK, .5); for (const xx of [6, w / 2, w - 6]) { x.beginPath(); x.arc(xx, h / 2, 1.1, 0, TAU); x.fill(); } x.strokeStyle = rgbaC(INK, .3); x.lineWidth = .8; x.beginPath(); x.moveTo(10, h - 2.5); x.lineTo(w - 10, h - 2.5); x.stroke(); } });
    } else if (kind === 'gate') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatch: false, shape: x => { rr(x, 0, 0, w, h, 2); x.fillStyle = rgbaC(INK, .25); for (let i = 0; i < 3; i++) x.fillRect(4, 6 + i * (h - 12) / 2.6, w - 8, 2.2); },
        detail: x => { x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(3, 2.5); x.lineTo(w * .5, 2.5); x.stroke(); x.fillStyle = rgbaC(INK, .7); x.beginPath(); x.arc(w / 2, h / 2, 1.6, 0, TAU); x.fill(); } });
    } else if (kind === 'statue') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3, line: 2, shape: x => { rr(x, 1, h - 12, w - 2, 11, 2); x.save(); x.translate(w / 2, h - 14); x.beginPath(); x.ellipse(0, -8, 8, 9, 0, 0, TAU); x.fill(); x.beginPath(); x.arc(0, -19, 5.5, 0, TAU); x.fill(); x.beginPath(); x.moveTo(-8, -8); x.lineTo(-13, -4); x.lineTo(-8, -2); x.closePath(); x.fill(); x.restore(); },
        detail: x => { x.save(); x.translate(w / 2, h - 14); x.strokeStyle = rgbaC(INK, .6); x.lineWidth = 1.1; x.beginPath(); x.arc(0, -19, 5.5, 0, TAU); x.stroke(); x.fillStyle = rgbaC(INK, .8); x.beginPath(); x.arc(-2, -20, .9, 0, TAU); x.arc(2, -20, .9, 0, TAU); x.fill(); x.beginPath(); x.moveTo(-1.5, -17.5); x.lineTo(1.5, -17.5); x.stroke(); x.strokeStyle = rgbaC(INK, .35); x.lineWidth = 1; x.beginPath(); x.moveTo(-5, -24); x.quadraticCurveTo(0, -27, 5, -24); x.stroke(); x.restore(); x.strokeStyle = rgbaC(INK, .25); x.lineWidth = .9; x.beginPath(); x.moveTo(4, h - 9); x.lineTo(w - 4, h - 9); x.stroke(); dots(x, R, 4, 6, h - 11, w - 6, h - 3, rgbaC(INK, .2), .5, 1); } });
    } else if (kind === 'shroom') {
      inkPiece(sp, { fill: '#e8dcc4', light: '#f6ecd8', rim: 2, line: 1.8, hatch: false, shape: x => { x.beginPath(); x.moveTo(w / 2 - 7, h); x.quadraticCurveTo(w / 2 - 8, h * .5, w / 2 - 6, h * .42); x.lineTo(w / 2 + 6, h * .42); x.quadraticCurveTo(w / 2 + 8, h * .5, w / 2 + 7, h); x.closePath(); x.fill(); } });
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2.5, line: 2, hatch: false, shape: x => { x.beginPath(); x.moveTo(2, h * .44); x.quadraticCurveTo(2, 1, w / 2, 1); x.quadraticCurveTo(w - 2, 1, w - 2, h * .44); x.quadraticCurveTo(w / 2, h * .58, 2, h * .44); x.closePath(); x.fill(); },
        detail: x => { x.fillStyle = '#fff4e0'; for (const [cx, cy, r] of [[w * .25, h * .3, 2.4], [w * .55, h * .22, 3], [w * .8, h * .34, 2.2], [w * .42, h * .42, 1.8]]) { x.beginPath(); x.ellipse(cx, cy, r, r * .8, 0, 0, TAU); x.fill(); } } });
    } else if (kind === 'barrel') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 3.5, line: 2.1, hatchA: .25, shape: x => { x.beginPath(); x.moveTo(5, 3); x.quadraticCurveTo(0, h / 2, 5, h - 3); x.lineTo(w - 5, h - 3); x.quadraticCurveTo(w, h / 2, w - 5, 3); x.closePath(); x.fill(); },
        detail: x => { x.strokeStyle = '#5a4a38'; x.lineWidth = 2.4; for (const yy of [h * .22, h * .5, h * .78]) { x.beginPath(); x.moveTo(3, yy); x.quadraticCurveTo(w / 2, yy + 2.5, w - 3, yy); x.stroke(); } x.strokeStyle = '#e0532f'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(w * .28, h * .36); x.lineTo(w * .72, h * .64); x.moveTo(w * .72, h * .36); x.lineTo(w * .28, h * .64); x.stroke(); x.fillStyle = INK; x.font = '900 6px "Shantell Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; } });
      x.setTransform(S, 0, 0, S, M * S, M * S); x.fillStyle = '#e0532f'; x.font = '900 6.5px "Shantell Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('X', w / 2, h / 2);
    } else if (kind === 'mine') {
      inkPiece(sp, { fill: d.fill, light: d.light, rim: 2, line: 1.8, hatch: false, shape: x => { x.beginPath(); x.ellipse(w / 2, h - h / 2, w / 2 - 1, h / 2 - 2, 0, 0, TAU); x.fill(); },
        detail: x => { x.strokeStyle = rgbaC(INK, .5); x.lineWidth = 1; for (const xx of [w * .25, w * .75]) { x.beginPath(); x.moveTo(xx, 2); x.lineTo(xx + (xx < w / 2 ? -3 : 3), -2); x.stroke(); } x.fillStyle = '#e0532f'; x.beginPath(); x.arc(w / 2, h * .35, 2.6, 0, TAU); x.fill(); x.strokeStyle = INK; x.lineWidth = 1; x.stroke(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(w / 2 - .8, h * .35 - .8, .8, 0, TAU); x.fill(); } });
    }
  } catch (e) { console.warn('piece art', kind, e); }
  x.setTransform(1, 0, 0, 1, 0, 0); sp.x = null; PieceArt.set(kind, sp); return sp;
}
/* small toolbar icons rendered from the same sprites */
function pieceIcon(kind) {
  const c = mkCanvas(44, 44), x = c.getContext('2d');
  if (BUILD[kind]) { const sp = pieceSprite(kind); const s = Math.min(38 / sp.c.width, 30 / sp.c.height); const a = kind === 'plank' || kind === 'beam' || kind === 'metal' ? -.5 : kind === 'ladder' || kind === 'banner' ? .25 : 0; x.translate(22, 22); x.rotate(a); x.drawImage(sp.c, -sp.c.width * s / 2, -sp.c.height * s / 2, sp.c.width * s, sp.c.height * s); }
  else { x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = INK; x.lineWidth = 2.4;
    if (kind === 'dig') { x.fillStyle = '#8e9aa4'; x.beginPath(); x.moveTo(12, 30); x.quadraticCurveTo(10, 40, 18, 41); x.quadraticCurveTo(26, 40, 24, 30); x.closePath(); x.fill(); x.stroke(); x.strokeStyle = '#8d6542'; x.lineWidth = 3.4; x.beginPath(); x.moveTo(18, 30); x.lineTo(32, 6); x.stroke(); x.strokeStyle = INK; x.lineWidth = 1.4; x.stroke(); }
    else if (kind === 'repair') { x.fillStyle = '#8d6542'; x.save(); x.translate(22, 24); x.rotate(-.7); x.fillRect(-3, -4, 6, 22); x.strokeRect(-3, -4, 6, 22); x.fillStyle = '#8e9aa4'; x.beginPath(); x.rect(-10, -12, 20, 9); x.fill(); x.stroke(); x.restore(); x.fillStyle = '#6f9a4f'; x.beginPath(); x.arc(33, 33, 8, 0, TAU); x.fill(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(33, 28.5); x.lineTo(33, 37.5); x.moveTo(28.5, 33); x.lineTo(37.5, 33); x.stroke(); }
    else if (kind === 'recycle') { x.strokeStyle = '#4f7a3a'; x.lineWidth = 4; for (let i = 0; i < 3; i++) { const a0 = i * TAU / 3 - 1.2; x.beginPath(); x.arc(22, 23, 13, a0, a0 + 1.5); x.stroke(); const ax = 22 + Math.cos(a0 + 1.6) * 13, ay = 23 + Math.sin(a0 + 1.6) * 13, ta = a0 + 1.6 + Math.PI / 2; x.fillStyle = '#4f7a3a'; x.beginPath(); x.moveTo(ax + Math.cos(ta) * 6, ay + Math.sin(ta) * 6); x.lineTo(ax + Math.cos(ta + 2.3) * 6, ay + Math.sin(ta + 2.3) * 6); x.lineTo(ax + Math.cos(ta - 2.3) * 6, ay + Math.sin(ta - 2.3) * 6); x.closePath(); x.fill(); } x.strokeStyle = INK; x.lineWidth = 1.2; x.beginPath(); x.arc(22, 23, 17, 0, TAU); x.stroke(); }
    else { x.fillStyle = '#9a7a52'; x.beginPath(); x.moveTo(6, 38); x.quadraticCurveTo(10, 22, 22, 20); x.quadraticCurveTo(34, 22, 38, 38); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#c8a878'; x.beginPath(); x.ellipse(22, 14, 6, 4, 0, 0, TAU); x.fill(); x.stroke(); x.strokeStyle = INK; x.beginPath(); x.moveTo(22, 2); x.lineTo(22, 9); x.moveTo(18, 6); x.lineTo(22, 10); x.lineTo(26, 6); x.stroke(); } }
  return c.toDataURL();
}

/* ---------- geometry ---------- */
function pieceDims(kind) { const d = BUILD[kind]; return [d.w / 2, d.h / 2]; }
function inPiece(pc, x, y, pad = 0) { const dx = x - pc.x, dy = y - pc.y; const lx = dx * pc.ca + dy * pc.sa, ly = -dx * pc.sa + dy * pc.ca; return Math.abs(lx) <= pc.hw + pad && Math.abs(ly) <= pc.hh + pad; }
function pieceAabb(x, y, a, hw, hh) { const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a)); const ex = hw * ca + hh * sa, ey = hw * sa + hh * ca; return [x - ex, y - ey, x + ex, y + ey]; }
function mkPieceObj(id, kind, x, y, a, hp, team, by) { const [hw, hh] = pieceDims(kind); return { id, kind, x, y, a, ca: Math.cos(a), sa: Math.sin(a), hw, hh, hp: hp ?? BUILD[kind].hp, team: team || 0, by: by || null, cells: [], seed: (id * 7919) % 1000, bb: pieceAabb(x, y, a, hw, hh), born: now() }; }
function perimeterPts(pc, pad, step = 6) { const out = []; const hw = pc.hw + pad, hh = pc.hh + pad;
  const edge = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / step)); for (let i = 0; i <= n; i++) { const lx = lerp(x0, x1, i / n), ly = lerp(y0, y1, i / n); out.push([pc.x + lx * pc.ca - ly * pc.sa, pc.y + lx * pc.sa + ly * pc.ca]); } };
  edge(-hw, -hh, hw, -hh); edge(hw, -hh, hw, hh); edge(hw, hh, -hw, hh); edge(-hw, hh, -hw, -hh); return out; }
function interiorPts(pc, nx = 5, ny = 3) { const out = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const lx = (nx === 1 ? 0 : lerp(-pc.hw * .85, pc.hw * .85, i / (nx - 1))), ly = (ny === 1 ? 0 : lerp(-pc.hh * .7, pc.hh * .7, j / (ny - 1))); out.push([pc.x + lx * pc.ca - ly * pc.sa, pc.y + lx * pc.sa + ly * pc.ca]); } return out; }
function cellIdx(x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return -1; return (y / CELL | 0) * GW + (x / CELL | 0); }
function stampPiece(pc) {
  if (!BUILD[pc.kind].solid) return; if (!Build.own || Build.own.length !== GW * GH) Build.own = new Int32Array(GW * GH);
  const [x0, y0, x1, y1] = pc.bb; const c0 = clamp(Math.floor(x0 / CELL), 0, GW - 1), c1 = clamp(Math.floor(x1 / CELL), 0, GW - 1), r0 = clamp(Math.floor(y0 / CELL), 0, GH - 1), r1 = clamp(Math.floor(y1 / CELL), 0, GH - 1);
  const fresh = !pc.cells.length; const pad = pc.hh < 6 ? .9 : .2;
  if (fresh) { for (let gy = r0; gy <= r1; gy++) for (let gx = c0; gx <= c1; gx++) { const i = gy * GW + gx; if (!inPiece(pc, gx * CELL + CELL / 2, gy * CELL + CELL / 2, pad)) continue; if (T.grid[i] === 1) continue; pc.cells.push(i); } }
  for (const i of pc.cells) if (T.grid[i] === 0 || T.grid[i] === 2) { T.grid[i] = 2; Build.own[i] = pc.id; }
}
function unstampPiece(pc) {
  for (const i of pc.cells) if (T.grid[i] === 2 && Build.own[i] === pc.id) { T.grid[i] = 0; Build.own[i] = 0; }
  // neighbours that shared a cell get it back
  for (const q of piecesNear(pc.bb[0] - 4, pc.bb[1] - 4, pc.bb[2] + 4, pc.bb[3] + 4)) if (q !== pc) stampPiece(q);
}
function piecesNear(x0, y0, x1, y1) { const out = []; for (const pc of Build.pieces.values()) if (pc.bb[2] >= x0 && pc.bb[0] <= x1 && pc.bb[3] >= y0 && pc.bb[1] <= y1) out.push(pc); return out; }
function pieceAt(x, y, pad = 3) { const i = cellIdx(x, y); if (i >= 0 && T.grid[i] === 2) { const pc = Build.pieces.get(Build.own[i]); if (pc && inPiece(pc, x, y, pad + CELL)) return pc; }
  for (const pc of piecesNear(x - pad, y - pad, x + pad, y + pad)) if (inPiece(pc, x, y, pad)) return pc; return null; }
function obbHitsBox(pc, bx0, by0, bx1, by1) { // SAT between the piece and an axis-aligned box
  const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, ex = (bx1 - bx0) / 2, ey = (by1 - by0) / 2; const dx = cx - pc.x, dy = cy - pc.y; const ca = pc.ca, sa = pc.sa;
  const pe = (ax, ay) => pc.hw * Math.abs(ca * ax + sa * ay) + pc.hh * Math.abs(-sa * ax + ca * ay);
  for (const [ax, ay, be] of [[1, 0, ex], [0, 1, ey]]) if (Math.abs(dx * ax + dy * ay) > be + pe(ax, ay)) return false;
  for (const [ax, ay] of [[ca, sa], [-sa, ca]]) { const be = ex * Math.abs(ax) + ey * Math.abs(ay); if (Math.abs(dx * ax + dy * ay) > be + pe(ax, ay)) return false; }
  return true;
}

/* ---------- validation (shared by host + the ghost preview) ---------- */
function toolList(p) { const w = weaponOf(p); if (w.tool) return Array.isArray(w.tools) && w.tools.length ? w.tools.filter(t => BUILD[t] || TOOL_INFO[t]) : ALL_TOOLS; if (p.kit) return ALL_TOOLS; return null; }
function toolActive(p) { return !!(p && p.alive && (weaponOf(p).tool || p.kit)); }
function matsOf(p) { return weaponOf(p).tool ? (p.mats ?? 0) : (p.kitMats ?? 0); }
function placeCheck(kind, x, y, a, p) {
  const d = BUILD[kind]; if (!d) return 'no'; if (Math.hypot(x - p.x, y - p.y) > BUILD_REACH) return 'too far';
  if (x < 10 || x > W - 10 || y < -200 || y > H - 10) return 'out of bounds'; if (Build.pieces.size >= BUILD_CAP) return 'build limit';
  if (matsOf(p) < d.cost) return 'no materials'; const pc = mkPieceObj(0, kind, x, y, a);
  for (const q of G.players.values()) if (q.alive && obbHitsBox(pc, q.x - HW + 1, q.y - HH + 1, q.x + HW - 1, q.y + HH - 1)) return 'blocked';
  if (d.solid) { const pts = interiorPts(pc, pc.hw > 30 ? 7 : 4, pc.hh > 12 ? 3 : 2); let n = 0; for (const [px, py] of pts) if (solidAt(px, py)) n++; if (n / pts.length > .34) return 'overlaps'; }
  else if (solidAt(x, y)) return 'overlaps';
  for (const [px, py] of perimeterPts(pc, 4, 7)) if (solidAt(px, py)) return null; return 'needs support';
}
function fillCheck(x, y, r, p) { if (Math.hypot(x - p.x, y - p.y) > BUILD_REACH) return 'too far'; if (matsOf(p) < 1) return 'no materials'; for (const q of G.players.values()) if (q.alive && Math.abs(q.x - x) < r + HW && Math.abs(q.y - y) < r + HH) return 'blocked'; return null; }

function pieceNearPt(x, y, pad = 8) { let best = null, bd = 1e9; for (const pc of Build.pieces.values()) { if (pc.dead || x < pc.bb[0] - pad || x > pc.bb[2] + pad || y < pc.bb[1] - pad || y > pc.bb[3] + pad || !inPiece(pc, x, y, pad)) continue; const dd = Math.hypot(pc.x - x, pc.y - y); if (dd < bd) { bd = dd; best = pc; } } return best; }
function pieceMine(p, pc) { if (!pc) return false; if (pc.by && pc.by === p.id) return true; const tOn = typeof teamsOn === 'function' && teamsOn(); return tOn ? !!p.team && pc.team === p.team : true; }
function toolCheck(tool, x, y, p) { if (Math.hypot(x - p.x, y - p.y) > BUILD_REACH) return ['too far']; const pc = pieceNearPt(x, y, 8); if (!pc) return ['point at a piece']; if (!pieceMine(p, pc)) return ['not yours', pc];
  if (tool === 'repair') { if (pc.hp >= BUILD[pc.kind].hp) return ['already fine', pc]; if (matsOf(p) < 1) return ['no materials', pc]; } return [null, pc]; }
function recycleValue(pc) { const d = BUILD[pc.kind]; return pc.hp >= d.hp * .99 ? d.cost : Math.max(0, Math.floor(d.cost / 2)); }
/* ---------- host actions ---------- */
function hostTool(p, x, y, slot, rotDeg) {
  if (!p || !p.alive || !canAttackPhase()) return; const list = toolList(p); if (!list) return; const tool = list[slot]; if (!tool) return;
  const t = now(); if (t < (p.toolNext || 0) - .05) return; if (!isFinite(x) || !isFinite(y)) return;
  const d2 = Math.hypot(x - p.x, y - p.y); if (d2 > BUILD_REACH + 25) { const k = BUILD_REACH / d2; x = p.x + (x - p.x) * k; y = p.y + (y - p.y) * k; }
  const useMats = n => { if (weaponOf(p).tool) p.mats = Math.max(0, (p.mats || 0) - n); else p.kitMats = Math.max(0, (p.kitMats || 0) - n); return matsOf(p); };
  if (tool === 'dig') { p.toolNext = t + .26; emit({ k: 'crater', x: Math.round(x), y: Math.round(y), r: 26, j: .45, s: randSeed(), sc: 0, dn: false, deb: 5, du: .9, dig: 1 }); for (const pc of piecesNear(x - 30, y - 30, x + 30, y + 30)) if (inPiece(pc, x, y, 26)) hostPieceDamage(pc, 90, p.id, x, y); return; }
  if (tool === 'fill') { if (fillCheck(x, y, 22, p)) return; p.toolNext = t + .2; const m = useMats(1); emit({ k: 'crater', x: Math.round(x), y: Math.round(y), r: 22, j: .3, s: randSeed(), sc: 0, dn: false, deb: 0, du: .6, f: 1, by: p.id, m }); return; }
  if (tool === 'repair' || tool === 'recycle') { const [why, pc] = toolCheck(tool, x, y, p); if (why) return; p.toolNext = t + .25;
    if (tool === 'repair') { const m = useMats(1); emit({ k: 'bh', id: pc.id, hp: Math.min(BUILD[pc.kind].hp, Math.round(pc.hp + BUILD[pc.kind].hp * .5)), rep: 1, by: p.id, m }); }
    else { const v = recycleValue(pc); if (weaponOf(p).tool) p.mats = (p.mats || 0) + v; else p.kitMats = (p.kitMats || 0) + v; emit({ k: 'bx', id: pc.id, m: 'recycle', by: p.id, mm: matsOf(p) }); }
    return; }
  const a = ((rotDeg | 0) % 360) * Math.PI / 180; if (placeCheck(tool, x, y, a, p)) return; p.toolNext = t + .15;
  const m = useMats(BUILD[tool].cost); emit({ k: 'bp', id: Build.nextId++, kd: tool, x: Math.round(x), y: Math.round(y), a: +a.toFixed(3), by: p.id, tm: p.team || 0, m });
}
function hostPieceDamage(pc, dmg, by, x, y, power = 300) {
  if (!G.isHost || !pc || pc.dead || !(dmg > 0)) return; const d = BUILD[pc.kind]; const st0 = crackStage(pc); pc.hp -= dmg;
  if (pc.hp <= 0) { pc.dead = true; emit({ k: 'bx', id: pc.id, m: 'break', x: Math.round(x ?? pc.x), y: Math.round(y ?? pc.y), f: Math.round(clamp(power, 150, 1400)) }); if (d.tnt) setTimeout(() => { if (G.isHost) hostExplode(pc.x, pc.y, { radius: d.boomR || 125, damage: d.boomD || 55, knockback: 1200, crater: 38, selfDamage: 1 }, by || pc.by, '_tnt'); }, 90); Build.supportDirty = true; return; }
  if (crackStage(pc) !== st0) emit({ k: 'bh', id: pc.id, hp: Math.round(pc.hp) });
}
function crackStage(pc) { const f = pc.hp / BUILD[pc.kind].hp; return f > .66 ? 0 : f > .33 ? 1 : 2; }
function hostSupportPass() {
  if (!Build.supportDirty) return; Build.supportDirty = false; if (!Build.pieces.size) return;
  const ids = [...Build.pieces.values()].filter(pc => !pc.dead); const adj = new Map(); const grounded = [];
  for (const pc of ids) adj.set(pc.id, new Set());
  for (const pc of ids) { let g = false; for (const [px, py] of perimeterPts(pc, 3, 6)) { const i = cellIdx(px, py); if (i < 0) continue; const v = T.grid[i]; if (v === 1) g = true; else if (v === 2) { const o = Build.own[i]; if (o && o !== pc.id && adj.has(o)) { adj.get(pc.id).add(o); adj.get(o).add(pc.id); } } }
    if (!BUILD[pc.kind].solid) for (const q of piecesNear(pc.bb[0] - 4, pc.bb[1] - 4, pc.bb[2] + 4, pc.bb[3] + 4)) if (q !== pc && !q.dead && BUILD[q.kind].solid) { adj.get(pc.id).add(q.id); adj.get(q.id).add(pc.id); }
    if (g) grounded.push(pc.id); }
  const ok = new Set(grounded), queue = grounded.slice(); while (queue.length) { const id = queue.pop(); for (const n of adj.get(id) || []) if (!ok.has(n)) { ok.add(n); queue.push(n); } }
  for (const pc of ids) if (!ok.has(pc.id)) { pc.dead = true; emit({ k: 'bx', id: pc.id, m: 'fall' }); }
}

/* ---------- applying events (all peers) ---------- */
function addPiece(id, kind, x, y, a, hp, team, by) { if (!BUILD[kind] || Build.pieces.has(id)) return null; const pc = mkPieceObj(id, kind, x, y, a, hp, team, by); Build.pieces.set(id, pc); stampPiece(pc); const dd = BUILD[kind]; for (const k in Build.spec) if (dd[k]) Build.spec[k].add(pc); Build.nextId = Math.max(Build.nextId, id + 1); return pc; }
function pieceBodies(pc, how, e) {
  const sp = pieceSprite(pc.kind), d = BUILD[pc.kind]; const k = 1 / sp.S; const cw = sp.c.width, ch = sp.c.height; const mat = d.mat;
  const toWorldPt = (px, py) => { const lx = (px - cw / 2) * k, ly = (py - ch / 2) * k; return [pc.x + lx * pc.ca - ly * pc.sa, pc.y + lx * pc.sa + ly * pc.ca]; };
  const vis = visibleWorld(pc.x, pc.y, 200);
  if (how === 'fall' || !vis || Env.bodies.length > Bodies.max() - 4) { const piece = cutPiece(sp.c, [[0, 0], [cw, 0], [cw, ch], [0, ch]], 0); if (!piece) return; const [wx, wy] = toWorldPt(piece.ox + piece.cx, piece.oy + piece.cy); const b = Bodies.add(piece, k, wx, wy, pc.a, 1, mat, { vx: (Math.random() - .5) * 40, vy: 0, va: (Math.random() - .5) * .8, life: 10, gen: d.w > 50 ? 0 : 1 }); if (b) b.alpha = d.alpha || 1; return; }
  const n = d.w > 90 ? 4 : d.w > 50 || d.h > 30 ? 3 : 2; const R = rng(pc.seed + 3); const seeds = []; for (let i = 0; i < n; i++) seeds.push([cw * (.1 + (i + R()) / n * .8), ch * (.2 + R() * .6)]);
  const cx = e.x ?? pc.x, cy = e.y ?? pc.y, power = e.f || 400;
  for (const cell of voronoiCells(0, 0, cw, ch, seeds)) { const piece = cutPiece(sp.c, jitterPoly(cell, 5 * sp.S), .8); if (!piece) continue; const [wx, wy] = toWorldPt(piece.ox + piece.cx, piece.oy + piece.cy); const dx = wx - cx, dy = wy - cy, L = Math.hypot(dx, dy) || 1; const s2 = power * (.4 + R() * .5);
    const b = Bodies.add(piece, k, wx, wy, pc.a, 1, mat, { vx: dx / L * s2 + (R() - .5) * 80, vy: dy / L * s2 - power * .3 - R() * 60, va: (R() - .5) * power * .02, life: 7, gen: 1 }); }
}
function removePiece(id, how, e = {}) {
  const pc = Build.pieces.get(id); if (!pc) return; Build.pieces.delete(id); pc.dead = true; unstampPiece(pc); const d = BUILD[pc.kind]; for (const k in Build.spec) Build.spec[k].delete(pc);
  if (how === 'recycle') { if (visibleWorld(pc.x, pc.y, 150)) { FX.dustPuff(pc.x, pc.y, 4, .7); FX.ring(pc.x, pc.y, Math.max(pc.hw, pc.hh), 'rgba(140,200,110,.85)', 2.5, .3); Audio2.play('tink', pc.x, .5, 1.5); } Bodies.wake(pc.x, pc.y, Math.max(pc.hw, pc.hh) + 40); if (G.isHost) Build.supportDirty = true; return; }
  pieceBodies(pc, how, e); Bodies.wake(pc.x, pc.y, Math.max(pc.hw, pc.hh) + 40);
  if (visibleWorld(pc.x, pc.y, 150)) {
    if (how === 'break') { FX.dustPuff(pc.x, pc.y, 6, .9); if (d.mat === 'crystal') { for (let i = 0; i < 10; i++) FX.add({ k: 'spark', x: pc.x + (Math.random() - .5) * pc.hw, y: pc.y + (Math.random() - .5) * pc.hh, vx: (Math.random() - .5) * 420, vy: -Math.random() * 380, life: .45, t: 0, color: '#eefcff', w: 1.4 }); Audio2.play('clang', pc.x, .6, 1.9); } else Audio2.play(d.mat === 'stone' || d.mat === 'metal' ? 'clang' : 'debris', pc.x, .7, d.mat === 'metal' ? .7 : 1); }
    else Audio2.play('debris', pc.x, .35, .8);
    if (d.glow) FX.light(pc.x, pc.y, 140, '#ffe39a', .15, 1);
  }
  if (G.isHost) Build.supportDirty = true;
}
const _applyEventBuild = applyEvent;
applyEvent = function (e) {
  switch (e.k) {
    case 'bp': { const pc = addPiece(e.id, e.kd, e.x, e.y, e.a, null, e.tm, e.by); const p = e.by && G.players.get(e.by); if (p && e.m != null) { if (weaponOf(p).tool) p.mats = e.m; else p.kitMats = e.m; p.kick = 1; }
      if (pc && visibleWorld(pc.x, pc.y, 120)) { FX.dustPuff(pc.x, pc.y + pc.hh, 3, .6); FX.ring(pc.x, pc.y, Math.max(pc.hw, pc.hh) * .8, 'rgba(255,250,236,.7)', 2, .2); Audio2.play(BUILD[pc.kind].mat === 'metal' || BUILD[pc.kind].mat === 'stone' ? 'tink' : 'land', pc.x, .45, BUILD[pc.kind].mat === 'plank' ? 1.4 : 1); }
      if (G.isHost) Build.supportDirty = true; return; }
    case 'bx': { removePiece(e.id, e.m, e); const p = e.by && e.mm != null && G.players.get(e.by); if (p) { if (weaponOf(p).tool) p.mats = e.mm; else p.kitMats = e.mm; } return; }
    case 'bh': { const pc = Build.pieces.get(e.id); if (pc) { pc.hp = e.hp; pc.shake = 1; if (e.rep) { const p = e.by && G.players.get(e.by); if (p && e.m != null) { if (weaponOf(p).tool) p.mats = e.m; else p.kitMats = e.m; } if (visibleWorld(pc.x, pc.y, 80)) { FX.ring(pc.x, pc.y, Math.max(pc.hw, pc.hh) * .9, 'rgba(140,210,120,.9)', 2.5, .3); Audio2.play('tink', pc.x, .5, 1.3); } } else if (visibleWorld(pc.x, pc.y, 80)) chipsFx({ kind: 'crate' }, pc.x, pc.y, -Math.PI / 2, 3); } return; }
    case 'kit': { const p = G.players.get(e.id); if (p) { p.kit = !!e.on; if (e.m != null) p.kitMats = e.m; if (p.id === G.myId) { BuildUI.refresh(true); UI.hint(p.kit ? (Input.usingTouch ? 'Build kit out · tap Done to put it away' : 'Build kit out · 1-0 pick · Tab switches tab · Q/E rotate · B puts away') : 'Weapon back out', 2.2); } } return; }
  }
  _applyEventBuild(e);
  if (e.k === 'crater' && e.f && e.by) { const p = G.players.get(e.by); if (p && e.m != null) { if (weaponOf(p).tool) p.mats = e.m; else p.kitMats = e.m; } }
  if (e.k === 'spawn' || e.k === 'arm') { const p = G.players.get(e.id); if (p) { const w = weaponOf(p); if (w.tool) p.mats = w.materials ?? 40; if (e.k === 'spawn' && !Build.kitAllowed()) p.kit = false; if (p.id === G.myId) BuildUI.refresh(true); } }
  if (e.k === 'round' && e.ph === 'countdown') { for (const p of G.players.values()) p.kit = false; }
};
/* fill mode and re-stamping after craters */
const _carveCraterBuild = carveCrater;
carveCrater = function (c) {
  if (c.f) { fillTerrain(c); return; }
  _carveCraterBuild(c);
  if (Build.pieces.size) { const R = c.r * 1.6 + 8; for (const pc of piecesNear(c.x - R * 1.5, c.y - R * 1.5, c.x + R * 1.5, c.y + R * 1.5)) stampPiece(pc); if (G.isHost) Build.supportDirty = true; }
};
function fillTerrain(c) {
  const { x, y, r } = c; const Q = T.Q; const radii = craterRadii(c.j ?? .3, c.s || 1), n = radii.length;
  const m = T.mctx; m.setTransform(Q, 0, 0, Q, 0, 0); m.globalCompositeOperation = 'source-over'; m.fillStyle = '#fff';
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([x + Math.cos(a) * r * radii[i], y + Math.sin(a) * r * radii[i]]); } m.beginPath(); smoothPath(m, pts); m.fill();
  const c0 = clamp(Math.floor((x - r * 1.4) / CELL), 0, GW - 1), c1 = clamp(Math.floor((x + r * 1.4) / CELL), 0, GW - 1), r0 = clamp(Math.floor((y - r * 1.4) / CELL), 0, GH - 1), r1 = clamp(Math.floor((y + r * 1.4) / CELL), 0, GH - 1);
  for (let gy = r0; gy <= r1; gy++) for (let gx = c0; gx <= c1; gx++) { const px = gx * CELL + CELL / 2 - x, py = gy * CELL + CELL / 2 - y; const dd = Math.hypot(px, py); let a = Math.atan2(py, px); if (a < 0) a += TAU; const f = a / TAU * n, i0 = Math.floor(f) % n, i1 = (i0 + 1) % n; const rr = r * lerp(radii[i0], radii[i1], f - Math.floor(f)); if (dd < rr && T.grid[gy * GW + gx] === 0) T.grid[gy * GW + gx] = 1; }
  markDirty(x - r * 3, y - r * 3, x + r * 3, y + r * 3);
}

/* ---------- damage hooks ---------- */
const _hostImpactBuild = hostImpact;
hostImpact = function (b, w, bounce) {
  if (Build.pieces.size) { const pc = pieceAt(b.x, b.y, 5); if (pc) hostPieceDamage(pc, (w.damage || 10) * (w.propDamage ?? 1) * (b.type === 'flame' ? .4 : 1) * (bounce ? .6 : 1), b.owner, b.x, b.y, 260 + (w.knockback || 0) * .3); }
  return _hostImpactBuild(b, w, bounce);
};
const _hostExplodeBuild = hostExplode;
hostExplode = function (x, y, ex, by, wid, small = false) {
  const r = ex.radius || 90; const hits = Build.pieces.size ? piecesNear(x - r - 70, y - r - 70, x + r + 70, y + r + 70) : [];
  _hostExplodeBuild(x, y, ex, by, wid, small);
  for (const pc of hits) { if (pc.dead) continue; const d = Math.max(0, Math.hypot(pc.x - x, pc.y - y) - Math.min(pc.hw, pc.hh)); if (d > r) continue; const f = 1 - d / r; hostPieceDamage(pc, (ex.damage || 40) * (1 + 2.6 * f), by, x, y, 500 + 900 * f); }
};
const _propMeleeBuild = propMelee;
propMelee = function (p, w, sw) {
  _propMeleeBuild(p, w, sw); if (!Build.pieces.size || w.tool) return; const a = currentWeaponAngle(p), reach = (w.reach || 70) + 6;
  for (let i = 1; i <= 4; i++) { const hx = p.x + Math.cos(a) * reach * i / 4, hy = p.y + Math.sin(a) * reach * i / 4; const pc = pieceAt(hx, hy, 4); if (!pc) continue; const key = 'bk' + pc.id; if (sw.hit.has(key)) continue; sw.hit.add(key); hostPieceDamage(pc, (w.damage || 20) * 1.5 * (w.propDamage ?? 1), p.id, hx, hy, 300 + (w.knockback || 0) * .4); }
};
/* springs + standing on pieces */
const _physicsStepBuild = physicsStep;
physicsStep = function (p, dt) {
  const vy0 = p.vy; _physicsStepBuild(p, dt); if (!Build.pieces.size || !controlledHere(p)) return;
  if (Build.spec.ladder.size && p.alive) { let on = null; for (const pc of Build.spec.ladder) { if (Math.abs(pc.x - p.x) > pc.hw + pc.hh + 8 || Math.abs(pc.y - p.y) > pc.hw + pc.hh + HH) continue; if (inPiece(pc, p.x, p.y + HH - 3, 5) || inPiece(pc, p.x, p.y, 5)) { on = pc; break; } }
    if (on) { const inp = p.input; if (inp.down) p.vy = 230; else if (inp.jumpHeld && (!p.isBot || p.vy < 0 || Math.random() < .02)) { if (p.y + HH > on.bb[1] + 2) p.vy = Math.min(p.vy, -280); else { p.vy = Math.min(p.vy, 0) * .3; p.y = Math.min(p.y, on.bb[1] - HH + 2); } } else p.vy = Math.min(p.vy, 0) * .5; p.jumps = Math.max(p.jumps | 0, 1); p.coyote = .08; p.onLadder = 1; } else p.onLadder = 0; }
  if (p.grounded && vy0 >= 0) for (const ox of [-HW * .6, 0, HW * .6]) { const i = cellIdx(p.x + ox, p.y + HH + 3); if (i < 0 || T.grid[i] !== 2) continue; const pc = Build.pieces.get(Build.own[i]); if (!pc || !BUILD[pc.kind].bounce) continue;
    if (Math.abs(pc.sa) > .5) continue; p.vy = -1450; p.grounded = false; p.jumps = 1; p.sq = 1.4; p.sqv = 0; pc.squish = 1; FX.ring(p.x, pc.y - pc.hh, 30, 'rgba(255,248,232,.9)', 3, .3); Audio2.play('boing', p.x); break; }
};

/* ---------- tool use: client + bots ---------- */
const _doAttackBuild = doAttack;
doAttack = function (p, aim) {
  if (!toolActive(p)) return _doAttackBuild(p, aim);
  if (!p.alive || !canAttackPhase()) return; const t = now(); if (t < p.nextAtk) return; const list = toolList(p); if (!list) return;
  let slot, rot, tx, ty;
  if (p.isBot) { const q = p.ai && p.ai.target && G.players.get(p.ai.target); const dir = q ? Math.sign(q.x - p.x) || 1 : p.face; const roll = Math.random();
    if (roll < .34 && list.includes('plank')) { slot = list.indexOf('plank'); rot = 90; tx = p.x + dir * 44; ty = p.y - 14; }
    else if (roll < .46 && list.includes('haybale')) { slot = list.indexOf('haybale'); rot = 0; tx = p.x + dir * 42; ty = p.y + 4; }
    else if (roll < .6 && list.includes('wall')) { slot = list.indexOf('wall'); rot = 0; tx = p.x + dir * 42; ty = p.y + 2; }
    else if (roll < .7 && list.includes('mine')) { slot = list.indexOf('mine'); rot = 0; tx = p.x + dir * 50; ty = p.y + HH + 6; }
    else if (roll < .78 && list.includes('spring')) { slot = list.indexOf('spring'); rot = 0; tx = p.x; ty = p.y + HH + 8; }
    else if (roll < .86 && list.includes('spikes')) { slot = list.indexOf('spikes'); rot = 0; tx = p.x + dir * 46; ty = p.y + HH + 5; }
    else if (list.includes('dig')) { slot = list.indexOf('dig'); rot = 0; tx = p.x + Math.cos(aim) * 60; ty = p.y + Math.sin(aim) * 60; } else return;
    p.nextAtk = t + .9 + Math.random() * .6; }
  else { slot = clamp(Build.sel, 0, list.length - 1); rot = ((Build.rot % 360) + 360) % 360; [tx, ty] = buildTarget(p, aim); p.nextAtk = t + (list[slot] === 'dig' ? .26 : list[slot] === 'fill' ? .2 : .15); }
  p.aim = Math.atan2(ty - p.y, tx - p.x); p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
  hostTool(p, tx, ty, slot, rot);
};
const _hostAttackBuild = hostAttack;
hostAttack = function (pid, a, x, y, s, remote = false) {
  const p = G.players.get(pid); if (!p) return;
  if (s < 0) { const v = -s - 1; hostTool(p, x, y, Math.floor(v / 1000), v % 1000); return; }
  if (toolActive(p) && remote) return; // a stale attack from a client that just pulled out its tools
  return _hostAttackBuild(pid, a, x, y, s, remote);
};
function buildTarget(p, aim) {
  let tx, ty;
  if (p.id === G.myId && Build.tap && now() - Build.tap.t < .35) { [tx, ty] = Build.tap.w; Build.tap = null; const d = Math.hypot(tx - p.x, ty - p.y); if (d > BUILD_REACH - 4) { const k = (BUILD_REACH - 4) / d; tx = p.x + (tx - p.x) * k; ty = p.y + (ty - p.y) * k; } return [tx, ty]; }
  if (!Input.usingTouch && Input.mouse.active) [tx, ty] = toWorld(Input.mouse.x, Input.mouse.y);
  else { const a = aim ?? p.aim; tx = p.x + Math.cos(a) * 80; ty = p.y + Math.sin(a) * 80; }
  const d = Math.hypot(tx - p.x, ty - p.y); if (d > BUILD_REACH - 4) { const k = (BUILD_REACH - 4) / d; tx = p.x + (tx - p.x) * k; ty = p.y + (ty - p.y) * k; }
  if (Build.snap && p.id === G.myId) { const list = toolList(p), tool = list && list[Build.sel]; if (BUILD[tool]) [tx, ty] = snapTarget(tool, tx, ty, Build.rot * Math.PI / 180); }
  return [tx, ty];
}
/* snap: line the new piece up with the edge of a neighbour, else a 6px grid */
function snapTarget(kind, x, y, a) { const [hw, hh] = pieceDims(kind); const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a)); const ex = hw * ca + hh * sa, ey = hw * sa + hh * ca; let bx = null, by = null, bdx = 11, bdy = 11;
  for (const pc of Build.pieces.values()) { if (pc.bb[2] < x - ex - 14 || pc.bb[0] > x + ex + 14 || pc.bb[3] < y - ey - 14 || pc.bb[1] > y + ey + 14) continue;
    for (const cx of [pc.bb[0] - ex, pc.bb[2] + ex, pc.bb[0] + ex, pc.bb[2] - ex, pc.x]) { const d = Math.abs(cx - x); if (d < bdx) { bdx = d; bx = cx; } }
    for (const cy of [pc.bb[1] - ey, pc.bb[3] + ey, pc.bb[1] + ey, pc.bb[3] - ey]) { const d = Math.abs(cy - y); if (d < bdy) { bdy = d; by = cy; } } }
  return [bx ?? Math.round(x / 6) * 6, by ?? Math.round(y / 6) * 6]; }

/* ---------- drawing ---------- */
function drawPieces(c, V, t) {
  if (!Build.pieces.size) return;
  for (const pc of Build.pieces.values()) {
    if (pc.bb[2] < V.x0 - 20 || pc.bb[0] > V.x1 + 20 || pc.bb[3] < V.y0 - 20 || pc.bb[1] > V.y1 + 20) continue; const d = BUILD[pc.kind]; const sp = pieceSprite(pc.kind);
    c.save(); c.translate(pc.x, pc.y); let a = pc.a; if (pc.shake) { pc.shake = Math.max(0, pc.shake - (R8.rdt || 1 / 60) * 2); a += Math.sin(t * 60) * .03 * pc.shake; } c.rotate(a);
    let sx = 1, sy = 1; if (pc.squish) { pc.squish = Math.max(0, pc.squish - (R8.rdt || 1 / 60) * 3); sy = 1 - .4 * Math.sin(pc.squish * Math.PI); sx = 1 + .15 * Math.sin(pc.squish * Math.PI); c.translate(0, pc.hh * (1 - sy)); }
    const age = t - pc.born; if (age < .18) { const k = age / .18; sx *= .7 + .3 * k + Math.sin(k * Math.PI) * .12; sy *= .7 + .3 * k + Math.sin(k * Math.PI) * .12; }
    if (sx !== 1 || sy !== 1) c.scale(sx, sy);
    if (d.alpha) c.globalAlpha = d.alpha; c.drawImage(sp.c, -(d.w / 2 + sp.M), -(d.h / 2 + sp.M), d.w + sp.M * 2, d.h + sp.M * 2); c.globalAlpha = 1;
    const st = crackStage(pc); if (st) { const R = rng(pc.seed); c.strokeStyle = rgbaC(INK, .7); c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < st * 2; i++) { let x = (R() - .5) * d.w * .7, y = (R() - .5) * d.h * .6; c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += (R() - .5) * 12; y += (R() - .5) * Math.min(10, d.h); c.lineTo(clamp(x, -d.w / 2, d.w / 2), clamp(y, -d.h / 2, d.h / 2)); } } c.stroke(); }
    if (d.flame) { const big = pc.kind === 'campfire'; const fy = big ? -d.h / 2 + 3 : -d.h / 2 + 5; const fl = 1 + Math.sin(t * 13 + pc.seed) * .12 + Math.sin(t * 29 + pc.seed * 2) * .08; const fw = big ? 9 : 5, fh = (big ? 22 : 13) * fl; c.fillStyle = '#e8572e'; c.beginPath(); c.moveTo(-fw, fy); c.quadraticCurveTo(-fw * 1.1, fy - fh * .5, Math.sin(t * 9 + pc.seed) * 2, fy - fh); c.quadraticCurveTo(fw * 1.1, fy - fh * .5, fw, fy); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); c.fillStyle = '#ffd25a'; c.beginPath(); c.moveTo(-fw * .5, fy); c.quadraticCurveTo(-fw * .5, fy - fh * .35, Math.sin(t * 11 + pc.seed) * 1.4, fy - fh * .62); c.quadraticCurveTo(fw * .5, fy - fh * .35, fw * .5, fy); c.closePath(); c.fill(); }
    if (d.banner) { const col = pc.team && typeof teamColor === 'function' ? teamColor(pc.team) : '#d9573b'; const px0 = -d.w / 2 + 6, py0 = -d.h / 2 + 4, cw = 22, chh = 26; c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(px0, py0); for (let i = 1; i <= 4; i++) c.lineTo(px0 + cw * i / 4, py0 + Math.sin(t * 4 + i * .9 + pc.seed) * 2.2 * i / 4); c.lineTo(px0 + cw - 2 + Math.sin(t * 4 + 4) * 2, py0 + chh * .5 + Math.sin(t * 4 + 4.5) * 2); c.lineTo(px0 + cw + Math.sin(t * 4 + 4) * 2, py0 + chh + Math.sin(t * 4 + 5) * 2); for (let i = 4; i >= 0; i--) c.lineTo(px0 + cw * i / 4, py0 + chh + Math.sin(t * 4 + i * .9 + pc.seed + .6) * 2.2 * i / 4); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,248,232,.85)'; c.beginPath(); c.arc(px0 + cw * .45, py0 + chh * .5, 4.2, 0, TAU); c.fill(); }
    if (pc.team && typeof teamColor === 'function' && d.solid) { c.fillStyle = teamColor(pc.team); c.globalAlpha = .9; c.fillRect(-d.w / 2 + 2, -d.h / 2 + 1, 4, Math.min(4, d.h - 2)); c.globalAlpha = 1; }
    c.restore();
  }
}
function drawBuildGhost(c, t) {
  const me = G.players.get(G.myId); if (!toolActive(me) || UI.cur === 'pause') return; const list = toolList(me); if (!list) return; const tool = list[clamp(Build.sel, 0, list.length - 1)];
  const [tx, ty] = buildTarget(me, me.aim); c.save();
  if (tool === 'repair' || tool === 'recycle') { const [why, pc] = toolCheck(tool, tx, ty, me); if (pc) { c.save(); c.translate(pc.x, pc.y); c.rotate(pc.a); c.setLineDash([5, 5]); c.lineWidth = 2.4; c.strokeStyle = why ? 'rgba(217,87,59,.95)' : tool === 'repair' ? 'rgba(111,154,79,.95)' : 'rgba(79,122,58,.95)'; c.strokeRect(-pc.hw - 4, -pc.hh - 4, pc.hw * 2 + 8, pc.hh * 2 + 8); c.restore(); }
    const lbl = why || (tool === 'repair' ? 'repair' : '+' + recycleValue(pc) + ' back'); c.font = '700 12px "Shantell Sans", sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(236,227,209,.9)'; const ly = pc ? pc.bb[1] - 10 : ty - 18; c.strokeText(lbl, pc ? pc.x : tx, ly); c.fillStyle = why ? '#b8412a' : '#3f6a2c'; c.fillText(lbl, pc ? pc.x : tx, ly);
    c.setLineDash([3, 4]); c.strokeStyle = 'rgba(31,28,36,.6)'; c.lineWidth = 1.6; c.beginPath(); c.arc(tx, ty, 6, 0, TAU); c.stroke(); }
  else if (tool === 'dig' || tool === 'fill') { const r = tool === 'dig' ? 26 : 22; const bad = tool === 'fill' && fillCheck(tx, ty, r, me); c.setLineDash([5, 6]); c.lineWidth = 2.2; c.strokeStyle = bad ? 'rgba(217,87,59,.9)' : 'rgba(31,28,36,.75)'; c.beginPath(); c.arc(tx, ty, r, 0, TAU); c.stroke(); c.setLineDash([]); c.fillStyle = bad ? 'rgba(217,87,59,.15)' : tool === 'fill' ? 'rgba(150,110,70,.22)' : 'rgba(255,250,240,.18)'; c.fill(); }
  else { const d = BUILD[tool], sp = pieceSprite(tool); const a = Build.rot * Math.PI / 180; const why = placeCheck(tool, tx, ty, a, me); c.translate(tx, ty); c.rotate(a);
    c.globalAlpha = .55 + .1 * Math.sin(t * 6); c.drawImage(sp.c, -(d.w / 2 + sp.M), -(d.h / 2 + sp.M), d.w + sp.M * 2, d.h + sp.M * 2); c.globalAlpha = 1;
    c.setLineDash([4, 5]); c.lineWidth = 1.8; c.strokeStyle = why ? 'rgba(217,87,59,.95)' : 'rgba(111,154,79,.95)'; c.strokeRect(-d.w / 2 - 2, -d.h / 2 - 2, d.w + 4, d.h + 4); c.setLineDash([]);
    if (why) { c.rotate(-a); c.font = '700 12px "Shantell Sans", sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(236,227,209,.9)'; c.strokeText(why, 0, -Math.max(d.w, d.h) / 2 - 10); c.fillStyle = '#b8412a'; c.fillText(why, 0, -Math.max(d.w, d.h) / 2 - 10); } }
  c.restore();
  c.save(); c.setLineDash([2, 8]); c.strokeStyle = 'rgba(31,28,36,.25)'; c.lineWidth = 1.5; c.beginPath(); c.arc(me.x, me.y, BUILD_REACH, 0, TAU); c.stroke(); c.restore();
}
const _drawPropsBuild = drawProps;
drawProps = function (c, V, t) { _drawPropsBuild(c, V, t); drawPieces(c, V, t); if (G.mode === 'play') drawBuildGhost(c, t); };
const _drawPropLightsBuild = drawPropLights;
drawPropLights = function (c, t) {
  _drawPropLightsBuild(c, t); if (!Build.pieces.size) return; const th = T.theme; const nightish = th.night || th.dark > .2; const spr = softSprite('rgba(255,214,130,1)');
  let nG = 0; for (const pc of Build.pieces.values()) { const d = BUILD[pc.kind]; if (!d.glow || !visibleWorld(pc.x, pc.y, 200)) continue; if (++nG > 36) break; const fire = !!d.flame; const R0 = pc.kind === 'campfire' ? 88 : fire ? 62 : 84; const ly = fire ? pc.y - pc.hh - 6 : pc.y; const r = R0 + Math.sin(t * (fire ? 11 : 7) + pc.seed) * (fire ? 7 : 4) + (!fire && Math.sin(t * 31 + pc.seed) > .97 ? -20 : 0); c.globalAlpha = (nightish ? .6 : .14) * (fire ? .8 : 1); c.drawImage(spr, pc.x - r, ly - r + 4, r * 2, r * 2); c.globalAlpha = (nightish ? .8 : .35) * (fire ? .55 : 1); c.drawImage(spr, pc.x - 16, ly - 13, 32, 32); }
  c.globalAlpha = 1;
};
const _drawPlayerBuild = drawPlayer;
drawPlayer = function (c, p, t) { if (p.kit && Weapons.byId.toolbox && !weaponOf(p).tool) { const wid = p.wid; p.wid = 'toolbox'; try { _drawPlayerBuild(c, p, t); } finally { p.wid = wid; } return; } _drawPlayerBuild(c, p, t); };

/* ---------- host loop + net sync ---------- */
const _hostRulesBuild = hostRules;
hostRules = function () { _hostRulesBuild(); hostSupportPass(); if (!Build.pieces.size) return; const t = now();
  if (Build.spec.spikes.size && t > Build.tickT) { Build.tickT = t + .3; const tOn = typeof teamsOn === 'function' && teamsOn();
    for (const pc of Build.spec.spikes) for (const q of G.players.values()) { if (!q.alive || Math.abs(q.x - pc.x) > pc.hw + HW || q.y + HH < pc.bb[1] - 6 || q.y - HH > pc.bb[3]) continue; if (tOn ? q.team && q.team === pc.team : q.id === pc.by) continue; hostDamage(q, 9, pc.by || null, 'toolbox', (q.x - pc.x) * 4, -460, q.x, pc.bb[1]); } }
  if (Build.spec.mine.size && t > Build.mineT) { Build.mineT = t + .2; const tOn = typeof teamsOn === 'function' && teamsOn();
    for (const pc of [...Build.spec.mine]) { if (pc.dead) continue; let trip = false;
      for (const q of G.players.values()) { if (!q.alive || Math.hypot(q.x - pc.x, q.y - pc.y) > 62) continue; if (tOn ? q.team && q.team === pc.team : q.id === pc.by) continue; trip = true; break; }
      if (trip) hostPieceDamage(pc, 999, pc.by || null, pc.x, pc.y, 900); } }
  if (Build.spec.heal.size && t > Build.healT) { Build.healT = t + 1; const tOn = typeof teamsOn === 'function' && teamsOn(); const mx = typeof maxHp === 'function' ? maxHp() : 100;
    for (const pc of Build.spec.heal) for (const q of G.players.values()) { if (!q.alive || q.hp >= mx || Math.abs(q.x - pc.x) > 90 || Math.abs(q.y - pc.y) > 70) continue; if (tOn && pc.team && q.team !== pc.team) continue; HookAPI.heal(q.id, 5); } }
};
function hostSetKit(p, on) { if (on && !Build.kitAllowed(p)) return; if (p.kitMats == null) p.kitMats = typeof warKitMats === 'function' ? warKitMats() : 120; emit({ k: 'kit', id: p.id, on: on ? 1 : 0, m: p.kitMats }); }
function toggleKit() { const me = G.players.get(G.myId); if (!me || !me.alive || !Build.kitAllowed(me)) { if (me && G.mode === 'play') UI.hint('Building lives in the Big Wilds and War mode', 1.8); return; } hostSetKit(me, !me.kit); }
NetExt.add({ key: 'b', pack: () => ({ n: Build.nextId, l: [...Build.pieces.values()].filter(pc => !pc.dead).map(pc => [pc.id, pc.kind, Math.round(pc.x), Math.round(pc.y), Math.round(pc.a * 1000), Math.round(pc.hp), pc.team || 0, pc.by || '']) }),
  post: v => { if (!v) return; for (const r of v.l || []) addPiece(r[0], r[1], r[2], r[3], r[4] / 1000, r[5], r[6], r[7] || null); Build.nextId = Math.max(Build.nextId, v.n || 1); } });

/* map generation hook list (modes.js adds more) */
const MapHooks = [];
function onMapGenerated(seed) { Build.reset(); for (const h of MapHooks) try { h(seed); } catch (e) { console.warn(e); } }

/* weapons that only appear in some modes / some rounds (e.g. the Tool Box) */
function weaponAllowed(w) {
  if (Array.isArray(w.modes) && w.modes.length && !w.modes.includes(G.gameMode)) return false;
  if (w.roundChance != null && +w.roundChance < 1 && !(G.roundExtras && G.roundExtras.has(w.id))) return false; return true;
}
const _rollWeaponBuild = rollWeapon;
rollWeapon = function (R = Math.random) { const save = Weapons.list; Weapons.list = save.filter(weaponAllowed); try { return _rollWeaponBuild(R); } finally { Weapons.list = save; } };
const _rollCrateBuild = rollCrateWeapon;
rollCrateWeapon = function () { const save = Weapons.list; Weapons.list = save.filter(weaponAllowed); try { return _rollCrateBuild(); } finally { Weapons.list = save; } };
const _startRoundBuild = startRound;
startRound = function () {
  G.roundExtras = new Set(); for (const w of Weapons.list) if (w.roundChance != null && +w.roundChance < 1 && (!Array.isArray(w.modes) || w.modes.includes(G.gameMode)) && Math.random() < +w.roundChance) G.roundExtras.add(w.id);
  G.extraDropped = new Set(); return _startRoundBuild();
};
/* each "sometimes" weapon gets one guaranteed supply drop in the rounds it is rolled */
const _hostRulesExtras = hostRules;
hostRules = function () {
  _hostRulesExtras(); if (G.phase !== 'fight' || !G.roundExtras || !G.roundExtras.size) return; const t = now();
  for (const id of G.roundExtras) { if (G.extraDropped.has(id) || !Weapons.byId[id]) continue; if (t < G.phaseEnd - (G.roundLen || 150) + 6) continue; G.extraDropped.add(id);
    for (let tries = 0; tries < 30; tries++) { const x = 120 + Math.random() * (W - 240); const y = surfaceFromGrid(x); if (y == null || y > H - 40 || waterAt(x, y - 6)) continue; emit({ k: 'crate', id: Env.crateId++, x: Math.round(x), kind: 'weapon', wid: id }); emit({ k: 'xdrop', wid: id }); break; } }
};
const _applyEventXdrop = applyEvent;
applyEvent = function (e) { if (e.k === 'xdrop') { const w = Weapons.byId[e.wid]; if (w && G.mode === 'play') UI.toast(`<b>${esc(w.name)}</b> is falling somewhere on the map`); return; } return _applyEventXdrop(e); };

/* ---------- build bar UI (tabs, big touch targets, a Done button that always works) ---------- */
const BuildUI = {
  el: null, fab: null, key: '',
  ensure() {
    if (this.el) return this.el; const st = document.createElement('style');
    st.textContent = `#buildbar{position:fixed;left:50%;bottom:calc(14px + var(--safe-b,0px));transform:translateX(-50%);display:flex;flex-direction:column;gap:5px;padding:6px 8px 7px;background:rgba(243,236,222,.95);border:2.5px solid #1f1c24;border-radius:16px;box-shadow:3px 4px 0 rgba(31,28,36,.35);z-index:40;font-family:"Shantell Sans",sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none;max-width:calc(100vw - 16px);animation:bbIn .22s ease-out}
@keyframes bbIn{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
#buildbar.hidden,#buildfab.hidden{display:none}
#buildbar .top,#buildbar .row{display:flex;gap:5px;align-items:center}#buildbar .row{overflow-x:auto;scrollbar-width:none}#buildbar .row::-webkit-scrollbar{display:none}
#buildbar .tab{padding:4px 11px;border:2px solid rgba(31,28,36,.3);border-radius:999px;font-size:13px;font-weight:800;color:#1f1c24;background:#fbf6ea;cursor:pointer}#buildbar .tab.on{background:#1f1c24;color:#f3ecde;border-color:#1f1c24}
#buildbar .sp{flex:1}#buildbar .mats{font-size:13px;color:#1f1c24;padding:0 4px;white-space:nowrap}#buildbar .mats big{font-size:17px;font-weight:800;margin-right:3px}
#buildbar .chip{padding:4px 10px;border:2px solid rgba(31,28,36,.3);border-radius:999px;font-size:12px;font-weight:800;background:#fbf6ea;color:#1f1c24;cursor:pointer;white-space:nowrap}#buildbar .chip.on{background:#ffe9b8;border-color:#1f1c24}
#buildbar .done{padding:5px 14px;border:2.5px solid #1f1c24;border-radius:999px;font-size:14px;font-weight:800;background:#d9573b;color:#fff8ec;cursor:pointer;box-shadow:0 2px 0 #1f1c24;white-space:nowrap}
#buildbar .bs{position:relative;flex:none;width:48px;height:48px;border:2px solid rgba(31,28,36,.3);border-radius:11px;background:#fbf6ea;display:grid;place-items:center;cursor:pointer;transition:transform .12s,background .12s}#buildbar .bs img{width:42px;height:42px;pointer-events:none}
#buildbar .bs.on{border-color:#1f1c24;background:#ffe9b8;transform:translateY(-2px);box-shadow:0 3px 0 #1f1c24}#buildbar .bs i{position:absolute;left:3px;top:0;font-style:normal;font-size:10px;font-weight:800;color:rgba(31,28,36,.55)}#buildbar .bs b{position:absolute;right:3px;bottom:0;font-size:10px;font-weight:800;color:rgba(31,28,36,.75)}
#buildbar .rot{flex:none;width:40px;height:48px;border:2px solid rgba(31,28,36,.3);border-radius:11px;background:#fbf6ea;font-size:21px;font-weight:800;display:grid;place-items:center;cursor:pointer;color:#1f1c24}
#buildbar .tip{font-size:12px;color:rgba(31,28,36,.75);text-align:center;min-height:15px;line-height:15px}
#buildbar.min .row,#buildbar.min .tip{display:none}
#buildbar .minb{padding:4px 9px;border:2px solid rgba(31,28,36,.3);border-radius:999px;font-size:13px;font-weight:800;background:#fbf6ea;color:#1f1c24;cursor:pointer;line-height:1}
#buildbar.touch .bs{width:56px;height:56px}#buildbar.touch .bs img{width:48px;height:48px}#buildbar.touch .rot{width:50px;height:56px;font-size:26px}#buildbar.touch .tab{padding:7px 14px;font-size:14px}#buildbar.touch .done{padding:8px 18px;font-size:16px}#buildbar.touch .chip{padding:7px 12px}#buildbar.touch .i10{display:none}
#buildbar.touch{bottom:auto;top:calc(60px + var(--safe-t,0px))}@keyframes bbInT{from{opacity:0;transform:translate(-50%,-14px)}}#buildbar.touch{animation-name:bbInT}
@media (max-width:720px){#buildbar{bottom:auto;top:calc(60px + var(--safe-t,0px));padding:4px 5px}#buildbar .bs{width:40px;height:40px}#buildbar .bs img{width:34px;height:34px}#buildbar .rot{width:32px;height:40px}}
body.kit-on #wcard{opacity:0;pointer-events:none}
#buildfab{position:fixed;z-index:40;right:calc(18px + var(--safe-r,0px));top:calc(120px + var(--safe-t,0px));padding:10px 16px;border:2.5px solid #1f1c24;border-radius:999px;background:#ffe9b8;color:#1f1c24;font:800 16px "Shantell Sans",sans-serif;box-shadow:2px 3px 0 rgba(31,28,36,.4);touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}`;
    document.head.append(st); const el = document.createElement('div'); el.id = 'buildbar'; el.className = 'hidden'; document.body.append(el); this.el = el;
    const fab = document.createElement('div'); fab.id = 'buildfab'; fab.className = 'hidden'; fab.textContent = '\u{1F528} Build'; document.body.append(fab); this.fab = fab;
    fab.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggleKit(); Audio2.play('ui'); });
    const act = e => { const b = e.target.closest('[data-s],[data-r],[data-t],[data-a]'); e.stopPropagation(); if (!b) return; e.preventDefault(); const ds = b.dataset;
      if (ds.s != null) Build.sel = +ds.s; else if (ds.r != null) Build.rot = (Build.rot + +ds.r + 360) % 360; else if (ds.t != null) this.pickTab(+ds.t);
      else if (ds.a === 'done') { toggleKit(); } else if (ds.a === 'snap') Build.snap = !Build.snap; else if (ds.a === 'r0') Build.rot = Build.rot === 0 ? 90 : 0; else if (ds.a === 'min') Build.uiMin = !Build.uiMin;
      Audio2.play('ui'); this.refresh(true); };
    el.addEventListener('pointerdown', act); for (const ev of ['touchstart', 'touchend', 'touchmove']) el.addEventListener(ev, e => e.stopPropagation(), { passive: true }); return el;
  },
  icons: {},
  tabsFor(list) { return BUILD_TABS.map(([n, ks], ti) => ({ n, ti, idx: ks.map(k => list.indexOf(k)).filter(i => i >= 0) })).filter(t => t.idx.length); },
  pickTab(ti) { const me = G.players.get(G.myId); const list = me && toolList(me); if (!list) return; const tabs = this.tabsFor(list); const tb = tabs.find(t => t.ti === ti) || tabs[0]; if (!tb) return; Build.tab = tb.ti; if (!tb.idx.includes(Build.sel)) Build.sel = tb.idx[0]; },
  cycleTab(d = 1) { const me = G.players.get(G.myId); const list = me && toolList(me); if (!list) return; const tabs = this.tabsFor(list); const k = Math.max(0, tabs.findIndex(t => t.ti === Build.tab)); this.pickTab(tabs[(k + d + tabs.length) % tabs.length].ti); this.refresh(true); },
  curTab(list) { const tabs = this.tabsFor(list); let tb = tabs.find(t => t.idx.includes(Build.sel) && t.ti === Build.tab) || tabs.find(t => t.idx.includes(Build.sel)) || tabs[0]; if (tb) Build.tab = tb.ti; return [tabs, tb]; },
  refresh(force = false) {
    const el = this.ensure(); const me = G.players.get(G.myId); const on = G.mode === 'play' && toolActive(me) && UI.cur !== 'pause';
    const fabOn = G.mode === 'play' && Input.usingTouch && me && me.alive && !me.kit && !weaponOf(me).tool && Build.kitAllowed(me) && UI.cur !== 'pause'; if (this.fab.classList.contains('hidden') === fabOn) this.fab.classList.toggle('hidden', !fabOn);
    document.body.classList.toggle('kit-on', !!on); if (!on) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); this.key = ''; return; }
    const list = toolList(me); if (Build.sel >= list.length) Build.sel = 0; const [tabs, tb] = this.curTab(list); const touch = !!Input.usingTouch; const canPutAway = me.kit && !weaponOf(me).tool;
    const key = list.join(',') + '|' + Build.sel + '|' + Build.rot + '|' + matsOf(me) + '|' + Build.tab + '|' + Build.snap + touch + canPutAway + Build.uiMin;
    if (!force && key === this.key) return; this.key = key; el.classList.remove('hidden'); el.classList.toggle('touch', touch);
    const cur = list[Build.sel], cd = BUILD[cur] || TOOL_INFO[cur];
    const slots = (tb ? tb.idx : []).map((gi, n) => { const k = list[gi]; const ic = this.icons[k] || (this.icons[k] = pieceIcon(k)); const d = BUILD[k] || TOOL_INFO[k]; return `<div class="bs${gi === Build.sel ? ' on' : ''}" data-s="${gi}" title="${d.n}${d.cost ? ' · ' + d.cost + ' material' + (d.cost > 1 ? 's' : '') : ''}"><i class="i10">${n < 10 ? (n + 1) % 10 : ''}</i><img src="${ic}" alt="${d.n}">${d.cost ? `<b>${d.cost}</b>` : ''}</div>`; }).join('');
    el.classList.toggle('min', !!Build.uiMin);
    if (Build.uiMin) { el.innerHTML = `<div class="top"><div class="minb" data-a="min" title="show pieces">&#x25B8; ${cd ? cd.n : 'Build'}</div><div class="sp"></div><div class="mats"><big>${matsOf(me)}</big>mats</div>${canPutAway ? `<div class="done" data-a="done">Done &#x2715;</div>` : ''}</div>`; return; }
    el.innerHTML = `<div class="top">${tabs.length > 1 ? tabs.map(t => `<div class="tab${tb && t.ti === tb.ti ? ' on' : ''}" data-t="${t.ti}">${t.n}</div>`).join('') : ''}<div class="sp"></div><div class="mats"><big>${matsOf(me)}</big>mats</div><div class="chip${Build.snap ? ' on' : ''}" data-a="snap">Snap</div><div class="chip" data-a="r0">${Build.rot}&deg;</div><div class="minb" data-a="min" title="hide pieces">&#x2013;</div>${canPutAway ? `<div class="done" data-a="done">Done &#x2715;</div>` : ''}</div>`
      + `<div class="row"><div class="rot" data-r="-15" title="rotate (Q)">&#x21BA;</div>${slots}<div class="rot" data-r="15" title="rotate (E)">&#x21BB;</div></div><div class="tip"><b>${cd ? cd.n : ''}</b> · ${BUILD_TIPS[cur] || ''}</div>`;
  }
};
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT' || G.mode !== 'play' || !Input.enabled) return; const me = G.players.get(G.myId);
  if (e.code === 'KeyB' && !e.repeat) { toggleKit(); return; }
  if (!toolActive(me)) return; const list = toolList(me);
  if (e.code === 'Tab') { e.preventDefault(); BuildUI.cycleTab(e.shiftKey ? -1 : 1); return; }
  const m = /^Digit(\d)$/.exec(e.code); if (m) { const [, tb] = BuildUI.curTab(list); const i = (+m[1] + 9) % 10; if (tb && i < tb.idx.length) { Build.sel = tb.idx[i]; BuildUI.refresh(true); } return; }
  if (e.code === 'KeyQ') { Build.rot = (Build.rot + 345) % 360; BuildUI.refresh(true); } if (e.code === 'KeyE') { Build.rot = (Build.rot + 15) % 360; BuildUI.refresh(true); }
});
addEventListener('wheel', e => { if (G.mode !== 'play') return; const me = G.players.get(G.myId); if (!toolActive(me)) return; if (e.shiftKey) { const list = toolList(me); Build.sel = (Build.sel + (e.deltaY > 0 ? 1 : list.length - 1)) % list.length; } else Build.rot = (Build.rot + (e.deltaY > 0 ? 15 : 345)) % 360; BuildUI.refresh(true); }, { passive: true });
const _tickHudBuild = UI.tickHud.bind(UI);
UI.tickHud = function () { _tickHudBuild(); BuildUI.refresh(false); };
/* touch: a quick tap on the right half places the piece right where you tapped */
if (typeof touchEl !== 'undefined') { const downs = new Map();
  touchEl.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') downs.set(e.pointerId, [e.clientX, e.clientY, now()]); });
  touchEl.addEventListener('pointerup', e => { const d = downs.get(e.pointerId); downs.delete(e.pointerId); if (!d || e.pointerType === 'mouse' || G.mode !== 'play') return; const me = G.players.get(G.myId); if (!toolActive(me)) return;
    if (d[0] >= R8.cw * .45 && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 16 && now() - d[2] < .35) Build.tap = { w: toWorld(e.clientX, e.clientY), t: now() }; });
}
