# Inkbrawl

A small hand-drawn party brawler for iPad (and anything with a browser).
Every round, every player is handed **one random weapon**. No abilities, no perks, no loadouts: guns shoot, swords swing and slide. Last scribble standing wins the round, first to the target score wins the match.

The whole game is three things:

```
inkbrawl/
├── README.md          ← this file
├── index.html         ← the core game (engine, UI, art, sound)
├── expansion.js       ← biomes, water, weather, props, new weapon mechanics, big-map mode, quality scaling
├── wardrobe.js        ← the wardrobe: accessories + real cloth physics (capes, scarves)
├── manifest.webmanifest ← home-screen app name, icon, standalone window
├── sw.js              ← the service worker (offline home-screen app)
├── icon-*.png, apple-touch-icon.png ← the app icon (regenerate with tools/make-icon.py)
├── tools/             ← make-manifest.py (for hosts without folder listings), make-icon.py
└── weapons/           ← one folder per weapon, picked up automatically
    ├── gun/
    │   ├── gun.png
    │   └── gun.js
    └── sword/
        ├── sword.png
        └── sword.js
```

You never edit `index.html` to add a weapon. Drop a new folder into `weapons/` and it is in the game.

---

## Contents

1. [Running it](#running-it)
2. [Playing](#playing)
3. [Add it to your home screen](#add-it-to-your-home-screen)
4. [Offline play (vs bots)](#offline-play-vs-bots)
5. [Controls](#controls)
6. [Round rules](#round-rules)
7. [Adding a weapon](#adding-a-weapon)
8. [Weapon script reference](#weapon-script-reference)
9. [Scripting hooks](#scripting-hooks)
10. [PNG rules and the no-texture fallback](#png-rules-and-the-no-texture-fallback)
11. [Map destruction](#map-destruction)
12. [Art style guide](#art-style-guide)
13. [VFX and lighting](#vfx-and-lighting)
14. [UI and icons](#ui-and-icons)
15. [How the code is laid out](#how-the-code-is-laid-out)
16. [Troubleshooting](#troubleshooting)
17. [Expansion: worlds, modes and weapon mechanics](#expansion-worlds-modes-and-weapon-mechanics)
18. [Content folders at a glance](#content-folders-at-a-glance)
19. [Adding weapons (the full guide)](#adding-weapons-the-full-guide)
20. [Adding biomes](#adding-biomes)
21. [The main menu folder](#the-main-menu-folder)
22. [The wardrobe: accessories and cloth](#the-wardrobe-accessories-and-cloth)
23. [Setting up a game: flat or normal maps](#setting-up-a-game-flat-or-normal-maps)
24. [Building in War mode](#building-in-war-mode)
25. [The Big Overhaul update](#the-big-overhaul-update)

---

## Running it

The game needs to be opened **through a web address**, not by double-tapping the file, because the browser only lets a page look inside the `weapons/` folder when it was served by a web server. There are three ways the game finds weapons, tried in this order:

| # | How weapons are found | When it is used |
|---|---|---|
| 1 | **Folder listing** — reads the server's directory page for `weapons/` and each sub-folder | Any simple static server that shows folder listings (Python, `npx serve`, Apache, nginx with `autoindex on`, most "local web server" iPad apps) |
| 2 | **GitHub repository** — asks the GitHub API what's inside `weapons/` | The game is hosted on GitHub Pages (`<you>.github.io/<repo>/`) — detected automatically |
| 3 | **Pick weapons folder** button | Fallback when neither works: on the title screen tap the weapons badge, then *Pick weapons folder* and select the `weapons` folder from Files |

If nothing is found you still get **Fists**, so the game always runs.

### Option A — GitHub Pages (best for hosting from an iPad)

1. Create a public GitHub repository and upload `README.md`, `index.html` and the `weapons` folder (the GitHub website and the Working Copy app both work on iPad).
2. Repository → Settings → Pages → *Deploy from a branch* → `main` / root.
3. Open `https://<your-username>.github.io/<repo>/` on your iPad. Weapons load from the repository automatically.
4. Add a weapon later? Upload the new folder; refresh the page. That's it.

If the site lives somewhere unusual you can point the game at the repo directly:
`index.html?gh=owner/repo@branch/sub/folder` (branch and sub-folder are optional).

### Option B — any computer on your network

```bash
cd inkbrawl
python3 -m http.server 8000
```

Then open `http://<computer-ip>:8000` on the iPad. Python's server shows folder listings, which is all the game needs.

### Option C — local server app on the iPad

Any iPad web-server app that serves a folder **with directory listings turned on** works the same way as Option B.

> Inkbrawl is **offline-only**: every match is you versus bots, on your device. Nothing connects anywhere except to load the game files themselves.

---

## Playing

Title screen:

- **Your name / character** — remembered with a small cookie.
- **Play (offline, vs bots)** — opens the game setup (mode, world, bots, rules). Press *Start* and you are in.
- Badges at the bottom show how many weapons were found.

In-game, the **pause button** (top left) shows the player list, the bot count (you can add or remove bots mid-match), settings, *Resume* and *Leave*.

---

## Add it to your home screen

Inkbrawl is a proper installable web app, not just a page:

- **iPad / iPhone (Safari)** — open the site, tap *Share*, then *Add to Home Screen*. It opens full-screen with its own icon (the little ink splat) and keeps working with no network at all.
- **Android (Chrome)** — tap the *Install app* prompt (or *Add to Home screen* from the menu).
- No store, no account. The files that make this work are `manifest.webmanifest` (name, icon, standalone window), the `icon-*.png` / `apple-touch-icon.png` icons and `sw.js` (the service worker that keeps a copy of the game for offline play).

The service worker is **network-first**: when a new build is deployed, players get it on the very next launch (no double-refresh needed), and the cached copy is only used when offline. Bump the `CACHE` version at the top of `sw.js` when you deploy so old caches are cleaned up.

---

## Offline play (vs bots)

Inkbrawl is **100% offline and bots-only**. There is no multiplayer, no room
list, no server browser, no room codes and no invite links — those were
removed along with the netcode. Every match runs entirely on your device:

```
   ┌─────────────────────────────────────────────────┐
   │  YOUR DEVICE                                     │
   │  the one authoritative game:                      │
   │  damage, kills, rounds, bots, craters, weapon rolls │
   └─────────────────────────────────────────────────┘
```

- **Bots** are your opponents. Pick how many (0–7 in the arena, up to 100 in The Big Wilds) and their skill in the setup screen, and add or remove them mid-match from the pause menu.
- **Everything is local.** Hits, damage, kills, crater carving and weapon rolls are decided on your device, so the holes are always exactly where you blew them.
- **Nothing leaves your device.** No accounts, no servers, no telemetry — the only network use is loading the game files (and the service worker caches those for offline play).
- **Wake Lock.** The game requests a screen Wake Lock during a match so the iPad doesn't sleep mid-brawl.

---

## Controls

### iPad / touch

| Control | What it does |
|---|---|
| **Left stick** (appears where your thumb lands on the left half) | Move. Flick it **up** to jump, flick up again in the air to double jump. Pull down to drop faster. |
| **Jump button** (right, above the attack stick) | Jump / double jump. |
| **Right stick** | Drag to aim (a dotted aim line appears), **release to attack**. |
| **Tap** on the right side | Quick attack, auto-aimed at the nearest visible enemy. |
| Automatic weapons | Hold the right stick out at the edge to keep firing. |
| **Pause** (top left) | Player list, bot count, settings, resume, leave. |

The sticks float: they appear under your thumb wherever you put it, so there is no "missing the button". Everything is sized for thumbs and nothing important sits under your palms.

### Keyboard and mouse

| Key | Action |
|---|---|
| `A` `D` / arrows | Move |
| `W` / `Space` / `↑` | Jump, double jump |
| `S` / `↓` | Drop faster |
| Mouse | Aim |
| Click / `F` | Attack |
| `Esc` | Pause |

---

## Round rules

1. **Warm-up** — while fewer than 2 players are in, you can run around and practise.
2. **Countdown** — a new map is drawn, everybody spawns, everybody is given **one random weapon** from the `weapons` folder (weighted by each weapon's `weight`).
3. **Fight** — 100 hp each. Guns have the ammo their script gives them; when it runs out you are down to **Fists** (a weak shove). There are no pickups and no abilities.
4. Falling off the map kills you. If someone knocked you off in the last few seconds, they get the credit.
5. **Sudden death** — if the round lasts 60 seconds, "the ink dries" and everyone loses a little health every half second until somebody wins. (Health, round time and sudden death can all be changed in **Rules & customisation**, see below.)
6. The last one alive scores a point. First to the target (3, 5 or 10) is champion, then scores reset and it starts again.

---

## Adding a weapon

1. Make a folder in `weapons/`. **The folder name is the weapon id**, e.g. `weapons/shotgun/`.
2. Put a PNG in it, ideally named like the folder: `weapons/shotgun/shotgun.png`.
3. Put a script in it named like the folder: `weapons/shotgun/shotgun.js`.
4. Refresh the game. The weapon is in the random pool.

You never need to touch `index.html`. On GitHub Pages the game asks GitHub for the whole repository tree in one request (cached for 10 minutes), so every folder in `weapons/` is found automatically. Running `python3 tools/make-manifest.py` also refreshes `weapons/manifest.json`, the fallback used when GitHub can't be reached.

Name matching is forgiving: if there is no `shotgun.js`/`shotgun.png`, the first `.js`/`.png` inside the folder is used. Missing script → default gun stats. Missing PNG → the no-texture square.

A minimal script:

```js
Weapon({
  name: "Shotgun",
  type: "gun",
  damage: 14,
  bullets: 7,
  spread: 0.16,
  ammo: 3,
  fireRate: 1.1,
  recoil: 700,
  sprite: { length: 72, gripX: 0.25, gripY: 0.65, muzzleX: 1, muzzleY: 0.3 },
  destruction: { crater: 8, debris: 4 }
});
```

Anything you leave out is filled in with sensible defaults. The script is plain JavaScript: you call `Weapon({...})` once with an object.

---

## Weapon script reference

### Common fields

| Field | Type | Default | Meaning |
|---|---|---|---|
| `name` | text | folder name | Shown on the weapon card and kill feed |
| `type` | `"gun"` / `"melee"` | `"gun"` | Shoots bullets, or swings and slides |
| `weight` | number | `1` | How often it's rolled. `2` = twice as common, `0` = never rolled |
| `damage` | number | gun 25 / melee 40 | Damage per bullet or per swing hit (players have 100 hp) |
| `knockback` | px/s | gun 400 / melee 600 | How hard a hit pushes |
| `shake` | number | `4` | Screen shake strength when used |
| `hitStop` | seconds | `0.04` | Tiny freeze-frame on hit — makes hits feel heavy |
| `sound` | `{ type, pitch, volume }` | | `type`: `"shot"` for guns, `"swing"` or `"punch"` for melee; `pitch` makes it bigger (lower) or smaller (higher). All sounds are synthesised, no audio files |

### Gun fields (`type: "gun"`)

| Field | Default | Meaning |
|---|---|---|
| `fireRate` | `3` | Shots per second |
| `ammo` | `8` | Shots per round. `0` = unlimited. When empty → Fists |
| `automatic` | `false` | Keep firing while held |
| `bullets` | `1` | Pellets per shot |
| `spread` | `0.03` | Random spread in radians |
| `bulletSpeed` | `2000` | px/s |
| `bulletGravity` | `0` | Bullet drop (px/s²) |
| `range` | `1600` | Distance before the bullet fizzles |
| `recoil` | `200` | Pushes the shooter backwards (rocket-jumping is allowed) |
| `bounces` | `0` | Ricochets off the ground |
| `headshot` | `1.5` | Multiplier for hits on the top of the body |

### Melee fields (`type: "melee"`)

| Field | Default | Meaning |
|---|---|---|
| `swingTime` | `0.25` | Seconds the blade is active |
| `cooldown` | `0.45` | Seconds between swings |
| `reach` | `80` | px from body centre |
| `arc` | `140` | Degrees covered by the swing |
| `lunge` | `500` | Forward slide speed when swinging (the "slide") |
| `deflect` | `false` | Swings knock bullets out of the air |
| `uses` | `0` | Swings per round. `0` = unlimited |

### `sprite` — how the PNG is held

| Field | Meaning |
|---|---|
| `length` | On-screen length in world pixels. Height follows the PNG's aspect ratio |
| `gripX`, `gripY` | Where the hand holds it, `0..1` across / down the PNG |
| `muzzleX`, `muzzleY` | Guns only — where bullets and the flash come out, `0..1` |
| `holdDistance` | Distance of the hand from the body centre |

### `destruction` — what it does to the map

| Field | Range | Meaning |
|---|---|---|
| `crater` | px | Hole radius. `0` = no hole |
| `jagged` | 0..1 | 0 = clean round bite, 1 = broken, chunky edge |
| `debris` | count | Chunks of ground thrown out (they bounce, settle, and fall again if the ground under them is blown away) |
| `dust` | 0..2 | Dust cloud amount |
| `scorch` | 0..1 | Darkness of the burn mark left on the ground |
| `dent` | true/false | Also press a soft dented ring around the hole |

### `vfx` — look and feel

| Field | Meaning |
|---|---|
| `muzzleFlash` | Flash size multiplier |
| `tracer` | Bullet streak colour |
| `sparks`, `smoke` | Amount multipliers |
| `shells` | Eject a casing that bounces on the ground |
| `light` | Colour of the flash of light thrown onto the world |
| `trail`, `trailWidth` | Melee only — colour and thickness of the swing arc |

---

## Scripting hooks

For anything more interesting than numbers, add functions to the object. They run **on the host only** (so everyone sees the same result) and receive an `api`:

```js
Weapon({
  name: "Boom Stick",
  type: "gun",
  damage: 10,
  ammo: 2,
  destruction: { crater: 0 },

  onImpact(e, api) {            // a bullet hit the ground
    api.explode(e.x, e.y, 120, 60, e.shooter);
  },
  onHit(e, api) {               // a bullet or swing hit a player
    api.knock(e.target, 0, -900);   // launch them upwards
  },
  onFire(e, api) {              // the trigger was pulled
    // e.x, e.y, e.angle, e.shooter
  }
});
```

| `api.` | Does |
|---|---|
| `crater(x, y, r, { jagged, scorch, dent, debris, dust })` | Blow a hole in the map |
| `explode(x, y, radius, damage, byId)` | Crater + falloff damage + knockback to everyone in range |
| `damage(playerId, amount, byId)` | Hurt a player |
| `knock(playerId, vx, vy)` | Push a player |
| `players()` | List of `{ id, x, y, hp, alive }` |

Event fields: `onImpact` → `x, y, shooter`; `onHit` → `x, y, target, shooter`; `onFire` → `x, y, angle, shooter`. Errors inside hooks are caught so a broken script can't crash a match.

---

## PNG rules and the no-texture fallback

- **Draw the weapon facing right**, handle on the left, business end on the right. The game flips it when you face left.
- Transparent background. Any size; around 400–800 px wide looks crisp on Retina screens.
- Draw it like the rest of the game: a confident dark outline, flat fills, one soft gradient for shine. It's the one place the game allows real detail.
- After adding it, tune `sprite.gripX/gripY` so the hand sits on the handle, and `muzzleX/muzzleY` so bullets leave the barrel.
- **No PNG?** The weapon still works and is drawn as the classic pink-and-black checkerboard **no-texture square**, so you can test a script before the art exists. The weapons badge on the title screen lists any missing files.

---

## Map destruction

The ground is a grid of 4 px cells, drawn into a high-resolution paper texture.

- **Craters** are carved with a noisy, seeded outline (`jagged`) so every hole is a slightly different bite.
- **Dents** press a ring around the hole down a little so the surface looks pushed in, not just cut.
- **Scorch** and **ink stains** are painted onto a decal layer inside the ground and stay for the round.
- **Debris** chunks take the colour of the layer they came from, bounce, roll, come to rest, and fall again if the ground underneath them is destroyed later.
- **Dust** rolls out low along the surface.
- Islands can be cut through completely. Floating bits stay where they are (it's a drawing), but you can absolutely dig the ground out from under someone.
- Every crater is an event from the host with its own seed, so all players carve exactly the same shape. Late joiners receive the list of craters and replay them.
- Each round draws a fresh map from a seed, in one of four colour themes (Dust, Slate, Moss, Ember).

---

## Art style guide

The game should look like **a page from a sketchbook that has started moving**. Simple, warm, a little imperfect, never childish.

### Shapes

- **Every model is one or two shapes.** A player is a single rounded squircle "bean" plus a small round hand. Islands are one blob with a grassy/dusty lip.
- **No faces.** Characters have no eyes, mouth or details. Personality comes from movement: squash when landing, stretch when jumping, lean when running, a wobble when hit.
- Detail is reserved for **weapon PNGs**. Everything else gets detail only through a gradient.

### Lines

- Outlines are **dark warm ink** (`#1f1c24`), never pure black.
- Lines are **not perfectly straight**: every outline is slightly wobbly and re-drawn a few times a second ("line boil"), like an animation drawn frame by frame.
- Outlines are **divided** — the stroke breaks and overlaps a little in places instead of being one perfect closed loop.

### Fills

- Fills are **misregistered**: the colour is offset a couple of pixels from the outline and sometimes spills outside it, like a print or a quick marker fill.
- Colours are **flat with one gradient** — lighter at the top where the light hits, deeper at the bottom.
- A faint paper grain sits over everything.

### Palette

| Role | Colour |
|---|---|
| Ink | `#1f1c24` |
| Paper | `#f6eedf` |
| Soft ink (labels) | `#5b5360` |
| Players | red `#e0533d`, teal `#2f9a8f`, mustard `#e8a33a`, violet `#6b55c7`, blue `#3f78c9`, pink `#d9578f`, green `#6aa84f`, brown `#8a6a4f` |

Skies are soft two-tone gradients with a pale sun and drifting paper-cut clouds, with two layers of hills behind for depth.

### Type

- **Shantell Sans** (a marker-style handwriting font, loaded from Google Fonts), heavy weights for titles and buttons.
- Small labels are uppercase with letter-spacing.

---

## VFX and lighting

The rule: **effects are drawn, short, and heavy** — like ink, chalk and paper, not glowing cartoon stars.

- **Muzzle flash**: a sharp, jagged ink-outlined burst that lasts a couple of frames, plus a warm light that briefly lights the ground and players nearby.
- **Tracers**: thin, fast streaks that fade from the tail.
- **Impacts**: a quick white shock ring, sparks that bounce off the ground, dust, debris, and a scorch mark that stays.
- **Hits**: ink splatter in the victim's colour (drops fly, land and stain the ground), a hit ring, a small damage number in hand-drawn type, a frame of hit-stop and a bit of screen shake.
- **Swings**: a crescent trail that tapers and fades, matching the blade's arc.
- **Death**: the character bursts into a big ink splash.
- **Lighting**: a soft directional light from the sun side (lighter tops, darker bottoms on everything), contact shadows under players, a subtle vignette, plus temporary point lights from flashes.
- Camera shake is "trauma" based (smooth, decays quickly) — punchy without being nauseating.
- **Adaptive quality**: if the frame rate drops, the game reduces particle counts and resolution automatically, so older iPads stay smooth.

---

## UI and icons

- Panels are paper cards with wobbly hand-drawn borders and a hard offset ink shadow.
- Buttons have the same misregistered fill as the characters, press down when tapped, and wiggle slightly on hover.
- Icons are inline SVG line drawings run through a "roughen" filter so they look hand-inked (flag, magnifier, play, back, refresh, copy, link, crown, people, skull, crosshair, bot, door, pause).
- In-game HUD: score chips across the top (dimmed when dead), weapon card at the bottom with the weapon PNG, ammo pips and health bar, kill feed top right, big hand-lettered banners for "Round 3", "Fight", "You win".

---

## How the code is laid out

`index.html` is organised into numbered sections:

1. **Styles** — palette, paper UI, buttons, HUD, touch controls.
2. **Markup** — SVG icon set and the screens (title, weapons, setup, settings, pause, HUD).
3. **Core** — config, themes, weapon discovery (`discoverWeapons`, `parseWeaponScript`, `normalizeWeapon`), terrain grid, map generator, crater carving.
4. **World** — players, physics, bullets, particles, lights, synth audio, renderer.
5. **Game** — input, attacks, local match authority (`hostAttack`, `hostDamage`, `hostKill`), rounds, bots. There is no netcode: the game is offline-only.
6. **UI + loop** — menus, HUD, fixed 60 Hz simulation step, rendering, boot.

For automated testing the page exposes `window.render_game_to_text()` (a JSON summary of the game state) and `window.advanceTime(ms)`.

No external scripts are loaded from CDNs. Besides `index.html`, the engine is split into `expansion.js` (maps, water, biome API), `weather.js` (weather registry), `world.js` (props, art), `build.js`, `modes.js` (rules, teams, War), `content.js` (folder loading), `menu.js` and `ui3d.js` (3D HUD, scoreboard, victory scene).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "0 weapons" / only Fists | The page isn't being served with folder listings. Use GitHub Pages, `python3 -m http.server`, or tap the weapons badge → *Pick weapons folder*. |
| A weapon shows a pink/black square | Its PNG is missing or named differently. The weapons screen lists what was found. |
| A weapon uses odd stats | Its script failed to parse. Open the weapons screen to see the error. |
| A biome (world) is missing | Folder discovery failed — the game falls back to a built-in list of biome folders and fetches each script directly. Check the browser console. |
| No sound | Tap the screen once; iPad only allows audio after a touch. Check the silent switch. |
| Laggy on an old iPad | Close other tabs. The game lowers its own quality automatically. |


## Performance pass (Ground Hit + Bullet Trails)

- Terrain damage now queues small, spatially separate dirty regions instead of merging distant hits into one oversized rebuild. Only three terrain patches are composited per animation frame; collision-grid changes remain immediate.
- Hit-region terrain compositing uses reusable local canvases rather than full-map temporary layers. Full-resolution terrain art is retained.
- Bullet tracers use a curved, multi-pass line with an ink edge, warm body, pale core, and small direction tick without allocating a new gradient for every bullet each frame.
- Active particles are capped with single-particle eviction to avoid occasional large array-splice spikes.

Syntax validation has been run; actual frame-time measurements and bot-match playtesting are still required to confirm device-specific performance.


---

## Expansion: worlds, modes and weapon mechanics

Everything in this section lives in `expansion.js`, loaded after the core script. It replaces or wraps core functions, so `index.html` stays readable.

### Modes

| Mode | Map | Notes |
|---|---|---|
| Classic arena | 1600 × 1000, whole map on screen | Original rules, 60 s rounds |
| The Big Wilds (expedition) | the classic map ×4 (or ×6 / ×9), follow camera | 150 s rounds, minimap, off-screen arrows, supply crates, Tool Box, teams, War mode, up to 100 bots; optional storm wall |

Pick the mode and atmosphere in the setup screen — both apply to your local match.

### Atmospheres (17)

Dust Bowl, Slate Cliffs, Moss Garden, Ember Hollow, Rainy Meadow, Thunderstorm Ridge, Tropical Islands, Sunset Lagoon, Pine Forest, Autumn Woods, Snowfield, Night Swamp, Volcano, Sandstorm Canyon, Cherry Blossom, Midnight Harbor, The Simple Lands.

Each has its own terrain layout (floating islands, rolling ground, islands in the sea, or stepped terraces), parallax backdrop, props and weather:

- **Water** — puddles, ponds, swamp pools and open sea. The surface is a spring simulation: bullets, explosions, players and rain all make waves and splashes. Craters under a pool drain it. Players swim (buoyancy, slow fall, bubbles).
- **Lava** — volcano pools hurt and set you on fire.
- **Weather** — rain with ripples, thunderstorms with lightning that strikes the ground (and players), snow, sandstorms, falling leaves and petals, fireflies, embers, ash, fog.
- **Props** — oaks, pines, palms, autumn and cherry trees, cacti, bushes, reeds, bounce mushrooms, lamps, crates and explosive barrels. Trees shed leaves when hit, catch fire from fire weapons and fall when burnt through or undercut. Barrels chain-explode.

### Movement additions

Wall slide and wall jump, swimming, ice on snow maps, mushroom bounce pads, and the harpoon grapple.

### New weapons (15)

Ink Rocket, Bounce Bomb, Scattergun, Rail Lance, Storm Coil (tesla), Dragon's Breath (flamer), Frostbite (cryo), Void Orb, Shredder (minigun), Bubble Blaster, Harpoon, Longshot (sniper), Quake Hammer, Boomerang, Reaper Scythe. Every weapon has a rarity (common, rare, epic, legendary) shown as a coloured edge and label in the UI.

### Extra weapon fields

All optional. Unknown fields are ignored, so older weapon scripts keep working.

| Field | Meaning |
|---|---|
| `rarity`, `description` | Shown on the weapon card, reveal and weapon list |
| `projectile: { type, size, color, glow, trail, spin }` | `type`: `bullet`, `rocket`, `grenade`, `orb`, `bubble`, `boomerang`, `flame`, `shard`, `hook`, `beam` |
| `explosion: { radius, damage, knockback, crater, selfDamage }` | Area damage on impact |
| `cluster: { count, damage, radius, crater }` | Child bomblets after the main explosion |
| `fuse`, `bounciness`, `drag`, `life` | Timed grenades, bounces, air drag, lifetime in seconds |
| `pierce`, `passTerrain`, `homing` | Pass through players, ignore terrain, turn rate towards the nearest enemy |
| `beam`, `charge`, `laser` | Instant hit-scan, wind-up time, laser sight while aiming |
| `chain: { count, range, damage }` | Lightning jumps between players |
| `status: { burn, chill, shock, bubble }` | Seconds of each effect. Three chill hits freeze |
| `ignites` | Sets trees and barrels on fire |
| `pull: { radius, force }` | Black-hole pull while flying |
| `pullToShooter`, `grapple` | Harpoon: drag the target to you, or yourself to the wall |
| `returns`, `hideWhileFlying` | Boomerang behaviour |
| `magazine`, `reloadTime`, `spinUp`, `burst: { count, delay }` | Magazine and reload (press R or tap the weapon card), minigun spin-up, burst fire |
| `moveSpeed` | Run speed multiplier while held |
| `combo`, `arc`, `shockwave`, `lifesteal` | Melee: combo chain multipliers, `arc: 360` spin attacks, ground shockwave, heal on hit |
| `sound: { type }` | `rocket`, `thump`, `laser`, `zap`, `flame`, `whoosh`, `bubble`, `freeze`, ... |

### Settings and performance

Settings (title screen chip, or from the pause menu) are saved in a cookie: graphics (Adaptive, High, Medium, Low), weather effects, camera shake, volume and an fps readout.

Adaptive mode starts from a guess based on the device (cores, memory, screen size) and then watches the frame rate. If it drops below 50 fps it lowers render resolution and effect density one step; once it holds 60 again it steps back up. Physics, hit detection and gameplay never change with quality. Rendering only draws what is on screen (terrain, props, water, particles, nametags are culled), and the menu is only redrawn when it changes.

### Hosting without folder listings

Run `python3 tools/make-manifest.py` after adding weapons, biomes or characters. It writes `weapons/manifest.json`, `biomes/manifest.json` and `char/manifest.json`, which the game reads on hosts like Netlify or Vercel (and on GitHub Pages when the GitHub API is busy).


---

## Rules, teams, War mode and the Tool Box

Code for this section lives in `build.js` (building, digging, the Tool Box) and `modes.js` (rules, teams, War mode, bot crowds). Both wrap core functions, the same way `expansion.js` does.

### Rules & customisation

Open **Rules & customisation** on the setup screen. Your choices are saved in a cookie and apply to your local matches.

| Option | Choices |
|---|---|
| Health | 100, 200, 300, 500, 1000 (longer rounds) |
| Round time | Auto, 1, 2, 3, 5, 10 minutes |
| Sudden death | On, or Off (when the timer ends, whoever has the most health wins) |
| Supply drops | Normal, Lots, Off |
| Starting weapon | Random for each player, Same for everyone, Fists + drops |
| Bot skill | Easy, Normal, Hard |
| Map size (Big Wilds) | 4×, 6× or 9× the classic arena |
| Bot crowd (Big Wilds) | 10 to 100 bots |
| Teams (Big Wilds) | Free for all, 2, 3 or 4 teams, with bots, real players or both |
| Friendly fire | Off or On |
| War mode, War lives, Build phase | see below |
| Storm wall | Off (default) or On |

### The Big Wilds

This is the classic map style, just much bigger (4× the area by default). There's no shrinking map unless you turn the storm wall on. A follow camera, minimap and off-screen arrows help you find people.

### Teams

Teams are balanced automatically: real players are spread out first, then bots fill in. Each team spawns on its own side. Team colours show as a ring under each player, the colour of their name tag, and the score chips at the top. The last team standing wins the round, and the first team to the target wins the match. You can switch teams on or off from the pause menu. **Teams also work in the normal Arena**: pick 2–4 teams in Setup → Players (friendly fire is in Rules). Only War still needs The Big Wilds.

### War mode

War mode is a Big Wilds sub-mode with 2 to 4 teams:

- Each team has a flag and base on its part of the map.
- **Build phase**: for the first 20, 30 or 60 seconds nobody can be hurt. Everyone gets the **build kit**: planks, beams, stone, metal, glass, light bulbs, springs, TNT, plus dig and fill. Bots build little lean-to forts with bulbs around their flag.
- After that it's a fight. Dead players respawn at their base while the team still has **lives** (shown in the team chips).
- Press **B** at any time in War mode to switch between your weapon and the build kit. **1-0** picks a piece, **Q/E** or the mouse wheel rotates it, and clicking places it.
- You can end War mode, or start it, from the pause menu at any time. The match keeps going with the new rules from the next round.

### The Tool Box

The Tool Box is a weapon (`weapons/toolbox/`) that only appears in The Big Wilds, in about half of the matches (`roundChance: 0.5`). In those matches one is guaranteed to drop in a crate. It works like the build kit, with 40 materials per life. Pieces need support: anything not connected to the ground falls and breaks with physics. TNT chain-explodes, and springs bounce you.

### Many bots

Up to 100 bots can play in The Big Wilds. Bots far from any player think at half rate and only check line of sight to their few closest targets. Name tags, props, pieces and players outside the camera are not drawn. The scoreboard shows the top 8 and you.

### New weapons

Blunderbuss, Scribble SMG, Triple Tap, Derringer, Crossbow, Longbow, Nail Gun, Ink Blotter, Mortar Tube, Sticky Mine, Firework Launcher, Ray Pistol, Plasma Caster, Hornet Hive, Snowball Cannon, Acid Spitter, Hand Cannon, Ricochet Rifle, Saw Launcher, Confetti Cannon, Lumber Axe, Spear, Baseball Bat, Twin Daggers, Morning Star, Frying Pan, Ink Saber, Pickaxe and the Tool Box. That makes 52 weapons in total.

Extra weapon fields used by the build system:

| Field | Meaning |
|---|---|
| `tool: true`, `tools: [...]`, `materials` | Makes the weapon a build tool with these pieces and this many materials |
| `modes: ["expedition"]` | Only appears in these modes |
| `roundChance` | Fraction of matches the weapon is available in (one drop is guaranteed in those matches) |
| `propDamage` | Damage multiplier against built pieces |

---

## Content folders at a glance

Everything you add lives in its own folder. The game finds the folders by itself, so **you never edit `index.html` to add content**.

| Folder | What goes in it | Shown on |
| --- | --- | --- |
| `weapons/<id>/` | `<id>.js` + `<id>.png` — one weapon | normal menu |
| `biomes/<id>/` | `<id>.js` + any images it uses — one biome | normal menu |
| `mainmenu/` | `bg.png`, `maintitle.png` — the main menu art | main menu |
| `char/` | character PNGs | both |

After adding or removing a folder, run `python3 tools/make-manifest.py` once and commit. It writes a `manifest.json` into each content folder. GitHub Pages can't list folders, so the game first asks the GitHub API for the repository tree and falls back to these manifest files when the API is busy (it allows 60 requests an hour per network).

---

## Adding weapons (the full guide)

### The short version

1. Make a folder: `weapons/frying-pan/` (the folder name is the weapon's id — lowercase, no spaces).
2. Draw the weapon and save it as `weapons/frying-pan/frying-pan.png` (transparent background, pointing to the right, handle on the left).
3. Write `weapons/frying-pan/frying-pan.js`:

```js
Weapon({
  name: "Frying Pan", type: "melee", rarity: "uncommon",
  description: "Bonk.",
  damage: 26, knockback: 520, swingTime: 0.18, cooldown: 0.3, reach: 92, arc: 150,
  sound: { type: "clang", pitch: 1.1 },
  sprite: { length: 80, gripX: 0.12, gripY: 0.5, holdDistance: 12 }
});
```

4. Run `python3 tools/make-manifest.py`, commit, push. Refresh the game and the pan is in the random pool.

### The weapon pool

- `weapons/` — the one and only pool, used by every game. Every folder in it is always in the running.

### Every field

All fields are optional except `name`; anything you leave out gets a sensible default. The complete list with comments lives in `weapons/gun/gun.js` (guns) and the [Weapon script reference](#weapon-script-reference) above. The most useful ones:

| Field | Meaning |
| --- | --- |
| `name`, `description` | shown on the weapon card |
| `type` | `"gun"` or `"melee"` |
| `rarity` | `common`, `uncommon`, `rare`, `epic`, `legendary` — card colour and roll chance |
| `weight` | how often it rolls compared with others (1 = normal, 0 = never random) |
| `damage`, `knockback` | per hit |
| `fireRate`, `ammo`, `automatic`, `bullets`, `spread`, `recoil`, `bulletSpeed`, `bulletGravity`, `range`, `bounces`, `headshot` | guns |
| `swingTime`, `cooldown`, `reach`, `arc`, `lunge`, `deflect`, `combo` | melee |
| `destruction` | `{ crater, jagged, debris, dust, scorch, dent }` — what it does to the ground |
| `vfx` | `{ trail, trailWidth, sparks, light, muzzle }` — look and feel |
| `sound` | `{ type, pitch, volume }`; types: shot, swing, punch, hit, clang, impact, debris, tink, boing, whoosh, ... |
| `shake`, `hitStop` | screen shake and the tiny freeze on hit |
| `modes` | e.g. `["expedition"]` — only roll in those modes |
| `roundChance` | e.g. `0.3` — only appears in 30% of rounds |
| `sprite` | `{ length, gripX, gripY, muzzleX, muzzleY, holdDistance }` — how the PNG is held (0–1 across the image) |
| `onHit(e, api)`, `onFire(e, api)`, `onImpact(e, api)` | scripting hooks, see [Scripting hooks](#scripting-hooks) |

### Tips

- Keep the PNG in the ink style (thick dark outline, flat fills, one light highlight). Around 200–400 px wide is plenty.
- If the script has a typo the game still loads; the weapon uses default stats and the error is printed in the browser console. Watch out for a comment eating a comma: `onHit(e, api) { ... } // note,` breaks the next line — put the comma before the `//`.

---

## Adding biomes

Biomes work the same way as weapons: one folder, one script, the game finds it.

1. Make a folder: `biomes/frosty-pier/`.
2. Write `biomes/frosty-pier/frosty-pier.js`. Copy any existing biome (they're all in `biomes/`) and change it — every built-in biome lives there now, unchanged, so they're good templates.
3. Run `python3 tools/make-manifest.py`, commit, push.

Every biome in `biomes/` can be picked (or come up in Random) — there is no separate event pool any more.

```js
Biome({
  order: 450,              // position in the world list (lower first)
  name: "Frosty Pier",
  style: "sea",            // 'float' islands, 'ground' one big field, 'sea' islands in water, 'stepped' terraces and gorges
  weather: "snow",
  wind: 20,
  skyT: "#bcd6ea", skyB: "#eef4f8", sun: "#ffffff",
  far: ["#a9c2d4", "#8aa6ba"],
  top: "#e9f1f5", mid: "#8c9aa6", deep: "#4c5864", cap: "#ffffff",
  water: "#6f9cb8",
  props: [["snowpine", 1], ["rock", 0.3], ["barrel", 0.1]],
  bgTrees: "snowpines",
  cloud: "#ffffff",
  grass: 0
});
```

### Every biome field

| Field | Meaning |
| --- | --- |
| `order` | sort order in menus (built-ins use 100–3300) |
| `name` | shown in menus (max 28 characters) |
| `id` | optional; defaults to the folder name |
| `style` | `float`, `ground`, `sea` or `stepped` |
| `weather` | `none`, `dust`, `leaves`, `embers`, `rain`, `drizzle`, `storm`, `sparkle`, `fog`, `snow`, `fireflies`, `ash`, `sand`, `petals` |
| `wind` | sideways push on particles and bullets |
| `skyT`, `skyB` | sky colour at the top and at the horizon |
| `sun`, `sunKind`, `sunLow` | sun colour; `sunKind: "moon"` or `"none"`; `sunLow: true` puts it near the horizon |
| `far` | two colours for the distant hills |
| `top`, `mid`, `deep`, `cap` | ground colours: grass, dirt, deep rock, edge highlight |
| `water`, `shallow` | sea / pond colours |
| `props` | `[kind, howCommon]` pairs for things on the ground (trees, rocks, ...) |
| `under` | small plants drawn under the trees |
| `bgTrees` | silhouettes behind the map: `none pines oaks dead palms autumn snowpines volcano mesas cherry harbor bamboo acacias birches willows crystals shrooms graves ruins lavrows` |
| `cloud` | cloud colour |
| `grass`, `grassCol` | grass amount (0–1.5) and its two colours |
| `leaf`, `leafTone` | falling-leaf colours / tint for tree leaves |
| `pits`, `puddles`, `pond` | holes, puddles, a big pond |
| `critters` | little animals wandering around |
| `treeDensity`, `plantDensity` | multipliers (1 = normal) |
| `night`, `dark`, `fog`, `haze`, `overcast` | lighting moods (`dark` 0–1) |
| `icy`, `swamp`, `lava`, `lavaPools`, `crystal` | special ground behaviour |
| `newProps` | new kinds of props this biome brings (below) |

Built-in prop kinds you can use in `props` and `under`: `oak autumn cherry birch willow acacia baobab pine snowpine palm dead bamboo giantshroom cactus bush fern reeds lavender flowers tallgrass mushroom pumpkin rock gravestone pillar crystal barrel crate lamp lantern sunflower scarecrow`.

### New props: an image or ink art

A biome can bring its own props. Use a PNG from the biome folder:

```js
newProps: {
  icecube: { image: "icecube.png", w: 40, mat: "crystal", hp: 30 }
}
```

`h` is worked out from the image if you leave it out. Or draw it with the game's ink helpers (look at `biomes/sunflower-hills/sunflower-hills.js`):

```js
newProps: {
  lamp2: { w: 20, h: 60, mat: "metal", hp: 60, art(sp, d) { /* inkPiece(sp, {...}) */ } }
}
```

Prop fields: `w`, `h`, `mat` (`wood`, `plank`, `stone`, `crystal`, `metal`, `leaf`), `hp`, `tree: 1` (counts as a tree for the tree settings and chopping), `solid` (you can stand on it), `small: 1`, `leafy: 1` (canopy sways — see below), `leafAnchor` (where the sway pivots, `[x, y]` fractions of the sprite; default `[.5,.38]` for trees, `[.5,.96]` for bushes). Once a prop is registered, any biome can use it.

One file can call `Biome({...})` more than once; the extra biomes get ids like `frosty-pier-2`.

### Leaf sway: two-layer props

Any prop marked `leafy: 1` is drawn in two layers so its foliage can move on its own:

- `inkPiece(sp, { ... })` renders a trunk/stem piece onto the **base** layer (the default).
- `inkPiece(sp, { layer: "leaf", ... })` renders canopy/fronds onto the **leaf** layer, drawn on top.

`propSprite` returns `{ base, leaf, c, S, M, w, h }` — `base` and `leaf` are the two canvases, `c` a lazily-built combined canvas. All the destruction paths (`cutPiece`, `makeStump`, `Bodies.fromCanvas`, shatter, topple) use `sp.c`, so they keep working unchanged.

The sway is a spring per prop (`leafAng`/`leafVel` in `world.js`): the target angle follows `Env.wind` plus a gust-noise function `gustAt(x, t)`, stiffness and damping vary by prop (trees slow and heavy, bushes fast and light), and the leaf layer is rotated and sheared around `leafAnchor` — trees pivot at the crown, bushes keep their base grounded while the top waves. Offscreen props snap straight to the target (no spring churn), and the whole thing is gated by the `leafSway` setting (default on) in the settings screen.

Biome authors only need to annotate pieces: trunk pieces stay default, canopy pieces get `layer: "leaf"`, and the prop gets `leafy: 1` (plus `leafAnchor` if the default pivot is wrong). Draw order is preserved within each layer, so a base piece that must cover a leaf piece should be moved into the leaf layer — see monstera in `biomes/emerald-tangle/` for an example of the reordering.

### Giant plant variants

`world.js` wraps the 17 plant kinds (`oak pine palm bamboo cherry birch willow acacia baobab bush fern reeds lavender flowers tallgrass mushroom pumpkin`) into `giant_` variants at 3x size, 3x hp and 3x bounce, with boosted detail counts (`d.giant` in the art functions). `placeProps` rolls one instead of the normal kind about 6.5% of the time, in every biome. They cut, burn, topple and shatter exactly like normal props.

### iPad memory guard (jungle fix)

The Emerald Tangle is the heaviest biome on sprite memory (14 custom props x 3 variants). Two changes keep it inside iPad Safari's canvas budget:

- `world.js`: `spriteScale()` drops to 1.35 on iPads and low-tier devices (1.8 on desktop), the `PropArt` cache cap is lowered per device tier (70/105/140), and eviction now frees canvases for real (LRU, `width = 0`).
- The biome itself thins its cover on iPads: `plantDensity` 2.4 -> 1.4, `thingDensity` 1.8 -> 1.05, `critters` 8 -> 5, detected via `navigator.maxTouchPoints` and `deviceTier`.

### Stepped terrain (The Simple Lands)

`style: "stepped"` draws a contour-map landscape instead of one field: broad mesas climb in one to three inset shelves, with steep gorges and one wider canyon between them. Stacked stone viaducts carry the route across, ziggurat spires and floating stone chains add extra platforms, and the topsoil gets map-only contour seams and tiny wildflowers. It scales with The Big Wilds and is destructible like every other surface. Use it when a biome should feel built out of big, simple shapes; The Simple Lands pairs it with the `orchard` background tree line and its windmill, well, picnic and flower-cart props.

```js
Biome({
  name: "The Simple Lands",
  style: "stepped",
  weather: "petals",
  // the rest of the usual colours, props and newProps
});
```

---

## Biome scripting (no engine edits)

A biome file can add its own behaviour as well as colours. You never need to edit `expansion.js` or any other engine file: drop a folder into `biomes/`, run `python3 tools/make-manifest.py` (only needed for hosts without folder listings) and it shows up in the menus. Every hook is optional, and errors are caught and logged once, so a broken biome cannot crash a match.

| Hook / field | When it runs | What you get |
| --- | --- | --- |
| `terrain(ctx)` | builds the land instead of `style` | `ctx.ground(x0,x1,base,amp)`, `island(x0,x1,top,depth,flat)`, `seaIsland`, `platforms(floorY,topY)`, `fill(pts)`, `cut(pts)`, `basin('pond'\|'puddle'\|'lava'\|'swamp', base)`, `sea(level)`, `rebuild()`, `surface(x)`, plus `R` (seeded random), `W`, `H`, `big`, `scale`, `base` |
| `texture(ctx)` | after the ground texture is painted | `ctx.c` (2D context in world units), `ctx.R` |
| `background(ctx)` | painting the far backdrop | `ctx.x` (2D context), `ctx.M` (margin), `ctx.R` |
| `treeLine(ctx)` | your own silhouette row (set `bgTrees` to a custom name) | `ctx.x`, `base`, `col`, `edge`, `gyAt(px)` |
| `onMap(ctx)` | once the map is ready | `ctx.env` (props, water…), `ctx.R`, `ctx.glow(colour)` |
| `update(dt, t)` | every frame | |
| `drawSky / drawBack / drawFront / drawGlow (c, view, t)` | extra draw layers: behind the land, behind players, in front, additive light | |
| `boulders` | number of boulders (default 4) | |
| `crateRate` | weapon-crate rate multiplier | |
| `lightning` | lightning rate multiplier (lightning also strikes in `storm` weather) | |
| `gravity` | gravity multiplier for players | |
| `newProps` | props this biome brings (see above) | |
| `newWeather` | weather kinds this biome brings (see below) | |

Every `ctx` also has `surface(x)`, `solid(x,y)`, `water(x,y)`, `fx(o)`, `mix`, `shade`, `rgba`, `fbm`, `lerp`, `clamp`, `rng`, `hash`, `smoothPath`, `TAU` and `INK`. The ink-art helpers (`inkPiece`, `lobed`, `marks`, `dots`, `lit`, `rgbaC`) are globals. `biomes/simple-lands/` (its stepped terrain now lives entirely in its own file), `biomes/cocoa-hollow/` and `biomes/glowworm-grotto/` are complete examples.

### Weather

`weather` can be one kind or a list (one is picked per map). Built in: `none dust leaves embers rain drizzle storm sparkle fog snow fireflies ash sand petals`, plus the new `blizzard flurries hail aurora meteors seeds sunshower bubbles mist gale spores stardust`. The **Weather** rule in Setup → Mode & map picks the biome's own weather, a random one, a wild mix or clear skies. A biome can register its own:

```js
newWeather: {
  confetti: {
    label: "Confetti", density: 120,
    update(p, dt, view) { p.y += 60 * dt; return p.y > view.y1; }, // return true to respawn
    draw(c, parts, t) { for (const p of parts) c.fillRect(p.x, p.y, 4, 4); },
  }
}
```

The full shape (`setup`, `spawn`, `update`, `tick`, `drawBack`, `draw`, `glow`) is described at the top of `weather.js`.

### The two newest biomes

- **Cocoa Hollow** (cozy): a snowed-in village at dusk with cottages and warm windows, chimney smoke, fairy-light posts, snowmen, firewood stacks, a frozen pond and a sleepy village on the far hills.
- **Glowworm Grotto**: a deep cavern with a rock ceiling hung with glowworm threads, glowing fungi, stalagmites, crystals, an underground lake and drifting spores.

---

## Water

Ponds and puddles are real bodies of water. When a crater opens a hole in a pond's wall or floor, the game floods the cave grid to find where the water would spill and drains the pond down to that level, with a pouring stream, splashes and foam. A crater inside a sealed bowl never drains it. The surface has soft depth bands, foam crests, shore foam, caustics and light shafts, and players who join late get the current water levels.

---

## HUD, victory scene and shortcuts

- The HUD sits on stacked paper layers in 3D and tilts slightly with the mouse. Score chips use each player's colour as a gradient, and the leader wears a crown. The weapon card flips and shines when you change weapon, and the health bar pulses when you are low.
- **Hold Tab** for a scoreboard (splats, wins, teams). The **fullscreen** button is in the HUD's top bar and in Settings.
- **Victory:** when someone wins the match, the screen fades into a small 3D scene in the biome's colours: a podium rises, the winner (or the winning team) drops onto it wearing a crown with their weapon, confetti falls, the camera moves in, and the name appears in raised ink lettering. Press Esc to skip it. The code is in `ui3d.js`.

---

## The main menu folder

`mainmenu/` holds the main menu art. Swap the files to restyle the menu — no code changes:

| File | What it is |
| --- | --- |
| `mainmenu/bg.png` | the full-screen background (slowly drifts). 1600×900 or bigger. |
| `mainmenu/maintitle.png` | the game title on the top-left. Transparent PNG, about 3:1. If it's missing the drawn text logo is used. |


---

## The wardrobe: accessories and cloth

The **Wardrobe** button on the main menu (also on the title screen) opens the wardrobe. Four slots, all drawn procedurally in the game's ink style — no image assets:

- **Hats** — 20 hats: top hat, crown, wizard hat, party hat, halo, horns, bandana, beret, propeller cap, flower, bucket, pirate hat, chef hat, cap, viking helm, ninja band, cowboy hat, straw sun hat, headphones, cat ears.
- **Eyewear** — shades, round glasses, monocle, eye patch, star eyes, goggles, heart specs, cyber visor.
- **Back & cloth** — the star of the show: **capes and scarves are real cloth**, a verlet particle chain pinned to the fighter's neck and solved every frame against gravity, wind (biome wind affects it), the fighter's own movement and the terrain. Also paper wings, backpack, quiver, back shield, a back katana and a jetpack that lights its thrusters mid-jump.
- **Trails** — sparkles, ink drips, petals behind a running fighter.

Bots pick random outfits (stable per bot, so they keep their look), and your own outfit is saved in the `ib_wardrobe` cookie. Everything is visual only — no gameplay advantage.

---

## Setting up a game: flat or normal maps

Play vs bots opens one setup screen with three tabs:

- **Mode & map** — Arena, Big Wilds or War; **Terrain: Normal hills or Flat**; map size for the bigger modes; the world (or Random).
- **Players** — bots, bot skill, first to, teams.
- **Rules** — health, round time, sudden death, drops, weapon pool, friendly fire, storm, War tickets and build time.

Flat maps are one long level field (no pits or islands), great for big War battles and building. They work in every mode and every size. Your last setup is remembered.

---

## Building in War mode

Press **B** (or tap the **Build** button on iPad) to take out the build kit. Tap **Done ✕** to put it away — the button is big and at the top of the screen on touch devices.

- Tabs: **Build** (plank, beam, stone, brick, crate, sandbags, metal, glass, ladder), **Gadgets** (bulb, torch, banner, campfire, spring, spikes, TNT), **Tools** (dig, fill, repair, recycle). Tab / Shift+Tab switches tabs, 1–9 pick a piece.
- **Snap** lines pieces up with their neighbours (on by default). Q/E or the mouse wheel rotate; on iPad tap the angle chip to flip between 0° and 90°.
- On iPad, tap the right half of the screen where you want the piece.
- **Ladders** — hold jump to climb, down to slide.
- **Banners** — your team respawns near its banners.
- **Campfires** heal teammates nearby, **spikes** hurt enemies standing on them.
- **Repair** patches a damaged piece; **Recycle** gives back the full cost of an undamaged piece (half if it's damaged).

---

## The Big Overhaul update

- New main menu: background art, a new title, the buttons on the left, smooth animated transitions, floating ink doodles. Fixed the menu animations playing far too fast on devices with "reduce motion" on.
- **Wardrobe**: 30+ accessories, real cloth capes and scarves, bot outfits.
- **12 new weapons** (90 total): Tidal Soaker, Doodlebuzz chainsaw, Walk the Dog yo-yo, Sketch-Lash whip, Power Chord guitar, Glue Blaster, Magnet Mortar, Pocket Javelin, Pizza Cutter, Beehive Chucker, Gale Gust leaf blower, Plasma Bow.
- **Building overhaul**: 10 new pieces (window, door, haybale, shelf, gate, statue, bouncy shroom, boom barrel, proximity mine), a collapsible build bar, smarter bot builders, and the build kit now works in Big Wilds as well as War mode.
- **No caps anywhere**: any bot count, any HP, any target score, custom map sizes in pixels, chaos dials (gravity / run speed / jump power / infinite ammo), 8-team War mode, Nightmare bots, kill-streak toasts.
- **Offline**: the service worker caches the Google Fonts too, so a home-screen launch on iPad looks right with no network at all.
- **Wardrobe polish pass**: every accessory redrawn with proper shading, highlights and detail; 11 new items (viking helm, ninja band, cowboy hat, straw sun hat, headphones, cat ears, goggles, heart specs, cyber visor, back katana, jetpack with mid-air thruster flames); shorter, better-proportioned capes; a bigger live preview with a breeze so the cloth is always visible; a *Shuffle tab* button.
- **Update fix**: the service worker is now network-first, so a new deploy shows up on the very next launch instead of the second one.
- **Removed**: the event page and the separate event pools (weapons2/biomes2). Every weapon and biome is always in the pool.
- Flat maps for every mode and size; one tidy setup screen.
- Much more building, an easier build bar on iPad, and no more accidental zooming when tapping fast.
- The game is now offline-only: the multiplayer netcode (rooms, server list, invite links) was removed and every match is vs bots.
- Faster drawing of physics debris and lights so big War matches stay smooth.
