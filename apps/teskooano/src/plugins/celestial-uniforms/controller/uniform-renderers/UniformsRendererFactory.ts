import { CelestialObject, CelestialType } from "@teskooano/data-types";
import { BaseUniformsRenderer } from "./BaseUniformsRenderer";
import { StarUniformsRenderer } from "./StarUniformsRenderer";
import { TerrestrialUniformsRenderer } from "./TerrestrialUniformsRenderer";

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
