// ─────────────────────────────────────────────────────────────
//  MAGNET MORTAR  ·  weapons/magnetgun/magnetgun.js
//  Fires a charged slug that yanks whoever it hits straight
//  back toward you. Set them up, knock them out.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Magnet Mortar",
  type: "gun",
  rarity: "rare",
  description: "Pulls whoever it hits straight toward you. Combo starter.",
  weight: 0.7,

  damage: 12,
  knockback: 60,
  headshot: 1,
  fireRate: 1.1,
  ammo: 30,
  automatic: false,
  bullets: 1,
  spread: 0.02,
  bulletSpeed: 1500,
  bulletGravity: 0,
  range: 1600,
  recoil: 140,

  projectile: { type: "orb", size: 9, color: "#9fb8e8", glow: "#d0e0ff", trail: "sparkle" },
  onHit(e, api) {
    const t = e.target, s = e.shooter;
    if (!t || !s) return;
    const dx = s.x - t.x, dy = s.y - t.y, d = Math.hypot(dx, dy) || 1;
    api.knock(t, dx / d * 1400, dy / d * 1400 - 300);   // reel them in
  },

  sprite: { length: 92, gripX: 0.16, gripY: 0.64, muzzleX: 1.0, muzzleY: 0.5, holdDistance: 16 },
  destruction: { crater: 4, jagged: 0.4, debris: 2, dust: 0.4, scorch: 0.2, dent: false },
  vfx: { muzzleFlash: 0.7, tracer: "#9fb8e8", sparks: 1, smoke: 0.4, shells: true, light: "#8fa8e0" },
  shake: 3,
  hitStop: 0.04,
  sound: { type: "laser", pitch: 0.8, volume: 0.6 }
});
