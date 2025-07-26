import { $ } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { throttle } from "../../modules/utils.js";

export class KeyboardShortcuts {
  constructor(app) {
    this.app = app;
  }

  init() {
    document.addEventListener(
      "keydown",
      throttle((e) => this.handleKeyPress(e), CONFIG.DEBOUNCE_DELAYS.KEYBOARD)
    );

    // Add help tooltip
    this.addHelpTooltip();
  }

  handleKeyPress(e) {
    // Skip if typing in inputs
    if (this.isTypingInInput()) return;

    const pokemon = state.get("pokemon");
    if (!pokemon) return;

    switch (e.key.toLowerCase()) {
      case "arrowleft":
        e.preventDefault();
        this.navigatePrevious();
        break;

      case "arrowright":
        e.preventDefault();
        this.navigateNext();
        break;

      case "s":
        e.preventDefault();
        this.toggleShiny();
        break;

      case "e":
        e.preventDefault();
        this.goToEvolution();
        break;

      case "d":
        e.preventDefault();
        this.toggleTheme();
        break;

      case "f":
        e.preventDefault();
        this.showForms();
        break;

      case "?":
      case "h":
        e.preventDefault();
        this.toggleHelp();
        break;

      case "escape":
        this.closeModals();
        break;
    }
  }

  isTypingInInput() {
    const activeElement = document.activeElement;
    return (
      activeElement === $("#pokemon-name") ||
      activeElement === $("#pokemon-number") ||
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA"
    );
  }

  navigatePrevious() {
    const pokemon = state.get("pokemon");
    if (pokemon?.id > CONFIG.LIMITS.MIN_POKEMON_ID) {
      this.app.loadPokemon(pokemon.id - 1);
    }
  }

  navigateNext() {
    const pokemon = state.get("pokemon");
    if (pokemon?.id < CONFIG.LIMITS.MAX_POKEMON_ID) {
      this.app.loadPokemon(pokemon.id + 1);
    }
  }

  toggleShiny() {
    $("#shiny-toggle")?.click();
  }

  goToEvolution() {
    $("#pokemon-sprite")?.click();
  }

  toggleTheme() {
    $(".theme-toggle")?.click();
  }

  showForms() {
    $("#forms-button")?.click();
  }

  closeModals() {
    // Close forms modal if open
    $(".forms-modal")?.remove();

    // Close help modal if open
    $("#keyboard-help")?.remove();
  }

  toggleHelp() {
    const existingHelp = $("#keyboard-help");
    if (existingHelp) {
      existingHelp.remove();
      return;
    }

    this.showHelpModal();
  }

  showHelpModal() {
    const helpModal = document.createElement("div");
    helpModal.id = "keyboard-help";
    helpModal.className = "help-modal";
    helpModal.innerHTML = `
      <div class="help-modal-content">
        <div class="help-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="help-content">
          <div class="shortcut-group">
            <h3>Navigation</h3>
            <div class="shortcut">
              <kbd>←</kbd> <span>Previous Pokémon</span>
            </div>
            <div class="shortcut">
              <kbd>→</kbd> <span>Next Pokémon</span>
            </div>
          </div>
          
          <div class="shortcut-group">
            <h3>Actions</h3>
            <div class="shortcut">
              <kbd>S</kbd> <span>Toggle Shiny</span>
            </div>
            <div class="shortcut">
              <kbd>E</kbd> <span>View Evolution Tree</span>
            </div>
            <div class="shortcut">
              <kbd>F</kbd> <span>View Forms (if available)</span>
            </div>
            <div class="shortcut">
              <kbd>D</kbd> <span>Toggle Dark Mode</span>
            </div>
          </div>
          
          <div class="shortcut-group">
            <h3>General</h3>
            <div class="shortcut">
              <kbd>?</kbd> or <kbd>H</kbd> <span>Show/Hide Help</span>
            </div>
            <div class="shortcut">
              <kbd>ESC</kbd> <span>Close Modals</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(helpModal);

    // Close handlers
    helpModal.querySelector(".close-modal").onclick = () => helpModal.remove();
    helpModal.onclick = (e) => {
      if (e.target === helpModal) helpModal.remove();
    };
  }

  addHelpTooltip() {
    // Add a small help indicator in the corner
    const helpIndicator = document.createElement("div");
    helpIndicator.className = "keyboard-help-indicator";
    helpIndicator.innerHTML = "<kbd>?</kbd>";
    helpIndicator.title = "Press ? for keyboard shortcuts";

    document.body.appendChild(helpIndicator);
  }
}

