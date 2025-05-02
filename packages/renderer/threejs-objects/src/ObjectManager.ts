import { OSVector3 } from "@teskooano/core-math";
import { accelerationVectors$ } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LightManager, LODManager } from "@teskooano/renderer-threejs-effects";
import type { CSS2DManager } from "@teskooano/renderer-threejs-interaction";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import {
  AsteroidFieldRenderer,
  CelestialRenderer,
  ClassIGasGiantRenderer,
  ClassIIGasGiantRenderer,
  ClassIIIGasGiantRenderer,
  ClassIVGasGiantRenderer,
  ClassVGasGiantRenderer,
  RingSystemRenderer,
} from "@teskooano/systems-celestial";
import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import {
  GravitationalLensingHandler,
  MeshFactory,
  RendererUpdater,
} from "./object-manager";

import type { LODLevel } from "@teskooano/systems-celestial";

import type { DestructionEvent } from "@teskooano/core-physics";
import { rendererEvents } from "@teskooano/renderer-threejs-core";

interface LabelVisibilityManager {
  showLabel(layer: CSS2DLayerType, id: string): void;
  hideLabel(layer: CSS2DLayerType, id: string): void;
}

interface ActiveDebris {
  group: THREE.Group;
  velocities: Map<string, THREE.Vector3>;
  rotations: Map<string, { axis: THREE.Vector3; speed: number }>;
  startTime: number;
  lifetime: number;
}

/**
 * Manages the creation, updating, and removal of Three.js meshes representing celestial objects in the scene.
 * It listens to a Nanostore (`renderableObjectsStore`) for changes in celestial object data and synchronizes the
 * Three.js scene accordingly. It also handles LOD (Level of Detail), object-specific renderers,
 * gravitational lensing effects (via `GravitationalLensingHandler`), and potentially other visual aspects
 * like labels (via `CSS2DManager`) and debug visualizations (e.g., acceleration vectors).
 */
export class ObjectManager {
  /** @internal Map storing the actual Three.js Object3D instances, keyed by celestial object ID. */
  private objects: Map<string, THREE.Object3D> = new Map();
  /** @internal The main Three.js scene where objects are added. */
  private scene: THREE.Scene;
  /** @internal The primary camera used for rendering and LOD calculations. */
  private camera: THREE.PerspectiveCamera;
  /** @internal The main WebGL renderer instance, potentially used by specialized renderers (e.g., lensing). */
  private renderer: THREE.WebGLRenderer | null = null;
  /** @internal Manages Level of Detail for meshes to optimize performance. */
  private lodManager: LODManager;
  /** @internal Map storing specialized renderers for non-standard celestial types (e.g., gas giants, asteroid fields). Keyed by type or class enum. */
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for stars. Keyed by celestial object ID. */
  private starRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for planets (including terrestrial, dwarf). Keyed by celestial object ID. */
  private planetRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for moons. Keyed by celestial object ID. */
  private moonRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers for ring systems. Keyed by celestial object ID (matching the ring system). */
  private ringSystemRenderers: Map<string, RingSystemRenderer> = new Map();

  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** @internal Manages light sources in the scene, particularly those associated with stars. */
  private lightManager: LightManager;

  /** @internal Optional manager for handling 2D CSS labels attached to objects. Needs visibility methods. */
  private css2DManager?: LabelVisibilityManager & CSS2DManager;

  /** @internal Map storing ArrowHelper instances used to visualize acceleration vectors. Keyed by celestial object ID. */
  private accelerationArrows: Map<string, THREE.ArrowHelper> = new Map();
  /** @internal Scaling factor applied to acceleration vectors for visualization. Needs tuning. */
  private readonly arrowScaleFactor = 1e-11;
  /** @internal Color used for acceleration vector arrows. */
  private readonly arrowColor = 0xff00ff;

  /** @internal Handles the application and management of gravitational lensing post-processing effects. */
  private lensingHandler: GravitationalLensingHandler;
  /** @internal Factory responsible for creating the appropriate Three.js mesh based on object type and properties. */
  private meshFactory: MeshFactory;
  /** @internal Helper class responsible for calling the `update` method on all active specialized renderers. */
  private rendererUpdater: RendererUpdater;

