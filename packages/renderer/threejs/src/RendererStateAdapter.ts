import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import {
  celestialObjects$,
  getSimulationState,
  renderableStore,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  RenderableCelestialObject,
  RingSystemProperties,
  SCALE,
  scaleSize,
} from "@teskooano/data-types";
import { BehaviorSubject, Subscription } from "rxjs";
import * as THREE from "three";
import { physicsToThreeJSPosition } from "./utils/coordinateUtils";
import type { RendererVisualSettings } from "./types";
import { physicsSystemAdapter } from "@teskooano/core-state";

/**
 * Acts as a bridge between the core application state and the rendering engine.
 *
 * This class subscribes to the main application state observables (`celestialObjects$`
 * and `simulationState$`). It transforms the raw, physics-based data into a
 * `RenderableCelestialObject` format that the various rendering managers can
 * consume. This transformation includes scaling positions, calculating rotations,
 * and determining lighting relationships.
 *
 * It then publishes the transformed data to the central `renderableStore`,
 * decoupling the renderer from the core application logic.
 */
export class RendererStateAdapter {
  /** An observable for visual settings that renderer components can subscribe to. */
  public $visualSettings: BehaviorSubject<RendererVisualSettings>;

  /** Subscription to the main celestial objects store. */
  private unsubscribeObjects: Subscription | null = null;
  /** Subscription to the main simulation state store. */
  private unsubscribeSimState: Subscription | null = null;
  /** The current simulation time, used for calculating rotations. */
  private currentSimulationTime: number = 0;

  // --- Reusable scratch variables for performance ---
  /** A reusable vector defining the 'up' axis for sidereal rotation. */
  private rotationAxis = new OSVector3(0, 1, 0);
  /** A reusable quaternion for storing the calculated axial tilt. */
  private tiltQuaternion = new OSQuaternion();
  /** A reusable quaternion for storing the calculated spin based on time. */
  private spinQuaternion = new OSQuaternion();
  /** A reusable quaternion for the final combined rotation result. */
  private finalRotation = new OSQuaternion();
  /** A reusable vector for the z-axis. */
  private zAxis = new OSVector3(0, 0, 1);

  /**
   * Initializes the adapter and subscribes to the core state.
   */
  constructor() {
    const initialSimState = getSimulationState();
    this.$visualSettings = new BehaviorSubject<RendererVisualSettings>({
      trailLengthMultiplier:
        initialSimState.visualSettings.trailLengthMultiplier,
      physicsEngine:
        initialSimState.physicsEngine === "verlet" ? "verlet" : "keplerian",
    });

    this.subscribeToCoreState();
  }

  /**
   * Calculates the final orientation of a celestial object.
   *
   * This method combines the object's fixed axial tilt with its continuous
   * sidereal rotation based on the current simulation time.
   * It reuses private class members (`tiltQuaternion`, `spinQuaternion`, etc.)
   * to avoid creating new objects in the render loop, which is a key
   * performance optimization.
   *
   * @param axialTilt The object's axial tilt in degrees (either an OSVector3 or a number).
   * @param siderealPeriod The time it takes for one full rotation, in seconds.
   * @returns An OSQuaternion representing the object's final orientation.
   */
  private calculateRotation(
    axialTilt: OSVector3 | number | undefined,
    siderealPeriod: number | undefined,
  ): OSQuaternion {
    this.tiltQuaternion = new OSQuaternion();
    this.spinQuaternion = new OSQuaternion();

    if (axialTilt instanceof OSVector3) {
      this.tiltQuaternion.setFromEuler(axialTilt, "XYZ");
    } else if (typeof axialTilt === "number" && !isNaN(axialTilt)) {
      const rad = axialTilt * (Math.PI / 180);
      this.tiltQuaternion.setFromAxisAngle(this.zAxis, rad);
    }

    if (siderealPeriod && siderealPeriod !== 0) {
      const rotationAngle =
        (this.currentSimulationTime / siderealPeriod) * 2 * Math.PI;
      this.spinQuaternion.setFromAxisAngle(this.rotationAxis, rotationAngle);
      this.finalRotation
        .copy(this.tiltQuaternion)
        .multiply(this.spinQuaternion);
    } else {
      this.finalRotation.copy(this.tiltQuaternion);
    }
    return this.finalRotation;
  }

