import { CONFIG } from "./config.js";

class StateManager {
  constructor() {
    this.watchers = {};

    this.state = {
      // Current Pokemon data
      pokemon: null,
      isShiny: false,

      // User preferences
      theme: this.loadFromStorage(CONFIG.CACHE_KEYS.THEME, "light"),

      // History and cache
      searchHistory: this.loadFromStorage(CONFIG.CACHE_KEYS.SEARCH_HISTORY, []),

      // API caches
      cache: new Map(),
      speciesCache: new Map(),
      formsCache: new Map(),
    };

    // Auto-save theme changes
    this.watchKey("theme", (value) => {
      this.saveToStorage(CONFIG.CACHE_KEYS.THEME, value);
    });

    // Auto-save search history
    this.watchKey("searchHistory", (value) => {
      this.saveToStorage(CONFIG.CACHE_KEYS.SEARCH_HISTORY, value);
    });
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Trigger watchers
    if (this.watchers[key] && oldValue !== value) {
      this.watchers[key].forEach((callback) => {
        try {
          callback(value, oldValue);
        } catch (e) {
          console.error(`Watcher error for key ${key}:`, e);
        }
      });
    }
  }

  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  // Watch for state changes
  watchKey(key, callback) {
    if (!this.watchers[key]) {
      this.watchers[key] = [];
    }
    this.watchers[key].push(callback);
  }

  // Storage helpers
  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }

  // Backward compatibility - keep old method name
  saveToLocalStorage(key, value) {
    this.saveToStorage(key, value);
  }

  loadFromStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // Backward compatibility - keep old method name
  getFromLocalStorage(key, defaultValue = null) {
    return this.loadFromStorage(key, defaultValue);
  }

  // Cache helpers
  getCached(cacheType, key) {
    return this.state[cacheType]?.get(key);
  }

  setCached(cacheType, key, value) {
    if (this.state[cacheType]) {
      this.state[cacheType].set(key, value);
    }
  }

  clearCache(cacheType) {
    if (cacheType && this.state[cacheType]) {
      this.state[cacheType].clear();
    } else {
      // Clear all caches
      this.state.cache.clear();
      this.state.speciesCache.clear();
      this.state.formsCache.clear();
    }
  }
  clearOldData() {
    try {
      // Clear old or large data
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        try {
          const item = localStorage.getItem(key);
          // Remove large items or old cache
          if (item && item.length > 100000) {
            // Items larger than 100KB
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Skip if can't parse
        }
      });
    } catch (e) {
      console.error("Failed to clear old data:", e);
    }
  }
}

export const state = new StateManager();
