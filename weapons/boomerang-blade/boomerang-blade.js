// ─────────────────────────────────────────────────────────────
//  BOOMERANG BLADE  ·  weapons/boomerang-blade/boomerang-blade.js
//  A heavy thrown blade that carves a small dent wherever it
//  bites, ricochets twice, then spins back to your hand.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Boomerang Blade",
  type: "gun",
  rarity: "rare",
  description: "A spinning blade that dents the world, ricochets, and comes back.",
  weight: 2,

  damage: 28,
  knockback: 400,
  headshot: 1.3,

  fireRate: 1.2,
  ammo: 40,
  automatic: false,
  bullets: 1,
  spread: 0.04,
  bulletSpeed: 1200,
  bulletGravity: 200,
  range: 1400,
  bounces: 2,
  recoil: 120,

  returns: true,                  // flies back to the thrower
  hideWhileFlying: true,          // empty hand while it is out
  pierce: 99,
  projectileSprite: true,         // the PNG itself is the projectile
  projectileSize: 40,
  projectile: { type: "boomerang", size: 20, color: "#ffd9a0", spin: 20 },

  sprite: { length: 72, gripX: 0.5, gripY: 0.5, muzzleX: 1.0, muzzleY: 0.3, holdDistance: 16 },
  destruction: { crater: 0, jagged: 0.5, debris: 3, dust: 0.4, scorch: 0, dent: false },
  vfx: { muzzleFlash: 0, tracer: "#ffd9a0", sparks: 1.0, smoke: 0, shells: false, light: "#ffb35c" },
  shake: 3,
  hitStop: 0.04,
  sound: { type: "shot", pitch: 1.2, volume: 0.7 },

  onImpact(e, api) { api.crater(e.x, e.y, 8); }
});
