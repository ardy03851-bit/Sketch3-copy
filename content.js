/* =====================================================================
   content.js: content folders and the event set
   ---------------------------------------------------------------------
   biomes/<id>/<id>.js    normal biomes  (one Biome({...}) call per file)
   biomes2/<id>/<id>.js   event biomes   (shown on the event page)
   weapons/  weapons2/    weapons (found by discoverWeapons in index.html)
   mainmenu/              main menu art (bg.png, maintitle.png, event/...)
   Nothing in index.html has to change to add any of these. See README.
   ===================================================================== */
'use strict';

RULE_DEFAULTS.terrain = 'normal';   // 'normal' | 'flat'
RULE_DEFAULTS.set = 'main';         // 'main' | 'event'
for (const k of ['terrain', 'set']) if (G.opts[k] == null) G.opts[k] = RULE_DEFAULTS[k];

const Content = { log: [], how: '', ready: false, counts: { main: 0, event: 0 } };
function contentSet() { return (G.opts && G.opts.set) || 'main'; }
function biomeSetOf(t) { return (t && t.set) || 'main'; }
function biomeIndexes(set = contentSet()) {
  const r = []; THEMES.forEach((t, i) => { if (biomeSetOf(t) === set) r.push(i); });
  if (!r.length) THEMES.forEach((t, i) => { if (biomeSetOf(t) === 'main') r.push(i); });
  return r.length ? r : [0];
}
let lastRandomBiome = -1;
function randomBiome() {
  const L = biomeIndexes(); let pick = L[(Math.random() * L.length) | 0];
  if (L.length > 2 && pick === lastRandomBiome) pick = L[(L.indexOf(pick) + 1 + ((Math.random() * (L.length - 1)) | 0)) % L.length];
  return (lastRandomBiome = pick);
}
function biomeFromNet(id, idx) {
  if (id) { const i = THEMES.findIndex(t => t.id === id); if (i >= 0) return i; }
  return clamp(idx | 0, 0, THEMES.length - 1);
}
function slugOf(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'biome'; }
for (const t of THEMES) { if (!t.id) t.id = slugOf(t.name); if (!t.set) t.set = 'main'; }

/* ---------- weapons: which set is in play ---------- */
function weaponInSet(w, set = contentSet()) {
  if (!w) return false; if (Array.isArray(w.sets)) return w.sets.includes(set);
  return (w.set || 'main') === set;
}
{
  const _allowed = weaponAllowed;
  weaponAllowed = function (w) {
    if (!_allowed(w)) return false;
    const set = contentSet(); if (weaponInSet(w, set)) return true;
    // an event with no weapons of its own falls back to the normal ones
    return set !== 'main' && !Weapons.list.some(x => weaponInSet(x, set) && x.weight > 0) && weaponInSet(w, 'main');
  };
}

