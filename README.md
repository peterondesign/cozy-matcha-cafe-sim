# Cozy Matcha Café

A browser-based café game with a shared HUD and five connected areas:

- **Menu** — `/` or `/menu/`
- **Counter** — `/counter/`
- **Grocer** — `/grocer/`
- **Park** — `/park/`
- **Garden** — `/garden/`

The root `index.html` opens the menu. The former `/new-game/park/` and
`/new-game/garden/` URLs remain as redirects for saved links.

## Run locally

From the repository root, start a static server:

```bash
python3 -m http.server 8765
```

Then open <http://127.0.0.1:8765/>.

On the first menu visit, the loading screen caches major park, garden, counter,
and grocer assets in browser Cache Storage. Later visits reuse them when browser
storage is available; clearing site data removes the cache. You can continue
without waiting, and a failed download can be retried by refreshing. A secure
context (HTTPS or localhost) is required for persistent caching.

## Launch on Vercel

This is a static site. There is no build step.

1. Push the repository to GitHub if it is not already there.
2. In [Vercel](https://vercel.com/new), import the repository.
3. Leave the framework as **Other**, the build command empty, and the output directory as the repository root.
4. Deploy. The live site opens on the menu at `/`.

From the project folder you can also run `npx vercel` and follow the prompts. `vercel.json` keeps directory URLs like `/menu/` and `/counter/` so relative images and scripts keep working. Use **WASD** or the arrow keys to walk in
the park; press **E** near a visitor to wave or near the garden or grocer to
enter, and **C** to call the dog.
The on-screen direction pad and interaction hint are also available.
Use the menu icon beside the clock or press **Escape** to open the menu.
**Resume Game** returns to the last area, including your position in the park
or grocer. Escape closes an open shop dialog before opening the menu.
The world clock advances one game minute per real second while playing and
pauses in the menu. Park visitor traffic changes with the time of day, with no
visitors between 11pm and 6am. Waves earn one Gem; served orders earn one to
three Gems based on their star rating. Existing satisfaction balances migrate
to Gems.

In the garden, select a bed to see its care status and water or harvest it;
each bed also has its own growth slider. Water when
care is due (from five minutes before to five minutes after the due time);
growth stops after the window and begins to decrease after another 15 minutes.
Harvesting adds produce to the café pantry and starts that bed again. Dragging
a slider sets its growth and restarts its care timer; `?dev` uses a separate
practice garden and does not add harvests to the pantry. Garden timers use
real time, excluding time spent in the pause menu. The garden's pantry preview
shows the same stock used by the counter, and harvests animate into it.

The music button in the shared HUD works throughout the game and remembers
your preference. Browsers may require a click or keypress before music can
start. In the grocer, open the basket for the shopping list or inventory.

The inventory meter is full at 20 units; purchases and harvests can still
increase stock beyond 20. The Building menu lets you choose a small, medium or
large café and independently toggle unlocked seating, lighting and greenery.
Existing building and decoration purchases carry over to the closest new option.
The park displays the selected combination. The supplied artwork has no
lighting-only sheet, so that variant adds lights to the plain café.
To regenerate the cutouts from the supplied sheets, run
`python3 menu/build-cafe-assets.py` (requires Pillow, NumPy and SciPy).

The [park sprite protocol](park/ARCHITECTURE.md#sprite-authoring-protocol)
describes the character sheets, scene-specific action views, and preview.

## Project layout

```text
menu/       Main menu
counter/    Café service game and customer animations
grocer/     Redirect to the village grocer
park/       Park, visitors, and village grocer
garden/     Garden gameplay
shared/     HUD, audio, and pantry components used across pages
assets/     Shared game artwork
audio/      Music and sound effects
brand/      Icons and identity artwork
new-game/   Legacy URL redirects
tests/      Route, link, syntax, and behavior checks
```

Run the repository checks with:

```bash
python3 tests/check_repo.py
```
