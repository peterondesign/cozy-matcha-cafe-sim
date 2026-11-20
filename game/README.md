# Little Matcha Days

Run a tea cart in a cherry blossom park. Mrs. Sato orders the first bowl. Serve drinks, replenish ingredients and spend your earnings on the terrace.

## Controls

- Click the highlighted preparation step or press its number key.
- To whisk, sweep back and forth across the bowl, tap the instruction card, or tap **Space** eight times. An even rhythm improves the foam.
- Serve traditional matcha directly in the chawan. For an iced drink, stop the pour indicator in green, then hold and release at the gold mark.
- Press **Enter** to open the cart, **R** for the next customer after service, and **Escape** for the menu.

## Orders and customers

Reaching 100% satisfaction unlocks the next level. The first six levels introduce traditional matcha, iced latte, oat latte, vanilla oat latte, strawberry coconut matcha and blueberry honey matcha. Check the recipe book for ingredients and the next unlock. A customer leaves when the cart cannot fill the order.

## Video study and art

`assets/cafe_background_plate.webp` is the clean runtime cafe plate, leaving all interface elements to the live HUD. The sampled frames and palette study from the supplied video are in `video/pov_study/`. Fal generated a new 5-second POV clip at `video/cozy_matcha_pov_retry.mp4`; a frame from it guided the 2K, five-customer lineup at `assets/customers/customer_lineup_fal_wide.png`. Fal's BiRefNet Portrait endpoint removed the magenta backdrop, and the lineup was split into the five portrait PNGs used by the game. The endpoint prompts and outputs are logged in `video/fal_log.json` and `assets/customers/fal_log.json`. The first standard-width lineup was discarded from the game because the last portrait was clipped.

The action art atlas in `assets/actions/matcha_action_atlas.png` illustrates every unique preparation step. Twelve compact looping GIFs live in `assets/actions/gif/`; transition GIFs crossfade from the before-state to the prepared state. They appear beside each action, and the whisk/pour gauge also shows the matching larger visual. Fal's balance ran out during the additional action-atlas request, so this atlas was made with the workspace image generator using the Fal video frame as its reference. No further paid media calls were made.

The generated video is kept as a style and motion reference; the static clean plate is used at runtime so its generated customer does not conflict with the five rotating customer portraits. Fal endpoints and prompts are preserved in their logs. A Replicate attempt was rejected with an authentication error; no API key is stored in this repository. Fable 5.2's public overview informed the code-led, layered animation approach, but no Fable model endpoint was available in this workspace. See [Anthropic's Fable overview](https://www.anthropic.com/claude/fable).

## Playthrough

`play.mjs` plays an order using keyboard input. The bundled recordings are from an earlier version of the timing controls.

## Run

Serve this folder with `python3 -m http.server 8000` and open `http://localhost:8000/`. Use `?autostart&seed=7` for playthroughs. The mechanics and state contract are described in [`MECHANICS.md`](MECHANICS.md).

Cloud saves and password reset need the cafe server instead. Copy [`.env.example`](../.env.example) to `.env`, fill in Supabase and Resend, run [`supabase/schema.sql`](../supabase/schema.sql) in the Supabase SQL editor, then `node server/cafe.mjs` and open `http://127.0.0.1:8787/`. Passwords are bcrypt-hashed by Supabase Auth. Emails are stored in `cozy_matcha_users`. Resend sends the reset link. The save prompt stays on the HUD and opens after the first completed order.

## Cherry Blossom Park

After an order, choose **Explore the park**. Use **WASD** or tap a path to walk. Select a destination label to walk there automatically. Near an interactable resident or landmark, press **E** or tap the interaction button. Choose **Café counter** to return to service. On narrow screens the park fills the viewport and the camera follows the barista.
