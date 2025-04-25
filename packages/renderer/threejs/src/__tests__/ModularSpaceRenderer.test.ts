import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ModularSpaceRenderer } from "../index";
import {
  SceneManager,
  AnimationLoop,
  StateManager,
} from "@teskooano/renderer-threejs-core";

import {
  ControlsManager,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import { LightManager } from "@teskooano/renderer-threejs-effects";
import { OrbitManager } from "@teskooano/renderer-threejs-orbits";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { celestialObjectsStore, simulationState } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";
import * as THREE from "three";
import { rendererEvents } from "../events";

// Create a mock DOM environment for the tests
const createMockDOM = () => {
  // Create a mock container
  const container = document.createElement("div");
  container.id = "test-container";
  container.style.width = "800px";
  container.style.height = "600px";
  document.body.appendChild(container);

  return container;
};

// Create a mock celestial object for testing
const createMockCelestialObject = (
  id: string,
  type: CelestialType,
  position: THREE.Vector3,
) => {
  // Create a basic object with all required properties
  const baseObject = {
    id,
    name: `Test ${type}`,
    type,
    position,
    rotation: new THREE.Quaternion(),
    mass: 1e24,
    radius: 1000,
    parentId: type === CelestialType.PLANET ? "test-star" : undefined,
    orbitalParameters:
      type === CelestialType.PLANET
        ? {
            semiMajorAxis: 10000,
            eccentricity: 0.1,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            argumentOfPeriapsis: 0,
            meanAnomaly: 0,
          }
        : undefined,
    properties: {} as any, // Use type assertion to bypass type checking for testing
    physicsState: {
      position,
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      angularAcceleration: new THREE.Vector3(),
    },
  };

  return baseObject;
};

describe("ModularSpaceRenderer Integration Tests", () => {
  let renderer: ModularSpaceRenderer;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a mock container
    container = createMockDOM();

    // Create the renderer with actual implementations
    renderer = new ModularSpaceRenderer(container, {
      antialias: true,
      shadows: true,
      hdr: true,
      background: "black",
      showDebugSphere: false,
      showGrid: true,
    });
  });

  afterEach(() => {
    // Clean up
    renderer.dispose();
    document.body.removeChild(container);
  });

  it("should initialize all managers", () => {
    // Verify that all managers are initialized
    expect(renderer["sceneManager"]).toBeInstanceOf(SceneManager);
    expect(renderer["animationLoop"]).toBeInstanceOf(AnimationLoop);
    expect(renderer["stateManager"]).toBeInstanceOf(StateManager);
    expect(renderer["objectManager"]).toBeInstanceOf(ObjectManager);
    expect(renderer["orbitManager"]).toBeInstanceOf(OrbitManager);
    expect(renderer["backgroundManager"]).toBeInstanceOf(BackgroundManager);
    expect(renderer["controlsManager"]).toBeInstanceOf(ControlsManager);
    expect(renderer["css2DManager"]).toBeInstanceOf(CSS2DManager);
    expect(renderer["lightManager"]).toBeInstanceOf(LightManager);
  });

  it("should set up event listeners", () => {
    // Simulate a toggleGrid event
    const toggleGridEvent = new Event("toggleGrid");
    container.dispatchEvent(toggleGridEvent);

    // We can't directly check if the method was called, but we can verify
    // that the grid is toggled by checking if it's visible in the scene
    const gridHelper = renderer.scene.children.find(
      (child) => child instanceof THREE.GridHelper,
    );

    // The grid should be visible after toggling
    expect(gridHelper).toBeDefined();
    expect(gridHelper?.visible).toBe(true);

    // Toggle again to hide it
    container.dispatchEvent(toggleGridEvent);
    expect(gridHelper?.visible).toBe(false);
  });

  it("should handle window resize", () => {
    // Change the container size
    container.style.width = "1024px";
    container.style.height = "768px";

    // Trigger the resize handler
    renderer.onResize(1024, 768);

    // Check that the camera aspect ratio was updated
    expect(renderer.camera.aspect).toBeCloseTo(1024 / 768);
  });

  it("should render the scene", () => {
    // Render the scene
    renderer.render();

    // We can't directly check if the render method was called, but we can
    // verify that the scene is rendered by checking if the renderer is working
    expect(renderer.renderer).toBeDefined();
  });

  it("should add and remove objects", () => {
    // Create a test object
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    // Add the object to the scene
    const starMesh = renderer.addObject(star as any);

    // Verify that the object was added
    expect(starMesh).toBeDefined();
    expect(renderer.scene.children).toContain(starMesh);

    // Create a planet orbiting the star
    const planetPosition = new THREE.Vector3(10000, 0, 0);
    const planet = createMockCelestialObject(
      "test-planet",
      CelestialType.PLANET,
      planetPosition,
    );

    // Add the planet to the scene
    const planetMesh = renderer.addObject(planet as any);

    // Verify that the planet was added
    expect(planetMesh).toBeDefined();
    expect(renderer.scene.children).toContain(planetMesh);

    // Verify that an orbit line was created for the planet
    const orbitLine = renderer.scene.children.find(
      (child) =>
        child instanceof THREE.Line && child.name.includes("test-planet"),
    );
    expect(orbitLine).toBeDefined();

    // Remove the objects
    renderer.removeObject("test-star");
    renderer.removeObject("test-planet");

    // Verify that the objects were removed
    expect(renderer.scene.children).not.toContain(starMesh);
    expect(renderer.scene.children).not.toContain(planetMesh);
    expect(renderer.scene.children).not.toContain(orbitLine);
  });

  it("should update objects", () => {
    // Create a test object
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    // Add the object to the scene
    renderer.addObject(star as any);

    // Update the object with a new position
    const newPosition = new THREE.Vector3(1000, 0, 0);
    const updatedStar = {
      ...star,
      position: newPosition,
    };

    // Update the object
    renderer.updateObject(updatedStar as any);

    // Verify that the object was updated
    const updatedMesh = renderer["objectManager"].getObject("test-star");
    expect(updatedMesh).toBeDefined();
    expect(updatedMesh?.position).toEqual(newPosition);
  });

  it("should toggle UI elements", () => {
    // Create a test object with a label
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    // Add the object to the scene
    renderer.addObject(star as any);

    // Toggle labels
    renderer.toggleLabels();

    // We can't directly check if the labels are hidden, but we can verify
    // that the toggleLabels method was called by checking if it was called again
    // and the labels are visible again
    renderer.toggleLabels();

    // Toggle grid
    renderer.toggleGrid();

    // Verify that the grid is hidden
    const gridHelper = renderer.scene.children.find(
      (child) => child instanceof THREE.GridHelper,
    );
    expect(gridHelper?.visible).toBe(false);

    // Toggle grid again to show it
    renderer.toggleGrid();
    expect(gridHelper?.visible).toBe(true);
  });

  it("should update camera", () => {
    // Set a new camera position and target
    const position = new THREE.Vector3(0, 0, 10000);
    const target = new THREE.Vector3(0, 0, 0);

    // Update the camera
    renderer.updateCamera(position, target);

    // Verify that the camera was updated
    expect(renderer.camera.position).toEqual(position);
    expect(renderer.controls.target).toEqual(target);
  });

  it("should handle canvas UI manager", () => {
    // Create a mock canvas UI manager
    const renderSpy = vi.fn();
    const css2DManager = {
      render: renderSpy,
    };

    // Set the canvas UI manager
    renderer.setCanvasUIManager(css2DManager);

    // Render the scene
    renderer.render();

    // Verify that the canvas UI manager's render method was called
    expect(renderSpy).toHaveBeenCalled();
  });

  it("should handle render callbacks", () => {
    // Create a mock render callback
    const renderCallback = vi.fn();

    // Add the render callback
    renderer.addRenderCallback(renderCallback);

    // Render the scene
    renderer.render();

    // Verify that the render callback was called
    expect(renderCallback).toHaveBeenCalled();

    // Remove the render callback
    renderer.removeRenderCallback(renderCallback);

    // Clear the mock
    renderCallback.mockClear();

    // Render the scene again
    renderer.render();

    // Verify that the render callback was not called
    expect(renderCallback).not.toHaveBeenCalled();
  });

  it("should calculate triangle count", () => {
    // Create a test object with a mesh
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    // Add the object to the scene
    renderer.addObject(star as any);

    // Get the triangle count
    const count = renderer.getTriangleCount();

    // Verify that the triangle count is a number
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThan(0);
  });

  it("should dispose of all resources", () => {
    // Create a test object
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    // Add the object to the scene
    renderer.addObject(star as any);

    // Dispose of the renderer
    renderer.dispose();

    // Verify that the scene is empty
    expect(renderer.scene.children.length).toBe(0);
  });

  it("should handle state changes", () => {
    // Create a test object
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    // Update the celestial objects store
    celestialObjectsStore.set({
      "test-star": star as any,
    });

    // Verify that the object was added to the scene
    const starMesh = renderer["objectManager"].getObject("test-star");
    expect(starMesh).toBeDefined();

    // Update the object in the store
    const newPosition = new THREE.Vector3(1000, 0, 0);
    const updatedStar = {
      ...star,
      position: newPosition,
    };

    celestialObjectsStore.set({
      "test-star": updatedStar as any,
    });

    // Verify that the object was updated
    const updatedMesh = renderer["objectManager"].getObject("test-star");
    expect(updatedMesh).toBeDefined();
    expect(updatedMesh?.position).toEqual(newPosition);

    // Remove the object from the store
    celestialObjectsStore.set({});

    // Verify that the object was removed
    const removedMesh = renderer["objectManager"].getObject("test-star");
    expect(removedMesh).toBeNull();
  });

  it("should handle camera state changes", () => {
    // Set a new camera position and target in the simulation state
    const position = new THREE.Vector3(0, 0, 10000);
    const target = new THREE.Vector3(0, 0, 0);

    simulationState.set({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: {
        position,
        target,
        fov: 75,
      },
    } as any);

    // Verify that the camera was updated
    expect(renderer.camera.position).toEqual(position);
    expect(renderer.controls.target).toEqual(target);
  });

  it("should handle orbital line updates", () => {
    // Create a star and a planet
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    const planetPosition = new THREE.Vector3(10000, 0, 0);
    const planet = createMockCelestialObject(
      "test-planet",
      CelestialType.PLANET,
      planetPosition,
    );

    // Add the objects to the scene
    renderer.addObject(star as any);
    renderer.addObject(planet as any);

    // Verify the orbit line was created during addObject
    let orbitLine = renderer.scene.children.find(
      (child) =>
        child instanceof THREE.Line && child.name.includes("test-planet"),
    );

    // If not found yet, emit the event to create it
    if (!orbitLine) {
      // Emit an updateOrbitalLines event
      rendererEvents.emit("updateOrbitalLines");

      // Now try to find the orbit line again
      orbitLine = renderer.scene.children.find(
        (child) =>
          child instanceof THREE.Line && child.name.includes("test-planet"),
      );
    }

    // Verify that the orbit line exists
    expect(orbitLine).toBeDefined();
  });
});
