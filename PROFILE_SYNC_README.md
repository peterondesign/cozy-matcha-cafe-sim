# 👤 Profile Sync UI - Quick Start

## What You Got

A beautiful profile connection UI that lets players share one code to sync progress across all devices. It's so simple even a 13-year-old can use it.

## See It In Action

```bash
# Start the game server
python3 -m http.server 8765

# Option 1: Test with the full game
open http://127.0.0.1:8765/counter/
# Click the 👤 button in the top HUD

# Option 2: Test the demo (no backend needed)
open http://127.0.0.1:8765/profile-sync-demo.html
```

## Files

**Main Components:**
- `shared/profile-connector.js` - The UI component
- `shared/profile-connector.css` - Styling and animations
- `profile-sync-demo.html` - Standalone demo

**Documentation:**
- `PROFILE_SYNC_UI.md` - Feature guide
- `PROFILE_SYNC_VISUAL_GUIDE.md` - Visual walkthrough
- `PROFILE_SYNC_INTEGRATION.md` - Developer guide

**Modified:**
- Added profile button to `shared/world-hud.js`
- Added button styles to `shared/hud.css`
- Loaded scripts in all index.html files

## How It Works

```
Player A                          Player B
  |                                 |
  ├─ Click 👤                        |
  ├─ Copy code: "mint-tea-42"       |
  └─ Share with friend              ├─ Click 👤
                                    ├─ Paste: "mint-tea-42"
                                    ├─ Click Load
                                    └─ Play Player A's progress!
```

## Key Features

✅ **Copy Code** - One click to share your profile
✅ **Load Profile** - Paste a code to play someone else's progress
✅ **Beautiful UI** - Smooth animations, great colors
✅ **Mobile First** - Works perfectly on phones
✅ **Accessible** - Keyboard navigation, ARIA labels
✅ **Fast** - No dependencies, pure JavaScript
✅ **Clear Feedback** - Toast messages for every action

## Color Scheme

| State | Color | Icon |
|-------|-------|------|
| Success | 🟢 Green (#76c7a0) | ✓ |
| Warning | 🟠 Orange (#f4a261) | ⚠️ |
| Error | 🔴 Red (#dc5d5d) | ❌ |
| Loading | - | ⏳ |

## Buttons

- **Copy** - Copies your code to clipboard
- **Load** - Loads a profile from a code
- **Close (✕)** - Close the modal
- **Escape key** - Also closes the modal

## Mobile Responsive

The UI adapts to any screen size:
- **Desktop**: Side-by-side layout
- **Tablet**: Flexible grid
- **Mobile**: Stacked, full-width buttons

## For Developers

The component requires `window.MatchaLeaderboard` to provide:

```javascript
{
  enabled() → boolean           // Is cloud sync available?
  playerId() → string          // Current player's code
  async pull(code) → {...}     // Load profile data
  setPlayerId(code) → void     // Update current player
}
```

See `PROFILE_SYNC_INTEGRATION.md` for full details.

## Status

✅ **Complete & Production Ready**
- All tests passing
- Fully documented
- Demo included
- No external dependencies
- Ready to ship!

## Questions?

Check the documentation files:
1. `PROFILE_SYNC_UI.md` - For features and customization
2. `PROFILE_SYNC_VISUAL_GUIDE.md` - For visual walkthrough
3. `PROFILE_SYNC_INTEGRATION.md` - For integration details
