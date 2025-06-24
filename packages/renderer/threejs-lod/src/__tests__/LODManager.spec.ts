/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { LODManager } from "../LODManager";
import { RenderableCelestialObject } from "@teskooano/data-types";
import { LODLevel } from "../lod-manager/types";
import { CelestialType, CelestialStatus } from "@teskooano/data-types";

// Mock the core state module
vi.mock("@teskooano/core-state", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@teskooano/core-state")>();
  const { Subject } = await import("rxjs");
  const mockSubject = new Subject();
  return {
    ...mod,
    StateAccessor: {
      getCurrentSimulationState: () => ({
        performanceProfile: "medium",
      }),
      getSimulationStateStream: () => mockSubject,
    },
    // Keep the direct reference for the test
    simulationState$: mockSubject,
  };
});

describe("LODManager", () => {
  let lodManager: LODManager;
  let camera: THREE.PerspectiveCamera;
  let testObject: RenderableCelestialObject;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);

    lodManager = new LODManager(camera);

    testObject = {
      celestialObjectId: "test-planet",
      type: CelestialType.PLANET,
      name: "Test Planet",
      mass: 1e24,
      radius: 6.3e6,
      seed: "0",
      realRadius_m: 6.3e6,
      temperature: 0,
      uniforms: {},
      position: new THREE.Vector3(100, 0, 0),
      rotation: new THREE.Quaternion(),
      parentId: undefined,
      status: CelestialStatus.ACTIVE,
      properties: {
        type: CelestialType.PLANET,
        isMoon: false,
        composition: [],
      },
    };
  });

  afterEach(() => {
    lodManager.dispose();
    vi.clearAllMocks();
  });

  it("should initialize correctly", () => {
    expect(lodManager).toBeDefined();
    expect(lodManager["camera"]).toBe(camera);
  });

  it("should create and register a THREE.LOD object", () => {
    const levels: LODLevel[] = [
      { object: new THREE.Mesh(), distance: 0 },
      { object: new THREE.Mesh(), distance: 100 },
    ];

    const lod = lodManager.createAndRegisterLOD(testObject, levels);

    expect(lod).toBeInstanceOf(THREE.LOD);
    expect(lod.levels.length).toBe(2);
    expect(lod.name).toBe("test-planet-LODContainer");

    const registeredLOD = lodManager.getLODById("test-planet");
    expect(registeredLOD).toBe(lod);
  });

  it("should throw an error if no LOD levels are provided", () => {
    expect(() => lodManager.createAndRegisterLOD(testObject, [])).toThrow();
    expect(() =>
      lodManager.createAndRegisterLOD(testObject, null as any),
    ).toThrow();
  });

  it("should update all registered LODs", () => {
    const levels: LODLevel[] = [{ object: new THREE.Mesh(), distance: 0 }];
    const lod = lodManager.createAndRegisterLOD(testObject, levels);

    const updateSpy = vi.spyOn(lod, "update");
    lodManager.update();

    expect(updateSpy).toHaveBeenCalledWith(camera);
  });

  it("should remove an LOD and its resources", () => {
    const levels: LODLevel[] = [{ object: new THREE.Mesh(), distance: 0 }];
    lodManager.createAndRegisterLOD(testObject, levels);

    expect(lodManager.getLODById("test-planet")).not.toBeNull();

    lodManager.remove("test-planet");

    expect(lodManager.getLODById("test-planet")).toBeNull();
  });

  it("should clear all managed LODs", () => {
    const levels: LODLevel[] = [{ object: new THREE.Mesh(), distance: 0 }];
    lodManager.createAndRegisterLOD(testObject, levels);

    lodManager.dispose();

    expect(lodManager.getLODById("test-planet")).toBeNull();
    expect(lodManager["objectLODs"].size).toBe(0);
  });

  it("should handle debug label creation and removal", () => {
    lodManager.toggleDebug(true);

    const levels: LODLevel[] = [
      { object: new THREE.Mesh(), distance: 0 },
      { object: new THREE.Mesh(), distance: 100 },
    ];
    const lod = lodManager.createAndRegisterLOD(testObject, levels);

    expect(lodManager["debugLabels"].has("test-planet")).toBe(true);
    const debugLabel = lodManager["debugLabels"].get("test-planet");
    expect(debugLabel).toBeDefined();

    // Check if label sprite is added to the LOD object
    let hasLabel = false;
    lod.traverse((child) => {
      if (child === debugLabel?.sprite) {
        hasLabel = true;
      }
    });
    expect(hasLabel).toBe(true);

    lodManager.remove("test-planet");
    expect(lodManager["debugLabels"].has("test-planet")).toBe(false);
  });

  it("should apply scale factor based on performance profile", () => {
    // Mock the state update
    const { simulationState$ } = require("@teskooano/core-state");
    simulationState$.next({ performanceProfile: "low" });

    const levels: LODLevel[] = [{ object: new THREE.Mesh(), distance: 100 }];
    const lod = lodManager.createAndRegisterLOD(testObject, levels);

    // low profile has a 1.5x scale factor
    expect(lod.levels[0].distance).toBe(150);
  });
});
