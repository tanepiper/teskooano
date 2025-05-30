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

// Import shaders for Protostar accretion disk
import PROTOSTAR_DISK_VERTEX_SHADER from "../../../shaders/star/pre-main-sequence/protostar-disk.vertex.glsl";
import PROTOSTAR_DISK_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/protostar-disk.fragment.glsl";

/**
 * Material for the main body of Protostars.
 */
export class ProtostarMaterial extends PreMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff9966)) {
    super({
      starColor: color, // Typically orange-red, embedded in dust
      coronaIntensity: 0.1, // Heavily obscured
      pulseSpeed: 0.1,
      glowIntensity: 0.4, // Dim, obscured by disk
      temperatureVariation: 0.3,
      metallicEffect: 0.0, // Not applicable
    });
  }
}

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
    const color = this.getStarColor(object);
    return new ProtostarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xff9966); // Orange-red, embedded
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.1; // Default if radius is 0
    const diskInnerRadius = starRadius * 1.5;
    const diskOuterRadius = starRadius * 10;

    // Using RingGeometry for a flat disk. For thickness, consider a thin Cylinder or Torus.
    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      64, // Theta segments
      8, // Phi segments (for radial divisions)
      0, // Theta start
      Math.PI * 2, // Theta length
    );
    // Rotate disk to be horizontal (XZ plane)
    diskGeometry.rotateX(-Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        diskColor: { value: new THREE.Color(0x8b4513) }, // Dusty brown/saddlebrown
        // noiseTexture: { value: null } // Could add a texture later
      },
      vertexShader: PROTOSTAR_DISK_VERTEX_SHADER,
      fragmentShader: PROTOSTAR_DISK_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending, // Normal blending for dust
      side: THREE.DoubleSide,
      depthWrite: true, // Disk can obscure parts of itself or other objects
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-accretion-disk`,
      diskMaterial,
    );

    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-accretion-disk`;
    return diskMesh;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 5000 * scale; // Protostars are dim, billboard closer
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 64, // Protostar body itself might not need extreme detail
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail: star body + corona, maybe a very simplified disk or no disk.
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 32,
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 800 * scale,
    };

    return [level0, level1];
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

      const outerRadius = canvas.width / 3;
      const innerRadius = outerRadius * 0.6;

      // Use the provided diskColor, with a fixed alpha for the billboard
      const fillStyle = `rgba(${Math.round(diskColor.r * 255)}, ${Math.round(diskColor.g * 255)}, ${Math.round(diskColor.b * 255)}, 0.7)`;
      context.fillStyle = fillStyle;

      // Draw outer circle
      context.beginPath();
      context.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      context.fill();

      // Punch out the center to make it a circular ring
      context.globalCompositeOperation = "destination-out";
      context.beginPath();
      context.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      context.fill();

      // Reset composite operation
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
    // Get the base billboard group (star sprite + light)
    const billboardGroup = super._createBillboardLODLevel(
      object,
      sprite,
      pointLight,
      billboardDistance,
    ).object as THREE.Group;

    // Determine the disk color for the billboard
    let actualDiskColor = new THREE.Color(0x8b4513); // Default saddle brown
    const diskEffectMaterial = this.effectMaterials.get(
      `${object.celestialObjectId}-accretion-disk`,
    ) as THREE.ShaderMaterial | undefined;

    if (
      diskEffectMaterial &&
      diskEffectMaterial.uniforms &&
      diskEffectMaterial.uniforms.diskColor
    ) {
      actualDiskColor = diskEffectMaterial.uniforms.diskColor
        .value as THREE.Color;
    }

    // Create disk billboard texture and material
    const diskTexture = this._createDiskBillboardTexture(actualDiskColor);

    const diskPlaneMaterial = new THREE.MeshBasicMaterial({
      map: diskTexture,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide, // So it's visible when looking from below/above
      depthWrite: true, // Interacts with depth for correct occlusion
      // opacity: 0.7, // Opacity is handled by the texture's alpha
    });

    const diskWorldDiameter = (object.radius || 0.1) * 20;
    const diskPlaneGeometry = new THREE.PlaneGeometry(
      diskWorldDiameter,
      diskWorldDiameter,
    );
    const diskPlaneMesh = new THREE.Mesh(diskPlaneGeometry, diskPlaneMaterial);
    diskPlaneMesh.name = `${object.celestialObjectId}-disk-plane-lod`;

    // Rotate the plane to be flat (e.g., in the XZ plane if Y is up)
    diskPlaneMesh.rotation.x = -Math.PI / 2;

    // Add disk plane to the group, then re-add star sprite to ensure it's on top
    const starSpriteInGroup = billboardGroup.getObjectByName(
      `${object.celestialObjectId}-distant-sprite`,
    );
    const lightInGroup = billboardGroup.getObjectByName(
      `${object.celestialObjectId}-low-lod-light`,
    );

    billboardGroup.remove(...billboardGroup.children); // Clear existing children

    billboardGroup.add(diskPlaneMesh); // Add disk plane first
    if (starSpriteInGroup) billboardGroup.add(starSpriteInGroup); // Then star sprite
    if (lightInGroup) billboardGroup.add(lightInGroup); // Then light

    return {
      object: billboardGroup,
      distance: billboardDistance,
    };
  }

  /**
   * Update the renderer with the current time
   */
  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);

    // Update dust envelope materials
    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (material.uniforms?.time) {
          material.uniforms.time.value = this.elapsedTime;
        }
      });
    });
  }
}
