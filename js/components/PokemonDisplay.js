import { $, show, hide, createElement } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { getFormInfo } from "../utils/form-helpers.js";
import { DOMBatcher } from "../../modules/utils.js";
import { api } from "../../modules/api.js";

export class PokemonDisplay {
  constructor(imageLoader, imagePreloader) {
    this.imageLoader = imageLoader;
    this.imagePreloader = imagePreloader;
    this.domBatcher = new DOMBatcher();
  }

  async display(pokemon) {
    document.documentElement.setAttribute("data-theme", state.get("theme"));

    const speciesName = pokemon.speciesData?.name || pokemon.species.name;
    const formInfo = getFormInfo(pokemon.name, speciesName);

    this.domBatcher.write(() => {
      this.resetDisplay();
      this.displayBasicInfo(pokemon, formInfo);
      this.displayTypes(pokemon);
    });

    this.displayDescription(pokemon);
    this.loadSprites(pokemon);
  }

  resetDisplay() {
    state.set("isShiny", false);
    $(".pokemon-image")?.classList.remove("shiny-active");
  }

  displayBasicInfo(pokemon, formInfo) {
    const titleElement = $("#pokemon-title");
    titleElement.innerHTML = "";

    titleElement.appendChild(createElement("span", null, formInfo.displayName));

    if (formInfo.isForm) {
      const formBadge = createElement(
        "span",
        `form-indicator ${formInfo.formType}`,
        formInfo.formLabel
      );
      titleElement.appendChild(formBadge);
    }

    const info = {
      "#pokemon-id": `#${pokemon.id.toString().padStart(3, "0")}`,
      "#pokemon-height": `${pokemon.height / 10} m`,
      "#pokemon-weight": `${pokemon.weight / 10} kg`,
    };

    Object.entries(info).forEach(([selector, value]) => {
      $(selector).textContent = value;
    });
  }

  displayTypes(pokemon) {
    $("#pokemon-types").innerHTML = pokemon.types
      .map(
        (t) =>
          `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
      )
      .join("");
  }

  async displayDescription(pokemon) {
    const descElement = $("#pokemon-description");

    try {
      const speciesData =
        pokemon.speciesData || (await api.get(pokemon.species.url));

      const flavorText = speciesData.flavor_text_entries
        .find((entry) => entry.language.name === "en")
        ?.flavor_text.replace(/[\f\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      descElement.textContent = flavorText || "No description available.";
    } catch (error) {
      console.error("Failed to fetch description:", error);
      descElement.textContent = "Failed to load description.";
    }
  }

  loadSprites(pokemon) {
    const sprite = $("#pokemon-sprite");
    const artwork = pokemon.sprites.other["official-artwork"];

    sprite.dataset.src = artwork.front_default || pokemon.sprites.front_default;
    this.imageLoader.observe(sprite);

    // Preload shiny sprite
    if (artwork.front_shiny) {
      this.imagePreloader.add(artwork.front_shiny);
    }
  }

  updateNavigation(pokemon) {
    this.domBatcher.write(() => {
      $("#prev-pokemon").disabled = pokemon.id <= 1;
      $("#next-pokemon").disabled = pokemon.id >= 1025;
      $("#shiny-toggle").textContent = "✨ View Shiny";
    });
  }
}
