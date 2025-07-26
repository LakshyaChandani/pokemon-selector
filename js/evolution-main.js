import { ErrorHandler } from "../modules/errorHandler.js";
import { $, show, hide } from "./core/dom-utils.js";
import { state } from "./core/state.js";
import { ThemeToggle } from "./components/ThemeToggle.js";
import { EvolutionTree } from "./evolution/EvolutionTree.js";
import { FormsSection } from "./evolution/FormsSection.js";

class EvolutionApp {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.components = {
      theme: new ThemeToggle(),
      evolution: new EvolutionTree(),
      forms: new FormsSection(),
    };

    const params = new URLSearchParams(window.location.search);
    const pokemonId = params.get("id");
    const pokemonName = params.get("name");

    if (!pokemonId) {
      return this.showError("No Pokémon specified");
    }

    state.set("currentPokemonName", pokemonName);
    state.set("pokemonId", pokemonId);

    this.init();
  }

  init() {
    this.components.theme.init($(".header"));
    this.bindEvents();
    this.loadEvolutionChain();
  }

  bindEvents() {
    $("#back-button").addEventListener("click", () => {
      const pokemonName = state.get("currentPokemonName");
      const params = pokemonName ? `?pokemon=${pokemonName}` : "";
      window.location.href = `../index.html${params}`;
    });
  }

  async loadEvolutionChain() {
    const pokemonId = state.get("pokemonId");

    show($("#loading"));
    hide($("#error-message"));

    try {
      const chain = await this.components.evolution.load(pokemonId);
      if (!chain) throw new Error("No evolution data found");

      await this.components.evolution.display(chain);

      hide($("#loading"));
      show($("#evolution-display"));

      // Load forms after evolution tree
      setTimeout(() => {
        this.components.forms.load(chain).catch(console.error);
      }, 300);
    } catch (error) {
      console.error("Error loading evolution chain:", error);
      this.showError("Failed to load evolution data. Please try again.");
      hide($("#loading"));
    }
  }

  showError(message) {
    const errorDiv = $("#error-message");
    errorDiv.textContent = message;
    show(errorDiv);
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  try {
    new EvolutionApp();
  } catch (error) {
    console.error("Failed to initialize evolution app:", error);
  }
});