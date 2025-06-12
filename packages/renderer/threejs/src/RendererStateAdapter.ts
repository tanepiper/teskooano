import { OSVector3 } from "@teskooano/core-math";
import {
  celestialObjects$,
  getSimulationState,
  renderableStore,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  SCALE,
  scaleSize,
  type CelestialObject,
} from "@teskooano/data-types";
import { BehaviorSubject, Subscription } from "rxjs";
import * as THREE from "three";
import { physicsToThreeJSPosition } from "./utils/coordinateUtils";
import type {
  RenderableCelestialObject,
  RendererVisualSettings,
} from "./types";

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
  private rotationAxis = new THREE.Vector3(0, 1, 0);
  /** A reusable quaternion for storing the calculated axial tilt. */
  private tiltQuaternion = new THREE.Quaternion();
  /** A reusable quaternion for storing the calculated spin based on time. */
  private spinQuaternion = new THREE.Quaternion();
  /** A reusable Euler for converting tilt angles to a quaternion. */
  private euler = new THREE.Euler();

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
   * @returns A THREE.Quaternion representing the object's final orientation.
   */
  private calculateRotation(
    axialTilt: OSVector3 | number | undefined,
    siderealPeriod: number | undefined,
  ): THREE.Quaternion {
    const finalRotation = new THREE.Quaternion();
    this.tiltQuaternion.identity();
    this.spinQuaternion.identity();

    if (axialTilt instanceof OSVector3) {
      this.euler.set(
        THREE.MathUtils.degToRad(axialTilt.x ?? 0),
        THREE.MathUtils.degToRad(axialTilt.y ?? 0),
        THREE.MathUtils.degToRad(axialTilt.z ?? 0),
        "XYZ",
      );
      this.tiltQuaternion.setFromEuler(this.euler);
    } else if (typeof axialTilt === "number" && !isNaN(axialTilt)) {
      this.tiltQuaternion.setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        THREE.MathUtils.degToRad(axialTilt),
      );
    }

    if (siderealPeriod && siderealPeriod !== 0) {
      const rotationAngle =
        (this.currentSimulationTime / siderealPeriod) * 2 * Math.PI;
      this.spinQuaternion.setFromAxisAngle(this.rotationAxis, rotationAngle);
      finalRotation.multiplyQuaternions(
        this.tiltQuaternion,
        this.spinQuaternion,
      );
    } else {
      finalRotation.copy(this.tiltQuaternion);
    }
    return finalRotation;
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
    const realRadius = obj.realRadius_m ?? 0;
    const scaledRadius = scaleSize(realRadius, obj.type);
    const scaledMass = (obj.realMass_kg ?? 0) * SCALE.MASS;
    const position = physicsToThreeJSPosition(obj.physicsStateReal.position_m);
    const rotation = this.calculateRotation(
      obj.axialTilt,
      obj.siderealRotationPeriod_s,
    );
    const primaryLightSourceId = determineLightSource(obj.id);

    return {
      celestialObjectId: obj.id,
      name: obj.name,
      type: obj.type,
      seed: obj?.seed ?? crypto.randomUUID(),
      radius: scaledRadius,
      mass: scaledMass,
      position: position,
      rotation: rotation,
      properties: obj.properties,
      orbit: obj.orbit,
      parentId: obj.parentId,
      primaryLightSourceId: primaryLightSourceId,
      realRadius_m: realRadius,
      axialTilt: obj.axialTilt,
      isVisible: existing?.isVisible ?? true,
      isTargetable: existing?.isTargetable ?? true,
      isSelected: existing?.isSelected ?? false,
      isFocused: existing?.isFocused ?? false,
      status: obj.status,
      uniforms: {
        temperature: obj.temperature,
      },
    };
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

    const position = physicsToThreeJSPosition(
      parent.physicsStateReal.position_m,
    );

    const rotation = this.calculateRotation(parent.axialTilt, undefined);
    const primaryLightSourceId = determineLightSource(obj.id);

    return {
      celestialObjectId: obj.id,
      name: obj.name,
      type: obj.type,
      seed: obj?.seed ?? crypto.randomUUID(),
      radius: 0,
      mass: 0,
      position: position,
      rotation: rotation,
      properties: obj.properties,
      orbit: undefined,
      parentId: obj.parentId,
      primaryLightSourceId: primaryLightSourceId,
      realRadius_m: 0,
      axialTilt: parent.axialTilt,
      isVisible: existing?.isVisible ?? true,
      isTargetable: existing?.isTargetable ?? false,
      isSelected: existing?.isSelected ?? false,
      isFocused: existing?.isFocused ?? false,
      status: obj.status,
      uniforms: {
        temperature: obj.temperature,
      },
    };
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
}
