import * as THREE from "three";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";

// Import shaders for Herbig Ae/Be accretion disk
import HERBIG_DISK_VERTEX_SHADER from "../../../shaders/star/pre-main-sequence/herbig-disk.vertex.glsl";
import HERBIG_DISK_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/herbig-disk.fragment.glsl";

/**
 * Material for the main body of Herbig Ae/Be stars.
 */
export class HerbigAeBeMaterial extends PreMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xaaccff)) {
    super({
      starColor: color, // Bluish-white, hotter than T-Tauri
      coronaIntensity: 0.4,
      pulseSpeed: 0.3,
      glowIntensity: 0.9, // Brighter
      temperatureVariation: 0.4,
      metallicEffect: 0.0,
    });
  }
}

/**
 * Renderer for Herbig Ae/Be stars - intermediate mass pre-main-sequence stars.
 */
export class HerbigAeBeRenderer extends PreMainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): PreMainSequenceStarMaterial {
    const color = this.getStarColor(object);
    return new HerbigAeBeMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xaaccff); // Bluish-white
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.15;
    const diskInnerRadius = starRadius * 2.0;
    const diskOuterRadius = starRadius * 15; // Can have substantial disks

    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      80,
      10,
    );
    diskGeometry.rotateX(-Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        diskColor: { value: new THREE.Color(0xeeeeff) }, // Lighter, icier disk color
        diskOpacity: { value: 0.35 },
      },
      vertexShader: HERBIG_DISK_VERTEX_SHADER,
      fragmentShader: HERBIG_DISK_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: true, // Disk may have some opacity
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-circumstellar-disk`,
      diskMaterial,
    );

    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-circumstellar-disk`;
    return diskMesh;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 10000 * scale;
  }

  protected _createDiskBillboardTexture(
    diskColor: THREE.Color,
  ): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");

    if (context) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const outerRadius = canvas.width / 2.5; // Slightly smaller than protostar for a potentially thinner disk impression
      const innerRadius = outerRadius * 0.5; // Larger inner hole

      const fillStyle = `rgba(${Math.round(diskColor.r * 255)}, ${Math.round(diskColor.g * 255)}, ${Math.round(diskColor.b * 255)}, 0.6)`; // Slightly less opaque for Herbig disk
      context.fillStyle = fillStyle;

      context.beginPath();
      context.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      context.fill();

      context.globalCompositeOperation = "destination-out";
      context.beginPath();
      context.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      context.fill();

      context.globalCompositeOperation = "source-over";
    }
    return new THREE.CanvasTexture(canvas);
  }

  protected override _createBillboardLODLevel(
    object: RenderableCelestialObject,
    sprite: THREE.Sprite,
    pointLight: THREE.PointLight,
    billboardDistance: number,
  ): LODLevel {
    const billboardGroup = super._createBillboardLODLevel(
      object,
      sprite,
      pointLight,
      billboardDistance,
    ).object as THREE.Group;

    let actualDiskColor = new THREE.Color(0xeeeeff); // Default Herbig disk color
    const diskEffectMaterial = this.effectMaterials.get(
      `${object.celestialObjectId}-circumstellar-disk`,
    ) as THREE.ShaderMaterial | undefined;

    if (
      diskEffectMaterial &&
      diskEffectMaterial.uniforms &&
      diskEffectMaterial.uniforms.diskColor
    ) {
      actualDiskColor = diskEffectMaterial.uniforms.diskColor
        .value as THREE.Color;
    }

    const diskTexture = this._createDiskBillboardTexture(actualDiskColor);
    const diskPlaneMaterial = new THREE.MeshBasicMaterial({
      map: diskTexture,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: true,
      // opacity: 0.6, // Opacity handled by texture
    });

    const diskWorldDiameter = (object.radius || 0.15) * 30; // Herbig disks can be large (2 * outerRadius of disk)
    const diskPlaneGeometry = new THREE.PlaneGeometry(
      diskWorldDiameter,
      diskWorldDiameter,
    );
    const diskPlaneMesh = new THREE.Mesh(diskPlaneGeometry, diskPlaneMaterial);
    diskPlaneMesh.name = `${object.celestialObjectId}-disk-plane-lod`;
    diskPlaneMesh.rotation.x = -Math.PI / 2;

    const starSpriteInGroup = billboardGroup.getObjectByName(
      `${object.celestialObjectId}-distant-sprite`,
    );
    const lightInGroup = billboardGroup.getObjectByName(
      `${object.celestialObjectId}-low-lod-light`,
    );

    billboardGroup.remove(...billboardGroup.children);
    billboardGroup.add(diskPlaneMesh);
    if (starSpriteInGroup) billboardGroup.add(starSpriteInGroup);
    if (lightInGroup) billboardGroup.add(lightInGroup);

    return {
      object: billboardGroup,
      distance: billboardDistance,
    };
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 48,
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1200 * scale,
    };

    return [level0, level1];
  }

  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);

    this.effectMaterials.forEach((material: any) => {
      if (material.uniforms?.time) {
        material.uniforms.time.value = this.elapsedTime;
      }
    });
  }
}
