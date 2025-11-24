import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";
import { SchwarzschildBlackHoleMaterial } from "./schwarzschild-black-hole";
import { ErgosphereMaterial } from "./kerr-black-hole";
import { GravitationalLensingMaterial } from "./gravitational-lensing";
import {
  SchwarzschildBlackHoleNodeMaterial,
  ErgosphereNodeMaterial,
  GravitationalLensingNodeMaterial,
} from "./black-hole-tsl.materials";

/**
 * Factory class for creating black hole materials.
 * Creates either GLSL (WebGL) or TSL (WebGPU) materials based on renderer backend.
 */
export class BlackHoleMaterialFactory {
  /**
   * Creates a Schwarzschild black hole material
   */
  createSchwarzschildMaterial(
    rendererBackend: RendererBackend,
    schwarzschildRadius: number,
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new SchwarzschildBlackHoleNodeMaterial();
    } else {
      return new SchwarzschildBlackHoleMaterial(schwarzschildRadius);
    }
  }

  /**
   * Creates an ergosphere material for Kerr black holes
   */
  createErgosphereMaterial(
    rendererBackend: RendererBackend,
    options: { color?: THREE.Color; opacity?: number } = {},
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new ErgosphereNodeMaterial(options);
    } else {
      return new ErgosphereMaterial(options.color, options.opacity);
    }
  }

  /**
   * Creates a gravitational lensing material
   */
  createGravitationalLensingMaterial(
    rendererBackend: RendererBackend,
    options: { strength?: number } = {},
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new GravitationalLensingNodeMaterial(options);
    } else {
      return new GravitationalLensingMaterial(options.strength ?? 1.0);
    }
  }
}