  private objectsSubscription: Subscription | null = null;

  private accelerationsSubscription: Subscription | null = null;

  private destructionSubscription: (() => void) | null = null;

  /** @internal Temporary vector used for calculations to avoid allocations. */
  private tempVector3 = new THREE.Vector3();
  /** @internal Clock for debris animation timing */
  private debrisClock = new THREE.Clock();
  /** @internal List to track active debris effects */
  private activeDebrisEffects: ActiveDebris[] = [];

  /** @internal Flag to enable/disable debris visualization effects */
  private _enableDebrisEffects: boolean = true;

  /**
   * Sets the debug rendering mode for the underlying MeshFactory.
   * This will affect newly created meshes.
   * @param enabled - If true, forces MeshFactory to use fallback spheres.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.meshFactory) {
      this.meshFactory.setDebugMode(enabled);
    }
  }

  /**
   * Creates an instance of ObjectManager.
   * @param scene - The main Three.js scene.
   * @param camera - The primary Three.js camera.
   * @param renderableObjects$ - An Observable emitting the state of objects to be rendered.
   * @param lightManager - The manager for scene lighting, especially star lights.
   * @param renderer - The main WebGL renderer instance.
   * @param css2DManager - Optional manager for CSS2D labels. Must implement `showLabel` and `hideLabel`.
   * @param acceleration$ - Observable for acceleration vectors.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,

    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    lightManager: LightManager,
    renderer: THREE.WebGLRenderer,
    css2DManager?: LabelVisibilityManager & CSS2DManager,

    private acceleration$: Observable<
      Record<string, OSVector3>
    > = accelerationVectors$,
  ) {
    this.scene = scene;
    this.camera = camera;

    this.renderableObjects$ = renderableObjects$ || renderableObjects$;
    this.lightManager = lightManager;
    this.lodManager = new LODManager(camera);
    this.css2DManager = css2DManager;

    this.renderer = renderer;

    this.initCelestialRenderers();

    this.lensingHandler = new GravitationalLensingHandler(this.starRenderers);

    this.meshFactory = new MeshFactory(
      this.celestialRenderers,
      this.starRenderers,
      this.planetRenderers,
      this.ringSystemRenderers,
      (object: RenderableCelestialObject, levels: LODLevel[]) =>
        this.lodManager.createAndRegisterLOD(object, levels),
      this.lodManager,
    );

    this.rendererUpdater = new RendererUpdater(
      this.celestialRenderers,
      this.starRenderers,
      this.planetRenderers,
      this.moonRenderers,
      this.ringSystemRenderers,
    );

    this.subscribeToStateChanges();

    this.subscribeToDestructionEvents();
  }

  /**
   * Initializes the maps holding specialized renderers for different celestial object types/classes.
   * @internal
   */
  private initCelestialRenderers(): void {
    this.celestialRenderers.set(
      GasGiantClass.CLASS_I,
      new ClassIGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_II,
      new ClassIIGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_III,
      new ClassIIIGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_IV,
      new ClassIVGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_V,
      new ClassVGasGiantRenderer(),
    );

    this.celestialRenderers.set(
      CelestialType.ASTEROID_FIELD,
      new AsteroidFieldRenderer() as any,
    );
  }

  /**
   * Subscribes to the renderable objects and acceleration stores to react to state changes.
   * @internal
   */
  private subscribeToStateChanges(): void {
    this.objectsSubscription = this.renderableObjects$.subscribe(
      (objects: Record<string, RenderableCelestialObject>) => {
        this.latestRenderableObjects = objects;
        this.syncObjectsWithState(this.latestRenderableObjects);
      },
    );

    this.accelerationsSubscription = this.acceleration$.subscribe(
      (accelerations: Record<string, OSVector3>) => {
        this.syncAccelerationArrows(accelerations);
      },
    );
  }

