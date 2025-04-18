import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as THREE from "three";
import { StateManager, RendererCelestialObject } from "../StateManager";
import { simulationState, celestialObjectsStore } from "@teskooano/core-state";
import { CelestialType, PlanetProperties } from "@teskooano/data-types";

// Mock the state stores
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
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock unsubscribe functions
    simUnsubscribe = vi.fn();
    objUnsubscribe = vi.fn();

    // Setup mock subscribe functions
    (simulationState.subscribe as any).mockReturnValue(simUnsubscribe);
    (celestialObjectsStore.subscribe as any).mockReturnValue(objUnsubscribe);

    // Setup default state
    (simulationState.get as any).mockReturnValue({
      camera: {
        position: { x: 0, y: 0, z: 10 },
        target: { x: 0, y: 0, z: 0 },
      },
    });

    (celestialObjectsStore.get as any).mockReturnValue({});

    // Create the state manager
    stateManager = new StateManager();
  });

  afterEach(() => {
    // Clean up
    stateManager.dispose();
  });

  it("should subscribe to state changes on initialization", () => {
    expect(simulationState.subscribe).toHaveBeenCalled();
    expect(celestialObjectsStore.subscribe).toHaveBeenCalled();
  });

  it("should notify camera subscribers when camera state changes", () => {
    // Setup a camera subscriber
    const cameraCallback = vi.fn();
    stateManager.onCameraChange(cameraCallback);

    // Get the simulation state callback
    const simCallback = (simulationState.subscribe as any).mock.calls[0][0];

    // Call the callback with new camera state
    simCallback({
      camera: {
        position: { x: 1, y: 2, z: 3 },
        target: { x: 4, y: 5, z: 6 },
      },
    });

    // Check that the camera callback was called with the new state
    expect(cameraCallback).toHaveBeenCalledWith(
      { x: 1, y: 2, z: 3 },
      { x: 4, y: 5, z: 6 },
    );
  });

  it("should notify object subscribers when objects are added", () => {
    // Setup an object subscriber
    const objectCallback = vi.fn();
    stateManager.onObjectsChange(objectCallback);

    // Get the celestial objects callback
    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    // Create a new object
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

    // Call the callback with the new object
    objCallback({ "test-object": newObject }, {});

    // Check that the object callback was called with the new object
    expect(objectCallback).toHaveBeenCalledWith(
      "add",
      newObject,
      "test-object",
    );
  });

  it("should notify object subscribers when objects are updated", () => {
    // Setup an object subscriber
    const objectCallback = vi.fn();
    stateManager.onObjectsChange(objectCallback);

    // Get the celestial objects callback
    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    // Create an existing object
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

    // Create an updated object with a different position
    const updatedObject: RendererCelestialObject = {
      ...existingObject,
      position: new THREE.Vector3(1, 1, 1),
    };

    // Call the callback with the updated object
    objCallback(
      { "test-object": updatedObject },
      { "test-object": existingObject },
    );

    // Check that the object callback was called with the updated object
    expect(objectCallback).toHaveBeenCalledWith(
      "update",
      updatedObject,
      "test-object",
    );
  });

  it("should notify object subscribers when objects are removed", () => {
    // Setup an object subscriber
    const objectCallback = vi.fn();
    stateManager.onObjectsChange(objectCallback);

    // Get the celestial objects callback
    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    // Create an existing object
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

    // Call the callback with the object removed
    objCallback({}, { "test-object": existingObject });

    // Check that the object callback was called with the removed object
    expect(objectCallback).toHaveBeenCalledWith(
      "remove",
      existingObject,
      "test-object",
    );
  });

  it("should return all current celestial objects", () => {
    // Setup mock objects
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

    // Get all objects
    const objects = stateManager.getAllObjects();

    // Check that the objects are returned correctly
    expect(objects).toEqual(mockObjects);
  });

  it("should unsubscribe from state changes on dispose", () => {
    // Dispose the state manager
    stateManager.dispose();

    // Check that the unsubscribe functions were called
    expect(simUnsubscribe).toHaveBeenCalled();
    expect(objUnsubscribe).toHaveBeenCalled();
  });

  it("should allow adding custom unsubscribe functions", () => {
    // Create a custom unsubscribe function
    const customUnsubscribe = vi.fn();

    // Add the unsubscribe function
    stateManager.addUnsubscribe(customUnsubscribe);

    // Dispose the state manager
    stateManager.dispose();

    // Check that the custom unsubscribe function was called
    expect(customUnsubscribe).toHaveBeenCalled();
  });

  it("should allow unsubscribing from camera changes", () => {
    // Setup a camera subscriber
    const cameraCallback = vi.fn();
    const unsubscribe = stateManager.onCameraChange(cameraCallback);

    // Get the simulation state callback
    const simCallback = (simulationState.subscribe as any).mock.calls[0][0];

    // Call the callback with new camera state
    simCallback({
      camera: {
        position: { x: 1, y: 2, z: 3 },
        target: { x: 4, y: 5, z: 6 },
      },
    });

    // Check that the camera callback was called
    expect(cameraCallback).toHaveBeenCalled();

    // Unsubscribe from camera changes
    unsubscribe();

    // Call the callback again
    simCallback({
      camera: {
        position: { x: 7, y: 8, z: 9 },
        target: { x: 10, y: 11, z: 12 },
      },
    });

    // Check that the camera callback was only called once
    expect(cameraCallback).toHaveBeenCalledTimes(1);
  });

  it("should allow unsubscribing from object changes", () => {
    // Setup an object subscriber
    const objectCallback = vi.fn();
    const unsubscribe = stateManager.onObjectsChange(objectCallback);

    // Get the celestial objects callback
    const objCallback = (celestialObjectsStore.subscribe as any).mock
      .calls[0][0];

    // Create a new object
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

    // Call the callback with the new object
    objCallback({ "test-object": newObject }, {});

    // Check that the object callback was called
    expect(objectCallback).toHaveBeenCalled();

    // Unsubscribe from object changes
    unsubscribe();

    // Call the callback again
    objCallback({ "test-object-2": newObject }, { "test-object": newObject });

    // Check that the object callback was only called once
    expect(objectCallback).toHaveBeenCalledTimes(1);
  });
});
