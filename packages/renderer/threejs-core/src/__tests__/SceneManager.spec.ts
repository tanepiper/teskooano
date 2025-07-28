import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as THREE from "three";
import { SceneManager } from "../SceneManager";

describe("SceneManager", () => {
  let container: HTMLDivElement;
  let sceneManager: SceneManager;

  beforeEach(() => {
    container = document.createElement("div");
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);

    sceneManager = new SceneManager(container);
  });

  afterEach(() => {
    sceneManager.dispose();
    document.body.removeChild(container);
  });

  it("should initialize with default options", () => {
    expect(sceneManager.scene).toBeInstanceOf(THREE.Scene);
    expect(sceneManager.camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(sceneManager.renderer).toBeInstanceOf(THREE.WebGLRenderer);

    expect(sceneManager.camera.aspect).toBe(800 / 600);
    expect(sceneManager.camera.near).toBe(0.00001); // Updated for ultra-aggressive logarithmic depth buffer
    expect(sceneManager.camera.far).toBe(1000000); // Updated for logarithmic depth buffer

    expect(sceneManager.renderer.domElement).toBeInstanceOf(HTMLCanvasElement);
    expect(sceneManager.renderer.shadowMap.enabled).toBe(false);
  });

  it("should initialize with custom options", () => {
    const customManager = new SceneManager(container, {
      antialias: false,
      shadows: true,
      hdr: true,
    });

    expect(customManager.renderer.shadowMap.enabled).toBe(true);
    expect(customManager.renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
    expect(customManager.renderer.outputColorSpace).toBe(THREE.SRGBColorSpace);
    expect(customManager.renderer.toneMapping).toBe(
      THREE.ACESFilmicToneMapping,
    );

    customManager.render();

    const clearColor = new THREE.Color();
    customManager.renderer.getClearColor(clearColor);
    expect(clearColor.getHexString()).toBe("000000");

    const debugSphere = customManager.scene.children.find(
      (child) =>
        child instanceof THREE.Mesh &&
        (child as THREE.Mesh).geometry instanceof THREE.SphereGeometry,
    );
    expect(debugSphere).toBeDefined();

    const gridHelper = customManager.scene.children.find(
      (child) => child instanceof THREE.GridHelper,
    );
    expect(gridHelper).toBeDefined();
    expect((gridHelper as THREE.GridHelper).visible).toBe(false);

    customManager.dispose();
  });

  it("should update camera position and target", () => {
    sceneManager.camera.position.set(1, 2, 3);
    sceneManager.camera.lookAt(4, 5, 6);

    expect(sceneManager.camera.position.x).toBe(1);
    expect(sceneManager.camera.position.y).toBe(2);
    expect(sceneManager.camera.position.z).toBe(3);

    const cameraDirection = new THREE.Vector3();
    sceneManager.camera.getWorldDirection(cameraDirection);
    const expectedDirection = new THREE.Vector3(3, 3, 3).normalize();
    expect(cameraDirection.x).toBeCloseTo(expectedDirection.x);
    expect(cameraDirection.y).toBeCloseTo(expectedDirection.y);
    expect(cameraDirection.z).toBeCloseTo(expectedDirection.z);
  });

  it("should handle window resize", () => {
    sceneManager.onResize(1024, 768);

    expect(sceneManager.camera.aspect).toBe(1024 / 768);

    expect(sceneManager.renderer.getSize(new THREE.Vector2()).x).toBe(1024);
    expect(sceneManager.renderer.getSize(new THREE.Vector2()).y).toBe(768);
  });

  it("should render the scene", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    sceneManager.scene.add(mesh);

    const renderSpy = vi.spyOn(sceneManager.renderer, "render");

    sceneManager.render();

    expect(renderSpy).toHaveBeenCalledWith(
      sceneManager.scene,
      sceneManager.camera,
    );

    geometry.dispose();
    material.dispose();
  });

  it("should dispose resources properly", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    sceneManager.scene.add(mesh);

    const disposeSpy = vi.spyOn(sceneManager.renderer, "dispose");

    sceneManager.dispose();

    expect(disposeSpy).toHaveBeenCalled();
    expect(sceneManager.scene.children.length).toBe(0);

    geometry.dispose();
    material.dispose();
  });
});