  /**
   * Subscribes to destruction events from the renderer event bus.
   * @internal
   */
  private subscribeToDestructionEvents(): void {
    this.destructionSubscription = rendererEvents.on(
      "destruction:occurred",
      (event: DestructionEvent) => {
        this._handleDestructionEffect(event);
      },
    );
  }

  /**
   * Synchronizes the Three.js scene objects with the latest state from the `renderableObjectsStore`.
   * Adds new objects, updates existing ones, and removes objects no longer present in the state.
   * @internal
   * @param newState - The latest state of renderable objects from the store.
   */
  private syncObjectsWithState(
    newState: Record<string, RenderableCelestialObject>,
  ): void {
    const newStateIds = new Set(Object.keys(newState));
    const currentIds = new Set(this.objects.keys());

    currentIds.forEach((id) => {
      if (!newStateIds.has(id)) {
        this.internalRemoveObject(id);
      }
    });

    newStateIds.forEach((id) => {
      const objectData = newState[id];
      const mesh = this.objects.get(id);

      if (
        objectData.status === CelestialStatus.DESTROYED ||
        objectData.status === CelestialStatus.ANNIHILATED
      ) {
        if (mesh) {
          this.internalRemoveObject(id);
        }
        return;
      }

      if (mesh) {
        if (objectData.status === CelestialStatus.ACTIVE) {
          this.internalUpdateObject(objectData);
        }
      } else if (objectData.status === CelestialStatus.ACTIVE) {
        this.internalAddObject(objectData);
      }
    });
  }

  /**
   * Synchronizes the visibility and properties of acceleration vector arrows
   * based on the latest data from the `accelerationStore`.
   * @internal
   * @param accelerations - The latest acceleration vectors from the store.
   */
  private syncAccelerationArrows(
    accelerations: Record<string, OSVector3>,
  ): void {
    const updatedArrowIds = new Set<string>();

    for (const objectId in accelerations) {
      const accelerationVec = accelerations[objectId];
      const parentObject = this.objects.get(objectId);

      if (!parentObject || !accelerationVec) {
        continue;
      }

      const direction = new THREE.Vector3(
        accelerationVec.x,
        accelerationVec.y,
        accelerationVec.z,
      );
      const length = direction.length();
      if (length > 1e-9) {
        direction.normalize();
      } else {
        direction.set(0, 1, 0);
      }

      const scaledLength = length * this.arrowScaleFactor;

      let arrow = this.accelerationArrows.get(objectId);

      if (arrow) {
        arrow.setDirection(direction);
        arrow.setLength(scaledLength);

        arrow.visible = true;
      } else {
        arrow = new THREE.ArrowHelper(
          direction,
          new THREE.Vector3(0, 0, 0),
          scaledLength,
          this.arrowColor,
        );
        parentObject.add(arrow);
        this.accelerationArrows.set(objectId, arrow);
      }
      updatedArrowIds.add(objectId);
    }

    this.accelerationArrows.forEach((arrow, objectId) => {
      if (!updatedArrowIds.has(objectId)) {
        arrow.visible = false;
      }
    });
  }

  /**
   * Sets whether debris effects should be shown when objects are destroyed
   * @param enabled - Whether to enable debris effects
   */
  public setDebrisEffectsEnabled(enabled: boolean): void {
    this._enableDebrisEffects = enabled;
  }

  /**
   * Toggles debris effects on/off
   * @returns The new state (true if enabled, false if disabled)
   */
  public toggleDebrisEffects(): boolean {
    this._enableDebrisEffects = !this._enableDebrisEffects;

    return this._enableDebrisEffects;
  }

