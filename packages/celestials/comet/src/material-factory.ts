import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";
import {
  CometNucleusMaterial,
  CometComaMaterial,
  CometParticleMaterial,
  CometJetMaterial,
  CometSimplifiedTailMaterial,
} from "./material";
import {
  CometNucleusNodeMaterial,
  CometComaNodeMaterial,
  CometParticleNodeMaterial,
  CometJetNodeMaterial,
  CometSimplifiedTailNodeMaterial,
} from "./material-tsl";

/**
 * Factory class for creating comet materials.
 * Creates either GLSL (WebGL) or TSL (WebGPU) materials based on renderer backend.
 */
export class CometMaterialFactory {
  /**
   * Creates a nucleus material for the specified renderer backend
   */
  createNucleusMaterial(
    rendererBackend: RendererBackend,
    options: {
      colors: THREE.Color[];
      heights: number[];
      noiseScale?: number;
      blendSharpness?: number;
      craterScale?: number;
      craterStrength?: number;
      simplePeriod?: number;
      undulation?: number;
      ambientStrength?: number;
      metallicFactor?: number;
      roughness?: number;
      specularColor?: THREE.Color;
    },
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new CometNucleusNodeMaterial({
        colors: options.colors,
        roughness: options.roughness,
        metalness: options.metallicFactor,
      });
    } else {
      return new CometNucleusMaterial(options);
    }
  }

  /**
   * Creates a coma material for the specified renderer backend
   */
  createComaMaterial(
    rendererBackend: RendererBackend,
    options: { color: THREE.Color; opacity: number },
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new CometComaNodeMaterial(options);
    } else {
      return new CometComaMaterial(options);
    }
  }

  /**
   * Creates a particle material for the specified renderer backend
   */
  createParticleMaterial(
    rendererBackend: RendererBackend,
    options: { color: THREE.Color },
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new CometParticleNodeMaterial(options);
    } else {
      return new CometParticleMaterial(options);
    }
  }

  /**
   * Creates a jet material for the specified renderer backend
   */
  createJetMaterial(
    rendererBackend: RendererBackend,
    options: { color: THREE.Color },
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new CometJetNodeMaterial(options);
    } else {
      return new CometJetMaterial(options);
    }
  }

  /**
   * Creates a simplified tail material for the specified renderer backend
   */
  createSimplifiedTailMaterial(
    rendererBackend: RendererBackend,
    options: { color: THREE.Color; opacity: number },
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      return new CometSimplifiedTailNodeMaterial(options);
    } else {
      return new CometSimplifiedTailMaterial(options);
    }
  }
}
