// ─────────────────────────────────────────────────────────────
//  TIDAL SOAKER  ·  weapons/soaker/soaker.js
//  A pumped-up water cannon. Barely hurts anyone — it just
//  launches them across the map (and puts out fires).
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Tidal Soaker",
  type: "gun",
  rarity: "uncommon",
  description: "Does almost no damage. Sends people flying. Puts out fires.",
  weight: 0.8,

  damage: 3,
  knockback: 1150,
  headshot: 1,
  fireRate: 1.4,
  ammo: 26,
  automatic: false,
  bullets: 1,
  spread: 0.05,
  bulletSpeed: 1250,
  bulletGravity: 260,
  range: 900,
  recoil: 420,
  bounces: 0,
  pierce: 1,

  projectile: { type: "orb", size: 13, color: "#7ec8f0", glow: "#cdeeff" },
  onHit(e, api) { api.status(e.target, { burn: 0 }); },   // soaked: no burning

  sprite: { length: 96, gripX: 0.2, gripY: 0.62, muzzleX: 1.0, muzzleY: 0.5, holdDistance: 18 },
  destruction: { crater: 0, jagged: 0, debris: 0, dust: 0.6, scorch: 0, dent: false },
  vfx: { muzzleFlash: 0.3, tracer: "#9ed8f5", sparks: 0.4, smoke: 0.2, shells: false, light: "#7ec8f0" },
  shake: 3,
  hitStop: 0.01,
  sound: { type: "laser", pitch: 0.6, volume: 0.7 }
});
