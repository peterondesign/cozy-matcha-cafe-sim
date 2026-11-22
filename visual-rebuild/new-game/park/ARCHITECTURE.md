# Matcha Park architecture

Serve the game from `visual-rebuild/`, not from the git repo root and not from this folder.

```bash
cd visual-rebuild
python3 -m http.server 8765
```

## URLs

These all resolve to the same park page (relative redirects, no cache-bust query string):

| Open this | Lands on |
|---|---|
| http://127.0.0.1:8765/new-game/park/ | park `index.html` |
| http://127.0.0.1:8765/park/ | redirect → `../new-game/park/` |
| http://127.0.0.1:8765/new-game/ | redirect → `park/` |
| http://127.0.0.1:8765/ | redirect → `menu/` |

Do not use `?v=park20` in bookmarks. That was only a local cache-buster while iterating. The page itself does not require a query string.

If the server is started from `cozy-matcha-cafe-sim/` instead of `visual-rebuild/`, the park is at `/visual-rebuild/new-game/park/` and `/new-game/park/` will 404. Always start from `visual-rebuild/`.

## How screens link

All in-world links are relative to the page, not to the host root.

- Park header: `../../menu/`, `../../counter/`, `grocer.html`, `../garden/`
- Menu: `../counter/`, `../new-game/park/`
- Counter HUD: `../park/` and `../garden/` from `new-game/world-hud.js`
- Garden exit: `../park/` (or the `matcha-garden-return` key)

HUD art is resolved from the script URL of `world-hud.js`, so counter icons stay at `counter/ui/` no matter which world page hosts the HUD.

## Runtime layers

The park is two stacked canvases:

1. `#park` — 2D. Paints `world-day.jpg` / `world-night.jpg` into a 2048×1152 camera, plus the yoga-mat sprite, contact shadows, and the barista star.
2. `#figures` — WebGL (Three r170 in `market/three-r170.js`). Orthographic camera, world X = park x, world Y = `1152 - park y`. Pointer-events none.

`park.js` owns movement, spots, visitors, and the mixer. The barista is the animation source of truth: one clip library, one facing rule, one foot plant. Guests clone the same Mixamo clips.

## Characters and motion

Rigs (Mixamo `mixamorigHips`, no colon in Three’s sanitized names):

- `characters/test/barista-uthana.glb` — player
- `walker-uthana.glb`, `hiker-uthana.glb`, `grocer-uthana.glb` — cafe guests (Hana / Ren / Yuki bodies, reused for the crowd)

Clips in `characters/test/motion/`:

| File | Used for |
|---|---|
| `walk-femme.glb` | barista and feminine walks |
| `walk.glb` | hiker / masculine walk |
| `walk-dog.glb` | leash walk |
| `sit-bench.glb` | sit; get-up is this clip reversed |
| `sit-mat.glb` | sit on yoga mat; get-up reversed |
| `stretch-mat.glb` | stretches |
| `wave.glb` | stop and wave (one-hand clip) |

Idle never uses the bind T-pose. Stand is a paused frame of the walk clip.

## Spots and actions

- Benches: plaza stone seats. Sit / get-up only when nearby.
- Yoga mat: lawn sprite `yoga-mat.png`, sit plants feet on the fabric with a wider contact shadow.
- Walk Here: path hint when the player is close but not standing on the ring.
- Wave: nearby guests pause and play the same wave clip.

Save key is still `matchaVisualState`. Park movement does not rewrite `orderIndex`.