  /**
   * Processes a standard celestial object into its renderable equivalent.
   *
   * @param obj The raw celestial object from the core state.
   * @param existing The previously existing renderable object, if any.
   * @param determineLightSource A function to find the primary light source for this object.
   * @returns A fully formed `RenderableCelestialObject`.
   */
  private processStandardObject(
    obj: CelestialObject,
    existing: RenderableCelestialObject | undefined,
    determineLightSource: (id: string) => string | undefined,
  ): RenderableCelestialObject {
    const target =
      existing ??
      ({
        celestialObjectId: obj.id,
        position: new THREE.Vector3(),
        rotation: new THREE.Quaternion(),
        isVisible: true,
        isTargetable: true,
        isSelected: false,
        isFocused: false,
        uniforms: {},
      } as RenderableCelestialObject);

    const realRadius = obj.realRadius_m ?? 0;

    physicsToThreeJSPosition(target.position, obj.physicsStateReal.position_m);
    target.rotation.copy(
      this.calculateRotation(
        obj.axialTilt,
        obj.siderealRotationPeriod_s,
      ).toThreeJS(),
    );

    target.name = obj.name;
    target.type = obj.type;
    target.seed = obj?.seed ?? (target.seed || crypto.randomUUID());
    target.radius = scaleSize(realRadius, obj.type);
    target.mass = (obj.realMass_kg ?? 0) * SCALE.MASS;
    target.properties = obj.properties;
    target.orbit = obj.orbit;
    target.parentId = obj.parentId;
    target.primaryLightSourceId = determineLightSource(obj.id);
    target.realRadius_m = realRadius;
    target.axialTilt = obj.axialTilt;
    target.status = obj.status;
    target.uniforms.temperature = obj.temperature;

    return target;
  }

  /**
   * Processes a ring system celestial object.
   *
   * A ring system's position and orientation are derived from its parent object.
   * This method ensures the ring is correctly placed and tilted relative to its parent.
   *
   * @param obj The ring system object from the core state.
   * @param objects The full map of all celestial objects.
   * @param existing The previously existing renderable object, if any.
   * @param determineLightSource A function to find the primary light source.
   * @returns A `RenderableCelestialObject` for the ring, or `null` if the parent is not found.
   */
  private processRingSystem(
    obj: CelestialObject,
    objects: Record<string, CelestialObject>,
    existing: RenderableCelestialObject | undefined,
    determineLightSource: (id: string) => string | undefined,
  ): RenderableCelestialObject | null {
    const parentId = obj.parentId;
    if (!parentId) {
      console.warn(
        `[RendererStateAdapter] Ring system ${obj.id} is missing parentId.`,
      );
      return null;
    }
    const parent = objects[parentId];
    if (
      !parent ||
      !parent.physicsStateReal ||
      !parent.physicsStateReal.position_m
    ) {
      return null;
    }

    const target =
      existing ??
      ({
        celestialObjectId: obj.id,
        position: new THREE.Vector3(),
        rotation: new THREE.Quaternion(),
        isVisible: true,
        isTargetable: false,
        isSelected: false,
        isFocused: false,
        uniforms: {},
      } as RenderableCelestialObject);

    physicsToThreeJSPosition(
      target.position,
      parent.physicsStateReal.position_m,
    );
    target.rotation.copy(
      this.calculateRotation(parent.axialTilt, undefined).toThreeJS(),
    );

    target.name = obj.name;
    target.type = obj.type;
    target.seed = obj?.seed ?? (target.seed || crypto.randomUUID());
    target.radius = 0;
    target.mass = 0;
    target.properties = obj.properties;
    target.orbit = undefined;
    target.parentId = obj.parentId;
    target.primaryLightSourceId = determineLightSource(obj.id);
    target.realRadius_m = 0;
    target.axialTilt = parent.axialTilt;
    target.status = obj.status;
    target.uniforms.temperature = obj.temperature;

    return target;
  }

