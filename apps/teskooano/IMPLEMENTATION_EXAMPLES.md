# Implementation Examples for Architecture Improvements

This document provides concrete implementation examples for the recommendations outlined in [CODE_QUALITY_ANALYSIS.md](./CODE_QUALITY_ANALYSIS.md).

## 🔄 Eliminating Code Duplication

### Example 1: StateSubscriptionMixin Implementation

**Create the mixin base class:**

```typescript
// apps/teskooano/src/core/components/mixins/StateSubscriptionMixin.ts
import { Observable, Subscription } from "rxjs";

/**
 * Mixin class that provides standardized RxJS subscription management.
 * Eliminates the boilerplate subscription pattern found across plugins.
 */
export class StateSubscriptionMixin {
  protected subscriptions = new Subscription();

  /**
   * Subscribe to an observable with automatic cleanup management.
   */
  protected subscribeToState<T>(
    observable: Observable<T>,
    handler: (value: T) => void,
    errorHandler?: (error: any) => void,
  ): void {
    this.subscriptions.add(
      observable.subscribe({
        next: handler,
        error: errorHandler || this.defaultErrorHandler,
      }),
    );
  }

  /**
   * Subscribe to multiple observables with a single handler.
   */
  protected subscribeToMultipleStates<T>(
    observables: Observable<T>[],
    handler: (value: T) => void,
  ): void {
    observables.forEach((obs) => this.subscribeToState(obs, handler));
  }

  /**
   * Default error handler for subscriptions.
   */
  private defaultErrorHandler(error: any): void {
    console.error("[StateSubscriptionMixin] Subscription error:", error);
  }

  /**
   * Clean up all subscriptions. Should be called in component disposal.
   */
  public dispose(): void {
    this.subscriptions.unsubscribe();
  }
}
```

**Refactor existing plugin to use the mixin:**

```typescript
// apps/teskooano/src/plugins/celestial-info/view/CelestialInfo.view.ts
import { StateSubscriptionMixin } from "../../../core/components/mixins/StateSubscriptionMixin.js";
import { celestialObjects$, simulationState$ } from "@teskooano/core-state";
import { CelestialInfoController } from "../controller/CelestialInfo.controller.js";

export class CelestialInfo extends StateSubscriptionMixin {
  static componentName = "celestial-info";

  private controller: CelestialInfoController;
  private shadowRoot: ShadowRoot;

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: "open" });
    this.controller = new CelestialInfoController(this.shadowRoot);
  }

  public init(params: any): void {
    this.controller.setContext(params.context);

    // ✅ Clean, standardized subscription pattern
    this.subscribeToState(celestialObjects$, (objects) =>
      this.controller.handleCelestialObjectsUpdate(objects),
    );

    this.subscribeToState(simulationState$, (state) =>
      this.controller.handleSimulationStateUpdate(state),
    );
  }

  public dispose(): void {
    this.controller.dispose();
    super.dispose(); // Clean up subscriptions
  }
}
```

### Example 2: Plugin Factory Implementation

**Create the plugin factory:**

