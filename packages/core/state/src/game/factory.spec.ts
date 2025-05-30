import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  LuminosityClass,
  SpectralClass,
  StellarType,
} from "@teskooano/data-types";
import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import {
  celestialFactory,
  celestialHierarchyStore,
  celestialObjectsStore,
  simulationState,
} from "./index";

describe("Factory functions", () => {
  beforeEach(() => {
    const cameraPos = new OSVector3(0, 0, 1000).toThreeJS();
    const cameraTarget = new OSVector3(0, 0, 0).toThreeJS();

    simulationState.set({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: {
        position: cameraPos,
        target: cameraTarget,
        fov: 60,
      },
    } as any);
    celestialObjectsStore.set({});
    celestialHierarchyStore.set({});
  });

  describe("clearState", () => {
    it("should clear all celestial objects and hierarchy by default", () => {
      const objectPos = new OSVector3(0, 0, 0).toThreeJS();
      const objectVel = new OSVector3(0, 0, 0).toThreeJS();

      celestialObjectsStore.set({
        "test-1": {
          id: "test-1",
          name: "Test Object",
          type: CelestialType.PLANET,
          position: objectPos,
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          mass: 1000,
          radius: 100,
          properties: {
            type: CelestialType.PLANET,
            isMoon: false,
            composition: ["silicate", "iron"],
            atmosphere: {
              composition: ["N2", "O2"],
              pressure: 1.0,
              color: "#ADD8E6",
            },
            surface: {
              type: "ROCKY" as any,
              color: "#4B6F44",
              roughness: 0.7,
            },
          },
          physicsState: {
            id: "test-1",
            mass: 1000,
            position: objectPos,
            velocity: objectVel,
          },
        } as any,
      });
      celestialHierarchyStore.set({
        "parent-1": ["test-1"],
      });
      simulationState.set({
        ...simulationState.get(),
        time: 100,
        timeScale: 2,
        paused: true,
        selectedObject: "test-1",
        focusedObjectId: "test-1",
      });

      expect(Object.keys(celestialObjectsStore.get()).length).toBe(1);
      expect(Object.keys(celestialHierarchyStore.get()).length).toBe(1);
      expect(simulationState.get().timeScale).toBe(2);
      expect(simulationState.get().selectedObject).toBe("test-1");

      celestialFactory.clearState();

      expect(Object.keys(celestialObjectsStore.get()).length).toBe(0);
      expect(Object.keys(celestialHierarchyStore.get()).length).toBe(0);
      expect(simulationState.get().timeScale).toBe(1);
      expect(simulationState.get().selectedObject).toBeNull();
      expect(simulationState.get().focusedObjectId).toBeNull();

      expect(simulationState.get().camera.position.z).toBe(1000);
    });

    it("should respect resetCamera option", () => {
      const customPos = new OSVector3(500, 500, 500).toThreeJS();
      const customTarget = new OSVector3(100, 100, 100).toThreeJS();

      simulationState.set({
        ...simulationState.get(),
        camera: {
          position: customPos as any,
          target: customTarget as any,
          fov: 45,
        },
      });

      expect(simulationState.get().camera.position.x).toBe(500);
      expect(simulationState.get().camera.fov).toBe(45);

      celestialFactory.clearState({ resetCamera: true });

      expect(simulationState.get().camera.position.x).toBe(0);
      expect(simulationState.get().camera.position.y).toBe(0);
      expect(simulationState.get().camera.position.z).toBe(1000);
      expect(simulationState.get().camera.fov).toBe(60);
    });

    it("should respect resetTime option", () => {
      simulationState.set({
        ...simulationState.get(),
        time: 100,
        timeScale: 2,
        paused: true,
      });

      celestialFactory.clearState({ resetTime: false });

      expect(simulationState.get().time).toBe(100);
      expect(simulationState.get().timeScale).toBe(2);
      expect(simulationState.get().paused).toBe(true);
    });

    it("should respect resetSelection option", () => {
      simulationState.set({
        ...simulationState.get(),
        selectedObject: "test-1",
        focusedObjectId: "test-2",
      });

      celestialFactory.clearState({ resetSelection: false });

      expect(simulationState.get().selectedObject).toBe("test-1");
      expect(simulationState.get().focusedObjectId).toBe("test-2");
    });
  });

  describe("createSolarSystem", () => {
    it("should clear all state before creating a new system", () => {
      const starPos = new OSVector3(0, 0, 0).toThreeJS();
      const stateRealPos = new OSVector3(0, 0, 0).toThreeJS();
      const stateRealVel = new OSVector3(0, 0, 0).toThreeJS();

      celestialObjectsStore.set({
        "old-star": {
          id: "old-star",
          name: "Old Star",
          type: CelestialType.STAR,
          position: starPos,
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          mass: 1000,
          radius: 100,
          realMass_kg: 1.989e30,
          realRadius_m: 696340000,
          orbit: {
            realSemiMajorAxis_m: 0,
            eccentricity: 0,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            argumentOfPeriapsis: 0,
            meanAnomaly: 0,
          } as any,
          physicsStateReal: {
            id: "old-star",
            mass_kg: 1.989e30,
            position_m: stateRealPos as any,
            velocity_mps: stateRealVel as any,
          },
          properties: {
            type: CelestialType.STAR,
            isMainStar: true,
            spectralClass: "G2V",
            mainSpectralClass: SpectralClass.G,
            luminosityClass: LuminosityClass.V,
            stellarType: StellarType.MAIN_SEQUENCE,
            luminosity: 1.0,
            color: "#FFF9E5",
          },
          temperature: 5778,
        } as any,
      });

      const customPos = new OSVector3(500, 500, 500).toThreeJS();
      const customTarget = new OSVector3(100, 100, 100).toThreeJS();

      simulationState.set({
        ...simulationState.get(),
        camera: {
          position: customPos as any,
          target: customTarget as any,
          fov: 45,
        },
      });

      expect(Object.keys(celestialObjectsStore.get()).length).toBe(1);
      expect(celestialObjectsStore.get()["old-star"]).toBeDefined();
      expect(simulationState.get().camera.position.x).toBe(500);

      const newStarId = celestialFactory.createSolarSystem({
        id: "new-star",
        name: "New Star",
        type: CelestialType.STAR,
        realMass_kg: 1.989e30,
        realRadius_m: 696340000,
      });

      const objects = celestialObjectsStore.get();
      expect(Object.keys(objects).length).toBe(1);
      expect(objects["old-star"]).toBeUndefined();
      expect(objects[newStarId]).toBeDefined();

      expect(simulationState.get().camera.position.x).toBe(500);
      expect(simulationState.get().camera.position.y).toBe(500);
      expect(simulationState.get().camera.position.z).toBe(500);
      expect(simulationState.get().camera.fov).toBe(45);
    });
  });
});
