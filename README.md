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

Then open <http://127.0.0.1:8765/>. Use **WASD** or the arrow keys to walk in
the park; press **E** near a destination to interact. The on-screen direction
pad and interaction hint are also available.

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
tests/      Static route, link, and syntax checks
```

Run the repository checks with:

```bash
python3 tests/check_repo.py
```