```typescript
// apps/teskooano/src/core/utils/plugin-factory.ts
import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
  ToolbarTarget,
} from "@teskooano/ui-plugin";

interface PanelPluginConfig {
  id: string;
  name: string;
  description: string;
  componentName: string;
  panelClass: any;
  defaultTitle: string;
  iconSvg: string;
  buttonTitle?: string;
  order?: number;
  target?: ToolbarTarget;
  additionalComponents?: ComponentConfig[];
  additionalFunctions?: any[];
}

/**
 * Factory function to create standard panel plugins with minimal boilerplate.
 */
export function createPanelPlugin(config: PanelPluginConfig): TeskooanoPlugin {
  const panelConfig: PanelConfig = {
    componentName: config.componentName,
    panelClass: config.panelClass,
    defaultTitle: config.defaultTitle,
  };

  const toolbarRegistration: ToolbarRegistration = {
    target: config.target || "engine-toolbar",
    items: [
      {
        id: `${config.id}-button`,
        type: "panel",
        title: config.buttonTitle || config.defaultTitle,
        iconSvg: config.iconSvg,
        componentName: config.componentName,
        behaviour: "toggle",
        order: config.order || 10,
      },
    ],
  };

  // Always include the main component
  const components: ComponentConfig[] = [
    {
      tagName: config.componentName,
      componentClass: config.panelClass,
    },
    ...(config.additionalComponents || []),
  ];

  return {
    id: config.id,
    name: config.name,
    description: config.description,
    panels: [panelConfig],
    toolbarRegistrations: [toolbarRegistration],
    components: components,
    functions: config.additionalFunctions || [],
    managerClasses: [],
  };
}

/**
 * Factory for plugins that only provide functions (no UI).
 */
export function createFunctionPlugin(config: {
  id: string;
  name: string;
  description: string;
  functions: any[];
}): TeskooanoPlugin {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    panels: [],
    toolbarRegistrations: [],
    components: [],
    functions: config.functions,
    managerClasses: [],
  };
}
```

**Refactor existing plugin:**

```typescript
// apps/teskooano/src/plugins/celestial-info/index.ts
import { createPanelPlugin } from "../../core/utils/plugin-factory.js";
import { CelestialInfo } from "./view/CelestialInfo.view.js";
import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";

// Import all the sub-components
import { AsteroidFieldInfoComponent } from "./bodies/AsteroidFieldInfo.js";
import { GasGiantInfoComponent } from "./bodies/GasGiantInfo.js";
// ... other components

const additionalComponents = [
  {
    tagName: "asteroid-field-info",
    componentClass: AsteroidFieldInfoComponent,
  },
  { tagName: "gas-giant-info", componentClass: GasGiantInfoComponent },
  // ... other components
];

// ✅ Dramatically simplified plugin definition
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-info",
  name: "Celestial Info Display",
  description: "Shows detailed celestial object information",
  componentName: "celestial-info",
  panelClass: CelestialInfo,
  defaultTitle: "Celestial Info",
  iconSvg: InfoIcon,
  order: 30,
  additionalComponents: additionalComponents,
});
```

## 🧠 Reducing Cognitive Complexity

### Example 3: Breaking Down main.ts

**Create initialization modules:**

```typescript
// apps/teskooano/src/core/initialization/environment.ts
export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(`Environment validation failed: ${message}`);
    this.name = "EnvironmentValidationError";
  }
}

export function validateEnvironment(): {
  appElement: HTMLElement;
  toolbarElement: HTMLElement;
} {
  const appElement = document.getElementById("app");
  const toolbarElement = document.getElementById("toolbar");

  if (!appElement) {
    throw new EnvironmentValidationError(
      "Application container element (#app) not found",
    );
  }

  if (!toolbarElement) {
    throw new EnvironmentValidationError(
      "Toolbar container element (#toolbar) not found",
    );
  }

  return { appElement, toolbarElement };
}
```

```typescript
// apps/teskooano/src/core/initialization/plugin-system.ts
import { pluginManager } from "@teskooano/ui-plugin";
import { pluginConfig } from "../../config/pluginRegistry";
import { pluginConfig as corePluginConfig } from "../config/pluginRegistry";

export async function initializePluginSystem(): Promise<void> {
  console.log("🔌 Loading plugins...");

  const pluginIds = [
    ...Object.keys(corePluginConfig),
    ...Object.keys(pluginConfig),
  ];

  await pluginManager.loadAndRegisterPlugins(pluginIds);

  // Initially set null dependencies - will be updated after dockview init
  pluginManager.setAppDependencies({
    dockviewApi: null as any,
    dockviewController: null,
  });

  console.log(`✅ Loaded ${pluginIds.length} plugins`);
}
```

