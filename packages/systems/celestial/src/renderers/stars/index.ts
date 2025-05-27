/**
 * Star Renderers - organized by StellarType categories
 */

import { StellarType, MainSequenceSpectralClass } from "@teskooano/data-types";

// ============================================================================
// BASE CLASSES
// ============================================================================
export * from "./base";
import { BaseStarRenderer } from "./base/base-star";

// ============================================================================
// PRE-MAIN SEQUENCE STARS
// ============================================================================
export * from "./pre-main-sequence";
import { ProtostarRenderer } from "./pre-main-sequence/protostar";
import { TTauriRenderer } from "./pre-main-sequence/t-tauri";
import { HerbigAeBeRenderer } from "./pre-main-sequence/herbig-ae-be";

// ============================================================================
// MAIN SEQUENCE STARS
// ============================================================================
export * from "./main-sequence";
import { MainSequenceStarRenderer } from "./main-sequence/main-sequence-star";
import { ClassOStarRenderer } from "./main-sequence/class-o";
import { ClassBStarRenderer } from "./main-sequence/class-b";
import { ClassAStarRenderer } from "./main-sequence/class-a";
import { ClassFStarRenderer } from "./main-sequence/class-f";
import { ClassGStarRenderer } from "./main-sequence/class-g";
import { ClassKStarRenderer } from "./main-sequence/class-k";
import { ClassMStarRenderer } from "./main-sequence/class-m";

// ============================================================================
// POST-MAIN SEQUENCE STARS
// ============================================================================
export * from "./post-main-sequence";
import { SubgiantRenderer } from "./post-main-sequence/subgiant";
import { RedGiantRenderer } from "./post-main-sequence/red-giant";
import { BlueGiantRenderer } from "./post-main-sequence/blue-giant";
import { SupergiantRenderer } from "./post-main-sequence/supergiant";
import { HypergiantRenderer } from "./post-main-sequence/hypergiant";

// ============================================================================
// EVOLVED/SPECIAL TYPES
// ============================================================================
export * from "./evolved-special";
import { WolfRayetRenderer } from "./evolved-special/wolf-rayet";
import { CarbonStarRenderer } from "./evolved-special/carbon-star";
import { VariableStarRenderer } from "./evolved-special/variable-star";

// ============================================================================
// STELLAR REMNANTS
// ============================================================================
export * from "./remnants";
import { WhiteDwarfRenderer } from "./remnants/white-dwarf";
import { NeutronStarRenderer } from "./remnants/neutron-star";
import { SchwarzschildBlackHoleRenderer } from "./remnants/schwarzschild-black-hole";
import { KerrBlackHoleRenderer } from "./remnants/kerr-black-hole";

/**
 * Factory function to create the appropriate star renderer based on stellar type
 * @param stellarType The stellar type from the classification system
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
      // Default to Schwarzschild - could be enhanced to detect rotation
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
 * // Using stellar type classification
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
