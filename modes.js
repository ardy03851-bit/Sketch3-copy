'use strict';
/* =====================================================================
   INKBRAWL MODES — loaded after build.js.
   The rules layer on top of the core game:
     · room rules (health, round time, sudden death, supply drops, bot skill,
       starting weapons, map size, storm) — one panel shared by Host and Practice
     · teams (2-4) with friendly fire toggle, works with bots and real players
     · War mode (Big Wilds sub-mode): team bases, build phase, respawn tickets,
       the build kit (planks, bulbs, stone, dig, fill...). Can be switched on
       and off from the pause menu without leaving the room.
     · crowds of bots (up to 100) with level-of-detail AI so it stays smooth
   Everything here is host-authoritative; clients only receive options/teams.
   ===================================================================== */

const RULE_DEFAULTS = { hp: 100, hpCustom: 0, time: 0, sd: 1, drops: 1, skill: 1, weapons: 'random', teams: 0, ff: 0, mapSize: 4, mapW: 0, mapH: 0, storm: 0, war: 0, tickets: 10, buildT: 30, crowd: 0, weather: 'biome', infAmmo: 0, chaosGrav: 100, chaosSpeed: 100, chaosJump: 100 };
G.opts = Object.assign({}, RULE_DEFAULTS);
G.teamScore = {}; G.tickets = {}; G.bases = [];
const TEAM_INFO = [null, { n: 'Red', c: '#d9573b' }, { n: 'Blue', c: '#3f7fbf' }, { n: 'Green', c: '#5f9a46' }, { n: 'Gold', c: '#e0a22e' }, { n: 'Purple', c: '#8a63c2' }, { n: 'Orange', c: '#e8823c' }, { n: 'Teal', c: '#3fa8a0' }, { n: 'Pink', c: '#d46a9e' }];
function teamColor(t) { return (TEAM_INFO[t] || TEAM_INFO[1]).c; }
function teamName(t) { return (TEAM_INFO[t] || { n: 'Team ' + t }).n; }
function teamCount() { const o = G.opts || {}; if (o.war && G.gameMode === 'expedition') return clamp(o.teams || 2, 2, 8); const n = o.teams | 0; return n >= 2 ? clamp(n, 2, 8) : 0; } // teams work in the classic arena too
function teamsOn() { return teamCount() >= 2; }
function warOn() { return !!(G.opts && G.opts.war) && G.gameMode === 'expedition'; }
function fightElapsed() { return (G.roundLen || 150) - (G.phaseEnd - now()); }
function warBuildPhase() { return warOn() && G.phase === 'fight' && fightElapsed() < (G.opts.buildT | 0); }
function roundTimeFor() { const o = G.opts; if (G.gameMode === 'inkhold') return 300; if (o.time > 0) return o.time + (warOn() ? o.buildT | 0 : 0); if (warOn()) return 300 + (o.buildT | 0); return G.gameMode === 'expedition' ? 150 : ROUND_TIME; }
function warKitMats() { return G.opts.mats || 150; }
Build.kitAllowed = () => (warOn() || G.gameMode === 'expedition') && (G.phase === 'fight' || G.phase === 'warmup' || G.phase === 'countdown');
BOT_NAMES.push('Eraser', 'Crayon', 'Margin', 'Pastel', 'Gouache', 'Biro', 'Squiggle', 'Hatch', 'Stipple', 'Smear', 'Tracer', 'Pencilneck', 'Rubber', 'Sharpie', 'Staple', 'Folio', 'Doodlebug', 'Scribble', 'Splotch', 'Wobble');
{ const base = BOT_NAMES.slice(); for (const k of ['Jr', 'II', 'Max', 'Mini', 'XL']) for (const n of base) BOT_NAMES.push(n + ' ' + k); }

/* ---------- options sync ---------- */
NetExt.add({ key: 'o', pack: () => ({ o: G.opts, tm: [...G.players.values()].map(p => [p.id, p.team || 0]), ts: G.teamScore, tx: G.tickets }),
  pre: v => { if (!v) return; G.opts = Object.assign({}, RULE_DEFAULTS, v.o || {}); G.teamScore = v.ts || {}; G.tickets = v.tx || {}; G._pendingTeams = v.tm || []; },
  post: v => { for (const [id, t] of (G._pendingTeams || [])) { const p = G.players.get(id); if (p) p.team = t; } G._pendingTeams = null; } });

function emitTeams(list) { emit({ k: 'teams', l: list || [...G.players.values()].map(p => [p.id, p.team || 0]) }); }
function assignTeams(force) {
  const n = teamCount(); const all = [...G.players.values()];
  if (n < 2) { if (all.some(p => p.team)) { for (const p of all) p.team = 0; emitTeams(); } return; }
  const counts = new Array(n + 1).fill(0); let changed = false;
  if (force) for (const p of all) p.team = 0;
  for (const p of all) if (p.team >= 1 && p.team <= n) counts[p.team]++; else if (p.team) { p.team = 0; changed = true; }
  // humans first so real people are spread evenly, then bots fill the gaps
  const need = all.filter(p => !p.team).sort((a, b) => (a.isBot ? 1 : 0) - (b.isBot ? 1 : 0));
  for (const p of need) { let best = 1; for (let t = 2; t <= n; t++) if (counts[t] < counts[best]) best = t; p.team = best; counts[best]++; changed = true; }
  // rebalance if one team is two or more players bigger (move bots only)
  for (let guard = 0; guard < 200; guard++) { let hi = 1, lo = 1; for (let t = 2; t <= n; t++) { if (counts[t] > counts[hi]) hi = t; if (counts[t] < counts[lo]) lo = t; } if (counts[hi] - counts[lo] < 2) break; const b = all.find(p => p.team === hi && p.isBot) || (force ? all.find(p => p.team === hi) : null); if (!b) break; b.team = lo; counts[hi]--; counts[lo]++; changed = true; }
  if (changed) emitTeams();
}

