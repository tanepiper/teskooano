import {
  CelestialObject,
  CelestialType,
  CometProperties,
  GasGiantProperties,
  PlanetProperties,
  PlanetType,
  ProceduralSurfaceProperties,
  SpectralClass,
  StarProperties,
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
      const spectralClass = starProps.mainSpectralClass;
      baseConfig.base.type = "star";
      if (spectralClass && SPECTRAL_CLASS_GRADIENTS[spectralClass]) {
        baseConfig.base.gradient = SPECTRAL_CLASS_GRADIENTS[spectralClass];
      } else {
        baseConfig.base.gradient = [starProps.color, "#333333"];
      }
      baseConfig.atmosphere = {
        color: starProps.color || "#FFFFFF",
        size: 4, // A larger glow for stars
      };
      break;
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
      const atmoColor = gasGiantProps.atmosphereColor || "#E6A974";
      const cloudColor = gasGiantProps.cloudColor || "#C7956D";
      const stormColor = gasGiantProps.stormColor || "#8f6648";

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
      baseConfig.base.color = cometProps.visualComaColor || "#FFFFFF";
      baseConfig.atmosphere = { color: "#B0E0E6", size: 3 };
      break;
    }
    case CelestialType.SPACE_ROCK: {
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
    default: {
      baseConfig.base.color = "#444444";
    }
  }
  return baseConfig;
}
