// ─────────────────────────────────────────────────────────────
//  PRISM LANCE  ·  weapons/prism-lance/prism-lance.js
//  MYTHIC. Hold fire to charge a refracted beam that pierces
//  through two fighters without slowing down. The longer you
//  hold, the harder it bites.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Prism Lance",
  type: "gun",
  rarity: "mythic",
  weight: 1,
  description: "Charge and release a refracted prism beam that pierces through two fighters.",

  damage: 32,
  knockback: 620,
  headshot: 1.35,
  fireRate: 1.1,
  charge: 0.5,
  ammo: 10,
  magazine: 4,
  reloadTime: 1.1,
  spread: 0,
  bulletSpeed: 2600,
  bulletGravity: 0,
  range: 1900,
  pierce: 2,
  recoil: 90,
  bounces: 0,

  sprite: { length: 89, gripX: 0.26, gripY: 0.49, muzzleX: 0.97, muzzleY: 0.46, holdDistance: 20 },
  projectile: { color: "#8df1ff", glow: "#d9fbff", size: 7, spin: 0 },

  destruction: { crater: 9, jagged: 0.2, debris: 4, dust: 0.6, scorch: 0.25, dent: false },
  vfx: { tracer: "#8df1ff", trail: "#8df1ff", trailWidth: 1.6, light: "#8df1ff", muzzleFlash: 1.4, sparks: 1.4, smoke: 0, shells: false },
  shake: 6,
  hitStop: 0.035,
  sound: { type: "impact", pitch: 1.6, volume: 0.7 },
});
