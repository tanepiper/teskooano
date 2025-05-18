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
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { celestialObjectsStore, simulationState } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";
import * as THREE from "three";
import { rendererEvents } from "../events";

const createMockDOM = () => {
  const container = document.createElement("div");
  container.id = "test-container";
  container.style.width = "800px";
  container.style.height = "600px";
  document.body.appendChild(container);

  return container;
};

const createMockCelestialObject = (
  id: string,
  type: CelestialType,
  position: THREE.Vector3,
) => {
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
    properties: {} as any,
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
    container = createMockDOM();

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
    renderer.dispose();
    document.body.removeChild(container);
  });

  it("should initialize all managers", () => {
    expect(renderer["sceneManager"]).toBeInstanceOf(SceneManager);
    expect(renderer["animationLoop"]).toBeInstanceOf(AnimationLoop);
    expect(renderer["stateManager"]).toBeInstanceOf(StateManager);
    expect(renderer["objectManager"]).toBeInstanceOf(ObjectManager);
    expect(renderer["orbitManager"]).toBeInstanceOf(OrbitsManager);
    expect(renderer["backgroundManager"]).toBeInstanceOf(BackgroundManager);
    expect(renderer["controlsManager"]).toBeInstanceOf(ControlsManager);
    expect(renderer["css2DManager"]).toBeInstanceOf(CSS2DManager);
    expect(renderer["lightManager"]).toBeInstanceOf(LightManager);
  });

  it("should set up event listeners", () => {
    const toggleGridEvent = new Event("toggleGrid");
    container.dispatchEvent(toggleGridEvent);

    const gridHelper = renderer.scene.children.find(
      (child) => child instanceof THREE.GridHelper,
    );

    expect(gridHelper).toBeDefined();
    expect(gridHelper?.visible).toBe(true);

    container.dispatchEvent(toggleGridEvent);
    expect(gridHelper?.visible).toBe(false);
  });

  it("should handle window resize", () => {
    container.style.width = "1024px";
    container.style.height = "768px";

    renderer.onResize(1024, 768);

    expect(renderer.camera.aspect).toBeCloseTo(1024 / 768);
  });

  it("should render the scene", () => {
    renderer.render();

    expect(renderer.renderer).toBeDefined();
  });

  it("should add and remove objects", () => {
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    const starMesh = renderer.addObject(star as any);

    expect(starMesh).toBeDefined();
    expect(renderer.scene.children).toContain(starMesh);

    const planetPosition = new THREE.Vector3(10000, 0, 0);
    const planet = createMockCelestialObject(
      "test-planet",
      CelestialType.PLANET,
      planetPosition,
    );

    const planetMesh = renderer.addObject(planet as any);

    expect(planetMesh).toBeDefined();
    expect(renderer.scene.children).toContain(planetMesh);

    const orbitLine = renderer.scene.children.find(
      (child) =>
        child instanceof THREE.Line && child.name.includes("test-planet"),
    );
    expect(orbitLine).toBeDefined();

    renderer.removeObject("test-star");
    renderer.removeObject("test-planet");

    expect(renderer.scene.children).not.toContain(starMesh);
    expect(renderer.scene.children).not.toContain(planetMesh);
    expect(renderer.scene.children).not.toContain(orbitLine);
  });

  it("should update objects", () => {
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    renderer.addObject(star as any);

    const newPosition = new THREE.Vector3(1000, 0, 0);
    const updatedStar = {
      ...star,
      position: newPosition,
    };

    renderer.updateObject(updatedStar as any);

    const updatedMesh = renderer["objectManager"].getObject("test-star");
    expect(updatedMesh).toBeDefined();
    expect(updatedMesh?.position).toEqual(newPosition);
  });

  it("should toggle UI elements", () => {
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    renderer.addObject(star as any);

    renderer.toggleLabels();

    renderer.toggleLabels();

    renderer.toggleGrid();

    const gridHelper = renderer.scene.children.find(
      (child) => child instanceof THREE.GridHelper,
    );
    expect(gridHelper?.visible).toBe(false);

    renderer.toggleGrid();
    expect(gridHelper?.visible).toBe(true);
  });

  it("should update camera", () => {
    const position = new THREE.Vector3(0, 0, 10000);
    const target = new THREE.Vector3(0, 0, 0);

    renderer.updateCamera(position, target);

    expect(renderer.camera.position).toEqual(position);
    expect(renderer.controls.target).toEqual(target);
  });

  it("should handle canvas UI manager", () => {
    const renderSpy = vi.fn();
    const css2DManager = {
      render: renderSpy,
    };

    renderer.setCanvasUIManager(css2DManager);

    renderer.render();

    expect(renderSpy).toHaveBeenCalled();
  });

  it("should handle render callbacks", () => {
    const renderCallback = vi.fn();

    renderer.addRenderCallback(renderCallback);

    renderer.render();

    expect(renderCallback).toHaveBeenCalled();

    renderer.removeRenderCallback(renderCallback);

    renderCallback.mockClear();

    renderer.render();

    expect(renderCallback).not.toHaveBeenCalled();
  });

  it("should calculate triangle count", () => {
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    renderer.addObject(star as any);

    const count = renderer.getTriangleCount();

    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThan(0);
  });

  it("should dispose of all resources", () => {
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    renderer.addObject(star as any);

    renderer.dispose();

    expect(renderer.scene.children.length).toBe(0);
  });

  it("should handle state changes", () => {
    const starPosition = new THREE.Vector3(0, 0, 0);
    const star = createMockCelestialObject(
      "test-star",
      CelestialType.STAR,
      starPosition,
    );

    celestialObjectsStore.set({
      "test-star": star as any,
    });

    const starMesh = renderer["objectManager"].getObject("test-star");
    expect(starMesh).toBeDefined();

    const newPosition = new THREE.Vector3(1000, 0, 0);
    const updatedStar = {
      ...star,
      position: newPosition,
    };

    celestialObjectsStore.set({
      "test-star": updatedStar as any,
    });

    const updatedMesh = renderer["objectManager"].getObject("test-star");
    expect(updatedMesh).toBeDefined();
    expect(updatedMesh?.position).toEqual(newPosition);

    celestialObjectsStore.set({});

    const removedMesh = renderer["objectManager"].getObject("test-star");
    expect(removedMesh).toBeNull();
  });

  it("should handle camera state changes", () => {
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

    expect(renderer.camera.position).toEqual(position);
    expect(renderer.controls.target).toEqual(target);
  });

  it("should handle orbital line updates", () => {
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

    renderer.addObject(star as any);
    renderer.addObject(planet as any);

    let orbitLine = renderer.scene.children.find(
      (child) =>
        child instanceof THREE.Line && child.name.includes("test-planet"),
    );

    if (!orbitLine) {
      rendererEvents.emit("updateOrbitalLines");

      orbitLine = renderer.scene.children.find(
        (child) =>
          child instanceof THREE.Line && child.name.includes("test-planet"),
      );
    }

    expect(orbitLine).toBeDefined();
  });
});
