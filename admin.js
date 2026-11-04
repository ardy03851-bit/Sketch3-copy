'use strict';
/* =====================================================================
   INKBRAWL ADMIN — press F9 (or Ctrl+Shift+A) during a match.
   A cheat console for solo playtesting: god mode, infinite ammo and
   materials, a damage multiplier, wind control, instant heal / bot slay /
   supply drops, give-any-weapon, and the Asset Toolbox — a palette of
   every prop the game can generate (all biomes), placeable anywhere.
   ===================================================================== */

const Admin = {
  open: false, god: false, infAmmo: false, infMats: false, dmgMult: 1,
};
const ASSETBOX_W = {
  id: '_assetbox', name: 'Asset Toolbox', type: 'melee', weight: 0, damage: 0, knockback: 0,
  swingTime: .18, cooldown: .2, reach: 40, arc: 60, lunge: 0, deflect: false, uses: 0, tool: false,
  rarity: 'admin', description: 'Click the map to place any asset. Right-click (or Erase) removes one.',
  sprite: null, destruction: { crater: 0, debris: 0, dust: .1, scorch: 0, dent: false },
  vfx: { trail: '#f3efe6', trailWidth: .4, sparks: .2, light: null }, shake: 0, hitStop: 0,
  sound: { type: 'swing', pitch: 1.4, volume: .3 }, img: null, builtin: true
};
function adminEnsureAsset() { if (!Weapons.byId._assetbox) Weapons.byId._assetbox = ASSETBOX_W; }
function adminMe() { return G.players ? G.players.get(G.myId) : null; }
function adminAssetActive() { const me = adminMe(); return !!(me && me.wid === '_assetbox' && G.mode === 'play'); }

/* ---------- cheat hooks ---------- */
const _hostDamageAdmin = hostDamage;
hostDamage = function (q, dmg, by, wid, kx, ky, x, y, head) {
  if (q && Admin.god && q.id === G.myId) return;                       /* god mode */
  if (by === G.myId && Admin.dmgMult !== 1 && dmg > 0) dmg = Math.round(dmg * Admin.dmgMult);
  return _hostDamageAdmin(q, dmg, by, wid, kx, ky, x, y, head);
};
/* touch players aim with the stick: place along the aim ray */
const _doAttackAdmin = doAttack;
doAttack = function (p, aim) {
  if (p.id === G.myId && p.wid === '_assetbox') { AdminBar.place(aim); return; }
  return _doAttackAdmin(p, aim);
};
/* per-frame cheat upkeep, chained onto the HUD tick */
const _tickHudAdmin = UI.tickHud.bind(UI);
UI.tickHud = function () {
  _tickHudAdmin(); adminEnsureAsset();
  if (G.mode !== 'play') { AdminPanel.hide(); AdminBar.refresh(); return; }
  const me = adminMe();
  if (me) {
    if (Admin.god && me.alive) me.hp = maxHp();
    if (Admin.infAmmo) { const w = weaponOf(me); if (w.ammo > 0) me.ammo = w.ammo; if (magOf(w) && me.mag !== magOf(w)) refillMag(me); }
    if (Admin.infMats) { me.mats = Math.max(me.mats || 0, 999); me.kitMats = Math.max(me.kitMats || 0, 999); }
  }
  AdminBar.refresh();
};

/* ---------- actions ---------- */
const AdminActs = {
  give(wid) {
    const w = Weapons.byId[wid]; if (!w || !w.id || w.id === '_fists') return;
    adminEnsureAsset(); emit({ k: 'arm', id: G.myId, wid, ammo: w.ammo || 0 });
    const me = adminMe(); if (me) { me.uses = 0; me.nextAtk = 0; }
    UI.toast(`Given: <b>${esc(w.name)}</b>`);
  },
  equipAsset() {
    adminEnsureAsset(); emit({ k: 'arm', id: G.myId, wid: '_assetbox', ammo: 0 });
    const me = adminMe(); if (me) { me.uses = 0; me.nextAtk = 0; }
    UI.toast(`<b>Asset Toolbox</b> — click to place, right-click to erase`);
  },
  heal() { const me = adminMe(); if (!me) return; me.hp = maxHp(); me.status = {}; UI.toast('Fully healed'); },
  slay() {
    let n = 0;
    for (const p of G.players.values()) if (p.isBot && p.alive) { hostDamage(p, 99999, G.myId, '_admin', 0, -300, p.x, p.y - 30, false); n++; }
    UI.toast(n ? `Smote ${n} bot${n > 1 ? 's' : ''}` : 'No bots alive');
  },
  drop(kind) {
    const me = adminMe(); if (!me) return;
    let x = Math.round(Math.min(Math.max(me.x + 140, 120), W - 120));
    let y = surfaceFromGrid(x); if (y == null || y > H - 60) { x = Math.round(me.x); y = surfaceFromGrid(x) ?? H - 120; }
    if (kind === 'weapon') { const w = rollCrateWeapon(); emit({ k: 'crate', id: Env.crateId++, x, kind: 'weapon', wid: w ? w.id : null }); UI.toast('Weapon drop incoming'); }
    else { emit({ k: 'crate', id: Env.crateId++, x, kind: 'health', wid: null }); UI.toast('Health drop incoming'); }
  },
};