```typescript
// apps/teskooano/src/core/initialization/dockview.ts
import { pluginManager } from "@teskooano/ui-plugin";
import type { DockviewApi } from "dockview-core";

export interface DockviewInitResult {
  controller: any;
  api: DockviewApi;
}

export async function initializeDockview(
  appElement: HTMLElement,
): Promise<DockviewInitResult> {
  console.log("🪟 Initializing Dockview...");

  try {
    const result: any = await pluginManager.execute("dockview:initialize", {
      appElement,
    });

    if (!result || typeof result !== "object") {
      throw new Error("Dockview initialization returned invalid result");
    }

    if (!("controller" in result) || !("api" in result)) {
      throw new Error("Dockview initialization missing required properties");
    }

    const { controller, api } = result;

    // Update plugin manager with real dependencies
    pluginManager.setAppDependencies({
      dockviewApi: api,
      dockviewController: controller,
    });

    console.log("✅ Dockview initialized successfully");
    return { controller, api };
  } catch (error) {
    console.error("[Dockview] Initialization failed:", error);
    throw new Error(`Dockview initialization failed: ${error.message}`);
  }
}
```

```typescript
// apps/teskooano/src/core/initialization/managers.ts
import { pluginManager } from "@teskooano/ui-plugin";

const MANAGER_INIT_SEQUENCE = [
  { id: "engine-view:initialize", name: "Engine View" },
  { id: "toolbar:initialize", name: "Toolbar" },
  { id: "tour:initialize", name: "Tour Controller" },
  { id: "system-controls:initialize", name: "System Controls" },
] as const;

export async function initializeManagers(
  appElement: HTMLElement,
  toolbarElement: HTMLElement,
  dockviewController: any,
): Promise<void> {
  console.log("⚙️ Initializing managers...");

  for (const manager of MANAGER_INIT_SEQUENCE) {
    try {
      console.log(`  Initializing ${manager.name}...`);

      await pluginManager.execute(manager.id, {
        targetElement: manager.id.includes("toolbar")
          ? toolbarElement
          : appElement,
        dockviewController,
      });
    } catch (error) {
      console.error(
        `[Manager Init] Failed to initialize ${manager.name}:`,
        error,
      );
      throw new Error(`Manager initialization failed: ${manager.name}`);
    }
  }

  // Initialize modal manager separately as it has different signature
  const modalManager = pluginManager.getManagerInstance<any>("modal-manager");
  if (!modalManager) {
    throw new Error("Failed to get ModalManager instance from plugin manager");
  }

  if (typeof modalManager.initialize === "function") {
    modalManager.initialize(dockviewController);
  } else {
    throw new Error("ModalManager instance does not have an initialize method");
  }

  console.log("✅ All managers initialized");
}
```

**Simplified main.ts:**

```typescript
// apps/teskooano/src/main.ts (simplified)
import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";

import { validateEnvironment } from "./core/initialization/environment.js";
import { initializePluginSystem } from "./core/initialization/plugin-system.js";
import { initializeDockview } from "./core/initialization/dockview.js";
import { initializeManagers } from "./core/initialization/managers.js";
import { registerPanelComponents } from "./core/initialization/panel-registration.js";
import { createInitialPanels } from "./core/initialization/initial-panels.js";
import { setupEventListeners } from "./core/initialization/event-listeners.js";

export const appContext = {
  modalManager: null as any,
  dockviewController: null as any,
};

async function initializeApp(): Promise<void> {
  console.log("🔭 Initializing Teskooano...");

  try {
    // Phase 1: Environment validation
    const { appElement, toolbarElement } = validateEnvironment();

    // Phase 2: Plugin system setup
    await initializePluginSystem();

    // Phase 3: UI framework initialization
    const { controller: dockviewController, api: dockviewApi } =
      await initializeDockview(appElement);

    // Phase 4: Manager initialization
    await initializeManagers(appElement, toolbarElement, dockviewController);

    // Phase 5: Component registration
    await registerPanelComponents(dockviewController);

    // Phase 6: Initial UI setup
    await createInitialPanels(dockviewController);

    // Phase 7: Event system setup
    setupEventListeners();

    // Update global context
    appContext.dockviewController = dockviewController;
    appContext.modalManager = pluginManager.getManagerInstance("modal-manager");

    console.log("🪐 Teskooano Initialized successfully!");
  } catch (error) {
    console.error("💥 Application initialization failed:", error);

    // Could show user-friendly error dialog here
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h2>Application Failed to Initialize</h2>
        <p>${errorMessage}</p>
        <p>Please refresh the page or check the console for more details.</p>
      </div>
    `;

    throw error;
  }
}

