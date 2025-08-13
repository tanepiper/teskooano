import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LightingManager } from "../managers/LightingManager";
import * as THREE from "three";
import { LightSourceComponent } from "../components/LightSourceComponent";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  StellarType,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

// Helper to create a mock renderable object for tests.
const createMockRenderableStar = (
  id: string,
  position: THREE.Vector3,
): RenderableCelestialObject => {
  return {
    id: id,
    name: `Test Star ${id}`,
    type: CelestialType.STAR,
    status: CelestialStatus.ACTIVE,
    seed: id,
    radius: 696340,
    mass: 696340000,
    realMass_kg: 1.989e30,
    position: position,
    rotation: new THREE.Quaternion(),
    realRadius_m: 696340000,
    temperature: 5778,
    orbit: {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
      realAphelion_m: 0,
      realPerihelion_m: 0,
      averageOrbitalSpeed_mps: 0,
      epoch: "J2000",
    },
    physicsStateReal: {
      id: id,
      mass_kg: 1.989e30,
      position_m: new OSVector3(position.x, position.y, position.z),
      velocity_mps: new OSVector3(),
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      stellarType: StellarType.MAIN_SEQUENCE,
      spectralClass: "G2V",
      luminosity: 1,
      color: "#FFFFFF",
    },
    uniforms: {},
  };
};

describe("LightingManager", () => {
  let lightingManager: LightingManager;
  let scene: THREE.Scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    vi.spyOn(scene, "add");
    vi.spyOn(scene, "remove");
    lightingManager = new LightingManager(scene);
  });

  afterEach(() => {
    lightingManager.dispose();
    vi.restoreAllMocks();
  });

  it("should register a light source and add its light to the scene", () => {
    const mockObject = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const component = new LightSourceComponent(mockObject);

    lightingManager.register(component);

    expect(scene.add).toHaveBeenCalledWith(component.light);
  });

  it("should register a light source and add its light to a mesh group when provided", () => {
    const mockObject = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const component = new LightSourceComponent(mockObject);
    const mockMeshGroup = new THREE.Group();
    const addSpy = vi.spyOn(mockMeshGroup, "add");

    lightingManager.register(component, mockMeshGroup);

    expect(addSpy).toHaveBeenCalledWith(component.light);
    expect(scene.add).not.toHaveBeenCalledWith(component.light);
  });

  it("should unregister a light source and remove its light from the scene", () => {
    const mockObject = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const component = new LightSourceComponent(mockObject);
    lightingManager.register(component);

    lightingManager.unregister("star1");

    expect(scene.remove).toHaveBeenCalledWith(component.light);
  });

  it("should unregister a light source and remove its light from a mesh group when attached to one", () => {
    const mockObject = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const component = new LightSourceComponent(mockObject);
    const mockMeshGroup = new THREE.Group();
    const removeSpy = vi.spyOn(mockMeshGroup, "remove");

    lightingManager.register(component, mockMeshGroup);
    lightingManager.unregister("star1");

    expect(removeSpy).toHaveBeenCalledWith(component.light);
    expect(scene.remove).not.toHaveBeenCalledWith(component.light);
  });

  it("should call dispose on the component when unregistering", () => {
    const mockObject = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const component = new LightSourceComponent(mockObject);
    const disposeSpy = vi.spyOn(component, "dispose");
    lightingManager.register(component);

    lightingManager.unregister("star1");

    expect(disposeSpy).toHaveBeenCalled();
  });

  it("should not throw when unregistering a non-existent light source", () => {
    expect(() => {
      lightingManager.unregister("nonexistent");
    }).not.toThrow();
  });

  it("should re-register a light source, removing the old one first", () => {
    const mockObject = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const component1 = new LightSourceComponent(mockObject);
    lightingManager.register(component1);

    const component2 = new LightSourceComponent(mockObject); // Same object ID
    lightingManager.register(component2);

    expect(scene.remove).toHaveBeenCalledWith(component1.light);
    expect(scene.add).toHaveBeenCalledWith(component2.light);
    expect(scene.add).toHaveBeenCalledTimes(2);
  });

  it("should update all registered light source components", () => {
    const mock1 = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const mock2 = createMockRenderableStar(
      "star2",
      new THREE.Vector3(200, 0, 0),
    );
    const comp1 = new LightSourceComponent(mock1);
    const comp2 = new LightSourceComponent(mock2);
    const update1Spy = vi.spyOn(comp1, "update");
    const update2Spy = vi.spyOn(comp2, "update");

    lightingManager.register(comp1);
    lightingManager.register(comp2);
    lightingManager.update();

    expect(update1Spy).toHaveBeenCalled();
    expect(update2Spy).toHaveBeenCalled();
  });

  it("should dispose all light sources", () => {
    const mock1 = createMockRenderableStar(
      "star1",
      new THREE.Vector3(100, 0, 0),
    );
    const mock2 = createMockRenderableStar(
      "star2",
      new THREE.Vector3(200, 0, 0),
    );
    const comp1 = new LightSourceComponent(mock1);
    const comp2 = new LightSourceComponent(mock2);
    const dispose1Spy = vi.spyOn(comp1, "dispose");
    const dispose2Spy = vi.spyOn(comp2, "dispose");

    lightingManager.register(comp1);
    lightingManager.register(comp2);
    lightingManager.dispose();

    expect(scene.remove).toHaveBeenCalledWith(comp1.light);
    expect(scene.remove).toHaveBeenCalledWith(comp2.light);
    expect(dispose1Spy).toHaveBeenCalled();
    expect(dispose2Spy).toHaveBeenCalled();
  });

  describe("getInfluentialLights", () => {
    it("should return the most influential lights for a target object", () => {
      const target = createMockRenderableStar(
        "target",
        new THREE.Vector3(0, 0, 0),
      );
      const closeStar = createMockRenderableStar(
        "closeStar",
        new THREE.Vector3(10, 0, 0),
      );
      const farStar = createMockRenderableStar(
        "farStar",
        new THREE.Vector3(1000, 0, 0),
      );

      const closeComp = new LightSourceComponent(closeStar);
      (closeComp.light as THREE.PointLight).intensity = 1.0;
      const farComp = new LightSourceComponent(farStar);
      (farComp.light as THREE.PointLight).intensity = 1.0;

      lightingManager.register(closeComp);
      lightingManager.register(farComp);

      const influential = lightingManager.getInfluentialLights(target, 4);

      expect(influential.length).toBe(1); // Far star should be below threshold
      expect(influential[0]).toBe(closeComp);
    });

    it("should not consider the target object itself as a light source", () => {
      const target = createMockRenderableStar(
        "target",
        new THREE.Vector3(0, 0, 0),
      );
      const targetComp = new LightSourceComponent(target);
      lightingManager.register(targetComp);

      const influential = lightingManager.getInfluentialLights(target);
      expect(influential.length).toBe(0);
    });

    it("should respect the maxLights limit", () => {
      const target = createMockRenderableStar(
        "target",
        new THREE.Vector3(0, 0, 0),
      );
      for (let i = 0; i < 5; i++) {
        const star = createMockRenderableStar(
          `star${i}`,
          new THREE.Vector3(10 + i, 0, 0),
        );
        const comp = new LightSourceComponent(star);
        (comp.light as THREE.PointLight).intensity = 1.0;
        lightingManager.register(comp);
      }

      const influential = lightingManager.getInfluentialLights(target, 2);
      expect(influential.length).toBe(2);
    });
  });
});
