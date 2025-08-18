import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { simulationOrchestrator, SimulationOrchestrator } from "./index";
import {
  actions,
  simulationStateService,
  celestial,
  celestialManager,
} from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";
import type { CelestialObject, OrbitalParameters } from "@teskooano/data-types";
import {
  CelestialType,
  SimulationMode,
  AlgorithmType,
  IntegratorType,
  CelestialStatus,
} from "@teskooano/data-types";

describe("SimulationOrchestrator", () => {
  beforeEach(() => {
    // Reset the singleton instance for test isolation
    (SimulationOrchestrator as any).instance = null;

    // Clear any existing state
    actions.clearState();

    // Reset simulation state
    simulationStateService.setSimulationState({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      startDate: new Date(),
      camera: {
        position: new OSVector3(0, 0, 1000),
        target: new OSVector3(0, 0, 0),
        fov: 60,
      },
      simulationConfig: {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
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
  });

  afterEach(() => {
    simulationOrchestrator.dispose();
    // Ensure static instance is cleared after tests
    (SimulationOrchestrator as any).instance = null;
  });

  describe("getInstance", () => {
    it("should return the same instance", () => {
      const instance1 = SimulationOrchestrator.getInstance();
      const instance2 = SimulationOrchestrator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("loop control", () => {
    it("should start and stop the simulation loop", async () => {
      await simulationOrchestrator.startLoop();
      expect(simulationOrchestrator.isLoopRunning).toBe(true);

      simulationOrchestrator.stopLoop();
      expect(simulationOrchestrator.isLoopRunning).toBe(false);
    });
  });

  describe("resetSystem", () => {
    it("should clear state and emit onResetTime event", async () => {
      // Add a test object to verify it gets cleared
      const testObject: CelestialObject = {
        id: "test-star",
        name: "Test Star",
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
          period_s: 0,
          realAphelion_m: 0,
          realPerihelion_m: 0,
          averageOrbitalSpeed_mps: 0,
          epoch: new Date().toISOString(),
        },
        temperature: 5778,
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFF9E5",
        },
      };

      celestialManager.addObject(testObject);
      expect(celestial.getObjects()["test-star"]).toBeDefined();

      const resetTimePromise = new Promise<void>((resolve) => {
        const sub = simulationOrchestrator.onResetTime.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      });

      simulationOrchestrator.resetSystem(false);

      await expect(resetTimePromise).resolves.toBeUndefined();
      expect(celestial.getObjects()["test-star"]).toBeUndefined();
      expect(simulationStateService.getSimulationState().time).toBe(0);
    });

    it("should skip state clear but still emit event and reset time", async () => {
      // Set a non-zero time
      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        time: 100,
      });

      const resetTimePromise = new Promise<void>((resolve) => {
        const sub = simulationOrchestrator.onResetTime.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      });

      simulationOrchestrator.resetSystem(true);

      await expect(resetTimePromise).resolves.toBeUndefined();
      expect(simulationStateService.getSimulationState().time).toBe(0);
    });
  });

  describe("event observables", () => {
    it("onOrbitUpdate should emit when physics updates occur", async () => {
      // Create a simple test system
      const star: CelestialObject = {
        id: "test-star",
        name: "Test Star",
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
          period_s: 0,
          realAphelion_m: 0,
          realPerihelion_m: 0,
          averageOrbitalSpeed_mps: 0,
          epoch: new Date().toISOString(),
        },
        temperature: 5778,
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFF9E5",
        },
      };

      celestialManager.addObject(star);

      const orbitUpdatePromise = new Promise<any>((resolve) => {
        const sub = simulationOrchestrator.onOrbitUpdate.subscribe(
          (payload) => {
            expect(payload).toBeDefined();
            expect(payload.positions).toBeDefined();
            resolve(payload);
            sub.unsubscribe();
          },
        );
      });

      // Start the simulation loop to trigger physics updates
      await simulationOrchestrator.startLoop();

      // Wait a bit for physics to run
      await new Promise((resolve) => setTimeout(resolve, 100));

      simulationOrchestrator.stopLoop();

      await expect(orbitUpdatePromise).resolves.toBeDefined();
    });
  });

  describe("simulation state integration", () => {
    it("should respect simulation pause state", async () => {
      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        paused: true,
      });

      await simulationOrchestrator.startLoop();
      expect(simulationOrchestrator.isLoopRunning).toBe(true);

      // The simulation should be running but paused
      expect(simulationStateService.getSimulationState().paused).toBe(true);

      simulationOrchestrator.stopLoop();
    });

    it("should respect time scale", () => {
      simulationStateService.setSimulationState({
        ...simulationStateService.getSimulationState(),
        timeScale: 2.0,
      });

      expect(simulationStateService.getSimulationState().timeScale).toBe(2.0);
    });
  });
});