// Start the application
initializeApp().catch(console.error);
```

### Example 4: Plugin Manager Decomposition

**Extract plugin loading logic:**

```typescript
// packages/app/ui-plugin/src/managers/plugin-loader.ts
import type { TeskooanoPlugin } from "../types.js";

export class PluginLoader {
  private loaders: Record<string, () => Promise<any>>;

  constructor(loaders: Record<string, () => Promise<any>>) {
    this.loaders = loaders;
  }

  /**
   * Load plugins with dependency resolution.
   */
  async loadPlugins(
    pluginIds: string[],
  ): Promise<Map<string, TeskooanoPlugin>> {
    const loadedPlugins = new Map<string, TeskooanoPlugin>();
    const allRequestedIds = new Set(pluginIds);
    const processingOrder: string[] = [];

    await this.performTopologicalSort(allRequestedIds, {
      loadedPlugins,
      processingOrder,
    });

    return loadedPlugins;
  }

  private async performTopologicalSort(
    allRequestedIds: Set<string>,
    context: {
      loadedPlugins: Map<string, TeskooanoPlugin>;
      processingOrder: string[];
    },
  ): Promise<void> {
    const visited = new Set<string>();
    const processing = new Set<string>();

    const resolve = async (pluginId: string): Promise<void> => {
      if (processing.has(pluginId)) {
        throw new Error(`Circular dependency detected: ${pluginId}`);
      }
      if (visited.has(pluginId)) return;

      processing.add(pluginId);

      const plugin = await this.loadSinglePlugin(pluginId);
      context.loadedPlugins.set(pluginId, plugin);

      // Resolve dependencies
      if (plugin.dependencies) {
        for (const depId of plugin.dependencies) {
          if (
            !allRequestedIds.has(depId) &&
            !context.loadedPlugins.has(depId)
          ) {
            throw new Error(`Unmet dependency: ${pluginId} -> ${depId}`);
          }
          if (!context.loadedPlugins.has(depId)) {
            await resolve(depId);
          }
        }
      }

      processing.delete(pluginId);
      visited.add(pluginId);
      context.processingOrder.push(pluginId);
    };

    for (const id of allRequestedIds) {
      if (!context.loadedPlugins.has(id)) {
        await resolve(id);
      }
    }
  }

  private async loadSinglePlugin(pluginId: string): Promise<TeskooanoPlugin> {
    const loader = this.loaders[pluginId];
    if (!loader) {
      throw new Error(`No loader found for plugin: ${pluginId}`);
    }

    const module = await loader();
    if (!module.plugin) {
      throw new Error(`Plugin module missing 'plugin' export: ${pluginId}`);
    }

    return module.plugin;
  }
}
```

**Extract function execution logic:**

```typescript
// packages/app/ui-plugin/src/managers/plugin-executor.ts
import type {
  PluginExecutionContext,
  FunctionConfig,
  RegisteredItem,
} from "../types.js";

export class PluginExecutor {
  constructor(
    private functionRegistry: Map<string, RegisteredItem<FunctionConfig>>,
    private getAppDependencies: () => {
      dockviewApi: any;
      dockviewController: any;
    },
  ) {}

  execute<T = any>(functionId: string, args?: any): Promise<T> | T | undefined {
    const funcConfig = this.functionRegistry.get(functionId);
    if (!funcConfig) {
      console.error(`[PluginExecutor] Function '${functionId}' not found.`);
      return undefined;
    }

    const context = this.createExecutionContext();

    try {
      return funcConfig.execute(context, args);
    } catch (error) {
      console.error(
        `[PluginExecutor] Error executing function '${functionId}':`,
        error,
      );
      throw error;
    }
  }

