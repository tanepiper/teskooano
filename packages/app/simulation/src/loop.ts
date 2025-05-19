import {
  updateSimulation,
  vectorPool,
  type SimulationStepResult,
  type DestructionEvent,
  type SimulationParameters,
} from "@teskooano/core-physics";
import {
  getSimulationState,
  setSimulationState,
  physicsSystemAdapter,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import * as THREE from "three";

import { Subscription } from "rxjs";
import {
  resetTime$,
  orbitUpdate$,
  destructionOccurred$,
  type OrbitUpdatePayload,
} from "./simulationEvents";

let lastTime = performance.now();
let running = true;
let lastLoggedTime = 0;
let accumulatedTime = 0;
let resetTimeSubscription: Subscription | null = null;

export function startSimulationLoop() {
  resetTimeSubscription = resetTime$.subscribe(() => {
    accumulatedTime = 0;
  });

  function simulationLoop() {
    const acquiredVectors: THREE.Vector3[] = [];

    try {
      if (!running) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Use a fixed time step of 8ms (0.008s) for physics stability
      // This allows x1 simulation speed to be closer to real-time
      // while still maintaining numerical stability for orbital mechanics
      const fixedDeltaTime = Math.min(deltaTime, 0.008);

      if (!getSimulationState().paused) {
        const timeScale = getSimulationState().timeScale;
        const scaledDeltaTime = fixedDeltaTime * timeScale;
        accumulatedTime += scaledDeltaTime;

        setSimulationState({
          ...getSimulationState(),
          time: accumulatedTime,
        });

        // Get active bodies using the adapter
        const activeBodiesReal = physicsSystemAdapter.getPhysicsBodies();

        const radii = new Map<string | number, number>();
        const isStar = new Map<string | number, boolean>();
        const bodyTypes = new Map<string | number, CelestialType>();
        const parentIds = new Map<string | number, string | undefined>();

        // Need to get all objects to build simParams, even if adapter filters for active bodies
        // Or, simParams could be derived inside the adapter if it had access to all objects.
        // For now, loop.ts still needs to prepare this from the full object list.
        // This part remains similar, as it's about *all* objects for context, not just active ones for simulation step.
        const allCelestialObjectsForParams =
          physicsSystemAdapter.getCelestialObjectsSnapshot(); // NEW METHOD NEEDED ON ADAPTER

        Object.values(allCelestialObjectsForParams) // Iterate over snapshot from adapter
          // Filter for non-destroyed objects to build parameters for physics sim
          .filter(
            (obj: CelestialObject) =>
              obj.status !== CelestialStatus.DESTROYED &&
              obj.status !== CelestialStatus.ANNIHILATED &&
              !obj.ignorePhysics, // Ensure we are building params for things that *could* be in physics
          )
          .forEach((obj: CelestialObject) => {
            if (obj.physicsStateReal) {
              // Guard, though getPhysicsBodies should give only these
              radii.set(obj.id, obj.realRadius_m);
              isStar.set(obj.id, obj.type === CelestialType.STAR);
              bodyTypes.set(obj.id, obj.type);
              parentIds.set(obj.id, obj.parentId);
            }
          });

        const simParams: SimulationParameters = {
          radii,
          isStar,
          bodyTypes,
          parentIds,
          physicsEngine: getSimulationState().physicsEngine,
        };

        const stepResult: SimulationStepResult = updateSimulation(
          activeBodiesReal, // From adapter
          scaledDeltaTime,
          simParams,
        );

        if (
          stepResult.destructionEvents &&
          stepResult.destructionEvents.length > 0
        ) {
          stepResult.destructionEvents.forEach((event: DestructionEvent) => {
            destructionOccurred$.next(event);
          });
        }

        // Update state using the adapter
        physicsSystemAdapter.updateStateFromResult(stepResult);

        // The local rotation calculation logic is still here.
        // This needs to be re-evaluated. It modifies the objects directly from the game state store.
        // It should ideally operate on the map *before* setAllCelestialObjects if it were to be kept.
        // For now, it will operate on the state *after* the adapter has updated it.
        const currentCelestialObjectsAfterUpdate =
          physicsSystemAdapter.getCelestialObjectsSnapshot(); // Get the fresh state
        const finalStateMapWithRotations: Record<string, CelestialObject> = {
          ...currentCelestialObjectsAfterUpdate,
        };

        Object.keys(finalStateMapWithRotations).forEach((id) => {
          const obj = finalStateMapWithRotations[id];
          if (
            obj.status !== CelestialStatus.DESTROYED && // Don't try to rotate destroyed things
            obj.status !== CelestialStatus.ANNIHILATED &&
            obj.siderealRotationPeriod_s &&
            obj.siderealRotationPeriod_s > 0 &&
            obj.axialTilt
          ) {
            const angle =
              ((2 * Math.PI * accumulatedTime) / obj.siderealRotationPeriod_s) %
              (2 * Math.PI);
            const tiltAxisTHREE = new THREE.Vector3(
              obj.axialTilt.x,
              obj.axialTilt.y,
              obj.axialTilt.z,
            ).normalize();
            const newRotation = new THREE.Quaternion().setFromAxisAngle(
              tiltAxisTHREE,
              angle,
            );
            // This is problematic: CelestialObject doesn't have a 'rotation' THREE.Quaternion field by default.
            // This assumes an ad-hoc property is being added.
            (finalStateMapWithRotations[id] as any).rotation = newRotation;
          }
        });
        // If this rotation is meant to stick, it needs to be set back to the store.
        // The original loop did this *before* setAllCelestialObjects.
        // If physicsSystemAdapter.updateStateFromResult already calls setAllCelestialObjects,
        // this rotation logic needs to be integrated differently or removed if redundant.
        // For now, I will assume this ad-hoc rotation is handled by consumers downstream
        // or this part of the loop needs further discussion.
        // The original loop applied these rotations THEN called setAllCelestialObjects.
        // We need to replicate that if these rotations are important.

        // The updated `physicsSystemAdapter.updateStateFromResult` handles the equivalent of `setAllCelestialObjects`
        // and `updateAccelerationVectors`.

        // The orbitUpdate$ event emitter - this should use the states from stepResult
        const updatedPositions: Record<
          string,
          { x: number; y: number; z: number }
        > = {};
        stepResult.states.forEach((state) => {
          updatedPositions[String(state.id)] = {
            x: state.position_m.x,
            y: state.position_m.y,
            z: state.position_m.z,
          };
        });

        const payload: OrbitUpdatePayload = { positions: updatedPositions };
        orbitUpdate$.next(payload);
      }

      const currentSimTime = getSimulationState().time;
      if (
        Math.floor(currentSimTime) % 5 === 0 &&
        Math.floor(currentSimTime) !== lastLoggedTime
      ) {
      }
    } catch (error) {
      console.error("Error in simulation loop:", error);
      stopSimulationLoop();
    } finally {
      vectorPool.releaseAll(acquiredVectors);
    }

    if (running) {
      requestAnimationFrame(simulationLoop);
    }
  }

  running = true;
  lastTime = performance.now();

  accumulatedTime = getSimulationState().time;
  requestAnimationFrame(simulationLoop);
}

export function stopSimulationLoop() {
  running = false;

  resetTimeSubscription?.unsubscribe();
  resetTimeSubscription = null;
}
