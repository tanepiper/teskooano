import {
  updateSimulation,
  vectorPool,
  type PhysicsStateReal,
  type SimulationStepResult,
  type DestructionEvent,
} from "@teskooano/core-physics";
import {
  celestialActions,
  celestialObjectsStore,
  simulationState,
  updateAccelerationVectors,
  updatePhysicsState,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import * as THREE from "three";
import { rendererEvents } from "@teskooano/renderer-threejs-core";

let lastTime = performance.now();
let running = true;
let lastLoggedTime = 0;
let accumulatedTime = 0; // Track simulation time accumulation

// Event listener for simulation time reset
window.addEventListener("resetSimulationTime", () => {
  accumulatedTime = 0;
  // Also update the simulation state directly
  simulationState.set({
    ...simulationState.get(),
    time: 0,
  });
});

// Removed Octree Initialization

export function startSimulationLoop() {
  function simulationLoop() {
    const acquiredVectors: THREE.Vector3[] = [];

    try {
      // Wrap main logic in try block for cleanup
      if (!running) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      const fixedDeltaTime = Math.min(deltaTime, 0.01); // Cap at 100fps rate for physics
      // const fixedDeltaTime = Math.min(deltaTime, 0.001); // TEST: Cap at 1000fps physics rate

      if (!simulationState.get().paused) {
        const timeScale = simulationState.get().timeScale;
        const scaledDeltaTime = fixedDeltaTime * timeScale;
        accumulatedTime += scaledDeltaTime;

        simulationState.set({
          ...simulationState.get(),
          time: accumulatedTime,
        });

        const currentCelestialObjects = celestialObjectsStore.get();
        // Filter out destroyed objects before sending to physics engine
        const activeBodiesReal = Object.values(currentCelestialObjects)
          .filter(
            (obj) =>
              obj.status !== CelestialStatus.DESTROYED && !obj.ignorePhysics,
          ) // <-- Filter by status AND ignorePhysics
          .map((obj) => obj.physicsStateReal)
          .filter((state): state is PhysicsStateReal => !!state); // Ensure state exists

        const cameraStatePos = simulationState.get().camera.position;
        const cameraPosition = vectorPool.get(
          cameraStatePos.x,
          cameraStatePos.y,
          cameraStatePos.z,
        );
        acquiredVectors.push(cameraPosition);

        const celestialObjects = currentCelestialObjects;

        // --- Construct maps needed for collision detection ---
        const radii = new Map<string | number, number>();
        const isStar = new Map<string | number, boolean>();
        const bodyTypes = new Map<string | number, CelestialType>();
        Object.values(currentCelestialObjects)
          .filter(
            (obj) =>
              obj.status !== CelestialStatus.DESTROYED && !obj.ignorePhysics,
          ) // <-- Filter here too for consistency
          .forEach((obj) => {
            if (obj.physicsStateReal) {
              // Only include objects with physics state
              radii.set(obj.id, obj.realRadius_m);
              isStar.set(obj.id, obj.type === CelestialType.STAR);
              bodyTypes.set(obj.id, obj.type);
            }
          });
        // --- End map construction ---

        // --- Call the centralized physics simulation update ---
        // Includes integration and collision handling
        const stepResult: SimulationStepResult = updateSimulation(
          activeBodiesReal, // <-- Pass filtered list
          scaledDeltaTime,
          radii, // Pass radii map
          isStar, // Pass isStar map
          bodyTypes, // Pass bodyTypes map
          // Optional Octree params can be added here if needed:
          // octreeSize, barnesHutTheta
        );
        // --- End Physics Update ---

        // --- Handle Destruction Events (Emit visuals) ---
        if (
          stepResult.destructionEvents &&
          stepResult.destructionEvents.length > 0
        ) {
          stepResult.destructionEvents.forEach((event: DestructionEvent) => {
            // console.log('[SimulationLoop] Destruction Occurred:', event);
            rendererEvents.emit("destruction:occurred", event);
          });
        }
        // --- End Destruction Event Handling ---

        // --- Prepare Final State for Store Update ---
        const finalStateMap: Record<string, CelestialObject> = {
          ...currentCelestialObjects,
        };

        // 1. Update physics state for survivors
        stepResult.states.forEach((updatedState) => {
          const existingObject = finalStateMap[String(updatedState.id)];
          if (existingObject) {
            finalStateMap[String(updatedState.id)] = {
              ...existingObject,
              physicsStateReal: updatedState,
            };
          }
        });

        // 2. Mark destroyed objects (determine status based on survivor)
        stepResult.destroyedIds.forEach((id) => {
          const destroyedIdStr = String(id);
          const existingObject = finalStateMap[destroyedIdStr];
          if (existingObject) {
            // Find the corresponding destruction event to identify the survivor
            const destructionEvent = stepResult.destructionEvents.find(
              (event) => event.destroyedId === id,
            );
            let finalStatus = CelestialStatus.DESTROYED; // Default to destroyed (shattered)

            if (destructionEvent) {
              const survivorIdStr = String(destructionEvent.survivorId);
              // Check the type of the survivor using the original map (currentCelestialObjects)
              const survivorObject = currentCelestialObjects[survivorIdStr];
              if (
                survivorObject &&
                survivorObject.type === CelestialType.STAR
              ) {
                finalStatus = CelestialStatus.ANNIHILATED;
              } else if (destructionEvent.survivorId === "MUTUAL_DESTRUCTION") {
                // Handle Moon vs Moon mutual destruction - mark as annihilated for simplicity?
                finalStatus = CelestialStatus.ANNIHILATED;
              }
            } else {
              // This case shouldn't happen if physics generates events correctly, but handle defensively
              console.warn(
                `[SimulationLoop] Cannot find destruction event for destroyed ID: ${id}. Defaulting to DESTROYED status.`,
              );
            }

            finalStateMap[destroyedIdStr] = {
              ...existingObject,
              status: finalStatus,
            };
          }
        });

        // 3. Apply Rotations to the final state map
        Object.keys(finalStateMap).forEach((id) => {
          const obj = finalStateMap[id];
          if (
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
            finalStateMap[id] = { ...obj, rotation: newRotation };
          }
          // Ensure physics state is present even if not updated by physics step (for destroyed objects etc)
          if (
            !finalStateMap[id].physicsStateReal &&
            currentCelestialObjects[id]?.physicsStateReal
          ) {
            finalStateMap[id] = {
              ...obj,
              physicsStateReal: currentCelestialObjects[id].physicsStateReal,
            };
          }
        });
        // --- End Prepare Final State ---

        // --- Update State Stores (Single Update for Celestials) ---
        // Step 1: Set the complete celestial object state
        celestialObjectsStore.set(finalStateMap);

        // Step 2: Update the acceleration vector store separately
        updateAccelerationVectors(stepResult.accelerations);
        // --- End State Updates ---

        // Dispatch event for OrbitManager to update lines
        const orbitUpdateEvent = new CustomEvent("orbitUpdate", {
          detail: { time: accumulatedTime },
        });
        window.dispatchEvent(orbitUpdateEvent);
      }

      // Debug logging remains the same...
      const currentSimTime = simulationState.get().time;
      if (
        Math.floor(currentSimTime) % 5 === 0 &&
        Math.floor(currentSimTime) !== lastLoggedTime
      ) {
        // ... logging code ...
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
  accumulatedTime = simulationState.get().time;
  requestAnimationFrame(simulationLoop);
}

export function stopSimulationLoop() {
  running = false;
}
