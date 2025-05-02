import { OSVector3 } from "@teskooano/core-math";
import { accelerationVectors$ } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
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
  ObjectLifecycleManager,
  AccelerationVisualizer,
  DebrisEffectManager,
} from "./object-manager";

import type { LODLevel } from "@teskooano/systems-celestial";

import type { DestructionEvent } from "@teskooano/core-physics";
import { rendererEvents } from "@teskooano/renderer-threejs-core";

interface LabelVisibilityManager {
  showLabel(layer: CSS2DLayerType, id: string): void;
  hideLabel(layer: CSS2DLayerType, id: string): void;
}

/**
 * Orchestrates the management of Three.js scene objects representing celestial bodies.
 * It coordinates various specialized managers for object lifecycle, visual effects (LOD, lensing, debris),
 * and debug visualizations. It subscribes to state updates and events to keep the scene synchronized.
 */
export class ObjectManager {
  private objects: Map<string, THREE.Object3D> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private lodManager: LODManager;
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();
  private starRenderers: Map<string, CelestialRenderer> = new Map();
  private planetRenderers: Map<string, CelestialRenderer> = new Map();
  private moonRenderers: Map<string, CelestialRenderer> = new Map();
  private ringSystemRenderers: Map<string, RingSystemRenderer> = new Map();

  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  private lightManager: LightManager;
  private css2DManager?: LabelVisibilityManager & CSS2DManager;

  private accelerationVisualizer: AccelerationVisualizer;

  private lensingHandler: GravitationalLensingHandler;
  private meshFactory: MeshFactory;
  private rendererUpdater: RendererUpdater;

  private debrisEffectManager: DebrisEffectManager;

  private objectLifecycleManager: ObjectLifecycleManager;

  private objectsSubscription: Subscription | null = null;
  private accelerationsSubscription: Subscription | null = null;
  private destructionSubscription: (() => void) | null = null;

  private tempVector3 = new THREE.Vector3();

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
    this.renderableObjects$ = renderableObjects$;
    this.lightManager = lightManager;
    this.renderer = renderer;
    this.css2DManager = css2DManager;

    this.lodManager = new LODManager(camera);
    this.initCelestialRenderers();
    this.lensingHandler = new GravitationalLensingHandler({
      starRenderers: this.starRenderers,
    });

    this.meshFactory = new MeshFactory({
      celestialRenderers: this.celestialRenderers,
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
      lodManager: this.lodManager,
      camera: this.camera,
      createLodCallback: (
        object: RenderableCelestialObject,
        levels: LODLevel[],
      ) => this.lodManager.createAndRegisterLOD(object, levels),
    });

    this.objectLifecycleManager = new ObjectLifecycleManager({
      objects: this.objects,
      scene: this.scene,
      meshFactory: this.meshFactory,
      lodManager: this.lodManager,
      lightManager: this.lightManager,
      lensingHandler: this.lensingHandler,
      renderer: this.renderer,
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
      camera: this.camera,
      css2DManager: this.css2DManager,
    });

    this.accelerationVisualizer = new AccelerationVisualizer({
      objects: this.objects,
    });

    this.debrisEffectManager = new DebrisEffectManager({ scene: this.scene });

    this.rendererUpdater = new RendererUpdater({
      celestialRenderers: this.celestialRenderers,
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
    });

    this.subscribeToStateChanges();
    this.subscribeToDestructionEvents();
  }

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

  private subscribeToStateChanges(): void {
    this.objectsSubscription = this.renderableObjects$.subscribe(
      (objects: Record<string, RenderableCelestialObject>) => {
        this.latestRenderableObjects = objects;
        this.objectLifecycleManager.syncObjectsWithState(
          this.latestRenderableObjects,
        );
      },
    );

    this.accelerationsSubscription = this.acceleration$.subscribe(
      (accelerations: Record<string, OSVector3>) => {
        this.accelerationVisualizer.syncAccelerationArrows(accelerations);
      },
    );
  }

  private subscribeToDestructionEvents(): void {
    this.destructionSubscription = rendererEvents.on(
      "destruction:occurred",
      (event: DestructionEvent) => {
        this.debrisEffectManager.createDebrisEffect(event);
      },
    );
  }

  public setDebugMode(enabled: boolean): void {
    if (this.meshFactory) {
      this.meshFactory.setDebugMode(enabled);
      this.recreateAllMeshes();
    }
  }

  public setDebrisEffectsEnabled(enabled: boolean): void {
    this.debrisEffectManager.setDebrisEffectsEnabled(enabled);
  }

  public toggleDebrisEffects(): boolean {
    return this.debrisEffectManager.toggleDebrisEffects();
  }

  getObject(id: string): THREE.Object3D | null {
    return this.objects.get(id) || null;
  }

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
      renderer || this.renderer || undefined,
      scene || this.scene,
      camera || this.camera,
    );

    this.updateLabelVisibility();

    this.debrisEffectManager.update(this.getDeltaTime());
  }

  private updateLabelVisibility(): void {
    if (!this.css2DManager) return;

    const allRenderableObjects = this.latestRenderableObjects;

    for (const objectId in allRenderableObjects) {
      const objectData = allRenderableObjects[objectId];

      if (
        objectData.status === CelestialStatus.DESTROYED ||
        !this.objects.has(objectId)
      ) {
        this.css2DManager.hideLabel(CSS2DLayerType.CELESTIAL_LABELS, objectId);
        continue;
      }

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
      }

      if (showLabel) {
        this.css2DManager.showLabel(CSS2DLayerType.CELESTIAL_LABELS, objectId);
      } else {
        this.css2DManager.hideLabel(CSS2DLayerType.CELESTIAL_LABELS, objectId);
      }
    }
  }

  private getDeltaTime(): number {
    return 0.016;
  }

  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {}

  dispose(): void {
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;
    this.accelerationsSubscription?.unsubscribe();
    this.accelerationsSubscription = null;
    this.destructionSubscription?.();
    this.destructionSubscription = null;

    this.objectLifecycleManager.dispose();
    this.debrisEffectManager.dispose();
    this.accelerationVisualizer.clear();

    this.rendererUpdater.dispose();
    this.lodManager.clear();
    this.lensingHandler.clear();

    this.celestialRenderers.clear();
    this.starRenderers.clear();
    this.planetRenderers.clear();
    this.moonRenderers.clear();
    this.ringSystemRenderers.clear();

    this.objects.clear();

    console.log("[ObjectManager] Disposed.");
  }

  toggleLODDebug(enabled: boolean): void {
    this.lodManager.toggleDebug(enabled);
  }

  addRawObjectToScene(obj: THREE.Object3D): void {
    this.scene.add(obj);
  }

  removeRawObjectFromScene(obj: THREE.Object3D): void {
    if (obj.parent === this.scene) {
      this.scene.remove(obj);
    }
  }

  public recreateAllMeshes(): void {
    this.objectLifecycleManager.dispose();
    this.objectLifecycleManager.syncObjectsWithState(
      this.latestRenderableObjects,
    );
    console.log("[ObjectManager] Recreated all meshes.");
  }
}
