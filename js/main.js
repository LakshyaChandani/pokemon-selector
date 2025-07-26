/**
 * Pokemon Selector Application - Main entry point
 * Interactive Pokemon browser with search, type effectiveness, and evolution tracking
 */

// External API and utility modules
import { PokemonAPI } from "../modules/api.js";
import { Autocomplete } from "../modules/autocomplete.js";
import { TypeEffectiveness } from "../modules/typeEffectiveness.js";
import { ImageLoader, ImagePreloader } from "../modules/imageLoader.js";
import { ErrorHandler, ErrorBoundary } from "../modules/errorHandler.js";
import { debounce } from "../modules/utils.js";
import { TYPE_CHART } from "../data/typeChart.js";
import { animateNumber } from "./utils/number-animation.js";

// Core application modules
import { $, show, hide } from "./core/dom-utils.js";
import { state } from "./core/state.js";
import { CONFIG } from "./core/config.js";

// UI Components
import { PokemonDisplay } from "./components/PokemonDisplay.js";
import { PokemonStats } from "./components/PokemonStats.js";
import { PokemonForms } from "./components/PokemonForms.js";
import { ThemeToggle } from "./components/ThemeToggle.js";
import { TypeEffectivenessDisplay } from "./components/TypeEffectiveness.js";

// Feature modules
import { Navigation } from "./features/navigation.js";
import { ShinyToggle } from "./features/shiny-toggle.js";
import { KeyboardShortcuts } from "./features/keyboard-shortcuts.js";
import { PokemonSearch } from "./components/PokemonSearch.js";

/**
 * Main Pokemon Application Class
 * Coordinates all components and manages application state
 */
class PokemonApp {
  constructor() {
    // Initialize core services
    this.api = new PokemonAPI();
    this.errorHandler = new ErrorHandler();
    this.imageLoader = new ImageLoader({ fadeIn: true });
    this.imagePreloader = new ImagePreloader();
    this.typeCalculator = new TypeEffectiveness(TYPE_CHART);

    // Initialize UI components
    this.components = {
      display: new PokemonDisplay(this.imageLoader, this.imagePreloader),
      stats: new PokemonStats(),
      forms: new PokemonForms(this.api),
      theme: new ThemeToggle(),
      effectiveness: new TypeEffectivenessDisplay(this.typeCalculator),
      search: new PokemonSearch(this.api, this.errorHandler),
    };

    // Initialize application features
    this.features = {
      navigation: new Navigation((id) => this.loadPokemon(id)),
      shiny: new ShinyToggle(),
      keyboard: new KeyboardShortcuts(this),
    };

    this.errorBoundary = new ErrorBoundary(
      $("#pokemon-display"),
      '<div class="error-message">Failed to load Pokémon data</div>'
    );

    this.init();
  }

  async init() {
    try {
      this.components.theme.init($(".header-content"));
      await this.components.search.init();
      this.bindEvents();
      this.initHelpButton();
      this.checkUrlParams();
      this.features.keyboard.init();
      this.updateLayoutState(false);
      this.initQuickStats();
    } catch (error) {
      this.showCriticalError(error);
    }
  }

  initQuickStats() {
    const statsSection = $(".quick-stats");
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animations = [
              {
                selector: ".stat-card:nth-child(1) h3",
                value: 1025,
                duration: 2000,
              },
              {
                selector: ".stat-card:nth-child(2) h3",
                value: 18,
                duration: 1500,
              },
              {
                selector: ".stat-card:nth-child(3) h3",
                value: 9,
                duration: 1000,
              },
            ];

            animations.forEach(({ selector, value, duration }) => {
              animateNumber(selector, value, { duration, startValue: 0 });
            });

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(statsSection);
  }

