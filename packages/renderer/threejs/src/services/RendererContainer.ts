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
import { ServiceFactories } from "./ServiceFactories";
import type { RendererServices } from "./RendererServiceContainer";

/**
 * Service scope types for dependency injection.
 */
export enum ServiceScope {
  /** Singleton - one instance shared across all panels */
  SINGLETON = "singleton",
  /** Transient - new instance created for each request */
  TRANSIENT = "transient",
  /** Scoped - one instance per panel */
  SCOPED = "scoped",
}

/**
 * Service registration information.
 */
export interface ServiceRegistration<T = any> {
  /** The service identifier (usually a class or string) */
  token: string | symbol | Function;
  /** Factory function to create the service instance */
  factory: (...args: any[]) => T;
  /** Service scope (singleton, transient, or scoped) */
  scope: ServiceScope;
  /** Dependencies required by this service */
  dependencies: (string | symbol | Function)[];
  /** Whether this service has been resolved */
  resolved?: boolean;
}

/**
 * Service resolution context for scoped services.
 */
export interface ServiceContext {
  /** Unique identifier for the current scope (e.g., panel ID) */
  scopeId: string;
  /** Additional context data */
  data?: Record<string, any>;
}

/**
 * Advanced dependency injection container for the renderer system.
 *
 * This container provides:
 * - Service registration with different scopes (singleton, transient, scoped)
 * - Automatic dependency resolution
 * - Service factories for complex object creation
 * - Proper lifecycle management
 * - Type-safe service resolution
 */
export class RendererContainer {
  private static instance: RendererContainer;

  /** Service registrations */
  private registrations = new Map<
    string | symbol | Function,
    ServiceRegistration
  >();

  /** Singleton instances cache */
  private singletons = new Map<string | symbol | Function, any>();

  /** Scoped instances cache (scopeId -> service instances) */
  private scopedInstances = new Map<
    string,
    Map<string | symbol | Function, any>
  >();

  /** Current resolution context */
  private currentContext: ServiceContext | null = null;

  private constructor() {
    this.registerDefaultServices();
  }

  /**
   * Gets the singleton instance of the RendererContainer.
   */
  public static getInstance(): RendererContainer {
    if (!RendererContainer.instance) {
      RendererContainer.instance = new RendererContainer();
    }
    return RendererContainer.instance;
  }

  /**
   * Registers a service with the container.
   *
   * @param token - Service identifier
   * @param factory - Factory function to create the service
   * @param scope - Service scope
   * @param dependencies - Required dependencies
   */
  public register<T>(
    token: string | symbol | Function,
    factory: (...args: any[]) => T,
    scope: ServiceScope = ServiceScope.TRANSIENT,
    dependencies: (string | symbol | Function)[] = [],
  ): void {
    this.registrations.set(token, {
      token,
      factory,
      scope,
      dependencies,
      resolved: false,
    });
  }

  /**
   * Resolves a service from the container.
   *
   * @param token - Service identifier
   * @param context - Optional service context for scoped services
   * @returns The resolved service instance
   */
  public resolve<T>(
    token: string | symbol | Function,
    context?: ServiceContext,
  ): T {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // Handle different scopes
    switch (registration.scope) {
      case ServiceScope.SINGLETON:
        return this.resolveSingleton<T>(token, registration);
      case ServiceScope.SCOPED:
        return this.resolveScoped<T>(token, registration, context);
      case ServiceScope.TRANSIENT:
      default:
        return this.resolveTransient<T>(token, registration, context);
    }
  }

