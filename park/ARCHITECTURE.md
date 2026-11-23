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

- Park: approach the gold-outlined garden or grocer and press `E` or click the interaction hint to enter. The shared HUD opens the pause menu.
- Shared HUD: menu icon and Escape open the pause menu; Resume returns to the last game area. The music control shares the saved audio preference across the game.
- Counter HUD: Park and Garden URLs resolve from `shared/world-hud.js`, not from the current page URL.
- Garden and grocer exits use the same shared exit component and return to the park. A garden opened with `?from=counter` returns to the counter.

HUD art is resolved from the script URL of `world-hud.js`, so counter icons stay at `counter/ui/` no matter which world page hosts the HUD.

## Runtime layers

The park uses three stacked canvases:

1. `#park` (`data-scene-layer="background"`) — 2D ground, paths and lawn; clock-blended `world-day.webp`/`world-night.webp` art; contact shadows and lamp glow.
2. `#figures` (`data-scene-layer="models-props"`) — a local skinned 3D rig used as the player fallback when the selected action sprite is unavailable, plus the 3D dog and its dynamic leash. Pointer-events none.
3. `#character-sprites` (`data-scene-layer="characters"`) — the barista and visitor sheets, sorted by foot position. Foreground masks are composited after each actor that is behind them, so an actor in front is not hidden by another actor's occluder. Masks use the original day and night artwork and blend with the scene lighting.

`park.js` owns movement, action states, model placement, and depth ordering. The matcha barista is the controllable player, marked by a small gold diamond; Hana is a visitor. The arrow keys, WASD, direction pad, and click-to-walk drive the player. `scene-map.js` registers path, grass, entrance, exit, gate, bench-anchor, and blocked-prop cells. Polygon footprints approximate the illustrated garden, shop, benches, fences and water; paths, the shop pavement and the bridge deck remain accessible. Garden and grocer outlines and their proximity interaction points are defined together. `scene-occlusion.js` defines hand-traced foreground silhouettes, with a small outward offset and soft feathering, using the same day and night artwork as the background. The shop and benches use sloped depth lines, so people in front of the angled façades remain visible. Outlines favor complete canopies and remain approximations rather than pixel-perfect segmentation. `visitor-paths.js` defines routes between the west edge and the grocer door or water bridge (at the lower right of the artwork). Visitors fade at the endpoints and reverse while hidden. When all visitors are outside the camera, an off-screen visitor can be repositioned to enter a visible route; a viewport without a route may have no visible visitors.

The garden and grocer perimeters use a glowing gold gradient that pulses unless reduced motion is enabled. The grocer uses timber walls and illustrated goods, with eight products on each shelf row and an animated checkout clerk (static with reduced motion). Its basket contains the shopping list and inventory, and checkout still updates the shared pantry.

Startup loads the current lighting artwork and player sheets in parallel. The loading screen shows that world artwork behind a progress card; it clears when the player can move. Visitor sheets and the alternate lighting artwork load afterward, with errors reported in the park. Foreground masks are prepared on demand. The local 3D barista rig and dog renderer load only when needed. `gltf-pipeline.js` reads checked-in rigs without network services. The separate motion GLBs use incompatible bind transforms, so fallback actions are posed on the local rig bones rather than forcing those clips onto them. The render loop never calls an asset-generation API.

## Characters and motion

Registered player actions use sprite sheets; an absent action instead displays the local 3D rig. A declared but invalid or missing file reports an error. Park rendering uses lossless, downscaled WebP sheets in `park/sprites/` while the source art remains unchanged. After registering or changing a park sheet, regenerate the cache with `python3 park/build-sprite-cache.py` (requires Pillow). Off-screen sprites are culled and the 3D renderer is skipped when neither a fallback nor the dog is visible. The runtime clamps elapsed time to 50 ms for input and animation. Automatic traffic targets two visitors from 6am to 9pm, one from 9pm to 11pm, and none from 11pm until 6am. Visitors move at 85 world units per second and render at 85% height. They currently walk only; they do not avoid one another or perform actions.

## Sprite authoring protocol

