// ─────────────────────────────────────────────────────────────
//  POWER CHORD  ·  weapons/guitar/guitar.js
//  Smashing an air-guitar-shaped-actual-guitar sends out a
//  shockwave that knocks everyone nearby off their feet.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Power Chord",
  type: "melee",
  rarity: "epic",
  description: "Every hit lands with a shockwave that launches the whole mosh pit.",
  weight: 0.6,

  damage: 30,
  knockback: 620,
  propDamage: 4,
  swingTime: 0.34,
  cooldown: 0.62,
  reach: 96,
  arc: 140,
  lunge: 240,
  deflect: false,

  destruction: { crater: 10, jagged: 0.6, debris: 6, dust: 1.4, scorch: 0, dent: true },
  vfx: { trail: "#c9a25a", trailWidth: 2, sparks: 1.4, light: "#ffd36b" },
  shake: 6,
  hitStop: 0.07,
  sound: { type: "swing", pitch: 0.7, volume: 1 },
  onHit(e, api) { api.explode(e.x, e.y, 110, 10, e.shooter); },  // stage dive
  sprite: { length: 118, gripX: 0.1, gripY: 0.55, holdDistance: 14 }
});
