import type { 
  pluginManager, 
  PanelConfig, 
  TeskooanoPlugin 
} from "@teskooano/ui-plugin";
import { 
  IContentRenderer, 
  PanelInitParameters 
} from "dockview-core";

/**
 * Handles registration of panel components with the dockview system
 */
export class PanelRegistry {
  /**
   * Registers all panel components from loaded plugins
   * @throws {Error} If critical panel registration fails
   */
  public static registerPanelComponents(
    pluginManagerInstance: typeof pluginManager,
    dockviewController: any
  ): void {
    const plugins = pluginManagerInstance.getPlugins();
    const errors: string[] = [];
    
    plugins.forEach((plugin: TeskooanoPlugin) => {
      plugin.panels?.forEach((panelConfig: PanelConfig) => {
        try {
          this.registerSinglePanel(panelConfig, plugin.id, dockviewController);
        } catch (error) {
          const errorMessage = `Failed to register panel '${panelConfig.componentName}' from plugin '${plugin.id}': ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[PanelRegistry] ${errorMessage}`);
          errors.push(errorMessage);
        }
      });
    });

    if (errors.length > 0) {
      throw new Error(
        `Panel registration failed with ${errors.length} error(s):\n${errors.join('\n')}`
      );
    }
  }

  /**
   * Registers a single panel component
   * @throws {Error} If panel registration fails
   */
  private static registerSinglePanel(
    panelConfig: PanelConfig,
    pluginId: string,
    dockviewController: any
  ): void {
    const PanelComponentOrConstructor = panelConfig.panelClass;
    const componentName = panelConfig.componentName;

    if (!PanelComponentOrConstructor) {
      throw new Error(
        `Panel class not found for ${componentName} in plugin ${pluginId}`
      );
    }

    const isCustomElementConstructor =
      PanelComponentOrConstructor.prototype instanceof HTMLElement;

    if (isCustomElementConstructor) {
      this.registerCustomElementPanel(componentName, dockviewController);
    } else {
      this.registerDirectPanel(
        componentName, 
        PanelComponentOrConstructor, 
        dockviewController
      );
    }
  }

  /**
   * Registers a custom element as a panel component
   */
  private static registerCustomElementPanel(
    componentName: string,
    dockviewController: any
  ): void {
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

    dockviewController.registerComponent(
      componentName,
      CustomElementPanelWrapper
    );
  }

  /**
   * Registers a direct panel component
   * @throws {Error} If panel registration fails
   */
  private static registerDirectPanel(
    componentName: string,
    PanelComponentOrConstructor: any,
    dockviewController: any
  ): void {
    try {
      dockviewController.registerComponent(
        componentName,
        PanelComponentOrConstructor as new () => IContentRenderer
      );
    } catch (error) {
      throw new Error(
        `Error registering panel '${componentName}' directly: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}