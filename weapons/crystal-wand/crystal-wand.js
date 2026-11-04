// ─────────────────────────────────────────────────────────────
//  CRYSTAL WAND  ·  weapons/crystal-wand/crystal-wand.js
//  Straight-shooting magic bolts that shatter into crystal
//  shards and press a small crater wherever they land.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Crystal Wand",
  type: "gun",
  rarity: "epic",
  description: "Laser-straight crystal bolts that shatter into shards.",
  weight: 2,

  damage: 22,
  knockback: 350,
  headshot: 1.4,

  fireRate: 4.0,
  ammo: 80,
  automatic: true,
  bullets: 1,
  spread: 0.03,
  bulletSpeed: 1800,
  bulletGravity: 0,               // straight laser
  range: 1600,
  bounces: 1,
  recoil: 90,

  projectile: { type: "orb", size: 8, color: "#c9a8ff", glow: "#a880ff", trail: "sparkle" },

  sprite: { length: 95, gripX: 0.2, gripY: 0.65, muzzleX: 1.0, muzzleY: 0.2, holdDistance: 18 },
  destruction: { crater: 6, jagged: 0.4, debris: 6, dust: 0.6, scorch: 0, dent: true },
  vfx: { muzzleFlash: 1.2, tracer: "#c9a8ff", sparks: 1.2, smoke: 0.3, shells: false, light: "#a880ff" },
  shake: 4,
  hitStop: 0.04,
  sound: { type: "shot", pitch: 1.5, volume: 0.8 },

  onImpact(e, api) {
    api.crater(e.x, e.y, 10);
    if (typeof FX !== "undefined") FX.sparks(e.x, e.y, -Math.PI / 2, 14, "#c9a8ff");
  }
});
