/* =====================================================================
   menu.js: the main menu, the event page and the new-game setup screen
   ---------------------------------------------------------------------
   mainmenu/bg.png            background of the main menu
   mainmenu/maintitle.png     the big game title (top left)
   mainmenu/event/event.json  name, tagline and colours of the event
   mainmenu/event/bg.png      background of the event page
   mainmenu/event/maintitle.png  the event-styled title
   The event page plays with the content in biomes2/ and weapons2/.
   Nothing in index.html needs editing to change any of this.
   ===================================================================== */
'use strict';

/* ---------- iPad / phone: no double-tap or pinch zoom, ever ---------- */
{
  let lastEnd = 0, lastX = 0, lastY = 0;
  document.addEventListener('touchend', e => {
    const t = e.changedTouches && e.changedTouches[0]; const n = performance.now(); const x = t ? t.clientX : 0, y = t ? t.clientY : 0;
    const quick = n - lastEnd < 380 && Math.hypot(x - lastX, y - lastY) < 60; lastEnd = n; lastX = x; lastY = y;
    if (!quick) return; const el = e.target; if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
    e.preventDefault(); // stops Safari's double-tap zoom; re-send the click so fast tapping on buttons still works
    const b = el && el.closest && el.closest('button,.btn,.chip,[data-s],[data-t],[data-a],[data-tab],[data-pick],[role=button],label');
    if (b && !b.disabled) b.click();
  }, { passive: false });
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
}

const MMENU = 'mainmenu/';
function mmImage(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }

/* ---------- styles ---------- */
{
  const st = document.createElement('style'); st.id = 'menuStyles';
  st.textContent = `
#ui{perspective:2200px}
.screen.leaving{display:flex!important;pointer-events:none!important;animation:scrOut .26s ease forwards;z-index:3}
@keyframes scrOut{to{opacity:0;transform:scale(.985)}}
#title.home,#event.home{padding:0;justify-content:flex-start;align-items:stretch;background:#2a2430;overflow:hidden}
.mm-bg{position:absolute;inset:-5%;background-size:cover;background-position:center;animation:mmPan 46s ease-in-out infinite alternate;will-change:transform}
.mm-bg.fallback{background:radial-gradient(120% 90% at 60% 40%,#efe7d6 0%,#e6dcc7 55%,#cdbfa2 100%)}
@keyframes mmPan{0%{transform:scale(1.02) translate(0,0)}100%{transform:scale(1.1) translate(-2.2%,1.2%)}}
.mm-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(24,20,28,.62) 0%,rgba(24,20,28,.38) 30%,rgba(24,20,28,0) 58%),linear-gradient(0deg,rgba(24,20,28,.35),rgba(24,20,28,0) 30%);pointer-events:none}
.mm-grain{position:absolute;inset:0;pointer-events:none;opacity:.18;mix-blend-mode:multiply;background-image:radial-gradient(rgba(31,28,36,.5) .6px,transparent .7px);background-size:5px 5px}
.mm-left{position:relative;z-index:2;display:flex;flex-direction:column;gap:12px;width:min(430px,92vw);height:100%;overflow-y:auto;overflow-x:hidden;
  padding:calc(22px + var(--safe-t)) 26px calc(18px + var(--safe-b)) calc(30px + var(--safe-l));scrollbar-width:none}
.mm-left::-webkit-scrollbar{display:none}
.mm-title{position:relative;width:100%;min-height:90px;display:flex;align-items:flex-end;animation:mmTitleIn 1s cubic-bezier(.2,1.25,.3,1) both}
.mm-title img{width:100%;max-height:30vh;object-fit:contain;object-position:left bottom;filter:drop-shadow(4px 6px 0 rgba(20,16,24,.45));animation:mmFloat 5.5s ease-in-out infinite;transform-origin:30% 80%}
.mm-title .logo{font-size:clamp(40px,5.4vw,70px);color:#fbf4e4}
.mm-title .logo::before{color:var(--accent)}
@keyframes mmTitleIn{0%{opacity:0;transform:translateY(-26px) scale(.8) rotate(-5deg)}100%{opacity:1;transform:none}}
@keyframes mmFloat{0%,100%{transform:rotate(-1.2deg) translateY(0)}50%{transform:rotate(.8deg) translateY(-5px)}}
.mm-tag{color:#fbf4e4;font-weight:700;font-size:15px;margin-top:-4px;text-shadow:0 2px 0 rgba(20,16,24,.45);animation:mmSlide .6s .15s cubic-bezier(.2,1,.3,1) both}
.mm-who{background:rgba(243,236,222,.95);border:2.5px solid var(--ink);border-radius:var(--r-wob);padding:12px 14px 8px;box-shadow:4px 5px 0 rgba(20,16,24,.55);animation:mmSlide .6s .22s cubic-bezier(.2,1,.3,1) both}
.mm-who .field{margin-bottom:8px}.mm-who input.txt{font-size:16px;padding:9px 12px}.mm-who .sw.char{width:40px;height:40px}
.mm-btns{display:flex;flex-direction:column;gap:10px}
.mm-btns .btn{width:100%;justify-content:flex-start;min-height:56px;font-size:19px;padding:10px 20px;animation:mmSlide .55s cubic-bezier(.2,1.1,.3,1) both;transition:transform .16s cubic-bezier(.2,1.4,.4,1)}
.mm-btns .btn:hover{transform:translateX(6px) rotate(-.6deg)}
.mm-btns .btn:active{transform:translateX(3px) scale(.98)}
.mm-btns .btn:nth-child(1){animation-delay:.28s}.mm-btns .btn:nth-child(2){animation-delay:.34s}.mm-btns .btn:nth-child(3){animation-delay:.4s}.mm-btns .btn:nth-child(4){animation-delay:.46s}.mm-btns .btn:nth-child(5){animation-delay:.52s}
@keyframes mmSlide{from{opacity:0;transform:translateX(-34px)}to{opacity:1;transform:none}}
.mm-btns .btn small{margin-left:auto;font-size:12px;font-weight:700;opacity:.75}
.mm-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:6px;animation:mmSlide .6s .6s both}
.mm-chips .chip{font-size:12.5px;padding:6px 11px}
.mm-flip{position:absolute;z-index:4;top:50%;right:calc(18px + var(--safe-r));transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;
  border:0;background:none;color:#fbf4e4;font:800 13px var(--font);text-shadow:0 2px 0 rgba(20,16,24,.6);animation:mmFlipIn .7s .7s cubic-bezier(.2,1.3,.3,1) both}
.mm-flip .ar{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;border:2.5px solid var(--ink);background:var(--ev-accent,#ff8a2a);color:#1f1c24;
  box-shadow:3px 4px 0 rgba(20,16,24,.6);animation:mmPulse 2.4s ease-in-out infinite;transition:transform .18s}
.mm-flip:hover .ar{transform:scale(1.08) rotate(-6deg)}
.mm-flip svg{width:30px;height:30px}.mm-flip svg *{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.mm-flip.back{right:auto;left:calc(18px + var(--safe-l))}.mm-flip.back .ar{background:#f3ecde}
#event .mm-flip.back{left:auto;right:calc(18px + var(--safe-r))}
@keyframes mmPulse{0%,100%{box-shadow:3px 4px 0 rgba(20,16,24,.6),0 0 0 0 rgba(255,138,42,.55)}50%{box-shadow:3px 4px 0 rgba(20,16,24,.6),0 0 0 12px rgba(255,138,42,0)}}
@keyframes mmFlipIn{from{opacity:0;transform:translate(30px,-50%)}to{opacity:1;transform:translateY(-50%)}}
/* 3D page turn */
.screen.pg-out-l{display:flex!important;transform-origin:0 50%;animation:pgOutL .78s cubic-bezier(.55,.05,.35,1) forwards;z-index:5;pointer-events:none;backface-visibility:hidden}
.screen.pg-under{animation:pgUnder .78s cubic-bezier(.3,.6,.3,1) both;z-index:1}
.screen.pg-in-l{transform-origin:0 50%;animation:pgInL .78s cubic-bezier(.55,.05,.35,1) both;z-index:5;backface-visibility:hidden}
.screen.pg-under-out{display:flex!important;animation:pgUnderOut .78s ease forwards;z-index:1;pointer-events:none}
@keyframes pgOutL{0%{transform:rotateY(0);filter:brightness(1)}100%{transform:rotateY(-104deg);filter:brightness(.55)}}
@keyframes pgInL{0%{transform:rotateY(-104deg);filter:brightness(.55)}100%{transform:rotateY(0);filter:brightness(1)}}
@keyframes pgUnder{0%{transform:scale(.93);filter:brightness(.35)}100%{transform:none;filter:none}}
@keyframes pgUnderOut{0%{transform:none;filter:none}100%{transform:scale(.93);filter:brightness(.35)}}
/* event page */
#event{--ev-accent:#ff8a2a;--ev-accent2:#8d4bd6}
#event .mm-shade{background:linear-gradient(90deg,rgba(18,10,24,.72) 0%,rgba(18,10,24,.4) 32%,rgba(18,10,24,0) 60%),linear-gradient(0deg,rgba(40,14,50,.45),rgba(0,0,0,0) 35%)}
#evCanvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#event .mm-title .logo{color:var(--ev-accent)}#event .mm-title .logo::before{color:var(--ev-accent2)}
#event .mm-tag{color:#ffe2c2}
#event .mm-btns .btn.primary{--b:var(--ev-accent);color:#1f1c24}
#event .mm-btns .btn.gold{--b:var(--ev-accent2);color:#fbf4e4}
.ev-badge{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;padding:5px 12px;border:2px solid var(--ink);border-radius:999px;background:var(--ev-accent);color:#1f1c24;font-weight:800;font-size:13px;box-shadow:2px 3px 0 rgba(10,6,14,.6);animation:mmSlide .5s .1s both}
.ev-info{color:#f3e4ff;font-size:13px;font-weight:700;opacity:.9;animation:mmSlide .6s .58s both}
@media (max-width:640px){.mm-left{width:100%;padding:calc(14px + var(--safe-t)) 16px calc(14px + var(--safe-b)) calc(16px + var(--safe-l))}.mm-flip{top:auto;bottom:calc(14px + var(--safe-b));transform:none;animation:none}.mm-shade{background:rgba(24,20,28,.45)}.mm-btns .btn{min-height:48px;font-size:16px}}
@media (max-height:600px){.mm-left{gap:8px}.mm-title img{max-height:22vh}.mm-btns .btn{min-height:44px;font-size:16px}.mm-who .sw.char{width:32px;height:32px}}
/* setup */
#setup{background:linear-gradient(rgba(236,227,209,.62),rgba(205,191,162,.82)),url(mainmenu/bg.png) center/cover}
#setup.event-set{background:linear-gradient(rgba(30,16,40,.55),rgba(16,8,22,.8)),url(mainmenu/event/bg.png) center/cover}
#setup .card{max-width:760px;padding:20px 22px 16px;display:flex;flex-direction:column;max-height:calc(100dvh - 40px)}
.su-head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:10px}
.su-head h2{margin:0}
.su-where{min-width:240px}
.su-tabs{display:flex;gap:6px;margin-bottom:12px;border-bottom:2px dashed rgba(31,28,36,.25);padding-bottom:10px}
.su-tabs button{border:2px solid rgba(31,28,36,.3);background:#f6f0e4;border-radius:999px;padding:8px 16px;font-weight:800;font-size:15px;cursor:pointer;transition:background .15s,transform .15s}
.su-tabs button.on{background:var(--ink);color:var(--paper);border-color:var(--ink);transform:translateY(-1px)}
.su-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:2px 4px 6px 2px;touch-action:pan-y}
.su-pane{display:none;animation:suPane .28s cubic-bezier(.2,1,.3,1) both}.su-pane.on{display:block}
@keyframes suPane{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
.su-sec{margin-bottom:14px}.su-sec>.lbl{margin-bottom:6px}
.su-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.su-mode{position:relative;text-align:left;border:2.4px solid rgba(31,28,36,.35);border-radius:var(--r-wob2);background:#f6f0e4;padding:11px 12px;cursor:pointer;transition:transform .16s cubic-bezier(.2,1.4,.4,1),border-color .15s,background .15s}
.su-mode b{display:block;font-size:18px}.su-mode span{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:2px;line-height:1.25}
.su-mode.on{border-color:var(--ink);background:#ffe9b8;transform:translateY(-2px) rotate(-.5deg);box-shadow:3px 4px 0 var(--ink)}
.su-chips{display:flex;flex-wrap:wrap;gap:6px}
.su-chips button{border:2px solid rgba(31,28,36,.3);background:#f6f0e4;border-radius:999px;padding:7px 13px;font-weight:800;font-size:14px;cursor:pointer;min-height:38px}
.su-chips button.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.su-biomes{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.su-bio{position:relative;height:66px;border:2.2px solid rgba(31,28,36,.35);border-radius:12px;overflow:hidden;cursor:pointer;padding:0;transition:transform .15s,border-color .15s}
.su-bio i{position:absolute;inset:0}
.su-bio em{position:absolute;left:0;right:0;bottom:0;font-style:normal;font-size:11.5px;font-weight:800;padding:3px 6px;background:rgba(243,236,222,.92);text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.su-bio.on{border-color:var(--ink);transform:translateY(-2px);box-shadow:0 3px 0 var(--ink)}
.su-bio.on em{background:var(--ink);color:var(--paper)}
.su-bio.rand i{background:repeating-linear-gradient(45deg,#e9dfcc 0 10px,#d6c8ad 10px 20px)}
.su-bio.rand b{position:absolute;top:10px;left:0;right:0;text-align:center;font-size:24px}
.su-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}
.su-step{display:flex;align-items:center;gap:10px}.su-step button{width:46px;height:42px;border:2.2px solid var(--ink);border-radius:12px;background:#f6f0e4;font-size:22px;font-weight:800;cursor:pointer}
.su-step b{min-width:64px;text-align:center;font-size:20px}
.su-off{opacity:.38;pointer-events:none;filter:grayscale(.6)}
.su-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:2px dashed rgba(31,28,36,.25);padding-top:10px;margin-top:6px}
.su-sum{flex:1;min-width:200px;font-size:13px;color:var(--ink-soft);font-weight:700;line-height:1.3}
.su-note{font-size:12.5px;color:var(--ink-soft);margin:4px 0 0}
#setup.event-set .card{background:#2a2033;color:#f6eaff;border-color:#0e0812}
#setup.event-set .su-mode,#setup.event-set .su-chips button,#setup.event-set .su-tabs button,#setup.event-set .su-step button,#setup.event-set input.txt{background:#3a2c46;color:#f6eaff;border-color:rgba(255,255,255,.25)}
#setup.event-set .su-mode.on{background:var(--ev-accent,#ff8a2a);color:#1f1c24}#setup.event-set .su-mode span,#setup.event-set .lbl,#setup.event-set .su-sum,#setup.event-set .su-note,#setup.event-set .eyebrow{color:#d8c4ea}
#setup.event-set .su-chips button.on,#setup.event-set .su-tabs button.on{background:var(--ev-accent,#ff8a2a);color:#1f1c24}
#setup.event-set .seg{background:#3a2c46;border-color:rgba(255,255,255,.3)}#setup.event-set .seg button.on{background:var(--ev-accent,#ff8a2a);color:#1f1c24}
@media (max-width:640px){.su-modes{grid-template-columns:1fr}.su-grid2{grid-template-columns:1fr}.su-where{min-width:0;width:100%}#setup .card{padding:14px}}
`;
  document.head.append(st);
}

