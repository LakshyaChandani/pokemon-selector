/**
 * Autocomplete Component - Provides intelligent search suggestions with keyboard navigation
 * Features debounced input, keyboard shortcuts, and customizable formatting
 */

import { debounce } from "./utils.js";

export class Autocomplete {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      minChars: 1,
      maxResults: 10,
      debounceTime: 300,
      onSelect: () => {},
      formatLabel: (item) => item.label || item.value || item,
      highlightMatches: true,
      ...options,
    };

    this.state = {
      items: [], // All available items
      filtered: [], // Currently displayed filtered items
      selectedIndex: -1, // Keyboard navigation index
      isOpen: false, // Dropdown visibility state
    };

    this.listElement = null;
    this.init();
  }

  /**
   * Initialize autocomplete functionality
   */
  init() {
    this.createListElement();
    this.bindEvents();
  }

  /**
   * Creates the dropdown list element for suggestions
   */
  createListElement() {
    this.listElement = document.createElement("div");
    this.listElement.className = "autocomplete-items";
    this.listElement.style.display = "none";
    this.input.parentNode.insertBefore(
      this.listElement,
      this.input.nextSibling
    );
  }

  bindEvents() {
    this.handleInput = debounce(
      this.onInput.bind(this),
      this.options.debounceTime
    );

    this.input.addEventListener("input", this.handleInput);
    this.input.addEventListener("keydown", this.onKeydown.bind(this));
    this.input.addEventListener("blur", () =>
      setTimeout(() => this.close(), 200)
    );

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".autocomplete-wrapper")) {
        this.close();
      }
    });
  }

  setItems(items) {
    // Normalize items to consistent format
    this.state.items = items.map((item) =>
      typeof item === "string"
        ? { value: item, label: item }
        : {
            value: item.value || item,
            label: item.label || item.value || item,
            ...item,
          }
    );
  }

  onInput(e) {
    const searchValue = e.target.value.toLowerCase().trim();

    if (searchValue.length < this.options.minChars) {
      return this.close();
    }

    this.filterItems(searchValue);
    this.render();
  }

  filterItems(searchValue) {
    this.state.filtered = this.state.items
      .filter((item) => this.matchesSearch(item, searchValue))
      .slice(0, this.options.maxResults);

    this.state.selectedIndex = -1;
  }

  matchesSearch(item, searchValue) {
    const searchTargets = [
      item.value?.toLowerCase(),
      item.label?.toLowerCase(),
      ...(item.searchTerms || []),
      item.id?.toString(),
    ].filter(Boolean);

    return searchTargets.some((target) => target.includes(searchValue));
  }

  onKeydown(e) {
    if (!this.state.isOpen || !this.state.filtered.length) return;

    const handlers = {
      ArrowDown: () => this.moveSelection(1),
      ArrowUp: () => this.moveSelection(-1),
      Enter: () => this.selectCurrent(),
      Escape: () => this.close(),
    };

    const handler = handlers[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  }

  moveSelection(direction) {
    const { filtered, selectedIndex } = this.state;
    const newIndex = Math.max(
      -1,
      Math.min(selectedIndex + direction, filtered.length - 1)
    );

    this.state.selectedIndex = newIndex;
    this.updateSelection();
  }

  selectCurrent() {
    if (this.state.selectedIndex >= 0) {
      this.selectItem(this.state.filtered[this.state.selectedIndex]);
    }
  }

  render() {
    const { filtered } = this.state;

    if (!filtered.length) {
      return this.close();
    }

    this.listElement.innerHTML = filtered
      .map((item, index) => this.renderItem(item, index))
      .join("");

    this.attachItemListeners();
    this.open();
  }

  renderItem(item, index) {
    const label = this.options.formatLabel(item);
    const displayText = this.options.highlightMatches
      ? this.highlightMatch(label, this.input.value)
      : label;

    return `
      <div class="autocomplete-item ${
        index === this.state.selectedIndex ? "selected" : ""
      }" 
           data-index="${index}">
        <span class="autocomplete-text">${displayText}</span>
      </div>
    `;
  }

  highlightMatch(text, search) {
    if (!search) return text;
    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(regex, "<strong>$1</strong>");
  }

  attachItemListeners() {
    this.listElement.querySelectorAll(".autocomplete-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        this.selectItem(this.state.filtered[index]);
      });
    });
  }

  updateSelection() {
    this.listElement
      .querySelectorAll(".autocomplete-item")
      .forEach((item, index) => {
        item.classList.toggle("selected", index === this.state.selectedIndex);
      });
  }

  selectItem(item) {
    this.input.value = item.value;
    this.close();
    this.options.onSelect(item.value, item);
  }

  open() {
    this.listElement.style.display = "block";
    this.state.isOpen = true;
  }

  close() {
    this.state.filtered = [];
    this.state.selectedIndex = -1;
    this.listElement.style.display = "none";
    this.state.isOpen = false;
  }

  destroy() {
    this.input.removeEventListener("input", this.handleInput);
    this.listElement?.remove();
  }
}
