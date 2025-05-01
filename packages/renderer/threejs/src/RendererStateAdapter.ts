import { OSVector3 } from "@teskooano/core-math";
import {
  celestialObjects$,
  getCelestialObjects,
  getRenderableObjects,
  getSimulationState,
  renderableActions,
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
import * as THREE from "three";
import { Subscription, BehaviorSubject } from "rxjs";
import { physicsToThreeJSPosition } from "./utils/coordinateUtils"; // Assuming this utility exists

// Define the structure of the state relevant specifically for rendering
export interface RenderableCelestialObject {
  /** Link back to the core celestial object */
  celestialObjectId: string;
  name: string;
  type: CelestialType; // Use string type from CelestialObject
  /** Current status from the core object */
  status: CelestialStatus;

  // Scaled visual properties
  radius: number; // Visual radius in Three.js units (0 for RingSystem)
  mass: number; // Scaled mass (0 for RingSystem)
  position: THREE.Vector3; // Scaled position
  rotation: THREE.Quaternion; // Scaled rotation

  // Properties needed directly by renderers (e.g., for material selection, colors, textures)
  properties?: CelestialSpecificPropertiesUnion; // Use the specific union type
  orbit?: OrbitalParameters; // Keep original orbit data for things like rings, maybe prediction?

  // Relationships / Lighting
  parentId?: string;
  primaryLightSourceId?: string;

  // UI / Interaction State
  isVisible?: boolean;
  isTargetable?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;

  // Need real radius for mesh creation geometry (0 for RingSystem)
  realRadius_m: number;

  // Store original axial tilt for things like rings
  axialTilt?: OSVector3;
}

// Define the structure for visual settings *derived from core state*
export interface RendererVisualSettings {
  trailLengthMultiplier: number;
  physicsEngine: "keplerian" | "verlet"; // Map core state engines to renderer-friendly types
}

// The main adapter class
export class RendererStateAdapter {
  // REMOVED internal renderable objects store instance
  // public $renderableObjects: MapStore<Record<string, RenderableCelestialObject>>;

  // Store for visual settings relevant to rendering (derived from core state)
  public $visualSettings: BehaviorSubject<RendererVisualSettings>;

  private unsubscribeObjects: Subscription | null = null;
  private unsubscribeSimState: Subscription | null = null;
  private currentSimulationTime: number = 0; // Store current time
  // Pre-allocate reusable objects for rotation calculation
  private rotationAxis = new THREE.Vector3(0, 1, 0);
  private tiltQuaternion = new THREE.Quaternion();
  private spinQuaternion = new THREE.Quaternion();
  private euler = new THREE.Euler(); // RE-ADD Euler for OSVector3 tilt

  constructor() {
    // Initialize visual settings directly from the current core state
    const initialSimState = getSimulationState();
    this.$visualSettings = new BehaviorSubject<RendererVisualSettings>({
      trailLengthMultiplier:
        initialSimState.visualSettings.trailLengthMultiplier,
      physicsEngine:
        initialSimState.physicsEngine === "verlet" ? "verlet" : "keplerian",
    });

    this.subscribeToCoreState();
  }

  // --- Helper function to calculate rotation based on tilt and optional spin ---
  private calculateRotation(
    axialTilt: OSVector3 | number | undefined,
    siderealPeriod: number | undefined,
  ): THREE.Quaternion {
    const finalRotation = new THREE.Quaternion();
    this.tiltQuaternion.identity();
    this.spinQuaternion.identity();

    // Handle Axial Tilt
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

    // Handle Spin (only if siderealPeriod is provided)
    if (siderealPeriod && siderealPeriod !== 0) {
      const rotationAngle =
        (this.currentSimulationTime / siderealPeriod) * 2 * Math.PI;
      this.spinQuaternion.setFromAxisAngle(this.rotationAxis, rotationAngle);
      finalRotation.multiplyQuaternions(
        this.tiltQuaternion,
        this.spinQuaternion,
      );
    } else {
      finalRotation.copy(this.tiltQuaternion); // No spin, just use tilt
    }
    return finalRotation;
  }

  // --- Process function for standard celestial bodies (Planets, Moons, Stars, etc.) ---
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
    };
  }

  // --- Process function specifically for Ring Systems ---
  private processRingSystem(
    obj: CelestialObject,
    objects: Record<string, CelestialObject>, // Need full map to find parent
    existing: RenderableCelestialObject | undefined,
    determineLightSource: (id: string) => string | undefined,
  ): RenderableCelestialObject | null {
    // Return null if parent is invalid
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
      // console.warn(`[RendererStateAdapter] Parent object ${parentId} for ring system ${obj.id} not found or invalid.`);
      // Don't warn every frame if parent disappears temporarily
      return null;
    }

    // Derive position from parent
    const position = physicsToThreeJSPosition(
      parent.physicsStateReal.position_m,
    );
    // Derive rotation ONLY from parent's tilt (rings don't spin independently)
    const rotation = this.calculateRotation(parent.axialTilt, undefined); // Pass undefined for siderealPeriod
    const primaryLightSourceId = determineLightSource(obj.id); // Rings use parent's light source

    return {
      celestialObjectId: obj.id,
      name: obj.name,
      type: obj.type,
      radius: 0, // Rings have no single radius
      mass: 0, // Rings have negligible mass for rendering purposes
      position: position,
      rotation: rotation,
      properties: obj.properties, // Contains RingSystemProperties with rings array
      orbit: undefined, // Rings don't have independent orbits
      parentId: obj.parentId,
      primaryLightSourceId: primaryLightSourceId,
      realRadius_m: 0,
      axialTilt: parent.axialTilt, // Store parent's tilt for reference if needed
      isVisible: existing?.isVisible ?? true,
      isTargetable: existing?.isTargetable ?? false, // Rings usually not targetable
      isSelected: existing?.isSelected ?? false,
      isFocused: existing?.isFocused ?? false,
      status: obj.status,
    };
  }

  // Define the main processing function
  private processCelestialObjectsUpdateNow(
    objects: Record<string, CelestialObject>,
  ): void {
    const objectCount = Object.keys(objects).length;
    const renderableMap: Record<string, RenderableCelestialObject> = {};

    if (objectCount === 0) {
      renderableActions.setAllRenderableObjects({});
      return;
    }

    // Pre-calculate light sources for efficiency
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
    // Ensure all light sources are determined upfront
    Object.keys(objects).forEach((id) => determineLightSource(id));

    const existingRenderables = getRenderableObjects();

    try {
      for (const id in objects) {
        const obj = objects[id];
        const existing = existingRenderables[id];

        // Skip objects without basic physics state (shouldn't happen often for valid objects)
        if (!obj.physicsStateReal || !obj.physicsStateReal.position_m) {
          // Allow RING_SYSTEM through as it derives state from parent
          if (obj.type !== CelestialType.RING_SYSTEM) {
            console.warn(
              `[RendererStateAdapter] Skipping object ${id} due to missing physics state.`,
            );
            continue;
          }
        }

        let renderableObject: RenderableCelestialObject | null = null;

        // Route to the appropriate processing function based on type
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
          // Add other standard types that need position/rotation/mass/radius
          case CelestialType.COMET:
          case CelestialType.ASTEROID_FIELD: // Might need custom logic later
          case CelestialType.OORT_CLOUD: // Might need custom logic later
          case CelestialType.SPACE_ROCK: // Might need custom logic later
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
          // If processing failed (e.g., ring system with missing parent), remove from renderable map
          // delete renderableMap[id]; // No, keep existing if possible? Or just don't add.
        }
      }

      renderableActions.setAllRenderableObjects(renderableMap);
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

    // Subscribe to the simulation state store
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