/* ---------- the home page ---------- */
const MainMenu = {
  page: 'title', flipping: false, built: false, evBuilt: false, raf: 0,
  build() {
    if (this.built) return; this.built = true; const home = $('#title'); if (!home) return;
    const wrap = home.querySelector('.wrap'); const logo = home.querySelector('.logo'); const tag = home.querySelector('.tagline');
    const keep = {}; for (const id of ['bPractice', 'bHost', 'bBrowse', 'bSettings', 'chipWeapons', 'chipLobby']) keep[id] = $('#' + id);
    const fields = ['#nameIn', '#swatches'].map(id => $(id) && $(id).closest('.field')).filter(Boolean);
    home.classList.add('home'); for (const n of [...Object.values(keep), ...fields, logo, tag]) if (n) n.remove(); home.innerHTML = '';
    const bg = document.createElement('div'); bg.className = 'mm-bg fallback'; home.append(bg, Object.assign(document.createElement('div'), { className: 'mm-shade' }), Object.assign(document.createElement('div'), { className: 'mm-grain' }));
    mmImage(MMENU + 'bg.png').then(i => { if (i) { bg.classList.remove('fallback'); bg.style.backgroundImage = `url("${i.src}")`; } });
    const left = document.createElement('div'); left.className = 'mm-left'; home.append(left);
    const tt = document.createElement('div'); tt.className = 'mm-title'; left.append(tt);
    mmImage(MMENU + 'maintitle.png').then(i => { if (i) { i.alt = 'Inkbrawl'; tt.append(i); } else if (logo) tt.append(logo); });
    if (tag) { tag.className = 'mm-tag'; left.append(tag); }
    const who = document.createElement('div'); who.className = 'mm-who'; left.append(who);
    for (const f of fields) who.append(f);
    const btns = document.createElement('div'); btns.className = 'mm-btns'; left.append(btns);
    const bP = keep.bPractice, bH = keep.bHost, bB = keep.bBrowse, bS = keep.bSettings;
    if (bP) { bP.className = 'btn primary'; bP.innerHTML = '<svg class="ico"><use href="#i-play"/></svg>Play<small>offline, vs bots</small>'; btns.append(bP); }
    if (bH) { bH.className = 'btn gold'; bH.innerHTML = '<svg class="ico"><use href="#i-host"/></svg>Host online<small>friends join by code</small>'; btns.append(bH); }
    if (bB) { bB.className = 'btn teal'; bB.innerHTML = '<svg class="ico"><use href="#i-browse"/></svg>Servers<small>join a room</small>'; btns.append(bB); }
    if (bS) { bS.className = 'btn'; bS.innerHTML = '<svg class="ico"><use href="#i-gear"/></svg>Settings'; btns.append(bS); }
    const chips = document.createElement('div'); chips.className = 'mm-chips'; left.append(chips);
    for (const c of [keep.chipWeapons, keep.chipLobby]) if (c) chips.append(c);
    const flip = document.createElement('button'); flip.className = 'mm-flip'; flip.id = 'bEventPage'; flip.innerHTML = `<span class="ar"><svg viewBox="0 0 24 24"><path d="M5 12h13"/><path d="M12.5 5.5 19 12l-6.5 6.5"/></svg></span><span class="lb">${esc(EventInfo.name)} event</span>`;
    home.append(flip); flip.addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); this.flip('event'); });
    // Play / Host open the setup screen instead of the old cards
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('#bPractice,#bHost'); if (!b) return; e.stopPropagation(); e.preventDefault(); Audio2.init(); Audio2.play('ui');
      Setup.open({ online: b.id === 'bHost', set: 'main', from: 'title' });
    }, true);
  },
  buildEvent() {
    if (this.evBuilt) return; this.evBuilt = true; const E = EventInfo;
    const s = document.createElement('section'); s.className = 'screen hidden home'; s.id = 'event'; $('#ui').insertBefore(s, $('#hud'));
    s.style.setProperty('--ev-accent', E.accent || '#ff8a2a'); s.style.setProperty('--ev-accent2', E.accent2 || '#8d4bd6');
    const bg = document.createElement('div'); bg.className = 'mm-bg fallback'; bg.style.background = `radial-gradient(120% 90% at 65% 30%,#4a2f5e 0%,#2a1838 55%,#140b1c 100%)`;
    const cv = document.createElement('canvas'); cv.id = 'evCanvas';
    s.append(bg, cv, Object.assign(document.createElement('div'), { className: 'mm-shade' }));
    mmImage(MMENU + 'event/' + (E.bg || 'bg.png')).then(i => { if (i) { bg.classList.remove('fallback'); bg.style.background = ''; bg.style.backgroundImage = `url("${i.src}")`; bg.style.backgroundSize = 'cover'; bg.style.backgroundPosition = 'center'; } });
    const left = document.createElement('div'); left.className = 'mm-left'; s.append(left);
    left.innerHTML = `<div class="ev-badge">${esc(E.icon || '\u{1F383}')} ${esc(E.name)} event</div><div class="mm-title" id="evTitle"></div><div class="mm-tag">${esc(E.tagline || '')}</div>
      <div class="mm-btns"><button class="btn primary" id="bEvPlay"><svg class="ico"><use href="#i-play"/></svg>Play the event<small>offline, vs bots</small></button>
      <button class="btn gold" id="bEvHost"><svg class="ico"><use href="#i-host"/></svg>Host online<small>friends join by code</small></button>
      <button class="btn teal" id="bEvBrowse"><svg class="ico"><use href="#i-browse"/></svg>Servers</button></div>
      <div class="ev-info" id="evInfo"></div>`;
    const tt = left.querySelector('#evTitle');
    mmImage(MMENU + 'event/' + (E.title || 'maintitle.png')).then(i => { if (i) { i.alt = 'Inkbrawl ' + E.name; tt.append(i); } else { tt.innerHTML = `<div class="logo" data-t="INKBRAWL">${'INKBRAWL'.split('').map(c => `<span>${c}</span>`).join('')}</div>`; } });
    const back = document.createElement('button'); back.className = 'mm-flip back'; back.innerHTML = `<span class="ar"><svg viewBox="0 0 24 24"><path d="M19 12H6"/><path d="M11.5 5.5 5 12l6.5 6.5"/></svg></span><span class="lb">Main menu</span>`;
    s.append(back); back.addEventListener('click', () => { Audio2.play('ui'); this.flip('title'); });
    $('#bEvPlay').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); Setup.open({ online: false, set: 'event', from: 'event' }); });
    $('#bEvHost').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); Setup.open({ online: true, set: 'event', from: 'event' }); });
    $('#bEvBrowse').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); Lobby.ensure(); UI.show('browse'); UI.roomsChanged(); });
    this.evInfo();
  },
  evInfo() { const el = $('#evInfo'); if (!el) return; const nw = Weapons.list.filter(w => w.set === 'event' || (Array.isArray(w.sets) && w.sets.includes('event') && !w.sets.includes('main'))).length; const nb = THEMES.filter(t => t.set === 'event').length; el.textContent = `${nw} event weapon${nw === 1 ? '' : 's'} · ${nb} event biome${nb === 1 ? '' : 's'} · from weapons2/ and biomes2/`; },
  eventReady() {
    this.build(); this.buildEvent();
    const f = $('#bEventPage .lb'); if (f) f.textContent = EventInfo.name + ' event';
    const ev = $('#event'); if (ev) { ev.style.setProperty('--ev-accent', EventInfo.accent || '#ff8a2a'); ev.style.setProperty('--ev-accent2', EventInfo.accent2 || '#8d4bd6'); }
    const t = $('#title'); if (t) t.style.setProperty('--ev-accent', EventInfo.accent || '#ff8a2a');
    this.evInfo();
  },
  /* the 3D page turn between the main menu and the event page */
  flip(to) {
    if (this.flipping || UI.cur === to) return; const from = UI.cur; const a = $('#' + from), b = $('#' + to); if (!a || !b) { UI.show(to); return; }
    this.flipping = true; this.page = to; const fwd = to === 'event';
    UI._noFade = true; UI.show(to); UI._noFade = false;
    if (fwd) { a.classList.add('pg-out-l'); b.classList.add('pg-under'); } else { b.classList.add('pg-in-l'); a.classList.add('pg-under-out'); }
    Audio2.play('swing', undefined, .6, .7);
    setTimeout(() => { for (const el of [a, b]) el.classList.remove('pg-out-l', 'pg-under', 'pg-in-l', 'pg-under-out'); this.flipping = false; }, 800);
  },
  /* event page canvas: fog, bats, embers and a moon. dt-based so it never runs too fast. */
  loop() {
    const cv = $('#evCanvas'); if (!cv) return; const x = cv.getContext('2d'); let last = performance.now(); const P = this.parts || (this.parts = []);
    const step = n => {
      this.raf = 0; if (UI.cur !== 'event' && !this.flipping) return; const dt = Math.min(.05, (n - last) / 1000); last = n;
      const dpr = Math.min(2, devicePixelRatio || 1), W2 = cv.clientWidth, H2 = cv.clientHeight; if (cv.width !== Math.round(W2 * dpr) || cv.height !== Math.round(H2 * dpr)) { cv.width = Math.round(W2 * dpr); cv.height = Math.round(H2 * dpr); }
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W2, H2); const t = n / 1000;
      while (P.length < 46) { const k = Math.random(); P.push(k < .25 ? { k: 'bat', x: W2 * (.4 + Math.random() * .7), y: H2 * (.1 + Math.random() * .4), vx: -(30 + Math.random() * 50), ph: Math.random() * 6, s: .6 + Math.random() * .7 } : k < .7 ? { k: 'ember', x: Math.random() * W2, y: H2 + 10, vy: -(18 + Math.random() * 40), ph: Math.random() * 6, s: 1 + Math.random() * 2.2 } : { k: 'fog', x: Math.random() * W2, y: H2 * (.65 + Math.random() * .35), vx: 6 + Math.random() * 14, s: 120 + Math.random() * 180 }); }
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i];
        if (p.k === 'bat') { p.x += p.vx * dt; p.y += Math.sin(t * 2 + p.ph) * 12 * dt; const fl = Math.sin(t * 14 + p.ph); x.save(); x.translate(p.x, p.y); x.scale(p.s, p.s); x.fillStyle = 'rgba(20,10,26,.85)'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-8, -8 * fl - 3, -16, -2 * fl); x.quadraticCurveTo(-9, 1, -5, 4); x.quadraticCurveTo(0, 2, 5, 4); x.quadraticCurveTo(9, 1, 16, -2 * fl); x.quadraticCurveTo(8, -8 * fl - 3, 0, 0); x.fill(); x.restore(); if (p.x < -40) P.splice(i, 1); }
        else if (p.k === 'ember') { p.y += p.vy * dt; p.x += Math.sin(t * 1.5 + p.ph) * 14 * dt; const a = .5 + .5 * Math.sin(t * 5 + p.ph); x.fillStyle = `rgba(255,${150 + (a * 60 | 0)},70,${.35 + a * .5})`; x.beginPath(); x.arc(p.x, p.y, p.s, 0, TAU); x.fill(); if (p.y < -10) P.splice(i, 1); }
        else { p.x += p.vx * dt; const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, 'rgba(200,180,230,.12)'); g.addColorStop(1, 'rgba(200,180,230,0)'); x.fillStyle = g; x.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); if (p.x - p.s > W2) P.splice(i, 1); } }
      this.raf = requestAnimationFrame(step);
    };
    if (!this.raf) this.raf = requestAnimationFrame(step);
  },
};

