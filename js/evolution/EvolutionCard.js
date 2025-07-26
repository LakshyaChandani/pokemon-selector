import { createElement } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { formatName, getBasePokemonName } from "../utils/form-helpers.js";
import { api } from "../../modules/api.js";
import { PokemonHelpers } from "../utils/pokemon-helpers.js";

export class EvolutionCard {
  async create(species) {
    const card = createElement("div", "pokemon-card");

    // Check if current Pokemon
    this.markIfCurrent(card, species.name);

    try {
      const pokemonData = await this.fetchPokemonData(species.name);
      this.buildCardContent(card, pokemonData, species);
      this.addClickHandler(card, species.name);
    } catch (error) {
      console.error(`Error loading ${species.name}:`, error);
      this.buildErrorCard(card, species);
    }

    return card;
  }

  markIfCurrent(card, speciesName) {
    const currentPokemonName = state.get("currentPokemonName");
    const currentBaseName = getBasePokemonName(currentPokemonName || "");

    if (speciesName === currentBaseName || speciesName === currentPokemonName) {
      card.classList.add("current");
    }
  }

  async fetchPokemonData(speciesName) {
    const cacheKey = `pokemon-${speciesName}`;
    const cached = state.getCached("cache", cacheKey);

    if (cached) return cached;

    const pokemonData = await api.get(`/pokemon/${speciesName}`);
    state.setCached("cache", cacheKey, pokemonData);

    return pokemonData;
  }

  buildCardContent(card, pokemonData, species) {
    const spriteUrl = PokemonHelpers.getSpriteUrl(pokemonData.sprites);
    const pokemonId = PokemonHelpers.formatId(pokemonData.id);

    card.innerHTML = `
      <img src="${spriteUrl}" alt="${species.name}" loading="lazy">
      <h3>${formatName(species.name)}</h3>
      <div class="pokemon-number">${pokemonId}</div>
      <div class="types">
        ${this.renderTypes(pokemonData.types)}
      </div>
    `;
  }

  renderTypes(types) {
    return types
      .map(
        ({ type }) =>
          `<span class="type-badge type-${type.name}">${type.name}</span>`
      )
      .join("");
  }

  buildErrorCard(card, species) {
    card.innerHTML = `
      <div class="error-card">
        <h3>${formatName(species.name)}</h3>
        <p>Failed to load</p>
        <small>Click to retry</small>
      </div>
    `;

    card.addEventListener(
      "click",
      async () => {
        card.innerHTML = '<div class="loading">Loading...</div>';
        try {
          const newCard = await this.create(species);
          card.replaceWith(newCard);
        } catch (error) {
          console.error("Retry failed:", error);
        }
      },
      { once: true }
    );
  }

  addClickHandler(card, speciesName) {
    card.addEventListener("click", () => {
      window.location.href = `../index.html?pokemon=${speciesName}`;
    });
  }
}
