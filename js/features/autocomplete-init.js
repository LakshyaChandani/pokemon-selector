import { $ } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { Autocomplete } from "../../modules/autocomplete.js";
import { formatName } from "../utils/form-helpers.js";

// Form name mappings
const FORM_MAPPINGS = {
  mega: {
    suffix: ["x", "y"],
    format: (base, suffix) =>
      `${base} (Mega${suffix ? ` ${suffix.toUpperCase()}` : ""})`,
  },
  gmax: { format: (base) => `${base} (Gigantamax)` },
  regional: {
    alola: "Alolan",
    galar: "Galarian",
    hisui: "Hisuian",
    paldea: "Paldean",
  },
  special: {
    primal: "Primal",
    origin: "Origin",
    therian: "Therian",
    incarnate: "Incarnate",
    blade: "Blade Forme",
    shield: "Shield Forme",
    10: "10% Forme",
    50: "50% Forme",
    complete: "Complete Forme",
    unbound: "Unbound",
    "ice-rider": "Ice Rider",
    "shadow-rider": "Shadow Rider",
    "single-strike": "Single Strike Style",
    "rapid-strike": "Rapid Strike Style",
  },
};

// Common alternate names
const ALTERNATE_NAMES = {
  "nidoran-f": ["nidoran female", "nidoranf"],
  "nidoran-m": ["nidoran male", "nidoranm"],
  "mr-mime": ["mr mime", "mrmime"],
  "type-null": ["type null", "typenull"],
  "tapu-koko": ["tapu koko", "tapukoko"],
  flabebe: ["flabébé"],
  sirfetchd: ["sirfetch'd"],
};

export class AutocompleteInitializer {
  constructor(api, errorHandler) {
    this.api = api;
    this.errorHandler = errorHandler;
    this.autocomplete = null;
    this.pokemonData = [];
  }

  async init() {
    const input = $("#pokemon-search");
    if (!input) return null;

    await this.loadPokemonData();

    this.autocomplete = new Autocomplete(input, {
      minChars: 1,
      maxResults: CONFIG.LIMITS.AUTOCOMPLETE_MAX,
      debounceTime: 300,
      onSelect: (value) => {
        window.dispatchEvent(
          new CustomEvent("pokemon-search", { detail: value })
        );
      },
      formatLabel: (item) => item.label,
    });

    this.autocomplete.setItems(this.pokemonData);
    return this.autocomplete;
  }

  async loadPokemonData() {
    // Try cache first
    const cached = this.getCachedData();
    if (cached) {
      this.pokemonData = cached;
      return;
    }

    try {
      const response = await this.errorHandler.retry(
        () => this.api.get("/pokemon?limit=10000"),
        { attempts: 3 }
      );

      this.pokemonData = this.processPokeData(response.results);
      this.cacheData(this.pokemonData);
    } catch (error) {
      this.errorHandler.logError(error, { phase: "loadPokemonData" });
      this.pokemonData = this.getFallbackData();
    }
  }

  processPokeData(results) {
    return results.map((pokemon) => {
      const id = this.extractId(pokemon.url);
      const label = this.formatPokemonLabel(pokemon.name, id);

      return {
        value: pokemon.name,
        label,
        id,
        searchTerms: this.generateSearchTerms(pokemon.name),
      };
    });
  }

  extractId(url) {
    if (!url) return null;
    const parts = url.split("/").filter(Boolean);
    return parseInt(parts[parts.length - 1]);
  }

  formatPokemonLabel(name, id) {
    const formattedName = name.includes("-")
      ? this.formatFormName(name)
      : formatName(name);

    return id ? `${formattedName} (#${id})` : formattedName;
  }

  formatFormName(name) {
    const [baseName, ...formParts] = name.split("-");
    const base = formatName(baseName);
    const formString = formParts.join("-");

    // Check mega forms
    if (formString.includes("mega")) {
      const suffix = formParts[formParts.length - 1];
      return FORM_MAPPINGS.mega.format(
        base,
        FORM_MAPPINGS.mega.suffix.includes(suffix) ? suffix : null
      );
    }

    // Check gigantamax
    if (formString === "gmax") {
      return FORM_MAPPINGS.gmax.format(base);
    }

    // Check regional forms
    for (const [key, label] of Object.entries(FORM_MAPPINGS.regional)) {
      if (formString.includes(key)) {
        return `${base} (${label})`;
      }
    }

    // Check special forms
    for (const [key, label] of Object.entries(FORM_MAPPINGS.special)) {
      if (formString.includes(key)) {
        return `${base} (${label})`;
      }
    }

    // Default formatting
    return `${base} (${formParts.map((p) => formatName(p)).join(" ")})`;
  }

  generateSearchTerms(name) {
    const terms = [name];

    // Add base name for forms
    if (name.includes("-")) {
      terms.push(name.split("-")[0]);
    }

    // Add alternates
    if (ALTERNATE_NAMES[name]) {
      terms.push(...ALTERNATE_NAMES[name]);
    }

    return terms;
  }

  getCachedData() {
    try {
      const cached = localStorage.getItem(CONFIG.CACHE_KEYS.POKEMON_NAMES);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      if (Date.now() - timestamp < CONFIG.CACHE_DURATION) {
        return data;
      }

      localStorage.removeItem(CONFIG.CACHE_KEYS.POKEMON_NAMES);
    } catch (error) {
      console.error("Cache read error:", error);
    }
    return null;
  }

  cacheData(data) {
    try {
      localStorage.setItem(
        CONFIG.CACHE_KEYS.POKEMON_NAMES,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Cache write error:", error);
      state.clearOldData?.(); // Use the clearOldData method if available
    }
  }

  getFallbackData() {
    const fallback = [
      "bulbasaur",
      "charmander",
      "squirtle",
      "pikachu",
      "eevee",
    ];
    return fallback.map((name) => ({
      value: name,
      label: formatName(name),
      searchTerms: [name],
    }));
  }

  destroy() {
    this.autocomplete?.destroy();
    this.autocomplete = null;
  }
}
