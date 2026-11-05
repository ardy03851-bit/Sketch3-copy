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
#title.home,#event.home{padding:0;display:block;background:#121016;overflow:hidden}
.mm-scroll{position:relative;z-index:2;height:100%;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;display:block;
  padding:calc(28px + var(--safe-t)) calc(28px + var(--safe-r)) calc(24px + var(--safe-b)) calc(34px + var(--safe-l));
  scrollbar-width:none}
.mm-scroll::-webkit-scrollbar{display:none}
@supports not (backdrop-filter:blur(4px)){#title.home,#event.home{background:#121016}}

/* --- the art stage behind everything --- */
.mm-stage{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.mm-bg{position:absolute;inset:-5%;background-size:cover;background-position:center;background-repeat:no-repeat;
  animation:mmPan 72s ease-in-out infinite alternate;will-change:transform;filter:saturate(.92) brightness(.8) contrast(1.02)}
.mm-bg.fallback{background:radial-gradient(120% 90% at 62% 38%,#2b2430 0%,#191520 55%,#0f0d13 100%)}
@keyframes mmPan{0%{transform:scale(1.04) translate3d(0,0,0)}100%{transform:scale(1.1) translate3d(-1.6%,1.2%,0)}}
/* a soft drawn-ink sun glow, drifting; sits between the art and the text */
.mm-sky{position:absolute;inset:0;background:
  radial-gradient(48% 42% at 74% 16%,rgba(255,225,170,.16),transparent 70%),
  radial-gradient(60% 55% at 88% 78%,rgba(226,84,58,.13),transparent 72%);
  animation:mmGlow 26s ease-in-out infinite alternate;mix-blend-mode:screen}
@keyframes mmGlow{0%{opacity:.75;transform:translate3d(0,0,0)}100%{opacity:1;transform:translate3d(-2%,1.5%,0)}}
/* the legibility wash: darkest at the left where the UI lives, clear on the art */
.mm-wash{position:absolute;inset:0;pointer-events:none;background:
  linear-gradient(96deg,rgba(12,10,15,.94) 0%,rgba(12,10,15,.88) 26%,rgba(12,10,15,.62) 45%,rgba(12,10,15,.18) 68%,rgba(12,10,15,.02) 88%),
  linear-gradient(0deg,rgba(12,10,15,.78) 0%,rgba(12,10,15,0) 34%),
  radial-gradient(120% 120% at 50% 50%,transparent 55%,rgba(8,7,10,.5) 100%)}
#title.has-art .mm-wash{background:
  linear-gradient(96deg,rgba(12,10,15,.9) 0%,rgba(12,10,15,.8) 28%,rgba(12,10,15,.42) 48%,rgba(12,10,15,.06) 70%,transparent 90%),
  linear-gradient(0deg,rgba(12,10,15,.7) 0%,rgba(12,10,15,0) 32%),
  radial-gradient(125% 125% at 50% 50%,transparent 58%,rgba(8,7,10,.45) 100%)}
.mm-grain{position:absolute;inset:0;pointer-events:none;opacity:.14;mix-blend-mode:overlay;
  background-image:radial-gradient(rgba(240,234,220,.55) .6px,transparent .8px);background-size:4px 4px}
.mm-motes{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.85}

/* --- the left column --- */
.mm-left{position:relative;z-index:2;display:block;float:left;width:min(452px,100%);max-width:100%}
.mm-panel{display:flex;flex-direction:column;gap:clamp(12px,1.7vh,20px);min-width:0}
@keyframes mmRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.mm-rise{animation:mmRise .7s cubic-bezier(.16,1,.3,1) both}
.mm-rise.r1{animation-delay:.06s}.mm-rise.r2{animation-delay:.14s}.mm-rise.r3{animation-delay:.22s}
.mm-rise.r4{animation-delay:.3s}.mm-rise.r5{animation-delay:.38s}.mm-rise.r6{animation-delay:.46s}
.mm-brand{animation:mmRise .8s .04s cubic-bezier(.16,1,.3,1) both}
.mm-overline{display:flex;align-items:center;gap:11px;font:600 9.5px var(--mm-ui);letter-spacing:.32em;text-transform:uppercase;color:rgba(236,230,216,.5)}
.mm-rule{width:30px;height:2px;flex:none;border-radius:2px;background:linear-gradient(90deg,var(--mm-accent),rgba(226,84,58,.15))}
.mm-title{position:relative;width:100%;margin:10px 0 6px;display:flex;align-items:flex-end;min-height:0}
.mm-logo-img{display:block;width:100%;max-width:420px;max-height:min(23vh,190px);object-fit:contain;object-position:left bottom;
  filter:drop-shadow(0 10px 26px rgba(0,0,0,.6));animation:mmLogoIn 1s cubic-bezier(.2,1.2,.3,1) both}
@keyframes mmLogoIn{from{opacity:0;transform:translateY(14px) scale(.96) rotate(-1deg)}to{opacity:1;transform:none}}
.mm-word{margin:0;font:800 clamp(52px,5.4vw,80px)/.88 var(--mm-disp);letter-spacing:-.03em;text-transform:uppercase;color:var(--mm-text);
  text-shadow:0 8px 30px rgba(0,0,0,.5)}
.mm-word .o{color:transparent;-webkit-text-stroke:2.4px rgba(236,230,216,.92)}
@supports not (-webkit-text-stroke:2.4px white){.mm-word .o{color:rgba(236,230,216,.6)}}
.mm-tag{margin:0;font:400 13px/1.55 var(--mm-ui);letter-spacing:.01em;color:rgba(236,230,216,.62);max-width:40ch}

/* who you are: avatar + name side by side */
.mm-who{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid var(--mm-line);border-radius:14px;
  background:linear-gradient(150deg,rgba(255,255,255,.055),rgba(255,255,255,.018));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 18px 40px -22px rgba(0,0,0,.9)}
.mm-avatar{position:relative;flex:none;width:62px;height:62px;border-radius:14px;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(circle at 34% 26%,#fbf3df,#e2d6bc 70%,#cdbd9d);border:2px solid var(--ink,#1f1c24);
  box-shadow:0 8px 20px -10px rgba(0,0,0,.9),inset 0 -8px 16px -10px rgba(0,0,0,.3)}
.mm-avatar img{width:96%;height:96%;object-fit:contain;padding:3px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transition:transform .3s cubic-bezier(.2,1.4,.3,1)}
.mm-avatar:hover img{transform:scale(1.07) rotate(-3deg)}
.mm-avatar i{display:block;width:70%;height:70%;border-radius:48% 52% 45% 55%/55% 45% 55% 45%;background:var(--c,#e2543a);border:2px solid rgba(0,0,0,.35)}
.mm-idbox{flex:1;min-width:0}
.mm-idbox .field{margin:0}
.mm-namefield .lbl,.mm-lbl{display:block;font:600 9.5px var(--mm-ui);letter-spacing:.26em;text-transform:uppercase;color:rgba(236,230,216,.42);margin-bottom:6px}
.mm-who input.txt{width:100%;padding:7px 10px;font:600 17px var(--mm-disp);letter-spacing:.01em;color:var(--mm-text);
  background:transparent;border:0;border-bottom:1.5px dashed rgba(236,230,216,.22);border-radius:0}
.mm-who input.txt:focus{outline:none;border-bottom-color:var(--mm-accent);box-shadow:none;background:rgba(255,255,255,.03)}
.mm-who input.txt::selection{background:rgba(226,84,58,.45)}

/* character picker */
.mm-picker{display:flex;flex-direction:column;gap:8px}
.mm-picker-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.mm-count{font:500 10px var(--mm-ui);letter-spacing:.16em;text-transform:uppercase;color:rgba(236,230,216,.34)}
.mm-picker .field{margin:0}
.mm-picker .swatches{display:flex;gap:8px;flex-wrap:wrap}
#ui .screen .mm-picker .sw.char{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.045);
  transition:transform .18s cubic-bezier(.2,1.5,.3,1),border-color .18s,background .18s}
#ui .screen .mm-picker .sw.char:hover{transform:translateY(-3px) rotate(-2deg);border-color:var(--mm-line-2)}
#ui .screen .mm-picker .sw.on{outline:2px solid var(--mm-accent);outline-offset:3px;background:rgba(226,84,58,.12)}
#ui .screen .mm-picker .sw:not(.char){width:40px;height:40px}

/* actions */
.mm-btns{display:flex;flex-direction:column;gap:9px}
.mm-row2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
#ui .screen .mm-row2 .btn{min-height:46px}
#ui .screen .btn.mm-play{position:relative;display:flex;align-items:center;gap:14px;text-align:left;min-height:72px;
  padding:0 18px;border:0;border-radius:14px;overflow:hidden;background:#ece6d8;color:#15121a;
  box-shadow:0 18px 40px -20px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.5) inset;
  transition:transform .18s cubic-bezier(.2,1.5,.3,1),box-shadow .18s,background .18s}
#ui .screen .btn.mm-play::before{display:none}
#ui .screen .btn.mm-play::after{content:'';position:absolute;inset:0;z-index:0;border-radius:inherit;opacity:0;transition:opacity .2s;
  background:radial-gradient(120% 160% at 0% 50%,rgba(226,84,58,.22),transparent 60%)}
#ui .screen .btn.mm-play:hover{background:#fffdf6;transform:translateY(-2px);box-shadow:0 24px 48px -20px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.7) inset}
#ui .screen .btn.mm-play:hover::after{opacity:1}
#ui .screen .btn.mm-play:active{transform:translateY(0) scale(.995)}
.mm-play-ico{position:relative;z-index:1;flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:12px;
  background:#15121a;color:#ece6d8}
.mm-play-ico svg{width:19px;height:19px;fill:currentColor;stroke:none}
.mm-play-txt{position:relative;z-index:1;display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.mm-play-txt b{font:800 18px var(--mm-disp);letter-spacing:-.01em}
.mm-play-txt small{font:500 11.5px var(--mm-ui);letter-spacing:.02em;color:rgba(21,18,26,.6)}
.mm-play-key{position:relative;z-index:1;flex:none;font:600 9.5px var(--mm-ui);letter-spacing:.18em;text-transform:uppercase;
  color:rgba(21,18,26,.42);border:1px solid rgba(21,18,26,.2);border-radius:6px;padding:4px 7px}
#ui .screen .btn.mm-ghost{display:flex;align-items:center;justify-content:center;gap:9px;min-height:46px;border-radius:12px;
  border:1px solid var(--mm-line);background:rgba(255,255,255,.03);color:rgba(236,230,216,.82);font:600 11px var(--mm-ui);
  letter-spacing:.16em;text-transform:uppercase;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .16s,border-color .16s,color .16s}
#ui .screen .btn.mm-ghost:hover{background:rgba(255,255,255,.08);border-color:var(--mm-line-2);color:#fff}
.mm-i{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;overflow:visible}

/* footer chips */
.mm-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;row-gap:6px}
#ui .screen .mm-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;
  border:1px solid var(--mm-line);background:rgba(255,255,255,.03);color:rgba(236,230,216,.6);
  font:600 10px var(--mm-ui);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:color .15s,border-color .15s,background .15s}
#ui .screen .mm-chip:hover{color:#fff;border-color:var(--mm-line-2);background:rgba(255,255,255,.07)}
#ui .screen .mm-chip .ico{width:14px;height:14px}
#ui .screen .mm-chip .dot{width:7px;height:7px}
.mm-snd-ico{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.mm-snd[aria-pressed="false"]{color:#e2543a;border-color:rgba(226,84,58,.45)}
.mm-ver{flex:1 0 100%;font:600 8.5px var(--mm-ui);letter-spacing:.22em;text-transform:uppercase;color:rgba(236,230,216,.2)}

/* --- the right-hand rail --- */
.mm-rail{position:relative;z-index:3;width:min(352px,32vw);float:right;display:flex;flex-direction:column;gap:12px;
  margin:2px 0 14px 18px;animation:mmRise .8s .3s cubic-bezier(.16,1,.3,1) both}
.mm-left::after,.mm-scroll::after{content:'';display:block;clear:both}
.mm-rail-h{font:600 9.5px var(--mm-ui);letter-spacing:.28em;text-transform:uppercase;color:rgba(236,230,216,.38);margin-bottom:9px}
.mm-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
#ui .screen .mm-mode{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:5px;text-align:left;
  padding:13px 13px 12px;border-radius:13px;border:1px solid var(--mm-line);background:rgba(18,16,22,.5);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);cursor:pointer;
  transition:transform .18s cubic-bezier(.2,1.4,.3,1),border-color .18s,background .18s;animation:mmRise .6s calc(.36s + var(--i)*.06s) both}
#ui .screen .mm-mode:hover{transform:translateY(-3px);border-color:rgba(226,84,58,.55);background:rgba(36,28,34,.72)}
#ui .screen .mm-mode .mm-i{width:20px;height:20px;color:var(--mm-accent);stroke-width:1.7}
#ui .screen .mm-mode b{font:700 14.5px var(--mm-disp);color:var(--mm-text);letter-spacing:-.01em}
#ui .screen .mm-mode span{font:400 11px/1.4 var(--mm-ui);color:rgba(236,230,216,.52)}
#title.has-art #mmModes .mm-rail-h{color:rgba(236,230,216,.5)}

/* last match strip */
.mm-last{padding:13px 14px;border-radius:13px;border:1px solid var(--mm-line);background:rgba(18,16,22,.55);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;flex-direction:column;gap:9px}
.mm-last-head{display:flex;align-items:center;gap:8px;font:600 9.5px var(--mm-ui);letter-spacing:.2em;text-transform:uppercase;color:rgba(236,230,216,.45)}
.mm-last-head .mm-i{width:14px;height:14px;color:var(--mm-gold)}
.mm-last-head b{color:var(--mm-text);letter-spacing:.14em}
.mm-last-head span{margin-left:auto;letter-spacing:.08em;text-transform:none;color:rgba(236,230,216,.32)}
.mm-last-body>div:first-child{display:flex;flex-wrap:wrap;gap:6px}
.mm-k{font:500 10px var(--mm-ui);letter-spacing:.1em;text-transform:uppercase;color:rgba(236,230,216,.55);
  border:1px solid var(--mm-line);border-radius:6px;padding:3px 7px}
.mm-last-stats{display:flex;gap:14px;margin-top:8px}
.mm-last-stats span{font:400 10.5px var(--mm-ui);letter-spacing:.06em;color:rgba(236,230,216,.45)}
.mm-last-stats b{font:700 15px var(--mm-disp);color:var(--mm-text);margin-right:3px}
#ui .screen .mm-again{display:flex;align-items:center;justify-content:center;gap:8px;min-height:38px;border-radius:9px;
  border:1px solid rgba(201,162,90,.5);background:rgba(201,162,90,.13);color:#ecd9ae;
  font:600 10.5px var(--mm-ui);letter-spacing:.16em;text-transform:uppercase;cursor:pointer;transition:background .16s}
