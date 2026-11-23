# Matcha Park architecture

The repository root is the site root.

```bash
python3 -m http.server 8765
```

## URLs

Serve the repository root to keep these game routes available:

| Open this | Lands on |
|---|---|
| http://127.0.0.1:8765/ | redirect → `menu/` |
| http://127.0.0.1:8765/park/ | park `index.html` |
| http://127.0.0.1:8765/garden/ | garden `index.html` |
| http://127.0.0.1:8765/grocer/ | village grocer |
| http://127.0.0.1:8765/counter/ | counter `index.html` |
| http://127.0.0.1:8765/new-game/park/ | legacy redirect → `/park/` |
| http://127.0.0.1:8765/new-game/garden/ | legacy redirect → `/garden/` |

## How screens link

All in-world links are relative to the page, not to the host root.

- Park header: `../menu/`, `../counter/`, `../grocer/`, `../garden/`
- Menu: `../counter/`, `../park/`
- Counter HUD: Park and Garden URLs resolve from `shared/world-hud.js`, not from the current page URL.
- Garden exit: `../park/` (or the `matcha-garden-return` key)

HUD art is resolved from the script URL of `world-hud.js`, so counter icons stay at `counter/ui/` no matter which world page hosts the HUD.

## Runtime layers

The park is three stacked canvases:

1. `#park` — 2D. Paints `world-day.jpg` / `world-night.jpg` into a 2048×1152 camera, plus the yoga-mat sprite, contact shadows, and the barista star.
2. `#figures` — transparent counter-customer artwork on 3D billboards in a shared Three.js scene. Walking cycles through counter walk frames, idle alternates hold frames, and interaction uses the wave frame. Pointer-events none.
3. `#canopy` — 2D foreground tree overlays, drawn in front of the actors.

`park.js` owns movement, spots, visitor roles, billboard animation, and depth ordering. Residents use the transparent customer art in `../counter/customers/`, so the park and counter share the same illustrated character style and working movement frames. The original GLB character rigs and motion exports use incompatible bind transforms; the billboard render avoids their broken geometry while retaining perspective scale, camera ordering, and scene lighting.

## Characters and motion

Walking cycles through frames 1–6, idle alternates frames 1–2, and waving uses frame 6. Visitors marked `bench` follow a route to an assigned plaza seat, pause, and turn back; `pass` visitors keep walking through their routes.

## Spots and actions

- Benches: plaza stone seats. The player can sit / get up nearby; bench visitors pause at assigned seats.
- Yoga mat: lawn sprite `yoga-mat.png`, sit plants feet on the fabric with a wider contact shadow.
- Garden: enter when within 230 park units of the garden spot, or open `/garden/`.
- Interact: press `E` or click the nearby action hint.
- Wave: nearby guests pause on their wave frame.

Save key is still `matchaVisualState`. Park movement does not rewrite `orderIndex`.
