import * as THREE from "three";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type {
  CelestialMeshOptions,
  LODLevel,
  LightSourceData,
} from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

// Shader imports
import PROTOSTAR_DISK_VERTEX_SHADER from "../../../shaders/star/pre-main-sequence/protostar/protostar-disk.vertex.glsl";
import PROTOSTAR_DISK_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/protostar/protostar-disk.fragment.glsl";
// Jet shaders are kept if createBipolarJets is still used and needs them
import PROTOSTAR_JET_VERTEX_SHADER from "../../../shaders/star/pre-main-sequence/protostar/protostar-jet-vertex.glsl";
import PROTOSTAR_JET_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/protostar/protostar-jet-fragment.glsl";

/**
 * Renderer for Protostars - very young stars still gathering mass.
 */
export class ProtostarRenderer extends PreMainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): PreMainSequenceStarMaterial {
    // Ensure return type is PreMainSequenceStarMaterial
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.1,
      pulseSpeed: 0.1,
      glowIntensity: 0.8,
      temperatureVariation: 0.7,
      metallicEffect: 0.01,
      noiseEvolutionSpeed: 0.2,
      // timeOffset will be handled by propsTimeOffset or randomized if not in classDefaults
    };

    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults,
      ...(propsUniforms || {}),
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0,
    };
    // Pass the correct PreMainSequenceStarMaterial shaders if they are different from its defaults
    return new PreMainSequenceStarMaterial(
      color,
      finalMaterialOptions /*, vertexShader, fragmentShader if needed */,
    );
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ProtostarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xffa07a); // Default protostar color (Light Salmon - very reddish)
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.1;
    const diskInnerRadius = starRadius * 1.5;
    const diskOuterRadius = starRadius * 10;

    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      64,
      6,
      0,
      Math.PI * 2,
    );
    diskGeometry.rotateX(-Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        diskColor: { value: new THREE.Color(0x8b4513) },
      },
      vertexShader: PROTOSTAR_DISK_VERTEX_SHADER,
      fragmentShader: PROTOSTAR_DISK_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-accretion-disk`,
      diskMaterial,
    );
    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-accretion-disk`;

    // Optionally add jets if logic is retained
    const jets = this.createBipolarJets(object, starRadius, diskOuterRadius);
    if (jets) {
      const effectsGroup = new THREE.Group();
      effectsGroup.add(diskMesh);
      effectsGroup.add(jets);
      return effectsGroup;
    }
    return diskMesh;
  }

  // Simplified createBipolarJets, ensure materials are basic or updated if complex
  protected createBipolarJets(
    object: RenderableCelestialObject,
    starRadius: number,
    diskOuterRadius: number,
  ): THREE.Group | null {
    const jetLength = diskOuterRadius * 3;
    const jetRadius = starRadius * 0.5;

    const jetGeometry = new THREE.CylinderGeometry(
      jetRadius,
      jetRadius * 0.3,
      jetLength,
      16,
      1,
      true,
    );
    const jetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        jetColor: { value: new THREE.Color(0xadd8e6) }, // Light blue for jets
      },
      vertexShader: PROTOSTAR_JET_VERTEX_SHADER,
      fragmentShader: PROTOSTAR_JET_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.effectMaterials.set(`${object.celestialObjectId}-jets`, jetMaterial);

    const jetGroup = new THREE.Group();
    const topJet = new THREE.Mesh(jetGeometry, jetMaterial);
    topJet.position.y = jetLength / 2 + diskOuterRadius * 0.1; // Position above disk
    topJet.name = "top-jet";

    const bottomJet = new THREE.Mesh(jetGeometry, jetMaterial.clone()); // Clone material for separate animation/uniforms if needed
    bottomJet.position.y = -(jetLength / 2 + diskOuterRadius * 0.1); // Position below disk
    bottomJet.rotation.x = Math.PI; // Rotate to point downwards
    bottomJet.name = "bottom-jet";

    jetGroup.add(topJet);
    jetGroup.add(bottomJet);
    jetGroup.name = `${object.celestialObjectId}-bipolar-jets`;
    return jetGroup;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 5000 * scale;
  }

  // Removed 'override' as getCustomLODs is abstract in BaseStarRenderer and implemented here.
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // High detail: star body + corona + effects (disk/jets)
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 64,
    });
    // getEffectLayer adds disk/jets to this group, called by _createHighDetailGroup via PreMainSequenceStarRenderer
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail: star body + corona only (effects are too detailed for medium distance)
    // Use super._createHighDetailGroup directly from BaseStarRenderer to get only star + corona
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 32,
      includeEffects: false, // Explicitly disable effects for this LOD if BaseStarRenderer respects it
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 800 * scale,
    };

    // Low detail will be the billboard automatically added by BaseStarRenderer
    return [level0, level1];
  }

  // _createDiskBillboardTexture and _createBillboardLODLevel removed as BaseStarRenderer handles billboards.
  // If a custom disk billboard is truly needed, getCustomLODs should return it as a far LODLevel.

  // Update method for effects (disk, jets)
  override update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera); // Handles star body and corona
    // this.elapsedTime is updated by super.update()

    this.effectMaterials.forEach((materialOrMaterials) => {
      const materials = Array.isArray(materialOrMaterials)
        ? materialOrMaterials
        : [materialOrMaterials];
      materials.forEach((material: any) => {
        if (material && material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = this.elapsedTime;
        } else if (material && typeof material.update === "function") {
          // Some simple materials might just have update()
          material.update(this.elapsedTime);
        }
      });
    });
  }
}
