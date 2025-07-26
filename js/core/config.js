// API and cache configuration
export const CONFIG = {
  API_BASE_URL: 'https://pokeapi.co/api/v2',
  CACHE_DURATION: 86400000, // 24 hours
  CACHE_KEYS: {
    POKEMON_NAMES: 'pokemon-names-cache-v2',
    THEME: 'pokemon-selector-theme',
    SEARCH_HISTORY: 'pokemon-search-history'
  },
  LIMITS: {
    MIN_POKEMON_ID: 1,
    MAX_POKEMON_ID: 1025,
    MAX_HISTORY: 10,
    AUTOCOMPLETE_MAX: 10
  },
  DEBOUNCE_DELAYS: {
    SEARCH: 500,
    NAVIGATION: 300,
    KEYBOARD: 100
  }
};

// Stat name mappings
export const STAT_NAMES = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Special Attack",
  "special-defense": "Special Defense",
  speed: "Speed"
};

// Evolution trigger mappings
export const EVOLUTION_TRIGGERS = {
  "level-up": "Level Up",
  trade: "Trade",
  "use-item": "Use Item",
  shed: "Empty Spot in Party",
  spin: "Spin",
  "tower-of-darkness": "Tower of Darkness",
  "tower-of-waters": "Tower of Waters",
  "three-critical-hits": "Land 3 Critical Hits",
  "take-damage": "Take Damage",
  other: "Special Condition",
  "agile-style-move": "Use Agile Style Move",
  "strong-style-move": "Use Strong Style Move",
  "recoil-damage": "Take Recoil Damage"
};
