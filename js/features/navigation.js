import { $, show, hide } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { throttle } from "../../modules/utils.js";

export class Navigation {
  constructor(loadPokemonCallback) {
    this.loadPokemon = loadPokemonCallback;
  }

  init() {
    const throttledPrev = throttle(
      () => this.navigatePrev(),
      CONFIG.DEBOUNCE_DELAYS.NAVIGATION
    );
    const throttledNext = throttle(
      () => this.navigateNext(),
      CONFIG.DEBOUNCE_DELAYS.NAVIGATION
    );

    $("#prev-pokemon")?.addEventListener("click", throttledPrev);
    $("#next-pokemon")?.addEventListener("click", throttledNext);
  }

  navigatePrev() {
    const currentPokemon = state.get("pokemon");
    if (currentPokemon?.id > CONFIG.LIMITS.MIN_POKEMON_ID) {
      this.loadPokemon(currentPokemon.id - 1);
    }
  }

  navigateNext() {
    const currentPokemon = state.get("pokemon");
    if (currentPokemon?.id < CONFIG.LIMITS.MAX_POKEMON_ID) {
      this.loadPokemon(currentPokemon.id + 1);
    }
  }

  updateButtons(pokemonId) {
    $("#prev-pokemon").disabled = pokemonId <= CONFIG.LIMITS.MIN_POKEMON_ID;
    $("#next-pokemon").disabled = pokemonId >= CONFIG.LIMITS.MAX_POKEMON_ID;
  }
}
