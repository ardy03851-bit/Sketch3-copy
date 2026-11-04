// ─────────────────────────────────────────────────────────────
//  REVOLVER  ·  weapons/gun/gun.js
//  The folder name ("gun") is the weapon id. The game loads
//  gun.png from this same folder automatically. If the PNG is
//  missing you get the pink/black "no texture" square instead.
// ─────────────────────────────────────────────────────────────
Weapon({
  name: "Revolver",
  type: "gun",              // "gun" (shoots) or "melee" (swings + slides)
  weight: 1,                // how often it is rolled at round start (higher = more common)

  // ── damage ──────────────────────────────────────────────
  damage: 34,               // per bullet (players have 100 hp)
  knockback: 520,           // push on hit (px/s)
  headshot: 1.5,            // multiplier when the bullet hits the top of the body

  // ── firing ──────────────────────────────────────────────
  fireRate: 2.6,            // shots per second
  ammo: 106,                  // shots per round (0 = infinite). When empty you shove with your fists.
  automatic: false,         // hold to keep firing
  bullets: 1,               // pellets per shot (shotgun = 6+)
  spread: 0.025,            // radians of random spread
  bulletSpeed: 2300,        // px/s
  bulletGravity: 120,       // px/s² drop (0 = laser straight)
  range: 1700,              // px before the bullet fizzles
  recoil: 210,              // pushes the shooter backwards (px/s)
  bounces: 0,               // ricochets off terrain

  // ── how the PNG is held ─────────────────────────────────
  sprite: {
    length: 62,             // on-screen length in world px (height follows the PNG ratio)
    gripX: 0.22,            // where the hand holds it, 0..1 across the PNG
    gripY: 0.72,            // 0..1 down the PNG
    muzzleX: 1.0,           // where bullets come out, 0..1 across
    muzzleY: 0.22,
    holdDistance: 18        // distance of the hand from the body centre
  },

  // ── map destruction ─────────────────────────────────────
  destruction: {
    crater: 13,             // crater radius in px (0 = no hole)
    jagged: 0.35,           // 0 round … 1 very broken edges
    debris: 9,              // chunks thrown out
    dust: 1,                // dust cloud amount 0..2
    scorch: 0.55,           // burn mark darkness 0..1
    dent: true              // also press a soft dent ring around the hole
  },

  // ── look & feel ─────────────────────────────────────────
  vfx: {
    muzzleFlash: 1.0,       // size multiplier
    tracer: "#ffd9a0",      // bullet streak colour
    sparks: 1.0,
    smoke: 1.0,
    shells: true,           // eject a casing
    light: "#ffb35c"        // colour of the flash light on the world
  },
  shake: 5,                 // screen shake on fire
  hitStop: 0.035,           // freeze-frame on hit (seconds)
  sound: { type: "shot", pitch: 1.0, volume: 0.9 },

  // ── optional scripting hooks (run on the host only) ─────
  // onImpact(e, api) { api.crater(e.x, e.y, 30); }    // e.g. explosive rounds
  // onHit(e, api)    { api.knock(e.target, 0, -900); } // launch the target upward
});
