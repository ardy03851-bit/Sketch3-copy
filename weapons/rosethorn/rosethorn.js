// ─────────────────────────────────────────────────────────────
//  ROSETHORN SABRE  ·  weapons/rosethorn/rosethorn.js
//  MYTHIC. A duelist's blade. Chain the rose dance: the third
//  petal lands harder, drinks life, and blooms a shockwave.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Rosethorn Sabre",
  type: "melee",
  rarity: "mythic",
  weight: 1,
  description: "Chain the rose dance — every third petal drinks life and blooms a shockwave.",

  damage: 26,
  knockback: 640,
  swingTime: 0.22,
  cooldown: 0.3,
  reach: 96,
  arc: 150,
  lunge: 520,
  deflect: true,
  combo: { hits: 3, window: 0.85, damageMult: [1, 1.15, 1.75] },
  lifesteal: 0.22,
  shockwave: { radius: 130, damage: 22, knockback: 820 },

  sprite: { length: 65, gripX: 0.19, gripY: 0.53, muzzleX: 0.96, muzzleY: 0.47, holdDistance: 14 },

  destruction: { crater: 0 },
  vfx: { trail: "#ff9ad0", trailWidth: 1.2, sparks: 1.2, light: "#ff9ad0" },
  shake: 4,
  hitStop: 0.045,
  sound: { type: "swing", pitch: 1.1, volume: 0.9 },
});
