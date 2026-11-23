const CACHE_NAME = 'matcha-assets-v1';
const root = new URL('../', import.meta.url);
const assets = [
  'park/world-day.webp', 'park/world-night.webp',
  'park/sprites/matcha_barista_walk_down.webp', 'park/sprites/matcha_barista_walk_right.webp',
  'park/sprites/matcha_barista_walk_up.webp', 'park/sprites/matcha_barista_wave.webp',
  'park/sprites/sato_walk_down_4k.webp', 'park/sprites/sato_walk_right_4k.webp',
  'park/sprites/sato_walk_up_4k.webp', 'park/sprites/hana_walk_down_4k-transparent.webp',
  'park/sprites/hana_walk_right_cycle.webp', 'park/sprites/hana_walk_up_4k-transparent.webp',
  'menu/layers/shop/cafes/small-none.png', 'menu/layers/shop/cafes/medium-none.png',
  'menu/layers/shop/cafes/large-none.png',
  'garden/assets/garden-scene.png',
  'counter/park-day.webp', 'counter/park-night.webp', 'counter/plate_window.png',
  'counter/clean_plate_POV.png',
  'park/market/cedar.webp', 'park/market/wicker.webp', 'park/market/linen.webp',
  ...['banana','berries','blueberries','coconut','fresh-coconut','honey','ice','juice','mango','matcha',
    'milk','oat','peach','pineapple','syrup','tea-leaves','vanilla','water','watermelon']
    .map(id => `park/goods/models/${id}.glb`)
].map(path => new URL(path, root).href);

export async function startAssetPreloading() {
  const splash = document.getElementById('game-loading');
  const label = document.getElementById('game-loading-label');
  const progress = document.getElementById('game-loading-progress');
  const continueButton = document.getElementById('game-loading-continue');
  continueButton.addEventListener('click', () => { splash.hidden = true; });
  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    console.warn('Persistent game asset caching is unavailable in this browser.');
    return;
  }
  splash.hidden = false;
  try {
    await Promise.race([
      navigator.serviceWorker.register(new URL('service-worker.js', root), {scope: root.pathname})
        .then(() => navigator.serviceWorker.ready),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker activation timed out.')), 10000))
    ]);
    const cache = await caches.open(CACHE_NAME);
    const missing = [];
    for (const url of assets) if (!await cache.match(url)) missing.push(url);
    let completed = assets.length - missing.length;
    const update = () => {
      progress.value = completed / assets.length * 100;
      label.textContent = `Preparing game assets (${completed} of ${assets.length})`;
    };
    update();
    const failures = [];
    async function loadNext() {
      while (missing.length) {
        const url = missing.shift();
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(url, response);
        } catch (error) {
          console.error('Could not cache game asset:', url, error);
          failures.push(url);
        }
        completed++;
        update();
      }
    }
    await Promise.all(Array.from({length: 3}, loadNext));
    if (failures.length) {
      label.textContent = `${failures.length} assets could not be cached. Continue or refresh to retry.`;
      continueButton.textContent = 'Continue';
      return;
    }
    splash.hidden = true;
  } catch (error) {
    console.error('Game asset caching failed.', error);
    label.textContent = 'Asset caching is unavailable. Continue or refresh to retry.';
    continueButton.textContent = 'Continue';
  }
}
