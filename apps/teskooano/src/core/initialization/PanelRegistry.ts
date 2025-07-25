import type {
  pluginManager,
  PanelConfig,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";
import { IContentRenderer, PanelInitParameters } from "dockview-core";

/**
 * Handles registration of panel components with the dockview system
 */
export class PanelRegistry {
  private readonly pluginManager: typeof pluginManager;
  private readonly dockviewController: any;

  constructor(
    pluginManagerInstance: typeof pluginManager,
    dockviewController: any,
  ) {
    this.pluginManager = pluginManagerInstance;
    this.dockviewController = dockviewController;
  }

  /**
   * Registers all panel components from loaded plugins
   * @throws {Error} If critical panel registration fails
   */
  public registerPanelComponents(): void {
    const plugins = this.pluginManager.getPlugins();
    const errors: string[] = [];

    plugins.forEach((plugin: TeskooanoPlugin) => {
      plugin.panels?.forEach((panelConfig: PanelConfig) => {
        try {
          this.registerSinglePanel(panelConfig, plugin.id);
        } catch (error) {
          const errorMessage = `Failed to register panel '${panelConfig.componentName}' from plugin '${plugin.id}': ${error instanceof Error ? error.message : "Unknown error"}`;
          console.error(`[PanelRegistry] ${errorMessage}`);
          errors.push(errorMessage);
        }
      });
    });

    if (errors.length > 0) {
      throw new Error(
        `Panel registration failed with ${errors.length} error(s):\n${errors.join("\n")}`,
      );
    }
  }

  /**
   * Registers a single panel component
   * @throws {Error} If panel registration fails
   */
  private registerSinglePanel(
    panelConfig: PanelConfig,
    pluginId: string,
  ): void {
    const PanelComponentOrConstructor = panelConfig.panelClass;
    const componentName = panelConfig.componentName;

    if (!PanelComponentOrConstructor) {
      throw new Error(
        `Panel class not found for ${componentName} in plugin ${pluginId}`,
      );
    }

    const isCustomElementConstructor =
      PanelComponentOrConstructor.prototype instanceof HTMLElement;

    if (isCustomElementConstructor) {
      this.registerCustomElementPanel(componentName);
    } else {
      this.registerDirectPanel(componentName, PanelComponentOrConstructor);
    }
  }

  /**
   * Registers a custom element as a panel component
   */
  private registerCustomElementPanel(componentName: string): void {
    class CustomElementPanelWrapper implements IContentRenderer {
      private _element: HTMLElement;

      get element(): HTMLElement {
        return this._element;
      }

      constructor() {
        this._element = document.createElement(componentName);
      }

      init(params: PanelInitParameters): void {
        if (typeof (this._element as any).init === "function") {
          (this._element as any).init(params);
        }
      }
    }

    this.dockviewController.registerComponent(
      componentName,
      CustomElementPanelWrapper,
    );
  }

  /**
   * Registers a direct panel component
   * @throws {Error} If panel registration fails
   */
  private registerDirectPanel(
    componentName: string,
    PanelComponentOrConstructor: any,
  ): void {
    try {
      this.dockviewController.registerComponent(
        componentName,
        PanelComponentOrConstructor as new () => IContentRenderer,
      );
    } catch (error) {
      throw new Error(
        `Error registering panel '${componentName}' directly: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
