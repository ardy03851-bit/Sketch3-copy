// ─────────────────────────────────────────────────────────────
//  POCKET JAVELIN  ·  weapons/javelin/javelin.js
//  A proper throwing spear. Slow to throw, pins whatever it
//  hits to the wall behind them.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Pocket Javelin",
  type: "gun",
  rarity: "uncommon",
  description: "One spear, one throw, one very big number. Pins to walls.",
  weight: 0.75,

  damage: 52,
  knockback: 420,
  headshot: 1.6,
  fireRate: 0.55,
  ammo: 9,
  automatic: false,
  bullets: 1,
  spread: 0.005,
  bulletSpeed: 1900,
  bulletGravity: 300,
  range: 2400,
  recoil: 260,
  pierce: 2,

  projectile: { type: "shard", size: 9, color: "#b08048", glow: "#e8d8b0" },

  sprite: { length: 120, gripX: 0.08, gripY: 0.5, muzzleX: 1.0, muzzleY: 0.5, holdDistance: 12 },
  destruction: { crater: 8, jagged: 0.7, debris: 4, dust: 0.6, scorch: 0.2, dent: true },
  vfx: { muzzleFlash: 0, tracer: "#d8c090", sparks: 0.8, smoke: 0.2, shells: false, light: null },
  shake: 3,
  hitStop: 0.06,
  sound: { type: "shot", pitch: 0.6, volume: 0.8 }
});
