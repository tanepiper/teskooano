import {
  CelestialObject,
  CelestialType,
  ExoticStellarType,
  GasGiantClass,
  PlanetType,
  SpectralClass,
  StellarType,
} from "@teskooano/data-types";

/**
 * Generates a detailed type description for a celestial object.
 * For planets, shows the planet type (e.g., "Lava Planet", "Ice Planet").
 * For gas giants, shows the class (e.g., "Class I Gas Giant").
 * For stars, shows the stellar type and spectral class (e.g., "G2V Main Sequence Star").
 * For other objects, shows the basic type.
 */
export function formatDetailedType(object: CelestialObject): string {
  switch (object.type) {
    case CelestialType.STAR: {
      const starProps = object.properties;
      if (!starProps || starProps.type !== CelestialType.STAR) {
        return "Star";
      }

      const stellarType = starProps.classType;
      const exoticType = starProps.exoticType;
      const spectralClass = starProps.spectralClass;
      const mainSpectralClass = starProps.mainSpectralClass;

      // Handle exotic stellar types first
      if (exoticType) {
        switch (exoticType) {
          case ExoticStellarType.PULSAR:
            return "Pulsar";
          case ExoticStellarType.MAGNETAR:
            return "Magnetar";
          case ExoticStellarType.BLACK_HOLE:
            return "Black Hole";
          case ExoticStellarType.QUASAR:
            return "Quasar";
          case ExoticStellarType.WHITE_DWARF:
            return "White Dwarf";
          case ExoticStellarType.WOLF_RAYET:
            return "Wolf-Rayet Star";
          case ExoticStellarType.T_TAURI:
            return "T Tauri Star";
          case ExoticStellarType.HERBIG_AE_BE:
            return "Herbig Ae/Be Star";
          case ExoticStellarType.PROTOSTAR:
            return "Protostar";
          default:
            return "Exotic Star";
        }
      }

      // Handle regular stellar types
      if (stellarType) {
        let typeName = "";
        switch (stellarType) {
          case StellarType.MAIN_SEQUENCE:
            typeName = "Main Sequence Star";
            break;
          case StellarType.NEUTRON_STAR:
            return "Neutron Star";
          case StellarType.WHITE_DWARF:
            return "White Dwarf";
          case StellarType.WOLF_RAYET:
            return "Wolf-Rayet Star";
          case StellarType.BLACK_HOLE:
            return "Black Hole";
          case StellarType.KERR_BLACK_HOLE:
            return "Kerr Black Hole";
          default:
            typeName = "Star";
        }

        // Add spectral class if available
        if (spectralClass) {
          return `${spectralClass} ${typeName}`;
        }

        return typeName;
      }

      // Fallback to spectral class only
      if (spectralClass) {
        return `${spectralClass} Star`;
      }

      return "Star";
    }

    case CelestialType.PLANET:
    case CelestialType.DWARF_PLANET: {
      const planetProps = object.properties;
      if (!planetProps || planetProps.type !== CelestialType.PLANET) {
        return object.type === CelestialType.DWARF_PLANET
          ? "Dwarf Planet"
          : "Planet";
      }

      const planetType = planetProps.classType;
      if (!planetType) {
        return object.type === CelestialType.DWARF_PLANET
          ? "Dwarf Planet"
          : "Planet";
      }

      let typeName = "";
      switch (planetType) {
        case PlanetType.TERRESTRIAL:
          typeName = "Terrestrial Planet";
          break;
        case PlanetType.ROCKY:
          typeName = "Rocky Planet";
          break;
        case PlanetType.ICE:
          typeName = "Ice Planet";
          break;
        case PlanetType.LAVA:
          typeName = "Lava Planet";
          break;
        case PlanetType.DESERT:
          typeName = "Desert Planet";
          break;
        case PlanetType.OCEAN:
          typeName = "Ocean Planet";
          break;
        case PlanetType.BARREN:
          typeName = "Barren Planet";
          break;
        default:
          typeName =
            object.type === CelestialType.DWARF_PLANET
              ? "Dwarf Planet"
              : "Planet";
      }

      return typeName;
    }

    case CelestialType.GAS_GIANT: {
      const gasGiantProps = object.properties;
      if (!gasGiantProps || gasGiantProps.type !== CelestialType.GAS_GIANT) {
        return "Gas Giant";
      }

      const gasGiantClass = gasGiantProps.classType;
      if (!gasGiantClass) {
        return "Gas Giant";
      }

      let className = "";
      switch (gasGiantClass) {
        case GasGiantClass.CLASS_I:
          className = "Class I";
          break;
        case GasGiantClass.CLASS_II:
          className = "Class II";
          break;
        case GasGiantClass.CLASS_III:
          className = "Class III";
          break;
        case GasGiantClass.CLASS_IV:
          className = "Class IV";
          break;
        case GasGiantClass.CLASS_V:
          className = "Class V";
          break;
        default:
          return "Gas Giant";
      }

      return `${className} Gas Giant`;
    }

    case CelestialType.MOON: {
      const moonProps = object.properties;
      if (!moonProps || moonProps.type !== CelestialType.PLANET) {
        return "Moon";
      }

      const planetType = moonProps.classType;
      if (!planetType) {
        return "Moon";
      }

      let typeName = "";
      switch (planetType) {
        case PlanetType.ROCKY:
        case PlanetType.BARREN:
          typeName = "Rocky Moon";
          break;
        case PlanetType.ICE:
          typeName = "Ice Moon";
          break;
        default:
          typeName = "Moon";
      }

      return typeName;
    }

    case CelestialType.COMET:
      return "Comet";

    case CelestialType.ASTEROID_FIELD:
      return "Asteroid Field";

    case CelestialType.OORT_CLOUD:
      return "Oort Cloud";

    case CelestialType.RING_SYSTEM:
      return "Ring System";

    case CelestialType.SPACE_ROCK:
      return "Space Rock";

    case CelestialType.BARYCENTER:
      return "Barycenter";

    case CelestialType.OTHER:
    default:
      return "Celestial Object";
  }
}
