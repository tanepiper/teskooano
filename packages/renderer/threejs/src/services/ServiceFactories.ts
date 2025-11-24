import * as THREE from "three";
import { SceneManager, GridManager } from "@teskooano/renderer-threejs-core";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager } from "@teskooano/renderer-threejs-celestial";
import { ControlsManager } from "@teskooano/renderer-threejs-controls";
import {
  Layer2DManager,
  AuMarkerManager,
  CelestialLabelLayer,
  CSS2DLayerType,
} from "@teskooano/renderer-threejs-labels";
import { RendererStateAdapter } from "../RendererStateAdapter";
import { RenderPipeline } from "../RenderPipeline";
import { renderableStore, StateAccessor } from "@teskooano/core-state";
import type { RendererBackend } from "@teskooano/data-types";

/**
 * Factory functions for creating complex renderer services.
 * These factories encapsulate the complex initialization logic and dependencies
 * required for each service type.
 */
export class ServiceFactories {
  /**
   * Creates a SceneManager with proper Three.js setup.
   * Note: SceneManager initialization is now asynchronous.
   * This method returns the SceneManager instance immediately,
   * but configuration will be applied once initialization completes.
   */
  static createSceneManager(container: HTMLElement): SceneManager {
    const sceneManager = new SceneManager(container);

    // Configuration needs to wait for async initialization
    // We'll apply it in a non-blocking way
    const configureSceneManager = async () => {
      // Wait for scene, camera, and renderer to be initialized
      while (
        !sceneManager.scene ||
        !sceneManager.camera ||
        !sceneManager.renderer
      ) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Configure scene
      sceneManager.scene.background = new THREE.Color(0x000000);
      sceneManager.scene.fog = new THREE.Fog(0x000000, 1000, 10000);

      // Configure camera
      sceneManager.camera.position.set(0, 0, 1000);
      sceneManager.camera.lookAt(0, 0, 0);

      // Configure renderer
      sceneManager.renderer.setSize(
        container.clientWidth,
        container.clientHeight,
      );
      sceneManager.renderer.setPixelRatio(window.devicePixelRatio);

      // Only configure shadow map for WebGL renderer
      if (sceneManager.getRendererBackend() === "webgl") {
        (sceneManager.renderer as THREE.WebGLRenderer).shadowMap.enabled = true;
        (sceneManager.renderer as THREE.WebGLRenderer).shadowMap.type =
          THREE.PCFSoftShadowMap;
      }
    };

    // Start configuration asynchronously
    configureSceneManager().catch((error) => {
      console.error(
        "[ServiceFactories] Failed to configure SceneManager:",
        error,
      );
    });

    return sceneManager;
  }

  /**
   * Creates a LightingManager with proper lighting setup.
   */
  static createLightingManager(scene: THREE.Scene): LightingManager {
    const lightingManager = new LightingManager(scene);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1000, 1000, 1000);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 5000;
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    scene.add(directionalLight);

