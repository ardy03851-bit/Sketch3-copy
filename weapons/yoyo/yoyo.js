// ─────────────────────────────────────────────────────────────
//  WALK THE DOG  ·  weapons/yoyo/yoyo.js
//  A heavy yo-yo on a long string. Long reach, always comes
//  back to your hand. Deflects bullets like a tiny shield.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Walk the Dog",
  type: "melee",
  rarity: "uncommon",
  description: "A yo-yo with surprising reach. Doubles as a bullet shield.",
  weight: 0.8,

  damage: 24,
  knockback: 480,
  propDamage: 3,
  swingTime: 0.22,
  cooldown: 0.34,
  reach: 128,
  arc: 90,
  lunge: 140,
  deflect: true,

  destruction: { crater: 5, jagged: 0.5, debris: 3, dust: 0.5, scorch: 0, dent: true },
  vfx: { trail: "#7ec8f0", trailWidth: 1.6, sparks: 0.6, light: null },
  shake: 2,
  hitStop: 0.03,
  sound: { type: "swing", pitch: 1.3, volume: 0.6 },
  sprite: { length: 62, gripX: 0.9, gripY: 0.5, holdDistance: 10 }
});