  private createExecutionContext(): PluginExecutionContext {
    const { dockviewApi, dockviewController } = this.getAppDependencies();

    return {
      pluginManager: this, // Note: This would need to be the main PluginManager
      dockviewApi,
      dockviewController,
      getManager: this.getManager.bind(this),
      executeFunction: this.execute.bind(this),
    };
  }

  private getManager<T = any>(id: string): T | undefined {
    // This would delegate to the main plugin manager's getManagerInstance
    throw new Error(
      "getManager should be implemented by the main PluginManager",
    );
  }
}
```

**Simplified PluginManager:**

```typescript
// packages/app/ui-plugin/src/pluginManager.ts (simplified)
export class PluginManager {
  private loader: PluginLoader;
  private executor: PluginExecutor;
  private registrationManager: RegistrationManager;
  private hmrManager: HMRManager;

  private appDependencies = {
    dockviewApi: null as any,
    dockviewController: null as any,
  };

  constructor() {
    this.registrationManager = new RegistrationManager(/* registries */);
    this.loader = new PluginLoader(pluginLoaders);
    this.executor = new PluginExecutor(
      this.registrationManager.getFunctionRegistry(),
      () => this.appDependencies,
    );
    this.hmrManager = new HMRManager(this.loader, this.registrationManager);
  }

  async loadAndRegisterPlugins(pluginIds: string[]): Promise<void> {
    const plugins = await this.loader.loadPlugins(pluginIds);

    for (const [pluginId, plugin] of plugins) {
      this.registerPlugin(plugin);
    }
  }

  execute<T = any>(functionId: string, args?: any): Promise<T> | T | undefined {
    return this.executor.execute(functionId, args);
  }

  setAppDependencies(deps: {
    dockviewApi: any;
    dockviewController: any;
  }): void {
    this.appDependencies = deps;
    this.registrationManager.setDependencies({ dockviewApi: deps.dockviewApi });
  }

  // Other methods delegate to appropriate managers...
}
```

## 🏗️ Fixing Architectural Misplacement

### Example 5: Separating UI from Business Logic

**Create business logic in core:**

```typescript
// packages/core/physics/src/camera/CameraPhysics.ts
import type { CelestialObject } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Pure physics calculations for camera positioning.
 * No UI dependencies - can be tested in isolation.
 */
export class CameraPhysics {
  /**
   * Calculate optimal viewing distance for an object based on its size.
   */
  calculateOptimalViewingDistance(object: CelestialObject): number {
    const baseRadius = object.physicalCharacteristics.radius;
    const massInfluence = Math.log10(object.physicalCharacteristics.mass) * 0.1;

    // Standard viewing distance is 3x the radius, adjusted for mass
    return baseRadius * 3 * (1 + massInfluence);
  }

  /**
   * Calculate safe approach distance (minimum distance to avoid collision).
   */
  calculateSafeApproachDistance(object: CelestialObject): number {
    return object.physicalCharacteristics.radius * 1.5;
  }

  /**
   * Calculate transition path between two points with physics constraints.
   */
  calculateTransitionPath(
    startPosition: OSVector3,
    targetPosition: OSVector3,
    duration: number,
  ): OSVector3[] {
    // Implement smooth transition curve (e.g., Bézier curve)
    const steps = Math.ceil(duration * 60); // 60 FPS
    const path: OSVector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Simple linear interpolation (could be improved with curves)
      const position = startPosition.lerp(targetPosition, t);
      path.push(position);
    }

    return path;
  }
}
```

**UI orchestration in application layer:**

```typescript
// apps/teskooano/src/camera/UICameraManager.ts
import { CameraPhysics } from "@teskooano/core-physics/camera";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CelestialObject } from "@teskooano/data-types";
import { BehaviorSubject, Observable } from "rxjs";

interface CameraState {
  focusedObjectId: string | null;
  isFollowing: boolean;
  targetPosition: { x: number; y: number; z: number } | null;
}

/**
 * UI layer camera manager that orchestrates business logic with rendering.
 */
