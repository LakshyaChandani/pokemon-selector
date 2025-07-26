export function validateHTMLStructure() {
  const requiredElements = {
    // Main page elements
    index: [
      "pokemon-display",
      "loading",
      "error-message",
      "search-section",
      "header",
      "pokemon-title",
      "pokemon-id",
      "pokemon-sprite",
      "pokemon-types",
      "pokemon-stats",
      "pokemon-height",
      "pokemon-weight",
      "weak-against",
      "strong-against",
      "immune-to",
      "immune-group",
      "prev-pokemon",
      "next-pokemon",
      "shiny-toggle",
      "pokemon-number",
      "pokemon-name",
      "search-by-number",
      "search-by-name",
    ],
    // Evolution page elements
    evolution: [
      "loading",
      "error-message",
      "evolution-display",
      "evolution-tree",
      "pokemon-family-name",
      "back-button",
    ],
  };

  const page = window.location.pathname.includes("evolution")
    ? "evolution"
    : "index";
  const required = requiredElements[page];
  const missing = required.filter((id) => !document.getElementById(id));

  if (missing.length > 0) {
    console.error("Missing required elements:", missing);
    return false;
  }

  return true;
}
