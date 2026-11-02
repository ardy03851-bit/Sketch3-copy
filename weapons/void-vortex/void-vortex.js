// ─────────────────────────────────────────────────────────────
//  VOID VORTEX  ·  weapons/void-vortex/void-vortex.js
//  MYTHIC. Lobs a slow star-seed that drags nearby fighters
//  toward it while it swells, then collapses in a purple nova.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Void Vortex",
  type: "gun",
  rarity: "mythic",
  weight: 1,
  description: "A slow star-seed that drags fighters in, then collapses in a purple nova.",

  damage: 12,
  knockback: 200,
  headshot: 1,
  fireRate: 0.75,
  ammo: 8,
  magazine: 3,
  reloadTime: 1.4,
  spread: 0.02,
  bulletSpeed: 520,
  bulletGravity: 60,
  drag: 0.55,
  fuse: 1.15,
  range: 2400,
  recoil: 120,
  bounces: 0,
  pull: { radius: 190, force: 1000 },
  explosion: { radius: 120, damage: 34, knockback: 820, selfDamage: 0.5 },

  sprite: { length: 76, gripX: 0.34, gripY: 0.78, muzzleX: 0.8, muzzleY: 0.48, holdDistance: 20 },
  projectile: { type: "rocket", color: "#cda2ff", glow: "#8a5cd6", size: 13, spin: 1.2 },

  destruction: { crater: 26, jagged: 0.5, debris: 10, dust: 1.4, scorch: 0.7, dent: true },
  vfx: { tracer: "#cda2ff", light: "#9a6cff", muzzleFlash: 1.2, sparks: 1.2, smoke: 1.2, shells: false },
  shake: 6,
  hitStop: 0.02,
  sound: { type: "impact", pitch: 0.7, volume: 0.9 },
});
