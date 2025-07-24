import {
  CelestialObject,
  CelestialType,
  CometProperties,
  GasGiantClass,
  GasGiantProperties,
  PlanetProperties,
  PlanetType,
  ProceduralSurfaceProperties,
  SpectralClass,
  StarProperties,
  StellarType,
  NeutronStarSubtype,
  BlackHoleSubtype,
  WhiteDwarfSubtype,
  ProtostarSubtype,
  CelestialSpecificPropertiesUnion,
} from "@teskooano/data-types";
import { CelestialIconConfig } from "../types";

const SPECTRAL_CLASS_GRADIENTS: Partial<
  Record<SpectralClass, [string, string]>
> = {
  [SpectralClass.O]: ["#9bb0ff", "#587dff"],
  [SpectralClass.B]: ["#aabfff", "#7c9cff"],
  [SpectralClass.A]: ["#cad8ff", "#e6ecff"],
  [SpectralClass.F]: ["#f8f7ff", "#f4f4ff"],
  [SpectralClass.G]: ["#fff4ea", "#fff9f2"],
  [SpectralClass.K]: ["#ffd2a1", "#ffc58e"],
  [SpectralClass.M]: ["#ffb56c", "#ff9a4b"],
  [SpectralClass.L]: ["#ff8a4a", "#e05a1a"],
  [SpectralClass.T]: ["#d66c39", "#a03a0a"],
  [SpectralClass.Y]: ["#a05a4a", "#6b2a1a"],
};

// Enhanced star configurations for different stellar types
const STELLAR_TYPE_CONFIGS: Partial<
  Record<
    StellarType,
    {
      base: CelestialIconConfig["base"];
      atmosphere?: CelestialIconConfig["atmosphere"];
      special?: "pulsar" | "black-hole" | "white-dwarf";
    }
  >
> = {
  [StellarType.MAIN_SEQUENCE]: {
    base: { type: "star", color: "#FFFFFF" },
    atmosphere: { color: "#FFFFFF", size: 4 },
  },
  [StellarType.NEUTRON_STAR]: {
    base: { type: "star", color: "#FFFFFF", radius: 3 },
    atmosphere: { color: "#FFFFFF", size: 6 },
    special: "pulsar",
  },
  [StellarType.WHITE_DWARF]: {
    base: { type: "star", color: "#FFFFFF", radius: 4 },
    atmosphere: { color: "#FFFFFF", size: 2 },
    special: "white-dwarf",
  },
  [StellarType.WOLF_RAYET]: {
    base: { type: "star", color: "#FF6B6B", radius: 10 },
    atmosphere: { color: "#FF6B6B", size: 8 },
  },
  [StellarType.BLACK_HOLE]: {
    base: { type: "star", color: "#000000", radius: 6 },
    atmosphere: { color: "#000000", size: 3 },
    special: "black-hole",
  },
  [StellarType.PROTOSTAR]: {
    base: { type: "star", color: "#FF8A4A", radius: 5 },
    atmosphere: { color: "#FF8A4A", size: 5 },
    special: "pulsar",
  },
  [StellarType.HYPERGIANT]: {
    base: { type: "star", color: "#FF6B6B", radius: 8 },
    atmosphere: { color: "#FF6B6B", size: 12 },
  },
};

const GAS_GIANT_CLASS_COLORS: Record<
  GasGiantClass,
  { atmo: string; cloud: string; storm: string }
> = {
  [GasGiantClass.CLASS_I]: {
    atmo: "#E6DAB8",
    cloud: "#FFFFFF",
    storm: "#D3BBA5",
  }, // Ammonia: Yellowish/white
  [GasGiantClass.CLASS_II]: {
    atmo: "#A8C5D3",
    cloud: "#E0F0FF",
    storm: "#8EAEBF",
  }, // Water: Bluish/white
  [GasGiantClass.CLASS_III]: {
    atmo: "#3D5A80",
    cloud: "#2C3E50",
    storm: "#1A2530",
  }, // Cloudless: Deep blue/dark
  [GasGiantClass.CLASS_IV]: {
    atmo: "#C78E6D",
    cloud: "#A37053",
    storm: "#7D553D",
  }, // Alkali: Dusky reddish/brown
  [GasGiantClass.CLASS_V]: {
    atmo: "#BDBDBD",
    cloud: "#E0E0E0",
    storm: "#9E9E9E",
  }, // Silicate: Grey/hazy
};

