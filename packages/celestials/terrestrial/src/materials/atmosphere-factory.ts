import * as THREE from "three";
import type {
  PlanetAtmosphereProperties,
  RendererBackend,
} from "@teskooano/data-types";
import { AtmosphereMaterial } from "./atmosphere.material";
import { AtmosphereNodeMaterial } from "./atmosphere-tsl.material";

/**
 * Options for creating atmosphere materials
 */
export interface AtmosphereMaterialOptions {
  rendererBackend: RendererBackend;
  atmosphereProps: PlanetAtmosphereProperties & {
    aberrationIntensity?: number;
    opacity?: number;
  };
  planetRadius?: number;
  parentId?: string;
}

/**
 * Factory class for creating atmosphere materials.
 * Creates either GLSL (WebGL) or TSL (WebGPU) materials based on renderer backend.
 */
export class AtmosphereMaterialFactory {
  /**
   * Creates an atmosphere material for the specified renderer backend
   */
  createMaterial(options: AtmosphereMaterialOptions): THREE.Material {
    const { rendererBackend, atmosphereProps, planetRadius, parentId } =
      options;

    if (rendererBackend === "webgpu") {
      console.log("[AtmosphereMaterialFactory] Creating WebGPU material (TSL)");
      return new AtmosphereNodeMaterial(atmosphereProps, {
        planetRadius,
        parentId,
      });
    } else {
      console.log("[AtmosphereMaterialFactory] Creating WebGL material (GLSL)");
      return new AtmosphereMaterial(atmosphereProps, {
        planetRadius,
        parentId,
      });
    }
  }

  /**
   * Check if a material is a GLSL material (has uniforms property)
   */
  isGLSLMaterial(material: THREE.Material): material is AtmosphereMaterial {
    return "uniforms" in material && material.uniforms !== undefined;
  }

  /**
   * Check if a material is a TSL material
   */
  isTSLMaterial(material: THREE.Material): material is AtmosphereNodeMaterial {
    return material instanceof AtmosphereNodeMaterial;
  }
}
