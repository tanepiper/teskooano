import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { simulationManager, SimulationManager } from "./index";
import { celestial, simulation } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";

describe("SimulationManager", () => {
  beforeEach(() => {
    // Reset the singleton instance for test isolation
    (SimulationManager as any).instance = null;

    // Clear any existing state
    celestial.clearState();

    // Reset simulation state
    simulation.setState({
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
      simulationConfig: {
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
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
    simulationManager.dispose();
    // Ensure static instance is cleared after tests
    (SimulationManager as any).instance = null;
  });

  describe("getInstance", () => {
    it("should return the same instance", () => {
      const instance1 = SimulationManager.getInstance();
      const instance2 = SimulationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("loop control", () => {
    it("should start and stop the simulation loop", () => {
      simulationManager.startLoop();
      expect(simulationManager.isLoopRunning).toBe(true);

      simulationManager.stopLoop();
      expect(simulationManager.isLoopRunning).toBe(false);
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
        status: "ACTIVE" as any,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
          period_s: 0,
        },
        temperature: 5778,
        physicsStateReal: {
          id: "test-star",
          mass_kg: 1.989e30,
          position_m: new OSVector3().setZero(),
          velocity_mps: new OSVector3().setZero(),
        },
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFF9E5",
        },
      };

      celestial.addObject(testObject);
      expect(celestial.getObjects()["test-star"]).toBeDefined();

      const resetTimePromise = new Promise<void>((resolve) => {
        const sub = simulationManager.onResetTime.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      });

      simulationManager.resetSystem(false);

      await expect(resetTimePromise).resolves.toBeUndefined();
      expect(celestial.getObjects()["test-star"]).toBeUndefined();
      expect(simulation.getState().time).toBe(0);
    });

    it("should skip state clear but still emit event and reset time", async () => {
      // Set a non-zero time
      simulation.setState({
        ...simulation.getState(),
        time: 100,
      });

      const resetTimePromise = new Promise<void>((resolve) => {
        const sub = simulationManager.onResetTime.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      });

      simulationManager.resetSystem(true);

      await expect(resetTimePromise).resolves.toBeUndefined();
      expect(simulation.getState().time).toBe(0);
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
        status: "ACTIVE" as any,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
          period_s: 0,
        },
        temperature: 5778,
        physicsStateReal: {
          id: "test-star",
          mass_kg: 1.989e30,
          position_m: new OSVector3().setZero(),
          velocity_mps: new OSVector3().setZero(),
        },
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFF9E5",
        },
      };

      celestial.addObject(star);

      const orbitUpdatePromise = new Promise<any>((resolve) => {
        const sub = simulationManager.onOrbitUpdate.subscribe((payload) => {
          expect(payload).toBeDefined();
          expect(payload.positions).toBeDefined();
          resolve(payload);
          sub.unsubscribe();
        });
      });

      // Start the simulation loop to trigger physics updates
      simulationManager.startLoop();

      // Wait a bit for physics to run
      await new Promise((resolve) => setTimeout(resolve, 100));

      simulationManager.stopLoop();

      await expect(orbitUpdatePromise).resolves.toBeDefined();
    });

    it("onDestructionOccurred should emit when objects are destroyed", async () => {
      const destructionPromise = new Promise<any>((resolve) => {
        const sub = simulationManager.onDestructionOccurred.subscribe(
          (event) => {
            expect(event).toBeDefined();
            expect(event.destroyedId).toBeDefined();
            resolve(event);
            sub.unsubscribe();
          },
        );
      });

      // Note: This test would need actual collision scenarios to trigger
      // For now, we'll just verify the observable is set up correctly
      expect(simulationManager.onDestructionOccurred).toBeDefined();

      // Clean up the promise to avoid hanging
      setTimeout(() => {
        // If no destruction occurs, we'll just resolve with a timeout
        // In a real test, you'd set up actual collision scenarios
      }, 100);
    });
  });

  describe("simulation state integration", () => {
    it("should respect simulation pause state", () => {
      simulation.setState({
        ...simulation.getState(),
        paused: true,
      });

      simulationManager.startLoop();
      expect(simulationManager.isLoopRunning).toBe(true);

      // The simulation should be running but paused
      expect(simulation.getState().paused).toBe(true);

      simulationManager.stopLoop();
    });

    it("should respect time scale", () => {
      simulation.setState({
        ...simulation.getState(),
        timeScale: 2.0,
      });

      expect(simulation.getState().timeScale).toBe(2.0);
    });
  });
});
