import {
  updateSimulation,
  vectorPool,
  type PhysicsStateReal,
  type SimulationStepResult,
  type DestructionEvent,
  type SimulationParameters,
} from "@teskooano/core-physics";
import {
  getCelestialObjects,
  getSimulationState,
  setAllCelestialObjects,
  setSimulationState,
  updateAccelerationVectors,
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
    console.log(
      "[SimulationLoop] Resetting accumulated time via resetTime$ subject.",
    );
  });

  function simulationLoop() {
    const acquiredVectors: THREE.Vector3[] = [];

    try {
      if (!running) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const fixedDeltaTime = Math.min(deltaTime, 0.001);

      if (!getSimulationState().paused) {
        const timeScale = getSimulationState().timeScale;
        const scaledDeltaTime = fixedDeltaTime * timeScale;
        accumulatedTime += scaledDeltaTime;

        setSimulationState({
          ...getSimulationState(),
          time: accumulatedTime,
        });

        const currentCelestialObjects = getCelestialObjects();
        const activeBodiesReal = Object.values(currentCelestialObjects)
          .filter(
            (obj) =>
              obj.status !== CelestialStatus.DESTROYED && !obj.ignorePhysics,
          )
          .map((obj) => obj.physicsStateReal)
          .filter((state): state is PhysicsStateReal => !!state);

        const cameraStatePos = getSimulationState().camera.position;
        const cameraPosition = vectorPool.get(
          cameraStatePos.x,
          cameraStatePos.y,
          cameraStatePos.z,
        );
        acquiredVectors.push(cameraPosition);

        const radii = new Map<string | number, number>();
        const isStar = new Map<string | number, boolean>();
        const bodyTypes = new Map<string | number, CelestialType>();
        Object.values(currentCelestialObjects)
          .filter(
            (obj) =>
              obj.status !== CelestialStatus.DESTROYED && !obj.ignorePhysics,
          )
          .forEach((obj) => {
            if (obj.physicsStateReal) {
              radii.set(obj.id, obj.realRadius_m);
              isStar.set(obj.id, obj.type === CelestialType.STAR);
              bodyTypes.set(obj.id, obj.type);
            }
          });

        const simParams: SimulationParameters = {
          radii,
          isStar,
          bodyTypes,
        };

        const stepResult: SimulationStepResult = updateSimulation(
          activeBodiesReal,
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

        const finalStateMap: Record<string, CelestialObject> = {
          ...currentCelestialObjects,
        };

        stepResult.states.forEach((updatedState) => {
          const existingObject = finalStateMap[String(updatedState.id)];
          if (existingObject) {
            finalStateMap[String(updatedState.id)] = {
              ...existingObject,
              physicsStateReal: updatedState,
            };
          }
        });

        stepResult.destroyedIds.forEach((id) => {
          const destroyedIdStr = String(id);
          const existingObject = finalStateMap[destroyedIdStr];
          if (existingObject) {
            const destructionEvent = stepResult.destructionEvents.find(
              (event) => event.destroyedId === id,
            );
            let finalStatus = CelestialStatus.DESTROYED;

            if (destructionEvent) {
              const survivorIdStr = String(destructionEvent.survivorId);
              const survivorObject = currentCelestialObjects[survivorIdStr];
              if (
                survivorObject &&
                survivorObject.type === CelestialType.STAR
              ) {
                finalStatus = CelestialStatus.ANNIHILATED;
              } else if (destructionEvent.survivorId === "MUTUAL_DESTRUCTION") {
                finalStatus = CelestialStatus.ANNIHILATED;
              }
            } else {
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

        setAllCelestialObjects(finalStateMap);
        updateAccelerationVectors(stepResult.accelerations);

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
  console.log("[SimulationLoop] Stopped and unsubscribed from resetTime$.");
}
