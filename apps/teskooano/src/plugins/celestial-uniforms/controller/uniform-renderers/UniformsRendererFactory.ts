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
import { WhiteDwarfUniformsRenderer } from "../star-type/white-dwarf/index";
import { NeutronStarUniformsRenderer } from "../star-type/neutron-star/index";
import { BlackHoleUniformsRenderer } from "../star-type/black-hole/index";
import { WolfRayetUniformsRenderer } from "../star-type/wolf-rayet/index";
import { HypergiantUniformsRenderer } from "../star-type/hypergiant/index";
import { ProtostarUniformsRenderer } from "../star-type/protostar/index";

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

        // Use specialized renderers for different stellar types
        switch (starProps.stellarType) {
          case StellarType.MAIN_SEQUENCE:
            return new MainSequenceStarUniformsRenderer();
          case StellarType.WHITE_DWARF:
            return new WhiteDwarfUniformsRenderer();
          case StellarType.NEUTRON_STAR:
            return new NeutronStarUniformsRenderer();
          case StellarType.BLACK_HOLE:
            return new BlackHoleUniformsRenderer();
          case StellarType.WOLF_RAYET:
            return new WolfRayetUniformsRenderer();
          case StellarType.HYPERGIANT:
            return new HypergiantUniformsRenderer();
          case StellarType.PROTOSTAR:
          case StellarType.PRE_MAIN_SEQUENCE:
            return new ProtostarUniformsRenderer();
          default:
            // Fall back to basic star renderer for other star types
            return new StarUniformsRenderer();
        }
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