  /**
   * Creates and animates visual debris when a 'destruction:occurred' event is received.
   * @internal
   * @param event - The destruction event data.
   */
  private _handleDestructionEffect(event: DestructionEvent): void {
    if (!this._enableDebrisEffects) {
      return;
    }

    const impactScenePos = new THREE.Vector3(
      event.impactPosition.x * METERS_TO_SCENE_UNITS,
      event.impactPosition.y * METERS_TO_SCENE_UNITS,
      event.impactPosition.z * METERS_TO_SCENE_UNITS,
    );

    const debrisCount = 100;
    const debrisBaseSize = event.destroyedRadius * METERS_TO_SCENE_UNITS * 0.15;
    const debrisLifetime = 15.0;
    const speedMultiplier = 0.3;
    const initialSpreadFactor =
      event.destroyedRadius * METERS_TO_SCENE_UNITS * 1.5;

    const debrisGroup = new THREE.Group();
    debrisGroup.name = `Debris_${event.destroyedId}`;
    const debrisVelocities = new Map<string, THREE.Vector3>();
    const debrisRotations = new Map<
      string,
      { axis: THREE.Vector3; speed: number }
    >();

    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const glowGeometry = new THREE.IcosahedronGeometry(1, 0);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < debrisCount; i++) {
      const hue = Math.random() * 0.1 + 0.05;
      const saturation = 0.7 + Math.random() * 0.3;
      const debrisColor = new THREE.Color(0xff7700);
      debrisColor.offsetHSL(hue, 0, Math.random() * 0.2);

      const debrisMaterial = material.clone();
      debrisMaterial.color = debrisColor;

      const mesh = new THREE.Mesh(geometry, debrisMaterial);
      mesh.scale.setScalar(debrisBaseSize * (0.5 + Math.random() * 0.9));

      const glowMat = glowMaterial.clone();
      glowMat.color = debrisColor.clone().multiplyScalar(1.5);
      const glowMesh = new THREE.Mesh(glowGeometry, glowMat);
      glowMesh.scale.setScalar(1.5);
      mesh.add(glowMesh);

      const randomOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      )
        .normalize()
        .multiplyScalar(Math.random() * initialSpreadFactor * 1.2);
      mesh.position.copy(impactScenePos).add(randomOffset);

      const baseVel = new THREE.Vector3(
        event.relativeVelocity.x,
        event.relativeVelocity.y,
        event.relativeVelocity.z,
      ).multiplyScalar(METERS_TO_SCENE_UNITS);

      const randomDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize();

      const randomVelFactor = 0.8 + Math.random() * 0.6;
      const finalVel = baseVel
        .clone()
        .lerp(randomDir, 0.6)
        .normalize()
        .multiplyScalar(baseVel.length() * speedMultiplier * randomVelFactor);

      debrisVelocities.set(mesh.uuid, finalVel);

      const rotationAxis = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize();
      const rotationSpeed =
        (Math.random() * 1.5 + 0.5) * THREE.MathUtils.DEG2RAD * 60;
      debrisRotations.set(mesh.uuid, {
        axis: rotationAxis,
        speed: rotationSpeed,
      });

