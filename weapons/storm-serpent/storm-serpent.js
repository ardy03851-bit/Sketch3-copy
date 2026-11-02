// ─────────────────────────────────────────────────────────────
//  STORM SERPENT  ·  weapons/storm-serpent/storm-serpent.js
//  MYTHIC. Two hunting sparks leap out and chase fighters
//  across the arena, delivering a shocking bite.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Storm Serpent",
  type: "gun",
  rarity: "mythic",
  weight: 1,
  description: "Loose two hunting sparks that chase fighters and jolt them with static.",

  damage: 15,
  knockback: 340,
  headshot: 1.25,
  fireRate: 1.6,
  ammo: 14,
  magazine: 6,
  reloadTime: 1.3,
  bullets: 2,
  spread: 0.55,
  bulletSpeed: 820,
  bulletGravity: 0,
  homing: 3,
  life: 2.4,
  range: 1900,
  recoil: 100,
  bounces: 0,
  status: { shock: 1.4 },

  sprite: { length: 63, gripX: 0.22, gripY: 0.78, muzzleX: 0.98, muzzleY: 0.24, holdDistance: 19 },
  projectile: { color: "#9fe0e8", glow: "#9ff2ff", size: 6, spin: 6 },

  destruction: { crater: 0 },
  vfx: { tracer: "#c9f2ff", trail: "#9fdcff", trailWidth: 1.2, light: "#9fdcff", muzzleFlash: 1.1, sparks: 1.3, smoke: 0, shells: false },
  shake: 3,
  hitStop: 0.025,
  sound: { type: "shot", pitch: 1.3, volume: 0.75 },
});
