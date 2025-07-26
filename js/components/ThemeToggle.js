import { $, createElement } from "../core/dom-utils.js";
import { state } from "../core/state.js";

export class ThemeToggle {
  constructor() {
    // The constructor is now empty.
    // The global `state` object has already loaded the theme from localStorage.
    // This component will no longer manage its own state.
    this.themeBtn = null;
  }

  /**
   * Initializes the component, creates the button, and sets up the watcher.
   * @param {HTMLElement} container - The parent element to append the button to.
   */
  init(container) {
    // 1. Create the UI element
    this.themeBtn = createElement("button", "theme-toggle");
    container.appendChild(this.themeBtn);

    // 2. Set up the event listener for user clicks
    this.themeBtn.addEventListener("click", () => this.toggle());

    // 3. Set up a "watcher" to react to any changes in the global theme state
    state.watchKey("theme", (newTheme) => {
      this.updateUI(newTheme);
    });

    // 4. Perform the initial UI setup based on the current state
    // This ensures the page loads with the correct theme and button text.
    this.updateUI(state.get("theme"));
  }

  /**
   * Toggles the theme by updating the central state.
   * The watcher will handle the UI changes automatically.
   */
  toggle() {
    const currentTheme = state.get("theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    // This is the ONLY place we write to the state.
    // The state manager (`state.js`) is responsible for saving to localStorage.
    state.set("theme", newTheme);
  }

  /**
   * Updates all UI elements related to the theme.
   * This function is called both on initial load and whenever the state changes.
   * @param {string} theme - The new theme ('light' or 'dark').
   */
  updateUI(theme) {
    // Apply the theme to the entire document
    document.documentElement.setAttribute("data-theme", theme);

    // Update the button's text
    if (this.themeBtn) {
      this.themeBtn.innerHTML = theme === "dark" ? "☀️ Light" : "🌙 Dark";
    }
  }
}
