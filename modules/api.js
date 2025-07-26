/**
 * Pokemon API Client - Handles all interactions with the PokeAPI
 * Features intelligent caching, request deduplication, and error handling
 */
class PokemonAPI {
  constructor() {
    this.base = "https://pokeapi.co/api/v2";
    this.cache = new Map();
    this.maxCacheSize = 50;
    this.pendingRequests = new Map(); // Prevents duplicate concurrent requests
  }

  /**
   * Main API request method with caching and deduplication
   * @param {string} endpoint - API endpoint to request
   * @returns {Promise<Object>} API response data
   */
  async get(endpoint) {
    const cacheKey = this.getCacheKey(endpoint);

    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return existing promise if request is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const url = this.buildUrl(endpoint);
    const request = this.fetchData(url, cacheKey);

    this.pendingRequests.set(cacheKey, request);

    try {
      const data = await request;
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Performs the actual HTTP request and handles caching
   * @param {string} url - Full URL to fetch
   * @param {string} cacheKey - Key for caching the result
   * @returns {Promise<Object>} Parsed JSON response
   */
  async fetchData(url, cacheKey) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    this.addToCache(cacheKey, data);
    return data;
  }

  /**
   * Generates a cache key for the given endpoint
   * @param {string} endpoint - API endpoint
   * @returns {string} Cache key
   */
  getCacheKey(endpoint) {
    return endpoint.startsWith("http") ? endpoint : `api-${endpoint}`;
  }

  buildUrl(endpoint) {
    if (endpoint.startsWith("http")) return endpoint;
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${this.base}${cleanEndpoint}`;
  }

  addToCache(key, data) {
    this.cache.set(key, data);

    // LRU cache eviction
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Batch fetch with individual error handling
  async getBatch(endpoints) {
    return Promise.all(
      endpoints.map((endpoint) =>
        this.get(endpoint).catch((error) => ({
          error: true,
          endpoint,
          message: error.message,
        }))
      )
    );
  }
}

export const api = new PokemonAPI();
export { PokemonAPI };
