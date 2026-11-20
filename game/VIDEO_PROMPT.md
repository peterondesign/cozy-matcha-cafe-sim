# Cafe video prompt and implementation notes

## Reference prompt

Use the supplied illustrated screenshot as the visual and composition reference. Preserve its straight-on first-person barista POV from behind the wooden service counter, with the customer across the counter, a garden cafe behind them, and matcha ingredients framing the foreground. Keep the barista unseen: no hands, utensils moving, or direct object manipulation. The customer performs a calm idle loop with breathing, blinking, a welcoming expression, and subtle hair and clothing sway. A speech bubble displays only a clear image of the requested drink.

Render a richly detailed hand-painted Japanese animated-feature-inspired storybook illustration with watercolor and gouache textures, delicate ink contours, nuanced foliage, cherry blossoms, timber grain, lantern glow, warm morning sunlight, and fine paper texture. Add gentle secondary movement such as drifting petals, leaf shadows, and lantern flicker. Keep the composition readable and stable, with no cuts, zooms, subtitles, logos, or baked-in interface text.

## Current implementation

The game uses `assets/cafe_background_plate.webp` for the clean cafe environment and overlays its live HUD, order card, customer, and action panel. Five transparent customer PNGs provide the queue variety and per-customer CSS idle motion. The per-action atlas and twelve GIFs show the distinct preparation steps; the gauge overlay repeats the active step at a larger size. Quality, status, and coin feedback animate between interaction and HUD.

Fal generated the original video/background assets, a new 5-second motion reference, and the five-customer lineup with its clean cutout; call parameters and prompts are in the Fal logs. Fal's balance was exhausted before the action-art request, so that single atlas used the workspace image generator, referenced to a Fal video frame. GIFs were assembled locally from the atlas panels to avoid further media-generation charges. A Replicate generation attempt returned an authentication error, so it did not supply assets. No credential is saved in this repository.
