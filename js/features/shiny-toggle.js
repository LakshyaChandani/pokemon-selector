import { $, show, hide } from "../core/dom-utils.js";
import { state } from "../core/state.js";

export class ShinyToggle {
  init() {
    $("#shiny-toggle")?.addEventListener("click", () => this.toggle());
  }

  toggle() {
    const pokemon = state.get("pokemon");
    if (!pokemon) return;

    const isShiny = !state.get("isShiny");
    state.set("isShiny", isShiny);

    const sprite = $("#pokemon-sprite");
    const container = $(".pokemon-image");

    const sprites = pokemon.sprites.other["official-artwork"];
    const newSrc = isShiny
      ? sprites.front_shiny || sprites.front_default
      : sprites.front_default;

    // Smooth transition
    sprite.style.opacity = "0";
    setTimeout(() => {
      sprite.src = newSrc;
      sprite.style.opacity = "1";
    }, 150);

    container.classList.toggle("shiny-active", isShiny);
    $("#shiny-toggle").textContent = isShiny
      ? "👁️ View Normal"
      : "✨ View Shiny";
  }
}
