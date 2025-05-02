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
import { StellarType } from "@teskooano/data-types";

/**
 * Helper function to create the appropriate star renderer based on spectral class or stellar type
 * @param spectralClass The spectral class of the star (O, B, A, F, G, K, M)
 * @param stellarType For exotic objects: StellarType enum value
 * @returns A renderer appropriate for the given spectral class or stellar type
 */
export function createStarRenderer(
  spectralClass?: string,
  stellarType?: StellarType,
): BaseStarRenderer {
  if (stellarType) {
    switch (stellarType) {
      case StellarType.NEUTRON_STAR:
        return new NeutronStarRenderer();
      case StellarType.WHITE_DWARF:
        return new WhiteDwarfRenderer();
      case StellarType.WOLF_RAYET:
        return new WolfRayetRenderer();
      case StellarType.BLACK_HOLE:
        return new SchwarzschildBlackHoleRenderer();
      case StellarType.KERR_BLACK_HOLE:
        return new KerrBlackHoleRenderer();
      case StellarType.MAIN_SEQUENCE:
        break;
    }
  }

  switch (spectralClass?.toUpperCase()) {
    case "O":
      return new ClassOStarRenderer();
    case "B":
      return new ClassBStarRenderer();
    case "A":
      return new ClassAStarRenderer();
    case "F":
      return new ClassFStarRenderer();
    case "G":
      return new ClassGStarRenderer();
    case "K":
      return new ClassKStarRenderer();
    case "M":
      return new ClassMStarRenderer();
    default:
      return new MainSequenceStarRenderer();
  }
}

/**
 * Example usage in animation loop:
 *
 *
 * const starRenderer = createStarRenderer(
 *   starObject.properties.spectralClass,
 *   starObject.properties.stellarType
 * );
 *
 *
 * const starMesh = starRenderer.createMesh(starObject);
 * scene.add(starMesh);
 *
 *
 * function animate() {
 *   requestAnimationFrame(animate);
 *
 *
 *   starRenderer.animate();
 *
 *   renderer.render(scene, camera);
 * }
 * animate();
 */
