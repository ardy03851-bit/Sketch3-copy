// ─────────────────────────────────────────────────────────────
//  GALE GUST  ·  weapons/leafblower/leafblower.js
//  A leaf blower. Zero damage. Pure, honest wind. Blow people
//  off cliffs, into water, into your friend's crossbow shot.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Gale Gust",
  type: "gun",
  rarity: "uncommon",
  description: "Zero damage. Pure wind. Ruins everyone's positioning.",
  weight: 0.7,

  damage: 0,
  knockback: 0,
  headshot: 1,
  fireRate: 14,
  ammo: 0,                                // infinite: it's just wind
  automatic: true,
  bullets: 1,
  spread: 0.2,
  bulletSpeed: 700,
  bulletGravity: 0,
  range: 320,
  recoil: 0,
  pierce: 4,
  drag: 3,
  life: 0.5,

  projectile: { type: "orb", size: 8, color: "#cfe8d8", glow: "#f0fff5" },
  onHit(e, api) {
    const t = e.target, s = e.shooter;
    if (!t || !s) return;
    const dx = t.x - s.x, dy = t.y - s.y, d = Math.hypot(dx, dy) || 1;
    api.knock(t, dx / d * 260, dy / d * 260 - 160);   // constant gale push
  },

  sprite: { length: 100, gripX: 0.2, gripY: 0.55, muzzleX: 1.0, muzzleY: 0.45, holdDistance: 16 },
  destruction: { crater: 0, jagged: 0, debris: 0, dust: 0.8, scorch: 0, dent: false },
  vfx: { muzzleFlash: 0, tracer: "#cfe8d8", sparks: 0, smoke: 0.3, shells: false, light: null },
  shake: 0.4,
  hitStop: 0,
  sound: { type: "flame", pitch: 2.4, volume: 0.3 }
});
