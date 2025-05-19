import { OSVector3 } from "@teskooano/core-math";
import {
  celestialObjects$,
  renderableStore,
  getSimulationState,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  SCALE,
  scaleSize,
  type CelestialObject,
  type CelestialSpecificPropertiesUnion,
  type OrbitalParameters,
} from "@teskooano/data-types";
import { BehaviorSubject, Subscription } from "rxjs";
import * as THREE from "three";
import { physicsToThreeJSPosition } from "./utils/coordinateUtils";

export interface RenderableCelestialObject {
  /** Link back to the core celestial object */
  celestialObjectId: string;
  name: string;
  type: CelestialType;
  /** Current status from the core object */
  status: CelestialStatus;
  seed: string;

  radius: number;
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;

  properties?: CelestialSpecificPropertiesUnion;
  orbit?: OrbitalParameters;

  parentId?: string;
  primaryLightSourceId?: string;

  isVisible?: boolean;
  isTargetable?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;

  realRadius_m: number;

  axialTilt?: OSVector3;
  temperature?: number;
}

export interface RendererVisualSettings {
  trailLengthMultiplier: number;
  physicsEngine: "keplerian" | "verlet";
}

export class RendererStateAdapter {
  public $visualSettings: BehaviorSubject<RendererVisualSettings>;

  private unsubscribeObjects: Subscription | null = null;
  private unsubscribeSimState: Subscription | null = null;
  private currentSimulationTime: number = 0;

  private rotationAxis = new THREE.Vector3(0, 1, 0);
  private tiltQuaternion = new THREE.Quaternion();
  private spinQuaternion = new THREE.Quaternion();
  private euler = new THREE.Euler();

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
      temperature: obj.temperature,
    };
  }

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
      temperature: obj.temperature,
    };
  }

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

  public dispose(): void {
    this.unsubscribeObjects?.unsubscribe();
    this.unsubscribeSimState?.unsubscribe();
    this.unsubscribeObjects = null;
    this.unsubscribeSimState = null;
  }
}
