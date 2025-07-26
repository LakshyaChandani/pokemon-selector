import { $, createElement, show, hide } from "../core/dom-utils.js";
import { getFormInfo } from "../utils/form-helpers.js";
import { state } from "../core/state.js";

export class PokemonForms {
  constructor(api) {
    this.api = api;
  }

  showButton(varieties) {
    $("#forms-button")?.remove();

    if (!varieties || varieties.length <= 1) return;

    const formsBtn = createElement("button", "forms-button");
    formsBtn.id = "forms-button";
    formsBtn.innerHTML = `<span>📋</span> View All Forms (${varieties.length})`;
    formsBtn.addEventListener("click", () => this.showModal(varieties));

    const shinyToggle = $("#shiny-toggle");
    shinyToggle?.parentNode?.insertBefore(formsBtn, shinyToggle.nextSibling);
  }

  async showModal(varieties) {
    const modal = this.createModal();
    document.body.appendChild(modal);

    await this.loadForms(modal.querySelector(".forms-grid"), varieties);
    this.setupModalHandlers(modal);
  }

  createModal() {
    const modal = createElement("div", "forms-modal");
    modal.innerHTML = `
      <div class="forms-modal-content">
        <div class="forms-modal-header">
          <h2>All Forms</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="forms-grid">
          <div class="loading">Loading forms...</div>
        </div>
      </div>
    `;
    return modal;
  }

  async loadForms(grid, varieties) {
    grid.innerHTML = "";

    const sortedVarieties = [...varieties].sort((a, b) =>
      a.is_default ? -1 : b.is_default ? 1 : 0
    );

    const formCards = await Promise.all(
      sortedVarieties.map(async (variety) => {
        try {
          const pokemonData = await this.api.get(variety.pokemon.url);
          return this.createFormCard(pokemonData, variety.is_default);
        } catch (error) {
          console.error(`Failed to load form: ${variety.pokemon.name}`, error);
          return null;
        }
      })
    );

    formCards.filter(Boolean).forEach((card) => grid.appendChild(card));
  }

  createFormCard(pokemon, isDefault) {
    const formInfo = getFormInfo(pokemon.name, pokemon.species.name);

    const classes = [
      "form-card",
      isDefault && "default-form",
      formInfo.isForm && `form-${formInfo.formType}`,
    ]
      .filter(Boolean)
      .join(" ");

    const card = createElement("div", classes);

    const indicator = isDefault
      ? '<span class="form-indicator base">BASE</span>'
      : formInfo.isForm
      ? `<span class="form-indicator ${formInfo.formType}">${formInfo.formLabel}</span>`
      : "";

    const sprite =
      pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default;

    card.innerHTML = `
      ${indicator}
      <img src="${sprite}" alt="${formInfo.displayName}">
      <h3>${formInfo.displayName}</h3>
      <p class="form-id">#${pokemon.id.toString().padStart(3, "0")}</p>
      <div class="types">
        ${pokemon.types
          .map(
            (t) =>
              `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
          )
          .join("")}
      </div>
    `;

    card.addEventListener("click", () => {
      document.querySelector(".forms-modal")?.remove();
      window.dispatchEvent(
        new CustomEvent("load-pokemon", { detail: pokemon.name })
      );
    });

    return card;
  }

  setupModalHandlers(modal) {
    const closeModal = () => modal.remove();

    modal.querySelector(".close-modal").onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }
}
