# Profile Sync UI - Integration Guide

## 🎯 What Was Built

A production-ready profile connection UI that allows players to sync their game progress across devices by sharing a simple code. The UI is designed to be intuitive for 13+ year olds with zero technical knowledge.

## 📦 Components

### 1. Main JavaScript Module
**File**: `shared/profile-connector.js`

```javascript
// Global instance created on page load
window.ProfileConnector

// Public methods
ProfileConnector.show()              // Open modal
ProfileConnector.hide()              // Close modal
ProfileConnector.toggle()            // Toggle open/close

// Internal methods (called by UI)
ProfileConnector.loadProfile(code)   // Load profile from code
ProfileConnector.showStatus(msg, type, duration)  // Show toast
```

### 2. Styling
**File**: `shared/profile-connector.css`

- Modal styling with smooth animations
- Responsive design (mobile-first)
- Status toast notifications
- Accessibility-first approach

### 3. HUD Integration
**Files Modified**:
- `shared/world-hud.js` - Added profile button with emoji
- `shared/hud.css` - Added `.hud-profile` button styles

### 4. Page Integrations
**Files Modified**:
- `counter/index.html`
- `park/index.html`
- `garden/index.html`
- `menu/index.html`

Added to each:
```html
<link rel="stylesheet" href="../shared/profile-connector.css">
<script src="../shared/profile-connector.js"></script>
```

## 🔌 API Requirements

The component expects `window.MatchaLeaderboard` to provide:

```javascript
{
  enabled() → boolean
    Returns true if cloud sync is available
    
  playerId() → string
    Returns the current player's unique code
    
  async pull(code: string) → {
    display_name?: string,
    avatar?: string,
    state: object  // Game state to restore
  }
    Fetches a profile by code
    
  setPlayerId(code: string) → void
    Sets the current player ID
}
```

## 💾 Data Flow

### When Copying Code
```
User clicks Copy button
  ↓
ProfileConnector.show()
  ↓
Gets code from MatchaLeaderboard.playerId()
  ↓
Copies to clipboard with navigator.clipboard.writeText()
  ↓
Shows success toast
```

### When Loading Profile
```
User enters code and clicks Load
  ↓
ProfileConnector.loadProfile(code)
  ↓
Calls MatchaLeaderboard.pull(code)
  ↓
Saves state to localStorage['matchaVisualState']
  ↓
Updates audio settings in localStorage['matchaSettings']
  ↓
Calls MatchaLeaderboard.setPlayerId(code)
  ↓
Shows success toast
  ↓
Suggests user refresh page
```

## 🎨 Customization

### Colors
Edit `shared/profile-connector.css`:
```css
/* Primary accent */
background: linear-gradient(135deg, #76c7a0 0%, #5fb88a 100%);

/* Secondary accent */
background: linear-gradient(135deg, #f4a261 0%, #e88853 100%);

/* Text colors */
color: #2c2c2c;      /* Primary text */
color: #666;         /* Secondary text */
color: #999;         /* Tertiary text */
```

### Sizes
Adjust modal max-width and button sizes:
```css
.profile-sync-card {
  max-width: 450px;  /* Modal width */
}

.profile-sync-code,
.profile-sync-input {
  padding: 14px 16px;  /* Inner spacing */
}
```

### Text Strings
Modify in `shared/profile-connector.js`:
- Line 8: `<h2>Your Profile Code</h2>` → Change title
- Line 9: `<p class="profile-sync-subtitle">Same code, every device 🎮</p>` → Change subtitle
- etc.

## 🧪 Testing

### Local Testing
```bash
# Start the game server
python3 -m http.server 8765

# Option 1: Test on counter page
open http://127.0.0.1:8765/counter/
# Click 👤 button

# Option 2: Test demo page (no backend needed)
open http://127.0.0.1:8765/profile-sync-demo.html
```

### Manual Test Cases

1. **Copy Code**
   - [ ] Click 👤 button → Modal appears
   - [ ] Click 📋 Copy → "✓ Copied!" toast appears
   - [ ] Button text changes to "copied" briefly
   - [ ] Code is in clipboard

2. **Empty Input**
   - [ ] Leave input empty
   - [ ] Click Load → "⚠️ Please paste a code first" warning
   - [ ] No API call is made

3. **Load Profile** (mocked)
   - [ ] Enter any code
   - [ ] Click Load → "⏳ Loading..." on button
   - [ ] After 1-2s → Success/error toast
   - [ ] Button returns to normal state

4. **Mobile Responsive**
   - [ ] On mobile (<600px) → Buttons stack vertically
   - [ ] All inputs remain usable
   - [ ] No horizontal scroll
   - [ ] Touch targets are 44px+ minimum

5. **Keyboard Navigation**
   - [ ] Tab through fields → Focus visible
   - [ ] Shift+Tab → Go back
   - [ ] Enter in input → Submit
   - [ ] Escape → Close modal

6. **Accessibility**
   - [ ] All buttons have aria-label
   - [ ] Focus outline visible
   - [ ] Color not only indicator
   - [ ] Sufficient contrast (WCAG AA+)

## 🚀 Deployment

### Pre-deployment Checklist

- [ ] All tests pass: `python3 tests/check_repo.py`
- [ ] No console errors on all pages
- [ ] Copy button works (needs HTTPS or localhost)
- [ ] Mobile layout is responsive
- [ ] No broken links or missing assets
- [ ] MatchaLeaderboard API is implemented
- [ ] Error messages are clear
- [ ] Animation performance is good (60fps)

### Production Notes

1. **HTTPS Required**: Clipboard API works only on HTTPS or localhost
2. **Same-Origin Policy**: MatchaLeaderboard API must be same-origin
3. **Storage Quota**: Game state can exceed localStorage limits on large profiles
4. **Cache Busting**: Add version query params to JS/CSS in production

Example version bumps:
```html
<link rel="stylesheet" href="../shared/profile-connector.css?v=1">
<script src="../shared/profile-connector.js?v=1"></script>
```

## 📚 Documentation Files

- `PROFILE_SYNC_UI.md` - Detailed feature documentation
- `PROFILE_SYNC_VISUAL_GUIDE.md` - Visual UI walkthrough
- `PROFILE_SYNC_INTEGRATION.md` - This file

## 🤝 Contributing

When modifying this component:

1. Update version numbers in HTML files
2. Keep emoji icons consistent
3. Maintain mobile-first responsive design
4. Test all keyboard interactions
5. Ensure error messages are helpful
6. Update documentation
7. Run full test suite

## 📞 Support

If the profile sync isn't working:

1. Check browser console for errors
2. Verify MatchaLeaderboard API is available
3. Test on demo page: `profile-sync-demo.html`
4. Check localStorage has space
5. Verify HTTPS or localhost for clipboard

## ✨ Future Enhancements

Potential improvements:
- [ ] QR code generation for sharing
- [ ] Profile name editing
- [ ] Multiple profiles per player
- [ ] Profile import/export
- [ ] Social features (view friend stats)
- [ ] Authentication (login/signup)
