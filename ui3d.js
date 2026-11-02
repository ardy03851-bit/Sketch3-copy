/* =====================================================================
   ui3d.js — the layered "paper in 3D" HUD, card animations, quality-of-life
   extras and the champion victory scene.
     - HUD pieces float on stacked paper layers and tilt gently with the
       pointer (CSS perspective, no extra canvases).
     - Weapon card flips when you change weapons; score chips use the
       player's colour as a gradient; the leader wears a crown.
     - Hold Tab for the scoreboard, click the room code to copy an invite
       link, fullscreen button, ping + connection type indicator, rejoin the
       last room from the Join screen.
     - Victory: the screen fades into a small 3D scene (podium, spotlight,
       confetti, camera dolly) in the current biome's colours showing the
       winner's character and name (or the winning team).
   Loaded last, so it only wraps existing functions.
   ===================================================================== */
(function () {
  'use strict';
  const css = `
#hud{perspective:1100px;perspective-origin:50% 40%;--rx:0;--ry:0}
#hud .hud-top,#hud .wcard,#hud .killfeed,#hud .round-chip,#hud #miniMap,#hud .net{transform-style:preserve-3d;will-change:transform}
.hud-top{transform:rotateX(calc(var(--rx)*-1deg)) rotateY(calc(var(--ry)*1deg)) translateZ(0)}
.hud-btn,.codechip{background:linear-gradient(165deg,#fffaf0 0%,#f1e7d3 55%,#e4d6bb 100%);
  box-shadow:0 2px 0 #d6c8ad,0 4px 0 #c2b293,0 5px 0 rgba(31,28,36,.85),4px 10px 16px rgba(31,28,36,.28);transition:transform .18s cubic-bezier(.3,1.5,.4,1),box-shadow .18s}
.hud-btn:hover,.codechip:hover{transform:translateY(-2px) rotate(-1deg)}
.hud-btn:active,.codechip:active{transform:translateY(3px);box-shadow:0 1px 0 #c2b293,0 2px 0 rgba(31,28,36,.85),2px 4px 8px rgba(31,28,36,.25)}
.codechip .cp{font-size:10px;letter-spacing:.08em;opacity:.55;margin-left:2px}
.scores{perspective:700px}
.score{--c:#c2b293;position:relative;background:linear-gradient(160deg,#fffaf0 0%,#f3e9d6 60%,color-mix(in srgb,var(--c) 22%,#efe4cf) 100%);border-radius:12px 16px 11px 15px;
  box-shadow:0 2px 0 color-mix(in srgb,var(--c) 45%,#c2b293),0 3.5px 0 rgba(31,28,36,.8),3px 8px 12px rgba(31,28,36,.22);animation:chipIn .5s cubic-bezier(.2,1.4,.3,1) both;transform-origin:50% 0}
.score .blob{box-shadow:inset -2px -3px 0 rgba(0,0,0,.18),inset 2px 2px 0 rgba(255,255,255,.35)}
.score.me{background:linear-gradient(160deg,#fffdf6,#fff2d6 60%,color-mix(in srgb,var(--c) 35%,#ffe9bf));outline:2.5px solid color-mix(in srgb,var(--c) 70%,#fff);outline-offset:2px}
.score.lead::after{content:"";position:absolute;left:50%;top:-13px;width:22px;height:14px;transform:translateX(-50%) rotate(-6deg);
  background:linear-gradient(180deg,#ffe28a,#e9a23b);clip-path:polygon(0 100%,0 25%,25% 60%,50% 0,75% 60%,100% 25%,100% 100%);filter:drop-shadow(0 1.5px 0 #1f1c24)}
.score.dead{filter:grayscale(.75)}
.score.team{border-color:var(--tc,var(--ink))}
@keyframes chipIn{from{opacity:0;transform:rotateX(-80deg) translateY(-10px)}to{opacity:1;transform:none}}
.round-chip{background:linear-gradient(180deg,#fffaf0,#efe3cb);border:2px solid var(--ink);border-radius:999px;padding:6px 16px;box-shadow:0 2px 0 #c9b998,0 3.5px 0 rgba(31,28,36,.8),0 8px 14px rgba(31,28,36,.2);
  transform:translateX(-50%) rotateX(calc(var(--rx)*-1deg)) rotateY(calc(var(--ry)*1deg))}
.wcard{transform:translateX(-50%) rotateX(calc(12deg + var(--rx)*-1deg)) rotateY(calc(var(--ry)*1.4deg));transform-origin:50% 100%;
  background:radial-gradient(120% 140% at 0% 0%,#fffdf6 0%,#f4ead6 45%,#e8dbc0 100%);border-radius:18px 22px 16px 24px;border-top:2.3px solid var(--ink)!important;
  box-shadow:0 3px 0 #d7c9ac,0 6px 0 #c3b190,0 8px 0 rgba(31,28,36,.85),6px 18px 26px rgba(31,28,36,.32);padding:10px 18px 10px 12px;overflow:visible}
.wcard::before{content:"";position:absolute;left:14px;right:14px;top:-2px;height:5px;border-radius:0 0 6px 6px;background:linear-gradient(90deg,transparent,var(--rarity,#7b7280),transparent);opacity:.95}
.wcard::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.55) 45%,transparent 60%);background-size:250% 100%;background-position:120% 0;opacity:0}
.wcard.shine::after{animation:wcShine .9s ease-out}
@keyframes wcShine{0%{opacity:1;background-position:120% 0}100%{opacity:0;background-position:-60% 0}}
.wcard.flip{animation:wcFlip .5s cubic-bezier(.2,1.3,.3,1)}
@keyframes wcFlip{0%{transform:translateX(-50%) rotateX(12deg) rotateY(-90deg) scale(.9)}100%{transform:translateX(-50%) rotateX(12deg) rotateY(0) scale(1)}}
.wcard .wimg{width:84px;height:48px;border-radius:12px;background:radial-gradient(closest-side,color-mix(in srgb,var(--rarity,#7b7280) 26%,transparent),transparent);transform:translateZ(18px)}
.wcard .wimg img,.wcard .wimg canvas{max-width:80px;max-height:44px;filter:drop-shadow(2px 4px 0 rgba(31,28,36,.28))}
.wcard .wn{font-size:17px;text-shadow:0 1px 0 #fff}
.wcard .rarity-label{display:inline-block;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--rarity,#7b7280) 18%,transparent);border:1px solid color-mix(in srgb,var(--rarity,#7b7280) 60%,transparent)}
.hpbar{height:12px;border-radius:999px;background:linear-gradient(180deg,rgba(31,28,36,.2),rgba(31,28,36,.06));position:relative}
.hpbar i{background:linear-gradient(180deg,#ff9a6a 0%,#e0603f 55%,#b8452a 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.35);border-radius:999px}
.hpbar.low i{animation:hpPulse .7s ease-in-out infinite alternate}
@keyframes hpPulse{to{filter:brightness(1.35) saturate(1.3)}}
.hpbar::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(25% - 1.5px),rgba(31,28,36,.25) calc(25% - 1.5px) 25%);pointer-events:none}
.pip{background:linear-gradient(180deg,#ffd27a,#e9a23b 60%,#c27d22);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.5);transition:transform .2s,opacity .2s}
.pip.off{transform:translateY(2px) scale(.85)}
.pip-count{background:linear-gradient(180deg,#ffd98a,#e9a23b)}
.reload-track i{background:linear-gradient(90deg,#5fb8b0,#3f8a86)}
.kf{background:linear-gradient(120deg,rgba(40,36,48,.92),rgba(24,22,30,.86));box-shadow:0 2px 0 rgba(0,0,0,.35),3px 8px 14px rgba(0,0,0,.25);transform-origin:100% 50%;animation:kf3d .5s cubic-bezier(.2,1.3,.3,1) both}
@keyframes kf3d{from{opacity:0;transform:perspective(500px) rotateY(-75deg) translateX(30px)}to{opacity:1;transform:none}}
.banner{perspective:900px}
.banner .big{text-shadow:1px 1px 0 #b9ab90,2px 2px 0 #a99a7e,3px 3px 0 #998a6e,4px 4px 0 #897a5e,5px 6px 0 rgba(31,28,36,.85),8px 14px 18px rgba(31,28,36,.35)}
.banner.show .big{animation:banner3d .8s cubic-bezier(.2,1.4,.3,1) both}
@keyframes banner3d{0%{opacity:0;transform:rotateX(75deg) translateY(-40px) scale(.7)}60%{opacity:1}100%{transform:none}}
.toast{box-shadow:0 2px 0 #c2b293,0 3.5px 0 rgba(31,28,36,.8),3px 8px 12px rgba(31,28,36,.22)}
.net{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.net .q{width:8px;height:8px;border-radius:50%;background:#7b7280;box-shadow:0 0 0 2px rgba(255,255,255,.6)}
.net .q.good{background:#4f9a5a}.net .q.ok{background:#e9a23b}.net .q.bad{background:#d9573b}
#bFull{position:relative}
#scoreboard{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotateX(8deg);min-width:min(520px,92vw);max-height:76vh;overflow:auto;padding:18px 22px;pointer-events:none;
  background:radial-gradient(130% 120% at 0 0,#fffdf6,#efe4cf);border:2.5px solid var(--ink);border-radius:20px 26px 18px 28px;box-shadow:0 4px 0 #d7c9ac,0 8px 0 #c3b190,0 10px 0 rgba(31,28,36,.85),10px 28px 40px rgba(31,28,36,.35);animation:sbIn .3s cubic-bezier(.2,1.3,.3,1)}
@keyframes sbIn{from{opacity:0;transform:translate(-50%,-46%) rotateX(40deg)}}
#scoreboard h3{margin:0 0 10px;font-size:20px;display:flex;justify-content:space-between;align-items:baseline}#scoreboard h3 small{font-size:12px;color:var(--ink-soft)}
#scoreboard table{width:100%;border-collapse:collapse;font-weight:700}#scoreboard th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);text-align:left;padding:4px 6px}
#scoreboard td{padding:6px;border-top:1px dashed #c8bca7}#scoreboard td.n{text-align:right;font-variant-numeric:tabular-nums}#scoreboard tr.me td{background:rgba(233,162,59,.16)}
#scoreboard .blob{display:inline-block;width:14px;height:14px;border-radius:48% 52% 45% 55%/55% 45% 55% 45%;border:2px solid var(--ink);vertical-align:-2px;margin-right:6px}
#scoreboard .tm{display:inline-block;padding:0 6px;border-radius:6px;color:#fff;font-size:11px}
#victory{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity .6s ease}
#victory.on{opacity:1}
#victory canvas{width:100%;height:100%;display:block}
#rejoinRow{margin-top:8px}
.screen .card{transform-style:preserve-3d}
.screen.show .card,.screen:not(.hidden) .card{animation:card3d .55s cubic-bezier(.2,1.3,.3,1) both}
@keyframes card3d{from{opacity:0;transform:perspective(1200px) rotateX(18deg) translateY(24px) scale(.97)}to{opacity:1;transform:none}}
.btn{transition:transform .18s cubic-bezier(.3,1.5,.4,1),box-shadow .18s,filter .18s}
.btn:hover{filter:brightness(1.04)}
@media (prefers-reduced-motion:reduce){#hud *{animation:none!important}.hud-top,.wcard,.round-chip{transform:translateX(0)}}
@media(max-width:600px){.wcard{transform:translateX(-50%) rotateX(8deg)}.wcard .wimg{width:50px}.score.lead::after{top:-11px;width:16px;height:10px}}
`;
  const st = document.createElement('style'); st.id = 'ui3dCss'; st.textContent = css; document.head.append(st);
  // favicon (an ink splat) so browsers stop asking for /favicon.ico
  if (!document.querySelector('link[rel="icon"]')) { const l = document.createElement('link'); l.rel = 'icon'; l.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6c6 0 7 9 12 10s11-4 13 2-6 9-5 14 9 9 5 14-10 0-14 4-3 12-10 12-6-9-11-11-12 3-14-3 6-9 5-14-8-8-4-13 10 0 13-4S26 6 32 6z" fill="#d9573b" stroke="#1f1c24" stroke-width="4"/><circle cx="25" cy="28" r="4" fill="#1f1c24"/><circle cx="39" cy="28" r="4" fill="#1f1c24"/></svg>'); document.head.append(l); }

  /* ---------- pointer parallax: the HUD layers tilt a little ---------- */
  const hud = document.getElementById('hud'); let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const tilt = () => { raf = 0; cx += (tx - cx) * .2; cy += (ty - cy) * .2; hud.style.setProperty('--rx', cy.toFixed(2)); hud.style.setProperty('--ry', cx.toFixed(2)); if (Math.abs(tx - cx) + Math.abs(ty - cy) > .02) raf = requestAnimationFrame(tilt); };
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || G.mode !== 'play') return; tx = (e.clientX / innerWidth - .5) * 6; ty = (e.clientY / innerHeight - .5) * 5; if (!raf) raf = requestAnimationFrame(tilt); }, { passive: true });

  /* ---------- HUD: fullscreen button, copy-invite code chip ---------- */
  const top = hud.querySelector('.hud-top');
  if (top && !document.getElementById('bFull') && document.documentElement.requestFullscreen) {
    const b = document.createElement('div'); b.className = 'hud-btn'; b.id = 'bFull'; b.title = 'Fullscreen';
    b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    top.insertBefore(b, document.getElementById('scores'));
    b.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); });
  }
  const chip = document.getElementById('codeChip');
  if (chip) {
    // the chip used to open pause; online it now copies an invite link (pause is the button / Esc)
    const fresh = chip.cloneNode(true); chip.replaceWith(fresh); fresh.title = 'Copy invite link';
    fresh.addEventListener('click', () => {
      if (G.offline || !G.code) { UI.togglePause(); return; }
      const link = location.origin + location.pathname + '?join=' + G.code;
      const done = () => UI.toast('Invite link copied · <b>' + G.code + '</b>');
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, () => UI.hint(link, 4)); else UI.hint(link, 4);
    });
  }

  /* ---------- weapon card flip / shine, HP pulse, score crowns ---------- */
  const _hudWeapon = UI.hudWeapon;
  UI.hudWeapon = function (force) {
    const before = this._wkey; _hudWeapon.call(this, force);
    const card = document.getElementById('wcard'); if (!card) return;
    if (before !== this._wkey && before !== undefined) { card.classList.remove('flip', 'shine'); void card.offsetWidth; card.classList.add('flip', 'shine'); }
    const me = G.players.get(G.myId); const low = !!(me && me.alive && me.hp / maxHp() < .3); const hb = card.querySelector('.hpbar'); if (hb && hb.classList.contains('low') !== low) hb.classList.toggle('low', low);
  };
  UI.hurt = function () { const el = document.getElementById('wcard'); el.animate([{ translate: '0 0', rotate: '0deg' }, { translate: '-3px 2px', rotate: '-2deg' }, { translate: '3px 0', rotate: '2deg' }, { translate: '0 0', rotate: '0deg' }], { duration: 240 }); };
  const _renderScores = UI.renderScores;
  UI.renderScores = function () {
    _renderScores.call(this);
    const ps = [...G.players.values()]; const best = Math.max(0, ...ps.map(p => p.score)); const tOn = typeof teamsOn === 'function' && teamsOn();
    for (const el of document.querySelectorAll('#scores .score')) { const p = G.players.get(el.dataset.id); if (!p) continue; el.style.setProperty("--c", p.color); el.classList.toggle('lead', best > 0 && p.score === best);
      if (tOn && p.team && TEAM_INFO[p.team]) { el.classList.add('team'); el.style.setProperty('--tc', TEAM_INFO[p.team].c); } }
  };

  /* ---------- connection indicator ---------- */
  const _tickHud = UI.tickHud;
  UI.tickHud = function () {
    _tickHud.call(this); if (G.mode !== 'play') return;
    const ni = document.getElementById('netInfo'); if (!ni) return; let txt, q = '';
    if (G.offline) txt = 'offline practice';
    else if (G.isHost) txt = `hosting · ${Net.conns.size} connected`;
    else { const pg = Net.ping | 0; txt = `${pg} ms · ${Net.via === 'relay' ? 'relay' : 'direct'}`; q = pg < 90 ? 'good' : pg < 180 ? 'ok' : 'bad'; }
    const key = txt + q; if (ni.dataset.k === key) return; ni.dataset.k = key; ni.innerHTML = (q ? `<span class="q ${q}"></span>` : '') + esc(txt);
  };

  /* ---------- hold Tab: scoreboard ---------- */
  let sb = null;
  function showBoard(on) {
    if (on && G.mode !== 'play') on = false;
    if (!on) { if (sb) { sb.remove(); sb = null; } return; }
    if (!sb) { sb = document.createElement('div'); sb.id = 'scoreboard'; hud.append(sb); }
    const tOn = typeof teamsOn === 'function' && teamsOn();
    const ps = [...G.players.values()].sort((a, b) => (tOn ? (a.team || 0) - (b.team || 0) : 0) || b.score - a.score || (b.kills || 0) - (a.kills || 0));
    const rows = ps.map(p => `<tr class="${p.id === G.myId ? 'me' : ''}"><td><span class="blob" style="background:${p.color}"></span>${esc(p.name)}${p.bot ? ' <small>bot</small>' : ''}</td>${tOn ? `<td>${p.team && TEAM_INFO[p.team] ? `<span class="tm" style="background:${TEAM_INFO[p.team].c}">${teamName(p.team)}</span>` : ''}</td>` : ''}<td class="n">${p.kills || 0}</td><td class="n">${p.score}</td><td>${p.alive ? '' : 'out'}</td></tr>`).join('');
    const ts = tOn && G.teamScore ? ' · ' + Object.keys(TEAM_INFO).slice(1, teamCount() + 1).map(t => `${teamName(+t)} ${G.teamScore[t] || 0}`).join(' / ') : '';
    sb.innerHTML = `<h3>Scoreboard <small>${esc(T.theme ? T.theme.name : '')} · round ${G.round || 1} · first to ${G.target}${ts}</small></h3><table><tr><th>Player</th>${tOn ? '<th>Team</th>' : ''}<th class="n">Splats</th><th class="n">Wins</th><th></th></tr>${rows}</table>`;
  }
  addEventListener('keydown', e => { if (e.code === 'Tab' && G.mode === 'play' && !(e.target && e.target.tagName === 'INPUT')) { e.preventDefault(); showBoard(true); } });
  addEventListener('keyup', e => { if (e.code === 'Tab') showBoard(false); });
  addEventListener('blur', () => showBoard(false));
  setInterval(() => { if (sb) showBoard(true); }, 500);

  /* ---------- Join screen: rejoin the last room ---------- */
  function addRejoin() {
    const inp = document.getElementById('codeIn'); if (!inp || document.getElementById('rejoinRow')) return;
    let last = ''; try { last = localStorage.getItem('inkbrawl.lastCode') || ''; } catch (e) { }
    if (!/^[A-Z0-9]{5}$/.test(last)) return;
    const row = document.createElement('div'); row.id = 'rejoinRow'; row.className = 'row';
    row.innerHTML = `<button class="btn" id="bRejoin" style="width:100%">Rejoin last room · <b>${esc(last)}</b></button>`;
    inp.closest('.row').after(row); row.querySelector('button').addEventListener('click', () => startClient(last));
  }
  addRejoin(); setInterval(addRejoin, 2500);

  /* =====================================================================
     Victory scene. A tiny 3D projector (camera + perspective divide) draws
     a floor, a podium, light rays and confetti in the biome's palette; the
     winner's character stands on top with their name in extruded ink.
     ===================================================================== */
  const V = { on: false, el: null, cv: null, t: 0, raf: 0, data: null };
  window.Victory = V;
  function ensure() {
    if (V.el) return; V.el = document.createElement('div'); V.el.id = 'victory'; V.cv = document.createElement('canvas'); V.el.append(V.cv); document.body.append(V.el);
  }
  V.start = function (e) {
    ensure(); const th = T.theme || THEMES[0];
    let members = [], title = 'Match over', sub = `first to ${G.target}`, accent = '#e9a23b';
    if (e.wt && typeof teamsOn === 'function' && teamsOn()) {
      members = [...G.players.values()].filter(p => p.team === e.wt).sort((a, b) => (b.kills || 0) - (a.kills || 0)).slice(0, 4);
      title = teamName(e.wt) + ' team'; sub = 'takes the match'; accent = (TEAM_INFO[e.wt] || {}).c || accent;
    } else { const w = G.players.get(e.win); if (w) { members = [w]; title = w.name; sub = w.id === G.myId ? 'you are the champion' : 'is the champion'; accent = w.color; } }
    const R = rng((Date.now() & 0xffff) + 7);
    const pal = [accent, th.cap, th.top, ...(th.leaf || []), '#ffd36b', '#ffffff', '#d9573b', '#3f8a86'].filter(Boolean);
    const conf = []; for (let i = 0; i < 160; i++) conf.push({ x: (R() - .5) * 1400, y: 500 + R() * 900, z: R() * 900 - 200, vy: 120 + R() * 160, vx: (R() - .5) * 60, r: R() * TAU, vr: (R() - .5) * 8, s: 6 + R() * 8, c: pal[R() * pal.length | 0], k: R() < .3 ? 1 : 0 });
    V.data = { th, members, title, sub, accent, conf, dur: Math.max(4.5, (G.phaseEnd || now() + 6) - now()), me: members.some(p => p.id === G.myId), R };
    V.t = 0; V.on = true; V.el.style.display = 'block'; void V.el.offsetWidth; V.el.classList.add('on'); V.last = performance.now();
    if (!V.raf) V.raf = requestAnimationFrame(frame);
  };
  V.stop = function () { if (!V.on) return; V.on = false; if (V.el) { V.el.classList.remove('on'); setTimeout(() => { if (!V.on && V.el) V.el.style.display = 'none'; }, 650); } };
  function frame(ts) {
    V.raf = 0; if (!V.el) return;
    const dt = Math.min(.05, (ts - V.last) / 1000); V.last = ts; V.t += dt;
    if (V.on && (G.mode !== 'play' || (G.phase !== 'champion' && V.t > 1))) V.stop();
    if (!V.on && V.el.style.display === 'none') return;
    try { draw(dt); } catch (err) { console.warn('victory scene', err); V.stop(); return; }
    V.raf = requestAnimationFrame(frame);
  }
  const ease = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3), back = x => { x = clamp(x, 0, 1); const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  function draw(dt) {
    const cv = V.cv, dpr = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const D = V.data, th = D.th, t = V.t; const k = Math.min(w / 1280, h / 800) * 1.0;
    // camera: dolly in and orbit slightly
    const orbit = Math.sin(t * .35) * 0.16 + (1 - ease(t / 2.2)) * .35, dolly = 1500 - ease(t / 3) * 380, camY = 360 - ease(t / 3) * 60;
    const f = 900 * k, ox = w / 2, oy = h * .58;
    const P = (x, y, z) => { const ca = Math.cos(orbit), sa = Math.sin(orbit); const xr = x * ca - z * sa, zr = x * sa + z * ca + dolly; const s = f / Math.max(60, zr); return [ox + xr * s, oy - (y - camY) * s, s, zr]; };
    // backdrop: the biome sky, darkened, plus a vignette
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, shade(th.skyT, -.35)); g.addColorStop(.6, shade(th.skyB, -.2)); g.addColorStop(1, shade(th.deep || '#222', -.2)); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (T.bg && T.bg.c) { c.globalAlpha = .35; const bw = w * 1.25, bh = bw * T.bg.c.height / T.bg.c.width; c.drawImage(T.bg.c, (w - bw) / 2 - Math.sin(orbit) * 80, h * .5 - bh * .55, bw, bh); c.globalAlpha = 1; }
    // rotating light rays in the winner's colour
    const [px0, py0] = P(0, 240, 0); c.save(); c.translate(px0, py0); c.rotate(t * .15); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.fillStyle = rgbaC(D.accent, .07 + .03 * Math.sin(t * 2 + i)); c.beginPath(); c.moveTo(0, 0); c.lineTo(-90 * k, -Math.max(w, h)); c.lineTo(90 * k, -Math.max(w, h)); c.fill(); }
    c.restore();
    // floor: inked paper strips in biome ground colours
    const fl = mix(th.top, th.skyB, .22); for (let i = 30; i >= -6; i--) { const z0 = i * 120, z1 = z0 + 120; const a = P(-4000, 0, z0), b = P(4000, 0, z0), cc = P(4000, 0, z1), d = P(-4000, 0, z1);
      c.fillStyle = i % 2 ? shade(fl, -.12) : shade(fl, -.26); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.fill(); }
    c.strokeStyle = 'rgba(31,28,36,.25)'; c.lineWidth = 1.2; for (let x = -2400; x <= 2400; x += 200) { const a = P(x, 0, -720), b = P(x, 0, 3720); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    const hy = P(0, 0, 3720)[1], fc = shade(th.skyB, -.2); const fog = c.createLinearGradient(0, hy - 140 * k, 0, hy + 150 * k); fog.addColorStop(0, rgbaC(fc, 0)); fog.addColorStop(.5, rgbaC(fc, .95)); fog.addColorStop(1, rgbaC(fc, 0)); c.fillStyle = fog; c.fillRect(0, hy - 140 * k, w, 290 * k);
    // spotlight pool on the floor
    const sp = P(0, 0, 0); const sg = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 420 * sp[2]); sg.addColorStop(0, 'rgba(255,248,220,.45)'); sg.addColorStop(1, 'rgba(255,248,220,0)'); c.fillStyle = sg; c.beginPath(); c.ellipse(sp[0], sp[1], 420 * sp[2], 140 * sp[2], 0, 0, TAU); c.fill();
    // podium: an extruded box with steps, inked edges
    const n = Math.max(1, D.members.length), PW = 150 + n * 150, rise = ease((t - .2) / .9);
    const box = (x0, x1, y1, z0, z1, col) => { const v = [P(x0, 0, z0), P(x1, 0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, 0, z1)];
      const poly = (pts, fill) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); };
      const sideR = Math.sin(orbit) < 0; // which side faces the camera
      if (sideR) poly([v[1], v[6], v[5], v[2]], shade(col, -.3)); else poly([P(x0, 0, z0), P(x0, 0, z1), v[4], v[3]], shade(col, -.3));
      poly([v[0], v[1], v[2], v[3]], col); poly([v[3], v[2], v[5], v[4]], lit(col, .25));
      return v; };
    const pc = th.cap && th.cap !== '#ffffff' ? th.cap : (th.far && th.far[0]) || '#8a7aa6';
    const H1 = 150 * rise;
    if (H1 > 2) { box(-PW / 2 - 70, PW / 2 + 70, H1 * .45, -150, 150, shade(pc, -.15)); const v = box(-PW / 2, PW / 2, H1, -110, 110, pc);
      // front plaque with the title
      const a = v[0], b = v[1], tt = v[3]; const mx = (a[0] + b[0]) / 2, my = (a[1] + tt[1]) / 2; c.save(); c.translate(mx, my); const sc = (b[0] - a[0]) / (PW + 40); c.scale(sc, sc);
      c.fillStyle = 'rgba(255,248,230,.92)'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(-110, -26, 220, 52, 14); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '800 30px "Shantell Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(D.members.length > 1 ? 'TEAM' : '#1', 0, 2); c.restore(); }
    // the winner(s): drop in, squash, then idle bounce
    const top = P(0, H1, 0); const s = top[2];
    D.members.forEach((p, i) => {
      const off = (i - (n - 1) / 2) * 165; const q = P(off, H1, 0); const drop = clamp((t - .9 - i * .15) / .55, 0, 1);
      const y = q[1] - (1 - drop * drop) * h * .9; const land = clamp((t - 1.45 - i * .15) / .5, 0, 1); const squash = drop < 1 ? 1.15 : 1 - Math.sin(land * Math.PI) * .22 * (1 - land) + Math.sin(t * 3 + i) * .025;
      if (drop <= 0) return; const bodyW = 64 * s * 1.9, bodyH = 86 * s * 1.9;
      c.fillStyle = 'rgba(20,16,20,.35)'; c.beginPath(); c.ellipse(q[0], q[1] + 2, bodyW * .7 * drop, bodyW * .16 * drop, 0, 0, TAU); c.fill();
      c.save(); c.translate(q[0], y); c.scale(1 / Math.sqrt(squash), squash); c.rotate(Math.sin(t * 2.2 + i) * .04);
      const ch = p.char && Chars.byId && Chars.byId[p.char];
      if (ch && ch.sprite) c.drawImage(ch.sprite, -bodyW / 2, -bodyH, bodyW, bodyH);
      else { const gr = c.createLinearGradient(-bodyW / 2, -bodyH, bodyW / 2, 0); gr.addColorStop(0, shadeC(p.color, .25)); gr.addColorStop(1, shadeC(p.color, -.3)); c.fillStyle = gr; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, bodyW * .22); c.fill(); c.stroke();
        c.fillStyle = INK; c.beginPath(); c.arc(-bodyW * .16, -bodyH * .62, bodyW * .07, 0, TAU); c.arc(bodyW * .16, -bodyH * .62, bodyW * .07, 0, TAU); c.fill(); c.lineWidth = 3; c.beginPath(); c.arc(0, -bodyH * .45, bodyW * .14, .2, Math.PI - .2); c.stroke(); }
      // the weapon raised high
      const wpn = typeof weaponOf === 'function' ? weaponOf(p) : null; if (wpn && typeof drawWeaponSprite === 'function' && land > 0) { c.save(); const sc = s * 1.35; c.scale(sc, sc); try { drawWeaponSprite(c, wpn, bodyW * .62 / sc, -bodyH * .52 / sc, -.75 + Math.sin(t * 3) * .08); } catch (e) { } c.restore(); }
      // crown
      if (land > 0) { const cy = -bodyH - 18 * s - Math.sin(t * 3 + i) * 4 * s, cw = bodyW * .5 * back(land); c.fillStyle = '#ffd36b'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(-cw / 2, cy + cw * .35); c.lineTo(-cw / 2, cy - cw * .1); c.lineTo(-cw / 4, cy + cw * .12); c.lineTo(0, cy - cw * .3); c.lineTo(cw / 4, cy + cw * .12); c.lineTo(cw / 2, cy - cw * .1); c.lineTo(cw / 2, cy + cw * .35); c.closePath(); c.fill(); c.stroke(); }
      c.restore();
      // name tags for team members
      if (n > 1 && land > 0) { c.font = `800 ${Math.round(18 * k)}px "Shantell Sans", sans-serif`; c.textAlign = 'center'; c.fillStyle = '#fff8ec'; c.strokeStyle = INK; c.lineWidth = 4; c.strokeText(p.name, q[0], q[1] + 26 * k); c.fillText(p.name, q[0], q[1] + 26 * k); }
    });
    // confetti in 3D (sized by depth)
    for (const p of D.conf) { if (t < 1.4) break; p.y -= p.vy * dt; p.x += (p.vx + Math.sin(t * 2 + p.r) * 30) * dt; p.r += p.vr * dt; if (p.y < -40) { p.y = 900 + D.R() * 300; }
      const q = P(p.x, p.y, p.z); if (q[3] < 100) continue; const sz = p.s * q[2]; c.save(); c.translate(q[0], q[1]); c.rotate(p.r); c.scale(1, Math.cos(p.r * 1.7)); c.fillStyle = p.c; if (p.k) { c.beginPath(); c.arc(0, 0, sz * .6, 0, TAU); c.fill(); } else c.fillRect(-sz / 2, -sz * .3, sz, sz * .6); c.restore(); }
    // the name in extruded ink lettering, swinging up into place
    const nt = ease((t - 1.6) / .8); if (nt > 0) {
      const fs = clamp(w / Math.max(6, D.title.length) * 1.1, 34, 104 * k + 20); const ty = h * .16 + (1 - nt) * 40; c.save(); c.translate(w / 2, ty); c.scale(1, Math.max(.05, nt)); c.rotate(Math.sin(t * 1.2) * .012);
      c.font = `800 ${fs | 0}px "Shantell Sans", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      const depth = Math.round(fs * .1); for (let d = depth; d > 0; d--) { c.fillStyle = d === depth ? INK : shade(D.accent, -.45 - d / depth * .2); c.fillText(D.title, d * .9, d); }
      const tg = c.createLinearGradient(0, -fs / 2, 0, fs / 2); tg.addColorStop(0, lit(D.accent, .55)); tg.addColorStop(.55, D.accent); tg.addColorStop(1, shade(D.accent, -.15)); c.fillStyle = tg; c.lineWidth = Math.max(3, fs * .06); c.strokeStyle = INK; c.strokeText(D.title, 0, 0); c.fillText(D.title, 0, 0);
      c.globalAlpha = .45; c.fillStyle = '#fff'; c.fillText(D.title, -fs * .02, -fs * .03); c.globalAlpha = 1; c.restore();
      c.font = `800 ${Math.round(22 * k + 6)}px "Shantell Sans", sans-serif`; c.textAlign = 'center'; const sy2 = ty + fs * .72; const ttxt = (D.me ? '★ ' : '') + D.sub.toUpperCase() + (D.me ? ' ★' : '');
      c.globalAlpha = ease((t - 2.1) / .5); c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(ttxt, w / 2, sy2); c.fillStyle = '#fff4dc'; c.fillText(ttxt, w / 2, sy2); c.globalAlpha = 1;
    }
    // vignette + paper grain edges
    const vg = c.createRadialGradient(w / 2, h * .5, Math.min(w, h) * .35, w / 2, h * .5, Math.max(w, h) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,8,14,.55)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
    // the closing iris when the scene ends
    const left = D.dur - t; if (left < .6) { c.fillStyle = `rgba(20,16,24,${clamp(1 - left / .6, 0, 1) * .9})`; c.fillRect(0, 0, w, h); }
  }

  const _phase = UI.phase;
  UI.phase = function (e) {
    if (e && e.ph === 'champion' && !G.demo && G.mode === 'play') {
      V.start(e); const b = UI.banner; UI.banner = () => { }; try { _phase.call(this, e); } finally { UI.banner = b; } return;
    }
    if (V.on && e && e.ph !== 'champion') V.stop();
    return _phase.call(this, e);
  };
  addEventListener('keydown', e => { if (V.on && e.code === 'Escape') V.stop(); });
})();
