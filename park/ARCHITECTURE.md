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
2. `#figures` (`data-scene-layer="models-props"`) — locally generated, skinned 3D character rigs with articulated walk, sit, yoga, and wave poses, plus the 3D dog and its dynamic leash. Characters use full yaw rotation, including real back-facing views. Pointer-events none.
3. `#canopy` (`data-scene-layer="foreground"`) — 2D foreground tree overlays, drawn in front of actors behind their sort lines.

`park.js` owns movement, visitor goals, model placement, and depth ordering. `scene-map.js` registers path, grass, entrance, exit, gate, bench-anchor, mat, and blocked-prop cells; visitors use its graph for wayfinding, and collision checks use its blocked cells and clearance rules. A declared north detour keeps routes away from the tree trunk at the path crossing. When visitors overlap, the collision filter permits moves that increase their separation instead of freezing both actors.

Startup order is world art and overlays → cell graph and visitor goals → local skinned GLB rigs → articulated pose controls, dog, and leash → the clamped animation/steering loop. `gltf-pipeline.js` reads checked-in rigs without network services. The separate motion GLBs use incompatible bind transforms, so actions are posed on the local rig bones rather than forcing those clips onto them. The render loop never calls an asset-generation API.

## Characters and motion

Walking, waving, bench sitting, and mat sitting blend into articulated poses on the local skeletons. The runtime clamps elapsed time to 50 ms for input, AI steering, collision resolution, and animation. Five of seven visitors transit to an exit; two cycle through bench, mat, wave, and dog-walk goals. Visitors despawn at exits and respawn at the entrance after a short delay. Separation, obstacle sliding, stuck-timer sidesteps, and route replanning keep traffic moving around props and other visitors.

## Spots and actions

- Benches: plaza stone seats. The player can sit / get up nearby; bench visitors pause at assigned seats.
- Yoga mat: lawn sprite `yoga-mat.png`, sit plants feet on the fabric with a wider contact shadow.
- Garden: enter when within 230 park units of the garden spot, or open `/garden/`.
- Interact: press `E` or click the nearby action hint.
- Dog: press `C` or use the Call dog button; the companion follows the owner, dog-walk visitors move along a short loop, and the leash is recomputed every frame.
- Lighting reads `matchaVisualState.minutes` (0–1439) and blends sunrise, daylight, sunset, night art, and lamp glow automatically. The HUD remains the clock source; there is no manual day/night toggle.
- Asset loading remains separate from the render loop. The browser uses checked-in 3D character and motion assets plus procedural dog geometry. Replicate credentials are not used in this static frontend and must not be exposed in client code.

Save key is still `matchaVisualState`. Park movement does not rewrite `orderIndex`.
