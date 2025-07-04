import { CelestialObject, PlanetProperties } from "@teskooano/data-types";
import { CelestialType, PlanetType } from "@teskooano/data-types";

/**
 * Determines planet type from CelestialObject properties
 */
export function getCelestialTypeForPlanet(
  planetObject: CelestialObject,
): CelestialType {
  if (planetObject.type === CelestialType.GAS_GIANT) {
    return CelestialType.GAS_GIANT;
  }

  const props = planetObject.properties as PlanetProperties;
  if (!props) return CelestialType.OTHER;

  switch (props.classType) {
    case PlanetType.TERRESTRIAL:
    case PlanetType.ROCKY:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
    case PlanetType.BARREN:
    case PlanetType.ICE:
    case PlanetType.OCEAN:
      return CelestialType.PLANET;

    default:
      return CelestialType.OTHER;
  }
}
