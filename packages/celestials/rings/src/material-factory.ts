import { Color, Vector3, Material } from "three";
import type { RendererBackend } from "@teskooano/data-types";
import { RingMaterial, AccretionDiskMaterial } from "./material";
import { RingNodeMaterial, AccretionDiskNodeMaterial } from "./material-tsl";

export interface RingMaterialOptions {
  opacity?: number;
  detailLevel?: "high" | "medium" | "low" | "very-low";
  rotationRate?: number;
  axialInclination?: number;
  ringTilt?: number;
  inheritParentTilt?: boolean;
  segmentDensity?: number;
  segmentWidth?: number;
  particleDetail?: number;
  densityVariation?: number;
}

export interface AccretionDiskMaterialOptions {
  opacity?: number;
  detailLevel?: "high" | "medium" | "low" | "very-low";
  rotationRate?: number;
  temperature?: number;
  accretionRate?: number;
  emissionType?: "thermal" | "synchrotron" | "mixed";
  isRelativistic?: boolean;
  innerEdgeRadius?: number;
  axialInclination?: number;
  ringTilt?: number;
  inheritParentTilt?: boolean;
}

/**
 * Factory class for creating ring and accretion disk materials.
 * Creates either GLSL (WebGL) or TSL (WebGPU) materials based on renderer backend.
 */
export class RingMaterialFactory {
  /**
   * Creates a ring material for the specified renderer backend
   */
  createRingMaterial(
    rendererBackend: RendererBackend,
    ringColor: Color = new Color(0xeeddaa),
    options: RingMaterialOptions = {},
  ): Material {
    if (rendererBackend === "webgpu") {
      console.log("[RingMaterialFactory] Creating WebGPU ring material (TSL)");
      return new RingNodeMaterial(ringColor, options);
    } else {
      console.log("[RingMaterialFactory] Creating WebGL ring material (GLSL)");
      return new RingMaterial(ringColor, options);
    }
  }

  /**
   * Creates an accretion disk material for the specified renderer backend
   */
  createAccretionDiskMaterial(
    rendererBackend: RendererBackend,
    diskColor: Color = new Color(0xff8844),
    options: AccretionDiskMaterialOptions = {},
  ): Material {
    if (rendererBackend === "webgpu") {
      console.log(
        "[RingMaterialFactory] Creating WebGPU accretion disk material (TSL)",
      );
      return new AccretionDiskNodeMaterial(diskColor, options);
    } else {
      console.log(
        "[RingMaterialFactory] Creating WebGL accretion disk material (GLSL)",
      );
      return new AccretionDiskMaterial(diskColor, options);
    }
  }

  /**
   * Check if a material is a GLSL material (has uniforms property)
   */
  isGLSLMaterial(material: Material): boolean {
    return "uniforms" in material && material.uniforms !== undefined;
  }

  /**
   * Check if a material is a TSL material
   */
  isTSLMaterial(material: Material): boolean {
    return (
      material instanceof RingNodeMaterial ||
      material instanceof AccretionDiskNodeMaterial
    );
  }
}
