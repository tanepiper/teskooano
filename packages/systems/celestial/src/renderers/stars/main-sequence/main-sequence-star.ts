import type { StarProperties } from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions, LODLevel } from "../../common/types";
import { BaseStarRenderer } from "../base/base-star";

// Import main sequence specific shaders
import mainSequenceCoronaFragmentShader from "../../../shaders/star/main-sequence/corona.glsl";
import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";
import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";

import { celestialObjects$ } from "@teskooano/core-state";
import { Subscription } from "rxjs";
import { filter, map, tap } from "rxjs/operators";

// Define a specific type for BaseStar Uniforms from StarProperties for clarity
export type BaseStarUniformArgs =
  StarProperties["shaderUniforms"] extends infer SU
    ? SU extends { baseStar?: infer BS }
      ? BS
      : never
    : never;

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    uniformOverrides?: Partial<BaseStarUniformArgs> & { timeOffset?: number },
  ) {
    super({
      uniforms: {
        time: { value: 0 },
        starColor: { value: color },
        coronaIntensity: { value: uniformOverrides?.coronaIntensity ?? 0.3 },
        pulseSpeed: { value: uniformOverrides?.pulseSpeed ?? 0.5 },
        glowIntensity: { value: uniformOverrides?.glowIntensity ?? 0.4 },
        temperatureVariation: {
          value: uniformOverrides?.temperatureVariation ?? 0.1,
        },
        metallicEffect: { value: uniformOverrides?.metallicEffect ?? 0.6 },
        noiseEvolutionSpeed: {
          value: uniformOverrides?.noiseEvolutionSpeed ?? 0.05,
        },
        timeOffset: {
          value: uniformOverrides?.timeOffset ?? Math.random() * 1000.0,
        },
      },
      vertexShader: mainSequenceVertexShader,
      fragmentShader: mainSequenceFragmentShader,
      transparent: true,
      side: THREE.FrontSide,
    });
  }

  /**
   * Update the material with the current time (optional, can be handled by renderer if preferred)
   */
  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }

  /**
   * Updates the material's uniforms based on new star properties.
   */
  public updateUniforms(properties: StarProperties): void {
 
    let changesMade = false;

    // The primary star color is directly on StarProperties
    const newColorHex = properties.color;
    if (newColorHex && this.uniforms.starColor) {
      // Ensure newColorHex has a '#' prefix for comparison if getHexString() doesn't include it
      const currentColorHex = this.uniforms.starColor.value.getHexString();
      if (currentColorHex !== newColorHex.replace("#", "")) {

        this.uniforms.starColor.value.set(newColorHex);
        changesMade = true;
      }
    }

    const baseStarUniforms = properties.shaderUniforms?.baseStar;
    if (baseStarUniforms) {
      if (
        baseStarUniforms.coronaIntensity !== undefined &&
        this.uniforms.coronaIntensity
      ) {
        if (
          this.uniforms.coronaIntensity.value !==
          baseStarUniforms.coronaIntensity
        ) {

          this.uniforms.coronaIntensity.value =
            baseStarUniforms.coronaIntensity;
          changesMade = true;
        }
      }
      if (
        baseStarUniforms.pulseSpeed !== undefined &&
        this.uniforms.pulseSpeed
      ) {
        if (this.uniforms.pulseSpeed.value !== baseStarUniforms.pulseSpeed) {

          this.uniforms.pulseSpeed.value = baseStarUniforms.pulseSpeed;
          changesMade = true;
        }
      }
      if (
        baseStarUniforms.glowIntensity !== undefined &&
        this.uniforms.glowIntensity
      ) {
        if (
          this.uniforms.glowIntensity.value !== baseStarUniforms.glowIntensity
        ) {

          this.uniforms.glowIntensity.value = baseStarUniforms.glowIntensity;
          changesMade = true;
        }
      }
      if (
        baseStarUniforms.temperatureVariation !== undefined &&
        this.uniforms.temperatureVariation
      ) {
        if (
          this.uniforms.temperatureVariation.value !==
          baseStarUniforms.temperatureVariation
        ) {

          this.uniforms.temperatureVariation.value =
            baseStarUniforms.temperatureVariation;
          changesMade = true;
        }
      }
      if (
        baseStarUniforms.metallicEffect !== undefined &&
        this.uniforms.metallicEffect
      ) {
        if (
          this.uniforms.metallicEffect.value !== baseStarUniforms.metallicEffect
        ) {
    
          this.uniforms.metallicEffect.value = baseStarUniforms.metallicEffect;
          changesMade = true;
        }
      }
      if (
        baseStarUniforms.noiseEvolutionSpeed !== undefined &&
        this.uniforms.noiseEvolutionSpeed
      ) {
        if (
          this.uniforms.noiseEvolutionSpeed.value !==
          baseStarUniforms.noiseEvolutionSpeed
        ) {

          this.uniforms.noiseEvolutionSpeed.value =
            baseStarUniforms.noiseEvolutionSpeed;
          changesMade = true;
        }
      }
    }
    // timeOffset is a root property of StarProperties
    if (properties.timeOffset !== undefined && this.uniforms.timeOffset) {
      if (this.uniforms.timeOffset.value !== properties.timeOffset) {
 
        this.uniforms.timeOffset.value = properties.timeOffset;
        changesMade = true;
      }
    }

    if (changesMade) {
      this.needsUpdate = true;

    } 
  }
}