      debrisGroup.add(mesh);
    }

    this.scene.add(debrisGroup);
    this.activeDebrisEffects.push({
      group: debrisGroup,
      velocities: debrisVelocities,
      rotations: debrisRotations,
      startTime: this.debrisClock.getElapsedTime(),
      lifetime: debrisLifetime,
    });

    geometry.dispose();
  }

  /**
   * Applies a visual effect (e.g., transparency) to a mesh marked as destroyed.
   * @internal
   * @param mesh - The mesh to modify.
   */
  private _applyDestroyedAppearance(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (
              mat instanceof THREE.MeshBasicMaterial ||
              mat instanceof THREE.MeshStandardMaterial ||
              mat instanceof THREE.MeshPhongMaterial
            ) {
              mat.transparent = true;
              mat.opacity = 0.3;
              mat.needsUpdate = true;
            }
          });
        } else if (
          child.material instanceof THREE.MeshBasicMaterial ||
          child.material instanceof THREE.MeshStandardMaterial ||
          child.material instanceof THREE.MeshPhongMaterial
        ) {
          child.material.transparent = true;
          child.material.opacity = 0.3;
          child.material.needsUpdate = true;
        }
      }
    });
  }

  /**
   * Resets visual effects applied by _applyDestroyedAppearance.
   * @internal
   * @param mesh - The mesh to modify.
   */
  private _resetDestroyedAppearance(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (
              mat instanceof THREE.MeshBasicMaterial ||
              mat instanceof THREE.MeshStandardMaterial ||
              mat instanceof THREE.MeshPhongMaterial
            ) {
              if (mat.transparent && mat.opacity < 1.0) {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.needsUpdate = true;
              }
            }
          });
        } else if (
          child.material instanceof THREE.MeshBasicMaterial ||
          child.material instanceof THREE.MeshStandardMaterial ||
          child.material instanceof THREE.MeshPhongMaterial
        ) {
          if (child.material.transparent && child.material.opacity < 1.0) {
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.needsUpdate = true;
          }
        }
      }
    });
  }

  /**
   * Creates and adds a new Three.js mesh representation for a celestial object to the scene.
   * Also handles setting up associated labels and potential gravitational lensing effects.
   * Called internally when a new object appears in the `renderableObjectsStore`.
   * @internal
   * @param object - The data for the new celestial object.
   */
  private internalAddObject(object: RenderableCelestialObject): void {
    if (object.status === CelestialStatus.DESTROYED) {
      console.warn(
        `[ObjectManager] Attempted to add already destroyed object ${object.celestialObjectId}. Skipping.`,
      );
      return;
    }

    const objectId = object.celestialObjectId;
    if (this.objects.has(objectId)) {
      this.internalUpdateObject(object);
      return;
    }
    const mesh = this.meshFactory.createObjectMesh(object);

    if (!mesh) {
      console.warn(
        `[ObjectManager internalAddObject] MeshFactory FAILED to create mesh for ${objectId}. Skipping add.`,
      );
      return;
    }

    this.scene.add(mesh);
    this.objects.set(objectId, mesh);

    if (object.type === CelestialType.STAR && object.position) {
      this.lightManager.addStarLight(objectId, object.position);
    }

    if (this.css2DManager) {
      this.css2DManager.createCelestialLabel(object, mesh);
    }

    if (this.lensingHandler.needsGravitationalLensing(object)) {
      if (this.renderer) {
        this.lensingHandler.applyGravitationalLensing(
          object,
          this.renderer,
          this.scene,
          this.camera,
          mesh,
        );
      } else {
        console.warn(
          `[ObjectManager] Cannot apply lensing for ${object.celestialObjectId}: Renderer instance not available.`,
        );
      }
    }
  }

  /**
   * Updates the position and rotation of an existing Three.js mesh based on new data.
   * Called internally when an object's data changes in the `renderableObjectsStore`.
   * @internal
   * @param object - The updated data for the celestial object.
   */
  private internalUpdateObject(object: RenderableCelestialObject): void {
    if (object.status === CelestialStatus.DESTROYED) {
      this.internalRemoveObject(object.celestialObjectId);
      return;
    }

    const objectId = object.celestialObjectId;
    const existingMesh = this.objects.get(objectId);
    if (!existingMesh) {
      if (object.status === CelestialStatus.ACTIVE) {
        console.warn(
          `[ObjectManager] internalUpdateObject called for non-existent object ${objectId}. Attempting to add.`,
        );
        this.internalAddObject(object);
      }
      return;
    }

    existingMesh.position.copy(object.position);

    existingMesh.quaternion.copy(object.rotation);
  }

  /**
   * Removes a Three.js mesh and associated resources (geometry, material, label, lensing, arrow)
   * from the scene and internal maps. Called internally when an object disappears
   * from the `renderableObjectsStore`.
   * @internal
   * @param objectId - The ID of the celestial object to remove.
   */
  private internalRemoveObject(objectId: string): void {
    const mesh = this.objects.get(objectId);
    if (!mesh) {
      return;
    }

    const arrow = this.accelerationArrows.get(objectId);
    if (arrow) {
      mesh.remove(arrow);
      this.accelerationArrows.delete(objectId);
    }

    if (this.css2DManager) {
      this.css2DManager.removeElement(
        CSS2DLayerType.CELESTIAL_LABELS,
        objectId,
      );
    }

    this.lodManager.remove(objectId);
    this.scene.remove(mesh);

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat && typeof mat.dispose === "function") {
              mat.dispose();
            }
          });
        } else if (
          child.material &&
          typeof child.material.dispose === "function"
        ) {
          child.material.dispose();
        }
      }

      /*
      else if (child instanceof THREE.Points) {
        child.geometry?.dispose();
        const material = child.material; 
        if (Array.isArray(material)) {
          material.forEach((mat) => {
            if (mat && typeof mat.dispose === 'function') {
              mat.dispose();
            }
          });
        } else if (material && typeof material.dispose === 'function') {
          material.dispose();
        }
      }
      */
    });

    this.objects.delete(objectId);
    this.lensingHandler.removeLensingObject(objectId);

    this.lightManager.removeStarLight(objectId);

    const starRenderer = this.starRenderers.get(objectId);
    if (starRenderer?.dispose) {
      starRenderer.dispose();
    }
    this.starRenderers.delete(objectId);

    const planetRenderer = this.planetRenderers.get(objectId);
    if (planetRenderer?.dispose) {
      planetRenderer.dispose();
    }
    this.planetRenderers.delete(objectId);

    const moonRenderer = this.moonRenderers.get(objectId);
    if (moonRenderer?.dispose) {
      moonRenderer.dispose();
    }
    this.moonRenderers.delete(objectId);

    const ringSystemRenderer = this.ringSystemRenderers.get(objectId);
    if (ringSystemRenderer?.dispose) {
      ringSystemRenderer.dispose();
    }
    this.ringSystemRenderers.delete(objectId);
  }

  /**
   * Retrieves the Three.js Object3D instance associated with a given celestial object ID.
   * @param id - The unique ID of the celestial object.
   * @returns The corresponding Three.js Object3D, or null if not found.
   */
  getObject(id: string): THREE.Object3D | null {
    return this.objects.get(id) || null;
  }

  /**
   * Updates specialized renderers and manages label visibility based on LOD levels.
   * This is typically called once per frame.
   * @param time - The current simulation time or delta time for animations.
   * @param lightSources - Map of active light sources and their properties.
   * @param renderer - Optional WebGLRenderer instance, potentially needed by specialized renderers.
   * @param scene - Optional Scene instance, potentially needed by specialized renderers.
   * @param camera - Optional Camera instance, potentially needed by specialized renderers.
   */
  updateRenderers(
    time: number,
    lightSources: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    this.lodManager.update();

    this.rendererUpdater.updateRenderers(
      time,
      lightSources,
      this.objects,
      renderer,
      scene,
      camera,
    );

    if (this.css2DManager) {
      const allRenderableObjects = this.latestRenderableObjects;

      for (const objectId in allRenderableObjects) {
        const objectData = allRenderableObjects[objectId];

        if (objectData.status === CelestialStatus.DESTROYED) continue;

        if (!this.objects.has(objectId)) continue;

        let showLabel = false;

        const type = objectData.type;

        if (
          type === CelestialType.STAR ||
          type === CelestialType.PLANET ||
          type === CelestialType.GAS_GIANT ||
          type === CelestialType.OORT_CLOUD ||
          type === CelestialType.DWARF_PLANET ||
          type === CelestialType.ASTEROID_FIELD
        ) {
          showLabel = true;
        } else if (
          type === CelestialType.MOON ||
          type === CelestialType.RING_SYSTEM
        ) {
          if (objectData.parentId) {
            const parentLODLevel = this.lodManager.getCurrentLODLevel(
              objectData.parentId,
            );

            if (parentLODLevel !== undefined && parentLODLevel <= 1) {
              showLabel = true;
            }
          }
        } else {
          showLabel = false;
        }

        if (showLabel) {
          this.css2DManager.showLabel(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId,
          );
        } else {
          this.css2DManager.hideLabel(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId,
          );
        }
      }
    }

    this._updateDebrisEffects(this.debrisClock.getDelta());
  }

  /**
   * Updates the position and opacity of active debris effects and removes expired ones.
   * @internal
   * @param delta - Time delta since the last frame.
   */
  private _updateDebrisEffects(delta: number): void {
    const currentTime = this.debrisClock.getElapsedTime();
    const remainingDebris: ActiveDebris[] = [];

    for (const effect of this.activeDebrisEffects) {
      const elapsedTime = currentTime - effect.startTime;

      if (elapsedTime >= effect.lifetime) {
        this.scene.remove(effect.group);

        effect.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      } else {
        const progress = elapsedTime / effect.lifetime;
        const opacity = Math.min(1.0, (1.0 - progress) * 1.3);

        effect.group.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            const velocity = effect.velocities.get(child.uuid);
            if (velocity) {
              child.position.addScaledVector(velocity, delta);
            }

            const rotationData = effect.rotations.get(child.uuid);
            if (rotationData) {
              const deltaRotation = new THREE.Quaternion().setFromAxisAngle(
                rotationData.axis,
                rotationData.speed * delta,
              );
              child.quaternion.premultiply(deltaRotation);
            }

            if (child.material instanceof THREE.Material) {
              child.material.opacity = opacity;
            }
          }
        });
        remainingDebris.push(effect);
      }
    }

    this.activeDebrisEffects = remainingDebris;
  }

  /**
   * Main update loop method for the ObjectManager. Currently minimal.
   * Gravitational lensing updates are handled by specialized renderers or post-processing passes.
   * LOD updates happen in `updateRenderers`.
   * @param renderer - The main WebGL renderer.
   * @param scene - The main scene.
   * @param camera - The main camera.
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {}

  /**
   * Cleans up all resources managed by the ObjectManager.
   * Unsubscribes from stores, removes and disposes all meshes, materials, geometries,
   * clears internal maps, and disposes of helper managers (LOD, Lensing, RendererUpdater).
   * Should be called when the visualization is destroyed.
   */
  dispose(): void {
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    this.accelerationsSubscription?.unsubscribe();
    this.accelerationsSubscription = null;

    this.destructionSubscription?.();
    this.destructionSubscription = null;

    this.activeDebrisEffects.forEach((effect) => {
      this.scene.remove(effect.group);
      effect.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    });
    this.activeDebrisEffects = [];

    this.objects.forEach((_, id) => this.internalRemoveObject(id));
    this.objects.clear();

    this.rendererUpdater.dispose();
    this.celestialRenderers.clear();
    this.starRenderers.clear();
    this.planetRenderers.clear();
    this.moonRenderers.clear();
    this.ringSystemRenderers.clear();
    this.lodManager.clear();
    this.lensingHandler.clear();

    this.accelerationArrows.clear();
  }

  /**
   * Toggles the visibility of debug visualizations for the LOD manager.
   * @param enabled - Whether to enable LOD debug visualizations.
   */
  toggleLODDebug(enabled: boolean): void {
    this.lodManager.toggleDebug(enabled);
  }

  /**
   * Directly adds an arbitrary Three.js object to the scene managed by this ObjectManager.
   * Use with caution, as this object won't be managed by the standard add/update/remove lifecycle.
   * @param obj - The Three.js object to add.
   */
  addRawObjectToScene(obj: THREE.Object3D): void {
    this.scene.add(obj);
  }

  /**
   * Directly removes an arbitrary Three.js object from the scene, if it's a direct child.
   * Use with caution.
   * @param obj - The Three.js object to remove.
   */
  removeRawObjectFromScene(obj: THREE.Object3D): void {
    if (obj.parent === this.scene) {
      this.scene.remove(obj);
    }
  }

  /**
   * Forces the recreation of all managed Three.js objects based on the current state
   * in the renderableObjectsStore. This is useful for applying changes like debug mode
   * that require mesh regeneration.
   */
  public recreateAllMeshes(): void {
    const currentState = this.latestRenderableObjects;
    const currentIds = Array.from(this.objects.keys());

    currentIds.forEach((id) => {
      this.internalRemoveObject(id);
    });

    for (const objectId in currentState) {
      const objectData = currentState[objectId];
      if (objectData.status === CelestialStatus.ACTIVE) {
        this.internalAddObject(objectData);
      }
    }
  }
}