/* ---------- the biome folders ---------- */
const BIOME_TEMPLATE = JSON.parse(JSON.stringify(THEMES[0]));
function cleanBiome(def, id, set, base) {
  const t = Object.assign(JSON.parse(JSON.stringify(BIOME_TEMPLATE)), def);
  delete t.newProps; delete t.newWeather; delete t.order;
  t.id = String(def.id || id); t.set = set; t.path = base; t.name = String(def.name || id).slice(0, 28);
  t.order = Number.isFinite(+def.order) ? +def.order : 1000;
  if (!Array.isArray(t.props) || !t.props.length) t.props = BIOME_TEMPLATE.props;
  t.props = t.props.filter(p => Array.isArray(p) && PROPS[p[0]]);
  if (!t.props.length) t.props = [['rock', 1]];
  return t;
}
async function registerBiomeProps(defs, base, tag) {
  for (const [kind, spec] of Object.entries(defs || {})) {
    if (!kind || !spec || typeof spec !== 'object') continue;
    const d = Object.assign({ w: 40, h: 40, mat: 'wood', hp: 40 }, spec);
    if (spec.image) {
      const img = await loadImg(base + encodeURIComponent(spec.image));
      if (!img) { Content.log.push(`${tag}: could not load ${spec.image}`); continue; }
      if (!spec.h) d.h = Math.round(d.w * img.naturalHeight / img.naturalWidth);
      d.art = (sp, o) => sp.x.drawImage(img, 0, 0, o.w, o.h);
    }
    if (typeof d.art !== 'function') { Content.log.push(`${tag}: prop "${kind}" needs an image or an art function`); continue; }
    PROPS[kind] = d; if (d.tree) TREES.add(kind);
    d.solid = d.solid ?? (d.mat === 'stone' || d.mat === 'crystal' || d.mat === 'metal');
  }
}
async function loadBiomeFolder(root, set) {
  const D = await discoverFolder(root); const out = [];
  await Promise.all(D.dirs.map(async name => {
    const files = await D.files(name);
    const js = files.find(f => f.toLowerCase() === name.toLowerCase() + '.js') || files.find(f => /\.js$/i.test(f)) || name + '.js';
    const base = `${root}/${encodeURIComponent(name)}/`; const tag = `${root}/${name}`;
    const src = await fetchText(base + encodeURIComponent(js));
    if (!src) { Content.log.push(`${tag}: no ${js}`); return; }
    const defs = [];
    try { new Function('Biome', 'PROPS', 'folder', src)(d => { if (d && typeof d === 'object') defs.push(d); }, PROPS, base); }
    catch (e) { Content.log.push(`${tag}: ${e.message}`); return; }
    for (let i = 0; i < defs.length; i++) {
      try { await registerBiomeProps(defs[i].newProps, base, tag); for (const [k, d] of Object.entries(defs[i].newWeather || {})) Weather.register(k, d); out.push(cleanBiome(defs[i], defs.length > 1 ? `${name}-${i + 1}` : name, set, base)); }
      catch (e) { Content.log.push(`${tag}: ${e.message}`); }
    }
  }));
  out.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return { list: out, how: D.how };
}
async function discoverBiomes() {
  Content.log = [];
  const [A, B] = await Promise.all([loadBiomeFolder('biomes', 'main'), loadBiomeFolder('biomes2', 'event')]);
  const builtIn = THEMES.filter(t => biomeSetOf(t) === 'main' && !t.path);
  const main = A.list.length ? A.list : builtIn; // without a biomes folder the built-in ones stay
  const seen = new Set(); const all = [];
  for (const t of [...main, ...B.list]) { let id = t.id; while (seen.has(id)) id += '-2'; t.id = id; seen.add(id); all.push(t); }
  THEMES.length = 0; THEMES.push(...all);
  Content.how = A.list.length ? A.how : 'built in'; Content.counts = { main: main.length, event: B.list.length }; Content.ready = true;
  if (Content.log.length) console.warn('Biomes:\n' + Content.log.join('\n'));
  try { refreshBiomeSelects(); } catch (e) { }
}
function refreshBiomeSelects() {
  const opts = '<option value="-1">Random</option>' + THEMES.map((t, i) => biomeSetOf(t) === 'main' ? `<option value="${i}">${esc(t.name)}</option>` : '').join('');
  for (const id of ['#hostBiome', '#practiceBiome']) { const el = $(id); if (el) el.innerHTML = opts; }
  if (typeof Setup !== 'undefined') Setup.refresh();
}

/* ---------- the event (mainmenu/event/event.json) ---------- */
const EventInfo = { name: 'Halloween', tagline: 'pumpkins, ghosts and a very spooky drawer of weapons', accent: '#ff8a2a', accent2: '#8d4bd6', ink: '#1a1222', paper: '#2a2033', title: 'maintitle.png', bg: 'bg.png', loaded: false };
async function loadEventInfo() {
  try { const r = await fetch('mainmenu/event/event.json', { cache: 'no-store' }); if (r.ok) Object.assign(EventInfo, await r.json()); } catch (e) { }
  EventInfo.loaded = true;
}

/* ---------- the content set and terrain travel inside the room rules (G.opts) ---------- */
{
  const _start = startHost;
  startHost = function (opts) {
    RulesPanel.vals.set = (opts && opts.set) || 'main';
    if (opts && opts.terrain) RulesPanel.vals.terrain = opts.terrain;
    return _start(opts);
  };
}
