# Profile Sync UI Documentation

## Overview

The Profile Sync UI is a simple, intuitive modal that allows players to manage their profile across multiple devices. It's designed to be used by players ages 13 and up and requires no technical knowledge.

## Features

✅ **Copy Profile Code** - Players get a unique code that represents their profile
✅ **Share & Connect** - Paste someone else's code to load their profile
✅ **Visual Feedback** - Toast notifications show success/error messages
✅ **Mobile Friendly** - Fully responsive design works on all screen sizes
✅ **Easy to Understand** - Emoji icons and clear language guide the user

## User Flow

### 1. Opening the Profile Sync UI
- Click the **👤** profile button in the top HUD
- The modal appears with a smooth animation

### 2. Copying Your Code
- Your unique profile code is displayed in the code box
- Click the **📋 Copy** button to copy it to your clipboard
- Share this code with friends to let them play your profile

### 3. Loading Someone Else's Profile
- Get a code from a friend
- Paste it into the input field
- Click the **↓ Load** button
- Your progress will be replaced with their profile data
- Refresh the page to see their profile fully loaded

## Component Structure

### Files Created
- `shared/profile-connector.js` - Main component logic
- `shared/profile-connector.css` - Styling and animations
- Modified: `shared/world-hud.js` - Added profile button
- Modified: `shared/hud.css` - Added profile button styles
- Modified: `counter/index.html`, `park/index.html`, `garden/index.html`, `menu/index.html` - Loaded scripts

### JavaScript API

```javascript
// Access the profile connector globally
window.ProfileConnector

// Methods
ProfileConnector.show()          // Open the modal
ProfileConnector.hide()          // Close the modal
ProfileConnector.toggle()        // Toggle open/close

// Internal methods
ProfileConnector.loadProfile(code)  // Load a profile by code
ProfileConnector.showStatus(message, type, duration)  // Show toast notification
```

### Status Message Types
- `'success'` - Green toast (default)
- `'error'` - Red toast
- `'warning'` - Orange toast
- `'info'` - Blue toast

## Integration with MatchaLeaderboard

The profile connector works with the existing `window.MatchaLeaderboard` API:

```javascript
// Expected API
window.MatchaLeaderboard.enabled()           // Returns true/false
window.MatchaLeaderboard.playerId()          // Returns current player ID/code
window.MatchaLeaderboard.pull(code)          // Returns { state, display_name, avatar }
window.MatchaLeaderboard.setPlayerId(code)   // Sets the current player ID
```

When loading a profile:
1. Fetches the profile data via `MatchaLeaderboard.pull(code)`
2. Saves the game state to `localStorage['matchaVisualState']`
3. Updates audio settings if available
4. Sets the player ID via `MatchaLeaderboard.setPlayerId(code)`
5. Shows success/error toast and suggests refresh

## Styling & Customization

The UI uses CSS custom properties and can be customized by modifying `shared/profile-connector.css`:

- Primary color: `#76c7a0` (green)
- Secondary color: `#f4a261` (orange)
- Text color: `#2c2c2c` (dark gray)
- Background: `#f5f1e8` (cream)

## Mobile Responsiveness

The design is fully responsive:
- Desktop: Side-by-side layout for code display and input
- Mobile (<600px): Full-width stacked layout
- Proper touch targets (44px minimum)
- Safe area insets respected

## Accessibility

✅ Semantic HTML structure
✅ Proper ARIA labels on all interactive elements
✅ Keyboard navigation supported (Enter to submit)
✅ Color not the only indicator of status
✅ Focus indicators visible
✅ Sufficient color contrast

## Error Handling

The component gracefully handles:
- Cloud sync disabled: Shows appropriate error message
- Invalid code: "Code not found" message
- Network errors: Generic error with details
- Clipboard not available: Suggests manual selection
- Disabled buttons show loading state

## Demo

A demo page is available at `profile-sync-demo.html` that showcases the UI without requiring the full game infrastructure.

```bash
python3 -m http.server 8765
# Visit http://127.0.0.1:8765/profile-sync-demo.html
```

## Implementation Notes

- The modal is created on page load and hidden by default
- Uses CSS transitions and animations (respects `prefers-reduced-motion`)
- Modal has high z-index (10000) to appear above game content
- Status messages auto-dismiss after specified duration
- Clipboard API used with fallback message
- Fully self-contained - no dependencies on external libraries

## Player Education

The UI includes built-in help text:
- "Same code, every device 🎮" - Tagline
- "Copy This" / "Paste Someone Else's Code" - Clear section headers
- "📱 Use this code on any device" - Hint under code display
- "⬇️ Loads their progress" - Hint under input
- "How it works:" section with 4 clear steps
