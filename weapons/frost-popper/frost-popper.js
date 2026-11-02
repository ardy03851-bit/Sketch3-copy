// ─────────────────────────────────────────────────────────────
//  FROST POPPER  ·  weapons/frost-popper/frost-popper.js
//  Twin ice pellets that stack chill on a fighter. Land both
//  barrels three times and they freeze solid for a beating.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Frost Popper",
  type: "gun",
  rarity: "rare",
  weight: 1,
  description: "Twin ice pellets that stack chill — three chills freeze a fighter solid.",

  damage: 13,
  knockback: 260,
  headshot: 1.3,
  fireRate: 2.2,
  ammo: 20,
  magazine: 8,
  reloadTime: 1.05,
  bullets: 2,
  spread: 0.18,
  bulletSpeed: 1450,
  bulletGravity: 120,
  range: 1300,
  recoil: 140,
  bounces: 0,
  status: { chill: 1 },

  sprite: { length: 60, gripX: 0.33, gripY: 0.74, muzzleX: 0.86, muzzleY: 0.38, holdDistance: 17 },
  projectile: { color: "#dff4ff", glow: "#bfeaff", size: 5, spin: 0 },

  destruction: { crater: 0 },
  vfx: { tracer: "#bfeaff", light: "#9fdcf5", muzzleFlash: 0.9, sparks: 0.9, smoke: 0.4, shells: true },
  shake: 2.5,
  hitStop: 0.025,
  sound: { type: "shot", pitch: 1.5, volume: 0.6 },
});
