import type {
  AnimationLoop,
  SceneManager,
} from "@teskooano/renderer-threejs-core";
import type {
  LightManager,
  LODManager,
} from "@teskooano/renderer-threejs-effects";
import type {
  ControlsManager,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import type { BackgroundManager } from "@teskooano/renderer-threejs-background";
import type * as THREE from "three";
import type { RenderPipelineOptions } from "./types";

/**
 * Orchestrates the sequence of updates for each frame in the rendering loop.
 *
 * This class encapsulates the logic for the order in which different parts
 * of the scene are updated, ensuring that dependencies are met (e.g., camera
 * is updated before LODs are calculated).
 */
export class RenderPipeline {
  private sceneManager: SceneManager;
  private controlsManager: ControlsManager;
  private orbitManager: OrbitsManager;
  private objectManager: ObjectManager;
  private backgroundManager: BackgroundManager;
  private lightManager: LightManager;
  private lodManager: LODManager;
  private css2DManager?: CSS2DManager;
  private animationLoop: AnimationLoop;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  private canvasUIManager?: { render(): void };

  /**
   * Creates an instance of RenderPipeline.
   * @param managers An object containing all the manager instances required for the pipeline.
   */
  constructor(managers: RenderPipelineOptions) {
    this.sceneManager = managers.sceneManager;
    this.controlsManager = managers.controlsManager;
    this.orbitManager = managers.orbitManager;
    this.objectManager = managers.objectManager;
    this.backgroundManager = managers.backgroundManager;
    this.lightManager = managers.lightManager;
    this.lodManager = managers.lodManager;
    this.css2DManager = managers.css2DManager;
    this.animationLoop = managers.animationLoop;
    this.canvasUIManager = managers.canvasUIManager;

    // Cache core three.js objects
    this.camera = this.sceneManager.camera;
    this.renderer = this.sceneManager.renderer;
    this.scene = this.sceneManager.scene;
  }

  /**
   * Executes a single frame update of the rendering pipeline.
   *
   * The order of operations is critical:
   * 1. Update controls and camera position.
   * 2. Update orbital paths.
   * 3. Update 3D objects (position, rotation, materials).
   * 4. Update the background (parallax effect).
   * 5. Update Level of Detail based on new camera position.
   * 6. Render 2D overlays (CSS2D).
   * 7. Run custom callbacks.
   * 8. Perform the main scene render.
   * 9. Render top-level canvas UI.
   *
   * @param deltaTime The time elapsed since the last frame, in seconds.
   * @param elapsedTime The total time elapsed since the loop started, in seconds.
   */
  public update = (deltaTime: number, elapsedTime: number): void => {
    // 1. Update controls and camera position first.
    this.controlsManager.update(deltaTime);

    // 2. Update orbital paths.
    this.orbitManager.updateAllVisualizations();

    // 3. Update 3D objects (position, rotation, materials).
    this.objectManager.updateRenderers(
      elapsedTime,
      this.lightManager.getStarLightsData(),
      this.renderer,
      this.scene,
      this.camera,
    );

    // 4. Update the background, which may have a parallax effect based on camera position.
    this.backgroundManager.update(deltaTime);

    // 5. Update LODs based on the new camera position.
    this.lodManager.update();

    // 6. Render the 2D overlay, which depends on final 3D positions.
    if (this.css2DManager && typeof this.css2DManager.render === "function") {
      this.css2DManager.render(this.camera);
    }

    // 7. Run any custom render callbacks injected into the loop.
    this.animationLoop.getRenderCallbacks().forEach((callback) => callback());

    // 8. Perform the main scene render.
    this.sceneManager.render();

    // 9. Render any top-level canvas UI.
    if (this.canvasUIManager) {
      this.canvasUIManager.render();
    }
  };
}