/* ---------- admin panel (dark Ink & Slate, matches the menus) ---------- */
const AdminPanel = {
  el: null, built: false,
  ensure() {
    if (this.built) return; this.built = true;
    const st = document.createElement('style');
    st.textContent = `
#adminpanel{position:fixed;z-index:70;top:calc(76px + var(--safe-t,0px));right:calc(14px + var(--safe-r,0px));width:min(304px,calc(100vw - 20px));max-height:min(78vh,640px);overflow-y:auto;overscroll-behavior:contain;background:rgba(19,16,22,.92);border:1px solid rgba(238,232,218,.32);border-radius:16px;box-shadow:0 32px 80px rgba(0,0,0,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#ece6d8;font:600 13px/1.35 'Space Grotesk',system-ui,sans-serif;padding:14px 14px 16px;user-select:none;-webkit-user-select:none}
#adminpanel.hidden{display:none}
#adminpanel .ap-head{display:flex;align-items:baseline;gap:8px;margin-bottom:10px}
#adminpanel .ap-head b{font:800 19px/1 'Bricolage Grotesque','Space Grotesk',sans-serif;letter-spacing:.02em;color:#ece6d8}
#adminpanel .ap-head .ap-dot{width:8px;height:8px;border-radius:50%;background:#e2543a;box-shadow:0 0 10px #e2543a;align-self:center}
#adminpanel .ap-head small{flex:1;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(236,230,216,.4)}
#adminpanel .ap-x{background:none;border:1px solid rgba(238,232,218,.2);border-radius:8px;color:rgba(236,230,216,.7);font-size:13px;line-height:1;padding:5px 9px;cursor:pointer}
#adminpanel .ap-x:hover{color:#ece6d8;border-color:rgba(238,232,218,.4)}
#adminpanel .ap-sec{font-size:9.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#e2543a;margin:12px 0 6px}
#adminpanel .ap-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
#adminpanel .ap-t{flex:1 1 auto;min-width:86px;text-align:left;background:rgba(238,232,218,.06);border:1px solid rgba(238,232,218,.18);border-radius:10px;color:#ece6d8;font:600 12px 'Space Grotesk',system-ui,sans-serif;padding:8px 10px;cursor:pointer;transition:background .12s,border-color .12s}
#adminpanel .ap-t:hover{background:rgba(238,232,218,.12)}
#adminpanel .ap-t.on{background:rgba(226,84,58,.22);border-color:#e2543a;color:#ffb9a8}
#adminpanel .ap-b{flex:1 1 auto;min-width:86px;text-align:left;background:rgba(238,232,218,.06);border:1px solid rgba(238,232,218,.18);border-radius:10px;color:#ece6d8;font:600 12px 'Space Grotesk',system-ui,sans-serif;padding:8px 10px;cursor:pointer}
#adminpanel .ap-b:hover{background:rgba(238,232,218,.14)}
#adminpanel .ap-m{flex:0 0 auto;background:none;border:1px solid rgba(238,232,218,.18);border-radius:8px;color:rgba(236,230,216,.75);font:700 12px 'Space Grotesk',system-ui,sans-serif;padding:6px 11px;cursor:pointer}
#adminpanel .ap-m.on{background:#c9a25a;border-color:#c9a25a;color:#131017}
#adminpanel .ap-wind{display:flex;align-items:center;gap:8px;color:rgba(236,230,216,.75);font-size:11px}
#adminpanel .ap-wind input{flex:1;accent-color:#e2543a}
#adminpanel select{flex:1;min-width:120px;background:rgba(238,232,218,.06);border:1px solid rgba(238,232,218,.18);border-radius:10px;color:#ece6d8;font:600 12px 'Space Grotesk',system-ui,sans-serif;padding:7px 8px;cursor:pointer}
#adminpanel select option{background:#131017;color:#ece6d8}
#adminpanel .ap-give{background:rgba(201,162,90,.18);border:1px solid rgba(201,162,90,.55);border-radius:10px;color:#ecd9ae;font:700 12px 'Space Grotesk',system-ui,sans-serif;padding:8px 14px;cursor:pointer}
#adminpanel .ap-give:hover{background:rgba(201,162,90,.3)}
#adminpanel .ap-asset{flex:1 1 100%;background:rgba(226,84,58,.16);border:1px solid rgba(226,84,58,.6);border-radius:10px;color:#ffb9a8;font:700 13px 'Space Grotesk',system-ui,sans-serif;padding:10px 12px;cursor:pointer}
#adminpanel .ap-asset:hover{background:rgba(226,84,58,.28)}
#adminpanel .ap-asset.on{background:#e2543a;border-color:#e2543a;color:#fff8ec}`;
    document.head.append(st);
    const el = document.createElement('div'); el.id = 'adminpanel'; el.className = 'hidden'; document.body.append(el); this.el = el;
    el.innerHTML = `
<div class="ap-head"><span class="ap-dot"></span><b>ADMIN</b><small>F9 · ctrl+shift+A</small><button class="ap-x" data-a="close">✕</button></div>
<div class="ap-sec">Cheats</div>
<div class="ap-row">
  <button class="ap-t" data-t="god">God mode</button>
  <button class="ap-t" data-t="infAmmo">∞ Ammo</button>
  <button class="ap-t" data-t="infMats">∞ Mats</button>
</div>
<div class="ap-row" style="margin-top:6px">
  <span style="font-size:11px;color:rgba(236,230,216,.55)">My damage</span>
  <button class="ap-m" data-m="1">1×</button><button class="ap-m" data-m="2">2×</button><button class="ap-m" data-m="5">5×</button><button class="ap-m" data-m="10">10×</button>
</div>
<div class="ap-row ap-wind" style="margin-top:8px"><span>Wind</span><input type="range" min="-100" max="100" step="5" value="0"><span class="ap-wv">0</span></div>
<div class="ap-sec">Actions</div>
<div class="ap-row">
  <button class="ap-b" data-a="heal">Full heal</button>
  <button class="ap-b" data-a="slay">Slay bots</button>
  <button class="ap-b" data-a="hcrate">Health drop</button>
  <button class="ap-b" data-a="wcrate">Weapon drop</button>
</div>
<div class="ap-sec">Give weapon</div>
<div class="ap-row"><select id="ap-wsel"></select><button class="ap-give" data-a="give">Give</button></div>
<div class="ap-sec">Assets</div>
<div class="ap-row"><button class="ap-asset" data-a="asset">Equip Asset Toolbox</button></div>`;
    const block = ev => { ev.stopPropagation(); };
    el.addEventListener('pointerdown', block);
    for (const ev of ['touchstart', 'touchend', 'touchmove', 'keydown', 'keyup', 'keypress', 'wheel']) el.addEventListener(ev, block, { passive: ev.startsWith('touch') });
    el.addEventListener('input', e => {
      if (e.target.tagName === 'SELECT') return;
      if (e.target.type === 'range') { Env.wind = +e.target.value / 100; el.querySelector('.ap-wv').textContent = (+e.target.value).toFixed(0); }
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-t],[data-m],[data-a]'); if (!b) return;
      const ds = b.dataset;
      if (ds.t) { Admin[ds.t] = !Admin[ds.t]; Audio2.play('ui'); this.sync(); }
      else if (ds.m) { Admin.dmgMult = +ds.m; Audio2.play('ui'); this.sync(); }
      else {
        Audio2.play('ui');
        if (ds.a === 'close') this.hide();
        else if (ds.a === 'heal') AdminActs.heal();
        else if (ds.a === 'slay') AdminActs.slay();
        else if (ds.a === 'hcrate') AdminActs.drop('health');
        else if (ds.a === 'wcrate') AdminActs.drop('weapon');
        else if (ds.a === 'give') { const s = el.querySelector('#ap-wsel'); if (s && s.value) AdminActs.give(s.value); }
        else if (ds.a === 'asset') { adminAssetActive() ? AdminActs.give('_fists') : AdminActs.equipAsset(); }
      }
    });
  },
  sync() {
    if (!this.el) return;
    this.el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', !!Admin[b.dataset.t]));
    this.el.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', +b.dataset.m === Admin.dmgMult));
    this.el.querySelector('.ap-asset').classList.toggle('on', adminAssetActive());
  },
  fillWeapons() {
    const s = this.el.querySelector('#ap-wsel'); if (!s) return;
    const list = Weapons.ready ? Weapons.list.filter(w => w.id && w.id !== '_fists') : [];
    list.sort((a, b) => a.name.localeCompare(b.name));
    s.innerHTML = list.map(w => `<option value="${w.id}">${esc(w.name)}${w.rarity ? ' · ' + w.rarity : ''}</option>`).join('');
  },
  show() { this.ensure(); this.el.classList.remove('hidden'); Admin.open = true; this.sync(); this.fillWeapons(); Audio2.play('ui'); },
  hide() { if (this.el) this.el.classList.add('hidden'); Admin.open = false; },
  toggle() { this.ensure(); this.el.classList.contains('hidden') ? this.show() : this.hide(); },
};
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.repeat) return;
  if (e.code === 'F9' || (e.ctrlKey && e.shiftKey && e.code === 'KeyA')) {
    e.preventDefault(); if (G.mode === 'play' && Input.enabled) AdminPanel.toggle();
  }
});

