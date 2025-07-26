// modules/typeEffectiveness.js
export class TypeEffectiveness {
  constructor(typeChart) {
    this.typeChart = typeChart;
  }

  calculate(pokemonTypes) {
    const effectiveness = this.initializeEffectiveness();

    // Calculate for each type the Pokemon has
    pokemonTypes.forEach(({ type }) => {
      this.processType(type.name, effectiveness);
    });

    // Clean up immunities
    this.applyImmunities(effectiveness);

    return this.formatEffectiveness(effectiveness);
  }

  initializeEffectiveness() {
    return {
      weakTo: new Map(),
      resistantTo: new Map(),
      immuneTo: new Set(),
      strongAgainst: new Set(),
      weakAgainst: new Set(),
    };
  }

  processType(typeName, effectiveness) {
    const typeData = this.typeChart[typeName];
    if (!typeData) return;

    // Defensive calculations
    typeData.weakTo?.forEach((t) => {
      effectiveness.weakTo.set(t, (effectiveness.weakTo.get(t) || 1) * 2);
    });

    typeData.resistantTo?.forEach((t) => {
      effectiveness.resistantTo.set(
        t,
        (effectiveness.resistantTo.get(t) || 1) * 0.5
      );
    });

    typeData.immuneTo?.forEach((t) => {
      effectiveness.immuneTo.add(t);
    });

    // Offensive calculations
    typeData.strongAgainst?.forEach((t) => effectiveness.strongAgainst.add(t));
    typeData.weakAgainst?.forEach((t) => effectiveness.weakAgainst.add(t));
  }

  applyImmunities(effectiveness) {
    effectiveness.immuneTo.forEach((type) => {
      effectiveness.weakTo.delete(type);
      effectiveness.resistantTo.delete(type);
    });
  }

  formatEffectiveness(effectiveness) {
    return {
      weakTo: this.sortByMultiplier(effectiveness.weakTo, true),
      resistantTo: this.sortByMultiplier(effectiveness.resistantTo, false),
      immuneTo: Array.from(effectiveness.immuneTo).sort(),
      strongAgainst: Array.from(effectiveness.strongAgainst).sort(),
      weakAgainst: Array.from(effectiveness.weakAgainst).sort(),
    };
  }

  sortByMultiplier(map, descending = true) {
    return Array.from(map.entries())
      .filter(([_, mult]) => (descending ? mult >= 2 : mult <= 0.5))
      .sort((a, b) => (descending ? b[1] - a[1] : a[1] - b[1]));
  }

  getOffensiveCoverage(moveTypes) {
    const coverage = new Map();

    moveTypes.forEach((moveType) => {
      const typeData = this.typeChart[moveType];
      if (!typeData) return;

      typeData.strongAgainst?.forEach((targetType) => {
        coverage.set(targetType, (coverage.get(targetType) || 0) + 1);
      });
    });

    return Array.from(coverage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  }
}
