import { beforeEach, describe, expect, it, vi } from "vitest";

import { OSVector3 } from "@teskooano/core-math";
import {
  BaseSurfaceProperties,
  CelestialObject,
  CelestialStatus,
  CelestialType,
  OrbitalParameters,
  PhysicsStateReal,
  PlanetAtmosphereProperties,
  SurfaceType,
} from "@teskooano/data-types";

import { Quaternion } from "three";
import { celestialActions } from "./celestialActions";
import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";
import type { SimulationState } from "./types";

const createMinimalRealState = (
  id: string,
  mass: number = 1e6,
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(0, 0, 0),
  velocity_mps: new OSVector3(0, 0, 0),
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
  atmosphere: {
    glowColor: "#ffffff",
    intensity: 0.5,
    power: 1,
    thickness: 0.1,
  } as PlanetAtmosphereProperties,
  surface: {
    type: SurfaceType.VARIED,
    color: "#aaaaaa",
    roughness: 0.5,
  } as BaseSurfaceProperties,
  rotation: new Quaternion(),
  // celestialBodyType: type, // Removed, not a root property
  // properties field would contain more specific type info if needed
});

describe("Celestial Objects Store", () => {
  beforeEach(() => {
    gameStateService.setAllCelestialObjects({});
  });

  it("should add a celestial object", () => {
    const obj = createMockObject("planet1");
    celestialActions.addCelestialObject(obj);
    const state = gameStateService.getCelestialObjects();
    expect(state["planet1"]).toEqual(obj);
    expect(Object.keys(state).length).toBe(1);
  });

  it("should update an existing celestial object", () => {
    const obj1 = createMockObject("star1", "Sol", CelestialType.STAR);
    celestialActions.addCelestialObject(obj1);
    const updatedFields = { name: "Updated Sol" };
    celestialActions.updateCelestialObject(obj1.id, updatedFields);
    const state = gameStateService.getCelestialObjects();
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
    celestialActions.addCelestialObject(obj1);
    celestialActions.addCelestialObject(obj2);
    celestialActions.removeCelestialObject("moon1");
    const state = gameStateService.getCelestialObjects();
    expect(state["moon1"]).toBeUndefined();
    expect(state["planet1"]).toEqual(obj2);
    expect(Object.keys(state).length).toBe(1);
  });
});

describe("Simulation State Actions", () => {
  beforeEach(() => {
    simulationStateService.setState({
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
      physicsEngine: "verlet",
      visualSettings: { trailLengthMultiplier: 1 },
      performanceProfile: "medium",
    });

    gameStateService.setAllCelestialObjects({
      obj1: createMockObject("obj1"),
      obj2: createMockObject("obj2"),
    });
  });

  it("should select an object", () => {
    simulationStateService.selectObject("obj1");
    const state = simulationStateService.getCurrentState();
    expect(state.selectedObject).toBe("obj1");
  });

  it("should deselect object if null is passed", () => {
    simulationStateService.selectObject("obj1");
    simulationStateService.selectObject(null);
    const state = simulationStateService.getCurrentState();
    expect(state.selectedObject).toBeNull();
  });

  it("should not select a non-existent object", () => {
    simulationStateService.selectObject("nonexistent");
    const state = simulationStateService.getCurrentState();
    expect(state.selectedObject).toBe("nonexistent");
  });

  it("should focus an object", () => {
    simulationStateService.setFocusedObject("obj2");
    const state = simulationStateService.getCurrentState();
    expect(state.focusedObjectId).toBe("obj2");
  });

  it("should unfocus object if null is passed", () => {
    simulationStateService.setFocusedObject("obj2");
    simulationStateService.setFocusedObject(null);
    const state = simulationStateService.getCurrentState();
    expect(state.focusedObjectId).toBeNull();
  });

  it("should not focus a non-existent object", () => {
    simulationStateService.setFocusedObject("nonexistent");
    const state = simulationStateService.getCurrentState();
    expect(state.focusedObjectId).toBe("nonexistent");
  });
});

describe("Simulation Actions (Extended)", () => {
  beforeEach(() => {
    simulationStateService.setState({
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
      physicsEngine: "verlet",
      visualSettings: { trailLengthMultiplier: 1 },
      performanceProfile: "medium",
    });
    gameStateService.setAllCelestialObjects({});
  });

  describe("simulation general actions", () => {
    it("should initialize with default values (covered by beforeEach and getCurrentState)", () => {
      const state = simulationStateService.getCurrentState();
      expect(state.time).toBe(0);
      expect(state.timeScale).toBe(1);
    });

    it("should update timeScale", () => {
      simulationStateService.setTimeScale(2);
      expect(simulationStateService.getCurrentState().timeScale).toBe(2);
    });

    it("should toggle pause state", () => {
      simulationStateService.togglePause();
      expect(simulationStateService.getCurrentState().paused).toBe(true);
      simulationStateService.togglePause();
      expect(simulationStateService.getCurrentState().paused).toBe(false);
    });

    it("should update camera position and target", () => {
      const newPosition = new OSVector3(100, 200, 300);
      const newTarget = new OSVector3(0, 0, 0);
      simulationStateService.updateCamera(newPosition, newTarget);
      const cameraState = simulationStateService.getCurrentState().camera;
      expect(cameraState.position.x).toBe(100);
      expect(cameraState.position.y).toBe(200);
      expect(cameraState.position.z).toBe(300);
      expect(cameraState.target.x).toBe(0);
      expect(cameraState.target.y).toBe(0);
      expect(cameraState.target.z).toBe(0);
    });
  });
});
