// ─────────────────────────────────────────────────────────────
//  BEEHIVE CHUCKER  ·  weapons/beehive/beehive.js
//  Lobs a whole beehive in a lazy arc. It bursts on impact,
//  and the sting DoT keeps ticking long after the buzz fades.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Beehive Chucker",
  type: "gun",
  rarity: "rare",
  description: "Lobs a hive that bursts on impact. Stings keep ticking afterwards.",
  weight: 0.7,

  damage: 16,
  knockback: 320,
  headshot: 1,
  fireRate: 0.8,
  ammo: 14,
  automatic: false,
  bullets: 1,
  spread: 0.03,
  bulletSpeed: 850,
  bulletGravity: 900,
  range: 1400,
  recoil: 180,
  bounces: 0,
  drag: 0.4,
  life: 2.4,

  projectile: { type: "orb", size: 12, color: "#c8963c", glow: "#ffd98a" },
  status: { burn: 3.5 },                 // stings: the DoT stands in for venom
  onImpact(e, api) { api.explode(e.x, e.y, 60, 6, e.shooter); },

  sprite: { length: 84, gripX: 0.22, gripY: 0.68, muzzleX: 1.0, muzzleY: 0.4, holdDistance: 16 },
  destruction: { crater: 8, jagged: 0.8, debris: 6, dust: 0.8, scorch: 0, dent: false },
  vfx: { muzzleFlash: 0.2, tracer: "#ffd98a", sparks: 1, smoke: 0.8, shells: false, light: "#ffd98a" },
  shake: 3,
  hitStop: 0.04,
  sound: { type: "shot", pitch: 0.9, volume: 0.6 }
});
