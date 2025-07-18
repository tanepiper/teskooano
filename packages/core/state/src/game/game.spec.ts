import { beforeEach, describe, expect, it, vi } from "vitest";

import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  OrbitalParameters,
  PhysicsStateReal,
  PlanetAtmosphereProperties,
} from "@teskooano/data-types";

import { Quaternion } from "three";
import { celestialManager } from "./managers/celestialManager";
import { celestialStore } from "./stores/celestialStore";
import { simulationStateService } from "./simulation";
import type { SimulationState } from "./types";

const createMinimalRealState = (
  id: string,
  mass: number = 1e6,
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3().setZero(),
  velocity_mps: new OSVector3().setZero(),
  // ticksSinceLastPhysicsUpdate: 0, // Optional, can be omitted
});

const createMockObject = (
  id: string,
  name: string = `Obj ${id}`,
  type: CelestialType = CelestialType.PLANET,
  parentId?: string,
): CelestialObject => ({
  id,
  name,
  type,
  realRadius_m: 1e6,
  realMass_kg: 1e22,
  orbit: {} as OrbitalParameters,
  temperature: 273,
  physicsStateReal: createMinimalRealState(id, 1e22),
  parentId,
  status: CelestialStatus.ACTIVE,
  properties: {
    type: CelestialType.PLANET,
    isMoon: false,
    composition: ["silicate", "iron"],
  },
  rotation: new Quaternion(),
  // celestialBodyType: type, // Removed, not a root property
  // properties field would contain more specific type info if needed
});

describe("Celestial Objects Store", () => {
  beforeEach(() => {
    celestialStore.setAllObjects({});
  });

  it("should add a celestial object", () => {
    const obj = createMockObject("planet1");
    celestialManager.addObject(obj);
    const state = celestialStore.getObjects();
    expect(state["planet1"]).toEqual(obj);
    expect(Object.keys(state).length).toBe(1);
  });

  it("should update an existing celestial object", () => {
    const obj1 = createMockObject("star1", "Sol", CelestialType.STAR);
    celestialManager.addObject(obj1);
    const updatedFields = { name: "Updated Sol" };
    celestialManager.updateObject(obj1.id, updatedFields);
    const state = celestialStore.getObjects();
    expect(state["star1"]).toEqual(expect.objectContaining(updatedFields));
    expect(state["star1"].name).toBe("Updated Sol");
  });

  it("should remove a celestial object", () => {
    const obj1 = createMockObject(
      "moon1",
      "Luna",
      CelestialType.MOON,
      "planet1",
    );
    const obj2 = createMockObject("planet1");
    celestialManager.addObject(obj1);
    celestialManager.addObject(obj2);
    celestialManager.removeObject("moon1");
    const state = celestialStore.getObjects();
    expect(state["moon1"]).toBeUndefined();
    expect(state["planet1"]).toEqual(obj2);
    expect(Object.keys(state).length).toBe(1);
  });
});

describe("Simulation State Actions", () => {
  beforeEach(() => {
    simulationStateService.setSimulationState({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: {
        position: new OSVector3(0, 0, 1000),
        target: new OSVector3(0, 0, 0),
        fov: 60,
      },
      simulationConfig: {
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
      },
      visualSettings: {
        trailLengthMultiplier: 1,
        showAllOrbits: true,
        showAllLabels: false,
        showAuMarkers: true,
        predictionSteps: 500,
        predictionDuration: 2,
      },
      performanceProfile: "medium",
    });

    celestialStore.setAllObjects({
      obj1: createMockObject("obj1"),
      obj2: createMockObject("obj2"),
    });
  });

  it("should select an object", () => {
    simulationStateService.selectObject("obj1");
    const state = simulationStateService.getSimulationState();
    expect(state.selectedObject).toBe("obj1");
  });

  it("should deselect object if null is passed", () => {
    simulationStateService.selectObject("obj1");
    simulationStateService.selectObject(null);
    const state = simulationStateService.getSimulationState();
    expect(state.selectedObject).toBeNull();
  });

  it("should not select a non-existent object", () => {
    simulationStateService.selectObject("nonexistent");
    const state = simulationStateService.getSimulationState();
    expect(state.selectedObject).toBe("nonexistent");
  });

  it("should focus an object", () => {
    simulationStateService.setFocusedObject("obj2");
    const state = simulationStateService.getSimulationState();
    expect(state.focusedObjectId).toBe("obj2");
  });

  it("should unfocus object if null is passed", () => {
    simulationStateService.setFocusedObject("obj2");
    simulationStateService.setFocusedObject(null);
    const state = simulationStateService.getSimulationState();
    expect(state.focusedObjectId).toBeNull();
  });

  it("should not focus a non-existent object", () => {
    simulationStateService.setFocusedObject("nonexistent");
    const state = simulationStateService.getSimulationState();
    expect(state.focusedObjectId).toBe("nonexistent");
  });
});

describe("Simulation Actions (Extended)", () => {
  beforeEach(() => {
    simulationStateService.setSimulationState({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: {
        position: new OSVector3(0, 0, 1000),
        target: new OSVector3(0, 0, 0),
        fov: 60,
      },
      simulationConfig: {
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
      },
      visualSettings: {
        trailLengthMultiplier: 1,
        showAllOrbits: true,
        showAllLabels: false,
        showAuMarkers: true,
        predictionSteps: 500,
        predictionDuration: 2,
      },
      performanceProfile: "medium",
    });
    celestialStore.setAllObjects({});
  });

  describe("simulation general actions", () => {
    it("should initialize with default values (covered by beforeEach and getCurrentState)", () => {
      const state = simulationStateService.getSimulationState();
      expect(state.time).toBe(0);
      expect(state.timeScale).toBe(1);
    });

    it("should update timeScale", () => {
      simulationStateService.setTimeScale(2);
      expect(simulationStateService.getSimulationState().timeScale).toBe(2);
    });

    it("should toggle pause state", () => {
      simulationStateService.togglePause();
      expect(simulationStateService.getSimulationState().paused).toBe(true);
      simulationStateService.togglePause();
      expect(simulationStateService.getSimulationState().paused).toBe(false);
    });

    it("should update camera position and target", () => {
      const newPosition = new OSVector3(100, 200, 300);
      const newTarget = new OSVector3(0, 0, 0);
      simulationStateService.updateCamera(newPosition, newTarget);
      const cameraState = simulationStateService.getSimulationState().camera;
      expect(cameraState.position.x).toBe(100);
      expect(cameraState.position.y).toBe(200);
      expect(cameraState.position.z).toBe(300);
      expect(cameraState.target.x).toBe(0);
      expect(cameraState.target.y).toBe(0);
      expect(cameraState.target.z).toBe(0);
    });
  });
});
