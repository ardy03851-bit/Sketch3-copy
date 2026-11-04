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

/* ============ Ink & Slate: shared menu design tokens ============ */
#ui .screen{--mm-bg:#131017;--mm-panel:rgba(19,16,22,.78);--mm-line:rgba(238,232,218,.15);--mm-line-2:rgba(238,232,218,.32);
  --mm-text:#ece6d8;--mm-dim:rgba(236,230,216,.58);--mm-faint:rgba(236,230,216,.36);
  --mm-accent:#e2543a;--mm-gold:#c9a25a;--mm-disp:'Bricolage Grotesque','Space Grotesk',system-ui,sans-serif;--mm-ui:'Space Grotesk',system-ui,sans-serif}
#settings,#weapons,#practice{background:radial-gradient(130% 110% at 50% 16%,#1d1920 0%,#131017 58%,#0d0b11 100%)}
#pause{background:rgba(13,11,16,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
#ui .screen ::-webkit-scrollbar{width:8px;height:8px}
#ui .screen ::-webkit-scrollbar-thumb{background:rgba(238,232,218,.16);border-radius:4px}
#ui .screen ::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar{width:9px;height:9px}
::-webkit-scrollbar-thumb{background:rgba(238,232,218,.18);border-radius:5px}
::-webkit-scrollbar-track{background:transparent}
html{scrollbar-width:thin;scrollbar-color:rgba(238,232,218,.2) transparent}

/* shared chrome: cards, headings, buttons, inputs */
#ui .screen .card{background:var(--mm-panel);border:1px solid var(--mm-line);border-radius:16px;box-shadow:0 32px 80px rgba(0,0,0,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:var(--mm-text)}
#ui .screen h2{font:800 27px/1.08 var(--mm-disp);letter-spacing:-.015em;color:var(--mm-text)}
#ui .screen h2 .ico{color:var(--mm-accent)}
#ui .screen .sub{color:var(--mm-dim);font:400 13.5px/1.5 var(--mm-ui)}
#ui .screen .lbl{font:600 10px/1.2 var(--mm-ui);letter-spacing:.24em;text-transform:uppercase;color:var(--mm-faint)}
#ui .screen .eyebrow{font:600 10px var(--mm-ui);letter-spacing:.32em;text-transform:uppercase;color:var(--mm-accent)}
#ui .screen .btn{font:600 12.5px var(--mm-ui);letter-spacing:.16em;text-transform:uppercase;background:transparent;border:1px solid var(--mm-line);border-radius:10px;color:var(--mm-text);box-shadow:none;transition:background .15s,border-color .15s,color .15s}
#ui .screen .btn::before{background:transparent;box-shadow:none;transform:none}
#ui .screen .btn::after{display:none}
#ui .screen .btn:hover{transform:none;background:rgba(238,232,218,.05);border-color:var(--mm-line-2);box-shadow:none}
#ui .screen .btn:active{transform:none}
#ui .screen .btn.primary{background:#ece6d8;color:#15121a;border-color:transparent}
#ui .screen .btn.primary:hover{background:#fff}
#ui .screen .btn.gold{background:transparent;border-color:rgba(201,162,90,.55);color:var(--mm-gold)}
#ui .screen .btn.ghost{background:transparent;border-color:transparent;color:var(--mm-dim)}
#ui .screen .btn.ghost:hover{color:var(--mm-text);border-color:var(--mm-line)}
#ui .screen input.txt,#ui .screen select{background:rgba(255,255,255,.045);border:1px solid var(--mm-line);border-radius:9px;color:var(--mm-text);font:500 14.5px var(--mm-ui);box-shadow:none}
#ui .screen input.txt:focus,#ui .screen select:focus{outline:none;border-color:var(--mm-line-2)}
#ui .screen select option{background:#1a171d;color:var(--mm-text)}
#ui .screen input[type=checkbox],#ui .screen input[type=range]{accent-color:#e2543a}
#ui .screen .chip{font:500 11px var(--mm-ui);letter-spacing:.1em;text-transform:uppercase;background:transparent;border:1px solid var(--mm-line);border-radius:999px;color:var(--mm-dim);box-shadow:none;transition:color .15s,border-color .15s,background .15s}
#ui .screen .chip:hover{transform:none;color:var(--mm-text);border-color:var(--mm-line-2);background:rgba(238,232,218,.05);box-shadow:none}
#ui .screen .sw{border-radius:8px;border:1px solid var(--mm-line);box-shadow:none}
#ui .screen .sw.on{outline:2px solid var(--mm-accent);outline-offset:2px}
#ui .screen .set-group{background:rgba(255,255,255,.025);border:1px solid var(--mm-line);border-radius:12px;box-shadow:none}
#ui .screen .set-head{font:600 10px var(--mm-ui);letter-spacing:.28em;text-transform:uppercase;color:var(--mm-dim);border-bottom:1px solid var(--mm-line)}
#ui .screen .setting-row{border-bottom:1px solid rgba(238,232,218,.07);color:var(--mm-text);font:500 14px var(--mm-ui)}
#ui .screen .setting-row:last-child{border-bottom:0}
#ui .screen .setting-row select{background:rgba(255,255,255,.045);border:1px solid var(--mm-line);border-radius:8px;color:var(--mm-text)}
#ui .screen .witem{background:rgba(255,255,255,.03);border:1px solid var(--mm-line);border-radius:10px;box-shadow:none}
#ui .screen .witem small{color:var(--mm-dim)}
#ui .screen .witem small.desc{color:var(--mm-faint)}
#ui .screen .witem:hover{transform:none;box-shadow:none;border-color:var(--mm-line-2)}
#ui .screen .wn{font:700 15px var(--mm-disp);color:var(--mm-text)}
#ui .screen .pl{background:rgba(255,255,255,.03);border:1px solid var(--mm-line);border-radius:9px;box-shadow:none}
#ui .screen .exp-note{color:var(--mm-dim);font:400 12.5px/1.55 var(--mm-ui)}
#ui .screen .err{color:var(--mm-accent)}
#ui .screen .setup-grid{gap:12px 14px}
#ui .screen .row .btn{min-height:40px}
#loading{background:#131017;color:rgba(236,230,216,.55);font:500 12px 'Space Grotesk',system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase}

