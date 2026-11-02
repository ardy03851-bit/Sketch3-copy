// ─────────────────────────────────────────────────────────────
//  WOODPECKER  ·  weapons/woodpecker/woodpecker.js
//  A cheerful wooden SMG that ticks out rounds like a hungry
//  woodpecker. Hold the trigger and rake the tree line.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Woodpecker",
  type: "gun",
  rarity: "common",
  weight: 1,
  description: "Tap-tap-tap! A wooden SMG that ticks out rounds as fast as a hungry woodpecker.",

  damage: 7,
  knockback: 130,
  headshot: 1.3,
  fireRate: 8.5,
  ammo: 48,
  magazine: 24,
  reloadTime: 1.0,
  automatic: true,
  spread: 0.11,
  bulletSpeed: 1650,
  bulletGravity: 90,
  range: 1150,
  recoil: 60,
  bounces: 0,

  sprite: { length: 72, gripX: 0.4, gripY: 0.77, muzzleX: 0.94, muzzleY: 0.44, holdDistance: 18 },

  destruction: { crater: 0 },
  vfx: { tracer: "#ffd9a0", light: "#ffc37a", muzzleFlash: 0.9, sparks: 0.7, smoke: 0.5, shells: true },
  shake: 1.5,
  hitStop: 0.015,
  sound: { type: "shot", pitch: 1.25, volume: 0.55 },
});
