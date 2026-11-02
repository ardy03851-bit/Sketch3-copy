// ─────────────────────────────────────────────────────────────
//  POP PISTOL  ·  weapons/pop-pistol/pop-pistol.js
//  A cheerful pocket popgun: a snappy three-shot burst that
//  rewards trigger discipline at close range.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Pop Pistol",
  type: "gun",
  rarity: "common",
  weight: 1,
  description: "Pop-pop-pop! A pocket popgun that chews through a snappy three-shot burst.",

  damage: 9,
  knockback: 240,
  headshot: 1.4,
  fireRate: 4.2,
  ammo: 36,
  automatic: false,
  burst: { count: 3, delay: 0.075 },
  spread: 0.055,
  bulletSpeed: 1750,
  bulletGravity: 80,
  range: 1250,
  recoil: 120,
  bounces: 0,

  sprite: { length: 34, gripX: 0.27, gripY: 0.72, muzzleX: 0.89, muzzleY: 0.28, holdDistance: 16 },

  destruction: { crater: 0 },
  vfx: { tracer: "#ffd0e8", light: "#ffb0dc", muzzleFlash: 0.8, sparks: 0.8, smoke: 0.6, shells: true },
  shake: 2,
  hitStop: 0.02,
  sound: { type: "shot", pitch: 1.35, volume: 0.65 },
});