/**
 * Main sequence star renderer
 */
export class MainSequenceStarRenderer extends BaseStarRenderer {
  private propertiesSubscription?: Subscription;
  private currentStarId?: string;

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & {
      enableLOD?: boolean;
      isBillboard?: boolean;
      disableAutomaticRotation?: boolean;
      enableCorona?: boolean;
    },
  ) {
    super(object, options);
    this.currentStarId = object.celestialObjectId;
    // Attempt to subscribe if material is already created by base class constructor
    const initialMaterial = this.starBodyMaterials.get(this.currentStarId);
    if (initialMaterial && !this.propertiesSubscription) {
      this.subscribeToStarProperties(this.currentStarId);
    }
  }

  private subscribeToStarProperties(starId: string) {
    this.unsubscribeFromStarProperties();


    this.propertiesSubscription = celestialObjects$
      .pipe(
        filter((allObjects) => !!allObjects[starId]),
        map((allObjects) => allObjects[starId]),
        filter((starData) => !!starData && !!starData.properties),
        map((starData) => starData.properties as StarProperties),
        tap((properties) => {

          const material = this.starBodyMaterials.get(
            starId,
          ) as MainSequenceStarMaterial;
          if (material && typeof material.updateUniforms === "function") {

            material.updateUniforms(properties);
          }

          const coronaMaterials = this.coronaMaterials.get(starId);
          if (coronaMaterials && properties.shaderUniforms?.corona) {

            coronaMaterials.forEach((coronaMat) => {
              if (typeof coronaMat.updateUniforms === "function") {
                // Pass only the corona part of shaderUniforms
                coronaMat.updateUniforms(
                  properties.shaderUniforms?.corona,
                  properties.timeOffset,
                );
              }
            });
          }
        }),
      )
      .subscribe({
        error: (err) =>
          console.error(
            `[MainSequenceStarRenderer ${starId}] Error in properties subscription:`,
            err,
          ),
      });


  }

  private unsubscribeFromStarProperties() {
    if (this.propertiesSubscription) {
      this.propertiesSubscription.unsubscribe();
      this.propertiesSubscription = undefined;
    }
  }

  public dispose(): void {

    this.unsubscribeFromStarProperties();
    super.dispose();
  }

  /**
   * Returns the appropriate material for a main sequence star
   */
  protected getMaterial(star: RenderableCelestialObject): THREE.ShaderMaterial {

    const starColor = this.getStarColor(star);
    const properties = star.properties as StarProperties;

    const materialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...(properties.shaderUniforms?.baseStar || {}),
      timeOffset: properties.timeOffset,
    };

    const material = new MainSequenceStarMaterial(starColor, materialOptions);

    // Ensure subscription is set up when material is created, if not already
    if (
      this.currentStarId === star.celestialObjectId &&
      !this.propertiesSubscription
    ) {
      this.subscribeToStarProperties(star.celestialObjectId);
    }

    return material;
  }

  /**
   * Get the star color based on its properties
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;

    const colorString = properties?.color;

    if (colorString) {
      try {
        return new THREE.Color(colorString);
      } catch (error) {
        console.warn(
          `[MainSequenceStarRenderer] Invalid color string provided: ${colorString}. Falling back to default. Error:`,
          error,
        );
      }
    }
    if (properties?.spectralClass) {
      switch (properties.spectralClass.toUpperCase()[0]) {
        case "O":
          return new THREE.Color(0x9bb0ff);
        case "B":
          return new THREE.Color(0xaabfff);
        case "A":
          return new THREE.Color(0xf8f7ff);
        case "F":
          return new THREE.Color(0xfff4ea);
        case "G":
          return new THREE.Color(0xffdd88);
        case "K":
          return new THREE.Color(0xffaa55);
        case "M":
          return new THREE.Color(0xff6644);
      }
    }
    return new THREE.Color(0xffdd88);
  }

  /**
   * Provides default custom LOD levels for main sequence stars.
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: options?.segments ?? 128,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumSegments =
      options?.detailLevel === "medium"
        ? 64
        : options?.segments && options.segments > 32
          ? options.segments / 2
          : 64;
    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: mediumSegments,
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 200 * scale,
    };

    const lowSegments =
      options?.detailLevel === "low"
        ? 32
        : mediumSegments > 16
          ? mediumSegments / 2
          : 32;
    const lowDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: lowSegments,
    });
    lowDetailGroup.name = `${object.celestialObjectId}-low-lod`;
    const level2: LODLevel = {
      object: lowDetailGroup,
      distance: 800 * scale,
    };

    return [level0, level1, level2];
  }

  /**
   * Provides a default billboard LOD distance for main sequence stars.
   */
  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 2000 * scale;
  }

  /**
   * Provides the vertex shader for the corona effect for main sequence stars.
   */
  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    return mainSequenceVertexShader;
  }

  /**
   * Provides the fragment shader for the corona effect for main sequence stars.
   */
  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return mainSequenceCoronaFragmentShader;
  }
}
