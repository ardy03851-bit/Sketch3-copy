// ============================================================
//  TOOL BOX — Build and dig. Only in The Big Wilds, in about half the matches.
//  Drop-in weapon file: the game finds every weapons/<name>/ folder by itself.
//  See weapons/gun/gun.js for every available field.
// ============================================================
Weapon({
name: "Tool Box", type: "melee", rarity: "epic",
  description: "Build walls, ladders, torches, banners, campfires, spikes, springs and TNT. Dig, fill, repair and recycle. Tab switches tab, 1-0 picks, Q/E rotates.",
  weight: 0.8,

  tool: true,                       // turns the weapon into the build tool (click = place / dig)
  tools: ["plank", "beam", "wall", "brick", "crate", "sandbag", "metal", "glass", "ladder", "fence", "pillar", "catwalk", "log", "bulb", "torch", "banner", "campfire", "spring", "spikes", "tnt", "dig", "fill", "repair", "recycle"],
  materials: 40,                    // materials per life (each piece costs 1-3)
  modes: ["expedition"],            // only in The Big Wilds
  sets: ["main", "event"],          // also shows up on the event page (see README: event content)
  roundChance: 0.5,                 // appears in about half of the matches (one guaranteed drop)

  damage: 12, knockback: 300,
  swingTime: 0.2, cooldown: 0.15, reach: 60, arc: 120, lunge: 0, deflect: false,
  destruction: { crater: 0, debris: 0, dust: 0, scorch: 0, dent: false },
  vfx: { trail: "#f3e6c8", trailWidth: 1, sparks: 0.6, light: null },
  shake: 1, hitStop: 0.02, sound: { type: "clang", pitch: 1.4, volume: 0.6 },
  sprite: { length: 64, gripX: 0.08, gripY: 0.6, holdDistance: 12 }
});