  initHelpButton() {
    const helpButton = $("#help-button");
    const helpModal = $("#help-modal");
    const closeModalBtn = $(".modal-close-btn");

    if (helpButton && helpModal && closeModalBtn) {
      const openModal = () => {
        helpModal.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
      };

      const closeModal = () => {
        helpModal.classList.add("hidden");
        document.body.style.overflow = ""; // Restore scrolling
      };

      helpButton.addEventListener("click", openModal);
      closeModalBtn.addEventListener("click", closeModal);

      // Close modal by clicking the background overlay
      helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) {
          closeModal();
        }
      });

      // Close modal with Escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !helpModal.classList.contains("hidden")) {
          closeModal();
        }
      });

      // Add keyboard shortcut to open help modal with "?"
      document.addEventListener("keydown", (e) => {
        if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const activeElement = document.activeElement;
          const isInputFocused =
            activeElement &&
            (activeElement.tagName === "INPUT" ||
              activeElement.tagName === "TEXTAREA");

          if (!isInputFocused) {
            e.preventDefault();
            if (helpModal.classList.contains("hidden")) {
              openModal();
            } else {
              closeModal();
            }
          }
        }
      });
    }
  }

  bindEvents() {
    const searchInput = $("#pokemon-search");
    const searchButton = $("#search-button");

    const performSearch = () => this.performSearch();

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });

    this.features.navigation.init();
    this.features.shiny.init();

    $("#pokemon-sprite")?.addEventListener("click", () => {
      const pokemon = state.get("pokemon");
      if (pokemon) {
        window.location.href = `pages/evolution.html?id=${pokemon.id}&name=${pokemon.name}`;
      }
    });

    // Custom events
    window.addEventListener("load-pokemon", (e) => this.loadPokemon(e.detail));
    window.addEventListener("pokemon-search", (e) => {
      $("#pokemon-search").value = e.detail;
      this.performSearch();
    });
  }

  async performSearch() {
    const searchValue = $("#pokemon-search").value.trim();

    if (!searchValue) {
      return this.showError("Please enter a Pokémon name or number");
    }

    const num = parseInt(searchValue);
    if (!isNaN(num)) {
      const { MIN_POKEMON_ID, MAX_POKEMON_ID } = CONFIG.LIMITS;
      if (num >= MIN_POKEMON_ID && num <= MAX_POKEMON_ID) {
        await this.loadPokemon(num);
      } else {
        this.showError(
          `Please enter a number between ${MIN_POKEMON_ID} and ${MAX_POKEMON_ID}`
        );
      }
    } else {
      await this.loadPokemon(searchValue.toLowerCase());
    }
  }

  async loadPokemon(idOrName) {
    show($("#loading"));
    hide($("#error-message"));
    hide($("#pokemon-display"));

    try {
      const pokemon = await this.components.search.load(idOrName);
      state.set("pokemon", pokemon);

      await this.errorBoundary.wrapAsync(async () => {
        await this.displayPokemon(pokemon);
      });

      this.components.search.addToHistory(pokemon);
      this.components.search.prefetchAdjacent(pokemon.id);
      this.updateLayoutState(true);

      hide($("#loading"));
      show($("#pokemon-display"));
    } catch (error) {
      this.errorHandler.logError(error, {
        phase: "loadPokemon",
        pokemonId: idOrName,
      });
      this.showError(
        "Pokémon not found. Please check your input and try again."
      );
      state.set("pokemon", null);
      hide($("#loading"));
    }
  }

  async displayPokemon(pokemon) {
    $("#forms-button")?.remove();

    await this.components.display.display(pokemon);
    this.components.stats.display(pokemon);
    this.components.effectiveness.display(pokemon);
    this.components.display.updateNavigation(pokemon);

    if (pokemon.speciesData?.varieties?.length > 1) {
      this.components.forms.showButton(pokemon.speciesData.varieties);
    }
  }

  showError(message) {
    const errorDiv = $("#error-message");
    errorDiv.textContent = message;
    show(errorDiv);
    setTimeout(() => hide(errorDiv), 5000);
  }

  showCriticalError(error) {
    this.errorHandler.logError(error, { phase: "initialization" });
    document.body.innerHTML = `
      <div class="critical-error">
        <h1>Unable to load Pokémon Selector</h1>
        <p>There was an error initializing the application.</p>
        <p>Error: ${error.message}</p>
        <button onclick="location.reload()">Refresh Page</button>
      </div>
    `;
  }

  updateLayoutState(hasPokemon) {
    const searchSection = $("#search-section");
    const headerSection = $("#header");

    const action = hasPokemon ? "remove" : "add";
    const oppositeAction = hasPokemon ? "add" : "remove";

    searchSection.classList[action]("expanded");
    searchSection.classList[oppositeAction]("compact");
    headerSection.classList[oppositeAction]("compact");
  }

  checkUrlParams() {
    const pokemon = new URLSearchParams(window.location.search).get("pokemon");
    if (pokemon) {
      $("#pokemon-search").value = pokemon;
      this.performSearch();
    }
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.pokemonApp = new PokemonApp();
  } catch (error) {
    console.error("Failed to initialize app:", error);
    document.body.innerHTML = `
      <div class="critical-error">
        <h1>Unable to load Pokémon Selector</h1>
        <p>Please refresh the page or try again later.</p>
        <button onclick="location.reload()">Refresh</button>
      </div>
    `;
  }
});

// Global error handlers
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});
