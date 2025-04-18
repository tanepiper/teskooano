import {
  celestialObjectsStore,
  renderableObjectsStore,
} from "@teskooano/core-state";
import type { GasGiantProperties, CelestialObject } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "../index";
import { SCALE } from "@teskooano/data-types";

// Import the gas giant shaders
import basicFragmentShader from "../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../shaders/gas-giants/basic.vertex.glsl";

/**
 * Base material for gas giants
 */
export abstract class BaseGasGiantMaterial extends THREE.ShaderMaterial {
  // Add a method specifically for LOD updates
  updateLOD(lodLevel: number): void {
    // Default implementation does nothing
    // Child classes (like ClassIMaterial) will override this
  }

  /**
   * Update the material with current time
   */
  update(time: number, lightSourcePosition?: THREE.Vector3): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time; // Update time if uniform exists
    }
    if (this.uniforms.sunPosition && lightSourcePosition) {
      this.uniforms.sunPosition.value = lightSourcePosition; // Update light if uniform exists
    }
  }

  // Release resources
  dispose(): void {
    // No textures to dispose in this material by default
    // Child classes can override if needed
  }
}

/**
 * Basic Gas Giant Material using the simple shaders
 */
export class BasicGasGiantMaterial extends BaseGasGiantMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xffffff)) {
    super({
      uniforms: {
        baseColor: { value: baseColor },
        sunPosition: { value: new THREE.Vector3(1, 1, 1) }, // Default light position
        time: { value: 0 }, // Needed by base class update
      },
      vertexShader: basicVertexShader, // Use the imported basic shader
      fragmentShader: basicFragmentShader, // Use the imported basic shader
    });
  }
}

/**
 * Base renderer for gas giants, implementing the LOD system.
 */
export abstract class BaseGasGiantRenderer implements CelestialRenderer {
  protected materials: Map<string, BaseGasGiantMaterial> = new Map();
  protected objectIds: Set<string> = new Set();
  protected startTime: number = performance.now();
  protected elapsedTime: number = 0;
  protected textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

  /**
   * Child classes must implement this method to return the appropriate material
   * for the highest detail LOD level.
   */
  protected abstract getMaterial(
    object: RenderableCelestialObject
  ): BaseGasGiantMaterial;

  /**
   * Creates and returns an array of LOD levels for the gas giant object.
   */
  getLODLevels(object: RenderableCelestialObject, options?: CelestialMeshOptions): LODLevel[] {
      this.objectIds.add(object.celestialObjectId);
      const scale = typeof SCALE === 'number' ? SCALE : 1;
      const baseRadius = object.radius ?? 10; // Default radius if missing

      // --- Level 0: High Detail --- 
      const highDetailSegments = options?.segments ?? 64;
      const highDetailGeometry = new THREE.SphereGeometry(baseRadius, highDetailSegments, highDetailSegments);
      const highDetailMaterial = this.getMaterial(object); // Get specific material from subclass
      this.materials.set(object.celestialObjectId, highDetailMaterial); // Store for updates
      const highDetailMesh = new THREE.Mesh(highDetailGeometry, highDetailMaterial);
      highDetailMesh.name = `${object.celestialObjectId}-high-lod`;
      const level0Group = new THREE.Group(); // Create Group
      level0Group.add(highDetailMesh);       // Add Mesh to Group
      const level0: LODLevel = { object: level0Group, distance: 0 }; // Assign Group

      // --- Level 1: Medium Detail --- 
      const mediumSegments = 32;
      const mediumGeometry = new THREE.SphereGeometry(baseRadius, mediumSegments, mediumSegments);
      const mediumMaterial = new BasicGasGiantMaterial(this._getBaseGasGiantColor(object)); 
      const mediumMesh = new THREE.Mesh(mediumGeometry, mediumMaterial);
      mediumMesh.name = `${object.celestialObjectId}-medium-lod`;
      const level1Group = new THREE.Group(); // Create Group
      level1Group.add(mediumMesh);       // Add Mesh to Group
      const level1: LODLevel = { object: level1Group, distance: 150 * scale }; // Assign Group

      // --- Level 2: Low Detail --- 
      const lowSegments = 16;
      const lowGeometry = new THREE.SphereGeometry(baseRadius, lowSegments, lowSegments);
      const lowMaterial = new THREE.MeshBasicMaterial({ 
          color: this._getBaseGasGiantColor(object),
          wireframe: false // Solid color sphere might look better than wireframe for gas giants
      });
      const lowMesh = new THREE.Mesh(lowGeometry, lowMaterial);
      lowMesh.name = `${object.celestialObjectId}-low-lod`;
      const level2Group = new THREE.Group(); // Create Group
      level2Group.add(lowMesh);       // Add Mesh to Group
      const level2: LODLevel = { object: level2Group, distance: 800 * scale }; // Assign Group

      return [level0, level1, level2];
  }

  /**
   * Helper to get a representative base color for the gas giant.
   * @internal
   */
  private _getBaseGasGiantColor(object: RenderableCelestialObject): THREE.Color {
      const properties = object.properties as GasGiantProperties | undefined;
      // Use atmosphereColor if available, otherwise fallback
      try {
          if (properties?.atmosphereColor) {
              return new THREE.Color(properties.atmosphereColor);
          }
      } catch (e) {
          console.warn(`[BaseGasGiantRenderer] Invalid atmosphereColor property for ${object.celestialObjectId}:`, properties?.atmosphereColor);
      }
      // Fallback based on class? Or generic default?
      // For now, using a generic default.
      return new THREE.Color(0xccaa88); // Tan/Brownish default
  }

  /**
   * Update the materials stored by this renderer.
   */
  update(
    time: number,
    lightSources?: Map<string, { position: THREE.Vector3; color: THREE.Color; intensity?: number }>,
    camera?: THREE.Camera
  ): void {
    this.elapsedTime = (performance.now() - this.startTime) / 1000;
    const t = time ?? this.elapsedTime;

    const currentRenderableObjects = renderableObjectsStore.get();

    this.objectIds.forEach((objectId) => {
      const material = this.materials.get(objectId);
      const currentObject = currentRenderableObjects[objectId];
      if (!material || !currentObject) return;

      let lightSourcePosition = new THREE.Vector3(1e11, 0, 0); 
      const lightSourceId = currentObject.primaryLightSourceId;
      let primaryLightData = lightSources?.get(lightSourceId ?? "");
      if (!primaryLightData && lightSources && lightSources.size > 0) {
        primaryLightData = lightSources.values().next().value; 
      }
      if (primaryLightData?.position) {
        lightSourcePosition = primaryLightData.position;
      }

      material.update(t, lightSourcePosition);

      // Removed old material.updateLOD call as LODManager handles mesh switching
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
    this.objectIds.clear();
  }
}