#ui .screen .mm-again:hover{background:rgba(201,162,90,.25)}
#ui .screen .mm-again .mm-i{width:13px;height:13px;fill:currentColor;stroke:none}

/* event teaser */
.mm-event{position:relative;display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;overflow:hidden;cursor:pointer;
  border:1px solid rgba(255,138,42,.4);background:linear-gradient(120deg,rgba(46,20,52,.85),rgba(24,14,30,.72));
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:border-color .18s,transform .18s}
.mm-event:hover{border-color:rgba(255,138,42,.8);transform:translateY(-2px)}
.mm-ev-art{position:relative;flex:none;width:64px;height:64px;border-radius:11px;overflow:hidden;background-size:cover;background-position:center;
  background-color:#2a1838;display:grid;place-items:center}
.mm-ev-art::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,8,26,0),rgba(20,8,26,.55))}
.mm-ev-icon{position:relative;z-index:1;font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}
.mm-ev-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.mm-ev-kicker{font:700 8.5px var(--mm-ui);letter-spacing:.3em;text-transform:uppercase;color:#ffb377}
.mm-ev-txt b{font:800 15px var(--mm-disp);color:#fff2e2;letter-spacing:-.01em}
.mm-ev-txt span{font:400 10.5px/1.35 var(--mm-ui);color:rgba(255,226,194,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ui .screen .mm-ev-go{flex:none;border:1px solid rgba(255,138,42,.6);background:rgba(255,138,42,.16);color:#ffcf9b;
  font:700 9.5px var(--mm-ui);letter-spacing:.16em;text-transform:uppercase;border-radius:8px;padding:8px 11px;cursor:pointer;transition:background .16s}
#ui .screen .mm-ev-go:hover{background:rgba(255,138,42,.32)}

/* rotating spotlight: a weapon from the arsenal, drawn on paper */
.mm-show{position:relative;display:flex;align-items:center;gap:13px;padding:12px 13px;border-radius:14px;cursor:pointer;
  border:1px solid var(--mm-line);background:rgba(18,16,22,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  transition:border-color .18s,transform .18s;overflow:hidden}
.mm-show:hover{border-color:var(--mm-line-2);transform:translateY(-2px)}
.mm-show-art{flex:none;width:70px;height:70px;border-radius:11px;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(circle at 36% 26%,#fbf3df,#ded1b6 72%,#c9b795);border:1.5px solid #1f1c24;
  box-shadow:0 8px 18px -10px rgba(0,0,0,.9)}
.mm-show-art img{max-width:92%;max-height:88%;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.28));transition:transform .35s cubic-bezier(.2,1.4,.3,1)}
.mm-show:hover .mm-show-art img{transform:scale(1.07) rotate(-3deg)}
.mm-show-art .ph{font:800 26px var(--mm-disp);color:#1f1c24;opacity:.35;text-transform:uppercase}
.mm-show-txt{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.mm-show-k{font:700 8.5px var(--mm-ui);letter-spacing:.26em;line-height:1.6;text-transform:uppercase;color:rgba(236,230,216,.35)}
.mm-show-n{font:800 15.5px var(--mm-disp);color:var(--mm-text);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mm-show-r{font:500 10px var(--mm-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--mm-accent)}
.mm-show-d{margin-top:4px;font:400 10.5px/1.35 var(--mm-ui);color:rgba(236,230,216,.45);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mm-show.swap .mm-show-art img,.mm-show.swap .mm-show-txt{animation:mmShowIn .45s cubic-bezier(.2,1.2,.3,1) both}
@keyframes mmShowIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* the quiet bottom line: honesty + build */
.mm-note{display:flex;align-items:center;gap:9px;padding:2px 2px 0;font:600 8.5px var(--mm-ui);letter-spacing:.22em;text-transform:uppercase;color:rgba(236,230,216,.28)}
.mm-note .mm-dot{width:5px;height:5px;border-radius:50%;background:#5fbf7a;box-shadow:0 0 8px rgba(95,191,122,.8);flex:none}
.mm-note .mm-ver{margin-left:auto;flex:none;color:rgba(236,230,216,.16);letter-spacing:.18em}

/* the page-turn tab */
.mm-flip{position:absolute;z-index:5;top:50%;right:0;transform:translateY(-50%);display:flex;align-items:center;gap:10px;padding:20px 11px;cursor:pointer;
  border:1px solid var(--mm-line);border-right:0;border-radius:14px 0 0 14px;background:rgba(19,16,22,.8);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  color:rgba(236,230,216,.55);font:600 10px var(--mm-ui);letter-spacing:.3em;text-transform:uppercase;writing-mode:vertical-rl;
  animation:mmFade .9s .7s both;transition:color .15s,border-color .15s,background .15s,padding .15s}
@keyframes mmFade{from{opacity:0}to{opacity:1}}
.mm-flip:hover{color:var(--mm-text);background:rgba(30,24,32,.92);border-color:var(--mm-line-2);padding-right:16px}
.mm-flip .ar{display:grid;place-items:center;color:var(--mm-accent)}
.mm-flip svg{width:14px;height:14px}.mm-flip svg *{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.mm-flip.back{right:auto;left:0;border-right:1px solid var(--mm-line);border-left:0;border-radius:0 14px 14px 0}
.mm-flip.back:hover{padding-right:11px;padding-left:16px}
#event .mm-flip.back{left:auto;right:0;border-left:1px solid var(--mm-line);border-right:0;border-radius:14px 0 0 14px}
/* event page keeps the same bones */
#event .mm-wash{background:linear-gradient(96deg,rgba(14,8,18,.92) 0%,rgba(14,8,18,.82) 26%,rgba(14,8,18,.45) 48%,rgba(14,8,18,.06) 70%,transparent 90%),linear-gradient(0deg,rgba(26,10,34,.65),rgba(0,0,0,0) 36%)}
#event .mm-panel{max-width:452px}
#event .mm-title img,#event .mm-logo-img{max-height:min(24vh,200px)}
#event .mm-tag{color:rgba(255,226,194,.72)}
#evCanvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
#event .mm-left{z-index:2}
.ev-badge{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;padding:6px 13px;border:1px solid rgba(255,138,42,.5);border-radius:999px;
  background:rgba(255,138,42,.12);color:#ffb377;font:600 10px var(--mm-ui);letter-spacing:.24em;text-transform:uppercase;
  animation:mmRise .6s .08s both;margin-bottom:2px}
#ui .screen .ev-panel .btn.mm-play{background:var(--ev-accent,#ff8a2a);color:#1c1014}
#ui .screen .ev-panel .btn.mm-play:hover{background:#ffa14f}
.ev-info{display:flex;flex-wrap:wrap;gap:6px 14px;color:rgba(236,230,216,.5);font:400 11.5px var(--mm-ui);letter-spacing:.03em}
.ev-info b{font:700 13px var(--mm-disp);color:var(--mm-text);margin-right:4px}
.ev-season{margin:2px 0 0;font:400 11.5px/1.5 var(--mm-ui);color:rgba(255,226,194,.5)}
.ev-season.off{color:rgba(255,226,194,.72)}

@media (min-width:1600px){
  .mm-left{width:520px}
  .mm-logo-img{max-height:min(26vh,220px)}
  .mm-rail{width:390px}
  .mm-tag{font-size:14px}
  .mm-scroll{padding-top:calc(38px + var(--safe-t))}
}

/* --- How to play card --- */
.howto-wrap{width:100%;display:flex;justify-content:center}
.howto-card{max-width:780px}
.howto-card h2{font-size:32px;margin-bottom:2px}
.howto-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;margin:14px 0 20px}
.howto-sec h3{display:flex;align-items:center;gap:9px;margin:0 0 8px;font:800 15px var(--mm-disp);color:var(--ink);letter-spacing:-.005em}
.howto-sec h3 .mm-i{width:17px;height:17px;color:var(--accent);stroke-width:1.9}
.howto-sec ul{margin:0;padding-left:16px;display:flex;flex-direction:column;gap:6px}
.howto-sec li{font:400 13px/1.5 var(--mm-ui);color:var(--ink-soft)}
.howto-sec li b{color:var(--ink);font-weight:700}
.howto-sec kbd{display:inline-block;min-width:19px;padding:1px 5px;margin:0 1px;border:1.5px solid var(--ink);border-bottom-width:2.5px;border-radius:5px;
  background:var(--paper-2);font:700 10.5px/1.5 var(--mm-ui);color:var(--ink);text-align:center}
.howto-foot{border-top:1.5px dashed rgba(31,28,36,.18);padding-top:14px}

/* --- responsive --- */
@media (max-width:1080px){
  /* over the open art, the small type needs a little more ink */
  .mm-tag{color:rgba(236,230,216,.8);text-shadow:0 1px 8px rgba(0,0,0,.7)}
  .mm-overline,.mm-rail-h{color:rgba(236,230,216,.72);text-shadow:0 1px 6px rgba(0,0,0,.6)}
  .mm-count{color:rgba(236,230,216,.62)}
  .mm-lbl{color:rgba(236,230,216,.66);text-shadow:0 1px 6px rgba(0,0,0,.6)}
  .mm-note{color:rgba(236,230,216,.55)}
  /* one column: the brand and the actions come first, the showcase follows */
  .mm-scroll{display:flex;flex-direction:column;padding-bottom:calc(84px + var(--safe-b))}
  .mm-left{float:none;width:100%;max-width:none;order:1}
  .mm-rail{float:none;width:auto;order:2;display:grid;grid-template-columns:1fr 1fr;align-items:start;gap:10px;margin:20px 0 0}
  .mm-modes{grid-column:1/-1}
  .mm-mode-grid{grid-template-columns:repeat(4,1fr)}
  .mm-logo-img{max-height:18vh}
  .mm-flip{top:auto;bottom:calc(14px + var(--safe-b));right:calc(12px + var(--safe-r));transform:none;
    writing-mode:horizontal-tb;border:1px solid var(--mm-line);border-radius:999px;padding:11px 16px;font-size:9.5px;gap:8px}
  .mm-flip:hover{transform:none;padding-right:16px}
  #event .mm-flip.back{right:calc(12px + var(--safe-r));left:auto;bottom:calc(14px + var(--safe-b))}
  .mm-flip.back{border-radius:999px;border:1px solid var(--mm-line)}
}
@media (max-width:640px){
  .mm-scroll{padding-left:calc(16px + var(--safe-l));padding-right:calc(16px + var(--safe-r));padding-top:calc(18px + var(--safe-t))}
  .mm-left,.mm-rail{width:100%}
  .mm-rail{grid-template-columns:1fr}
  .mm-mode-grid{grid-template-columns:1fr 1fr}
  .mm-overline{font-size:8.5px;letter-spacing:.26em}
  .mm-tag{font-size:12px}
  .mm-avatar{width:52px;height:52px}
  .mm-play-txt b{font-size:16.5px}
  #ui .screen .btn.mm-play{min-height:64px}
  #ui .screen .mm-picker .sw.char{width:44px;height:44px}
  .howto-grid{grid-template-columns:1fr}
  .mm-title{margin:6px 0 2px}
  .mm-logo-img{max-height:15vh}
}
@media (max-height:620px) and (min-width:1081px){
  .mm-panel{gap:10px}
  .mm-logo-img{max-height:15vh}
  #ui .screen .btn.mm-play{min-height:60px}
  .mm-avatar{width:52px;height:52px}
  .mm-mode span{display:none}
}

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
/* the one paper card left: how to play, drawn in ink on paper like the field notes it is */
#howto{background:radial-gradient(120% 90% at 50% 34%,#f3ecdc 0%,#e8deca 52%,#cdbfa3 100%)}
#ui .screen#howto .card{background:var(--paper);border:2.5px solid var(--ink);border-radius:var(--r-wob,18px);
  box-shadow:5px 6px 0 rgba(31,28,36,.85);backdrop-filter:none;-webkit-backdrop-filter:none;padding:26px 30px 22px}
#ui .screen#howto .card .sub{color:var(--ink-soft)}
#ui .screen#howto .card h2{color:var(--ink)}
/* small screens: the card sits at the top and scrolls, nothing gets cut off */
@media (max-width:900px),(max-height:640px){
  #howto{padding:14px;align-items:flex-start}
  #howto .howto-wrap{margin:auto 0;width:100%}
  #ui .screen#howto .card{max-height:calc(100dvh - 28px);padding:20px 20px 16px}
  #ui .screen#howto .card h2{font-size:26px}
  .howto-grid{gap:14px 20px;margin:10px 0 14px}
  .howto-sec li{font-size:12.5px}
}
@media (max-width:640px){
  #ui .screen#howto .card{padding:16px}
  .howto-sec h3{font-size:14px}
  .howto-foot{position:sticky;bottom:-16px;background:var(--paper);padding-bottom:4px;flex-wrap:nowrap;gap:8px}
  .howto-foot .btn{flex:1 1 0;min-width:0;min-height:42px;font-size:10.5px;padding:10px 8px;letter-spacing:.1em}
}
#ui .screen#howto .btn.ghost{color:var(--ink);border-color:rgba(31,28,36,.22)}
#ui .screen#howto .btn.ghost:hover{color:var(--accent);border-color:var(--accent);background:rgba(217,87,59,.08)}
#ui .screen#howto .btn.primary{background:var(--ink);color:var(--paper);border:2px solid var(--ink);box-shadow:3px 4px 0 rgba(31,28,36,.35)}
#ui .screen#howto .btn.primary:hover{background:var(--accent);border-color:var(--accent);color:#fff}
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
/* =====================================================================
   THE MAIN MENU
   A layered, hand-drawn landing page: parallax paper backdrop, the painted
   logo, a quick-play card, a stacked action list, a showcase of the world
   and the seasonal event, and a look-back-at-your-last-match strip.
   Every asset is optional: the page falls back to drawn type and a paper
   gradient when mainmenu/*.png is missing.
   ===================================================================== */
const MM_STORE = {
  get(k, d) { try { const v = localStorage.getItem('ib_mm_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ib_mm_' + k, JSON.stringify(v)); } catch (e) { } },
};
const MM_MODES = [
  { id: 'arena', n: 'Arena', d: 'Tight, destructible arenas. Last scribble standing.', icon: 'cross' },
  { id: 'inkhold', n: 'Inkhold', d: 'Hold the glowing ring to score. First to target wins.', icon: 'blob' },
  { id: 'wilds', n: 'Big Wilds', d: 'A huge map, bot crowds, the Tool Box and teams.', icon: 'peaks' },
  { id: 'war', n: 'War', d: 'Teams, a build phase with the kit, shared lives.', icon: 'build' },
];
const MM_ICONS = {
  cross: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="7.6"/>',
  blob: '<path d="M12 3.4c3.4 0 3.7 3.9 6.1 4.7 2.4.8 3.1 4.1 1 5.9-2.1 1.8-.7 5.2-3.6 5.8-2.9.6-3.9 2.4-6 1.2-2.1-1.2-1-3.8-3.2-4.7"/><circle cx="12" cy="13" r="3.4"/>',
  peaks: '<path d="M2.6 19.4l5.6-9.2 4 6.4 2.2-3.6 6 6.4z"/><circle cx="17.4" cy="6.4" r="2.4"/>',
  build: '<path d="M4 20V9.6l8-4.4 8 4.4V20z"/><path d="M9.4 20v-5.6h5.2V20"/><path d="M4 20h16"/>',
  skull: '<path d="M5.4 15.6c-1.4-1.4-1.8-3.2-1.6-5.2C4.2 6 7.8 3.4 12 3.4s7.8 2.6 8.2 7c.2 2-.2 3.8-1.6 5.2v3.4c0 .8-.6 1.4-1.4 1.4H6.8c-.8 0-1.4-.6-1.4-1.4z"/><circle cx="9" cy="11.8" r="1.6" fill="currentColor" stroke="none"/><circle cx="15" cy="11.8" r="1.6" fill="currentColor" stroke="none"/>',
  crown: '<path d="M3.6 18.4L2.8 7.8l5.4 4.4L12 5.2l3.8 7 5.4-4.4-.8 10.6z"/><path d="M4 21h16"/>',
  book: '<path d="M3.6 5.2h6.2c1.2 0 2.2 1 2.2 2.2v12.2c0-1.2-1-2.2-2.2-2.2H3.6z"/><path d="M20.4 5.2h-6.2c-1.2 0-2.2 1-2.2 2.2v12.2c0-1.2 1-2.2 2.2-2.2h6.2z"/>',
  gun: '<path d="M3.4 9.6h13.2l3.4 3v3.4h-4l-1.6-2.4H9.6L8 19.4H4.4l1.4-5.4H3.4z"/><path d="M8.6 9.6V6.4h5.2"/>',
  star: '<path d="M12 3.4l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6L3.4 9.7l6-.9z"/>',
  play: '<path d="M7.2 4.6l12 7.4-12 7.4z"/>',
  sliders: '<path d="M4.6 7.2h14.8M4.6 12h14.8M4.6 16.8h14.8"/><circle cx="9" cy="7.2" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="8" cy="16.8" r="2.1"/>',
};
function mmIcon(k, cls = '') {
  const d = MM_ICONS[k] || MM_ICONS.cross;
  return `<svg class="mm-i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><g>${d}</g></svg>`;
}
const _mmReduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

const MainMenu = {
  page: 'title', flipping: false, built: false, evBuilt: false, raf: 0, amb: 0,
  build() {
    if (this.built) return; this.built = true; const home = $('#title'); if (!home) return;
    const tag = home.querySelector('.tagline');
    // keep the live widgets (they hold all the listeners from UI.init)
    const keep = {}; for (const id of ['bPractice', 'bSettings', 'chipWeapons', 'nameIn', 'swatches']) keep[id] = $('#' + id);
    home.classList.add('home');
    const tmp = document.createElement('div');
    for (const n of Object.values(keep)) if (n) tmp.append(n);
    home.innerHTML = '';
    const taglineText = tag ? tag.textContent.trim() : '';

    /* --- stage: paper wash, art, grain, drifting ink motes --- */
    const stage = document.createElement('div'); stage.className = 'mm-stage';
    const bg = document.createElement('div'); bg.className = 'mm-bg fallback';
    const sky = document.createElement('div'); sky.className = 'mm-sky';
    const wash = document.createElement('div'); wash.className = 'mm-wash';
    const grain = document.createElement('div'); grain.className = 'mm-grain';
    const motes = document.createElement('canvas'); motes.className = 'mm-motes'; motes.id = 'mmMotes';
    stage.append(bg, sky, wash, motes, grain);
    home.append(stage);
    mmImage(MMENU + 'bg.png').then(i => { if (i) { bg.classList.remove('fallback'); bg.style.backgroundImage = `url("${i.src}")`; home.classList.add('has-art'); } });

    /* --- the scroll column: the rail is appended first because it floats --- */
    const scroll = document.createElement('div'); scroll.className = 'mm-scroll';
    const left = document.createElement('div'); left.className = 'mm-left';
    const panel = document.createElement('div'); panel.className = 'mm-panel'; left.append(panel);
    home.append(scroll);

    /* brand */
    const brand = document.createElement('div'); brand.className = 'mm-brand';
    brand.innerHTML = `<div class="mm-overline"><span class="mm-rule"></span>Offline ink-slinging brawler</div>
      <div class="mm-title" id="mmTitle"></div>
      <p class="mm-tag">${esc(taglineText || 'one random weapon each round · last scribble standing')}</p>`;
    panel.append(brand);
    const tt = brand.querySelector('#mmTitle');
    mmImage(MMENU + 'maintitle.png').then(i => {
      if (i) { i.alt = 'Inkbrawl'; i.className = 'mm-logo-img'; tt.append(i); }
      else tt.innerHTML = `<h1 class="mm-word">Ink<span class="o">brawl</span></h1>`;
    });

    /* quick look: character + name, side by side so it reads as "you" */
    const who = document.createElement('div'); who.className = 'mm-who mm-rise r2'; panel.append(who);
    const av = document.createElement('div'); av.className = 'mm-avatar'; av.id = 'mmAvatar';
    const idBox = document.createElement('div'); idBox.className = 'mm-idbox';
    if (keep.nameIn) { const f = keep.nameIn.closest('.field') || keep.nameIn; f.classList.add('mm-namefield'); idBox.append(f); }
    who.append(av, idBox);

    const swWrap = document.createElement('div'); swWrap.className = 'mm-picker mm-rise r3'; panel.append(swWrap);
    let swLabel = null;
    if (keep.swatches) {
      const f = keep.swatches.closest('.field') || keep.swatches;
      swLabel = f.querySelector('.lbl');
      const row = document.createElement('div'); row.className = 'mm-picker-head';
      const lbl = document.createElement('span'); lbl.className = 'mm-lbl'; lbl.textContent = (swLabel && swLabel.textContent) || 'Your character';
      const cnt = document.createElement('span'); cnt.className = 'mm-count'; cnt.id = 'mmCharCount';
      row.append(lbl, cnt); swWrap.append(row, f);
      if (swLabel) swLabel.remove();
    }

    /* primary actions */
    const btns = document.createElement('div'); btns.className = 'mm-btns mm-rise r4'; panel.append(btns);
    const bP = keep.bPractice, bS = keep.bSettings;
    if (bP) {
      bP.className = 'btn primary mm-play';
      bP.innerHTML = `<span class="mm-play-ico">${mmIcon('play')}</span><span class="mm-play-txt"><b>Play</b><small>set up a match vs bots</small></span><span class="mm-play-key">Enter</span>`;
      btns.append(bP);
    }
    const row2 = document.createElement('div'); row2.className = 'mm-row2'; btns.append(row2);
    const howBtn = document.createElement('button'); howBtn.className = 'btn mm-ghost'; howBtn.id = 'mmHowTo';
    howBtn.innerHTML = `${mmIcon('book')}How to play`;
    row2.append(howBtn);
    if (bS) { bS.className = 'btn mm-ghost'; bS.innerHTML = `${mmIcon('sliders')}Settings`; row2.append(bS); }

    /* footer: the content badges + a quiet sound toggle */
    const foot = document.createElement('div'); foot.className = 'mm-foot'; panel.append(foot);
    if (keep.chipWeapons) { keep.chipWeapons.className = 'chip mm-chip'; foot.append(keep.chipWeapons); }
    const snd = document.createElement('button'); snd.className = 'chip mm-chip mm-snd'; snd.id = 'mmSound'; snd.type = 'button';
    foot.append(snd);
    const syncSound = () => {
      const on = Settings.volume > 0.001;
      snd.setAttribute('aria-pressed', String(on));
      const wave = on ? '<path d="M15.4 9.2a4 4 0 0 1 0 5.6"/><path d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4"/>' : '<path d="M15.6 9.6l4.8 4.8M20.4 9.6l-4.8 4.8"/>';
      snd.innerHTML = `<svg class="mm-snd-ico" viewBox="0 0 24 24" aria-hidden="true"><g><path d="M4.4 9.4h3.4l4.2-3.6v12.4l-4.2-3.6H4.4z"/>${wave}</g></svg><span>${on ? 'Sound on' : 'Muted'}</span>`;
    };
    syncSound();
    this._syncSound = syncSound;
    snd.addEventListener('click', () => {
      Audio2.init();
      Settings.volume = Settings.volume > 0.001 ? 0 : .65;
      if (typeof saveSettings === 'function') saveSettings();
      if (Audio2.master) Audio2.master.gain.value = .85 * Settings.volume;
      const vs = $('#volumeSetting'); if (vs) vs.value = Math.round(Settings.volume * 100);
      syncSound(); if (Settings.volume > 0) Audio2.play('ui');
    });
    const note = document.createElement('div'); note.className = 'mm-note';
    note.innerHTML = `<span class="mm-dot"></span><span>Offline · nothing leaves this device</span><span class="mm-ver">build v8</span>`;
    panel.append(note);

    /* --- the right-hand showcase column --- */
    const rail = document.createElement('div'); rail.className = 'mm-rail'; scroll.append(rail);
    const modes = document.createElement('div'); modes.className = 'mm-modes'; modes.id = 'mmModes'; rail.append(modes);
    modes.innerHTML = `<div class="mm-rail-h">Pick a mode</div><div class="mm-mode-grid">` + MM_MODES.map((m, i) =>
      `<button class="mm-mode" data-mm-mode="${m.id}" style="--i:${i}">${mmIcon(m.icon)}<b>${m.n}</b><span>${m.d}</span></button>`).join('') + `</div>`;
    modes.addEventListener('click', e => {
      const b = e.target.closest('[data-mm-mode]'); if (!b) return;
      Audio2.init(); Audio2.play('ui'); this.quickStart(b.dataset.mmMode);
    });
    const last = document.createElement('div'); last.className = 'mm-last hidden'; last.id = 'mmLast'; rail.append(last);
    const event = document.createElement('div'); event.className = 'mm-event'; event.id = 'mmEventCard'; rail.append(event);
    const show = document.createElement('div'); show.className = 'mm-show'; show.id = 'mmShow'; show.setAttribute('role', 'button'); show.tabIndex = 0; rail.append(show);
    show.addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); UI.show('weapons'); });
    show.addEventListener('keydown', e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); UI.show('weapons'); } });

    scroll.append(left);

    /* page-turn tab to the event page */
    const flip = document.createElement('button'); flip.className = 'mm-flip'; flip.id = 'bEventPage';
    flip.innerHTML = `<span class="ar"><svg viewBox="0 0 24 24"><path d="M5 12h13"/><path d="M12.5 5.5 19 12l-6.5 6.5"/></svg></span><span class="lb"></span>`;
    flip.querySelector('.lb').textContent = this.evTabLabel();
    home.append(flip);
    flip.addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); this.flip('event'); });

    /* the avatar mirrors the chosen character */
    this.who = who; this.avatarEl = av;
    this.renderAvatar();
    this.renderLast();
    this.renderEventCard();
    this.renderShowcase();

    /* How to play */
    howBtn.addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); HowTo.open(); });

    /* keyboard niceties: Enter starts a match, H opens help */
    document.addEventListener('keydown', e => {
      if (G.mode === 'play') return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const onTitle = UI.cur === 'title' || UI.cur === 'event';
      if (!onTitle) { if (e.code === 'Escape' && UI.cur === 'howto') { e.preventDefault(); MainMenu.backFrom('howto'); } return; }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); Audio2.init(); Audio2.play('ui'); Setup.open({ set: UI.cur === 'event' ? 'event' : 'main', from: UI.cur }); }
      else if (e.code === 'KeyH') { e.preventDefault(); Audio2.init(); HowTo.open(); }
    });
    this.ambient();
  },

  ensure() { if (!this.built) this.build(); },
  /* the hero avatar: the chosen character on a wobbling ink blot */
  renderAvatar() {
    const el = this.avatarEl; if (!el) return;
    const ch = UI.char && Chars.byId[UI.char];
    const img = ch && ch.sprite ? ch.sprite.toDataURL() : (ch && ch.img ? ch.img.src : null);
    el.innerHTML = img ? `<img src="${img}" alt="">` : `<i style="background:${esc(UI.color || '#e2543a')}"></i>`;
    el.style.setProperty('--c', ch ? ch.color : UI.color);
    el.classList.toggle('is-char', !!img);
    const cnt = $('#mmCharCount'); if (cnt) cnt.textContent = Chars.list.length ? `${Chars.list.length} fighters` : 'colour only';
  },
  /* "your last match" strip, remembered on this device */
  renderLast() {
    const el = $('#mmLast'); if (!el) return;
    const m = MM_STORE.get('last', null);
    if (!m || !m.at || Date.now() - m.at > 1000 * 60 * 60 * 24 * 14) { el.classList.add('hidden'); return; }
    const ago = (() => { const s = (Date.now() - m.at) / 1000; if (s < 90) return 'just now'; if (s < 5400) return Math.round(s / 60) + ' min ago'; if (s < 172800) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; })();
    const won = m.win;
    el.classList.remove('hidden');
    el.innerHTML = `<div class="mm-last-head">${mmIcon(won ? 'crown' : 'skull')}<b>${won ? 'Last match: won' : 'Last match'}</b><span>${esc(ago)}</span></div>
      <div class="mm-last-body"><div><span class="mm-k">${esc(m.mode || 'Arena')}</span><span class="mm-k">${esc(m.biome || 'somewhere')}</span><span class="mm-k">${m.rounds || 0} rounds</span></div>
      <div class="mm-last-stats"><span><b>${m.kills || 0}</b> splats</span><span><b>${m.wins || 0}</b> wins</span><span><b>${m.bots || 0}</b> bots</span></div></div>
      <button class="mm-again" id="mmAgain">${mmIcon('play')}Run it again</button>`;
    const again = $('#mmAgain');
    if (again) again.addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); this.quickStart(m.modeId || 'arena', m); });
  },
  /* the seasonal-event teaser in the rail */
  renderEventCard() {
    const el = $('#mmEventCard'); if (!el) return;
    const E = EventInfo;
    el.innerHTML = `<div class="mm-ev-art" id="mmEvArt"><span class="mm-ev-icon">${E.icon || '🎃'}</span></div>
      <div class="mm-ev-txt"><div class="mm-ev-kicker">${esc(this.evKicker())}</div><b>${esc(E.name)}</b><span>${esc(E.tagline || '')}</span></div>
      <button class="mm-ev-go" id="mmEvGo">Open</button>`;
    const go = () => { Audio2.init(); Audio2.play('ui'); this.flip('event'); };
    $('#mmEvGo').addEventListener('click', go);
    el.addEventListener('click', e => { if (!e.target.closest('#mmEvGo')) go(); });
    mmImage(MMENU + 'event/' + (E.bg || 'bg.png')).then(i => { const a = $('#mmEvArt'); if (i && a) a.style.backgroundImage = `url("${i.src}")`; });
  },

  /* quick start straight from the mode cards (uses the remembered setup) */
  quickStart(modeId, remembered) {
    let s;
    try { s = Setup.load(); } catch (e) { s = Setup.defaults(); }
    let pick = modeId;
    if (remembered) {
      pick = remembered.modeId || 'arena';
      s.biome = (remembered.biomeIdx >= 0 && THEMES[remembered.biomeIdx]) ? remembered.biomeIdx : -1;
      if (remembered.bots) s.bots = remembered.bots;
      if (remembered.target) s.target = remembered.target;
      s.set = remembered.set === 'event' ? 'event' : 'main';
    }
    if (!SETUP_MODES.some(x => x.id === pick)) pick = 'arena';
    s.mode = pick;
    Setup.ensure();
    Setup.s = Object.assign(s, { from: 'title' });
    Setup.syncModeId();
    Setup.tab = 0; Setup.save(); Setup.render();
    if (remembered) Setup.start();       // "run it again" drops straight into the match
    else UI.show('setup');               // a mode card opens the board, mode pre-picked
  },
  buildEvent() {
    if (this.evBuilt) return; this.evBuilt = true; const E = EventInfo;
    const s = document.createElement('section'); s.className = 'screen hidden home'; s.id = 'event'; $('#ui').insertBefore(s, $('#hud'));
    s.style.setProperty('--ev-accent', E.accent || '#ff8a2a'); s.style.setProperty('--ev-accent2', E.accent2 || '#8d4bd6');
    const bg = document.createElement('div'); bg.className = 'mm-bg fallback'; bg.style.background = `radial-gradient(120% 90% at 65% 30%,#4a2f5e 0%,#2a1838 55%,#140b1c 100%)`;
    const cv = document.createElement('canvas'); cv.id = 'evCanvas';
    const wash = document.createElement('div'); wash.className = 'mm-wash';
    s.append(bg, cv, wash, Object.assign(document.createElement('div'), { className: 'mm-grain' }));
    mmImage(MMENU + 'event/' + (E.bg || 'bg.png')).then(i => { if (i) { bg.classList.remove('fallback'); bg.style.background = ''; bg.style.backgroundImage = `url("${i.src}")`; bg.style.backgroundSize = 'cover'; bg.style.backgroundPosition = 'center'; } });
    const scroll = document.createElement('div'); scroll.className = 'mm-scroll';
    const left = document.createElement('div'); left.className = 'mm-left';
    const panel = document.createElement('div'); panel.className = 'mm-panel ev-panel';
    left.append(panel); scroll.append(left); s.append(scroll);
    panel.innerHTML = `<div class="ev-badge">${esc(E.icon || '\u{1F383}')} ${esc(E.name)} event</div><div class="mm-brand"><div class="mm-title" id="evTitle"></div>
      <p class="mm-tag">${esc(E.tagline || '')}</p></div>
      <div class="mm-btns mm-rise r2"><button class="btn primary mm-play" id="bEvPlay"><span class="mm-play-ico">${mmIcon('play')}</span><span class="mm-play-txt"><b>Play the event</b><small>${esc(E.name)} weapons + worlds</small></span><span class="mm-play-key">Enter</span></button>
        <div class="mm-row2"><button class="btn mm-ghost" id="bEvNormal">${mmIcon('cross')}Normal game</button></div></div>
      <div class="ev-info mm-rise r3" id="evInfo"></div>
      <p class="ev-season mm-rise r3" id="evSeason"></p>`;
    const tt = panel.querySelector('#evTitle');
    mmImage(MMENU + 'event/' + (E.title || 'maintitle.png')).then(i => { if (i) { i.alt = 'Inkbrawl ' + E.name; i.className = 'mm-logo-img'; tt.append(i); } else { tt.innerHTML = `<h1 class="mm-word">Ink<span class="o">brawl</span></h1>`; } });
    const back = document.createElement('button'); back.className = 'mm-flip back'; back.innerHTML = `<span class="ar"><svg viewBox="0 0 24 24"><path d="M19 12H6"/><path d="M11.5 5.5 5 12l6.5 6.5"/></svg></span><span class="lb">Main menu</span>`;
    s.append(back); back.addEventListener('click', () => { Audio2.play('ui'); this.flip('title'); });
    $('#bEvPlay').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); Setup.open({ set: 'event', from: 'event' }); });
    $('#bEvNormal').addEventListener('click', () => { Audio2.init(); Audio2.play('ui'); Setup.open({ set: 'main', from: 'event' }); });
    this.evInfo();
  },
  evInfo() {
    const season = $('#evSeason');
    if (season) {
      const live = EventInfo.isLive !== false;
      const months = Array.isArray(EventInfo.months) ? EventInfo.months : [];
      const name = (m) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] || '';
      season.textContent = live ? 'In season — the set is part of the menu right now.'
        : `Out of season — back in ${months.map(name).join(', ') || 'season'}. Everything below still works offline.`;
      season.classList.toggle('off', !live);
    }
    const el = $('#evInfo'); if (!el) return;
    const nw = Weapons.list.filter(w => w.set === 'event' || (Array.isArray(w.sets) && w.sets.includes('event') && !w.sets.includes('main'))).length;
    const nb = THEMES.filter(t => t.set === 'event').length;
    el.innerHTML = `<span><b>${nw}</b> event weapon${nw === 1 ? '' : 's'}</span><span><b>${nb}</b> event world${nb === 1 ? '' : 's'}</span><span>Normal content is untouched</span>`;
  },
  eventReady() {
    this.build(); this.buildEvent();
    const ev = $('#event'); if (ev) { ev.style.setProperty('--ev-accent', EventInfo.accent || '#ff8a2a'); ev.style.setProperty('--ev-accent2', EventInfo.accent2 || '#8d4bd6'); }
    const t = $('#title'); if (t) t.style.setProperty('--ev-accent', EventInfo.accent || '#ff8a2a');
    const f = $('#bEventPage .lb'); if (f) f.textContent = this.evTabLabel();
    this.evInfo(); this.renderEventCard(); this.renderLast(); this.renderAvatar();
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
  /* drifting ink motes + a slow light drift over the art (one canvas, dt based) */
  ambient() {
    const cv = $('#mmMotes'); if (!cv || _mmReduced) return; const x = cv.getContext('2d');
    const P = []; let last = performance.now();
    const step = n => {
      this.amb = 0; if (UI.cur !== 'title' && UI.cur !== 'event') return;
      const dt = Math.min(.05, (n - last) / 1000); last = n;
      const dpr = Math.min(2, devicePixelRatio || 1), W2 = cv.clientWidth, H2 = cv.clientHeight;
      if (cv.width !== Math.round(W2 * dpr) || cv.height !== Math.round(H2 * dpr)) { cv.width = Math.round(W2 * dpr); cv.height = Math.round(H2 * dpr); }
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W2, H2);
      const N = UI.cur === 'event' ? 34 : 26;
      while (P.length < N) P.push({ x: Math.random() * W2, y: Math.random() * H2, r: 10 + Math.random() * 26, sp: 3 + Math.random() * 9, ph: Math.random() * 6, a: .03 + Math.random() * .05 });
      for (const p of P) {
        p.y -= p.sp * dt; p.x += Math.sin(n / 2600 + p.ph) * 6 * dt;
        if (p.y < -40) { p.y = H2 + 30; p.x = Math.random() * W2; }
        const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,246,225,${p.a})`); g.addColorStop(1, 'rgba(255,246,225,0)');
        x.fillStyle = g; x.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      this.amb = requestAnimationFrame(step);
    };
    if (!this.amb) this.amb = requestAnimationFrame(step);
  },
  /* the vertical tab: a plain name on narrow screens, the season on wide ones */
  evTabLabel() {
    const wide = typeof innerWidth === 'number' && innerWidth >= 900;
    if (!wide) return 'Event';
    return EventInfo.isLive === false ? 'Off-season event' : EventInfo.name + ' event';
  },
  /* is the seasonal event actually happening right now? (adds "back next October") */
  evKicker() {
    const live = EventInfo.isLive ? !!EventInfo.isLive : true;
    return live ? 'Seasonal event' : 'Seasonal event · off-season';
  },
  /* a slow spotlight over the arsenal: one weapon at a time, drawn on paper */
  renderShowcase() {
    const el = $('#mmShow'); if (!el) return;
    const pool = (Weapons.list || []).filter(w => w.img && w.name);
    // the arsenal loads asynchronously: wait for it, then come back
    if (!pool.length) { el.classList.add('hidden'); el.dataset.waiting = '1'; return; }
    el.classList.remove('hidden'); delete el.dataset.waiting;
    const pick = () => {
      let w; let guard = 0;
      do { w = pool[Math.floor(Math.random() * pool.length)]; guard++; } while (guard < 12 && this._lastW === w);
      this._lastW = w;
      const dmg = w.type === 'melee' ? `${w.damage} dmg · ${w.reach}px reach` : `${w.damage} dmg · ${w.ammo || '\u221e'} shots`;
      el.innerHTML = `<div class="mm-show-art">${w.img ? `<img src="${esc(w.img.src)}" alt="">` : '<span class="ph">?</span>'}</div>
        <div class="mm-show-txt"><span class="mm-show-k">In the arsenal</span><span class="mm-show-n">${esc(w.name)}</span>
        <span class="mm-show-r">${esc(w.type)} · ${esc(w.rarity)} · ${esc(dmg)}</span>
        <span class="mm-show-d">${esc(w.description || 'One of the random weapons you might draw this round.')}</span></div>`;
      el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
      if (this._showT && !this._showT._tick) { /* noop */ }
    };
    pick();
    clearInterval(this._showT);
    this._showT = setInterval(() => { if (UI.cur === 'title' && !document.hidden) pick(); }, 7000);
  },
  /* where a sub-screen (weapons / settings / how to play) returns to */
  backFrom(id) {
    let from = this.page === 'event' ? 'event' : 'title';
    if (id === 'howto' && this.el && HowTo.el && HowTo.el._from) from = HowTo.el._from;
    UI.show(from);
  },
  /* event page canvas: fog, bats, embers and a moon (kept from the old page) */
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

/* ---------- How to play: one calm card, drawn from the real controls ---------- */
const HowTo = {
  el: null,
  ensure() {
    if (this.el) return this.el;
    const s = document.createElement('section'); s.className = 'screen hidden'; s.id = 'howto'; $('#ui').insertBefore(s, $('#hud'));
    const touch = Input.usingTouch;
    const key = (k) => `<kbd>${k}</kbd>`;
    s.innerHTML = `<div class="wrap howto-wrap">
      <div class="card howto-card">
        <div class="eyebrow" style="display:flex;align-items:center;gap:8px"><span class="mm-i" style="width:14px;height:14px;color:var(--accent)">${MM_ICONS.book}</span>Field notes</div>
        <h2>How to play</h2>
        <p class="sub">One random weapon each round. Splat the others. First to the target score takes the match.</p>
        <div class="howto-grid">
          <div class="howto-sec"><h3><span class="mm-i">${MM_ICONS.gun}</span>Move &amp; shoot</h3>
            <ul>${touch
              ? `<li><b>Move</b> — left thumb stick; flick it up to jump</li><li><b>Aim</b> — right thumb stick, release to fire</li><li><b>Jump</b> — the round button; tap twice for a double jump</li><li><b>Pause</b> — the chip in the top-left corner</li>`
              : `<li>${key('A')}${key('D')} or ${key('←')}${key('→')} — run</li><li>${key('Space')} — jump; again in the air for a double jump</li><li>${key('Mouse')} — aim, click to fire</li><li>${key('R')} reload · ${key('Tab')} scoreboard · ${key('Esc')} pause</li>`}</ul></div>
          <div class="howto-sec"><h3><span class="mm-i">${MM_ICONS.cross}</span>Rules of the brawl</h3>
            <ul><li><b>Rounds</b> — everyone is handed a new random weapon</li><li><b>Wins</b> — the last scribble standing takes the round</li><li><b>Score</b> — first to the target wins the match</li><li><b>Bots</b> — every player here is a bot on this device</li></ul></div>
          <div class="howto-sec"><h3><span class="mm-i">${MM_ICONS.peaks}</span>Modes</h3>
            <ul><li><b>Arena</b> — tight, destructible islands</li><li><b>Inkhold</b> — hold the glowing ring to score</li><li><b>Big Wilds</b> — a huge map and up to 100 bots</li><li><b>War</b> — teams, a build phase and shared lives</li></ul></div>
          <div class="howto-sec"><h3><span class="mm-i">${MM_ICONS.star}</span>Good to know</h3>
            <ul><li>Everything runs <b>offline</b> — nothing leaves this device</li><li><b>Add to Home Screen</b> to get a full-screen app that works with no network</li><li>Your fighter, rules and scores are remembered here</li></ul></div>
        </div>
        <div class="row howto-foot" style="justify-content:space-between">
          <button class="btn ghost" id="howtoClose"><svg class="ico"><use href="#i-back"/></svg>Back</button>
          <button class="btn primary" id="howtoPlay"><svg class="ico"><use href="#i-play"/></svg>Set up a match</button>
        </div>
      </div>
    </div>`;
    s.querySelector('#howtoClose').addEventListener('click', () => { Audio2.play('ui'); MainMenu.backFrom('howto'); });
    s.querySelector('#howtoPlay').addEventListener('click', () => { Audio2.play('ui'); Setup.open({ set: 'main', from: 'title' }); });
    this.el = s; return s;
  },
  open() { this.ensure(); this.el._from = MainMenu.page === 'event' ? 'event' : 'title'; UI.show('howto'); },
};

/* ---------- smooth screen changes (and the event page remembers itself) ---------- */
{
  const _show = UI.show.bind(UI);
  const MENU_SCREENS = new Set(['title', 'event', 'setup', 'weapons', 'settings', 'practice', 'howto']);
  UI.show = function (id, ...rest) {
    if (id === 'title' && MainMenu.page === 'event' && !MainMenu.flipping && G.mode !== 'play' && $('#event')) id = 'event';
    if (id === 'practice') { Setup.open({ set: MainMenu.page === 'event' ? 'event' : 'main', from: MainMenu.page }); return; }
    const prev = this.cur && $('#' + this.cur); const r = _show(id, ...rest);
    if (!this._noFade && prev && prev.id !== id && MENU_SCREENS.has(prev.id) && id && MENU_SCREENS.has(id)) {
      prev.classList.add('leaving'); clearTimeout(prev._lv); prev._lv = setTimeout(() => prev.classList.remove('leaving'), 270);
    }
    for (const s of document.querySelectorAll('.screen.leaving')) if (s.id === id) s.classList.remove('leaving');
    if (id === 'weapons' && UI.renderWeapons && !$('#wlist').children.length) UI.renderWeapons();
    if (id === 'event') { MainMenu.loop(); MainMenu.evInfo(); MainMenu.renderEventCard(); }
    if (id === 'title') { MainMenu.renderAvatar(); MainMenu.renderLast(); MainMenu.renderShowcase(); if (MainMenu._syncSound) MainMenu._syncSound(); MainMenu.ambient(); }
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
  /* modeId is the menu's durable mode (arena / inkhold / wilds / war); mode is the
     legacy value the setup screen renders from. Keep both in sync so a quick start
     and the setup screen always agree. */
  defaults() { return { set: 'main', mode: 'arena', modeId: 'arena', terrain: 'normal', biome: -1, bots: 3, max: 6, target: 5 }; },
  MODE_MAP: { arena: 'arena', inkhold: 'inkhold', wilds: 'wilds', war: 'war', expedition: 'wilds' },
  syncModeId() { if (this.s) this.s.modeId = this.MODE_MAP[this.s.mode] || 'arena'; },
  load() { try { return Object.assign(this.defaults(), JSON.parse(getCookie('ib_setup') || '{}')); } catch (e) { return this.defaults(); } },
  save() { this.syncModeId(); const { set, from, ...keep } = this.s; setCookie('ib_setup', JSON.stringify(keep)); },
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
    this.syncModeId();
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
    // hand the menu the shape of this match so it can show "last match" later
    MatchLog.begin({
      modeId: s.mode, mode: (SETUP_MODES.find(x => x.id === s.mode) || {}).n || 'Arena',
      biomeIdx: s.biome, set: s.set, bots: big ? s.bots : Math.min(7, s.bots), target: s.target,
    });
    startHost({ name, max: 8, target: s.target, bots: big ? s.bots : Math.min(7, s.bots), gameMode: s.mode === 'inkhold' ? 'inkhold' : (big ? 'expedition' : 'arena'), biome: s.biome, set: s.set, terrain: s.terrain });
  },
};

/* =====================================================================
   MATCH LOG — a tiny memory of how the last match went, shown on the
   title screen. Deliberately local-only (localStorage): no accounts, no
   network. Records the moment a match reaches its final round.
   ===================================================================== */
const MatchLog = {
  cur: null,
  begin(info) { this.cur = Object.assign({ at: Date.now(), rounds: 0, killed: 0, wins: 0 }, info); },
  /* called whenever the match reaches a champion / over phase */
  finish(winId) {
    if (!this.cur) return;
    const me = G.players.get(G.myId);
    const champ = winId != null && winId === G.myId;
    const rec = Object.assign({}, this.cur, {
      at: Date.now(), win: champ,
      rounds: G.round || this.cur.rounds,
      wins: me ? (me.score | 0) : 0,
      kills: me ? (me.kills | 0) : 0,
      biome: (T.theme && T.theme.name) || this.cur.biome || 'somewhere',
      mode: this.cur.mode || 'Arena',
    });
    MM_STORE.set('last', rec);
    this.cur = null;
    if (MainMenu.renderLast) MainMenu.renderLast();
  },
};
{
  const _phaseLog = UI.phase.bind(UI);
  UI.phase = function (e) {
    try {
      if (e && (e.ph === 'champion' || e.ph === 'over') && G.mode === 'play') {
        if (MatchLog.cur) { MatchLog.cur.rounds = G.round || 0; if (e.ph === 'champion') MatchLog.finish(e.win); }
      }
      if (e && e.ph === 'countdown' && MatchLog.cur) MatchLog.cur.rounds = G.round || 0;
    } catch (err) { }
    return _phaseLog(e);
  };
  // leaving mid-match still stores what happened so far
  const _leave = leaveGame;
  leaveGame = function () { try { if (MatchLog.cur) { const me = G.players.get(G.myId); MM_STORE.set('last', Object.assign({}, MatchLog.cur, { at: Date.now(), win: false, rounds: G.round || 0, wins: me ? (me.score | 0) : 0, kills: me ? (me.kills | 0) : 0, biome: (T.theme && T.theme.name) || 'somewhere', abandoned: true })); MatchLog.cur = null; } } catch (e) { } return _leave.apply(this, arguments); };
}

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
