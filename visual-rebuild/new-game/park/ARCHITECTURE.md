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

The park is three stacked canvases:

1. `#park` — 2D. Paints `world-day.jpg` / `world-night.jpg` into a 2048×1152 camera, plus the yoga-mat sprite, contact shadows, and the barista star.
2. `#figures` — WebGL (Three r170 in `market/three-r170.js`). Orthographic camera, world X = park x, world Y = `1152 - park y`. Pointer-events none.
3. `#canopy` — 2D foreground tree overlays, drawn in front of the actors.

`park.js` owns movement, spots, visitors, and the mixer. All residents use the shared procedural 3D actor stage in `../../shared/park-actors.js`; palettes distinguish visitors without separate scanned meshes. The stage supplies the same walk, idle, sit, meditate, and wave clips for every character.

## Characters and motion

The park uses the shared low-poly rig and local animation clips; it does not load scanned GLBs or Mixamo animation files. Idle never uses a bind T-pose, and the shared walk cycle is used by the player and visitors.

## Spots and actions

- Benches: plaza stone seats. Sit / get-up only when nearby.
- Yoga mat: lawn sprite `yoga-mat.png`, sit plants feet on the fabric with a wider contact shadow.
- Walk Here: path hint when the player is close but not standing on the ring.
- Wave: nearby guests pause and play the same wave clip.

Save key is still `matchaVisualState`. Park movement does not rewrite `orderIndex`.