The shared manifest is `rigging-test/action-assets.json`; paths in it are relative to that file. The rigging preview at `/rigging-test/` lists the barista and all ten counter characters: `01` Sota, `02` Hana, `03` Mio, `04` Ken, `05` Ren, `06` Aya, `07` Jun, `08` Yuki, `09` Haru, and `10` Noa. The barista and the first six customers have directional walking sheets; the barista and Sota also have front-facing waves. Registering another character's sheets alone does not add that character to the park.

Create transparent **character-only** PNG sheets: no background, bench, mat, shadow, label, or grid. The preferred layout is 4 × 4, ordered left-to-right, then top-to-bottom. Hana's 4K sheets are 5504 × 3072 (1376 × 768 cells); other evenly divisible sizes work. Keep the character's palette, proportions, lighting, scale, and contact position consistent. Declare the real usable frame count, not the number of padded cells. Static poses can use a 1 × 1 sheet.

Use these action keys for each character:

- Walking: `walk_down`, `walk_up`, `walk_right`, and optionally `walk_left`. If left is absent it mirrors right, preserving the existing walk behavior; provide explicit left art for asymmetrical details. Walking is distance-driven.
- Benches: `sit_down_bench_west`, `seated_bench_west`, `stand_up_bench_west`, and the corresponding `_north` and `_east` keys. Match each view and seat contact to its named bench. Use the scene reference in the preview and verify visually.
- Mat: `sit_down_mat`, `seated_mat`, `stretch_mat`, `stand_up_mat`. Match the intended mat's perspective and contact point.
- Wave: `wave_down`, `wave_up`, `wave_right`, `wave_left`; the view is selected from the other character's relative direction. Visitor wave responses are not implemented.

Sit-down, stand-up, and wave must play once; make their endpoints match the neighboring standing or seated pose. Seated art holds or loops, and stretch may hold, loop, or play once. Bench and mat actions are supported by the preview protocol but are not currently available in the park. Walk-left is the only implicit mirror. To mirror another view explicitly, use `{"mirrorOf":"wave_right"}` as that character's `wave_left` entry only when asymmetric details permit it.

For example:

```json
{
  "sit_down_bench_west": {
    "02": {
      "file": "hana_sit_down_bench_west.png",
      "columns": 4,
      "rows": 4,
      "frames": 12,
      "fps": 12,
      "playback": "once",
      "anchor": [0.5, 0.97],
      "heightFraction": 0.91
    }
  }
}
```

`playback` is `once`, `loop`, or `hold`; defaults are loop for walks, hold for seated poses, once otherwise. `anchor` is the normalized contact point within each cell, and `heightFraction` is the character's reference standing height as a fraction of cell height; both can be calibrated per action. Defaults preserve the existing Hana sheet alignment. `idleFrame` optionally selects a walk sheet's standing cell, including a cell beyond the walking frame count. Preview sheets show the contact anchor and playback mode. GIF/image-only entries remain supported in the preview but park sprites must use sheet metadata.

## Spots and actions

- Interact: press `E` or click the nearby action hint. The garden and grocer entrances are available near their gold outlines, and returning restores the park position. The barista waves to a nearby visitor using the front-facing sheet for every direction. A completed wave earns one Gem with a small on-screen notification. Gems are uncapped; saved satisfaction values migrate to Gems. Visitors do not currently respond. Seating is not available.
- Dog: press `C` to call the companion; the leash is recomputed every frame.
- The shared world clock advances one game minute per real second in all game areas, rolls the day over at midnight, and pauses in the menu. Serving the next counter customer still advances it by 40 minutes. Park lighting reads `matchaVisualState.minutes` (0–1439) and blends sunrise, daylight, sunset, night art, and lamp glow automatically. Garden crop timers retain their real-time rate, excluding time spent in the pause menu.
- Asset loading remains separate from the render loop. The browser uses checked-in 3D character and motion assets plus procedural dog geometry. Replicate credentials are not used in this static frontend and must not be exposed in client code.

Save key is still `matchaVisualState`. Park movement does not rewrite `orderIndex`.
