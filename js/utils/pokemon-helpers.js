import { CONFIG } from "../core/config.js";

// Type color mapping
const TYPE_COLORS = {
  normal: "#A8A878",
  fighting: "#C03028",
  flying: "#A890F0",
  poison: "#A040A0",
  ground: "#E0C068",
  rock: "#B8A038",
  bug: "#A8B820",
  ghost: "#705898",
  steel: "#B8B8D0",
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  psychic: "#F85888",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  fairy: "#EE99AC",
};

// Stat thresholds for coloring
const STAT_THRESHOLDS = [
  { max: 50, color: "#F44336" },
  { max: 90, color: "#FF9800" },
  { max: 120, color: "#4CAF50" },
  { max: Infinity, color: "#2196F3" },
];

// Generation boundaries
const GENERATION_BOUNDS = [151, 251, 386, 493, 649, 721, 809, 905, 1025];

// Starter Pokemon IDs
const STARTER_IDS = new Set([
  1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653,
  656, 722, 725, 728, 810, 813, 816, 906, 909, 912,
]);

export const PokemonHelpers = {
  // Formatting
  formatId: (id) => `#${id.toString().padStart(3, "0")}`,
  formatHeight: (height) => `${(height / 10).toFixed(1)} m`,
  formatWeight: (weight) => `${(weight / 10).toFixed(1)} kg`,

  // Sprites
  getSpriteUrl(sprites, isShiny = false) {
    const artwork = sprites.other?.["official-artwork"];
    const primary = isShiny ? "front_shiny" : "front_default";
    const fallback = "front_default";

    return (
      artwork?.[primary] ||
      sprites[primary] ||
      artwork?.[fallback] ||
      sprites[fallback]
    );
  },

  hasShinySprite: (sprites) =>
    !!(sprites.other?.["official-artwork"]?.front_shiny || sprites.front_shiny),

  // Colors and styling
  getTypeColor: (type) => TYPE_COLORS[type] || "#68A090",

  getStatColor: (statValue) =>
    STAT_THRESHOLDS.find((threshold) => statValue < threshold.max).color,

  // Calculations
  calculateTotalStats: (stats) =>
    stats.reduce((total, stat) => total + stat.base_stat, 0),

  // Generation and validation
  getGeneration: (id) => {
    const gen = GENERATION_BOUNDS.findIndex((bound) => id <= bound) + 1;
    return gen > 0 ? gen : "Special";
  },

  isValidId: (id) =>
    id >= CONFIG.LIMITS.MIN_POKEMON_ID && id <= CONFIG.LIMITS.MAX_POKEMON_ID,

  // Categories
  getCategory: (id, speciesData) => {
    if (STARTER_IDS.has(id)) return "starter";
    if (speciesData?.is_legendary) return "legendary";
    if (speciesData?.is_mythical) return "mythical";
    return "regular";
  },
};
