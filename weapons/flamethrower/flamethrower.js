// ─────────────────────────────────────────────────────────────
//  FLAMETHROWER  ·  weapons/flamethrower/flamethrower.js
//  Continuous cone of flame. Burns players and trees; water
//  puts the flames out.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Flamethrower",
  type: "gun",
  rarity: "rare",
  description: "Hold to hose fire. Burns players and trees. Hates water.",
  weight: 1,

  damage: 8,                      // per flame particle
  knockback: 80,
  headshot: 1.0,

  fireRate: 12,
  ammo: 250,
  automatic: true,
  bullets: 3,
  spread: 0.18,
  bulletSpeed: 700,
  bulletGravity: -50,             // flames rise
  drag: 2.2,                      // flames slow down as they travel
  life: 0.6,                      // seconds a flame lives
  range: 420,
  bounces: 0,
  recoil: 30,
  pierce: 2,

  projectile: { type: "flame", size: 11, color: "#ff8a3c", glow: "#ffd27a" },
  status: { burn: 1.8 },          // seconds of burning (damage over time)
  ignites: true,                  // sets trees on fire

  sprite: { length: 90, gripX: 0.3, gripY: 0.7, muzzleX: 1.0, muzzleY: 0.25, holdDistance: 20 },
  destruction: { crater: 4, jagged: 0.1, debris: 2, dust: 0.5, scorch: 0.8, dent: false },
  vfx: { muzzleFlash: 0.8, tracer: "#ff8a3c", sparks: 0.6, smoke: 0.5, shells: false, light: "#ff6a2c" },
  shake: 1,
  hitStop: 0,
  sound: { type: "shot", pitch: 0.8, volume: 0.6 },

  onFire(e, api) {
    if (typeof FX === "undefined") return;
    FX.sparks(e.x, e.y, e.angle, 4, "#ffd27a");
  }
});