function getRingConfig(object: CelestialObject): CelestialIconConfig["rings"] {
  const properties = object.properties as PlanetProperties | GasGiantProperties;
  if (properties?.rings && properties.rings.length > 0) {
    // For major bodies (planets and gas giants), make rings dark and prominent
    if (
      object.type === CelestialType.PLANET ||
      object.type === CelestialType.DWARF_PLANET ||
      object.type === CelestialType.GAS_GIANT
    ) {
      return {
        color: "#888888", // A dark, prominent grey
        angle: 15,
      };
    }

    // For other types (e.g., Moons), use their own color or a lighter default
    return {
      color: properties.rings[0].color || "#A0A0A0",
      angle: 20,
    };
  }
  return undefined;
}

function getAtmosphereConfig(
  object: CelestialObject,
): CelestialIconConfig["atmosphere"] {
  // First, check the root atmosphere property.
  let atmoProps = object.atmosphere;

  // If not found, check within the specific properties for planets/moons.
  if (!atmoProps) {
    if (
      object.type === CelestialType.PLANET ||
      object.type === CelestialType.DWARF_PLANET ||
      object.type === CelestialType.MOON
    ) {
      const props = object.properties as PlanetProperties;
      atmoProps = props?.atmosphere;
    }
  }

  if (atmoProps) {
    return {
      color: atmoProps.glowColor || "rgba(255, 255, 255, 0.7)",
      size: 1.01, // A thin glow for planets with atmospheres
    };
  }

  return undefined;
}

function createStarConfig(starProps: StarProperties): CelestialIconConfig {
  const baseConfig: CelestialIconConfig = {
    base: {
      type: "star",
      color: starProps.color || "#FFFFFF",
    },
  };

  // Check for stellar type
  if (starProps.stellarType && STELLAR_TYPE_CONFIGS[starProps.stellarType]) {
    const stellarConfig = STELLAR_TYPE_CONFIGS[starProps.stellarType]!;

    // For main sequence stars, prefer spectral class-based configuration
    if (
      starProps.stellarType === StellarType.MAIN_SEQUENCE &&
      starProps.mainSpectralClass
    ) {
      const spectralClass = starProps.mainSpectralClass;
      if (SPECTRAL_CLASS_GRADIENTS[spectralClass]) {
        baseConfig.base.gradient = SPECTRAL_CLASS_GRADIENTS[spectralClass];
      } else {
        baseConfig.base.gradient = [starProps.color, "#333333"];
      }
      baseConfig.atmosphere = {
        color: starProps.color || "#FFFFFF",
        size: 4, // A larger glow for stars
      };
      return baseConfig;
    }

    // For other stellar types, use the stellar type configuration but override with actual color
    baseConfig.base = {
      ...stellarConfig.base,
      color: starProps.color || stellarConfig.base.color,
    };
    if (stellarConfig.atmosphere) {
      baseConfig.atmosphere = {
        ...stellarConfig.atmosphere,
        color: starProps.color || stellarConfig.atmosphere.color,
      };
    }
    if (stellarConfig.special) {
      baseConfig.special = stellarConfig.special;
    }
    return baseConfig;
  }

  // Fallback to spectral class-based configuration
  const spectralClass = starProps.mainSpectralClass;
  if (spectralClass && SPECTRAL_CLASS_GRADIENTS[spectralClass]) {
    baseConfig.base.gradient = SPECTRAL_CLASS_GRADIENTS[spectralClass];
  } else {
    baseConfig.base.gradient = [starProps.color, "#333333"];
  }

  baseConfig.atmosphere = {
    color: starProps.color || "#FFFFFF",
    size: 4, // A larger glow for stars
  };

  return baseConfig;
}

