// ─────────────────────────────────────────────────────────────
//  PLASMA BOW  ·  weapons/plasmabow/plasmabow.js
//  A bow that fires magnetised plasma. Hold to draw for a
//  straighter, faster shot — or just spam it and pray.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Plasma Bow",
  type: "gun",
  rarity: "epic",
  description: "Charged plasma arrows. Fast, straight and very rude.",
  weight: 0.65,

  damage: 38,
  knockback: 500,
  headshot: 1.5,
  fireRate: 1.5,
  ammo: 20,
  automatic: false,
  bullets: 1,
  spread: 0.008,
  bulletSpeed: 2400,
  bulletGravity: 60,
  range: 2600,
  recoil: 200,
  pierce: 1,

  projectile: { type: "orb", size: 7, color: "#b48aff", glow: "#e8d4ff", trail: "sparkle" },
  onImpact(e, api) { api.crater(e.x, e.y, 16); },

  sprite: { length: 92, gripX: 0.3, gripY: 0.5, muzzleX: 1.0, muzzleY: 0.5, holdDistance: 16 },
  destruction: { crater: 12, jagged: 0.6, debris: 5, dust: 0.6, scorch: 0.5, dent: true },
  vfx: { muzzleFlash: 0.5, tracer: "#c9a8ff", sparks: 1.2, smoke: 0.2, shells: false, light: "#b48aff" },
  shake: 3,
  hitStop: 0.04,
  sound: { type: "laser", pitch: 1.2, volume: 0.65 }
});
