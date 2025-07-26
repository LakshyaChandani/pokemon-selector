import { $, createElement } from "../core/dom-utils.js";
import { STAT_NAMES } from "../core/config.js";
import { DOMBatcher } from "../../modules/utils.js";

export class PokemonStats {
  constructor() {
    this.domBatcher = new DOMBatcher();
  }

  display(pokemon) {
    const statsContainer = $("#pokemon-stats");
    statsContainer.innerHTML = "";

    // Calculate total stats
    const totalStats = pokemon.stats.reduce(
      (sum, stat) => sum + stat.base_stat,
      0
    );

    // Add stats header with total
    const header = createElement("div", "stats-header");
    header.innerHTML = `
    <h3>Base Stats</h3>
    <div class="stats-total">
      Total: <span class="stats-total-value">${totalStats}</span>
    </div>
  `;
    statsContainer.appendChild(header);

    // Create stats container
    const statsWrapper = createElement("div", "stats");

    pokemon.stats.forEach((stat, i) => {
      this.domBatcher.write(() => {
        const row = this.createStatRow(stat);
        statsWrapper.appendChild(row);
        this.animateStatRow(row, stat, i);
      });
    });

    statsContainer.appendChild(statsWrapper);
  }

  createStatRow(stat) {
    const row = createElement("div", "stat-row");
    row.style.cssText = "opacity: 0; transform: translateX(-20px)";

    const statRange = this.getStatRange(stat.base_stat);

    row.innerHTML = `
    <span class="stat-name">${this.formatStatName(stat.stat.name)}</span>
    <div class="stat-bar">
      <div class="stat-fill" data-stat-range="${statRange}" style="width: 0%"></div>
    </div>
    <span class="stat-value">${stat.base_stat}</span>
  `;

    return row;
  }

  animateStatRow(row, stat, index) {
    requestAnimationFrame(() => {
      row.style.transition = "all 0.3s ease-out";
      row.style.opacity = "1";
      row.style.transform = "translateX(0)";

      setTimeout(() => {
        const fill = row.querySelector(".stat-fill");
        fill.style.transition = "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        fill.style.width = `${(stat.base_stat / 255) * 100}%`;
      }, 100 + index * 50);
    });
  }

  getStatRange(baseStat) {
    if (baseStat < 50) return "low";
    if (baseStat < 90) return "medium";
    if (baseStat < 120) return "high";
    return "very-high";
  }

  formatStatName(name) {
    return STAT_NAMES[name] || name;
  }
}
