# Profile Sync UI - Visual Guide

## 🎮 The Button

Located in the top HUD next to the music button:
```
┌─────────────────────────┐
│  🪙  💎  📅  🕐  ☰  👤 │  ← Your new profile button!
└─────────────────────────┘
     (HUD)
```

## 📱 The Modal

When you click the 👤 button, this appears:

```
┌────────────────────────────────────────┐
│                                      ✕ │
│          Your Profile Code             │
│      Same code, every device 🎮        │
│                                        │
│  Your Code (Copy This)                 │
│  ┌──────────────────────┐  ┌────────┐ │
│  │ mint-tea-42          │  │📋 Copy │ │
│  └──────────────────────┘  └────────┘ │
│  📱 Use this code on any device        │
│                                        │
│  Paste Someone Else's Code             │
│  ┌──────────────────────────────────┐  │
│  │ paste-code-here-99               │  │
│  └──────────────────────────────────┘  │
│  ┌────────┐                            │
│  │↓ Load  │                            │
│  └────────┘                            │
│  ⬇️ Loads their progress               │
│                                        │
│  💡 How it works:                      │
│  • Copy your code, share with friends  │
│  • Open game on another device         │
│  • Paste their code to play their      │
│    progress                            │
│  • Your code saves automatically       │
└────────────────────────────────────────┘
```

## 🔄 User Flow

### Scenario 1: Copy Your Code
```
1. Click 👤 button
   ↓
2. Modal appears with your code
   ↓
3. Click 📋 Copy button
   ↓
4. ✓ Toast: "Copied to clipboard!"
   ↓
5. Close modal (click ✕ or press Escape)
   ↓
6. Share code with friends!
```

### Scenario 2: Paste Friend's Code
```
1. Friend gives you a code
   ↓
2. Click 👤 button
   ↓
3. Paste the code in the input field
   ↓
4. Click ↓ Load button
   ↓
5. ⏳ Shows "Loading..." on button
   ↓
6. ✓ Toast: "Loaded their profile!"
   ↓
7. Refresh the page to see it
   ↓
8. Play their progress!
```

## 🎨 Color Scheme

```
✓ Success Messages    → Green (#76c7a0)  "✓ Copied!"
⚠ Warning Messages   → Orange (#f4a261) "⚠️ Empty field!"
❌ Error Messages     → Red (#dc5d5d)    "❌ Code not found!"
ℹ Info Messages      → Blue (#6496c8)   "ℹ Cloud sync off"
```

## 📲 Mobile View

On small screens, the layout stacks:

```
┌─────────────────────────┐
│  Your Profile Code      │
│  Same code, every...    │
│                         │
│  Your Code (Copy This)  │
│  ┌───────────────────┐  │
│  │ mint-tea-42       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │📋 Copy            │  │
│  └───────────────────┘  │
│                         │
│  Paste Someone Else's   │
│  ┌───────────────────┐  │
│  │ paste-code-...    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │↓ Load             │  │
│  └───────────────────┘  │
│                         │
│  💡 How it works:       │
│  • Copy your code...    │
│  • Paste on device...   │
│  • Play their profile   │
└─────────────────────────┘
```

## ⌨️ Keyboard Support

| Key | Action |
|-----|--------|
| Tab | Focus next field |
| Shift+Tab | Focus previous field |
| Enter | Submit (copy or load) |
| Escape | Close modal |

## 🎯 For 13-Year-Olds

The UI uses:
- ✅ Simple emoji icons (📋, 👤, ↓, ⚠️)
- ✅ Clear action labels ("Copy This", "Paste")
- ✅ Helpful hints below each section
- ✅ Big, colorful buttons with shadows
- ✅ Smooth animations (feels nice to use)
- ✅ Plain language (no jargon)
- ✅ Visual feedback (toast messages)

## 🧪 Testing

To test locally:

```bash
# Start server
python3 -m http.server 8765

# Option 1: Visit game and click 👤 button
http://127.0.0.1:8765/counter/

# Option 2: Visit demo page (works without game backend)
http://127.0.0.1:8765/profile-sync-demo.html
```

## 🚀 Integration Points

The component integrates with:
- `window.MatchaLeaderboard.playerId()` - Get current code
- `window.MatchaLeaderboard.pull(code)` - Load profile data
- `localStorage['matchaVisualState']` - Game state storage
- `localStorage['matchaSettings']` - Player settings

## ✨ Details

- **Animations**: Smooth slide-up and fade effects
- **Focus**: Clear blue outline on keyboard navigation
- **Responsive**: Works at 320px (small phone) to 4K
- **Accessible**: Full keyboard support, ARIA labels
- **Fast**: No external dependencies, instant load
- **Safe**: HTTPS recommended for clipboard API