  /**
   * The main processing handler for celestial object updates.
   *
   * This method is called whenever the `celestialObjects$` observable emits.
   * It iterates through all objects, transforms them into `RenderableCelestialObject`s
   * using the appropriate helper methods (`processStandardObject`, `processRingSystem`),
   * and then updates the central `renderableStore` with the complete new set of
   * renderable objects.
   *
   * It also pre-calculates the lighting hierarchy for all objects.
   *
   * @param objects The complete record of celestial objects from the core state.
   */
  private processCelestialObjectsUpdateNow(
    objects: Record<string, CelestialObject>,
  ): void {
    const objectCount = Object.keys(objects).length;
    const renderableMap: Record<string, RenderableCelestialObject> = {};

    if (objectCount === 0) {
      renderableStore.setAllRenderableObjects({});
      return;
    }

    const lightSourceMap: Record<string, string | undefined> = {};
    const determineLightSource = (id: string): string | undefined => {
      if (id in lightSourceMap) return lightSourceMap[id];
      const obj = objects[id];
      if (!obj) return undefined;
      if (obj.type === CelestialType.STAR) {
        lightSourceMap[id] = id;
        return id;
      }
      if (!obj.parentId) {
        lightSourceMap[id] = undefined;
        return undefined;
      }
      lightSourceMap[id] = determineLightSource(obj.parentId);
      return lightSourceMap[id];
    };

    Object.keys(objects).forEach((id) => determineLightSource(id));

    const existingRenderables = renderableStore.getRenderableObjects();

    try {
      for (const id in objects) {
        const obj = objects[id];
        const existing = existingRenderables[id];

        if (!obj.physicsStateReal || !obj.physicsStateReal.position_m) {
          if (obj.type !== CelestialType.RING_SYSTEM) {
            console.warn(
              `[RendererStateAdapter] Skipping object ${id} due to missing physics state.`,
            );
            continue;
          }
        }

        let renderableObject: RenderableCelestialObject | null = null;

        switch (obj.type) {
          case CelestialType.RING_SYSTEM:
            renderableObject = this.processRingSystem(
              obj,
              objects,
              existing,
              determineLightSource,
            );
            break;
          case CelestialType.STAR:
          case CelestialType.PLANET:
          case CelestialType.MOON:
          case CelestialType.DWARF_PLANET:
          case CelestialType.GAS_GIANT:
          case CelestialType.COMET:
          case CelestialType.ASTEROID_FIELD:
          case CelestialType.OORT_CLOUD:
          case CelestialType.SPACE_ROCK:
            renderableObject = this.processStandardObject(
              obj,
              existing,
              determineLightSource,
            );
            break;
          default:
            console.warn(
              `[RendererStateAdapter] Unhandled celestial type: ${obj.type} for object ${id}`,
            );
        }

        if (renderableObject) {
          renderableMap[id] = renderableObject;
        } else {
        }
      }
      renderableStore.setAllRenderableObjects(renderableMap);
    } catch (error) {
      console.error(
        "[RendererStateAdapter] Error during object processing loop:",
        error,
      );
    }
  }

