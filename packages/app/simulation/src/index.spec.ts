import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Simulation } from "./index";
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";

describe("Simulation", () => {
  let container: HTMLElement;
  let simulation: Simulation;

  beforeEach(() => {
    container = document.createElement("div");
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);

    simulation = new Simulation(container);
  });

  afterEach(() => {
    simulation.stop();
    document.body.removeChild(container);
  });

  describe("constructor", () => {
    it("should create a simulation instance", () => {
      expect(simulation).toBeDefined();
    });
  });

  describe("addObject", () => {
    const testObject: CelestialObject = {
      id: "test-1",
      name: "Test Planet",
      type: CelestialType.PLANET,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100,
    };

    it("should add a celestial object to the simulation", () => {
      expect(() => simulation.addObject(testObject)).not.toThrow();
    });
  });

  describe("removeObject", () => {
    const testObject: CelestialObject = {
      id: "test-1",
      name: "Test Planet",
      type: CelestialType.PLANET,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100,
    };

    it("should remove a celestial object from the simulation", () => {
      simulation.addObject(testObject);
      expect(() => simulation.removeObject(testObject.id)).not.toThrow();
    });
  });

  describe("stop", () => {
    it("should stop the simulation loop", () => {
      simulation.stop();

      expect(() => simulation.stop()).not.toThrow();
    });
  });

  describe("event listeners", () => {
    it("should handle window resize events", () => {
      window.dispatchEvent(new Event("resize"));

      expect(() => window.dispatchEvent(new Event("resize"))).not.toThrow();
    });

    it("should handle keyboard events", () => {
      const events = [
        new KeyboardEvent("keydown", { key: " " }),
        new KeyboardEvent("keydown", { key: "+" }),
        new KeyboardEvent("keydown", { key: "-" }),
      ];

      events.forEach((event) => {
        window.dispatchEvent(event);

        expect(() => window.dispatchEvent(event)).not.toThrow();
      });
    });

    it("should handle invalid keyboard events gracefully", () => {
      const event = new KeyboardEvent("keydown", { key: "invalid" });
      expect(() => window.dispatchEvent(event)).not.toThrow();
    });
  });
});
