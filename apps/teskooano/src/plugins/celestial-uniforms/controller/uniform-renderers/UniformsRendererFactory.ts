import {
  CelestialObject,
  CelestialType,
  StellarType,
  type StarProperties,
} from "@teskooano/data-types";
import { BaseUniformsRenderer } from "./BaseUniformsRenderer";
import { StarUniformsRenderer } from "./StarUniformsRenderer";
import { TerrestrialUniformsRenderer } from "./TerrestrialUniformsRenderer";
import { MainSequenceStarUniformsRenderer } from "../star-type/main-sequence/index";

/**
 * A factory for creating the appropriate uniform renderer for a given celestial object.
 */
export class UniformsRendererFactory {
  /**
   * Gets the specialized renderer for a celestial object.
   * @param celestial The celestial object.
   * @returns A `BaseUniformsRenderer` instance or `null` if no renderer is available.
   */
  public static getRendererForCelestial(
    celestial: CelestialObject,
  ): BaseUniformsRenderer | null {
    if (!celestial.properties) {
      return null;
    }

    switch (celestial.type) {
      case CelestialType.STAR:
        const starProps = celestial.properties as StarProperties;
        // Use enhanced renderer for main sequence stars
        if (starProps.stellarType === StellarType.MAIN_SEQUENCE) {
          return new MainSequenceStarUniformsRenderer();
        }
        // Fall back to basic star renderer for other star types
        return new StarUniformsRenderer();
      case CelestialType.PLANET:
      case CelestialType.MOON:
      case CelestialType.DWARF_PLANET:
        // This assumes that if it's a planet-like object, it has a terrestrial surface.
        // A more robust implementation might check for `properties.surface`.
        return new TerrestrialUniformsRenderer();
      // Future case for Gas Giants would go here
      // case CelestialType.GAS_GIANT:
      //   return new GasGiantUniformsRenderer();
      default:
        return null;
    }
  }
}