/* ---------- smooth screen changes (and the event page remembers itself) ---------- */
{
  const _show = UI.show.bind(UI);
  const MENU_SCREENS = new Set(['title', 'event', 'setup', 'browse', 'weapons', 'settings', 'connecting', 'host', 'practice']);
  UI.show = function (id, ...rest) {
    if (id === 'title' && MainMenu.page === 'event' && !MainMenu.flipping && G.mode !== 'play' && $('#event')) id = 'event';
    if (id === 'host' || id === 'practice') { Setup.open({ online: id === 'host', set: MainMenu.page === 'event' ? 'event' : 'main', from: MainMenu.page }); return; }
    const prev = this.cur && $('#' + this.cur); const r = _show(id, ...rest);
    if (!this._noFade && prev && prev.id !== id && MENU_SCREENS.has(prev.id) && id && MENU_SCREENS.has(id)) {
      prev.classList.add('leaving'); clearTimeout(prev._lv); prev._lv = setTimeout(() => prev.classList.remove('leaving'), 270);
    }
    for (const s of document.querySelectorAll('.screen.leaving')) if (s.id === id) s.classList.remove('leaving');
    if (id === 'event') { MainMenu.loop(); MainMenu.evInfo(); }
    return r;
  };
}

/* ---------- the new-game setup screen ---------- */
const SETUP_MODES = [
  { id: 'arena', n: 'Arena', d: 'Tight, destructible arenas. Up to 8 players. Last scribble standing.' },
  { id: 'inkhold', n: 'Inkhold', d: 'Hold the glowing ink ring to score. First to the target takes the match.' },
  { id: 'wilds', n: 'Big Wilds', d: 'A huge map, bot crowds, the Tool Box and teams if you want.' },
  { id: 'war', n: 'War', d: 'Teams, a build phase with the kit, banners and shared lives.' },
];
const SETUP_BOTS_ARENA = [0, 1, 2, 3, 4, 5, 6, 7], SETUP_BOTS_WILDS = [0, 1, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100];
const Setup = {
  el: null, tab: 0, s: null,
  defaults() { return { online: false, set: 'main', mode: 'arena', terrain: 'normal', biome: -1, bots: 3, max: 6, target: 5, pub: true, room: '' }; },
  load() { try { return Object.assign(this.defaults(), JSON.parse(getCookie('ib_setup') || '{}')); } catch (e) { return this.defaults(); } },
  save() { const { online, set, from, ...keep } = this.s; setCookie('ib_setup', JSON.stringify(keep)); },
  ensure() {
    if (this.el) return this.el; const s = document.createElement('section'); s.className = 'screen hidden'; s.id = 'setup'; $('#ui').insertBefore(s, $('#hud'));
    s.innerHTML = `<div class="card"><div class="su-head"><div><div class="eyebrow" id="suEye">New game</div><h2 id="suTitle">Set up a game</h2></div>
      <div class="seg su-where" id="suWhere"><button data-where="0">Offline</button><button data-where="1">Online room</button></div></div>
      <div class="su-tabs" id="suTabs"><button data-tab="0">Mode &amp; map</button><button data-tab="1">Players</button><button data-tab="2">Rules</button></div>
      <div class="su-body" id="suBody"></div>
      <div class="su-foot"><button class="btn ghost small" id="suBack"><svg class="ico"><use href="#i-back"/></svg>Back</button><div class="su-sum" id="suSum"></div><button class="btn primary" id="suStart"><svg class="ico"><use href="#i-play"/></svg>Start</button></div></div>`;
    this.el = s;
    s.addEventListener('click', e => this.click(e));
    s.addEventListener('input', e => { if (e.target.id === 'suRoom') { this.s.room = e.target.value; this.summary(); } });
    return s;
  },
  open(o) {
    this.ensure(); const prevSet = this.s && this.s.set; this.s = Object.assign(this.load(), { online: !!o.online, set: o.set || 'main', from: o.from || 'title' });
    if (prevSet && prevSet !== this.s.set) this.s.biome = -1;
    if (this.s.biome >= 0 && (!THEMES[this.s.biome] || (THEMES[this.s.biome].set || 'main') !== this.s.set)) this.s.biome = -1;
    if (!this.s.room) this.s.room = `${UI.name}'s room`;
    this.tab = 0; this.render(); UI.show('setup');
  },
  refresh() { MainMenu.evInfo(); if (this.el && UI.cur === 'setup') this.render(); },
  isBig() { return this.s.mode === 'wilds' || this.s.mode === 'war'; },
  botSteps() { return this.isBig() ? SETUP_BOTS_WILDS : SETUP_BOTS_ARENA; },
  rules() { return RulesPanel.vals; },
  chips(key, opts, cur, cls = '') { return `<div class="su-chips ${cls}">${opts.map(([v, n]) => `<button data-pick="${key}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div>`; },
  rf(k) { return RULE_FIELDS.find(f => f.k === k); },
  render() {
    const s = this.s, el = this.el, v = this.rules(), big = this.isBig(), war = s.mode === 'war', ev = s.set === 'event';
    el.classList.toggle('event-set', ev); if (ev) el.style.setProperty('--ev-accent', EventInfo.accent || '#ff8a2a');
    $('#suEye').textContent = ev ? `${EventInfo.name} event · biomes2 + weapons2` : (s.online ? 'Online room' : 'Offline practice');
    $('#suTitle').textContent = ev ? `${EventInfo.name} game` : s.online ? 'Host a room' : 'Set up a game';
    el.querySelectorAll('#suWhere button').forEach(b => b.classList.toggle('on', +b.dataset.where === (s.online ? 1 : 0)));
    el.querySelectorAll('#suTabs button').forEach(b => b.classList.toggle('on', +b.dataset.tab === this.tab));
    let bi = biomeIndexes(s.set);
    if (s.mode === 'inkhold') { bi = THEMES.reduce((a, t, i) => { if (t.inkhold) a.push(i); return a; }, []); if (s.biome >= 0 && !THEMES[s.biome]?.inkhold) s.biome = -1; }
    const steps = this.botSteps(); if (!steps.includes(s.bots)) s.bots = steps.reduce((a, b) => Math.abs(b - s.bots) < Math.abs(a - s.bots) ? b : a, steps[0]);
    const tile = i => { const t = THEMES[i]; const far = (t.far && t.far[0]) || t.mid; return `<button class="su-bio${s.biome === i ? ' on' : ''}" data-pick="biome" data-v="${i}" title="${esc(t.name)}"><i style="background:linear-gradient(180deg,${t.skyT} 0%,${t.skyB} 46%,${far} 46%,${far} 60%,${t.cap || t.top} 60%,${t.top} 66%,${t.mid} 66%,${t.deep} 100%)"></i><em>${esc(t.name)}</em></button>`; };
    const ruleChips = (k, extra = '') => { const f = this.rf(k); return f ? `<div class="su-sec ${extra}"><span class="lbl">${f.l}</span>${this.chips('r:' + k, f.o, v[k])}</div>` : ''; };
    const pane0 = `<div class="su-sec"><span class="lbl">Mode</span><div class="su-modes">${SETUP_MODES.map(m => `<button class="su-mode${s.mode === m.id ? ' on' : ''}" data-pick="mode" data-v="${m.id}"><b>${m.n}</b><span>${m.d}</span></button>`).join('')}</div></div>
      <div class="su-grid2"><div class="su-sec"><span class="lbl">Terrain</span>${this.chips('terrain', [['normal', 'Normal hills'], ['flat', 'Flat']], s.terrain)}<p class="su-note">${s.terrain === 'flat' ? 'One long flat field. Great for building and big battles.' : 'Hills, pits, islands and caves, like always.'}</p></div>
      ${ruleChips('weather')}
      <div class="su-sec${big ? '' : ' su-off'}"><span class="lbl">Map size</span>${this.chips('r:mapSize', this.rf('mapSize').o, v.mapSize)}</div></div>
      <div class="su-sec"><span class="lbl">World${ev ? ' (event biomes)' : ''}</span><div class="su-biomes"><button class="su-bio rand${s.biome < 0 ? ' on' : ''}" data-pick="biome" data-v="-1"><i></i><b>?</b><em>Random</em></button>${bi.map(tile).join('')}</div></div>`;
    const tOpts = war ? [[2, '2 teams'], [3, '3 teams'], [4, '4 teams']] : this.rf('teams').o;
    const pane1 = `<div class="su-grid2"><div class="su-sec"><span class="lbl">Bots</span><div class="su-step"><button data-step="-1">&minus;</button><b id="suBots">${s.bots}</b><button data-step="1">+</button></div><p class="su-note">${big ? 'Big Wilds can take up to 100 bots.' : 'Arena fits up to 7 bots.'}</p></div>
      <div class="su-sec"><span class="lbl">First to</span>${this.chips('target', [[3, '3'], [5, '5'], [10, '10'], [20, '20']], s.target)}</div>
      ${ruleChips('skill')}
      <div class="su-sec"><span class="lbl">Teams</span>${this.chips('r:teams', tOpts, war ? Math.max(2, v.teams || 2) : v.teams)}</div>
      <div class="su-sec${s.online ? '' : ' su-off'}"><span class="lbl">Max real players</span>${this.chips('max', [[2, '2'], [4, '4'], [6, '6'], [8, '8'], [12, '12']], s.max)}</div>
      <div class="su-sec${s.online ? '' : ' su-off'}"><span class="lbl">Visibility</span>${this.chips('pub', [[1, 'Public (in Servers)'], [0, 'Private (code only)']], s.pub ? 1 : 0)}</div></div>
      <div class="su-sec${s.online ? '' : ' su-off'}"><label class="lbl" for="suRoom">Room name</label><input class="txt" id="suRoom" maxlength="24" autocomplete="off" spellcheck="false" value="${esc(s.room)}"></div>`;
    const pane2 = `<div class="su-grid2">${ruleChips('hp')}${ruleChips('time')}${ruleChips('sd')}${ruleChips('drops')}${ruleChips('weapons')}${ruleChips('ff', (war || v.teams) ? '' : 'su-off')}${ruleChips('storm', big ? '' : 'su-off')}${ruleChips('tickets', war ? '' : 'su-off')}${ruleChips('buildT', war ? '' : 'su-off')}</div>
      <p class="su-note">Rules are saved for next time. The host can change bots, teams and War mode from the pause menu too.</p>`;
    $('#suBody').innerHTML = `<div class="su-pane${this.tab === 0 ? ' on' : ''}">${pane0}</div><div class="su-pane${this.tab === 1 ? ' on' : ''}">${pane1}</div><div class="su-pane${this.tab === 2 ? ' on' : ''}">${pane2}</div>`;
    this.summary();
  },
  summary() {
    const s = this.s, v = this.rules(); const m = SETUP_MODES.find(x => x.id === s.mode); const b = s.biome >= 0 && THEMES[s.biome] ? THEMES[s.biome].name : 'random world';
    const parts = [s.online ? 'Online' : 'Offline', m.n, s.terrain === 'flat' ? 'flat' : 'hills', b, s.bots + ' bot' + (s.bots === 1 ? '' : 's'), 'first to ' + s.target];
    if (s.mode === 'war') parts.splice(2, 0, Math.max(2, v.teams || 2) + ' teams'); else if (v.teams) parts.splice(2, 0, v.teams + ' teams');
    if (s.set === 'event') parts.unshift(EventInfo.name); $('#suSum').textContent = parts.join(' · ');
  },
  click(e) {
    const s = this.s, v = this.rules(); let b;
    if ((b = e.target.closest('[data-where]'))) { s.online = b.dataset.where === '1'; Audio2.play('ui'); this.render(); return; }
    if ((b = e.target.closest('[data-tab]'))) { this.tab = +b.dataset.tab; Audio2.play('ui'); this.render(); $('#suBody').scrollTop = 0; return; }
    if ((b = e.target.closest('[data-step]'))) { const st = this.botSteps(); let i = st.indexOf(s.bots); i = clamp(i + +b.dataset.step, 0, st.length - 1); s.bots = st[i]; Audio2.play('ui'); $('#suBots').textContent = s.bots; this.save(); this.summary(); return; }
    if ((b = e.target.closest('[data-pick]'))) { const k = b.dataset.pick, raw = b.dataset.v; Audio2.play('ui');
      if (k.startsWith('r:')) { const f = this.rf(k.slice(2)); v[f.k] = typeof f.o[0][0] === 'number' ? +raw : raw; setCookie('ib_rules', JSON.stringify(v)); }
      else if (k === 'mode' || k === 'terrain') s[k] = raw; else if (k === 'pub') s.pub = raw === '1'; else s[k] = +raw;
      if (k === 'mode' && raw === 'war' && !(v.teams >= 2)) v.teams = 2;
      this.save(); const sc = $('#suBody').scrollTop; this.render(); $('#suBody').scrollTop = sc; return; }
    if (e.target.closest('#suBack')) { Audio2.play('ui'); UI._noFade = false; MainMenu.page = s.from === 'event' ? 'event' : 'title'; UI.show(MainMenu.page); return; }
    if (e.target.closest('#suStart')) { Audio2.init(); Audio2.play('ui'); this.start(); }
  },
  start() {
    const s = this.s, v = this.rules(); const big = this.isBig(), war = s.mode === 'war'; this.save();
    v.war = war ? 1 : 0; if (war && !(v.teams >= 2)) v.teams = 2; v.crowd = big && s.bots > 7 ? s.bots : 0; v.terrain = s.terrain; v.set = s.set;
    setCookie('ib_rules', JSON.stringify(Object.assign({}, v, { set: 'main' })));
    const name = s.online ? (cleanName(s.room || `${UI.name}'s room`).slice(0, 24) || 'Room') : (s.set === 'event' ? EventInfo.name : 'Practice');
    startHost({ offline: !s.online, name, max: s.online ? s.max : 8, target: s.target, bots: big ? s.bots : Math.min(7, s.bots), gameMode: s.mode === 'inkhold' ? 'inkhold' : (big ? 'expedition' : 'arena'), biome: s.biome, public: s.pub, set: s.set, terrain: s.terrain });
  },
};

MainMenu.build();
