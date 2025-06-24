import type { DockviewApi } from "dockview-core";
import type {
  FunctionConfig,
  PluginExecutionContext,
  RegisteredItem,
  TeskooanoPlugin,
  ToolbarItemConfig,
  ToolbarTarget,
  ToolbarWidgetConfig,
} from "../types";
import type { Observable } from "rxjs";

/**
 * Handles plugin function execution.
 * Provides a clean interface for executing registered plugin functions.
 */
export class PluginExecutor {
  private functionRegistry: Map<string, RegisteredItem<FunctionConfig>>;
  private dockviewApi: DockviewApi | null = null;
  private dockviewController: any | null = null;
  private managerInstances: Map<string, { instance: any; pluginId: string }>;
  private registerPlugin: (plugin: TeskooanoPlugin) => void;
  private pluginsChanged$: Observable<void>;
  private getToolbarItemsForTarget: (
    target: ToolbarTarget,
  ) => ToolbarItemConfig[];
  private getToolbarWidgetsForTarget: (
    target: ToolbarTarget,
  ) => ToolbarWidgetConfig[];

  constructor(
    functionRegistry: Map<string, RegisteredItem<FunctionConfig>>,
    managerInstances: Map<string, { instance: any; pluginId: string }>,
    registerPlugin: (plugin: TeskooanoPlugin) => void,
    pluginsChanged$: Observable<void>,
    getToolbarItemsForTarget: (target: ToolbarTarget) => ToolbarItemConfig[],
    getToolbarWidgetsForTarget: (
      target: ToolbarTarget,
    ) => ToolbarWidgetConfig[],
  ) {
    this.functionRegistry = functionRegistry;
    this.managerInstances = managerInstances;
    this.registerPlugin = registerPlugin;
    this.pluginsChanged$ = pluginsChanged$;
    this.getToolbarItemsForTarget = getToolbarItemsForTarget;
    this.getToolbarWidgetsForTarget = getToolbarWidgetsForTarget;
  }

  public setDependencies(deps: {
    dockviewApi: DockviewApi | null;
    dockviewController: any | null;
  }): void {
    this.dockviewApi = deps.dockviewApi;
    this.dockviewController = deps.dockviewController;
  }

  /**
   * Executes a registered plugin function by ID.
   * @param functionId The ID of the function to execute
   * @param args Arguments to pass to the function
   * @returns The result of the function execution
   */
  public execute<T = any>(
    functionId: string,
    args?: any,
  ): Promise<T> | T | undefined {
    const funcConfig = this.functionRegistry.get(functionId);
    if (!funcConfig) {
      console.error(`[PluginExecutor] Function '${functionId}' not found.`);
      return undefined;
    }

    const context: PluginExecutionContext = {
      pluginManager: this.createPluginManagerProxy(),
      dockviewApi: this.dockviewApi,
      dockviewController: this.dockviewController,
      getManager: this.getManagerInstance.bind(this),
      executeFunction: this.execute.bind(this),
    };

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

  /**
   * Gets a manager instance by ID.
   * @param id The manager ID
   * @returns The manager instance or undefined
   */
  public getManagerInstance<T = any>(id: string): T | undefined {
    return this.managerInstances.get(id)?.instance;
  }

  /**
   * Creates a proxy object that exposes only the necessary plugin manager methods
   * to the execution context. This prevents circular dependencies and encapsulates
   * the executor's role.
   */
  private createPluginManagerProxy() {
    return {
      execute: this.execute.bind(this),
      getManagerInstance: this.getManagerInstance.bind(this),
      registerPlugin: this.registerPlugin,
      pluginsChanged$: this.pluginsChanged$,
      getToolbarItemsForTarget: this.getToolbarItemsForTarget,
      getToolbarWidgetsForTarget: this.getToolbarWidgetsForTarget,
    };
  }
}
