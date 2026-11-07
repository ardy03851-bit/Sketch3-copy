// ─────────────────────────────────────────────────────────────
//  PIZZA CUTTER  ·  weapons/pizzacutter/pizzacutter.js
//  Comically fast little rolling blade. Each hit is tiny —
//  but you can land about nine of them a second.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Pizza Cutter",
  type: "melee",
  rarity: "common",
  description: "Barely hurts. Attacks ridiculously fast. Great with a push.",
  weight: 1.1,

  damage: 7,
  knockback: 90,
  propDamage: 2,
  swingTime: 0.08,
  cooldown: 0.08,
  reach: 62,
  arc: 70,
  lunge: 80,
  deflect: false,

  destruction: { crater: 2, jagged: 0.8, debris: 1, dust: 0.4, scorch: 0, dent: false },
  vfx: { trail: "#e8e0cf", trailWidth: 1.4, sparks: 0.4, light: null },
  shake: 0.8,
  hitStop: 0.005,
  sound: { type: "swing", pitch: 2.2, volume: 0.35 },
  sprite: { length: 58, gripX: 0.1, gripY: 0.5, holdDistance: 10 }
});