/* ---------- spawning: team sides, faster spread ---------- */
function spawnOk(x) { const y = surfaceFromGrid(x); if (y == null || y > H - 40) return null; if (solidRect(x - HW - 4, y - PH - 50, x + HW + 4, y - 2)) return null; if (waterAt(x, y - 6) || waterAt(x, y - HH)) return null; if (Env.zone && (x < Env.zone.x0 + 60 || x > Env.zone.x1 - 60)) return null; return [x, y - HH - 2]; }
findSpawns = function (n, R = Math.random) {
  const spots = []; for (let i = 0; i < 260 && spots.length < Math.max(8, n * 3); i++) { const s = spawnOk(60 + R() * (W - 120)); if (s) spots.push(s); }
  if (!spots.length) spots.push([W / 2, 200]);
  // farthest-point sampling with an incremental nearest-distance table: O(n·spots) instead of O(n²·spots)
  const dmin = new Float64Array(spots.length).fill(1e18); const pick = [];
  while (pick.length < n) { let bi = 0, bd = -1; for (let i = 0; i < spots.length; i++) { const d = pick.length ? dmin[i] : R(); if (d > bd) { bd = d; bi = i; } } const s = spots[bi]; pick.push(s); for (let i = 0; i < spots.length; i++) { const d = (spots[i][0] - s[0]) ** 2 + (spots[i][1] - s[1]) ** 2; if (d < dmin[i]) dmin[i] = d; } }
  return pick;
};
function teamRegion(t) { const n = teamCount(); const w = W / n; return [w * (t - 1), w * t]; }
function teamSpot(t) {
  if (warOn() && G.phase === 'fight' && typeof Build !== 'undefined' && Build.spec.banner.size && Math.random() < .75) { const own = [...Build.spec.banner].filter(pc => pc.team === t && !pc.dead); if (own.length) { const pc = own[Math.random() * own.length | 0]; for (let i = 0; i < 6; i++) { const x = pc.x + (Math.random() - .5) * 50, y = pc.bb[3] - HH - 2; if (!solidRect(x - HW, y - HH, x + HW, y + HH - 2)) return [x, y]; } } }
  const [a, b] = teamRegion(t); const war = warOn(); const base = war && G.bases[t]; const mid = base ? base.x : (a + b) / 2; const spread = war ? Math.min(260, (b - a) * .3) : (b - a) * .42;
  for (let i = 0; i < 40; i++) { const x = clamp(mid + (Math.random() - .5) * 2 * spread, a + 40, b - 40); const s = spawnOk(x); if (s) return s; }
  return null;
}
const _hostSpawnModes = hostSpawn;
hostSpawn = function (p, spot) { if (teamsOn()) { if (!p.team) assignTeams(); const s = p.team && teamSpot(p.team); if (s) spot = s; } return _hostSpawnModes(p, spot); };

/* ---------- starting weapons ---------- */
const _rollWeaponModes = rollWeapon;
rollWeapon = function (R = Math.random) {
  const m = G.opts.weapons; if (m === 'fists') return FISTS;
  if (m === 'same') { const w = G.roundWeapon && Weapons.byId[G.roundWeapon]; if (w) return w; const r = _rollWeaponModes(R); G.roundWeapon = r.id; return r; }
  return _rollWeaponModes(R);
};

/* ---------- rounds ---------- */
const _startRoundModes = startRound;
startRound = function () {
  G.roundWeapon = null; G.warBuilt = false; G.warStarted = false;
  if (teamsOn()) assignTeams(false); else assignTeams(false);
  G.tickets = {}; if (warOn()) { const n = teamCount(); let size = 1; for (let t = 1; t <= n; t++) size = Math.max(size, [...G.players.values()].filter(p => p.team === t).length); for (let t = 1; t <= n; t++) G.tickets[t] = Math.max(G.opts.tickets | 0, 0) * Math.max(1, Math.ceil(size / 2)); emit({ k: 'tix', l: G.tickets }); }
  for (const p of G.players.values()) { p.kitMats = null; p.buildPlan = null; }
  return _startRoundModes();
};
const _setPhaseModes = setPhase;
setPhase = function (ph, left, extra = {}) { if (teamsOn()) extra = Object.assign({ ts: G.teamScore, tx: G.tickets }, extra); return _setPhaseModes(ph, left, extra); };
function endTeamRound(wt, msg) {
  if (wt) { G.teamScore[wt] = (G.teamScore[wt] || 0) + 1; for (const p of G.players.values()) if (p.team === wt) p.score++; }
  const champ = wt && G.teamScore[wt] >= G.target; setPhase(champ ? 'champion' : 'over', champ ? 7 : 3.2, { win: null, wt: wt || 0, msg: msg || '' });
}
function endSoloRound(win) { if (win) win.score++; const champ = win && win.score >= G.target; setPhase(champ ? 'champion' : 'over', champ ? 7 : 2.8, { win: win ? win.id : null }); }
/* called by the core fight-phase rules; returns true when it handled this frame */
function fightRules(all, alive, t) {
  const o = G.opts; const timeUp = G.phaseEnd > 0 && t >= G.phaseEnd;
  if (G.gameMode === 'inkhold') { inkholdRules(all, alive, t, timeUp); return true; }
  if (!teamsOn()) { if (timeUp && !o.sd) { endSoloRound(alive.slice().sort((a, b) => b.hp - a.hp)[0] || null); return true; } return false; }
  const war = warOn(); const n = teamCount();
  if (war) { // respawn tickets
    for (const p of all) if (!p.alive && p.team && t > (p.respawnAt || 0) + 1.6 && (G.tickets[p.team] | 0) > 0) { G.tickets[p.team]--; hostSpawn(p); p.kitMats = Math.min(warKitMats(), (p.kitMats ?? warKitMats()) + 25); if (p.kit) emit({ k: 'kit', id: p.id, on: 1, m: p.kitMats }); emit({ k: 'tix', l: G.tickets }); }
  }
  const strength = new Array(n + 1).fill(0), members = new Array(n + 1).fill(0);
  for (const p of all) { if (!p.team) continue; members[p.team]++; if (p.alive) strength[p.team] += 1000 + p.hp; }
  if (war) for (let tt = 1; tt <= n; tt++) if (members[tt]) strength[tt] += (G.tickets[tt] | 0) * 1000;
  const live = []; for (let tt = 1; tt <= n; tt++) if (strength[tt] > 0) live.push(tt);
  const teamsPresent = members.filter(x => x > 0).length;
  if (teamsPresent >= 2 && live.length <= 1) { endTeamRound(live[0] || 0); return true; }
  if (teamsPresent < 2 && alive.length <= 1 && !war) { endTeamRound(alive[0] ? alive[0].team : 0); return true; }
  if (timeUp && (war || !o.sd)) { let best = 0; for (let tt = 1; tt <= n; tt++) if (strength[tt] > (strength[best] || 0)) best = tt; endTeamRound(best, 'time'); return true; }
  if (timeUp && o.sd) { // team sudden death: the ink dries for everyone
    if (!G.sd) { G.sd = true; G.sdTick = t + 1; emit({ k: 'sd' }); }
    if (t >= G.sdTick) { G.sdTick = t + .5; for (const p of alive) hostDamage(p, Math.ceil(4 * maxHp() / 100), null, '_sd', 0, 0, p.x, p.y - 20); }
  }
  return true;
}

