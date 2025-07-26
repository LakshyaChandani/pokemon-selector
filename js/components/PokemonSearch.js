// js/components/PokemonSearch.js
import { $, show, hide } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { AutocompleteInitializer } from "../features/autocomplete-init.js";

export class PokemonSearch {
  constructor(api, errorHandler) {
    this.api = api;
    this.errorHandler = errorHandler;
    this.autocompleteInit = new AutocompleteInitializer(api, errorHandler);
  }

  async init() {
    await this.autocompleteInit.init();
  }

  async load(idOrName) {
    const pokemon = await this.errorHandler.retry(
      () => this.api.get(`/pokemon/${idOrName}`),
      { attempts: 3, delay: 1000, backoff: 2 }
    );

    // Fetch species data with fallback
    pokemon.speciesData = await this.fetchSpeciesData(pokemon);
    return pokemon;
  }

  async fetchSpeciesData(pokemon) {
    try {
      return await this.api.get(pokemon.species.url);
    } catch (error) {
      console.warn("Could not fetch species data:", error);
      return { name: pokemon.species.name, varieties: [] };
    }
  }

  addToHistory(pokemon) {
    const history = state
      .get("searchHistory")
      .filter((p) => p.id !== pokemon.id);

    history.unshift({ id: pokemon.id, name: pokemon.name });

    const updatedHistory = history.slice(0, CONFIG.LIMITS.MAX_HISTORY);
    state.set("searchHistory", updatedHistory);
    state.saveToLocalStorage(CONFIG.CACHE_KEYS.SEARCH_HISTORY, updatedHistory);
  }

  async prefetchAdjacent(currentId) {
    const { MIN_POKEMON_ID, MAX_POKEMON_ID } = CONFIG.LIMITS;
    const adjacentIds = [currentId - 1, currentId + 1].filter(
      (id) => id >= MIN_POKEMON_ID && id <= MAX_POKEMON_ID
    );

    // Silently prefetch
    adjacentIds.forEach((id) => this.api.get(`/pokemon/${id}`).catch(() => {}));
  }
}