/* ============ the home page ============ */
#title.home,#event.home{padding:0;justify-content:flex-start;align-items:stretch;background:#131017;overflow:hidden}
.mm-bg{position:absolute;inset:-6%;background-size:cover;background-position:center;animation:mmPan 64s ease-in-out infinite alternate;will-change:transform;filter:saturate(.8) brightness(.88)}
.mm-bg.fallback{background:radial-gradient(120% 90% at 62% 38%,#27222c 0%,#1a161e 55%,#100d13 100%)}
@keyframes mmPan{0%{transform:scale(1.03) translate(0,0)}100%{transform:scale(1.09) translate(-1.6%,1%)}}
.mm-shade{position:absolute;inset:0;background:linear-gradient(92deg,rgba(13,11,16,.9) 0%,rgba(13,11,16,.66) 34%,rgba(13,11,16,.12) 66%,rgba(13,11,16,0) 100%),linear-gradient(0deg,rgba(13,11,16,.66),rgba(13,11,16,0) 36%);pointer-events:none}
.mm-grain{position:absolute;inset:0;pointer-events:none;opacity:.1;mix-blend-mode:overlay;background-image:radial-gradient(rgba(236,230,216,.5) .6px,transparent .7px);background-size:5px 5px}
.mm-left{position:relative;z-index:2;display:flex;flex-direction:column;gap:16px;width:min(460px,92vw);height:100%;overflow-y:auto;overflow-x:hidden;
  padding:calc(34px + var(--safe-t)) 32px calc(24px + var(--safe-b)) calc(36px + var(--safe-l));scrollbar-width:none}
.mm-left::-webkit-scrollbar{display:none}
@keyframes mmRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.mm-brand{animation:mmRise .8s .05s cubic-bezier(.16,1,.3,1) both}
.mm-overline{display:flex;align-items:center;gap:12px;font:600 10px var(--mm-ui);letter-spacing:.36em;text-transform:uppercase;color:var(--mm-dim)}
.mm-overline::before{content:'';width:28px;height:1px;background:var(--mm-accent);flex:none}
.mm-word{margin:12px 0 4px;font:800 clamp(56px,6.6vw,92px)/.9 var(--mm-disp);letter-spacing:-.025em;text-transform:uppercase;color:var(--mm-text)}
.mm-word .o{color:transparent;-webkit-text-stroke:2.5px rgba(236,230,216,.9)}
@supports not (-webkit-text-stroke:2.5px white){.mm-word .o{color:rgba(236,230,216,.55)}}
.mm-tag{font:400 13px/1.55 var(--mm-ui);letter-spacing:.03em;color:var(--mm-dim);max-width:42ch;animation:mmRise .8s .14s cubic-bezier(.16,1,.3,1) both}
.mm-title{position:relative;width:100%;min-height:80px;display:flex;align-items:flex-end;animation:mmRise .8s both}
.mm-title img{width:100%;max-height:26vh;object-fit:contain;object-position:left bottom;filter:drop-shadow(0 12px 28px rgba(0,0,0,.55))}
.mm-title .logo{font:800 clamp(44px,5.2vw,70px)/1 var(--mm-disp);letter-spacing:-.02em;text-transform:uppercase;color:var(--mm-text)}
.mm-who{background:var(--mm-panel);border:1px solid var(--mm-line);border-radius:12px;padding:16px 16px 12px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:mmRise .8s .22s cubic-bezier(.16,1,.3,1) both}
.mm-who .field{margin-bottom:10px}.mm-who .field:last-child{margin-bottom:2px}
.mm-who input.txt{font-size:15px;padding:10px 12px}
.mm-who .sw{width:38px;height:38px}
.mm-btns{display:flex;flex-direction:column;gap:10px;margin-top:2px}
.mm-btns .btn{position:relative;width:100%;justify-content:flex-start;min-height:58px;font-size:13px;letter-spacing:.2em;padding:12px 22px;animation:mmRise .8s cubic-bezier(.16,1,.3,1) both;transition:background .16s,border-color .16s}
#ui .screen .mm-btns .btn::before{content:'';position:absolute;left:0;top:15px;bottom:15px;width:2px;right:auto;border-radius:0;background:var(--mm-accent);opacity:0;transition:opacity .16s;z-index:0}
.mm-btns .btn:hover::before{opacity:1}
.mm-btns .btn:nth-child(1){animation-delay:.3s}.mm-btns .btn:nth-child(2){animation-delay:.38s}.mm-btns .btn:nth-child(3){animation-delay:.46s}
.mm-btns .btn small{margin-left:auto;font:500 11px var(--mm-ui);letter-spacing:.1em;opacity:.55;text-transform:none}
.mm-btns .btn.primary small{opacity:1;color:rgba(21,18,26,.62)}
.mm-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:10px;animation:mmRise .8s .54s both}
.mm-chips .chip{font-size:11px;padding:8px 14px}
.mm-flip{position:absolute;z-index:4;top:50%;right:0;transform:translateY(-50%);display:flex;align-items:center;gap:12px;padding:22px 13px;cursor:pointer;
  border:1px solid var(--mm-line);border-right:0;border-radius:14px 0 0 14px;background:var(--mm-panel);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  color:var(--mm-dim);font:600 11px var(--mm-ui);letter-spacing:.3em;text-transform:uppercase;writing-mode:vertical-rl;
  animation:mmFade .9s .6s both;transition:color .15s,border-color .15s,background .15s}
@keyframes mmFade{from{opacity:0}to{opacity:1}}
.mm-flip:hover{transform:translateY(-50%);color:var(--mm-text);background:rgba(24,20,27,.85);border-color:var(--mm-line-2)}
.mm-flip .ar{display:grid;place-items:center;color:var(--mm-accent)}
.mm-flip svg{width:15px;height:15px}.mm-flip svg *{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.mm-flip.back{right:auto;left:0;border-right:1px solid var(--mm-line);border-left:0;border-radius:0 14px 14px 0}
#event .mm-flip.back{left:auto;right:0;border-left:1px solid var(--mm-line);border-right:0;border-radius:14px 0 0 14px}
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
#event .mm-shade{background:linear-gradient(92deg,rgba(14,8,18,.88) 0%,rgba(14,8,18,.62) 34%,rgba(14,8,18,.1) 66%,rgba(14,8,18,0) 100%),linear-gradient(0deg,rgba(30,12,38,.5),rgba(0,0,0,0) 38%)}
#evCanvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#event .mm-title .logo{color:var(--ev-accent)}
#event .mm-tag{color:rgba(255,226,194,.75)}
#event .mm-btns .btn.primary{background:var(--ev-accent);color:#1c1014}
#event .mm-btns .btn.primary:hover{background:#ffa14f}
.ev-badge{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;padding:7px 14px;border:1px solid rgba(255,138,42,.5);border-radius:999px;background:rgba(255,138,42,.12);color:#ffb377;font:600 11px var(--mm-ui);letter-spacing:.22em;text-transform:uppercase;animation:mmRise .6s .1s both}
.ev-info{color:var(--mm-dim);font:400 12px var(--mm-ui);letter-spacing:.05em;animation:mmRise .7s .5s both}
@media (max-width:640px){.mm-left{width:100%;gap:12px;padding:calc(18px + var(--safe-t)) 18px calc(16px + var(--safe-b)) calc(18px + var(--safe-l))}.mm-flip{top:auto;bottom:calc(16px + var(--safe-b));right:auto;left:50%;transform:translate(-50%,0);writing-mode:horizontal-tb;border:1px solid var(--mm-line);border-radius:999px;padding:12px 22px}.mm-flip:hover{transform:translate(-50%,0)}.mm-flip.back{left:50%;right:auto;border:1px solid var(--mm-line);border-radius:999px}.mm-shade{background:rgba(13,11,16,.5)}.mm-btns .btn{min-height:50px}.mm-word{-webkit-text-stroke:1.5px rgba(236,230,216,.9)}.mm-word .o{-webkit-text-stroke-width:1.5px}}
@media (max-height:600px){.mm-left{gap:10px}.mm-word{font-size:clamp(40px,8vh,60px)}.mm-btns .btn{min-height:44px}.mm-who .sw{width:30px;height:30px}.mm-who{padding:12px 14px 8px}}

/* ============ setup screen ============ */
#setup{background:linear-gradient(rgba(13,11,16,.82),rgba(13,11,16,.9)),url(mainmenu/bg.png) center/cover}
#setup.event-set{background:linear-gradient(rgba(18,9,24,.82),rgba(11,6,15,.9)),url(mainmenu/event/bg.png) center/cover}
#setup .card{max-width:780px;padding:22px 24px 16px;display:flex;flex-direction:column;max-height:calc(100dvh - 40px)}
.su-head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}
.su-head h2{margin:0}
.su-where{min-width:240px}
.su-tabs{display:flex;gap:8px;margin-bottom:14px;border-bottom:1px solid var(--mm-line);padding-bottom:12px}
.su-tabs button{border:1px solid var(--mm-line);background:transparent;border-radius:9px;padding:9px 16px;font:600 11.5px var(--mm-ui);letter-spacing:.18em;text-transform:uppercase;color:var(--mm-dim);cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.su-tabs button.on{background:#ece6d8;color:#15121a;border-color:transparent}
.su-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:2px 4px 6px 2px;touch-action:pan-y}
.su-pane{display:none;animation:suPane .28s cubic-bezier(.16,1,.3,1) both}.su-pane.on{display:block}
@keyframes suPane{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.su-sec{margin-bottom:16px}.su-sec>.lbl{margin-bottom:8px}
.su-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.su-mode{position:relative;text-align:left;border:1px solid var(--mm-line);border-radius:11px;background:rgba(255,255,255,.03);padding:13px 14px;cursor:pointer;transition:border-color .15s,background .15s}
.su-mode b{display:block;font:700 16px var(--mm-disp);color:var(--mm-text);letter-spacing:-.01em}
.su-mode span{display:block;font:400 12px/1.45 var(--mm-ui);color:var(--mm-dim);margin-top:3px}
.su-mode.on{border-color:var(--mm-accent);background:rgba(226,84,58,.09)}
.su-chips{display:flex;flex-wrap:wrap;gap:6px}
.su-chips button{border:1px solid var(--mm-line);background:transparent;border-radius:8px;padding:8px 14px;font:500 12.5px var(--mm-ui);letter-spacing:.04em;color:var(--mm-dim);cursor:pointer;min-height:38px;transition:background .13s,color .13s,border-color .13s}
.su-chips button:hover{color:var(--mm-text);border-color:var(--mm-line-2)}
.su-chips button.on{background:#ece6d8;color:#15121a;border-color:transparent}
.su-biomes{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.su-bio{position:relative;height:66px;border:1px solid var(--mm-line);border-radius:10px;overflow:hidden;cursor:pointer;padding:0;transition:border-color .15s,transform .15s}
.su-bio i{position:absolute;inset:0}
.su-bio em{position:absolute;left:0;right:0;bottom:0;font:600 10.5px var(--mm-ui);letter-spacing:.04em;font-style:normal;padding:4px 7px;background:rgba(13,11,16,.85);color:var(--mm-text);text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.su-bio.on{border-color:var(--mm-accent);transform:translateY(-2px)}
.su-bio.on em{background:var(--mm-accent);color:#1c1014}
.su-bio.rand i{background:repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 10px,rgba(255,255,255,.02) 10px 20px)}
.su-bio.rand b{position:absolute;top:8px;left:0;right:0;text-align:center;font:700 22px var(--mm-disp);color:var(--mm-dim)}
.su-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.su-step{display:flex;align-items:center;gap:10px}.su-step button{width:46px;height:42px;border:1px solid var(--mm-line);border-radius:9px;background:rgba(255,255,255,.03);color:var(--mm-text);font:600 20px var(--mm-ui);cursor:pointer;transition:border-color .13s,background .13s}
.su-step button:hover{border-color:var(--mm-line-2);background:rgba(255,255,255,.06)}
.su-step b{min-width:64px;text-align:center;font:700 20px var(--mm-disp);color:var(--mm-text)}
.su-off{opacity:.32;pointer-events:none;filter:grayscale(.9)}
.su-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--mm-line);padding-top:12px;margin-top:6px}
.su-sum{flex:1;min-width:200px;font:400 12.5px/1.45 var(--mm-ui);color:var(--mm-dim)}
.su-note{font:400 12px/1.5 var(--mm-ui);color:var(--mm-faint);margin:4px 0 0}
#setup.event-set .card{background:rgba(24,15,30,.82)}
#setup.event-set .su-tabs button.on,#setup.event-set .su-chips button.on{background:var(--ev-accent,#ff8a2a);color:#1c1014}
#setup.event-set .su-mode.on{border-color:var(--ev-accent,#ff8a2a);background:rgba(255,138,42,.1)}
#setup.event-set .su-bio.on em,#setup.event-set .su-bio.on{border-color:var(--ev-accent,#ff8a2a)}
#setup.event-set .su-bio.on em{background:var(--ev-accent,#ff8a2a);color:#1c1014}
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
    const keep = {}; for (const id of ['bPractice', 'bSettings', 'chipWeapons']) keep[id] = $('#' + id);
    const fields = ['#nameIn', '#swatches'].map(id => $(id) && $(id).closest('.field')).filter(Boolean);
    home.classList.add('home'); for (const n of [...Object.values(keep), ...fields, logo, tag]) if (n) n.remove(); home.innerHTML = '';
    const bg = document.createElement('div'); bg.className = 'mm-bg fallback'; home.append(bg, Object.assign(document.createElement('div'), { className: 'mm-shade' }), Object.assign(document.createElement('div'), { className: 'mm-grain' }));
    mmImage(MMENU + 'bg.png').then(i => { if (i) { bg.classList.remove('fallback'); bg.style.backgroundImage = `url("${i.src}")`; } });
    const left = document.createElement('div'); left.className = 'mm-left'; home.append(left);
    const brand = document.createElement('div'); brand.className = 'mm-brand'; left.append(brand);
    brand.innerHTML = '<div class="mm-overline">Offline turn-based artillery</div><h1 class="mm-word">Ink<span class="o">Brawl</span></h1>';
    if (tag) { tag.className = 'mm-tag'; brand.append(tag); }
    const who = document.createElement('div'); who.className = 'mm-who'; left.append(who);
    for (const f of fields) who.append(f);
    const btns = document.createElement('div'); btns.className = 'mm-btns'; left.append(btns);
    const bP = keep.bPractice, bS = keep.bSettings;
    if (bP) { bP.className = 'btn primary'; bP.innerHTML = '<svg class="ico"><use href="#i-play"/></svg>Play<small>vs bots</small>'; btns.append(bP); }
    if (bS) { bS.className = 'btn'; bS.innerHTML = '<svg class="ico"><use href="#i-gear"/></svg>Settings'; btns.append(bS); }
    const chips = document.createElement('div'); chips.className = 'mm-chips'; left.append(chips);
    if (keep.chipWeapons) chips.append(keep.chipWeapons);
    const flip = document.createElement('button'); flip.className = 'mm-flip'; flip.id = 'bEventPage'; flip.innerHTML = `<span class="ar"><svg viewBox="0 0 24 24"><path d="M5 12h13"/><path d="M12.5 5.5 19 12l-6.5 6.5"/></svg></span><span class="lb">${esc(EventInfo.name)} event</span>`;
    home.append(flip); flip.addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); this.flip('event'); });
    // Play / Host open the setup screen instead of the old cards
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('#bPractice'); if (!b) return; e.stopPropagation(); e.preventDefault(); Audio2.init(); Audio2.play('ui');
      Setup.open({ set: 'main', from: 'title' });
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
      <div class="mm-btns"><button class="btn primary" id="bEvPlay"><svg class="ico"><use href="#i-play"/></svg>Play the event<small>vs bots</small></button></div>
      <div class="ev-info" id="evInfo"></div>`;
    const tt = left.querySelector('#evTitle');
    mmImage(MMENU + 'event/' + (E.title || 'maintitle.png')).then(i => { if (i) { i.alt = 'Inkbrawl ' + E.name; tt.append(i); } else { tt.innerHTML = `<div class="logo" data-t="INKBRAWL">${'INKBRAWL'.split('').map(c => `<span>${c}</span>`).join('')}</div>`; } });
    const back = document.createElement('button'); back.className = 'mm-flip back'; back.innerHTML = `<span class="ar"><svg viewBox="0 0 24 24"><path d="M19 12H6"/><path d="M11.5 5.5 5 12l6.5 6.5"/></svg></span><span class="lb">Main menu</span>`;
    s.append(back); back.addEventListener('click', () => { Audio2.play('ui'); this.flip('title'); });
    $('#bEvPlay').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); Setup.open({ set: 'event', from: 'event' }); });
    this.evInfo();
  },
  evInfo() { const el = $('#evInfo'); if (!el) return; const nw = Weapons.list.filter(w => w.set === 'event' || (Array.isArray(w.sets) && w.sets.includes('event') && !w.sets.includes('main'))).length; const nb = THEMES.filter(t => t.set === 'event').length; el.textContent = `${nw} event weapon${nw === 1 ? '' : 's'} · ${nb} event biome${nb === 1 ? '' : 's'} · a spooky seasonal set`; },
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
  const MENU_SCREENS = new Set(['title', 'event', 'setup', 'weapons', 'settings', 'practice']);
  UI.show = function (id, ...rest) {
    if (id === 'title' && MainMenu.page === 'event' && !MainMenu.flipping && G.mode !== 'play' && $('#event')) id = 'event';
    if (id === 'practice') { Setup.open({ set: MainMenu.page === 'event' ? 'event' : 'main', from: MainMenu.page }); return; }
    const prev = this.cur && $('#' + this.cur); const r = _show(id, ...rest);
    if (!this._noFade && prev && prev.id !== id && MENU_SCREENS.has(prev.id) && id && MENU_SCREENS.has(id)) {
      prev.classList.add('leaving'); clearTimeout(prev._lv); prev._lv = setTimeout(() => prev.classList.remove('leaving'), 270);
    }
    for (const s of document.querySelectorAll('.screen.leaving')) if (s.id === id) s.classList.remove('leaving');
    if (id === 'weapons' && UI.renderWeapons && !$('#wlist').children.length) UI.renderWeapons();
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
  defaults() { return { set: 'main', mode: 'arena', terrain: 'normal', biome: -1, bots: 3, max: 6, target: 5 }; },
  load() { try { return Object.assign(this.defaults(), JSON.parse(getCookie('ib_setup') || '{}')); } catch (e) { return this.defaults(); } },
  save() { const { set, from, ...keep } = this.s; setCookie('ib_setup', JSON.stringify(keep)); },
  ensure() {
    if (this.el) return this.el; const s = document.createElement('section'); s.className = 'screen hidden'; s.id = 'setup'; $('#ui').insertBefore(s, $('#hud'));
    s.innerHTML = `<div class="card"><div class="su-head"><div><div class="eyebrow" id="suEye">New game</div><h2 id="suTitle">Set up a game</h2></div>
</div>
      <div class="su-tabs" id="suTabs"><button data-tab="0">Mode &amp; map</button><button data-tab="1">Players</button><button data-tab="2">Rules</button></div>
      <div class="su-body" id="suBody"></div>
      <div class="su-foot"><button class="btn ghost small" id="suBack"><svg class="ico"><use href="#i-back"/></svg>Back</button><div class="su-sum" id="suSum"></div><button class="btn primary" id="suStart"><svg class="ico"><use href="#i-play"/></svg>Start</button></div></div>`;
    this.el = s;
    s.addEventListener('click', e => this.click(e));
    return s;
  },
  open(o) {
    this.ensure(); const prevSet = this.s && this.s.set; this.s = Object.assign(this.load(), { set: o.set || 'main', from: o.from || 'title' });
    if (!SETUP_MODES.some(x => x.id === this.s.mode)) this.s.mode = 'arena'; // sanitize stale/invalid saved mode
    if (prevSet && prevSet !== this.s.set) this.s.biome = -1;
    if (this.s.biome >= 0 && (!THEMES[this.s.biome] || (THEMES[this.s.biome].set || 'main') !== this.s.set)) this.s.biome = -1;
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
    $('#suEye').textContent = ev ? `${EventInfo.name} event · biomes2 + weapons2` : 'Offline · vs bots';
    $('#suTitle').textContent = ev ? `${EventInfo.name} game` : 'Set up a game';
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
      </div>`;
    const pane2 = `<div class="su-grid2">${ruleChips('hp')}${ruleChips('time')}${ruleChips('sd')}${ruleChips('drops')}${ruleChips('weapons')}${ruleChips('ff', (war || v.teams) ? '' : 'su-off')}${ruleChips('storm', big ? '' : 'su-off')}${ruleChips('tickets', war ? '' : 'su-off')}${ruleChips('buildT', war ? '' : 'su-off')}</div>
      <p class="su-note">Rules are saved for next time. The host can change bots, teams and War mode from the pause menu too.</p>`;
    $('#suBody').innerHTML = `<div class="su-pane${this.tab === 0 ? ' on' : ''}">${pane0}</div><div class="su-pane${this.tab === 1 ? ' on' : ''}">${pane1}</div><div class="su-pane${this.tab === 2 ? ' on' : ''}">${pane2}</div>`;
    this.summary();
  },
  summary() {
    const s = this.s, v = this.rules(); const m = SETUP_MODES.find(x => x.id === s.mode) || SETUP_MODES[0]; const b = s.biome >= 0 && THEMES[s.biome] ? THEMES[s.biome].name : 'random world';
    const parts = ['Offline', m.n, s.terrain === 'flat' ? 'flat' : 'hills', b, s.bots + ' bot' + (s.bots === 1 ? '' : 's'), 'first to ' + s.target];
    if (s.mode === 'war') parts.splice(2, 0, Math.max(2, v.teams || 2) + ' teams'); else if (v.teams) parts.splice(2, 0, v.teams + ' teams');
    if (s.set === 'event') parts.unshift(EventInfo.name); $('#suSum').textContent = parts.join(' · ');
  },
  click(e) {
    const s = this.s, v = this.rules(); let b;
    if ((b = e.target.closest('[data-tab]'))) { this.tab = +b.dataset.tab; Audio2.play('ui'); this.render(); $('#suBody').scrollTop = 0; return; }
    if ((b = e.target.closest('[data-step]'))) { const st = this.botSteps(); let i = st.indexOf(s.bots); i = clamp(i + +b.dataset.step, 0, st.length - 1); s.bots = st[i]; Audio2.play('ui'); $('#suBots').textContent = s.bots; this.save(); this.summary(); return; }
    if ((b = e.target.closest('[data-pick]'))) { const k = b.dataset.pick, raw = b.dataset.v; Audio2.play('ui');
      if (k.startsWith('r:')) { const f = this.rf(k.slice(2)); v[f.k] = typeof f.o[0][0] === 'number' ? +raw : raw; setCookie('ib_rules', JSON.stringify(v)); }
      else if (k === 'mode' || k === 'terrain') s[k] = raw; else s[k] = +raw;
      if (k === 'mode' && raw === 'war' && !(v.teams >= 2)) v.teams = 2;
      this.save(); const sc = $('#suBody').scrollTop; this.render(); $('#suBody').scrollTop = sc; return; }
    if (e.target.closest('#suBack')) { Audio2.play('ui'); UI._noFade = false; MainMenu.page = s.from === 'event' ? 'event' : 'title'; UI.show(MainMenu.page); return; }
    if (e.target.closest('#suStart')) { Audio2.init(); Audio2.play('ui'); this.start(); }
  },
  start() {
    const s = this.s, v = this.rules(); const big = this.isBig(), war = s.mode === 'war'; this.save();
    v.war = war ? 1 : 0; if (war && !(v.teams >= 2)) v.teams = 2; v.crowd = big && s.bots > 7 ? s.bots : 0; v.terrain = s.terrain; v.set = s.set;
    setCookie('ib_rules', JSON.stringify(Object.assign({}, v, { set: 'main' })));
    const name = s.set === 'event' ? EventInfo.name : 'Practice';
    startHost({ name, max: 8, target: s.target, bots: big ? s.bots : Math.min(7, s.bots), gameMode: s.mode === 'inkhold' ? 'inkhold' : (big ? 'expedition' : 'arena'), biome: s.biome, set: s.set, terrain: s.terrain });
  },
};

