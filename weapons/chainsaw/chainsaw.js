// ─────────────────────────────────────────────────────────────
//  DOODLEBUZZ  ·  weapons/chainsaw/chainsaw.js
//  A chainsaw. Hold the button and it just keeps buzzing.
//  Shreds terrain, trees and anyone who stands still.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Doodlebuzz",
  type: "melee",
  rarity: "epic",
  description: "Hold to keep sawing. Chews through terrain, trees and people.",
  weight: 0.55,

  damage: 9,
  knockback: 140,
  propDamage: 5,
  swingTime: 0.12,
  cooldown: 0.05,
  reach: 88,
  arc: 60,
  lunge: 60,
  deflect: false,

  destruction: { crater: 7, jagged: 0.95, debris: 4, dust: 1.2, scorch: 0.15, dent: true },
  vfx: { trail: "#c9b48a", trailWidth: 2.2, sparks: 1.6, light: null },
  shake: 2.5,
  hitStop: 0.008,
  sound: { type: "swing", pitch: 1.6, volume: 0.5 },
  sprite: { length: 108, gripX: 0.08, gripY: 0.5, holdDistance: 12 }
});
