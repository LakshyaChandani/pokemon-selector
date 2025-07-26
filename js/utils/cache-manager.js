// js/utils/cache-manager.js
import { CONFIG } from "../core/config.js";

class CacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.cacheTimestamps = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || CONFIG.CACHE_DURATION;
  }

  get(key, ttl = this.defaultTTL) {
    const timestamp = this.cacheTimestamps.get(key);

    if (timestamp && Date.now() - timestamp > ttl) {
      this.delete(key);
      return null;
    }

    return this.memoryCache.get(key);
  }

  set(key, value) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      const firstKey = this.memoryCache.keys().next().value;
      this.delete(firstKey);
    }

    this.memoryCache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  delete(key) {
    this.memoryCache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  clear() {
    this.memoryCache.clear();
    this.cacheTimestamps.clear();
  }

  has(key) {
    return this.memoryCache.has(key) && this.get(key) !== null;
  }

  size() {
    return this.memoryCache.size;
  }

  cleanup(ttl = this.defaultTTL) {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.delete(key));
    return keysToDelete.length;
  }

  // Get all valid cached keys
  keys() {
    this.cleanup();
    return Array.from(this.memoryCache.keys());
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.size(),
      maxSize: this.maxSize,
      oldestEntry: Math.min(...Array.from(this.cacheTimestamps.values())),
      newestEntry: Math.max(...Array.from(this.cacheTimestamps.values())),
    };
  }
}

// LocalStorage utilities as a separate object
export const StorageUtils = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage:`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  },

  isAvailable() {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
};

// Export default instance
export const cacheManager = new CacheManager();

// Export class for custom instances
export { CacheManager };

// Backward compatibility
export class CacheManagerLegacy extends CacheManager {
  static getFromLocalStorage = StorageUtils.get;
  static setToLocalStorage = StorageUtils.set;
  static removeFromLocalStorage = StorageUtils.remove;
  static isLocalStorageAvailable = StorageUtils.isAvailable;
}
