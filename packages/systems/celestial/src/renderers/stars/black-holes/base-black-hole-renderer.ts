import * as THREE from "three";
import { BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";
import { GravitationalLensingMaterial } from "../../effects/gravitational-lensing";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";

/**
 * Material for the event horizon of a black hole - essentially pure black.
 */
export class EventHorizonMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        horizonColor: { value: new THREE.Color(0x000000) },
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 horizonColor;
        void main() {
          gl_FragColor = vec4(horizonColor, 1.0);
        }
      `,
      side: THREE.FrontSide,
    });
  }
}

/**
 * Abstract base class for rendering black holes.
 * Handles common features like the event horizon and gravitational lensing.
 */
export abstract class BaseBlackHoleRenderer extends BaseStarRenderer {
  protected eventHorizonMaterial: EventHorizonMaterial;
  private lensingRenderTarget: THREE.WebGLRenderTarget | null = null;
  private lensingMaterialInstance: GravitationalLensingMaterial | null = null;
  private lensingMesh: THREE.Mesh | null = null;

  // Store scene and renderer for lensing, passed via update method
  private _lensingScene?: THREE.Scene;
  private _lensingRenderer?: THREE.WebGLRenderer;
  private _lensingCamera?: THREE.PerspectiveCamera;

  private _currentRenderableObject: RenderableCelestialObject | null = null;

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
    this.eventHorizonMaterial = new EventHorizonMaterial();
    this._currentRenderableObject = object;
  }

  /**
   * Creates the central black sphere representing the event horizon.
   */
  protected createEventHorizonMesh(
    object: RenderableCelestialObject,
  ): THREE.Mesh {
    const eventHorizonRadius =
      object.radius || 0.1 * (typeof SCALE === "number" ? SCALE : 1);
    const geometry = new THREE.SphereGeometry(eventHorizonRadius, 64, 64);
    const mesh = new THREE.Mesh(geometry, this.eventHorizonMaterial);
    mesh.name = `${object.celestialObjectId}-event-horizon`;
    return mesh;
  }

  /**
   * Creates the gravitational lensing effect mesh and material.
   * The object parameter is the RenderableCelestialObject.
   */
  protected createLensingEffectMesh(
    object: RenderableCelestialObject,
  ): THREE.Mesh | null {
    if (!this._lensingRenderer) return null;

    const eventHorizonRadius =
      object.radius || 0.1 * (typeof SCALE === "number" ? SCALE : 1);
    const lensingSphereRadius = eventHorizonRadius * 2.5; // Slightly increased for better visual effect

    this.lensingMaterialInstance = new GravitationalLensingMaterial({
      intensity: 1.5,
      radius: lensingSphereRadius,
      distortionScale: 0.03, // Adjusted distortion scale
    });

    const { width, height } = this._lensingRenderer.getSize(
      new THREE.Vector2(),
    );
    if (
      this.lensingRenderTarget &&
      (this.lensingRenderTarget.width !== width ||
        this.lensingRenderTarget.height !== height)
    ) {
      this.lensingRenderTarget.dispose();
      this.lensingRenderTarget = null;
    }
    if (!this.lensingRenderTarget) {
      this.lensingRenderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
    }
    this.lensingMaterialInstance.uniforms.resolution.value.set(width, height);

    const lensingGeometry = new THREE.SphereGeometry(
      lensingSphereRadius,
      48,
      48,
    ); // Reduced segments for lensing sphere
    const lensingMesh = new THREE.Mesh(
      lensingGeometry,
      this.lensingMaterialInstance,
    );
    lensingMesh.name = `${object.celestialObjectId}-lensing-effect`;
    lensingMesh.renderOrder = 1; // Render after most opaque objects

    // Store in the materials map from BaseStarRenderer so time uniform is updated
    this.materials.set(lensingMesh.name, this.lensingMaterialInstance);
    this.lensingMesh = lensingMesh;
    return lensingMesh;
  }

  /**
   * Overridden to add black hole specific elements.
   */
  protected override _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    // Call super._createHighDetailGroup to get the star body (which we'll make black)
    // and basic corona setup (which we might not use or will modify)
    // For a black hole, the "star body" IS the event horizon.
    // BaseStarRenderer._createHighDetailGroup adds a sphere with this.getMaterial().
    // We'll ensure getMaterial() returns the EventHorizonMaterial.
    const group = new THREE.Group(); // Start fresh for black hole structure
    group.name = `${object.celestialObjectId}-black-hole-high-detail`;
    this._currentRenderableObject = object; // Store for update method if needed for lensing mesh creation

    const eventHorizonMesh = this.createEventHorizonMesh(object);
    group.add(eventHorizonMesh);

    // Subclasses will add accretion disks, jets, etc.
    const effectsGroup = this.getBlackHoleEffectsGroup(object, group, options);
    if (effectsGroup) {
      group.add(effectsGroup);
    }

    // Lensing mesh is added during the update phase when renderer is available
    // or if it needs to be parented differently.
    // For now, create it here if renderer is already known (e.g. if update was called once)
    if (this._lensingRenderer) {
      const lensingMeshInstance = this.createLensingEffectMesh(object);
      if (lensingMeshInstance) {
        group.add(lensingMeshInstance);
      }
    }
    return group;
  }

  /**
   * Abstract method for subclasses to add specific black hole effects
   * like accretion disks, ergospheres, or jets.
   */
  protected abstract getBlackHoleEffectsGroup(
    object: RenderableCelestialObject,
    mainGroup: THREE.Group,
    options?: CelestialMeshOptions,
  ): THREE.Group | null;

  /**
   * The primary material for a black hole is its event horizon.
   */
  protected override getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    return this.eventHorizonMaterial;
  }

  /**
   * Black holes are black. This color is used for the billboard too.
   */
  protected override getStarColor(
    object: RenderableCelestialObject,
  ): THREE.Color {
    return new THREE.Color(0x000000); // Black
  }

  /**
   * Provide dummy/empty corona shaders as black holes don't have a star-like corona.
   * These are required by BaseStarRenderer.
   */
  protected override getCoronaVertexShader(
    object: RenderableCelestialObject,
  ): string {
    return `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  protected override getCoronaFragmentShader(
    object: RenderableCelestialObject,
  ): string {
    return `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent
      }
    `;
  }

  /**
   * Black hole update requires scene and renderer for lensing.
   */
  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.PerspectiveCamera,
    // Additional parameters for black hole lensing, not part of BaseStarRenderer.update signature
    scene?: THREE.Scene,
    renderer?: THREE.WebGLRenderer,
  ): void {
    super.update(time, lightSources, camera); // Call base with its expected signature

    this._lensingScene = scene;
    this._lensingRenderer = renderer;
    this._lensingCamera = camera;

    // Ensure _currentRenderableObject is set if an update happens before getLODLevels
    if (!this._currentRenderableObject && scene) {
      // Attempt to find the object in the scene if we know its ID.
      // This is a fallback, ideally _createHighDetailGroup sets it.
      // For now, we'll assume it's set or lensing mesh creation relies on object passed to update.
    }
    const renderableObjectForLensing = this._currentRenderableObject; // The object being rendered by this instance

    if (!this.lensingMesh && renderer && renderableObjectForLensing) {
      const lensingMeshInstance = this.createLensingEffectMesh(
        renderableObjectForLensing,
      );
      if (lensingMeshInstance) {
        // Find the high-detail group in the scene to add the lensing mesh.
        // This is tricky as LODs are managed externally.
        // For now, assume the main object group can host the lensing mesh.
        // Or, it's added by _createHighDetailGroup if renderer was present.
        // Let's ensure _createHighDetailGroup handles adding it if possible.
        // If lensingMesh was created by createLensingEffectMesh, it's already in this.materials
        // and this.lensingMesh is set. We just need to ensure it's in the scene graph.
        // This part might need refinement based on how THREE.LOD is used with these renderers.
        // A simple solution: if the lensing mesh is created, assume it's added to the correct group by _createHighDetailGroup.
      }
    }

    if (
      this.lensingMaterialInstance &&
      this.lensingRenderTarget &&
      this._lensingScene &&
      this._lensingCamera &&
      this._lensingRenderer &&
      this.lensingMesh
    ) {
      // Check if the lensing mesh or its parent is visible.
      // This is a simplified check. A more robust check would involve querying the LOD parent.
      let isLensingPotentiallyVisible = false;
      if (this.lensingMesh.parent) {
        isLensingPotentiallyVisible =
          this.lensingMesh.parent.visible && this.lensingMesh.visible;
      } else {
        // If no parent, it might be directly in the scene, check its visibility.
        // This case should ideally not happen if structured correctly with LODs.
        isLensingPotentiallyVisible = this.lensingMesh.visible;
      }

      if (isLensingPotentiallyVisible) {
        this.lensingMesh.visible = false;

        const originalRenderTarget = this._lensingRenderer.getRenderTarget();
        const originalClearAlpha = this._lensingRenderer.getClearAlpha();
        // renderer.getClearColor(originalClearColor); // Not needed if just alpha

        this._lensingRenderer.setClearAlpha(0.0); // Ensure background is captured transparently for distortion

        this._lensingRenderer.setRenderTarget(this.lensingRenderTarget);
        // Don't clear color if we want existing scene, only depth might be needed for some effects.
        // For lensing, we render the scene as is.
        this._lensingRenderer.clear(true, true, true); // Clear color, depth, stencil
        this._lensingRenderer.render(this._lensingScene, this._lensingCamera);

        this._lensingRenderer.setRenderTarget(originalRenderTarget);
        this._lensingRenderer.setClearAlpha(originalClearAlpha);
        // renderer.setClearColor(originalClearColor, originalClearAlpha);

        this.lensingMesh.visible = true;

        // Time uniform is updated by super.update() because lensingMaterialInstance is in this.materials
        this.lensingMaterialInstance.uniforms.tBackground.value =
          this.lensingRenderTarget.texture;
        // Resolution is set during creation/resize of render target.
      }
    }
  }

  override dispose(): void {
    super.dispose(); // This will dispose materials in this.materials, including lensingMaterialInstance
    this.eventHorizonMaterial.dispose(); // Dispose separately if not in this.materials
    if (this.lensingRenderTarget) {
      this.lensingRenderTarget.dispose();
      this.lensingRenderTarget = null;
    }
    // lensingMaterialInstance is in this.materials, so super.dispose() handles it.
    this.lensingMaterialInstance = null;
    this.lensingMesh = null;
  }

  /**
   * Sets up gravitational lensing for this black hole.
   * Stores renderer, scene, and camera for use in the update loop for rendering the background scene.
   * Ensures the lensing mesh is created and added to the provided mesh group.
   */
  override addGravitationalLensing(
    objectData: RenderableCelestialObject, // This is this.object, effectively
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    meshGroup: THREE.Object3D, // The LOD group this black hole renderer manages
  ): void {
    this._lensingScene = scene;
    this._lensingRenderer = renderer;
    this._lensingCamera = camera;
    this._currentRenderableObject = objectData; // Ensure this is set for lensing

    // Ensure the lensing mesh is created and part of the scene graph.
    // createLensingEffectMesh adds the material to this.materials and sets this.lensingMesh.
    // It needs to be added to the correct group (high-detail LOD level).
    if (!this.lensingMesh) {
      // Try to find the high-detail group within the provided meshGroup (which is likely the THREE.LOD itself)
      // This assumes the high-detail group is a direct child and named consistently.
      // A more robust approach might involve direct access to the LOD levels if the renderer manages them.
      let highDetailGroup = meshGroup.getObjectByName(
        `${objectData.celestialObjectId}-black-hole-high-detail`,
      );
      if (!highDetailGroup && meshGroup instanceof THREE.Group) {
        // If meshGroup is already the high-detail group (e.g. if LOD is handled externally)
        highDetailGroup = meshGroup;
      } else if (!highDetailGroup) {
        console.warn(
          `[BaseBlackHoleRenderer] Could not find high-detail group in`,
          meshGroup,
          `to add lensing mesh for ${objectData.celestialObjectId}. Lensing may not appear.`,
        );
        // As a fallback, if we can't find the specific group, try adding to the top-level meshGroup passed.
        // This might not be correct if meshGroup is the THREE.LOD object itself.
        // highDetailGroup = meshGroup;
      }

      if (highDetailGroup) {
        const lensingMeshInstance = this.createLensingEffectMesh(objectData);
        if (lensingMeshInstance && !lensingMeshInstance.parent) {
          // Add only if not already parented
          highDetailGroup.add(lensingMeshInstance);
        }
      } else {
        // Fallback: if no specific group, create and store, but it might not be added to scene correctly.
        // This indicates a potential issue with how lensing mesh is integrated into LOD system.
        this.createLensingEffectMesh(objectData);
        console.warn(
          `[BaseBlackHoleRenderer] Lensing mesh for ${objectData.celestialObjectId} created but not added to a high-detail group.`,
        );
      }
    } else if (
      this.lensingMesh.parent !== meshGroup &&
      !meshGroup.getObjectByProperty("uuid", this.lensingMesh.uuid)
    ) {
      // If lensing mesh exists but is not part of the current active mesh group (e.g. after LOD switch)
      // This logic is complex due to LOD. For now, assume createHighDetailGroup handles adding it.
      // console.log("[BaseBlackHoleRenderer] Lensing mesh exists, ensuring it's in the right group.");
    }
  }
}