/* ---------- damage rules ---------- */
const _hostDamageModes = hostDamage;
hostDamage = function (q, dmg, by, wid, kx, ky, x, y, head) {
  if (by && by !== q.id) { const a = G.players.get(by);
    if (a && a.team && a.team === q.team && teamsOn() && !G.opts.ff) return;
    if (warBuildPhase()) return; }
  else if (warBuildPhase() && wid && wid !== '_fall' && wid !== '_lava') return;
  return _hostDamageModes(q, dmg, by, wid, kx, ky, x, y, head);
};

/* ---------- host loop extras ---------- */
const _hostRulesModes = hostRules;
hostRules = function () {
  const t = now();
  // supply drop frequency
  if (G.opts.drops === 0) Env.nextCrate = Math.max(Env.nextCrate || 0, t + 30);
  const before = Env.nextCrate;
  if ((G.phase === 'over' || G.phase === 'champion') && t >= G.phaseEnd && G.phase === 'champion') G.teamScore = {};
  _hostRulesModes();
  if (G.opts.drops === 2 && Env.nextCrate !== before && Env.nextCrate > t + 2) Env.nextCrate = t + (Env.nextCrate - t) * .4;
  if (!G.isHost) return;
  if (teamsOn() && (G._teamT = (G._teamT || 0) - STEP) <= 0) { G._teamT = .5; if ([...G.players.values()].some(p => !p.team)) assignTeams(false); }
  else if (!teamsOn() && (G._teamT = (G._teamT || 0) - STEP) <= 0) { G._teamT = 1; if ([...G.players.values()].some(p => p.team)) assignTeams(false); }
  if (warOn() && G.phase === 'fight') {
    if (!G.warStarted) { G.warStarted = true; if ((G.opts.buildT | 0) > 0) { for (const p of G.players.values()) if (p.alive) hostSetKit(p, true); emit({ k: 'warmsg', m: 'build' }); } }
    if (!G.warBuilt && !warBuildPhase()) { G.warBuilt = true; for (const p of G.players.values()) if (p.isBot && p.kit) hostSetKit(p, false); emit({ k: 'warmsg', m: 'fight' }); }
  }
};

/* ---------- bots: team aware, skill levels, level-of-detail thinking ---------- */
const SKILL = [{ err: .42, react: .65, range: 1100 }, { err: .16, react: .36, range: 1500 }, { err: .05, react: .2, range: 1900 }, { err: .012, react: .09, range: 2600 }];
function nearestHumanDist(p) { let d = 1e9; for (const q of G.players.values()) if (!q.isBot && q.alive) d = Math.min(d, Math.abs(q.x - p.x) + Math.abs(q.y - p.y)); return d; }
function botPickTarget(p, ai) {
  const sk = SKILL[G.opts.skill ?? 1] || SKILL[1]; const tm = teamsOn() ? p.team : 0; const cand = [];
  for (const q of G.players.values()) { if (q === p || !q.alive || (tm && q.team === tm)) continue; const dx = q.x - p.x, dy = q.y - p.y; const d = dx * dx + dy * dy; if (d > sk.range * sk.range) continue; cand.push([d, q]); }
  cand.sort((a, b) => a[0] - b[0]); let best = null, bd = 1e18;
  for (let i = 0; i < Math.min(3, cand.length); i++) { const [d, q] = cand[i]; const s = Math.sqrt(d) * (lineOfSight(p.x, p.y, q.x, q.y) ? 1 : 1.6); if (s < bd) { bd = s; best = q; } }
  ai.target = best ? best.id : null; ai.strafe = (Math.random() - .5) * 2; ai.err = (Math.random() - .5) * sk.err;
  if (!best) { // nothing nearby: head for the enemy side in war, otherwise roam
    if (warOn() && p.team) { const n = teamCount(); let et = 1 + ((Math.random() * n) | 0); if (et === p.team) et = et % n + 1; const b = G.bases[et]; ai.wander = b ? b.x + (Math.random() - .5) * 300 : Math.random() * W; }
    else if (Math.abs(ai.wander - p.x) < 80 || Math.random() < .15) ai.wander = clamp(p.x + (Math.random() - .5) * 1400, 60, W - 60);
  }
}
const _botThinkModes = botThink;
botThink = function (p, dt) {
  const ai = p.ai || (p.ai = { t: 0, target: null, strafe: 0, err: 0, wander: W / 2, nextJump: 0 });
  if (warBuildPhase()) { botBuild(p, dt); return; }
  // far-away bots in big crowds think at half rate (their inputs persist between frames)
  if (G.players.size > 24) { ai.lodT = (ai.lodT || 0) - dt; if (ai.lodT <= 0) ai.far = nearestHumanDist(p) > 2600, ai.lodT = 1; if (ai.far) { ai.acc = (ai.acc || 0) + dt; ai.odd = !ai.odd; if (ai.odd) return; dt = ai.acc; ai.acc = 0; } }
  ai.k = (ai.k || 0) - dt; if (ai.k <= 0) { const sk = SKILL[G.opts.skill ?? 1] || SKILL[1]; ai.k = sk.react * (.75 + Math.random() * .5); botPickTarget(p, ai); }
  ai.t = 99; // the core picker is replaced by botPickTarget
  _botThinkModes(p, dt);
};
/* a lean-to: front post + roof, stone cover toward the enemy, a bulb under the roof; the back stays open.
   Each bot walks to its own spot near the team flag first, so the forts spread out into a little camp. */
