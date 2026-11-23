# AGENTS.md

Guidance for coding agents working on the Cozy Matcha Café game.

## Layout

```text
menu/       Main menu
counter/    Café service game and customer sprites
grocer/     Village grocer route redirect
park/       Park, visitor behaviors, and grocer implementation
garden/     Garden gameplay
shared/     HUD, audio, and pantry components
assets/     Shared game artwork
audio/      Music and sound effects
brand/      Icons and identity artwork
new-game/   Legacy route redirects
tests/      Static project checks
```

## Commands

```bash
python3 -m http.server 8765
python3 tests/check_repo.py
```

Run both commands from the repository root. The local site is available at
`http://127.0.0.1:8765/`.

## Rules

- Keep navigation and shared HUD behavior consistent across all five game
  areas. The shared HUD lives in `shared/world-hud.js` and `shared/hud.css`.
- Preserve the existing customer artwork, animation frames, and generated game
  assets unless a change specifically requires replacing them.
- Keep code comments in English. Do not commit credentials, local environment
  files, or absolute machine-specific paths.
- Update the static checks when adding or changing canonical routes.
