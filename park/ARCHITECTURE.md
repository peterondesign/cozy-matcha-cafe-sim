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

1. `#park` (`data-scene-layer="background"`) — 2D ground, path, lawn, and mat artwork; clock-blended day/night art; contact shadows and lamp glow.
2. `#figures` (`data-scene-layer="models-props"`) — transparent counter-customer artwork on yawing 3D billboards, plus the 3D dog and its dynamic leash. Walking cycles through counter walk frames, idle alternates hold frames, and interaction uses the wave frame. Pointer-events none.
3. `#canopy` (`data-scene-layer="foreground"`) — 2D foreground tree overlays, drawn in front of actors behind their sort lines.

`park.js` owns movement, visitor goals, billboard animation, and depth ordering. `scene-map.js` registers path, grass, entrance, exit, gate, bench-anchor, mat, and blocked-prop cells; visitors use its graph for wayfinding, and collision checks use its blocked cells and clearance rules. Residents use the transparent customer art in `../counter/customers/`, so the park and counter share the same illustrated character style and working movement frames. Smooth yaw and seated scaling preserve this style while avoiding the incompatible bind transforms in the original GLB character rigs.

Startup order is world art and overlays → cell graph and visitor goals → shared character-frame textures → Three.js actors, dog, and leash → the clamped animation/steering loop.

## Characters and motion

Walking cycles through frames 1–6, idle alternates frames 1–2, and waving uses frame 6. Each frame clamps elapsed time to 50 ms for player and visitor motion. Five of seven visitors transit to an exit; two cycle through bench, mat, wave, and dog-walk goals. Visitors despawn at exits and respawn at the entrance after a short delay. Separation, sliding, and stuck-timer sidesteps keep traffic moving around props and other visitors.

## Spots and actions

- Benches: plaza stone seats. The player can sit / get up nearby; bench visitors pause at assigned seats.
- Yoga mat: lawn sprite `yoga-mat.png`, sit plants feet on the fabric with a wider contact shadow.
- Garden: enter when within 230 park units of the garden spot, or open `/garden/`.
- Interact: press `E` or click the nearby action hint.
- Dog: press `C` or use the Call dog button; the companion follows the owner and its leash is recomputed every frame.
- Lighting reads `matchaVisualState.minutes` (0–1439) and blends sunrise, daylight, sunset, night art, and lamp glow automatically. The HUD remains the clock source; there is no manual day/night toggle.
- Asset loading remains separate from the render loop. The browser uses checked-in character frames and procedural 3D dog geometry; Replicate credentials require a server-side integration and must not be put in this static frontend.

Save key is still `matchaVisualState`. Park movement does not rewrite `orderIndex`.