    return lightingManager;
  }

  /**
   * Creates a GridManager with proper grid configuration.
   */
  static createGridManager(scene: THREE.Scene): GridManager {
    const gridManager = new GridManager(scene);

    // GridManager is already properly configured in its constructor
    // It handles dynamic grid scaling based on camera distance automatically

    return gridManager;
  }

  /**
   * Creates a BackgroundManager with proper background setup.
   */
  static createBackgroundManager(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    rendererBackend: RendererBackend,
  ): BackgroundManager {
    const backgroundManager = new BackgroundManager(
      scene,
      camera,
      rendererBackend,
    );

    // BackgroundManager is already properly configured in its constructor
    // It creates default star field and nebula automatically

    return backgroundManager;
  }

  /**
   * Creates a ControlsManager with proper camera controls setup.
   */
  static createControlsManager(
    camera: THREE.PerspectiveCamera,
    rendererElement: HTMLElement,
  ): ControlsManager {
    const controlsManager = new ControlsManager(camera, rendererElement);

    // ControlsManager is already properly configured in its constructor
    // It sets up OrbitControls with appropriate defaults

    return controlsManager;
  }

  /**
   * Creates a Layer2DManager with proper CSS2D setup and required layers.
   */
  static createLayer2DManager(
    scene: THREE.Scene,
    container: HTMLElement,
  ): Layer2DManager {
    const layer2DManager = new Layer2DManager(scene, container);

    // Register the required layers
    const celestialLayer = new CelestialLabelLayer(scene);
    layer2DManager.registerLayer(
      CSS2DLayerType.CELESTIAL_LABELS,
      celestialLayer,
    );

    return layer2DManager;
  }

  /**
   * Creates an ObjectManager with all required dependencies.
   */
  static createObjectManager(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    css2DManager: Layer2DManager,
    lightingManager: LightingManager,
  ): ObjectManager {
    return new ObjectManager(
      scene,
      camera,
      renderableStore.renderableObjects$,
      renderer,
      css2DManager,
      StateAccessor.accelerationVectors$(),
      lightingManager,
    );
  }

  /**
   * Creates an OrbitsManager with all required dependencies.
   */
  static createOrbitsManager(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    css2DManager: Layer2DManager,
  ): OrbitsManager {
    return new OrbitsManager(
      objectManager,
      stateAdapter,
      renderableStore.renderableObjects$,
      css2DManager,
      objectManager.getCelestialRenderers(),
    );
  }

  /**
   * Creates an AuMarkerManager with proper marker setup.
   */
  static createAuMarkerManager(
    scene: THREE.Scene,
    css2DManager: Layer2DManager,
  ): AuMarkerManager {
    const auMarkerManager = new AuMarkerManager(scene, css2DManager);

    // Create AU markers
    auMarkerManager.createMarkers();

    return auMarkerManager;
  }

  /**
   * Creates a RenderPipeline with all required dependencies.
   */
  static createRenderPipeline(options: {
    sceneManager: SceneManager;
    lightingManager: LightingManager;
    gridManager: GridManager;
    backgroundManager: BackgroundManager;
    objectManager: ObjectManager;
    orbitManager: OrbitsManager;
    controlsManager: ControlsManager;
    css2DManager: Layer2DManager;
  }): RenderPipeline {
    return new RenderPipeline(options);
  }

  /**
   * Creates a RendererStateAdapter with proper state setup.
   */
  static createRendererStateAdapter(): RendererStateAdapter {
    return new RendererStateAdapter();
  }

  /**
   * Creates an LODManager with proper LOD configuration.
   */
  static createLODManager(): LODManager {
    const lodManager = new LODManager();

    // LODManager is already properly configured in its constructor
    // It subscribes to performance profile changes and handles LOD scaling automatically

    return lodManager;
  }

  /**
   * Creates a complete set of services for a panel using factory methods.
   * This provides an alternative to the DI container for simpler use cases.
   */
  static createPanelServices(container: HTMLElement): {
    sceneManager: SceneManager;
    lightingManager: LightingManager;
    gridManager: GridManager;
    backgroundManager: BackgroundManager;
    controlsManager: ControlsManager;
    css2DManager: Layer2DManager;
    objectManager: ObjectManager;
    orbitManager: OrbitsManager;
    auMarkerManager: AuMarkerManager;
    renderPipeline: RenderPipeline;
  } {
    // Create scene manager first
    const sceneManager = this.createSceneManager(container);

    // Create other services with dependencies
    const lightingManager = this.createLightingManager(sceneManager.scene);
    const gridManager = this.createGridManager(sceneManager.scene);
    const backgroundManager = this.createBackgroundManager(
      sceneManager.scene,
      sceneManager.camera,
      sceneManager.getRendererBackend(),
    );
    const controlsManager = this.createControlsManager(
      sceneManager.camera,
      sceneManager.renderer.domElement,
    );
    const css2DManager = this.createLayer2DManager(
      sceneManager.scene,
      container,
    );
    const objectManager = this.createObjectManager(
      sceneManager.scene,
      sceneManager.camera,
      sceneManager.renderer,
      css2DManager,
      lightingManager,
    );

    // Create state adapter for orbits manager
    const stateAdapter = this.createRendererStateAdapter();
    const orbitManager = this.createOrbitsManager(
      objectManager,
      stateAdapter,
      css2DManager,
    );
    const auMarkerManager = this.createAuMarkerManager(
      sceneManager.scene,
      css2DManager,
    );

    // Create render pipeline
    const renderPipeline = this.createRenderPipeline({
      sceneManager,
      lightingManager,
      gridManager,
      backgroundManager,
      objectManager,
      orbitManager,
      controlsManager,
      css2DManager,
    });

    return {
      sceneManager,
      lightingManager,
      gridManager,
      backgroundManager,
      controlsManager,
      css2DManager,
      objectManager,
      orbitManager,
      auMarkerManager,
      renderPipeline,
    };
  }

  /**
   * Creates shared services using factory methods.
   */
  static createSharedServices(): {
    stateAdapter: RendererStateAdapter;
    lodManager: LODManager;
  } {
    return {
      stateAdapter: this.createRendererStateAdapter(),
      lodManager: this.createLODManager(),
    };
  }
}
