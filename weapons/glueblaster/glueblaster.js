// ─────────────────────────────────────────────────────────────
//  GLUE BLASTER  ·  weapons/glueblaster/glueblaster.js
//  Fires gobs of sticky paste. Hits barely hurt, but the
//  target gets bogged down and slowed to a waddle.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Glue Blaster",
  type: "gun",
  rarity: "uncommon",
  description: "Low damage, but anyone hit is slowed to a sticky waddle.",
  weight: 0.8,

  damage: 8,
  knockback: 120,
  headshot: 1,
  fireRate: 1.8,
  ammo: 40,
  automatic: true,
  bullets: 1,
  spread: 0.07,
  bulletSpeed: 1000,
  bulletGravity: 420,
  range: 800,
  recoil: 60,
  bounces: 0,
  drag: 1.2,
  life: 1.4,

  projectile: { type: "orb", size: 10, color: "#d8e8c0", glow: "#f0f8e0" },
  status: { shock: 1.1 },               // the engine's slow: stuck in glue

  sprite: { length: 88, gripX: 0.2, gripY: 0.66, muzzleX: 1.0, muzzleY: 0.5, holdDistance: 16 },
  destruction: { crater: 0, jagged: 0, debris: 0, dust: 0.3, scorch: 0, dent: false },
  vfx: { muzzleFlash: 0.3, tracer: "#d8e8c0", sparks: 0.4, smoke: 0.5, shells: false, light: "#c8e0a0" },
  shake: 1.5,
  hitStop: 0.02,
  sound: { type: "shot", pitch: 0.7, volume: 0.5 }
});
