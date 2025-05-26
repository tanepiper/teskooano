/**
 * Exports for star renderers
 */
export * from "./base-star";
export * from "./main-sequence-star";
export * from "./class-o";
export * from "./class-b";
export * from "./class-a";
export * from "./class-f";
export * from "./class-g";
export * from "./class-k";
export * from "./class-m";
export * from "./neutron-star";
export * from "./white-dwarf";
export * from "./wolf-rayet";
export * from "./schwarzschild-black-hole";
export * from "./kerr-black-hole";
// New stellar type renderers
export * from "./protostar";
export * from "./t-tauri";
export * from "./herbig-ae-be";
export * from "./subgiant";
export * from "./red-giant";
export * from "./blue-giant";
export * from "./supergiant";
export * from "./hypergiant";
export * from "./carbon-star";
export * from "./variable-star";

import { BaseStarRenderer } from "./base-star";
import { MainSequenceStarRenderer } from "./main-sequence-star";
import { ClassOStarRenderer } from "./class-o";
import { ClassBStarRenderer } from "./class-b";
import { ClassAStarRenderer } from "./class-a";
import { ClassFStarRenderer } from "./class-f";
import { ClassGStarRenderer } from "./class-g";
import { ClassKStarRenderer } from "./class-k";
import { ClassMStarRenderer } from "./class-m";
import { NeutronStarRenderer } from "./neutron-star";
import { WhiteDwarfRenderer } from "./white-dwarf";
import { WolfRayetRenderer } from "./wolf-rayet";
import { SchwarzschildBlackHoleRenderer } from "./schwarzschild-black-hole";
import { KerrBlackHoleRenderer } from "./kerr-black-hole";
// New stellar type renderers
import { ProtostarRenderer } from "./protostar";
import { TTauriRenderer } from "./t-tauri";
import { HerbigAeBeRenderer } from "./herbig-ae-be";
import { SubgiantRenderer } from "./subgiant";
import { RedGiantRenderer } from "./red-giant";
import { BlueGiantRenderer } from "./blue-giant";
import { SupergiantRenderer } from "./supergiant";
import { HypergiantRenderer } from "./hypergiant";
import { CarbonStarRenderer } from "./carbon-star";
import { VariableStarRenderer } from "./variable-star";
import { StellarType, MainSequenceSpectralClass } from "@teskooano/data-types";

/**
 * Factory function to create the appropriate star renderer based on stellar type
 * @param stellarType The stellar type from the new classification system
 * @param spectralClass Optional spectral class for main sequence stars
 * @returns A renderer appropriate for the given stellar type
 */
export function createStarRenderer(
  stellarType: StellarType,
  spectralClass?: MainSequenceSpectralClass,
): BaseStarRenderer {
  switch (stellarType) {
    // Pre-main sequence
    case StellarType.PROTOSTAR:
      return new ProtostarRenderer();
    case StellarType.T_TAURI:
      return new TTauriRenderer();
    case StellarType.HERBIG_AE_BE:
      return new HerbigAeBeRenderer();

    // Main sequence - use spectral class to determine specific renderer
    case StellarType.MAIN_SEQUENCE:
      if (spectralClass) {
        switch (spectralClass) {
          case MainSequenceSpectralClass.O:
            return new ClassOStarRenderer();
          case MainSequenceSpectralClass.B:
            return new ClassBStarRenderer();
          case MainSequenceSpectralClass.A:
            return new ClassAStarRenderer();
          case MainSequenceSpectralClass.F:
            return new ClassFStarRenderer();
          case MainSequenceSpectralClass.G:
            return new ClassGStarRenderer();
          case MainSequenceSpectralClass.K:
            return new ClassKStarRenderer();
          case MainSequenceSpectralClass.M:
            return new ClassMStarRenderer();
        }
      }
      return new MainSequenceStarRenderer();

    // Post-main sequence
    case StellarType.SUBGIANT:
      return new SubgiantRenderer();
    case StellarType.RED_GIANT:
      return new RedGiantRenderer();
    case StellarType.BLUE_GIANT:
      return new BlueGiantRenderer();
    case StellarType.SUPERGIANT:
      return new SupergiantRenderer();
    case StellarType.HYPERGIANT:
      return new HypergiantRenderer();

    // Evolved/Special types
    case StellarType.WOLF_RAYET:
      return new WolfRayetRenderer();
    case StellarType.CARBON_STAR:
      return new CarbonStarRenderer();
    case StellarType.VARIABLE_STAR:
      return new VariableStarRenderer();

    // Remnants
    case StellarType.WHITE_DWARF:
      return new WhiteDwarfRenderer();
    case StellarType.NEUTRON_STAR:
      return new NeutronStarRenderer();
    case StellarType.BLACK_HOLE:
      // For now, default to Schwarzschild - could be enhanced to detect rotation
      return new SchwarzschildBlackHoleRenderer();

    default:
      console.warn(
        `Unknown stellar type: ${stellarType}, using main sequence renderer`,
      );
      return new MainSequenceStarRenderer();
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createStarRenderer with StellarType instead
 */
export function createStarRendererLegacy(
  spectralClass?: string,
  stellarType?: StellarType,
): BaseStarRenderer {
  if (stellarType) {
    return createStarRenderer(stellarType);
  }

  // Legacy spectral class mapping
  switch (spectralClass?.toUpperCase()) {
    case "O":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.O,
      );
    case "B":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.B,
      );
    case "A":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.A,
      );
    case "F":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.F,
      );
    case "G":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.G,
      );
    case "K":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.K,
      );
    case "M":
      return createStarRenderer(
        StellarType.MAIN_SEQUENCE,
        MainSequenceSpectralClass.M,
      );
    default:
      return createStarRenderer(StellarType.MAIN_SEQUENCE);
  }
}

/**
 * Example usage:
 *
 * // New way - using stellar type classification
 * const starRenderer = createStarRenderer(
 *   StellarType.MAIN_SEQUENCE,
 *   MainSequenceSpectralClass.G
 * );
 *
 * // For evolved stars
 * const giantRenderer = createStarRenderer(StellarType.RED_GIANT);
 *
 * // For remnants
 * const neutronRenderer = createStarRenderer(StellarType.NEUTRON_STAR);
 *
 * const starMesh = starRenderer.getLODLevels(starObject);
 * scene.add(starMesh);
 *
 * function animate() {
 *   requestAnimationFrame(animate);
 *   starRenderer.update();
 *   renderer.render(scene, camera);
 * }
 * animate();
 */