function groundUnder(x, y0) { for (let y = y0; y < y0 + 120; y += 2) if (solidAt(x, y)) return y; return null; }
function shelterPlan(b) {
  const d = b.dir, x = b.x, gPost = groundUnder(x + 44 * d, b.feet - 40), gWall = groundUnder(x + 84 * d, b.feet - 40);
  if (gPost == null) return []; const top = gPost - 71; const steps = [['plank', x + 44 * d, gPost - 35, 90], ['beam', x - 12 * d, top - 7, 0], ['bulb', x + 10 * d, top + 10, 0], ['plank', x - 12 * d, top - 19, 0]];
  if (gWall != null) steps.splice(3, 0, ['wall', x + 84 * d, gWall - 17, 0], ['wall', x + 84 * d, gWall - 53, 0]);
  return steps;
}
function botSite(p) {
  const base = G.bases[p.team]; if (!base) return p.x; const [a, b] = teamRegion(p.team);
  const mates = [...G.players.values()].filter(q => q.team === p.team && q.isBot).map(q => q.id).sort(); const idx = Math.max(0, mates.indexOf(p.id));
  let k = 0; for (let i = 0; i < 40; i++) { const off = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 190; const x = base.x + off; if (x < a + 60 || x > b - 60) continue; if (!spawnOk(x)) continue; if (k++ === idx) return x; }
  return p.x;
}
function botBuild(p, dt) {
  const inp = p.input; inp.mx = 0; inp.jumpHeld = false; inp.down = false; p.aiming = false; if (!p.alive) return;
  if (!p.kit) { hostSetKit(p, true); return; }
  if (!p.buildPlan) p.buildPlan = { i: 0, site: botSite(p), x: 0, feet: 0, dir: Math.sign(W / 2 - p.x) || 1, steps: null, t0: now(), next: 0, lx: p.x, stuck: 0 };
  const b = p.buildPlan;
  if (!b.steps) { // walking to the site
    const dx = b.site - p.x; const late = now() - b.t0 > 7;
    if (Math.abs(dx) > 24 && !late) { inp.mx = Math.sign(dx); if (Math.abs(p.x - b.lx) < 1) { b.stuck += dt; if (b.stuck > .5 && p.grounded) { inp.jump = true; inp.jumpHeld = true; b.stuck = 0; } } else b.stuck = 0; b.lx = p.x; return; }
    if (!p.grounded) return; b.x = p.x; b.feet = p.y + HH; b.dir = Math.sign(W / 2 - p.x) || 1; if (warOn() && G.bases[p.team]) { const others = G.bases.filter((q, t) => q && t !== p.team); if (others.length) { const c = others.reduce((s, q) => s + q.x, 0) / others.length; b.dir = Math.sign(c - p.x) || 1; } }
    b.steps = shelterPlan(b); b.next = now() + .2 + Math.random() * .6;
  }
  if (b.i >= b.steps.length) { p.face = b.dir; if (Math.abs(p.x - b.x) > 24) inp.mx = Math.sign(b.x - p.x) * .5; return; }
  if (Math.abs(p.x - b.x) > 24) { inp.mx = Math.sign(b.x - p.x); return; }
  if (now() < b.next) return; b.next = now() + .4 + Math.random() * .3;
  const [kind, x, y, rot] = b.steps[b.i++];
  p.aim = Math.atan2(y - p.y, x - p.x); p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
  if (G.debugBuild) G.debugBuild.push(kind + ':' + placeCheck(kind, x, y, rot * Math.PI / 180, p));
  hostTool(p, x, y, ALL_TOOLS.indexOf(kind), rot);
}

/* ---------- client events ---------- */
const _applyEventModes = applyEvent;
applyEvent = function (e) {
  switch (e.k) {
    case 'teams': for (const [id, t] of e.l) { const p = G.players.get(id); if (p) p.team = t; } UI.rosterChanged(); return;
    case 'tix': G.tickets = e.l || {}; return;
    case 'opts': G.opts = Object.assign({}, RULE_DEFAULTS, e.o || {}); if (e.mo) G.gameMode = e.mo; UI.rosterChanged(); return;
    case 'warmsg': if (G.mode === 'play') { if (e.m === 'build') UI.banner('Build phase', `${G.opts.buildT | 0}s to fortify · B toggles the kit · no damage yet`, 2.6); else UI.banner('War', 'build phase over · take their base', 1.8); Audio2.play('round'); } return;
  }
  if (e.k === 'round') { if (e.ts) G.teamScore = e.ts; if (e.tx) G.tickets = e.tx; if (e.ph === 'fight') G.roundLen = e.left; }
  _applyEventModes(e);
  if (e.k === 'round' && G.mode === 'play' && !G.demo) {
    if ((e.ph === 'over' || e.ph === 'champion') && e.wt != null && teamsOn()) { const me = G.players.get(G.myId); const mine = me && me.team === e.wt;
      if (e.wt) UI.banner(e.ph === 'champion' ? teamName(e.wt) + ' team takes the match' : teamName(e.wt) + ' team wins', (e.msg === 'time' ? 'on time · ' : '') + Object.keys(TEAM_INFO).slice(1, teamCount() + 1).map(t => teamName(+t) + ' ' + (G.teamScore[t] || 0)).join(' · '), e.ph === 'champion' ? 5 : 2.6);
      else UI.banner('Draw', 'no team left standing', 2.4);
      if (mine) Audio2.play('win'); }
    if (e.ph === 'over' && e.msg && e.wt == null) UI.banner(e.msg, 'new rules from the next round', 1.6);
    if (e.ph === 'champion') G.teamScore = {};
  }
};

