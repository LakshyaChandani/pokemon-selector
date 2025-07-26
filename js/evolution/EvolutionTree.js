import { $, createElement, show, hide } from "../core/dom-utils.js";
import { state } from "../core/state.js";
import { formatName, getBasePokemonName } from "../utils/form-helpers.js";
import { EvolutionCard } from "./EvolutionCard.js";
import { api } from "../../modules/api.js";

// Evolution method configurations
const EVOLUTION_METHODS = {
  level: { class: "level", format: (d) => `Level ${d.min_level}` },
  item: { class: "item", format: (d) => formatName(d.item.name) },
  trade: { class: "trade", format: (d) => getTradeMethod(d) },
  friendship: {
    class: "friendship",
    format: (d) =>
      `Friendship ${d.min_happiness}${
        d.time_of_day ? ` (${d.time_of_day})` : ""
      }`,
  },
  time: { class: "time", format: (d) => `Level up (${d.time_of_day})` },
  location: { class: "location", format: () => "Special Location" },
  known_move: {
    class: "special",
    format: (d) => `Know ${formatName(d.known_move.name)}`,
  },
};

const TRIGGER_NAMES = {
  "level-up": "Level Up",
  trade: "Trade",
  "use-item": "Use Item",
  shed: "Empty Spot in Party",
  spin: "Spin",
  "tower-of-darkness": "Tower of Darkness",
  "tower-of-waters": "Tower of Waters",
  "three-critical-hits": "Land 3 Critical Hits",
  "take-damage": "Take Damage",
  "agile-style-move": "Use Agile Style Move",
  "strong-style-move": "Use Strong Style Move",
  "recoil-damage": "Take Recoil Damage",
};

function getTradeMethod(details) {
  if (details.held_item)
    return `Trade holding ${formatName(details.held_item.name)}`;
  if (details.trade_species)
    return `Trade for ${formatName(details.trade_species.name)}`;
  return "Trade";
}

export class EvolutionTree {
  constructor() {
    this.evolutionCard = new EvolutionCard();
  }

  async load(pokemonId) {
    const currentPokemonName = state.get("currentPokemonName");
    const speciesId = await this.getBaseSpeciesId(
      pokemonId,
      currentPokemonName
    );

    const cacheKey = `evolution-${speciesId}`;
    const cached = state.get("cache").get(cacheKey);

    if (cached) return cached;

    const chain = await this.fetchEvolutionChain(speciesId);
    state.get("cache").set(cacheKey, chain);
    return chain;
  }

  async getBaseSpeciesId(pokemonId, pokemonName) {
    try {
      const identifier = pokemonName || pokemonId;
      const pokemonData = await api.get(`/pokemon/${identifier}`);
      const speciesData = await api.get(pokemonData.species.url);

      // Find base species
      let currentSpecies = speciesData;
      while (currentSpecies.evolves_from_species) {
        currentSpecies = await api.get(currentSpecies.evolves_from_species.url);
      }

      return currentSpecies.id;
    } catch (error) {
      console.warn("Could not determine base species, using provided ID");
      return pokemonId;
    }
  }

  async fetchEvolutionChain(speciesId) {
    const speciesData = await api.get(`/pokemon-species/${speciesId}`);
    state.get("speciesCache").set(speciesData.name, speciesData);

    const evolutionData = await api.get(speciesData.evolution_chain.url);
    return evolutionData.chain;
  }

  async display(chain) {
    const tree = $("#evolution-tree");
    const familyName = $("#pokemon-family-name");

    tree.innerHTML = "";
    familyName.textContent = `${formatName(
      chain.species.name
    )} Evolution Family`;

    const treeElement = await this.buildTree(chain);
    tree.appendChild(treeElement);

    this.setupScrollIndicators();
  }

  async buildTree(node, isRoot = true) {
    const container = createElement("div", "evolution-stage");
    const card = await this.evolutionCard.create(node.species);
    container.appendChild(card);

    if (!node.evolves_to?.length) return container;

    if (node.evolves_to.length === 1) {
      const arrow = this.createEvolutionArrow(node.evolves_to[0]);
      const nextEvolution = await this.buildTree(node.evolves_to[0], false);
      container.append(arrow, nextEvolution);
    } else {
      const branchContainer = await this.createBranchContainer(node.evolves_to);
      container.appendChild(branchContainer);
    }

    return container;
  }

  async createBranchContainer(evolutions) {
    const branchContainer = createElement("div", "branch-container");
    const branchArrow = createElement("div", "branch-arrow");
    const branches = createElement("div", "evolution-branches");

    if (evolutions.length > 4) {
      branches.classList.add("many-branches");
    }

    const branchWrapper = createElement("div", "branch-wrapper");

    // Build all branches in parallel
    const branchPromises = evolutions.map(async (evolution) => {
      const branchItem = createElement("div", "branch-item");
      const branch = await this.buildTree(evolution, false);
      branchItem.appendChild(branch);
      return branchItem;
    });

    const branchItems = await Promise.all(branchPromises);
    branchItems.forEach((item) => branchWrapper.appendChild(item));

    branches.appendChild(branchWrapper);
    branchContainer.append(branchArrow, branches);

    return branchContainer;
  }

  createEvolutionArrow(evolutionDetails) {
    const arrow = createElement("div", "evolution-arrow");
    const details = evolutionDetails.evolution_details[0];
    const { methodText, methodClass } = this.getEvolutionMethod(details);

    arrow.innerHTML = `
      <span class="arrow-icon">→</span>
      ${
        methodText
          ? `<div class="evolution-method ${methodClass}">${methodText}</div>`
          : ""
      }
    `;

    return arrow;
  }

  getEvolutionMethod(details) {
    if (!details) return { methodText: "", methodClass: "special" };

    // Check each evolution method type
    for (const [key, config] of Object.entries(EVOLUTION_METHODS)) {
      if (
        details[key] ||
        (key === "time" && details.time_of_day && !details.min_happiness)
      ) {
        let methodText = config.format(details);
        methodText = this.addModifiers(methodText, details);
        return { methodText, methodClass: config.class };
      }
    }

    // Handle trigger-based evolutions
    if (details.trigger) {
      let methodText =
        TRIGGER_NAMES[details.trigger.name] || formatName(details.trigger.name);
      methodText = this.addModifiers(methodText, details);
      return { methodText, methodClass: "special" };
    }

    return { methodText: "", methodClass: "special" };
  }

  addModifiers(methodText, details) {
    // Add gender requirement
    if (details.gender === 1) methodText += " (Female)";
    else if (details.gender === 2) methodText += " (Male)";

    // Add stat comparison requirement
    if (details.relative_physical_stats === 1)
      methodText += " (Attack > Defense)";
    else if (details.relative_physical_stats === -1)
      methodText += " (Defense > Attack)";
    else if (details.relative_physical_stats === 0)
      methodText += " (Attack = Defense)";

    return methodText;
  }

  setupScrollIndicators() {
    const tree = $("#evolution-tree");

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tree;
      const canScrollLeft = scrollLeft > 0;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 5;

      tree.classList.toggle("can-scroll-left", canScrollLeft);
      tree.classList.toggle("can-scroll-right", canScrollRight);

      // Show scroll hint once
      if (canScrollRight && !tree.dataset.scrollHintShown) {
        tree.classList.add("show-scroll-hint");
        tree.dataset.scrollHintShown = "true";
        setTimeout(() => tree.classList.remove("show-scroll-hint"), 3000);
      }
    };

    tree.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    checkScroll();
  }
}
