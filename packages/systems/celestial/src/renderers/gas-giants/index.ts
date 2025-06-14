import { GasGiantClass } from "@teskooano/data-types";
import { BaseGasGiantRenderer } from "./base-gas-giant";
import { ClassIGasGiantRenderer } from "./class-i";
import { ClassIIGasGiantRenderer } from "./class-ii";
import { ClassIIIGasGiantRenderer } from "./class-iii";
import { ClassIVGasGiantRenderer } from "./class-iv";
import { ClassVGasGiantRenderer } from "./class-v";

export {
  BaseGasGiantMaterial,
  BasicGasGiantMaterial,
  BaseGasGiantRenderer,
} from "./base-gas-giant";
export * from "./class-i";
export * from "./class-ii";
export * from "./class-iii";
export * from "./class-iv";
export * from "./class-v";

/**
 * Factory function to create the appropriate gas giant renderer based on its class.
 * @param gasGiantClass The Sudarsky classification of the gas giant.
 * @returns An instance of a concrete `BaseGasGiantRenderer`.
 */
export function createGasGiantRenderer(
  gasGiantClass: GasGiantClass,
): BaseGasGiantRenderer {
  switch (gasGiantClass) {
    case GasGiantClass.CLASS_I:
      return new ClassIGasGiantRenderer();
    case GasGiantClass.CLASS_II:
      return new ClassIIGasGiantRenderer();
    case GasGiantClass.CLASS_III:
      return new ClassIIIGasGiantRenderer();
    case GasGiantClass.CLASS_IV:
      return new ClassIVGasGiantRenderer();
    case GasGiantClass.CLASS_V:
      return new ClassVGasGiantRenderer();
    default:
      console.warn(
        `[createGasGiantRenderer] Unknown gas giant class: ${gasGiantClass}, falling back to Class I.`,
      );
      return new ClassIGasGiantRenderer();
  }
}
