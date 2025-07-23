import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { NeutronStarSubtype } from "@teskooano/data-types";
import { GravitationalLensingHelper } from "@teskooano/celestials-stars";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for neutron stars with subtype-specific properties
 */
class NeutronStarMaterial extends BaseStarMaterial {
  private subtype: NeutronStarSubtype;
  private pulsePhase: number = 0;

  constructor(subtype: NeutronStarSubtype = NeutronStarSubtype.STANDARD) {
    const baseColor = new THREE.Color(0xffffff);

    // Subtype-specific properties
    let pulseSpeed = 0.0;
    let glowIntensity = 0.1;
    let metallicEffect = 0.1;

    switch (subtype) {
      case NeutronStarSubtype.PULSAR:
        pulseSpeed = 2.0; // Fast pulsing for pulsars
        glowIntensity = 0.3; // Brighter glow
        metallicEffect = 0.2;
        break;
      case NeutronStarSubtype.MAGNETAR:
        pulseSpeed = 0.5; // Slower, more irregular pulsing
        glowIntensity = 0.5; // Very bright glow
        metallicEffect = 0.3; // Strong metallic effect
        break;
      case NeutronStarSubtype.STANDARD:
      default:
        pulseSpeed = 0.0; // No pulsing for standard neutron stars
        glowIntensity = 0.1;
        metallicEffect = 0.1;
        break;
    }

    super(baseColor, {
      coronaIntensity: 0.0,
      pulseSpeed,
      glowIntensity,
      temperatureVariation: 0.0,
      metallicEffect,
    });

    this.subtype = subtype;
  }

  update(time: number, timeScale: number): void {
    super.update(time, timeScale);

    // Update pulse phase for pulsars and magnetars
    if (
      this.subtype === NeutronStarSubtype.PULSAR ||
      this.subtype === NeutronStarSubtype.MAGNETAR
    ) {
      this.pulsePhase = (time * 0.001) % (2 * Math.PI);

      // Vary glow intensity based on pulse phase
      const pulseIntensity = 0.5 + 0.5 * Math.sin(this.pulsePhase);
      this.uniforms.glowIntensity.value = pulseIntensity;
    }
  }
}

/**
 * Renderer for neutron stars.
 *
 * A neutron star is not a "luminous" star in the traditional sense,
 * so it provides its own LOD implementation without a corona.
 * It uses a gravitational lensing effect.
 */
export class NeutronStarRenderer extends BaseStarRenderer<NeutronStarMaterial> {
  protected gravitationalLensingHelper: GravitationalLensingHelper | undefined;
  private material: NeutronStarMaterial;
  private subtype: NeutronStarSubtype;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions & {
      subtype?: NeutronStarSubtype;
    } = {},
  ) {
    super(object, options);
    this.subtype = options?.subtype ?? NeutronStarSubtype.STANDARD;
    this.material = new NeutronStarMaterial(this.subtype);
    this.registerMaterial("neutron-star-material", this.material);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): NeutronStarMaterial {
    return this.material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const segments = GeometryUtilities.getOptimizedStarSegments(
      options?.detailLevel,
      64,
    );
    const highDetailGeometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const highDetailMesh = new THREE.Mesh(highDetailGeometry, this.material);
    highDetailMesh.name = `${object.celestialObjectId}-high-lod`;
    return [{ object: highDetailMesh, distance: 0 }];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 2000;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    // this.gravitationalLensingHelper?.update(this camera);
  }

  dispose(): void {
    super.dispose();
    this.gravitationalLensingHelper?.dispose();
  }
}
