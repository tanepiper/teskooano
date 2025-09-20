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

/**
 * Shared dependencies that are common across all renderer instances.
 * These services are singletons and can be shared between multiple panels.
 */
export interface SharedRendererServices {
  readonly stateAdapter: RendererStateAdapter;
  readonly lodManager: LODManager;
}

/**
 * Panel-specific dependencies that are unique to each renderer instance.
 * These services are created per panel and should not be shared.
 */
export interface PanelRendererServices {
  readonly sceneManager: SceneManager;
  readonly lightingManager: LightingManager;
  readonly gridManager: GridManager;
  readonly backgroundManager: BackgroundManager;
  readonly objectManager: ObjectManager;
  readonly orbitManager: OrbitsManager;
  readonly controlsManager: ControlsManager;
  readonly css2DManager: Layer2DManager;
  readonly auMarkerManager: AuMarkerManager;
  readonly renderPipeline: RenderPipeline;
}

/**
 * Complete set of services for a renderer instance.
 */
export interface RendererServices
  extends SharedRendererServices,
    PanelRendererServices {}

/**
 * Options for creating panel-specific services.
 */
export interface PanelServiceOptions {
  container: HTMLElement;
  sceneManager: SceneManager;
  lightingManager: LightingManager;
  gridManager: GridManager;
  backgroundManager: BackgroundManager;
  css2DManager: Layer2DManager;
  controlsManager: ControlsManager;
}

/**
 * Service container that manages the creation and lifecycle of renderer services.
 *
 * This container follows the established singleton pattern from the core packages
 * and provides clear separation between shared (singleton) and panel-specific services.
 *
 * Key features:
 * - Shared services are singletons (stateAdapter, lodManager)
 * - Panel services are created per instance (scene, lighting, etc.)
 * - Constructor injection for all dependencies
 * - Proper resource disposal and cleanup
 * - Clear service boundaries and interfaces
 */
export class RendererServiceContainer {
  private static instance: RendererServiceContainer;

  // Shared services (singletons)
  private _sharedServices: SharedRendererServices | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance of the RendererServiceContainer.
   */
  public static getInstance(): RendererServiceContainer {
    if (!RendererServiceContainer.instance) {
      RendererServiceContainer.instance = new RendererServiceContainer();
    }
    return RendererServiceContainer.instance;
  }

  /**
   * Gets or creates the shared services (singletons).
   * These services are shared across all renderer instances.
   */
  public getSharedServices(): SharedRendererServices {
    if (!this._sharedServices) {
      this._sharedServices = {
        stateAdapter: new RendererStateAdapter(),
        lodManager: new LODManager(),
      };
    }
    return this._sharedServices;
  }

  /**
   * Creates panel-specific services for a new renderer instance.
   * These services are unique to each panel and should not be shared.
   *
   * @param options - Configuration options for creating panel services
   * @returns Complete set of services for the panel
   */
  public createPanelServices(
    options: PanelServiceOptions,
  ): PanelRendererServices {
    // Validate all required dependencies are provided
    this.validatePanelServiceOptions(options);

    const sharedServices = this.getSharedServices();

    // Create object manager with all required dependencies
    const objectManager = new ObjectManager(
      options.sceneManager.scene,
      options.sceneManager.camera,
      renderableStore.renderableObjects$,
      options.sceneManager.renderer,
      options.css2DManager,
      StateAccessor.accelerationVectors$(), // Provide acceleration vectors
      options.lightingManager, // Pass the shared lighting manager
    );

    // Create orbit manager with all required dependencies
    const orbitManager = new OrbitsManager(
      objectManager,
      sharedServices.stateAdapter,
      renderableStore.renderableObjects$,
      options.css2DManager,
      objectManager.getCelestialRenderers(),
    );

    // Create AU marker manager
    const auMarkerManager = new AuMarkerManager(
      options.sceneManager.scene,
      options.css2DManager,
    );
    auMarkerManager.createMarkers();

    // Create render pipeline with all required dependencies
    const renderPipeline = new RenderPipeline({
      sceneManager: options.sceneManager,
      controlsManager: options.controlsManager,
      orbitManager,
      objectManager,
      backgroundManager: options.backgroundManager,
      lightingManager: options.lightingManager,
      gridManager: options.gridManager,
      css2DManager: options.css2DManager,
    });

    return {
      sceneManager: options.sceneManager,
      lightingManager: options.lightingManager,
      gridManager: options.gridManager,
      backgroundManager: options.backgroundManager,
      objectManager,
      orbitManager,
      controlsManager: options.controlsManager,
      css2DManager: options.css2DManager,
      auMarkerManager,
      renderPipeline,
    };
  }