/* ---------- war bases (all clients compute them from the map) ---------- */
MapHooks.push(() => {
  G.bases = []; if (!warOn()) return; const n = teamCount();
  for (let t = 1; t <= n; t++) { const [a, b] = teamRegion(t); let best = null; for (let i = 0; i < 24; i++) { const x = a + (b - a) * (.3 + .4 * i / 23); const y = surfaceFromGrid(x); if (y == null || y > H - 40 || waterAt(x, y - 6)) continue; if (!best || Math.abs(x - (a + b) / 2) < Math.abs(best.x - (a + b) / 2)) best = { x, y }; } G.bases[t] = best || { x: (a + b) / 2, y: surfaceFromGrid((a + b) / 2) || H / 2 }; }
});
function drawBases(c, t) {
  if (!warOn() || !G.bases.length) return;
  for (let tm = 1; tm < G.bases.length; tm++) { const b = G.bases[tm]; if (!b || !visibleWorld(b.x, b.y, 200)) continue; const x = b.x, y = (surfaceFromGrid(b.x) ?? b.y);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + 1, y - 92); c.stroke();
    const col = teamColor(tm); c.fillStyle = col; c.beginPath(); c.moveTo(x + 1, y - 90); for (let i = 0; i <= 8; i++) { const k = i / 8; c.lineTo(x + 2 + k * 44, y - 90 + Math.sin(t * 5 + k * 4 + tm) * 3 * k); } for (let i = 8; i >= 0; i--) { const k = i / 8; c.lineTo(x + 2 + k * 44, y - 64 + Math.sin(t * 5 + k * 4 + tm + .6) * 3 * k - k * 4); } c.closePath(); c.fill(); c.lineWidth = 2.2; c.stroke();
    c.fillStyle = 'rgba(255,250,236,.85)'; c.beginPath(); c.arc(x + 20, y - 78, 5, 0, TAU); c.fill(); c.strokeStyle = 'rgba(31,28,36,.35)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y + 3, 22, 4, 0, 0, TAU); c.stroke(); c.restore(); }
}
const _drawPropsModes = drawProps;
drawProps = function (c, V, t) { _drawPropsModes(c, V, t); drawBases(c, t); };
const _drawPlayerModes = drawPlayer;
drawPlayer = function (c, p, t) {
  if (p.alive && p.team && teamsOn() && visibleWorld(p.x, p.y, 60)) { c.save(); c.strokeStyle = teamColor(p.team); c.globalAlpha = .85; c.lineWidth = 3; c.beginPath(); c.ellipse(p.x, p.y + HH + 1, 17, 4.5, 0, 0, TAU); c.stroke(); c.restore(); }
  _drawPlayerModes(c, p, t);
};
drawOffscreenArrows = function (c) {
  if (G.gameMode !== 'expedition') return; const me = G.players.get(G.myId); if (!me) return; const m = 26; const list = [];
  for (const p of G.players.values()) { if (!p.alive || p.id === G.myId) continue; const [sx, sy] = toScreen(p.x, p.y); if (sx > 0 && sx < R8.cw && sy > 0 && sy < R8.ch) continue; list.push([Math.hypot(p.x - me.x, p.y - me.y) * (p.team && p.team === me.team ? .5 : 1), p, sx, sy]); }
  list.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < Math.min(7, list.length); i++) { const [, p, sx, sy] = list[i]; const cx = clamp(sx, m, R8.cw - m), cy = clamp(sy, 70, R8.ch - m); const a = Math.atan2(sy - cy, sx - cx); c.save(); c.translate(cx, cy); c.rotate(a); c.globalAlpha = i < 4 ? 1 : .6; c.fillStyle = p.team && teamsOn() ? teamColor(p.team) : p.color; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(13, 0); c.lineTo(-8, -9); c.lineTo(-4, 0); c.lineTo(-8, 9); c.closePath(); c.fill(); c.stroke(); if (p.team && p.team === me.team) { c.fillStyle = 'rgba(255,250,236,.9)'; c.beginPath(); c.arc(0, 0, 2.5, 0, TAU); c.fill(); } c.restore(); }
};

/* ---------- HUD: team scores, tickets, build timer; compact scoreboard ---------- */
const ModesUI = {
  el: null, key: '',
  ensure() {
    if (this.el) return this.el; const st = document.createElement('style');
    st.textContent = `#teamHud{position:fixed;left:50%;top:calc(112px + var(--safe-t,0px));transform:translateX(-50%);display:flex;gap:6px;z-index:30;font-family:"Shantell Sans",sans-serif;pointer-events:none}
#teamHud.hidden,.ib-paused #teamHud,.ib-paused #buildbar{display:none!important}#teamHud .tc{display:flex;align-items:center;gap:6px;padding:3px 10px 3px 6px;background:rgba(243,236,222,.92);border:2.5px solid #1f1c24;border-radius:12px;box-shadow:2px 3px 0 rgba(31,28,36,.3);font-size:13px;font-weight:700;color:#1f1c24}
#teamHud .tc i{width:14px;height:14px;border-radius:50%;border:2px solid #1f1c24;background:var(--c)}#teamHud .tc b{font-size:17px}#teamHud .tc small{font-size:11px;opacity:.7;font-weight:600}#teamHud .tc.me{transform:translateY(2px) rotate(-1.5deg);background:#fff6dc}
#teamHud .bt{padding:3px 10px;background:#1f1c24;color:#fbf3df;border-radius:12px;font-size:13px;font-weight:700;align-self:center}
.rules-panel{margin:4px 0 10px;border:2px dashed rgba(31,28,36,.3);border-radius:14px;padding:8px 10px 2px}.rules-panel summary{cursor:pointer;font-weight:800;font-size:14px;list-style:none;display:flex;justify-content:space-between;align-items:center;padding:2px 0 6px}.rules-panel summary::-webkit-details-marker{display:none}.rules-panel summary span{font-weight:600;font-size:11px;opacity:.65}.rules-panel[open] summary span{display:none}
.rules-panel .setup-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}.rules-panel .field{margin-bottom:8px}.rules-panel .wilds-only.off{display:none}.rules-panel .hint2{font-size:11px;color:var(--ink-soft,#6b6470);margin:0 0 8px}
#modeRow{justify-content:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}@media(max-width:900px){#teamHud{top:calc(160px + var(--safe-t,0px));gap:4px}#teamHud .tc{padding:2px 7px 2px 4px;font-size:11px}#teamHud .tc b{font-size:14px}#teamHud .tc small{font-size:9.5px}}`;
    document.head.append(st); const el = document.createElement('div'); el.id = 'teamHud'; el.className = 'hidden'; document.body.append(el); this.el = el; return el;
  },
  tick() {
    const el = this.ensure(); const pz = $('#pause'); document.body.classList.toggle('ib-paused', !!(pz && !pz.classList.contains('hidden'))); const on = G.mode === 'play' && teamsOn() && !G.demo; if (!on) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); this.key = ''; return; }
    const n = teamCount(); const me = G.players.get(G.myId); const alive = new Array(n + 1).fill(0), tot = new Array(n + 1).fill(0);
    for (const p of G.players.values()) if (p.team) { tot[p.team]++; if (p.alive) alive[p.team]++; }
    const bt = warBuildPhase() ? Math.ceil((G.opts.buildT | 0) - fightElapsed()) : -1; let html = '';
    for (let t = 1; t <= n; t++) html += `<div class="tc${me && me.team === t ? ' me' : ''}" style="--c:${teamColor(t)}"><i></i><b>${G.teamScore[t] || 0}</b><small>${alive[t]}/${tot[t]} up${warOn() ? ' · ' + (G.tickets[t] | 0) + ' lives' : ''}</small></div>`;
    if (bt >= 0) html += `<div class="bt">build ${bt}s</div>`;
    if (html !== this.key) { this.key = html; el.innerHTML = html; } el.classList.remove('hidden');
  }
};
const _tickHudModes = UI.tickHud.bind(UI);
UI.tickHud = function () { _tickHudModes(); ModesUI.tick(); };
UI.renderScores = function () {
  const all = [...G.players.values()].sort((a, b) => b.score - a.score); let ps = all; let more = 0;
  if (all.length > 9) { ps = all.slice(0, 8); const me = G.players.get(G.myId); if (me && !ps.includes(me)) ps.push(me); more = all.length - ps.length; }
  const html = ps.map(p => `<div class="score${p.alive ? '' : ' dead'}${p.id === G.myId ? ' me' : ''}" data-id="${p.id}"><span class="blob" style="--c:${p.color}${p.team && teamsOn() ? ';box-shadow:0 0 0 2.5px ' + teamColor(p.team) : ''}"></span>${esc(p.name)} <span class="n">${p.score}</span></div>`).join('') + (more ? `<div class="score dead">+${more} more</div>` : '');
  const el = $('#scores'); if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
};

