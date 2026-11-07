// ─────────────────────────────────────────────────────────────
//  SKETCH-LASH  ·  weapons/whip/whip.js
//  A long ink brush on a leather whip. Huge reach, thin arc,
//  and a crack that sends people sailing.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Sketch-Lash",
  type: "melee",
  rarity: "rare",
  description: "Enormous reach, razor-thin arc, brutal knockback.",
  weight: 0.7,

  damage: 20,
  knockback: 900,
  propDamage: 2,
  swingTime: 0.24,
  cooldown: 0.5,
  reach: 165,
  arc: 42,
  lunge: 0,
  deflect: false,

  destruction: { crater: 0, jagged: 0, debris: 0, dust: 0.4, scorch: 0, dent: false },
  vfx: { trail: "#1f1c24", trailWidth: 1.2, sparks: 0.5, light: null },
  shake: 2,
  hitStop: 0.04,
  sound: { type: "swing", pitch: 1.9, volume: 0.55 },
  sprite: { length: 130, gripX: 0.04, gripY: 0.5, holdDistance: 8 }
});
