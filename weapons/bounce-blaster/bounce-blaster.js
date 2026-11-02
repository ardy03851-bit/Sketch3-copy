// ─────────────────────────────────────────────────────────────
//  BOUNCE BLASTER  ·  weapons/bounce-blaster/bounce-blaster.js
//  A rubbery ricochet cannon: fat bouncy slugs that ricochet
//  off terrain up to four times. Bank shots around corners.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Bounce Blaster",
  type: "gun",
  rarity: "rare",
  weight: 1,
  description: "Rubber slugs that ricochet off walls — bank your shots around corners.",

  damage: 17,
  knockback: 380,
  headshot: 1.3,
  fireRate: 1.9,
  ammo: 16,
  magazine: 5,
  reloadTime: 1.1,
  spread: 0.04,
  bulletSpeed: 1250,
  bulletGravity: 150,
  range: 1700,
  recoil: 180,
  bounces: 4,
  bounciness: 1.0,
  bulletTrail: true,

  sprite: { length: 58, gripX: 0.31, gripY: 0.74, muzzleX: 0.89, muzzleY: 0.37, holdDistance: 18 },
  projectile: { color: "#ffd98c", glow: "#fff3d6", size: 7, spin: 4 },

  destruction: { crater: 0 },
  vfx: { tracer: "#ffe08a", light: "#ffd76a", muzzleFlash: 1.0, sparks: 1.0, smoke: 0.4, shells: false },
  shake: 3,
  hitStop: 0.03,
  sound: { type: "shot", pitch: 0.9, volume: 0.8 },
});