/* ---------- the rules panel (shared by Host and Practice) ---------- */
const RULE_FIELDS = [
  { k: 'hp', l: 'Health', o: [[100, 'Normal'], [200, 'Tough ×2'], [300, 'Sturdy ×3'], [500, 'Tank ×5'], [1000, 'Marathon ×10'], [-1, 'Custom (type it →)']] },
  { k: 'hpCustom', l: 'Custom health — any number', num: 1, o: [[0, '']] },
  { k: 'time', l: 'Round time', o: [[0, 'Auto'], [60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min'], [600, '10 min']] },
  { k: 'sd', l: 'Sudden death', o: [[1, 'On'], [0, 'Off (timer ends it)']] },
  { k: 'drops', l: 'Supply drops', o: [[1, 'Normal'], [2, 'Lots'], [0, 'Off']] },
  { k: 'weapons', l: 'Starting weapon', o: [['random', 'Random each'], ['same', 'Same for all'], ['fists', 'Fists + drops']] },
  { k: 'skill', l: 'Bot skill', o: [[0, 'Easy'], [1, 'Normal'], [2, 'Hard'], [3, 'Nightmare']] },
  { k: 'mapSize', l: 'Map size', w: 1, o: [[4, '4× classic'], [6, '6× classic'], [9, '9× classic'], [-1, 'Custom (set size →)']] },
  { k: 'crowd', l: 'Bot crowd', w: 1, o: [[0, 'Use bots setting'], [10, '10 bots'], [20, '20 bots'], [40, '40 bots'], [60, '60 bots'], [100, '100 bots']] },
  { k: 'teams', l: 'Teams', o: [[0, 'Free for all'], [2, '2 teams'], [3, '3 teams'], [4, '4 teams'], [5, '5 teams'], [6, '6 teams'], [8, '8 teams']] },
  { k: 'ff', l: 'Friendly fire', o: [[0, 'Off'], [1, 'On']] },
  { k: 'war', l: 'War mode', w: 1, o: [[0, 'Off'], [1, 'On (teams + building)']] },
  { k: 'tickets', l: 'War lives', w: 1, o: [[5, 'Few'], [10, 'Some'], [20, 'Many'], [40, 'Loads']] },
  { k: 'buildT', l: 'Build phase', w: 1, o: [[0, 'None'], [20, '20 s'], [30, '30 s'], [60, '60 s']] },
  { k: 'weather', l: 'Weather', o: [['biome', 'Biome default'], ['random', 'Random'], ['wild', 'Wild'], ['clear', 'Clear skies']] },
  { k: 'storm', l: 'Storm wall', w: 1, o: [[0, 'Off'], [1, 'On']] },
];
function loadRules() { try { return Object.assign({}, RULE_DEFAULTS, JSON.parse(getCookie('ib_rules') || '{}')); } catch (e) { return Object.assign({}, RULE_DEFAULTS); } }
const RulesPanel = {
  el: null, vals: loadRules(),
  build() {
    if (this.el) return this.el; ModesUI.ensure(); const d = document.createElement('details'); d.className = 'rules-panel';
    d.innerHTML = `<summary>Rules &amp; customisation <span>tap to open</span></summary><div class="setup-grid">` + RULE_FIELDS.map(f => `<div class="field${f.w ? ' wilds-only' : ''}"><label class="lbl" for="rule_${f.k}">${f.l}</label><select id="rule_${f.k}" data-k="${f.k}">${f.o.map(([v, n]) => `<option value="${v}"${String(this.vals[f.k]) === String(v) ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`).join('') + `</div><p class="hint2" id="rulesHint"></p>`;
    d.addEventListener('change', e => { const s = e.target.closest('select[data-k]'); if (!s) return; const f = RULE_FIELDS.find(x => x.k === s.dataset.k); this.vals[f.k] = typeof f.o[0][0] === 'number' ? +s.value : s.value; if (f.k === 'war' && this.vals.war && !this.vals.teams) { this.vals.teams = 2; $('#rule_teams').value = '2'; } setCookie('ib_rules', JSON.stringify(this.vals)); this.sync(); });
    this.el = d; return d;
  },
  modeSel() { return this.el && this.el.closest('#host') ? $('#hostMode') : $('#practiceMode'); },
  sync() {
    if (!this.el) return; const big = (this.modeSel() || {}).value === 'expedition';
    for (const f of this.el.querySelectorAll('.wilds-only')) f.classList.toggle('off', !big);
    const v = this.vals; const h = $('#rulesHint');
    if (h) h.textContent = big ? (v.war ? `War: ${Math.max(2, v.teams || 2)} teams, ${v.buildT}s build phase with the kit (B), shared team lives (${['Few','Some','Many','Loads'][[5,10,20,40].indexOf(v.tickets)] || v.tickets}, scaled by team size). You can end War mode from the pause menu.` : v.teams ? `${v.teams} teams — bots and real players are split evenly.` : 'The Big Wilds: the classic map, just much bigger. The Tool Box drops in about half the matches.') : 'More options (teams, War mode, map size, bot crowds) live in The Big Wilds.';
  },
  mount(screen) { const d = this.build(); const card = $('#' + screen + ' .card'); if (!card) return; const anchor = screen === 'host' ? $('#hostErr') : $('#modeNote'); if (anchor && anchor.parentNode === card) card.insertBefore(d, anchor); else card.append(d); this.sync(); }
};
const _showModes = UI.show.bind(UI);
UI.show = function (name, ...rest) { const r = _showModes(name, ...rest); if (name === 'host' || name === 'practice') try { RulesPanel.mount(name); } catch (e) { console.warn(e); } return r; };
for (const id of ['#hostMode', '#practiceMode']) { const s = $(id); if (s) s.addEventListener('change', () => RulesPanel.sync()); }
{ const pb = $('#practiceBots'); if (pb) for (const n of [15, 30, 60, 100]) { const o = document.createElement('option'); o.value = n; o.textContent = n + ' bots (Big Wilds)'; pb.append(o); } }

const _startHostModes = startHost;
startHost = function (opts) {
  const v = Object.assign({}, RULE_DEFAULTS, RulesPanel.vals); const big = opts.gameMode === 'expedition';
  if (!big) Object.assign(v, { war: 0, storm: 0, crowd: 0, mapSize: v.mapSize === -1 ? -1 : 4 }); // teams + friendly fire stay: they work in the arena
  if (v.war && !v.teams) v.teams = 2;
  if (v.hp === -1) v.hp = Math.max(1, v.hpCustom | 0) || 100; // custom health: any number you typed
  G.opts = v; G.teamScore = {}; G.tickets = {};
  let bots = Math.max(0, opts.bots | 0); if (big && v.crowd) bots = v.crowd; // no cap: as many bots as you like
  G.botCap = big && bots > 7 ? bots + Math.max(opts.max | 0, 8) : (big ? 100 : bots);
  applyChaos(v); // gravity / run speed / jump power dials
  return _startHostModes(Object.assign({}, opts, { bots, max: Math.max(opts.max | 0, 8, bots + 1) }));
};

/* chaos dials: scale the physics constants (restored to base on every start) */
const PHYS_BASE = { GRAV: 2300, RUN: 370, JUMP: 840, JUMP2: 740 };
function applyChaos(v) {
  GRAV = PHYS_BASE.GRAV * clamp((v.chaosGrav || 100) / 100, 0.02, 20);
  RUN = PHYS_BASE.RUN * clamp((v.chaosSpeed || 100) / 100, 0.05, 20);
  JUMP = PHYS_BASE.JUMP * clamp((v.chaosJump || 100) / 100, 0.05, 20);
  JUMP2 = PHYS_BASE.JUMP2 * clamp((v.chaosJump || 100) / 100, 0.05, 20);
}

/* infinite ammo: top the magazine up right before every attack */
{
  const _hostAttackInf = hostAttack;
  hostAttack = function (pid, a, x, y, s, remote) {
    if (G.opts && G.opts.infAmmo) { const p = G.players.get(pid); if (p && p.alive) { const w = weaponOf(p); if (w && w.ammo > 0 && p.ammo < w.ammo) p.ammo = w.ammo; } }
    return _hostAttackInf(pid, a, x, y, s, remote);
  };
}

/* kill streaks: splat 3, 5, 7+ without falling and the whole room hears about it */
{
  const STREAKS = { 2: 'Double splat', 3: 'TRIPLE SPLAT', 5: 'RAMPAGE', 7: 'UNSTOPPABLE', 10: 'GODLIKE' };
  const _hostKillStreak = hostKill;
  hostKill = function (q, by, wid) {
    const r = _hostKillStreak(q, by, wid);
    try {
      const p = by && G.players.get(by);
      if (p && p.alive) {
        p.streak = (p.streak | 0) + 1;
        const msg = STREAKS[p.streak];
        if (msg) emit({ k: 'streak', id: p.id, n: p.streak, m: msg });
      }
      if (q) q.streak = 0;
    } catch (e) { }
    return r;
  };
  const _applyStreak = applyEvent;
  applyEvent = function (e) {
    if (e.k === 'streak') { const p = G.players.get(e.id); if (p && G.mode === 'play') UI.toast(`<b>${esc(p.name)}</b> · ${e.m} <span style="opacity:.6">×${e.n}</span>`); return; }
    return _applyStreak(e);
  };
  const _startRoundStreak = startRound;
  startRound = function () { for (const p of G.players.values()) p.streak = 0; return _startRoundStreak(); };
}

/* ---------- pause menu: bots in tens, War mode on/off ---------- */
const _renderPauseModes = UI.renderPause.bind(UI);
UI.renderPause = function () {
  _renderPauseModes(); let row = $('#modeRow');
  if (!row) { row = document.createElement('div'); row.id = 'modeRow'; row.className = 'row hidden'; const br = $('#botRow'); br.parentNode.insertBefore(row, br.nextSibling);
    row.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b || !G.isHost) return; Audio2.play('ui'); pauseAction(b.dataset.a); UI.renderPause(); }); }
  row.classList.toggle('hidden', !G.isHost); if (!G.isHost) return;
  const big = G.gameMode === 'expedition'; const cap = G.botCap != null ? G.botCap : 7;
  row.innerHTML = (cap > 7 ? `<button class="btn small" data-a="b-10">−10 bots</button><button class="btn small" data-a="b+10">+10 bots</button>` : '') +
    `<button class="btn small" data-a="teams">${teamsOn() ? 'Teams: ' + teamCount() : 'Teams: off'}</button>` +
    `<button class="btn small${warOn() ? ' primary' : ''}" data-a="war">${warOn() ? 'End War mode' : 'Start War mode'}</button>` + (big ? '' : '<p class="hint2" style="width:100%;text-align:center;margin:4px 0 0;font-size:11px">War mode switches the room to The Big Wilds. Teams work right here.</p>');
};
function pauseAction(a) {
  const o = G.opts;
  if (a === 'b+10' || a === 'b-10') { G.botsWanted = clamp(G.botsWanted + (a === 'b+10' ? 10 : -10), 0, G.botCap ?? 7); syncBots(); return; }
  if (a === 'teams') { const order = [0, 2, 3, 4]; o.teams = order[(order.indexOf(o.teams | 0) + 1) % order.length]; if (o.war && o.teams < 2) o.teams = 2; }
  if (a === 'war') { o.war = o.war && G.gameMode === 'expedition' ? 0 : 1; if (o.war && !o.teams) o.teams = 2; }
  const toBig = o.war && G.gameMode !== 'expedition'; if (toBig) { G.gameMode = 'expedition'; if (G.botCap == null) G.botCap = 100; }
  G.teamScore = {}; for (const p of G.players.values()) p.kit = false;
  emit({ k: 'opts', o, mo: G.gameMode }); assignTeams(true);
  if (G.players.size >= 2) setPhase('over', 1.6, { win: null, wt: null, msg: a === 'war' ? (o.war ? 'War mode' : 'War mode over') : (teamsOn() ? teamCount() + ' teams' : 'Free for all') });
  else setPhase('warmup', 0);
}

/* ---------- Inkhold: king of the ink ring ----------
   A glowing ring hops across the map every 20 seconds. Be the only
   player (or the only team) inside it to score a point per second.
   First player to the target wins the match; fallen players respawn. */
const INKHOLD_RING_R = 116, INKHOLD_HOP = 20;
function inkholdOn() { return G.gameMode === 'inkhold'; }
// every peer computes the same ring spot from the map seed + fight clock
function inkholdRing() {
  if (!inkholdOn() || G.phase !== 'fight') return null;
  const elapsed = Math.max(0, (G.roundLen || 300) - (G.phaseEnd - now()));
  const idx = Math.min(Math.floor(elapsed / INKHOLD_HOP), 14);
  const R = rng((T.seed >>> 0) + 7919 * (idx + 1));
  for (let tries = 0; tries < 60; tries++) {
    const x = W * (0.16 + R() * 0.68);
    const y = surfaceFromGrid(x);
    if (y != null && y > 150 && y < H - 140) return { x, y: y | 0, r: INKHOLD_RING_R, idx, age: elapsed - idx * INKHOLD_HOP };
  }
  return { x: W / 2, y: H / 2, r: INKHOLD_RING_R, idx, age: 1 };
}
function inkholdRules(all, alive, t, timeUp) {
  const h = Env.inkhold;
  if (G._ihPhase !== G.phase) { G._ihPhase = G.phase; if (G.phase === 'fight') { G._ihLast = t; G._ihAcc = 0; } } // fresh round
  // the fallen come back: the ring never stops
  for (const p of all) if (!p.alive && t > (p.respawnAt || 0) + 1.6) hostSpawn(p);
  if (!h) return;
  // score a point per second for the sole holder
  const dt = Math.max(0, t - (G._ihLast ?? t)); G._ihLast = t;
  G._ihAcc = (G._ihAcc || 0) + dt;
  if (G._ihAcc >= 1) {
    G._ihAcc -= 1;
    const cy = h.y - 30;
    const inside = alive.filter(p => Math.hypot(p.x - h.x, p.y - cy) < h.r);
    if (inside.length) {
      let gain = [];
      if (teamsOn()) { const tm = new Set(inside.map(p => p.team | 0)); if (tm.size === 1) gain = inside; }
      else if (inside.length === 1) gain = inside;
      for (const p of gain) p.score++;
    }
  }
  // win check
  const target = Math.max(1, G.target | 0 || 5);
  for (const p of all) if (p.score >= target) { setPhase('champion', 6, { win: p.id }); return; }
  if (timeUp) {
    const lead = all.slice().sort((a, b) => b.score - a.score || b.kills - a.kills || String(a.name).localeCompare(b.name))[0];
    setPhase(lead && lead.score > 0 ? 'champion' : 'over', lead && lead.score > 0 ? 6 : 2.4, { win: lead ? lead.id : null });
  }
}
function drawInkholdRing(c, V, t) {
  const h = Env.inkhold; if (!h || !inkholdOn() || G.phase !== 'fight') return;
  const x = h.x, y = h.y - 30;
  const k = 1 - Math.pow(1 - Math.min(1, h.age / 1.1), 3); // ring pops in after each hop
  const r = h.r * (.3 + .7 * k) * (1 + Math.sin(t * 2.6) * .03);
  const inside = [];
  for (const p of G.players.values()) if (p.alive && Math.hypot(p.x - h.x, p.y - y) < r) inside.push(p);
  let col = '#e055d8'; // unheld: mythic pink
  if (inside.length === 1) col = inside[0].col;
  else if (inside.length > 1) { const tm = new Set(inside.map(p => p.team | 0)); col = tm.size > 1 ? '#f2ecdf' : inside[0].col; }
  // soft glow disc
  const g = c.createRadialGradient(x, y, r * .1, x, y, r);
  g.addColorStop(0, col + '26'); g.addColorStop(.8, col + '14'); g.addColorStop(1, col + '00');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  // rotating dashed ring
  c.save();
  c.strokeStyle = col; c.globalAlpha = .75; c.lineWidth = 3.5;
  c.setLineDash([16, 11]); c.lineDashOffset = -t * 26;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.restore();
  // pulsing ink-drop glyph at the heart
  c.save();
  c.translate(x, y); c.globalAlpha = .45 + Math.sin(t * 2.6) * .15; c.fillStyle = col;
  c.beginPath(); c.moveTo(0, -15); c.bezierCurveTo(11, -2, 9, 11, 0, 13); c.bezierCurveTo(-9, 11, -11, -2, 0, -15); c.fill();
  c.restore();
}
{ // hook the environment update + zone drawing so every peer sees the same ring
  const _updateEnvInk = updateEnvironment;
  updateEnvironment = function (dt) { _updateEnvInk.call(this, dt); try { Env.inkhold = inkholdRing(); } catch (err) { Env.inkhold = null; } };
  const _drawZoneInk = drawZone;
  drawZone = function (c, V, t) { _drawZoneInk.call(this, c, V, t); try { drawInkholdRing(c, V, t); } catch (err) { } };
}
{ // bots: march to the ring, fight anything that contests it
  const _botThinkInk = botThink;
  botThink = function (p, dt) {
    _botThinkInk.call(this, p, dt);
    if (!inkholdOn() || G.phase !== 'fight' || !Env.inkhold || !p.alive || !p.ai) return;
    const h = Env.inkhold, ai = p.ai;
    const q = ai.target && G.players.get(ai.target);
    if (q && q.alive && Math.hypot(q.x - p.x, q.y - p.y) < 500) return; // busy fighting
    const d = h.x - p.x;
    if (Math.abs(d) > h.r * .6) {
      p.input.mx = Math.abs(d) > 300 ? Math.sign(d) : Math.sign(d) * Math.min(1, Math.abs(d) / 120);
      if (p.grounded && Math.random() < dt * 2) p.input.jump = true; // hop up ledges on the way
    } else p.input.mx *= .3; // settle on the ring
  };
}
{ // inkhold banners
  const _phaseInk = UI.phase;
  UI.phase = function (e) {
    if (!inkholdOn()) return _phaseInk.call(this, e);
    if (e.ph === 'countdown') {
      _phaseInk.call(this, e);
      UI.banner('Inkhold', `Hold the ring to score — first to ${Math.max(1, G.target | 0 || 5)} wins`, 2.4);
      return;
    }
    if ((e.ph === 'over' || e.ph === 'champion') && e.winner == null) {
      const lead = scoresList().slice().sort((a, b) => b[1] - a[1])[0];
      if (lead && lead[1] > 0) e = { ...e, ph: 'champion', winner: lead[0] };
    }
    return _phaseInk.call(this, e);
  };
}