export function generateIconConfig(
  object: CelestialObject,
): CelestialIconConfig {
  const baseConfig: CelestialIconConfig = {
    base: {
      type: "planet",
      color: "#808080",
    },
  };

  const atmosphere = getAtmosphereConfig(object);
  if (atmosphere) baseConfig.atmosphere = atmosphere;

  if (object.properties && "surface" in object.properties) {
    baseConfig.procedural = (object.properties as PlanetProperties)
      .surface as ProceduralSurfaceProperties;
  }

  switch (object.type) {
    case CelestialType.STAR: {
      const starProps = object.properties as StarProperties;
      return createStarConfig(starProps);
    }
    case CelestialType.PLANET:
    case CelestialType.DWARF_PLANET: {
      const planetProps = object.properties as PlanetProperties;
      baseConfig.rings = getRingConfig(object);
      if (baseConfig.procedural) break;

      switch (planetProps.classType) {
        case PlanetType.TERRESTRIAL:
          baseConfig.base.gradient = ["#6da0d2", "#2c4e7f"];
          break;
        case PlanetType.ROCKY:
          baseConfig.base.gradient = ["#b2a1a1", "#6f6161"];
          break;
        case PlanetType.ICE:
          baseConfig.base.gradient = ["#d1faff", "#a2c4c5"];
          break;
        case PlanetType.LAVA:
          baseConfig.base.gradient = ["#ff6b3d", "#a03a0a"];
          break;
        case PlanetType.DESERT:
          baseConfig.base.gradient = ["#e5c8a7", "#a17d54"];
          break;
        case PlanetType.OCEAN:
          baseConfig.base.gradient = ["#8ab2d9", "#3a6a9b"];
          break;
        default:
          baseConfig.base.color = "#9e9e9e";
      }
      break;
    }
    case CelestialType.MOON: {
      const moonProps = object.properties as PlanetProperties;
      baseConfig.rings = getRingConfig(object);
      if (baseConfig.procedural) break;

      // Moons are simpler: solid color based on type
      switch (moonProps.classType) {
        case PlanetType.ROCKY:
        case PlanetType.BARREN:
          baseConfig.base.color = "#9e9e9e";
          break;
        case PlanetType.ICE:
          baseConfig.base.color = "#d1faff";
          break;
        default:
          baseConfig.base.color = "#c0c0c0"; // Silver
      }
      break;
    }
    case CelestialType.GAS_GIANT: {
      const gasGiantProps = object.properties as GasGiantProperties;
      const classColors =
        GAS_GIANT_CLASS_COLORS[gasGiantProps.classType] ??
        GAS_GIANT_CLASS_COLORS[GasGiantClass.CLASS_I]; // Fallback to Class I

      const atmoColor = gasGiantProps.atmosphereColor ?? classColors.atmo;
      const cloudColor = gasGiantProps.cloudColor ?? classColors.cloud;
      const stormColor = gasGiantProps.stormColor ?? classColors.storm;

      // Create a more complex gradient for gas giants to show bands
      baseConfig.procedural = {
        color1: atmoColor,
        height1: 0,
        color2: cloudColor,
        height2: 0.35,
        color3: stormColor,
        height3: 0.5,
        color4: cloudColor,
        height4: 0.65,
        color5: atmoColor,
        height5: 1,
        persistence: 0,
        lacunarity: 0,
        simplePeriod: 0,
        octaves: 0,
        bumpScale: 0,
        shininess: 0,
        specularStrength: 0,
        roughness: 0,
        ambientLightIntensity: 0,
        undulation: 0,
        terrainType: 0,
        terrainAmplitude: 0,
        terrainSharpness: 0,
        terrainOffset: 0,
      };
      baseConfig.rings = getRingConfig(object);

      // Add a glow effect for gas giants
      baseConfig.atmosphere = {
        color: atmoColor,
        size: 2.0, // More prominent than a planet's, less than a star's
      };
      break;
    }
    case CelestialType.COMET: {
      const cometProps = object.properties as CometProperties;
      // Small, bright head
      baseConfig.base = {
        type: "planet",
        color: cometProps.visualComaColor || "#FFFFFF",
        radius: 3, // Smaller radius for the comet head
      };

      // A tail instead of a generic atmosphere glow
      baseConfig.tail = {
        color: cometProps.visualTailColor || "#DCE6FF",
        angle: -45, // Pointing up and to the right
        length: 12, // A decent length
      };

      // Ensure atmosphere from base config is removed
      baseConfig.atmosphere = undefined;
      break;
    }
    case CelestialType.ASTEROID: {
      baseConfig.base.color = "#8B4513";
      break;
    }
    case CelestialType.ASTEROID_FIELD:
    case CelestialType.RING_SYSTEM: {
      // Represent belts and ring systems as just a ring, no central body
      baseConfig.base.type = "planet"; // Still need a base type
      baseConfig.base.color = "transparent"; // Make the core invisible
      baseConfig.rings = {
        color: "#888888",
        angle: 20,
      };
      break;
    }
    case CelestialType.SATELLITE: {
      // Custom satellite icon with silver/metallic appearance
      baseConfig.base = {
        type: "satellite",
        color: "#C0C0C0", // Silver color for the satellite body
      };
      // Remove atmosphere and rings - satellites don't have these
      baseConfig.atmosphere = undefined;
      baseConfig.rings = undefined;
      break;
    }
    default: {
      baseConfig.base.color = "#444444";
    }
  }
  return baseConfig;
}