export class UICameraManager {
  private physics: CameraPhysics;
  private cameraState$ = new BehaviorSubject<CameraState>({
    focusedObjectId: null,
    isFollowing: false,
    targetPosition: null,
  });

  constructor(private renderer: ModularSpaceRenderer) {
    this.physics = new CameraPhysics();
    this.setupUserInteractionListeners();
  }

  /**
   * Public API for focusing on an object.
   */
  async focusOnObject(object: CelestialObject): Promise<void> {
    const optimalDistance =
      this.physics.calculateOptimalViewingDistance(object);
    const safeDistance = Math.max(
      optimalDistance,
      this.physics.calculateSafeApproachDistance(object),
    );

    await this.transitionToObject(object, safeDistance);

    this.updateState({
      focusedObjectId: object.id,
      isFollowing: false,
      targetPosition: object.position,
    });
  }

  /**
   * Start following an object (camera moves with it).
   */
  startFollowing(object: CelestialObject): void {
    const followDistance = this.physics.calculateOptimalViewingDistance(object);

    this.renderer.setFollowTargetObject(
      this.renderer.getObjectById(object.id),
      new THREE.Vector3(0, 0, followDistance),
    );

    this.updateState({
      focusedObjectId: object.id,
      isFollowing: true,
      targetPosition: object.position,
    });
  }

  /**
   * Observable camera state for UI components.
   */
  get cameraState(): Observable<CameraState> {
    return this.cameraState$.asObservable();
  }

  private async transitionToObject(
    object: CelestialObject,
    distance: number,
  ): Promise<void> {
    // Use business logic to calculate transition
    const currentPos = this.renderer.camera.position;
    const targetPos = object.position;

    // Delegate to renderer for actual movement
    return new Promise((resolve) => {
      this.renderer.controlsManager.transitionTo(targetPos, distance);

      // Listen for transition complete event
      const handleComplete = () => {
        document.removeEventListener(
          "camera-transition-complete",
          handleComplete,
        );
        resolve();
      };
      document.addEventListener("camera-transition-complete", handleComplete);
    });
  }

  private setupUserInteractionListeners(): void {
    // Listen for user camera manipulation to clear focus
    document.addEventListener("camera-user-manipulation", () => {
      this.updateState({
        focusedObjectId: null,
        isFollowing: false,
        targetPosition: null,
      });
    });
  }

  private updateState(partialState: Partial<CameraState>): void {
    const currentState = this.cameraState$.value;
    this.cameraState$.next({ ...currentState, ...partialState });
  }
}
```

**Plugin integration:**

```typescript
// apps/teskooano/src/plugins/celestial-hierarchy/controller/CelestialHierarchy.controller.ts
import { UICameraManager } from "../../../camera/UICameraManager.js";
import type { CelestialObject } from "@teskooano/data-types";

export class CelestialHierarchyController {
  constructor(
    private cameraManager: UICameraManager,
    // ... other dependencies
  ) {}

  /**
   * Handle user clicking on an object in the hierarchy.
   */
  async handleObjectClick(objectId: string): Promise<void> {
    const object = this.getCelestialObject(objectId);
    if (!object) return;

    // Delegate to UI camera manager (which uses business logic)
    await this.cameraManager.focusOnObject(object);

    // Update UI state
    this.setSelectedObject(objectId);
  }

  /**
   * Handle user requesting to follow an object.
   */
  handleFollowRequest(objectId: string): void {
    const object = this.getCelestialObject(objectId);
    if (!object) return;

    this.cameraManager.startFollowing(object);
    this.setSelectedObject(objectId);
  }
}
```

This separation provides:

- ✅ **Pure business logic** in core packages (testable, reusable)
- ✅ **UI orchestration** in application layer (framework-specific)
- ✅ **Clear boundaries** between concerns
- ✅ **Dependency injection** instead of tight coupling

---

_These examples demonstrate how the recommendations from the code quality analysis can be practically implemented to reduce duplication, complexity, and architectural issues._
