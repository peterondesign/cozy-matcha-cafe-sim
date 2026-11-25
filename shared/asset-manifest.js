/**
 * Asset preload manifests for each scene
 * Defines which assets are critical, important, or optional for each part of the game
 */

export const COUNTER_ASSETS = {
  critical: [
    // Order card background
    { url: 'order.png', type: 'image' },
    // All customer animations - essential to gameplay
    ...Array.from({ length: 10 }, (_, i) =>
      Array.from({ length: 12 }, (_, f) => ({
        url: `customers/${String(i + 1).padStart(2, '0')}/frame_${String(f + 1).padStart(2, '0')}.png`,
        type: 'image'
      }))
    ).flat(),
  ],
  important: [
    // Drink animations
    { url: 'pour/frame_16.png', type: 'image' },
    { url: 'ice/frame_08.png', type: 'image' },
    { url: 'finish/frame_08.png', type: 'image' },
    // Background
    { url: 'plate_window.png', type: 'image' },
    { url: 'park-day.webp', type: 'image' },
    { url: 'park-night.webp', type: 'image' },
  ],
  optional: [
    // Specific drink recipes
    { url: 'hot/whisk/frame_16.png', type: 'image' },
    { url: 'berry/pour/frame_08.png', type: 'image' },
    { url: 'blue/pour/frame_06.png', type: 'image' },
    { url: 'melon/blend/frame_07.png', type: 'image' },
    { url: 'peach/whisk/frame_03.png', type: 'image' },
  ]
};

export const PARK_ASSETS = {
  critical: [
    { url: 'world-day.webp', type: 'image' },
    { url: 'world-night.webp', type: 'image' },
    { url: '../rigging-test/action-assets.json?v=2', type: 'json' },
  ],
  important: [
    // Visitor sprites - loaded progressively
    ...Array.from({ length: 6 }, (_, i) => ({
      url: `sprites/visitor-${String(i + 1).padStart(2, '0')}-walk.webp`,
      type: 'image'
    })),
  ],
  optional: [
    // Additional environment assets
    { url: 'day-prop-0.png', type: 'image' },
    { url: 'day-prop-1.png', type: 'image' },
    { url: 'day-prop-2.png', type: 'image' },
    { url: 'day-prop-3.png', type: 'image' },
  ]
};

export const MENU_ASSETS = {
  critical: [
    { url: 'layers/ui/background.png', type: 'image' },
    { url: 'layers/ui/icon-coin.png', type: 'image' },
  ],
  important: [
    // Avatars
    ...Array.from({ length: 8 }, (_, i) => ({
      url: `layers/avatars/avatar-${i + 1}.png?v=2`,
      type: 'image'
    })),
    // Recipe icons
    { url: '../counter/finish/frame_08.png', type: 'image' },
    { url: '../counter/hot/whisk/frame_16.png', type: 'image' },
    { url: '../counter/berry/pour/frame_08.png', type: 'image' },
    { url: '../counter/blue/pour/frame_06.png', type: 'image' },
  ],
  optional: []
};

export const GARDEN_ASSETS = {
  critical: [
    { url: 'index.html', type: 'html' },
  ],
  important: [],
  optional: []
};

export const GROCER_ASSETS = {
  critical: [
    { url: 'grocer.webp', type: 'image' },
    { url: 'grocer-night.webp', type: 'image' },
  ],
  important: [
    // Product images
  ],
  optional: []
};

/**
 * Global asset manifest that ties scenes together
 * Load these on first app boot
 */
export const SHARED_ASSETS = {
  critical: [
    // Audio bus and HUD components
    { url: '../shared/audio-bus.js?v=2', type: 'json' },
    { url: '../shared/world-hud.js?v=3', type: 'json' },
  ],
  important: [
    // Sounds
    { url: '../audio/Music Cafe.mp3', type: 'audio' },
    { url: '../audio/whisk.mp3', type: 'audio' },
    { url: '../audio/pour.mp3', type: 'audio' },
    { url: '../audio/clink.mp3', type: 'audio' },
  ],
  optional: [
    // Additional music tracks
    { url: '../audio/Music Cafe 2.mp3', type: 'audio' },
    { url: '../audio/Music Cafe 3.mp3', type: 'audio' },
    { url: '../audio/park-ambience-v01.mp3', type: 'audio' },
  ]
};
