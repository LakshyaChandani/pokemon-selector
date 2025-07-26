// Form detection and formatting utilities
export const getFormInfo = (pokemonName, speciesName) => {
  const info = {
    displayName: speciesName,
    displayId: null,
    isForm: false,
    formType: null,
    formLabel: null,
  };

  // Special case: Check if this is actually the base form
  // Some Pokémon like Oricorio have their base form with a suffix
  const isBaseForm = isActuallyBaseForm(pokemonName, speciesName);

  if (isBaseForm) {
    info.displayName = formatName(speciesName);
    info.isForm = false;
    return info;
  }

  // Check if it's a form (name differs from species)
  if (pokemonName !== speciesName && pokemonName.includes("-")) {
    info.isForm = true;

    // Mega Evolution
    if (pokemonName.includes("-mega")) {
      info.formType = "mega";
      if (pokemonName.endsWith("-x")) {
        info.displayName = `Mega ${formatName(speciesName)} X`;
        info.formLabel = "MEGA X";
      } else if (pokemonName.endsWith("-y")) {
        info.displayName = `Mega ${formatName(speciesName)} Y`;
        info.formLabel = "MEGA Y";
      } else {
        info.displayName = `Mega ${formatName(speciesName)}`;
        info.formLabel = "MEGA";
      }
    }
    // Gigantamax
    else if (pokemonName.includes("-gmax")) {
      info.formType = "gmax";
      info.displayName = `Gigantamax ${formatName(speciesName)}`;
      info.formLabel = "GMAX";
    }
    // Regional Forms
    else if (pokemonName.includes("-alola")) {
      info.formType = "alola";
      info.displayName = `Alolan ${formatName(speciesName)}`;
      info.formLabel = "ALOLAN";
    } else if (pokemonName.includes("-galar")) {
      info.formType = "galar";
      info.displayName = `Galarian ${formatName(speciesName)}`;
      info.formLabel = "GALARIAN";
    } else if (pokemonName.includes("-hisui")) {
      info.formType = "hisui";
      info.displayName = `Hisuian ${formatName(speciesName)}`;
      info.formLabel = "HISUIAN";
    } else if (pokemonName.includes("-paldea")) {
      info.formType = "paldea";
      info.displayName = `Paldean ${formatName(speciesName)}`;
      info.formLabel = "PALDEAN";
    }
    // Other forms
    else {
      info.formType = "other";
      // Handle specific form names
      const formName = getSpecificFormName(pokemonName, speciesName);
      info.displayName = formName;
      info.formLabel = "FORM";
    }
  } else {
    info.displayName = formatName(speciesName);
  }

  return info;
};

// Helper function to determine if a Pokémon with a suffix is actually the base form
export const isActuallyBaseForm = (pokemonName, speciesName) => {
  // List of Pokémon where the "base" form has a suffix
  const baseFormsWithSuffix = {
    oricorio: "oricorio-baile",
    lycanroc: "lycanroc-midday",
    wishiwashi: "wishiwashi-solo",
    minior: "minior-red-meteor",
    mimikyu: "mimikyu-disguised",
    toxtricity: "toxtricity-amped",
    eiscue: "eiscue-ice",
    indeedee: "indeedee-male",
    morpeko: "morpeko-full-belly",
    urshifu: "urshifu-single-strike",
    basculegion: "basculegion-male",
    oinkologne: "oinkologne-male",
  };

  return (
    baseFormsWithSuffix[speciesName.toLowerCase()] === pokemonName.toLowerCase()
  );
};

// Get specific form name for special cases
export const getSpecificFormName = (pokemonName, speciesName) => {
  const parts = pokemonName.split("-");
  const baseName = formatName(speciesName);

  // Handle specific patterns
  if (pokemonName.includes("oricorio")) {
    const formMap = {
      baile: "Baile Style",
      "pom-pom": "Pom-Pom Style",
      pau: "Pa'u Style",
      sensu: "Sensu Style",
    };
    const formType = parts[1] + (parts[2] ? `-${parts[2]}` : "");
    return `${baseName} ${formMap[formType] || formatName(formType)}`;
  }

  // Default formatting
  const formPart = parts.slice(1).join(" ");
  return `${baseName} ${formatName(formPart)}`;
};

export const formatName = (name) => {
  if (!name) return "";
  return name
    .split(/[-\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getBasePokemonName = (name) => {
  if (name.includes("-")) {
    const parts = name.split("-");
    return parts[0];
  }
  return name;
};

export const isSignificantForm = (formName) => {
  const significantPatterns = [
    "-mega",
    "-gmax",
    "-alola",
    "-galar",
    "-hisui",
    "-paldea",
    "-primal",
    "-origin",
    "-sky",
    "-therian",
    "-unbound",
    "-complete",
    "-10",
    "-school",
    "-blade",
    "-shadow",
    "-rider",
    "-ice",
    "-dusk",
    "-dawn",
    "-ultra",
  ];

  // Also check for specific Pokémon forms
  const specificForms = [
    "oricorio-pom-pom",
    "oricorio-pau",
    "oricorio-sensu",
    "lycanroc-midnight",
    "lycanroc-dusk",
  ];

  return (
    significantPatterns.some((pattern) => formName.includes(pattern)) ||
    specificForms.includes(formName)
  );
};

export const getFormType = (name) => {
  if (name.includes("-mega")) return "mega";
  if (name.includes("-gmax")) return "gmax";
  if (name.includes("-alola")) return "alola";
  if (name.includes("-galar")) return "galar";
  if (name.includes("-hisui")) return "hisui";
  if (name.includes("-paldea")) return "paldea";
  return "other";
};

export const getFormLabel = (name, type) => {
  const labels = {
    mega: "MEGA",
    gmax: "GIGANTAMAX",
    alola: "ALOLAN",
    galar: "GALARIAN",
    hisui: "HISUIAN",
    paldea: "PALDEAN",
  };

  if (labels[type]) return labels[type];

  if (name.includes("-primal")) return "PRIMAL";
  if (name.includes("-origin")) return "ORIGIN";
  if (name.includes("-therian")) return "THERIAN";
  if (name.includes("-sky")) return "SKY";
  if (name.includes("-blade")) return "BLADE";

  return "ALTERNATE";
};
