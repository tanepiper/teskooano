import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";
import { SatelliteMaterial, type SatelliteMaterialOptions } from "./material";
import { SatelliteNodeMaterial } from "./material-tsl";

/**
 * Factory class for creating satellite materials.
 * Creates either GLSL (WebGL) or TSL (WebGPU) materials based on renderer backend.
 */
export class SatelliteMaterialFactory {
  /**
   * Creates a satellite material for the specified renderer backend
   */
  createMaterial(
    rendererBackend: RendererBackend,
    options: SatelliteMaterialOptions = {},
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      console.log("[SatelliteMaterialFactory] Creating WebGPU material (TSL)");
      return new SatelliteNodeMaterial(options);
    } else {
      console.log("[SatelliteMaterialFactory] Creating WebGL material (GLSL)");
      return new SatelliteMaterial(options);
    }
  }

  /**
   * Check if a material is a GLSL material (has uniforms property)
   */
  isGLSLMaterial(material: THREE.Material): material is SatelliteMaterial {
    return "uniforms" in material && material.uniforms !== undefined;
  }

  /**
   * Check if a material is a TSL material
   */
  isTSLMaterial(material: THREE.Material): material is SatelliteNodeMaterial {
    return material instanceof SatelliteNodeMaterial;
  }
}
