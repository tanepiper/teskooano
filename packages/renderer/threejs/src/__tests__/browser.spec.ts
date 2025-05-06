import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ModularSpaceRenderer } from "../index";
import { CelestialType } from "@teskooano/data-types";
import * as THREE from "three";

describe("ThreeJS Renderer Browser Tests", () => {
  let container: HTMLElement;
  let renderer: ModularSpaceRenderer;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "renderer-container";
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
    document.body.removeChild(container);
  });

  it("should create and append a canvas element", async () => {
    renderer = new ModularSpaceRenderer(container);

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas instanceof HTMLCanvasElement).toBe(true);
  });

  it("should handle window resize", async () => {
    renderer = new ModularSpaceRenderer(container);

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    const initialWidth = canvas.width;
    const initialHeight = canvas.height;

    container.style.width = "1024px";
    container.style.height = "768px";

    renderer.onResize(1024, 768);

    expect(canvas.width).not.toBe(initialWidth);
    expect(canvas.height).not.toBe(initialHeight);
  });

  it("should be able to start and stop the render loop", async () => {
    renderer = new ModularSpaceRenderer(container);

    expect(() => renderer.startRenderLoop()).not.toThrow();

    expect(() => renderer.stopRenderLoop()).not.toThrow();
  });

  it("should add and render celestial objects", async () => {
    renderer = new ModularSpaceRenderer(container);

    const testStar = {
      id: "test-star",
      name: "Test Star",
      type: CelestialType.STAR,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      scale: { x: 10, y: 10, z: 10 },
      mass: 10000,
      radius: 1000,
      properties: {
        spectralClass: "G",
        luminosity: 1,
        temperature: 5778,
        color: "#FFFF00",
      },
    };

    const testPlanet = {
      id: "test-planet",
      name: "Test Planet",
      type: CelestialType.PLANET,
      position: new THREE.Vector3(2000, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100,
      properties: {
        type: "rocky" as "rocky",
      },
    };

    renderer.addObject(testStar);
    renderer.addObject(testPlanet);

    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();

    const updatedPlanet = {
      ...testPlanet,
      position: new THREE.Vector3(3000, 500, 0),
    };

    renderer.updateObject(updatedPlanet);

    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();

    renderer.removeObject(testStar.id);
    renderer.removeObject(testPlanet.id);

    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
  });

  it("should update camera position and target", async () => {
    renderer = new ModularSpaceRenderer(container);

    const position = new THREE.Vector3(1000, 2000, 3000);
    const target = new THREE.Vector3(0, 0, 0);

    renderer.updateCamera(position, target);

    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
  });

  it("should handle browser events for interactive controls", async () => {
    renderer = new ModularSpaceRenderer(container);

    const testPlanet = {
      id: "interactive-planet",
      name: "Interactive Planet",
      type: CelestialType.PLANET,
      position: new THREE.Vector3(0, 0, -1000),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100,
      properties: {
        type: "rocky" as "rocky",
      },
    };

    renderer.addObject(testPlanet);

    renderer.startRenderLoop();

    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: 400,
      clientY: 300,
    });

    const mouseMoveEvent = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: 450,
      clientY: 300,
    });

    const mouseUpEvent = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      clientX: 450,
      clientY: 300,
    });

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;

    canvas.dispatchEvent(mouseDownEvent);
    canvas.dispatchEvent(mouseMoveEvent);
    canvas.dispatchEvent(mouseUpEvent);

    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();

    renderer.stopRenderLoop();
  });
});
