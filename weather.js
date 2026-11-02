'use strict';
/* =====================================================================
   weather.js: the weather registry and the newer weather types
   ---------------------------------------------------------------------
   Weather.register(name, def) adds a weather kind. The built-in kinds from
   expansion.js (rain, storm, drizzle, snow, leaves, petals, ash, embers,
   fireflies, sand, dust, sparkle, fog) keep their original code; every kind
   added here (or by a biome file through `newWeather`) uses this shape:

     {
       label: 'Blizzard',            // shown in the rules menu
       density: 300,                 // particles on a desktop at full quality
       anywhere: false,              // respawn anywhere in view (true) or at the top
       setup(W) {},                  // once per map (W = the Weather object)
       spawn(p, view, anywhere) {},  // place a particle (x, y, t, s, r are pre-set)
       update(p, dt, view) {},       // move it; return true to respawn it
       tick(dt, view) {},            // once per frame (timers, gusts…)
       drawBack(c, view, t) {},      // behind the terrain (skies, auroras)
       draw(c, parts, t) {},         // in front of the world
       glow(c, parts, t) {},         // additive light layer
     }
   Everything is pooled and batched into a handful of draw calls per frame.
   ===================================================================== */
{
  const base = { setup: Weather.setup, density: Weather.density, spawn: Weather.spawn, update: Weather.update, draw: Weather.draw, drawGlow: Weather.drawGlow };
  const BUILTIN = ['rain', 'storm', 'drizzle', 'snow', 'leaves', 'petals', 'ash', 'embers', 'fireflies', 'sand', 'dust', 'sparkle', 'fog'];
  const LABELS = { none: 'Clear', rain: 'Rain', storm: 'Thunderstorm', drizzle: 'Drizzle', snow: 'Snow', leaves: 'Falling leaves', petals: 'Petals', ash: 'Ash', embers: 'Embers', fireflies: 'Fireflies', sand: 'Sandstorm', dust: 'Dust', sparkle: 'Sparkles', fog: 'Fog' };
  Weather.kinds = {};
  Weather.def = null;
  Weather.register = function (name, def) { if (!name || !def || typeof def !== 'object') return; this.kinds[name] = def; LABELS[name] = def.label || name; };
  Weather.label = k => LABELS[k] || k;
  Weather.allKinds = () => BUILTIN.concat(Object.keys(Weather.kinds).filter(k => !Weather.kinds[k].hidden));

  // which weather a map gets: the biome's choice unless the room rules say otherwise.
  // Seeded by the map seed, so the host and every client pick the same thing.
  Weather.pick = function (th) {
    const rule = (G.opts && G.opts.weather) || 'biome';
    let w = th.weather; if (Array.isArray(w)) w = w.length ? w[(hash(T.seed | 0, 31) * w.length) | 0] : 'none';
    if (rule === 'clear') return 'none';
    if (rule === 'random') { const L = this.allKinds(); return L[(hash(T.seed | 0, 17) * L.length) | 0]; }
    if (rule === 'wild') { const L = ['storm', 'blizzard', 'hail', 'sand', 'meteors', 'gale']; return L[(hash(T.seed | 0, 19) * L.length) | 0]; }
    if (rule !== 'biome' && (this.kinds[rule] || BUILTIN.includes(rule))) return rule;
    return w || 'none';
  };
  Weather.setup = function (th) {
    base.setup.call(this, Object.assign({}, th, { weather: 'none' }));
    this.kind = this.pick(th); this.def = this.kinds[this.kind] || null; this.st = {}; this.parts = [];
    if (this.def && this.def.setup) try { this.def.setup(this, th); } catch (e) { console.warn('weather setup', e); }
    this.resize();
  };
  Weather.density = function () {
    if (!this.def) return base.density.call(this);
    return Settings.weather ? Math.round((this.def.density || 0) * R8.fxScale * (T.theme.weatherAmount || 1)) : 0;
  };
  Weather.spawn = function (p, anywhere) {
    const d = this.def; if (!d) return base.spawn.call(this, p, anywhere);
    const v = this.view || { x0: 0, y0: 0, x1: W, y1: H }; const w = v.x1 - v.x0, h = v.y1 - v.y0;
    p.x = v.x0 - 120 + Math.random() * (w + 240); p.y = anywhere || d.anywhere ? v.y0 + Math.random() * h : v.y0 - 20 - Math.random() * 80;
    p.t = Math.random() * 10; p.s = .6 + Math.random() * .8; p.r = Math.random() * TAU; p.vx = 0; p.vy = 0; p.b = 0;
    if (d.spawn) d.spawn(p, v, anywhere); return p;
  };
  Weather.update = function (dt, view) {
    const d = this.def; if (!d) return base.update.call(this, dt, view);
    this.view = view; if (this.flash > 0) this.flash -= dt * 2.4;
    if (d.tick) d.tick(dt, view, this);
    const P = this.parts, n = P.length, v = view, any = !!d.anywhere;
    for (let i = 0; i < n; i++) {
      const p = P[i]; p.t += dt;
      if ((d.update && d.update(p, dt, v, this)) || p.y > v.y1 + 40 || p.y < v.y0 - 160 || p.x < v.x0 - 240 || p.x > v.x1 + 240) this.spawn(p, any);
    }
  };
  Weather.draw = function (c, t) { const d = this.def; if (!d) return base.draw.call(this, c, t); if (d.draw && this.parts.length) d.draw(c, this.parts, t, this); };
  Weather.drawGlow = function (c, t) { const d = this.def; if (!d) return base.drawGlow.call(this, c, t); if (d.glow && this.parts.length) d.glow(c, this.parts, t, this); };
  Weather.drawBack = function (c, V, t) { const d = this.def; if (d && d.drawBack && Settings.weather) d.drawBack(c, V, t, this); };

  /* ---------- helpers ---------- */
  const wind = () => Env.wind || 0;
  const hitGround = p => solidAt(p.x, p.y) || waterAt(p.x, p.y);
  const nightish = () => !!T.theme.night;
  let _flake = null; function flakeSprite() { if (_flake) return _flake; const c = mkCanvas(24, 24), x = c.getContext('2d'); x.translate(12, 12); x.strokeStyle = '#ffffff'; x.lineWidth = 1.6; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -9); x.moveTo(0, -5); x.lineTo(-3, -8); x.moveTo(0, -5); x.lineTo(3, -8); x.stroke(); } x.strokeStyle = 'rgba(31,28,36,.25)'; x.lineWidth = .7; x.beginPath(); x.arc(0, 0, 2, 0, TAU); x.stroke(); return _flake = c; }
  let _seed = null; function seedSprite() { if (_seed) return _seed; const c = mkCanvas(32, 40), x = c.getContext('2d'); x.strokeStyle = 'rgba(255,255,250,.9)'; x.lineWidth = .9; x.lineCap = 'round'; for (let i = 0; i < 13; i++) { const a = -Math.PI + i / 12 * Math.PI; x.beginPath(); x.moveTo(16, 14); x.lineTo(16 + Math.cos(a) * 12, 14 + Math.sin(a) * 11); x.stroke(); x.fillStyle = 'rgba(255,255,250,.9)'; x.beginPath(); x.arc(16 + Math.cos(a) * 12, 14 + Math.sin(a) * 11, 1.1, 0, TAU); x.fill(); } x.strokeStyle = 'rgba(70,60,50,.7)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(16, 14); x.quadraticCurveTo(17, 24, 15, 34); x.stroke(); x.fillStyle = '#6a5440'; x.beginPath(); x.ellipse(15, 35, 1.6, 3, 0, 0, TAU); x.fill(); return _seed = c; }
  let _bub = null; function bubbleSprite() { if (_bub) return _bub; const c = mkCanvas(48, 48), x = c.getContext('2d'); const g = x.createRadialGradient(18, 16, 2, 24, 24, 22); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.55, 'rgba(190,230,255,.12)'); g.addColorStop(.85, 'rgba(255,190,240,.28)'); g.addColorStop(1, 'rgba(160,240,255,.5)'); x.fillStyle = g; x.beginPath(); x.arc(24, 24, 21, 0, TAU); x.fill(); x.strokeStyle = 'rgba(31,28,36,.35)'; x.lineWidth = 1.2; x.stroke(); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.arc(24, 24, 15, 3.6, 4.4); x.stroke(); return _bub = c; }

  /* ---------- Blizzard: thick sideways snow with white-out gusts ---------- */
  Weather.register('blizzard', {
    label: 'Blizzard', density: 340,
    setup(Wt) { Wt.st.gust = 0; Wt.st.g = 0; },
    spawn(p, v, any) { const w = wind() || -60; if (!any && Math.random() < .55) { p.x = w > 0 ? v.x0 - 40 - Math.random() * 60 : v.x1 + 40 + Math.random() * 60; p.y = v.y0 + Math.random() * (v.y1 - v.y0); } },
    tick(dt, v, Wt) { const s = Wt.st; s.gust -= dt; if (s.gust <= 0) s.gust = 3 + Math.random() * 5; s.g = clamp(Math.sin((s.gust / 8) * Math.PI), 0, 1); },
    update(p, dt, v, Wt) { const w = (wind() || -60) * (2.4 + Wt.st.g * 2.2); p.x += (w + Math.sin(p.t * 3 + p.r) * 40) * dt; p.y += (140 + 90 * p.s) * dt; return hitGround(p); },
    draw(c, P, t, Wt) {
      const n = P.length, w = (wind() || -60) * .05; c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath();
      for (let i = 0; i < n; i++) { const p = P[i], r = 1.6 + p.s * 1.6; c.moveTo(p.x + r, p.y); c.arc(p.x, p.y, r, 0, TAU); } c.fill();
      c.strokeStyle = 'rgba(240,248,255,.4)'; c.lineWidth = 1.1; c.beginPath(); for (let i = 0; i < n; i += 3) { const p = P[i]; c.moveTo(p.x, p.y); c.lineTo(p.x - w * 9 * p.s, p.y - 4); } c.stroke();
      const v = Wt.view; if (v) { c.fillStyle = `rgba(236,244,250,${(.06 + Wt.st.g * .16).toFixed(3)})`; c.fillRect(v.x0 - 20, v.y0 - 20, v.x1 - v.x0 + 40, v.y1 - v.y0 + 40); }
    },
  });
  /* ---------- Flurries: big, slow, star-shaped flakes (cosy) ---------- */
  Weather.register('flurries', {
    label: 'Snow flurries', density: 70,
    update(p, dt) { p.x += (wind() * .6 + Math.sin(p.t * 1.1 + p.r) * 22) * dt; p.y += (34 + 26 * p.s) * dt; p.r += dt * .6 * (p.s - 1); return hitGround(p); },
    draw(c, P) { const spr = flakeSprite();
      // drawn with plain drawImage (no rotate) so the whole layer costs one state change
      for (const p of P) { const r = 4 + p.s * 5; c.globalAlpha = .65 + .35 * p.s / 1.4; c.drawImage(spr, p.x - r, p.y - r, r * 2, r * 2); } c.globalAlpha = 1; },
  });
  /* ---------- Hail: fast pellets that bounce once and click ---------- */
  Weather.register('hail', {
    label: 'Hail', density: 170,
    update(p, dt) {
      p.vy = p.vy || 900 + p.s * 300; p.vx = p.vx || wind() * 1.5; p.vy += 1600 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (solidAt(p.x, p.y)) { if (p.b) return true; p.b = 1; p.y -= 4; p.vy = -p.vy * .28; p.vx = (Math.random() - .5) * 160; if (Math.random() < .15 && R8.fxScale > .5) FX.add({ k: 'drop', x: p.x, y: p.y, vx: (Math.random() - .5) * 60, vy: -60, r: 1, color: 'rgba(235,245,255,.9)', life: .25, t: 0 }); }
      const b = waterAt(p.x, p.y); if (b) { if (!b.lava && Math.random() < .5) waterPoke(b, p.x, 30, 0); return true; }
      return p.b && p.vy > 0 && p.t > 3;
    },
    draw(c, P) {
      c.fillStyle = 'rgba(236,246,255,.95)'; c.strokeStyle = 'rgba(60,80,110,.45)'; c.lineWidth = .8; c.beginPath();
      for (const p of P) { const r = 1.6 + p.s * 1.2; c.moveTo(p.x + r, p.y); c.arc(p.x, p.y, r, 0, TAU); } c.fill(); c.stroke();
      c.strokeStyle = 'rgba(220,235,250,.35)'; c.lineWidth = 1; c.beginPath(); for (const p of P) if (!p.b) { c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .012, p.y - p.vy * .012); } c.stroke();
    },
  });
  /* ---------- Aurora: curtains of light in the sky + slow sparkles ---------- */
  Weather.register('aurora', {
    label: 'Aurora', density: 22, anywhere: true,
    setup(Wt) { const R = rng((T.seed | 0) + 404); Wt.st.bands = [0, 1, 2].map(i => ({ y: H * (.1 + i * .07 + R() * .05), a: R() * TAU, f: .0016 + R() * .0016, h: 110 + R() * 90, col: ['#7dffb6', '#8fd4ff', '#d79bff'][i] })); Wt.st.spr = null; },
    update(p, dt) { p.y += Math.sin(p.t * .7 + p.r) * 6 * dt; return false; },
    drawBack(c, V, t, Wt) {
      const st = Wt.st; if (!st.bands) return; const x0 = V.x0 - 40, x1 = V.x1 + 40, step = Math.max(14, (x1 - x0) / 70);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const b of st.bands) {
        if (!b.g) { const g = c.createLinearGradient(0, b.y - b.h, 0, b.y + 30); g.addColorStop(0, rgba(b.col, 0)); g.addColorStop(.6, rgba(b.col, .2)); g.addColorStop(1, rgba(b.col, 0)); b.g = g; }
        c.fillStyle = b.g; c.beginPath(); let first = true;
        for (let x = x0; x <= x1; x += step) { const y = b.y + Math.sin(x * b.f + t * .35 + b.a) * 34 + Math.sin(x * b.f * 2.7 - t * .5) * 12; if (first) { c.moveTo(x, y + 30); first = false; } c.lineTo(x, y + 30); }
        for (let x = x1; x >= x0; x -= step) { const y = b.y + Math.sin(x * b.f + t * .35 + b.a) * 34 + Math.sin(x * b.f * 2.7 - t * .5) * 12; c.lineTo(x, y - b.h * (.75 + .25 * Math.sin(x * .01 + t * .8 + b.a))); }
        c.closePath(); c.fill();
      }
      c.restore();
    },
    glow(c, P, t) { const spr = softSprite('rgba(170,255,210,1)'); for (const p of P) { const a = Math.max(0, Math.sin(p.t * 1.4 + p.r * 3)); if (a < .05) continue; c.globalAlpha = a * .7; const r = 6 * p.s; c.drawImage(spr, p.x - r, p.y - r, r * 2, r * 2); } c.globalAlpha = 1; },
  });
  /* ---------- Meteor shower: shooting stars streak across the sky ---------- */
  Weather.register('meteors', {
    label: 'Meteor shower', density: 7,
    spawn(p, v) { p.x = v.x0 + Math.random() * (v.x1 - v.x0) * 1.2; p.y = v.y0 - 60 - Math.random() * 300; p.vx = -(380 + Math.random() * 420); p.vy = 220 + Math.random() * 200; p.wait = Math.random() * 3; },
    update(p, dt, v) { if (p.wait > 0) { p.wait -= dt; return false; } p.x += p.vx * dt; p.y += p.vy * dt; return p.y > v.y0 + (v.y1 - v.y0) * .62 || p.x < v.x0 - 200; },
    drawBack(c, V, t, Wt) {
      const P = Wt.parts; if (!P.length) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const p of P) { if (p.wait > 0) continue; const k = .06; const g = c.createLinearGradient(p.x, p.y, p.x - p.vx * k * 3, p.y - p.vy * k * 3); g.addColorStop(0, 'rgba(255,248,220,.95)'); g.addColorStop(1, 'rgba(255,200,140,0)'); c.strokeStyle = g; c.lineWidth = 2.6 * p.s; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * k * 3, p.y - p.vy * k * 3); c.stroke(); }
      c.restore();
    },
    glow(c, P) { const spr = softSprite('rgba(255,236,190,1)'); for (const p of P) { if (p.wait > 0) continue; c.globalAlpha = .9; const r = 14 * p.s; c.drawImage(spr, p.x - r, p.y - r, r * 2, r * 2); } c.globalAlpha = 1; },
  });
  /* ---------- Dandelion seeds: fluffy parachutes drifting up and across ---------- */
  Weather.register('seeds', {
    label: 'Dandelion seeds', density: 38, anywhere: true,
    update(p, dt) { p.x += (wind() * 1.2 + 14 + Math.sin(p.t * .9 + p.r) * 26) * dt; p.y += (Math.sin(p.t * .6 + p.r * 2) * 22 - 6) * dt; return false; },
    draw(c, P) { const spr = seedSprite(); for (const p of P) { const w = 12 + p.s * 8, h = w * 1.25; c.globalAlpha = .9; c.drawImage(spr, p.x - w / 2, p.y - h * .35, w, h); } c.globalAlpha = 1; },
  });
  /* ---------- Sunshower: light rain under a rainbow ---------- */
  Weather.register('sunshower', {
    label: 'Sunshower', density: 110,
    setup(Wt) { const R = rng((T.seed | 0) + 515); Wt.st.rx = W * (.3 + R() * .4); Wt.st.ry = H * .95; Wt.st.rr = Math.min(W, 1600) * (.5 + R() * .1); },
    update(p, dt) { const sp = 820 * p.s; p.vx = wind() * 1.8; p.vy = sp; p.x += p.vx * dt; p.y += sp * dt; if (solidAt(p.x, p.y)) return true; const b = waterAt(p.x, p.y); if (b) { if (!b.lava && Math.random() < .3) waterPoke(b, p.x, 14, 0); if (Math.random() < .25) Env.ripples.push({ x: p.x, y: waterSurfaceY(b, p.x), t: 0 }); return true; } return false; },
    drawBack(c, V, t, Wt) {
      const s = Wt.st; if (!s.rr) return; const cols = ['#ff7a7a', '#ffb36b', '#ffe27a', '#93e08a', '#7ec4ff', '#a99cf5'];
      c.save(); c.globalAlpha = .18 + .04 * Math.sin(t * .4); c.lineWidth = s.rr * .028;
      for (let i = 0; i < cols.length; i++) { c.strokeStyle = cols[i]; c.beginPath(); c.arc(s.rx, s.ry, s.rr - i * c.lineWidth, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
      c.restore();
    },
    draw(c, P) { c.strokeStyle = 'rgba(150,175,200,.38)'; c.lineWidth = 1.1; c.beginPath(); for (const p of P) { c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .014, p.y - p.vy * .014); } c.stroke(); c.strokeStyle = 'rgba(255,250,230,.4)'; c.lineWidth = .6; c.stroke(); },
  });
  /* ---------- Bubbles: iridescent bubbles that wobble upwards ---------- */
  Weather.register('bubbles', {
    label: 'Bubbles', density: 26,
    spawn(p, v, any) { if (!any) p.y = v.y1 + 20 + Math.random() * 60; },
    update(p, dt) { p.y -= (30 + 22 * p.s) * dt; p.x += (wind() * .4 + Math.sin(p.t * 1.6 + p.r) * 18) * dt; if (solidAt(p.x, p.y - 10 * p.s)) { if (R8.fxScale > .4) FX.add({ k: 'drop', x: p.x, y: p.y, vx: (Math.random() - .5) * 60, vy: -30, r: 1, color: 'rgba(220,245,255,.8)', life: .25, t: 0 }); return true; } return false; },
    draw(c, P) { const spr = bubbleSprite(); for (const p of P) { const r = 6 + p.s * 9, wob = 1 + Math.sin(p.t * 5 + p.r) * .06; c.drawImage(spr, p.x - r * wob, p.y - r / wob, r * 2 * wob, r * 2 / wob); } },
  });
  /* ---------- Mist: soft banks of low fog rolling over the ground ---------- */
  Weather.register('mist', {
    label: 'Low mist', density: 16, anywhere: true,
    spawn(p, v) { p.y = v.y0 + (v.y1 - v.y0) * (.45 + Math.random() * .5); p.w = 260 + Math.random() * 380; },
    update(p, dt) { p.x += (wind() * .25 + 8 * p.s) * dt; return false; },
    draw(c, P) { const spr = fogSprite(); for (const p of P) { c.globalAlpha = .22 + .12 * Math.sin(p.t * .3 + p.r); c.drawImage(spr, p.x - p.w / 2, p.y - p.w * .14, p.w, p.w * .28); } c.globalAlpha = 1; },
  });
  /* ---------- Gale: leaves + whooshing wind streaks in bursts ---------- */
  Weather.register('gale', {
    label: 'Gale', density: 90, anywhere: true,
    setup(Wt) { Wt.st.g = 0; Wt.st.gt = 0; },
    tick(dt, v, Wt) { const s = Wt.st; s.gt += dt; s.g = .35 + .65 * Math.max(0, Math.sin(s.gt * .55)) ** 2; },
    spawn(p) { p.kind = Math.random() < .45 ? 1 : 0; },
    update(p, dt, v, Wt) { const dir = Math.sign(wind() || 1), g = Wt.st.g; p.x += dir * (120 + 520 * g) * p.s * dt; p.y += (p.kind ? 30 + Math.sin(p.t * 3 + p.r) * 60 : Math.sin(p.t * 2 + p.r) * 10) * dt; p.r += dt * 4; return false; },
    draw(c, P, t, Wt) {
      const g = Wt.st.g, dir = Math.sign(wind() || 1); c.strokeStyle = `rgba(255,255,255,${(.18 + g * .3).toFixed(3)})`; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath();
      for (const p of P) { if (p.kind) continue; const L = (40 + 80 * g) * p.s; c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x - dir * L * .5, p.y - 5, p.x - dir * L, p.y); } c.stroke();
      const cols = T.theme.leaf || ['#d9573b', '#e9a23b', '#87a456'];
      for (let j = 0; j < cols.length; j++) { c.fillStyle = cols[j]; c.beginPath(); for (let i = j; i < P.length; i += cols.length) { const p = P[i]; if (!p.kind) continue; const sx = 5 * p.s; c.moveTo(p.x + Math.cos(p.r) * sx, p.y + Math.sin(p.r) * sx * .45); c.ellipse(p.x, p.y, sx, sx * .45 * Math.abs(Math.cos(p.t * 4 + p.r)) + .8, p.r, 0, TAU); } c.fill(); }
    },
  });
  /* ---------- Spores: glowing motes rising from the ground (caves, mushrooms) ---------- */
  Weather.register('spores', {
    label: 'Glowing spores', density: 46,
    spawn(p, v, any) { if (!any) p.y = v.y1 + 10 + Math.random() * 40; p.hue = Math.random(); },
    update(p, dt) { p.y -= (14 + 16 * p.s) * dt; p.x += (Math.sin(p.t * .8 + p.r) * 16 + wind() * .2) * dt; return false; },
    draw(c, P) { c.fillStyle = 'rgba(230,255,240,.85)'; c.beginPath(); for (const p of P) { const r = .9 + p.s; c.moveTo(p.x + r, p.y); c.arc(p.x, p.y, r, 0, TAU); } c.fill(); },
    glow(c, P) { const a = softSprite('rgba(120,255,220,1)'), b = softSprite('rgba(190,150,255,1)'); for (const p of P) { const k = .45 + .55 * Math.sin(p.t * 2 + p.r * 4) ** 2; c.globalAlpha = k * .75; const r = 9 * p.s; c.drawImage(p.hue < .6 ? a : b, p.x - r, p.y - r, r * 2, r * 2); } c.globalAlpha = 1; },
  });
  /* ---------- Starry night: twinkling stars + the odd firefly-like mote ---------- */
  Weather.register('stardust', {
    label: 'Stardust', density: 30, anywhere: true,
    update(p, dt) { p.x += (wind() * .15 + Math.cos(p.t * .3 + p.r) * 6) * dt; p.y += 4 * dt; return false; },
    glow(c, P) { const spr = softSprite('rgba(255,236,170,1)'); for (const p of P) { const a = Math.max(0, Math.sin(p.t * 1.7 + p.r * 5)); if (a < .05) continue; c.globalAlpha = a; const r = 8 * p.s; c.drawImage(spr, p.x - r, p.y - r, r * 2, r * 2); } c.globalAlpha = 1; },
    draw(c, P) { c.strokeStyle = 'rgba(255,246,210,.85)'; c.lineWidth = 1; c.beginPath(); for (const p of P) { const a = Math.sin(p.t * 1.7 + p.r * 5); if (a < .6) continue; const r = 3 * p.s * a; c.moveTo(p.x - r, p.y); c.lineTo(p.x + r, p.y); c.moveTo(p.x, p.y - r); c.lineTo(p.x, p.y + r); } c.stroke(); },
  });
}
