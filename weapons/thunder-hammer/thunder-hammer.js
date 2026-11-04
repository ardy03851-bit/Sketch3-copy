// ─────────────────────────────────────────────────────────────
//  THUNDER HAMMER  ·  weapons/thunder-hammer/thunder-hammer.js
//  Heavy melee weapon. Every landed hit discharges a small
//  lightning explosion around the target.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Thunder Hammer",
  type: "melee",
  rarity: "epic",
  description: "Slow, crushing swings that discharge lightning on impact.",
  weight: 1,

  damage: 55,
  knockback: 900,
  headshot: 1.0,

  swingTime: 0.4,                 // slow heavy swing ("swingSpeed 0.9")
  cooldown: 0.75,
  reach: 90,
  arc: 160,
  lunge: 320,
  deflect: true,

  sprite: { length: 110, gripX: 0.15, gripY: 0.7, muzzleX: 1.0, muzzleY: 0.3, holdDistance: 18 },
  destruction: { crater: 14, jagged: 0.7, debris: 12, dust: 1.5, scorch: 0.3, dent: true },
  vfx: { trail: "#5ac8ff", trailWidth: 1.6, sparks: 1.5, light: "#5ac8ff" },
  shake: 8,
  hitStop: 0.06,
  sound: { type: "swing", pitch: 0.7, volume: 1.0 },

  // no api.shock exists in HookAPI — fall back to a small lightning explosion
  onHit(e, api) { api.explode(e.x, e.y, 60, 15, e.shooter); }
});
