/**
 * Utility Functions - Performance optimizations and common helpers
 * Provides debouncing, throttling, memoization, and data manipulation functions
 */

/**
 * Debounces function execution to prevent excessive calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
};

/**
 * Throttles function execution to limit call frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoizes function results for performance optimization
 * @param {Function} fn - Function to memoize
 * @param {number} maxSize - Maximum cache size
 * @returns {Function} Memoized function
 */
export const memoize = (fn, maxSize = 100) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);

    // LRU cache eviction
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
};

// Animation utilities
export const raf = (callback) =>
  window.requestAnimationFrame
    ? requestAnimationFrame(callback)
    : setTimeout(callback, 16);

export const cancelRaf = (id) =>
  window.cancelAnimationFrame ? cancelAnimationFrame(id) : clearTimeout(id);

// Batch DOM updates
export class DOMBatcher {
  constructor() {
    this.queue = { reads: [], writes: [] };
    this.scheduled = false;
  }

  read(fn) {
    this.queue.reads.push(fn);
    this.schedule();
  }

  write(fn) {
    this.queue.writes.push(fn);
    this.schedule();
  }

  schedule() {
    if (!this.scheduled) {
      this.scheduled = true;
      raf(() => this.flush());
    }
  }

  flush() {
    const { reads, writes } = this.queue;
    this.queue = { reads: [], writes: [] };
    this.scheduled = false;

    // Execute all reads first, then writes
    reads.forEach((fn) => fn());
    writes.forEach((fn) => fn());
  }
}

// Promise utilities
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

// Array utilities
export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = (array, key) => {
  if (!key) return [...new Set(array)];
  const seen = new Set();
  return array.filter((item) => {
    const k = item[key];
    return seen.has(k) ? false : seen.add(k);
  });
};
