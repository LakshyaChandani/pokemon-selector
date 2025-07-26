import { $, createElement } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import {
  isSignificantForm,
  getFormType,
  getFormLabel,
  formatName,
  isActuallyBaseForm,
} from "../utils/form-helpers.js";

export class FormsSection {
  async load(chain) {
    const allSpecies = this.getAllSpeciesFromChain(chain);
    const formsToDisplay = [];

    for (const species of allSpecies) {
      const forms = await this.getSpeciesForms(species);
      formsToDisplay.push(...forms);
    }

    if (formsToDisplay.length > 0) {
      const formsSection = await this.createSection(formsToDisplay);
      $("#evolution-display").appendChild(formsSection);

      // Setup scroll indicators after adding to DOM
      this.setupScrollIndicators();
    }
  }

  async getSpeciesForms(species) {
    const forms = [];

    try {
      let speciesData = state.get("speciesCache").get(species.name);

      if (!speciesData) {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${species.name}`
        );
        if (!res.ok) return forms;

        speciesData = await res.json();
        state.get("speciesCache").set(species.name, speciesData);
      }

      if (speciesData.varieties && speciesData.varieties.length > 1) {
        for (const variety of speciesData.varieties) {
          // Skip the default form if it's not a special case
          if (
            variety.is_default &&
            !isActuallyBaseForm(variety.pokemon.name, species.name)
          ) {
            continue;
          }

          // Only include significant forms
          if (!variety.is_default && isSignificantForm(variety.pokemon.name)) {
            forms.push({
              name: variety.pokemon.name,
              baseSpecies: species.name,
              url: variety.pokemon.url,
              isDefault: variety.is_default,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error checking forms for ${species.name}:`, error);
    }

    return forms;
  }

  async createSection(forms) {
    const section = createElement("div", "forms-section");
    section.innerHTML = `
      <h2>Alternate Forms & Mega Evolutions</h2>
      <div class="forms-grid"></div>
    `;

    const grid = section.querySelector(".forms-grid");

    for (const form of forms) {
      const card = await this.createFormCard(form);
      if (card) grid.appendChild(card);
    }

    return section;
  }

  async createFormCard(form) {
    try {
      const cacheKey = `pokemon-${form.name}`;
      let pokemonData = state.get("formsCache").get(cacheKey);

      if (!pokemonData) {
        const res = await fetch(form.url);
        if (!res.ok) return null;

        pokemonData = await res.json();
        state.get("formsCache").set(cacheKey, pokemonData);
      }

      const card = createElement("div", "pokemon-card form-card");
      const formType = getFormType(form.name);
      card.classList.add(`form-${formType}`);

      const formLabel = getFormLabel(form.name, formType);
      const currentPokemonName = state.get("currentPokemonName");

      if (form.name === currentPokemonName) {
        card.classList.add("current");
      }

      card.innerHTML = `
        <div class="form-indicator ${formType}">${formLabel}</div>
        <img src="${
          pokemonData.sprites.other["official-artwork"].front_default ||
          pokemonData.sprites.front_default
        }" 
             alt="${form.name}"
             loading="lazy">
        <div class="pokemon-info-wrapper">
          <h3>${this.formatFormName(form.name)}</h3>
          <div class="form-id">#${pokemonData.id
            .toString()
            .padStart(3, "0")}</div>
        </div>
        <div class="types-container">
          <div class="types">
            ${pokemonData.types
              .map(
                (t) =>
                  `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
              )
              .join("")}
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `../index.html?pokemon=${form.name}`;
      });

      return card;
    } catch (error) {
      console.error(`Error loading form ${form.name}:`, error);
      return null;
    }
  }

  formatFormName(name) {
    const parts = name.split("-");
    const baseName = formatName(parts[0]);

    if (parts.length === 1) return baseName;

    // Handle specific patterns
    if (name.includes("-mega")) {
      if (parts[parts.length - 1] === "x" || parts[parts.length - 1] === "y") {
        return `Mega ${baseName} ${parts[parts.length - 1].toUpperCase()}`;
      }
      return `Mega ${baseName}`;
    }

    if (name.includes("-gmax")) {
      return `Gigantamax ${baseName}`;
    }

    if (name.includes("-alola")) {
      return `Alolan ${baseName}`;
    }

    if (name.includes("-galar")) {
      return `Galarian ${baseName}`;
    }

    if (name.includes("-hisui")) {
      return `Hisuian ${baseName}`;
    }

    if (name.includes("-paldea")) {
      return `Paldean ${baseName}`;
    }

    // Handle Oricorio forms specially
    if (name.includes("oricorio")) {
      const formMap = {
        baile: "Baile Style",
        "pom-pom": "Pom-Pom Style",
        pau: "Pa'u Style",
        sensu: "Sensu Style",
      };
      const formType = parts.slice(1).join("-");
      return `${baseName} ${formMap[formType] || formatName(formType)}`;
    }

    // Default: format all parts
    return parts.map((part) => formatName(part)).join(" ");
  }

  getAllSpeciesFromChain(node, species = []) {
    species.push(node.species);
    node.evolves_to?.forEach((evolution) => {
      this.getAllSpeciesFromChain(evolution, species);
    });
    return species;
  }

  setupScrollIndicators() {
    const grid = $(".forms-grid");
    if (!grid) return;

    const checkScroll = () => {
      const canScrollLeft = grid.scrollLeft > 0;
      const canScrollRight =
        grid.scrollLeft < grid.scrollWidth - grid.clientWidth - 5;

      grid.classList.toggle("can-scroll-left", canScrollLeft);
      grid.classList.toggle("can-scroll-right", canScrollRight);
    };

    grid.addEventListener("scroll", checkScroll);
    checkScroll();
    window.addEventListener("resize", checkScroll);
  }
}
