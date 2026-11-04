// DOLLAR GUN · weapons/dollar/dollar.js
// Put your own weapon PNG at weapons/dollar/dollar.png.
// The same art is used as the projectile, scaled down in index.html.
Weapon({
  name: "Robert Loggia",
  type: "gun",
  weight: 0.4,

  damage: 30,
  knockback: 430,
  headshot: 1.35,

  fireRate: 1.2,
  ammo: 124,
  automatic: true,
  bullets: 1,
  spread: 0,
  bulletSpeed: 1850,
  bulletGravity: 35,
  range: 1500,
  recoil: 115,
  bounces: 0,

  // Draw the weapon PNG itself as a small spinning/flying projectile.
  projectileSprite: true,
  projectileSize: 20, // projectile width/height in world pixels

  sprite: {
    length: 58,
    gripX: 0.24,
    gripY: 0.72,
    muzzleX: 1.0,
    muzzleY: 0.28,
    holdDistance: 17
  },

  destruction: {
    crater: 15,
    jagged: 0.25,
    debris: 3,
    dust: 0.35,
    scorch: 0.1,
    dent: false
  },

  vfx: {
    muzzleFlash: 0.1,
    tracer: "#e6c45a",
    sparks: 0,
    smoke: 0.1,
    shells: false,
    light: "#f2cf62"
  },
  shake: 2.2,
  hitStop: 0.025,
  sound: { type: "shot", pitch: 1.25, volume: 0.65 }
});
