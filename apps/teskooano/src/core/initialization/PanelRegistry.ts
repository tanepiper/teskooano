import type {
  pluginManager,
  PanelConfig,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";
import type { DockviewController } from "../controllers/dockview";
import { PanelFactory } from "./PanelFactory";

/**
 * Handles the registration of panel components from all loaded plugins
 * into the Dockview system. It acts as an orchestrator, delegating the
 * creation of panel constructors to the PanelFactory.
 */
export class PanelRegistry {
  private readonly pluginManager: typeof pluginManager;
  private readonly dockviewController: DockviewController;
  private readonly panelFactory: PanelFactory;

  constructor(
    pluginManagerInstance: typeof pluginManager,
    dockviewController: DockviewController,
  ) {
    this.pluginManager = pluginManagerInstance;
    this.dockviewController = dockviewController;
    this.panelFactory = new PanelFactory();
  }

  /**
   * Iterates through all loaded plugins and registers their panel components.
   * Gathers and throws a comprehensive error if any registrations fail.
   * @throws {Error} If one or more panel registrations fail.
   */
  public registerAllPanels(): void {
    const plugins = this.pluginManager.getPlugins();
    const registrationErrors: string[] = [];

    plugins.forEach((plugin: TeskooanoPlugin) => {
      plugin.panels?.forEach((panelConfig: PanelConfig) => {
        try {
          this.registerPanel(panelConfig, plugin.id);
        } catch (error) {
          const errorMessage = this.formatErrorMessage(
            panelConfig,
            plugin.id,
            error,
          );
          console.error(`[PanelRegistry] ${errorMessage}`);
          registrationErrors.push(errorMessage);
        }
      });
    });

    if (registrationErrors.length > 0) {
      throw new Error(
        `Panel registration failed for ${registrationErrors.length} panel(s):\n- ${registrationErrors.join("\n- ")}`,
      );
    }
  }

  /**
   * Registers a single panel using the PanelFactory to create the constructor,
   * then adds it to the Dockview controller.
   *
   * @param panelConfig - The configuration for the panel to register.
   * @param pluginId - The ID of the plugin that defines the panel.
   */
  private registerPanel(panelConfig: PanelConfig, pluginId: string): void {
    const panelConstructor = this.panelFactory.createPanelConstructor(
      panelConfig,
      pluginId,
    );
    this.dockviewController.registerComponent(
      panelConfig.componentName,
      panelConstructor,
    );
  }

  /**
   * Formats a consistent error message for a failed panel registration.
   *
   * @param panelConfig - The configuration of the panel that failed.
   * @param pluginId - The ID of the plugin attempting to register the panel.
   * @param error - The caught error object.
   * @returns A formatted, descriptive error string.
   */
  private formatErrorMessage(
    panelConfig: PanelConfig,
    pluginId: string,
    error: unknown,
  ): string {
    const baseMessage = `Failed to register panel '${panelConfig.componentName}' from plugin '${pluginId}'`;
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return `${baseMessage}: ${errorMessage}`;
  }
}