  /**
   * Resolves a singleton service.
   */
  private resolveSingleton<T>(
    token: string | symbol | Function,
    registration: ServiceRegistration,
  ): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const instance = this.createInstance<T>(registration);
    this.singletons.set(token, instance);
    return instance;
  }

  /**
   * Resolves a scoped service.
   */
  private resolveScoped<T>(
    token: string | symbol | Function,
    registration: ServiceRegistration,
    context?: ServiceContext,
  ): T {
    const scopeId = context?.scopeId || "default";

    if (!this.scopedInstances.has(scopeId)) {
      this.scopedInstances.set(scopeId, new Map());
    }

    const scopeMap = this.scopedInstances.get(scopeId)!;

    if (scopeMap.has(token)) {
      return scopeMap.get(token);
    }

    const instance = this.createInstance<T>(registration, context);
    scopeMap.set(token, instance);
    return instance;
  }

  /**
   * Resolves a transient service.
   */
  private resolveTransient<T>(
    token: string | symbol | Function,
    registration: ServiceRegistration,
    context?: ServiceContext,
  ): T {
    return this.createInstance<T>(registration, context);
  }

  /**
   * Creates a service instance with dependency injection.
   */
  private createInstance<T>(
    registration: ServiceRegistration,
    context?: ServiceContext,
  ): T {
    // Set current context for dependency resolution
    const previousContext = this.currentContext;
    this.currentContext = context || null;

    try {
      // Resolve dependencies
      const dependencies = registration.dependencies.map((dep) =>
        this.resolve(dep, context),
      );

      // Create instance using factory
      // Pass dependencies and context to the factory function
      let instance: T;
      if (context) {
        // Pass dependencies first, then context
        instance = registration.factory(...dependencies, context);
      } else {
        instance = registration.factory(...dependencies);
      }

      // Mark as resolved
      registration.resolved = true;

      return instance;
    } finally {
      // Restore previous context
      this.currentContext = previousContext;
    }
  }

  /**
   * Registers default services for the renderer system.
   */
  private registerDefaultServices(): void {
    // Shared services (singletons)
    this.register(
      "RendererStateAdapter",
      () => ServiceFactories.createRendererStateAdapter(),
      ServiceScope.SINGLETON,
    );

    this.register(
      "LODManager",
      () => ServiceFactories.createLODManager(),
      ServiceScope.SINGLETON,
    );

    // Panel services (scoped)
    this.register(
      "SceneManager",
      (context: ServiceContext) =>
        ServiceFactories.createSceneManager(
          context.data?.container || document.body,
        ),
      ServiceScope.SCOPED,
      [],
    );

    this.register(
      "LightingManager",
      (sceneManager: SceneManager, context?: ServiceContext) =>
        ServiceFactories.createLightingManager(sceneManager.scene),
      ServiceScope.SCOPED,
      ["SceneManager"],
    );

    this.register(
      "GridManager",
      (sceneManager: SceneManager, context?: ServiceContext) =>
        ServiceFactories.createGridManager(sceneManager.scene),
      ServiceScope.SCOPED,
      ["SceneManager"],
    );

    this.register(
      "BackgroundManager",
      (sceneManager: SceneManager, context?: ServiceContext) =>
        ServiceFactories.createBackgroundManager(
          sceneManager.scene,
          sceneManager.camera,
        ),
      ServiceScope.SCOPED,
      ["SceneManager"],
    );

    this.register(
      "ControlsManager",
      (sceneManager: SceneManager, context?: ServiceContext) =>
        ServiceFactories.createControlsManager(
          sceneManager.camera,
          sceneManager.renderer.domElement,
        ),
      ServiceScope.SCOPED,
      ["SceneManager"],
    );

    this.register(
      "Layer2DManager",
      (sceneManager: SceneManager, context: ServiceContext) =>
        ServiceFactories.createLayer2DManager(
          sceneManager.scene,
          context.data?.container || document.body,
        ),
      ServiceScope.SCOPED,
      ["SceneManager"],
    );

    this.register(
      "ObjectManager",
      (
        sceneManager: SceneManager,
        lightingManager: LightingManager,
        css2DManager: Layer2DManager,
        context?: ServiceContext,
      ) =>
        ServiceFactories.createObjectManager(
          sceneManager.scene,
          sceneManager.camera,
          sceneManager.renderer,
          css2DManager,
          lightingManager,
        ),
      ServiceScope.SCOPED,
      ["SceneManager", "LightingManager", "Layer2DManager"],
    );

    this.register(
      "OrbitsManager",
      (
        objectManager: ObjectManager,
        css2DManager: Layer2DManager,
        context?: ServiceContext,
      ) =>
        ServiceFactories.createOrbitsManager(
          objectManager,
          this.resolve("RendererStateAdapter"),
          css2DManager,
        ),
      ServiceScope.SCOPED,
      ["ObjectManager", "Layer2DManager"],
    );

    this.register(
      "AuMarkerManager",
      (
        sceneManager: SceneManager,
        css2DManager: Layer2DManager,
        context?: ServiceContext,
      ) =>
        ServiceFactories.createAuMarkerManager(
          sceneManager.scene,
          css2DManager,
        ),
      ServiceScope.SCOPED,
      ["SceneManager", "Layer2DManager"],
    );

    this.register(
      "RenderPipeline",
      (
        sceneManager: SceneManager,
        lightingManager: LightingManager,
        gridManager: GridManager,
        backgroundManager: BackgroundManager,
        objectManager: ObjectManager,
        orbitManager: OrbitsManager,
        controlsManager: ControlsManager,
        css2DManager: Layer2DManager,
        context?: ServiceContext,
      ) =>
        ServiceFactories.createRenderPipeline({
          sceneManager,
          controlsManager,
          orbitManager,
          objectManager,
          backgroundManager,
          lightingManager,
          gridManager,
          css2DManager,
        }),
      ServiceScope.SCOPED,
      [
        "SceneManager",
        "LightingManager",
        "GridManager",
        "BackgroundManager",
        "ObjectManager",
        "OrbitsManager",
        "ControlsManager",
        "Layer2DManager",
      ],
    );
  }

  /**
   * Creates a complete set of services for a panel.
   *
   * @param container - HTML container element
   * @param panelId - Unique panel identifier
   * @returns Complete set of services for the panel
   */
  public createPanelServices(
    container: HTMLElement,
    panelId: string,
  ): RendererServices {
    const context: ServiceContext = { scopeId: panelId, data: { container } };

    // Get shared services
    const stateAdapter = this.resolve<RendererStateAdapter>(
      "RendererStateAdapter",
    );
    const lodManager = this.resolve<LODManager>("LODManager");

    // Create panel services with context
    const sceneManager = this.resolve<SceneManager>("SceneManager", context);
    const lightingManager = this.resolve<LightingManager>(
      "LightingManager",
      context,
    );
    const gridManager = this.resolve<GridManager>("GridManager", context);
    const backgroundManager = this.resolve<BackgroundManager>(
      "BackgroundManager",
      context,
    );
    const controlsManager = this.resolve<ControlsManager>(
      "ControlsManager",
      context,
    );
    const css2DManager = this.resolve<Layer2DManager>(
      "Layer2DManager",
      context,
    );
    const objectManager = this.resolve<ObjectManager>("ObjectManager", context);
    const orbitManager = this.resolve<OrbitsManager>("OrbitsManager", context);
    const auMarkerManager = this.resolve<AuMarkerManager>(
      "AuMarkerManager",
      context,
    );
    const renderPipeline = this.resolve<RenderPipeline>(
      "RenderPipeline",
      context,
    );

    return {
      // Shared services
      stateAdapter,
      lodManager,
      // Panel services
      sceneManager,
      lightingManager,
      gridManager,
      backgroundManager,
      objectManager,
      orbitManager,
      controlsManager,
      css2DManager,
      auMarkerManager,
      renderPipeline,
    };
  }

  /**
   * Disposes of all services in a specific scope.
   *
   * @param scopeId - Scope identifier to dispose
   */
  public disposeScope(scopeId: string): void {
    const scopeMap = this.scopedInstances.get(scopeId);
    if (scopeMap) {
      // Dispose all services in the scope
      for (const [token, instance] of scopeMap) {
        if (instance && typeof instance.dispose === "function") {
          instance.dispose();
        }
      }
      this.scopedInstances.delete(scopeId);
    }
  }

  /**
   * Disposes of all singleton services.
   */
  public disposeSingletons(): void {
    for (const [token, instance] of this.singletons) {
      if (instance && typeof instance.dispose === "function") {
        instance.dispose();
      }
    }
    this.singletons.clear();
  }

  /**
   * Disposes of all services and clears the container.
   */
  public disposeAll(): void {
    // Dispose all scoped services
    for (const scopeId of this.scopedInstances.keys()) {
      this.disposeScope(scopeId);
    }

    // Dispose all singleton services
    this.disposeSingletons();

    // Clear registrations
    this.registrations.clear();
  }

  /**
   * Gets information about registered services.
   */
  public getServiceInfo(): Array<{
    token: string;
    scope: ServiceScope;
    dependencies: string[];
    resolved: boolean;
  }> {
    return Array.from(this.registrations.values()).map((reg) => ({
      token: String(reg.token),
      scope: reg.scope,
      dependencies: reg.dependencies.map((dep) => String(dep)),
      resolved: reg.resolved || false,
    }));
  }
}
