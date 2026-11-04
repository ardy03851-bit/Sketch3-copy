// ─────────────────────────────────────────────────────────────
//  POISON DART GUN  ·  weapons/poison-dart/poison-dart.js
//  Near-silent darts. The hit itself is weak — the venom does
//  the work (the engine has no poison status, so the burn DoT
//  system stands in: ~24 damage over 4 s, water won't save you).
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Poison Dart Gun",
  type: "gun",
  rarity: "rare",
  description: "Whisper-quiet darts laced with venom that eats away at the target.",
  weight: 2,

  damage: 12,                     // initial hit; venom adds the burn DoT below
  knockback: 100,
  headshot: 1.2,

  fireRate: 3.0,
  ammo: 60,
  automatic: false,
  bullets: 1,
  spread: 0.01,
  bulletSpeed: 1600,
  bulletGravity: 80,
  range: 2000,
  bounces: 0,
  recoil: 60,

  projectile: { type: "shard", size: 5, color: "#7fce4a", glow: "#5aa83a" },
  status: { burn: 4 },            // engine's DoT status used as poison (4 s)

  sprite: { length: 85, gripX: 0.25, gripY: 0.7, muzzleX: 1.0, muzzleY: 0.2, holdDistance: 18 },
  destruction: { crater: 0, jagged: 0.3, debris: 2, dust: 0.3, scorch: 0.3, dent: false },
  vfx: { muzzleFlash: 0.5, tracer: "#7fce4a", sparks: 0.8, smoke: 0.3, shells: false, light: "#5aa83a" },
  shake: 2,
  hitStop: 0.03,
  sound: { type: "shot", pitch: 1.4, volume: 0.4 },

  // poison DoT: HookAPI has no `poison` status — burn is the proxy
  onHit(e, api) { api.status(e.target, { burn: 4 }); }
});