  /**
   * Subscribes to the core application state observables.
   *
   * Sets up the subscriptions to `celestialObjects$` and `simulationState$` that
   * drive all the updates within this adapter.
   */
  private subscribeToCoreState(): void {
    this.unsubscribeObjects = celestialObjects$.subscribe((objects) =>
      this.processCelestialObjectsUpdateNow(objects),
    );

    this.unsubscribeSimState = simulationState$.subscribe(
      (simState: SimulationState) => {
        this.currentSimulationTime = simState.time ?? 0;

        const currentVisSettings = this.$visualSettings.getValue();
        const newMultiplier =
          simState.visualSettings.trailLengthMultiplier ?? 150;
        const newEngine =
          simState.physicsEngine === "verlet" ? "verlet" : "keplerian";

        if (
          newMultiplier !== currentVisSettings.trailLengthMultiplier ||
          newEngine !== currentVisSettings.physicsEngine
        ) {
          this.$visualSettings.next({
            ...currentVisSettings,
            trailLengthMultiplier: newMultiplier,
            physicsEngine: newEngine,
          });
        }
      },
    );
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks.
   */
  public dispose(): void {
    this.unsubscribeObjects?.unsubscribe();
    this.unsubscribeSimState?.unsubscribe();
    this.unsubscribeObjects = null;
    this.unsubscribeSimState = null;
  }

  private createRenderableObject(
    obj: CelestialObject,
  ): RenderableCelestialObject {
    const position = new THREE.Vector3();
    physicsToThreeJSPosition(position, obj.physicsStateReal.position_m);
    const rotation = obj.rotation
      ? obj.rotation.clone()
      : new THREE.Quaternion();

    return {
      celestialObjectId: obj.id,
      name: obj.name,
      type: obj.type,
      status: obj.status,
      seed: obj.seed || obj.name,
      radius: scaleSize(obj.realRadius_m, obj.type),
      mass: obj.realMass_kg,
      position,
      rotation,
      properties: obj.properties,
      orbit: obj.orbit,
      parentId: obj.parentId,
      primaryLightSourceId: obj.currentParentId,
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
      realRadius_m: obj.realRadius_m,
      temperature: obj.temperature,
      axialTilt: obj.axialTilt,
      uniforms: {},
    };
  }

  private createRenderableRingSystem(
    obj: CelestialObject,
    ringSystem: RingSystemProperties,
  ): RenderableCelestialObject {
    const position = new THREE.Vector3();
    physicsToThreeJSPosition(position, obj.physicsStateReal.position_m);

    return {
      celestialObjectId: `${obj.id}-${ringSystem.rings[0].innerRadius}`,
      name: `${obj.name} Rings`,
      type: CelestialType.RING_SYSTEM,
      status: CelestialStatus.ACTIVE,
      seed: obj.seed || obj.name,
      radius: scaleSize(
        ringSystem.rings[0].outerRadius,
        CelestialType.RING_SYSTEM,
      ),
      mass: 0,
      position,
      rotation: new THREE.Quaternion(),
      properties: ringSystem,
      orbit: undefined,
      parentId: obj.id,
      primaryLightSourceId: obj.currentParentId,
      isVisible: true,
      isTargetable: false,
      isSelected: false,
      isFocused: false,
      realRadius_m: 0,
      temperature: 0,
      axialTilt: obj.axialTilt,
      uniforms: {},
    };
  }

  private updateRenderableObject(
    obj: CelestialObject,
    existing: RenderableCelestialObject | undefined,
    determineLightSource: (id: string) => string | undefined,
  ): RenderableCelestialObject {
    const target =
      existing ??
      ({
        celestialObjectId: obj.id,
        position: new THREE.Vector3(),
        rotation: new THREE.Quaternion(),
        isVisible: true,
        isTargetable: true,
        isSelected: false,
        isFocused: false,
        uniforms: {},
      } as RenderableCelestialObject);

    const realRadius = obj.realRadius_m ?? 0;

    physicsToThreeJSPosition(target.position, obj.physicsStateReal.position_m);
    target.rotation.copy(
      this.calculateRotation(
        obj.axialTilt,
        obj.siderealRotationPeriod_s,
      ).toThreeJS(),
    );

    target.name = obj.name;
    target.type = obj.type;
    target.seed = obj?.seed ?? (target.seed || crypto.randomUUID());
    target.radius = scaleSize(realRadius, obj.type);
    target.mass = (obj.realMass_kg ?? 0) * SCALE.MASS;
    target.properties = obj.properties;
    target.orbit = obj.orbit;
    target.parentId = obj.parentId;
    target.primaryLightSourceId = determineLightSource(obj.id);
    target.realRadius_m = realRadius;
    target.axialTilt = obj.axialTilt;
    target.status = obj.status;
    target.uniforms.temperature = obj.temperature;

    return target;
  }
}
