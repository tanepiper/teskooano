/**
 * Star Renderers - organized by StellarType categories
 */

import { StellarType, MainSequenceSpectralClass } from "@teskooano/data-types";
import { WhiteDwarfRenderer } from "./remnants/white-dwarf";
import { NeutronStarRenderer } from "./remnants/neutron-star";
import { SchwarzschildBlackHoleRenderer } from "./black-holes/schwarzschild-black-hole";
import { KerrBlackHoleRenderer } from "./black-holes/kerr-black-hole";
import { ProtostarRenderer } from "./pre-main-sequence/protostar";
import { TTauriRenderer } from "./pre-main-sequence/t-tauri";
import { HerbigAeBeRenderer } from "./pre-main-sequence/herbig-ae-be";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../common/CelestialRenderer";
import { BaseStarRenderer } from "./base/base-star";

// ============================================================================
// BASE CLASSES
// ============================================================================
export * from "./base";

// ============================================================================
// PRE-MAIN SEQUENCE STARS
// ============================================================================
export * from "./pre-main-sequence";

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

// Explicitly export black hole renderers for easier top-level import if needed
export { SchwarzschildBlackHoleRenderer } from "./black-holes/schwarzschild-black-hole";
export { KerrBlackHoleRenderer } from "./black-holes/kerr-black-hole";

/**
 * Factory function to create the appropriate star renderer based on stellar type
 * @param object The renderable celestial object representing the star.
 * @param stellarType The stellar type from the classification system.
 * @param options Optional rendering options.
 * @param spectralClass Optional spectral class for main sequence stars.
 * @returns A renderer appropriate for the given stellar type.
 */
export function createStarRenderer(
  object: RenderableCelestialObject,
  stellarType: StellarType,
  options?: CelestialMeshOptions,
  spectralClass?: MainSequenceSpectralClass,
): BaseStarRenderer {
  switch (stellarType) {
    // Pre-main sequence
    case StellarType.PROTOSTAR:
      return new ProtostarRenderer(object, options);
    case StellarType.T_TAURI:
      return new TTauriRenderer(object, options);
    case StellarType.HERBIG_AE_BE:
      return new HerbigAeBeRenderer(object, options);

    // Main sequence - use spectral class to determine specific renderer
    case StellarType.MAIN_SEQUENCE:
      if (spectralClass) {
        switch (spectralClass) {
          case MainSequenceSpectralClass.O:
            return new ClassOStarRenderer(object, options);
          case MainSequenceSpectralClass.B:
            return new ClassBStarRenderer(object, options);
          case MainSequenceSpectralClass.A:
            return new ClassAStarRenderer(object, options);
          case MainSequenceSpectralClass.F:
            return new ClassFStarRenderer(object, options);
          case MainSequenceSpectralClass.G:
            return new ClassGStarRenderer(object, options);
          case MainSequenceSpectralClass.K:
            return new ClassKStarRenderer(object, options);
          case MainSequenceSpectralClass.M:
            return new ClassMStarRenderer(object, options);
        }
      }
      return new MainSequenceStarRenderer(object, options);

    // Post-main sequence
    case StellarType.SUBGIANT:
      return new SubgiantRenderer(object, options);
    case StellarType.RED_GIANT:
      return new RedGiantRenderer(object, options);
    case StellarType.BLUE_GIANT:
      return new BlueGiantRenderer(object, options);
    case StellarType.SUPERGIANT:
      return new SupergiantRenderer(object, options);
    case StellarType.HYPERGIANT:
      return new HypergiantRenderer(object, options);

    // Evolved/Special types
    case StellarType.WOLF_RAYET:
      return new WolfRayetRenderer(object, options);
    case StellarType.CARBON_STAR:
      return new CarbonStarRenderer(object, options);
    case StellarType.VARIABLE_STAR:
      return new VariableStarRenderer(object, options);

    // Remnants
    case StellarType.WHITE_DWARF:
      return new WhiteDwarfRenderer(object, options);
    case StellarType.NEUTRON_STAR:
      return new NeutronStarRenderer(object, options);
    case StellarType.BLACK_HOLE:
      const starProps = object.properties as any;
      if (starProps?.isKerr || starProps?.angularMomentum > 0) {
        return new KerrBlackHoleRenderer(
          object,
          options,
          starProps.rotationSpeed || 0.5,
        );
      }
      return new SchwarzschildBlackHoleRenderer(object, options);

    default:
      console.warn(
        `Unknown stellar type: ${stellarType} for object ${object.celestialObjectId}, using main sequence renderer`,
      );
      return new MainSequenceStarRenderer(object, options);
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createStarRenderer with StellarType, object, and options instead
 */
export function createStarRendererLegacy(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
  spectralClass?: string,
  stellarType?: StellarType,
): BaseStarRenderer {
  if (stellarType) {
    return createStarRenderer(
      object,
      stellarType,
      options,
      spectralClass as MainSequenceSpectralClass,
    );
  }

  const mainSeqSpectralClass =
    spectralClass?.toUpperCase() as MainSequenceSpectralClass;
  if (Object.values(MainSequenceSpectralClass).includes(mainSeqSpectralClass)) {
    return createStarRenderer(
      object,
      StellarType.MAIN_SEQUENCE,
      options,
      mainSeqSpectralClass,
    );
  }
  return createStarRenderer(object, StellarType.MAIN_SEQUENCE, options);
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
