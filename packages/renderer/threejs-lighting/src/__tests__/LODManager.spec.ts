/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { LODManager } from "../LODManager";
import { CelestialObject, CelestialType } from "@teskooano/data-types";

Object.defineProperties(window.document, {
  createElement: {
    value: vi.fn().mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return {
          width: 256,
          height: 128,
          getContext: vi.fn().mockReturnValue({
            clearRect: vi.fn(),
            fillStyle: "",
            fillRect: vi.fn(),
            font: "",
            textAlign: "",
            fillText: vi.fn(),
          }),
        };
      }
      return {};
    }),
    configurable: true,
  },
});

describe("LODManager", () => {
  let lodManager: LODManager;
  let camera: THREE.PerspectiveCamera;
  let testObject: CelestialObject;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);

    lodManager = new LODManager(camera);

    testObject = {
      id: "test-planet",
      type: CelestialType.PLANET,
      name: "Test Planet",
      position: new THREE.Vector3(100, 0, 0),
      rotation: new THREE.Quaternion(),
      radius: 10,
      mass: 1000,
      properties: {
        type: "rocky",
      },
    };
  });

  afterEach(() => {
    lodManager.clear();
  });

  it("should initialize correctly", () => {
    expect(lodManager).toBeDefined();
    expect(lodManager["camera"]).toBe(camera);
  });

  it("should create LOD mesh for a celestial object", () => {
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    const lodMesh = lodManager.createLODMesh(testObject, material);

    expect(lodMesh).toBeInstanceOf(THREE.LOD);

    expect(lodMesh.levels.length).toBe(4);

    lodMesh.levels.forEach((level, index) => {
      const mesh = level.object as THREE.Mesh;
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.material).toBe(material);
      expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);

      const expectedDistances = [0, 100, 1000, 10000];
      expect(level.distance).toBe(expectedDistances[index]);
    });
  });

  it("should update LOD based on camera position", () => {
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    const lodMesh = lodManager.createLODMesh(testObject, material);

    lodMesh.position.copy(testObject.position);

    lodManager.toggleDebug(true);

    lodManager.update();

    const distance = lodMesh
      .getWorldPosition(new THREE.Vector3())
      .distanceTo(camera.position);

    const currentLevel = lodMesh.getCurrentLevel();

    lodMesh.levels.forEach((level, index) => {
      console.log(`[TEST] LOD level ${index}: distance = ${level.distance}`);
    });

    expect(lodMesh.getCurrentLevel()).toBe(1);

    camera.position.set(90, 0, 0);
    lodManager.update();

    const distance2 = lodMesh
      .getWorldPosition(new THREE.Vector3())
      .distanceTo(camera.position);
    console.log(
      `[TEST] Distance between camera and LOD mesh (after moving closer): ${distance2}`,
    );

    const currentLevel2 = lodMesh.getCurrentLevel();
    console.log(
      `[TEST] Current LOD level (after moving closer): ${currentLevel2}`,
    );

    expect(lodMesh.getCurrentLevel()).toBe(1);

    camera.position.set(0, 0, 0);
    lodManager.update();
    expect(lodMesh.getCurrentLevel()).toBe(1);
  });

  it("should create different LOD levels for different object types", () => {
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    const moonObject = { ...testObject, type: CelestialType.MOON };
    const moonLOD = lodManager.createLODMesh(moonObject, material);
    expect(moonLOD.levels.length).toBe(4);
    expect(moonLOD.levels[1].distance).toBe(50);

    const asteroidObject = { ...testObject, type: CelestialType.SPACE_ROCK };
    const asteroidLOD = lodManager.createLODMesh(asteroidObject, material);
    expect(asteroidLOD.levels.length).toBe(4);
    expect(asteroidLOD.levels[1].distance).toBe(25);

    const starObject = { ...testObject, type: CelestialType.STAR };
    const starLOD = lodManager.createLODMesh(starObject, material);
    expect(starLOD.levels.length).toBe(3);
    expect(starLOD.levels[1].distance).toBe(2000);
  });

  it("should handle debug visualization", () => {
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const lodMesh = lodManager.createLODMesh(testObject, material);

    lodManager.toggleDebug(true);
    lodManager.update();

    const debugLabels = lodManager["debugLabels"];
    expect(debugLabels.size).toBe(1);

    const debugLabel = debugLabels.get(testObject.id);
    expect(debugLabel).toBeDefined();
    expect(debugLabel?.sprite).toBeInstanceOf(THREE.Sprite);
    expect(debugLabel?.sprite.visible).toBe(true);

    lodManager.toggleDebug(false);
    expect(debugLabel?.sprite.visible).toBe(false);
  });
});
