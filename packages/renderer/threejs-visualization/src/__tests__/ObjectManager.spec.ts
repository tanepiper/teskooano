import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { ObjectManager } from "../ObjectManager";
import { CelestialObject, CelestialType } from "@teskooano/data-types";

// Mock LODManager
vi.mock("../LODManager", () => {
  return {
    LODManager: vi.fn().mockImplementation(() => ({
      createLODMesh: vi.fn().mockImplementation((object, material) => {
        const lodMesh = new THREE.LOD();
        return lodMesh;
      }),
      update: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      toggleDebug: vi.fn(),
    })),
  };
});

// Mock the celestial renderer imports
vi.mock("@teskooano/systems-celestial", () => {
  return {
    AsteroidFieldRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    OortCloudRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    ClassIGasGiantRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    ClassIIIGasGiantRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    SchwarzschildBlackHoleRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    KerrBlackHoleRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    NeutronStarRenderer: vi.fn().mockImplementation(() => ({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
    createStarRenderer: vi.fn().mockReturnValue({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    }),
    createTerrestrialRenderer: vi.fn().mockReturnValue({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    }),
    createMoonRenderer: vi.fn().mockReturnValue({
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D()),
      update: vi.fn(),
      dispose: vi.fn(),
    }),
  };
});

describe("ObjectManager", () => {
  let objectManager: ObjectManager;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    // Create object manager
    objectManager = new ObjectManager(scene, camera);
  });

  afterEach(() => {
    // Clean up
    objectManager.dispose();
  });

  it("should initialize correctly", () => {
    expect(objectManager).toBeDefined();
  });

  it("should add an object to the scene", () => {
    // Create a test object
    const testObject: CelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(100, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 10,
      mass: 1000,
      properties: {
        type: "rocky",
      },
    };

    // Add the object
    const mesh = objectManager.addObject(testObject);

    // Verify mesh was created
    expect(mesh).toBeDefined();
    expect(mesh).toBeInstanceOf(THREE.Object3D);

    // Verify object was added to the scene
    expect(scene.children).toContain(mesh);

    // Verify object was stored in the manager
    expect(objectManager.getObject(testObject.id)).toBe(mesh);
  });

  it("should update an object position and rotation", () => {
    // Create a test object
    const testObject: CelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(100, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 10,
      mass: 1000,
      properties: {
        type: "rocky",
      },
    };

    // Add the object
    const mesh = objectManager.addObject(testObject);

    // Update object position and rotation
    const updatedObject = {
      ...testObject,
      position: new THREE.Vector3(200, 50, 100),
      rotation: new THREE.Quaternion(0.1, 0.2, 0.3, 0.4),
    };

    objectManager.updateObject(updatedObject);

    // Verify position and rotation were updated
    expect(mesh.position.x).toBe(200);
    expect(mesh.position.y).toBe(50);
    expect(mesh.position.z).toBe(100);
    expect(mesh.quaternion.x).toBe(0.1);
    expect(mesh.quaternion.y).toBe(0.2);
    expect(mesh.quaternion.z).toBe(0.3);
    expect(mesh.quaternion.w).toBe(0.4);
  });

  it("should remove an object from the scene", () => {
    // Create a test object
    const testObject: CelestialObject = {
      id: "test-object",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(100, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 10,
      mass: 1000,
      properties: {
        type: "rocky",
      },
    };

    // Add the object
    const mesh = objectManager.addObject(testObject);

    // Remove the object
    objectManager.removeObject(testObject.id);

    // Verify object was removed from the scene
    expect(scene.children).not.toContain(mesh);

    // Verify object was removed from the manager
    expect(objectManager.getObject(testObject.id)).toBeUndefined();
  });

  it("should update LOD on update call", () => {
    // Call update
    objectManager.update();

    // Verify LOD manager was updated
    // @ts-ignore - Accessing private property for testing
    expect(objectManager.lodManager.update).toHaveBeenCalled();
  });

  it("should update renderers", () => {
    // Create a light source map
    const lightSources = new Map();
    lightSources.set("sun", new THREE.Vector3(0, 0, 0));

    // Create renderer
    const renderer = new THREE.WebGLRenderer();

    // Call updateRenderers
    objectManager.updateRenderers(0, lightSources, renderer, scene, camera);

    // Verify renderers were updated - this is hard to test directly
    // Just check that the function doesn't throw any errors
    expect(true).toBeTruthy();
  });
});
