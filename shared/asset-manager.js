/**
 * Centralized asset loading and caching system for the Matcha game.
 * Provides lifecycle hooks for preloading, on-demand loading, and memory management.
 */

class AssetManager {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
    this.failedAssets = new Set();
    this.loadingProgress = new Map();
    this.isPreloading = false;
  }

  /**
   * Check if an asset is cached
   */
  isCached(url) {
    return this.cache.has(url);
  }

  /**
   * Load an image asset
   */
  async loadImage(url, priority = 'normal') {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.pending.has(url)) {
      return this.pending.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      if (priority === 'low') {
        img.loading = 'lazy';
      }

      img.onload = () => {
        this.cache.set(url, img);
        this.pending.delete(url);
        this.failedAssets.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.pending.delete(url);
        this.failedAssets.add(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });

    this.pending.set(url, promise);
    return promise;
  }

  /**
   * Load JSON data
   */
  async loadJSON(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.pending.has(url)) {
      return this.pending.get(url);
    }

    const promise = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
        return response.json();
      })
      .then(data => {
        this.cache.set(url, data);
        this.pending.delete(url);
        this.failedAssets.delete(url);
        return data;
      })
      .catch(error => {
        this.pending.delete(url);
        this.failedAssets.add(url);
        throw error;
      });

    this.pending.set(url, promise);
    return promise;
  }

  /**
   * Batch load multiple assets
   */
  async loadBatch(assets, onProgress = null) {
    const promises = assets.map((asset, index) => {
      const loader = asset.type === 'json' ? this.loadJSON : this.loadImage;
      return loader.call(this, asset.url, asset.priority)
        .then(result => {
          if (onProgress) {
            onProgress({
              loaded: index + 1,
              total: assets.length,
              url: asset.url
            });
          }
          return result;
        });
    });

    return Promise.allSettled(promises);
  }

  /**
   * Preload critical assets for a scene
   */
  async preloadScene(sceneName, assetLists) {
    if (this.isPreloading) return;
    this.isPreloading = true;

    try {
      const critical = assetLists.critical || [];
      const important = assetLists.important || [];
      const optional = assetLists.optional || [];

      // Load critical assets first
      if (critical.length > 0) {
        await this.loadBatch(critical);
      }

      // Load important assets in parallel
      if (important.length > 0) {
        setImmediate(() => this.loadBatch(important));
      }

      // Load optional assets last
      if (optional.length > 0) {
        requestIdleCallback(() => this.loadBatch(optional));
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Clear cached assets for a specific pattern
   */
  clearPattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached assets
   */
  clearCache() {
    this.cache.clear();
    this.pending.clear();
    this.failedAssets.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cached: this.cache.size,
      pending: this.pending.size,
      failed: this.failedAssets.size
    };
  }

  /**
   * Check if any assets are still loading
   */
  hasLoadingAssets() {
    return this.pending.size > 0;
  }
}

// Global singleton instance
globalThis.MatchaAssets = new AssetManager();

export default globalThis.MatchaAssets;
