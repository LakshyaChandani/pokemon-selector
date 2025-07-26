// js/components/TypeEffectiveness.js
import { $, createElement } from "../core/dom-utils.js";
import { DOMBatcher } from "../../modules/utils.js";

export class TypeEffectivenessDisplay {
  constructor(typeCalculator) {
    this.typeCalculator = typeCalculator;
    this.domBatcher = new DOMBatcher();
  }

  display(pokemon) {
    const effectiveness = this.typeCalculator.calculate(pokemon.types);

    this.domBatcher.write(() => {
      this.displayWeaknesses(effectiveness.weakTo);
      this.displayStrengths(effectiveness.strongAgainst);
      this.displayImmunities(effectiveness.immuneTo);
    });
  }

  displayWeaknesses(weaknesses) {
    const element = $("#weak-against");

    if (!weaknesses.length) {
      element.innerHTML = '<span class="no-types">None</span>';
      return;
    }

    element.innerHTML = weaknesses
      .map(([type, multiplier]) => {
        const multiplierClass = multiplier === 4 ? "super-weak" : "";
        return `<span class="type-badge type-${type} ${multiplierClass}">${type}</span>`;
      })
      .join("");
  }

  displayStrengths(strengths) {
    const element = $("#strong-against");

    if (!strengths.length) {
      element.innerHTML = '<span class="no-types">None</span>';
      return;
    }

    element.innerHTML = strengths
      .map((type) => `<span class="type-badge type-${type}">${type}</span>`)
      .join("");
  }

  displayImmunities(immunities) {
    const groupElement = $("#immune-group");
    const immuneElement = $("#immune-to");

    if (immunities.length > 0) {
      groupElement.style.display = "block";
      immuneElement.innerHTML = immunities
        .map(
          (type) =>
            `<span class="type-badge type-${type} immune">${type}</span>`
        )
        .join("");
    } else {
      groupElement.style.display = "none";
    }
  }
}