MainMenu.build();

/* =====================================================================
   Settings extras (menu.js runs after expansion.js, so Settings and
   saveSettings already exist). Wires the new offline Settings screen rows:
   leaf sway, water reflections, water quality, fullscreen and reset.
   ===================================================================== */
(function settingsExtras() {
  /* new Settings fields — persisted with the rest via the ib_settings cookie */
  if (Settings.leafSway == null) Settings.leafSway = true;
  if (Settings.waterReflections == null) Settings.waterReflections = true;
  if (!Settings.waterQuality) Settings.waterQuality = 'medium';

  const ls = $('#leafSwaySetting'), wr = $('#waterReflSetting'), wq = $('#waterQualitySetting');
  if (ls) { ls.checked = Settings.leafSway; ls.addEventListener('change', () => { Settings.leafSway = ls.checked; saveSettings(); }); }
  if (wr) { wr.checked = Settings.waterReflections; wr.addEventListener('change', () => { Settings.waterReflections = wr.checked; saveSettings(); }); }
  if (wq) { wq.value = Settings.waterQuality; wq.addEventListener('change', () => { Settings.waterQuality = wq.value; saveSettings(); }); }

  /* fullscreen toggle (only shown when the Fullscreen API exists) */
  const bF = $('#bFullscreen');
  const doc = document.documentElement;
  const canFs = !!(doc.requestFullscreen || doc.webkitRequestFullscreen);
  if (bF) {
    if (!canFs) { const row = bF.closest('.setting-row'); if (row) row.style.display = 'none'; }
    else {
      const sync = () => { bF.textContent = (document.fullscreenElement || document.webkitFullscreenElement) ? 'Exit fullscreen' : 'Enter fullscreen'; };
      sync();
      document.addEventListener('fullscreenchange', sync);
      bF.addEventListener('click', () => {
        const on = document.fullscreenElement || document.webkitFullscreenElement;
        if (on) { const ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) ex.call(document); }
        else { const rq = doc.requestFullscreen || doc.webkitRequestFullscreen; const p = rq.call(doc); if (p && p.catch) p.catch(() => { }); }
      });
    }
  }

  /* reset to defaults: refreshes every control, including expansion.js's */
  const bR = $('#bResetSettings');
  if (bR) bR.addEventListener('click', () => {
    Audio2.play('ui');
    Object.assign(Settings, { graphics: 'auto', weather: true, shake: true, volume: .65, fps: false, leafSway: true, waterReflections: true, waterQuality: 'medium' });
    const gs = $('#graphicsSetting'), ws = $('#weatherSetting'), ss = $('#shakeSetting'), vs = $('#volumeSetting'), fs2 = $('#fpsSetting');
    if (gs) gs.value = Settings.graphics; if (ws) ws.checked = Settings.weather; if (ss) ss.checked = Settings.shake;
    if (vs) vs.value = Math.round(Settings.volume * 100); if (fs2) fs2.checked = Settings.fps;
    if (ls) ls.checked = Settings.leafSway; if (wr) wr.checked = Settings.waterReflections; if (wq) wq.value = Settings.waterQuality;
    try { qLevel = qFloor = baseQuality(); applyQuality(); Weather.resize(); } catch (e) { }
    if (Audio2.master) Audio2.master.gain.value = .85 * Settings.volume;
    saveSettings();
  });
})();
