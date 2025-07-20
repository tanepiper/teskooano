import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialStatus,
  CelestialType,
  LuminosityClass,
  SpectralClass,
  StellarType,
} from "@teskooano/data-types";
import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { celestialManager } from "./managers/celestialManager";
import { celestialStore } from "./stores/celestialStore";
import { simulationStateService } from "./simulation";

describe("Factory functions", () => {
  beforeEach(() => {
    const cameraPos = new OSVector3().setFromArray([0, 0, 1000]).toThreeJS();
    const cameraTarget = new OSVector3().setZero().toThreeJS();

    simulationStateService.setSimulationState({
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
    celestialStore.setAllObjects({});
    celestialStore.setHierarchy({});
  });

  describe("clearState", () => {
    it("should clear all celestial objects and hierarchy by default", () => {
      const objectPos = new OSVector3().setZero().toThreeJS();
      const objectVel = new OSVector3().setZero().toThreeJS();

      celestialStore.setAllObjects({
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
      celestialStore.setHierarchy({
        "parent-1": ["test-1"],
      });
      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        time: 100,
        timeScale: 2,
        paused: true,
        selectedObject: "test-1",
        focusedObjectId: "test-1",
      });

      expect(Object.keys(celestialStore.getObjects()).length).toBe(1);
      expect(Object.keys(celestialStore.getHierarchy()).length).toBe(1);
      expect(simulationStateService.getSimulationState().timeScale).toBe(2);
      expect(simulationStateService.getSimulationState().selectedObject).toBe(
        "test-1",
      );

      celestialManager.clearState();

      expect(Object.keys(celestialStore.getObjects()).length).toBe(0);
      expect(Object.keys(celestialStore.getHierarchy()).length).toBe(0);
      expect(simulationStateService.getSimulationState().timeScale).toBe(1);
      expect(
        simulationStateService.getSimulationState().selectedObject,
      ).toBeNull();
      expect(
        simulationStateService.getSimulationState().focusedObjectId,
      ).toBeNull();

      expect(
        simulationStateService.getSimulationState().camera.position.z,
      ).toBe(1000);
    });

    it("should respect resetCamera option", () => {
      const customPos = new OSVector3()
        .setFromArray([500, 500, 500])
        .toThreeJS();
      const customTarget = new OSVector3()
        .setFromArray([100, 100, 100])
        .toThreeJS();

      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        camera: {
          position: customPos as any,
          target: customTarget as any,
          fov: 45,
        },
      });

      expect(
        simulationStateService.getSimulationState().camera.position.x,
      ).toBe(500);
      expect(simulationStateService.getSimulationState().camera.fov).toBe(45);

      celestialManager.clearState({ resetCamera: true });

      expect(
        simulationStateService.getSimulationState().camera.position.x,
      ).toBe(0);
      expect(
        simulationStateService.getSimulationState().camera.position.y,
      ).toBe(0);
      expect(
        simulationStateService.getSimulationState().camera.position.z,
      ).toBe(1000);
      expect(simulationStateService.getSimulationState().camera.fov).toBe(60);
    });

    it("should respect resetTime option", () => {
      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        time: 100,
        timeScale: 2,
        paused: true,
      });

      celestialManager.clearState({ resetTime: false });

      expect(simulationStateService.getSimulationState().time).toBe(100);
      expect(simulationStateService.getSimulationState().timeScale).toBe(2);
      expect(simulationStateService.getSimulationState().paused).toBe(true);
    });

    it("should respect resetSelection option", () => {
      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        selectedObject: "test-1",
        focusedObjectId: "test-2",
      });

      celestialManager.clearState({ resetSelection: false });

      expect(simulationStateService.getSimulationState().selectedObject).toBe(
        "test-1",
      );
      expect(simulationStateService.getSimulationState().focusedObjectId).toBe(
        "test-2",
      );
    });
  });

  describe("createSolarSystem", () => {
    it("should clear all state before creating a new system", () => {
      const starPos = new OSVector3().setZero().toThreeJS();
      const stateRealPos = new OSVector3().setZero().toThreeJS();
      const stateRealVel = new OSVector3().setZero().toThreeJS();

      celestialStore.setAllObjects({
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

      const customPos = new OSVector3()
        .setFromArray([500, 500, 500])
        .toThreeJS();
      const customTarget = new OSVector3()
        .setFromArray([100, 100, 100])
        .toThreeJS();

      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        camera: {
          position: customPos as any,
          target: customTarget as any,
          fov: 45,
        },
      });

      expect(Object.keys(celestialStore.getObjects()).length).toBe(1);
      expect(celestialStore.getObjects()["old-star"]).toBeDefined();
      expect(
        simulationStateService.getSimulationState().camera.position.x,
      ).toBe(500);

      const newStarId = celestialManager.createSolarSystem({
        id: "new-star",
        name: "New Star",
        type: CelestialType.STAR,
        realMass_kg: 1.989e30,
        realRadius_m: 696340000,
        status: CelestialStatus.ACTIVE,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
        } as any,
        temperature: 5778,
      });

      const objects = celestialStore.getObjects();
      expect(Object.keys(objects).length).toBe(1);
      expect(objects["old-star"]).toBeUndefined();
      expect(objects[newStarId]).toBeDefined();

      expect(
        simulationStateService.getSimulationState().camera.position.x,
      ).toBe(500);
      expect(
        simulationStateService.getSimulationState().camera.position.y,
      ).toBe(500);
      expect(
        simulationStateService.getSimulationState().camera.position.z,
      ).toBe(500);
      expect(simulationStateService.getSimulationState().camera.fov).toBe(45);
    });
  });
});