/* ---------- Asset Toolbox palette (paper HUD style, like the build bar) ---------- */
const AdminBar = {
  el: null, built: false, key: '',
  tab: 0, sel: null, q: '', size: 1, erase: false,
  icons: {}, iconTheme: '', pending: [],
  TABS: [['All', null], ['Trees', 'tree'], ['Plants', 'small'], ['Objects', 'other']],
  kinds() {
    const f = this.TABS[this.tab][1];
    let ks = Object.keys(PROPS);
    if (f) ks = ks.filter(k => f === 'other' ? !PROPS[k].tree && !PROPS[k].small : !!PROPS[k][f]);
    if (this.q) { const q = this.q.toLowerCase(); ks = ks.filter(k => k.toLowerCase().includes(q)); }
    return ks;
  },
  ensure() {
    if (this.built) return; this.built = true;
    const st = document.createElement('style');
    st.textContent = `
#assetbar{position:fixed;left:50%;bottom:calc(14px + var(--safe-b,0px));transform:translateX(-50%);display:flex;flex-direction:column;gap:5px;padding:6px 8px 7px;background:rgba(243,236,222,.95);border:2.5px solid #1f1c24;border-radius:16px;box-shadow:3px 4px 0 rgba(31,28,36,.35);z-index:45;font-family:"Shantell Sans",sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none;max-width:calc(100vw - 16px);animation:abIn .22s ease-out}
@keyframes abIn{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
#assetbar.hidden{display:none}
#assetbar .top,#assetbar .row{display:flex;gap:5px;align-items:center}
#assetbar .row{overflow-x:auto;scrollbar-width:none}#assetbar .row::-webkit-scrollbar{display:none}
#assetbar .tab{padding:4px 11px;border:2px solid rgba(31,28,36,.3);border-radius:999px;font-size:13px;font-weight:800;color:#1f1c24;background:#fbf6ea;cursor:pointer;white-space:nowrap}
#assetbar .tab.on{background:#1f1c24;color:#f3ecde;border-color:#1f1c24}
#assetbar .search{width:96px;padding:4px 10px;border:2px solid rgba(31,28,36,.3);border-radius:999px;font:700 12px "Shantell Sans",sans-serif;color:#1f1c24;background:#fbf6ea;outline:none}
#assetbar .search:focus{border-color:#1f1c24}
#assetbar .sz{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:800;color:#1f1c24;white-space:nowrap}
#assetbar .sz input{width:64px;accent-color:#1f1c24}
#assetbar .chip{padding:4px 10px;border:2px solid rgba(31,28,36,.3);border-radius:999px;font-size:12px;font-weight:800;background:#fbf6ea;color:#1f1c24;cursor:pointer;white-space:nowrap}
#assetbar .chip.on{background:#ff9d86;border-color:#1f1c24}
#assetbar .done{padding:5px 14px;border:2.5px solid #1f1c24;border-radius:999px;font-size:14px;font-weight:800;background:#d9573b;color:#fff8ec;cursor:pointer;box-shadow:0 2px 0 #1f1c24;white-space:nowrap}
#assetbar .as{flex:none;width:48px;height:48px;border:2px solid rgba(31,28,36,.3);border-radius:11px;background:#fbf6ea;display:grid;place-items:center;cursor:pointer;transition:transform .12s,background .12s;overflow:hidden}
#assetbar .as img{width:42px;height:42px;object-fit:contain;pointer-events:none}
#assetbar .as span{font-size:8px;font-weight:800;color:rgba(31,28,36,.6);text-align:center;line-height:1.05;padding:2px;word-break:break-all}
#assetbar .as.on{border-color:#1f1c24;background:#ffe9b8;transform:translateY(-2px);box-shadow:0 3px 0 #1f1c24}
#assetbar .tip{font-size:12px;color:rgba(31,28,36,.75);text-align:center;min-height:15px;line-height:15px}
#assetbar.touch .as{width:56px;height:56px}#assetbar.touch .as img{width:48px;height:48px}
@media (max-width:720px){#assetbar{bottom:auto;top:calc(60px + var(--safe-t,0px));padding:4px 5px;max-width:calc(100vw - 10px)}#assetbar .as{width:44px;height:44px}#assetbar .as img{width:38px;height:38px}#assetbar .search{width:72px}}`;
    document.head.append(st);
    const el = document.createElement('div'); el.id = 'assetbar'; el.className = 'hidden'; document.body.append(el); this.el = el;
    const block = ev => { ev.stopPropagation(); };
    el.addEventListener('pointerdown', block);
    for (const ev of ['touchstart', 'touchend', 'touchmove', 'keydown', 'keyup', 'keypress', 'wheel']) el.addEventListener(ev, block, { passive: ev.startsWith('touch') });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-t],[data-k],[data-a]'); if (!b) return;
      const ds = b.dataset; Audio2.play('ui');
      if (ds.t != null) { this.tab = +ds.t; if (!this.kinds().includes(this.sel)) this.sel = this.kinds()[0] || null; }
      else if (ds.k != null) { this.sel = ds.k; this.erase = false; }
      else if (ds.a === 'erase') this.erase = !this.erase;
      else if (ds.a === 'done') AdminActs.give('_fists');
      this.refresh(true);
    });
    el.addEventListener('input', e => {
      if (e.target.classList.contains('search')) { this.q = e.target.value; this.sel = this.kinds()[0] || null; this.refresh(true); }
      else if (e.target.classList.contains('szr')) { this.size = +e.target.value; el.querySelector('.szv').textContent = this.size.toFixed(1) + '×'; }
    });
  },
  icon(kind) {
    const key = kind + '|' + (T.theme ? T.theme.name : '');
    if (this.icons[key] !== undefined) return this.icons[key];
    this.icons[key] = null; this.pending.push(kind);           /* rendered in chunks below */
    return null;
  },
  pumpIcons(n = 6) {
    let done = 0;
    while (this.pending.length && done < n) {
      const kind = this.pending.shift(); const key = kind + '|' + (T.theme ? T.theme.name : '');
      if (this.icons[key]) { continue; }
      try {
        const sp = propSprite(kind, 0, T.theme); const c = document.createElement('canvas'); c.width = 84; c.height = 84;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        const s = Math.min(76 / sp.c.width, 76 / sp.c.height);
        x.drawImage(sp.c, (84 - sp.c.width * s) / 2, (84 - sp.c.height * s) / 2, sp.c.width * s, sp.c.height * s);
        this.icons[key] = c.toDataURL();
      } catch (err) { this.icons[key] = null; }
      const slot = this.el && this.el.querySelector(`[data-k="${CSS.escape(kind)}"]`);
      if (slot && this.icons[key]) slot.innerHTML = `<img src="${this.icons[key]}" alt="${kind}">`;
      done++;
    }
  },
  refresh(force = false) {
    const on = adminAssetActive() && UI.cur !== 'pause';
    this.ensure();
    if (!on) { if (!this.el.classList.contains('hidden')) this.el.classList.add('hidden'); this.key = ''; return; }
    if (this.iconTheme !== (T.theme ? T.theme.name : '')) { this.iconTheme = T.theme ? T.theme.name : ''; this.icons = {}; this.pending = Object.keys(PROPS); }
    const ks = this.kinds();
    if (!this.sel || !ks.includes(this.sel)) this.sel = ks[0] || null;
    const key = [this.tab, this.q, this.sel, this.size, this.erase, ks.join(','), Input.usingTouch].join('|');
    if (!force && key === this.key) { this.pumpIcons(); return; }
    this.key = key;
    this.el.classList.remove('hidden'); this.el.classList.toggle('touch', !!Input.usingTouch);
    const slots = ks.map(k => {
      const ic = this.icon(k);
      return `<div class="as${k === this.sel ? ' on' : ''}" data-k="${k}" title="${k}">${ic ? `<img src="${ic}" alt="${k}">` : `<span>${k}</span>`}</div>`;
    }).join('');
    this.el.innerHTML = `
<div class="top">${this.TABS.map((t, i) => `<div class="tab${i === this.tab ? ' on' : ''}" data-t="${i}">${t[0]}</div>`).join('')}
<input class="search" type="text" placeholder="search…" value="${esc(this.q)}">
<div class="sz"><span>size</span><input class="szr" type="range" min="0.4" max="2.5" step="0.1" value="${this.size}"><span class="szv">${this.size.toFixed(1)}×</span></div>
<div class="chip${this.erase ? ' on' : ''}" data-a="erase">Erase</div>
<div class="done" data-a="done">Done ✕</div></div>
<div class="row">${slots || '<span style="font-size:12px;color:rgba(31,28,36,.6);padding:6px 2px">no assets match</span>'}</div>
<div class="tip">${this.erase ? '<b>Erase</b> · click a prop to remove it (right-click works too)' : this.sel ? `<b>${this.sel}</b> · click the map to place it` : ''}</div>`;
    this.pumpIcons(); this.pumpIcons();
  },
  /* place / erase at the current mouse (or aim-ray) position */
  place(aim) {
    const me = adminMe(); if (!me || !me.alive) return;
    let tx, ty;
    if (!Input.usingTouch && Input.mouse.active) [tx, ty] = toWorld(Input.mouse.x, Input.mouse.y);
    else { const a = aim ?? me.aim; tx = me.x + Math.cos(a) * 90; ty = me.y + Math.sin(a) * 90; }
    if (this.erase) { this.eraseAt(tx, ty); return; }
    const kind = this.sel, d = PROPS[kind]; if (!d) return;
    let gx = tx, gy = surfaceFromGrid(tx);
    if (gy == null) {                                   /* over water/void: try nearby columns */
      for (const off of [24, -24, 60, -60, 120, -120]) { const y2 = surfaceFromGrid(tx + off); if (y2 != null) { gx = tx + off; gy = y2; break; } }
    }
    if (gy == null) { UI.hint('No ground there to root a prop'); return; }
    const pr = { id: Env.props.length, kind, x: Math.round(gx), y: Math.round(gy) + 3, s: this.size, variant: Math.random() * 3 | 0, flip: Math.random() < .5, seed: Math.random() * 999 | 0, sway: Math.random() * TAU, burn: 0, dead: false, leafT: 0, leafAng: 0, leafVel: 0, hp: d.hp, cut: 0, cutS: 0 };
    Env.props.push(pr);
    FX.dustPuff(pr.x, pr.y, 5, .8); Audio2.play('land', pr.x, .5);
  },
  eraseAt(x, y) {
    let best = null, bd = 1e9;
    for (const pr of Env.props) {
      if (pr.dead) continue;
      const d = PROPS[pr.kind]; const top = pr.y - d.h * pr.s;
      const vy = y < top ? top - y : (y > pr.y ? y - pr.y : 0);   /* 0 when inside the prop's span */
      const dist = Math.hypot(pr.x - x, vy * .8);
      if (dist < bd) { bd = dist; best = pr; }
    }
    if (!best) return;
    if (bd > (PROPS[best.kind].tree ? 150 : 100)) return;
    best.dead = true; FX.dustPuff(best.x, best.y, 7, 1); Audio2.play('debris', best.x, .6);
  },
};
/* mouse: instant placement regardless of turn; right-click erases */
document.addEventListener('pointerdown', e => {
  if (!adminAssetActive() || e.pointerType !== 'mouse' || e.button !== 0) return;
  if (e.target.closest && e.target.closest('#assetbar,#adminpanel,#ui,.screen,canvas.hud')) return;
  if (UI.cur) return;
  e.preventDefault(); e.stopPropagation();
  AdminBar.place();
}, true);
document.addEventListener('contextmenu', e => {
  if (!adminAssetActive()) return;
  if (e.target.closest && e.target.closest('#assetbar,#adminpanel,#ui,.screen')) return;
  if (UI.cur) return;
  e.preventDefault(); e.stopPropagation();
  const [x, y] = toWorld(e.clientX, e.clientY);
  AdminBar.eraseAt(x, y);
}, true);

window.Admin = Admin; window.AdminPanel = AdminPanel; window.AdminBar = AdminBar; window.AdminActs = AdminActs;
