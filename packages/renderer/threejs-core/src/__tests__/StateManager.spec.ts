import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as THREE from "three";
import { StateManager, RendererCelestialObject } from "../StateManager";
import { simulationState, celestialObjectsStore } from "@teskooano/core-state";
import { CelestialType, PlanetProperties } from "@teskooano/data-types";

vi.mock("@teskooano/core-state", () => {
  return {
    simulationState: {
      subscribe: vi.fn(),
      get: vi.fn(),
    },
    celestialObjectsStore: {
      subscribe: vi.fn(),
      get: vi.fn(),
    },
    getChildrenOfObject: vi.fn(),
    actions: {
      updateCamera: vi.fn(),
      addCelestialObject: vi.fn(),
      updateCelestialObject: vi.fn(),
      removeCelestialObject: vi.fn(),
    },
  };
});

describe("StateManager", () => {
  let stateManager: StateManager;
  let simUnsubscribe: () => void;
  let objUnsubscribe: () => void;

  beforeEach(() => {
    vi.clearAllMocks();

    simUnsubscribe = vi.fn();
    objUnsubscribe = vi.fn();

    (simulationState.subscribe as any).mockReturnValue(simUnsubscribe);
    (celestialObjectsStore.subscribe as any).mockReturnValue(objUnsubscribe);

    (simulationState.get as any).mockReturnValue({
      camera: {
        position: { x: 0, y: 0, z: 10 },
        target: { x: 0, y: 0, z: 0 },
      },
    });

    (celestialObjectsStore.get as any).mockReturnValue({});

    stateManager = new StateManager();
  });

  afterEach(() => {
    stateManager.dispose();
  });

  it("should subscribe to state changes on initialization", () => {
    expect(simulationState.subscribe).toHaveBeenCalled();
    expect(celestialObjectsStore.subscribe).toHaveBeenCalled();
  });

  it("should notify camera subscribers when camera state changes", () => {
    const cameraCallback = vi.fn();
    stateManager.onCameraChange(cameraCallback);

    const simCallback = (simulationState.subscribe as any).mock.calls[0][0];

    simCallback({
      camera: {
        position: { x: 1, y: 2, z: 3 },
        target: { x: 4, y: 5, z: 6 },
      },
    });

    expect(cameraCallback).toHaveBeenCalledWith(
      { x: 1, y: 2, z: 3 },
      { x: 4, y: 5, z: 6 },
    );
  });

  it("should notify object subscribers when objects are added", () => {
    const objectCallback = vi.fn();
    stateManager.onObjectsChange(objectCallback);

    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    const newObject: RendererCelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 100,
      mass: 1000,
      properties: {
        type: "rocky",
        atmosphere: {
          composition: ["N2", "O2"],
          pressure: 1.0,
          color: "#87CEEB",
        },
        surface: {
          type: "rocky",
          color: "#8B4513",
          roughness: 0.7,
        },
      } as PlanetProperties,
    };

    objCallback({ "test-object": newObject }, {});

    expect(objectCallback).toHaveBeenCalledWith(
      "add",
      newObject,
      "test-object",
    );
  });

  it("should notify object subscribers when objects are updated", () => {
    const objectCallback = vi.fn();
    stateManager.onObjectsChange(objectCallback);

    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    const existingObject: RendererCelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 100,
      mass: 1000,
      properties: {
        type: "rocky",
        atmosphere: {
          composition: ["N2", "O2"],
          pressure: 1.0,
          color: "#87CEEB",
        },
        surface: {
          type: "rocky",
          color: "#8B4513",
          roughness: 0.7,
        },
      } as PlanetProperties,
    };

    const updatedObject: RendererCelestialObject = {
      ...existingObject,
      position: new THREE.Vector3(1, 1, 1),
    };

    objCallback(
      { "test-object": updatedObject },
      { "test-object": existingObject },
    );

    expect(objectCallback).toHaveBeenCalledWith(
      "update",
      updatedObject,
      "test-object",
    );
  });

  it("should notify object subscribers when objects are removed", () => {
    const objectCallback = vi.fn();
    stateManager.onObjectsChange(objectCallback);

    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    const existingObject: RendererCelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 100,
      mass: 1000,
      properties: {
        type: "rocky",
        atmosphere: {
          composition: ["N2", "O2"],
          pressure: 1.0,
          color: "#87CEEB",
        },
        surface: {
          type: "rocky",
          color: "#8B4513",
          roughness: 0.7,
        },
      } as PlanetProperties,
    };

    objCallback({}, { "test-object": existingObject });

    expect(objectCallback).toHaveBeenCalledWith(
      "remove",
      existingObject,
      "test-object",
    );
  });

  it("should return all current celestial objects", () => {
    const mockObjects = {
      "test-object-1": {
        id: "test-object-1",
        type: CelestialType.PLANET,
        name: "Test Planet 1",
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        radius: 100,
        mass: 1000,
        properties: {
          type: "rocky",
          atmosphere: {
            composition: ["N2", "O2"],
            pressure: 1.0,
            color: "#87CEEB",
          },
          surface: {
            type: "rocky",
            color: "#8B4513",
            roughness: 0.7,
          },
        } as PlanetProperties,
      },
      "test-object-2": {
        id: "test-object-2",
        type: CelestialType.STAR,
        name: "Test Star",
        position: new THREE.Vector3(100, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        radius: 500,
        mass: 10000,
        properties: {
          spectralClass: "G",
          stellarType: "main-sequence",
          luminosity: 1,
          temperature: 5778,
          color: 0xffff00,
        },
      },
    };

    (celestialObjectsStore.get as any).mockReturnValue(mockObjects);

    const objects = stateManager.getAllObjects();

    expect(objects).toEqual(mockObjects);
  });

  it("should unsubscribe from state changes on dispose", () => {
    stateManager.dispose();

    expect(simUnsubscribe).toHaveBeenCalled();
    expect(objUnsubscribe).toHaveBeenCalled();
  });

  it("should allow adding custom unsubscribe functions", () => {
    const customUnsubscribe = vi.fn();

    stateManager.addUnsubscribe(customUnsubscribe);

    stateManager.dispose();

    expect(customUnsubscribe).toHaveBeenCalled();
  });

  it("should allow unsubscribing from camera changes", () => {
    const cameraCallback = vi.fn();
    const unsubscribe = stateManager.onCameraChange(cameraCallback);

    const simCallback = (simulationState.subscribe as any).mock.calls[0][0];

    simCallback({
      camera: {
        position: { x: 1, y: 2, z: 3 },
        target: { x: 4, y: 5, z: 6 },
      },
    });

    expect(cameraCallback).toHaveBeenCalled();

    unsubscribe();

    simCallback({
      camera: {
        position: { x: 7, y: 8, z: 9 },
        target: { x: 10, y: 11, z: 12 },
      },
    });

    expect(cameraCallback).toHaveBeenCalledTimes(1);
  });

  it("should allow unsubscribing from object changes", () => {
    const objectCallback = vi.fn();
    const unsubscribe = stateManager.onObjectsChange(objectCallback);

    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    const newObject: RendererCelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 100,
      mass: 1000,
      properties: {
        type: "rocky",
        atmosphere: {
          composition: ["N2", "O2"],
          pressure: 1.0,
          color: "#87CEEB",
        },
        surface: {
          type: "rocky",
          color: "#8B4513",
          roughness: 0.7,
        },
      } as PlanetProperties,
    };

    objCallback({ "test-object": newObject }, {});

    expect(objectCallback).toHaveBeenCalled();

    unsubscribe();

    objCallback({ "test-object-2": newObject }, { "test-object": newObject });

    expect(objectCallback).toHaveBeenCalledTimes(1);
  });
});