  /**
   * Creates a complete set of services for a new renderer instance.
   * This is the main entry point for creating all services needed by a panel.
   *
   * @param container - The HTML container element for the renderer
   * @returns Complete set of services for the renderer
   */
  public createRendererServices(container: HTMLElement): RendererServices {
    const sharedServices = this.getSharedServices();

    // Create core scene manager
    const sceneManager = new SceneManager(container, {
      antialias: true,
    });

    // Create lighting manager
    const lightingManager = new LightingManager(sceneManager.scene);

    // Create grid manager
    const gridManager = new GridManager(sceneManager.scene);

    // Create background manager
    const backgroundManager = new BackgroundManager(
      sceneManager.scene,
      sceneManager.camera,
    );
    backgroundManager.setCamera(sceneManager.camera);

    // Create 2D layer manager
    const css2DManager = new Layer2DManager(sceneManager.scene, container);
    const celestialLayer = new CelestialLabelLayer(sceneManager.scene);
    css2DManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);

    // Create controls manager
    const controlsManager = new ControlsManager(
      sceneManager.camera,
      sceneManager.renderer.domElement,
    );

    // Create panel-specific services
    const panelServices = this.createPanelServices({
      container,
      sceneManager,
      lightingManager,
      gridManager,
      backgroundManager,
      css2DManager,
      controlsManager,
    });

    // Combine shared and panel services
    return {
      ...sharedServices,
      ...panelServices,
    };
  }

  /**
   * Disposes of shared services.
   * This should only be called when the entire application is shutting down.
   */
  public disposeSharedServices(): void {
    if (this._sharedServices) {
      this._sharedServices.stateAdapter.dispose();
      this._sharedServices = null;
    }
  }

  /**
   * Disposes of panel-specific services.
   * This should be called when a panel is being destroyed.
   *
   * @param services - The panel services to dispose
   */
  public disposePanelServices(services: PanelRendererServices): void {
    services.sceneManager.dispose();
    services.objectManager.dispose();
    services.orbitManager.dispose();
    services.backgroundManager.dispose();
    services.lightingManager.dispose();
    services.gridManager.dispose();
    services.controlsManager.dispose();
    services.css2DManager?.dispose();
    services.auMarkerManager?.dispose();
  }

  /**
   * Disposes of all services (both shared and panel-specific).
   * This should only be called when the entire application is shutting down.
   *
   * @param services - The services to dispose (optional, for panel services)
   */
  public disposeAll(services?: PanelRendererServices): void {
    if (services) {
      this.disposePanelServices(services);
    }
    this.disposeSharedServices();
  }

  /**
   * Validates that all required dependencies are provided for panel service creation.
   * This helps catch missing dependencies early and provides clear error messages.
   *
   * @param options - The panel service options to validate
   * @throws Error if any required dependency is missing
   */
  private validatePanelServiceOptions(options: PanelServiceOptions): void {
    const missingDependencies: string[] = [];

    if (!options.container) {
      missingDependencies.push("container");
    }
    if (!options.sceneManager) {
      missingDependencies.push("sceneManager");
    }
    if (!options.lightingManager) {
      missingDependencies.push("lightingManager");
    }
    if (!options.gridManager) {
      missingDependencies.push("gridManager");
    }
    if (!options.backgroundManager) {
      missingDependencies.push("backgroundManager");
    }
    if (!options.css2DManager) {
      missingDependencies.push("css2DManager");
    }
    if (!options.controlsManager) {
      missingDependencies.push("controlsManager");
    }

    if (missingDependencies.length > 0) {
      throw new Error(
        `RendererServiceContainer: Missing required dependencies: ${missingDependencies.join(", ")}. ` +
          "All dependencies must be provided for proper service initialization.",
      );
    }

    // Validate that the scene manager has all required Three.js objects
    if (!options.sceneManager.scene) {
      missingDependencies.push("sceneManager.scene");
    }
    if (!options.sceneManager.camera) {
      missingDependencies.push("sceneManager.camera");
    }
    if (!options.sceneManager.renderer) {
      missingDependencies.push("sceneManager.renderer");
    }

    if (missingDependencies.length > 0) {
      throw new Error(
        `RendererServiceContainer: SceneManager missing required Three.js objects: ${missingDependencies.join(", ")}. ` +
          "SceneManager must be fully initialized before creating panel services.",
      );
    }
  }
}
