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
   */
  public static registerPanelComponents(
    pluginManagerInstance: typeof pluginManager,
    dockviewController: any
  ): void {
    const plugins = pluginManagerInstance.getPlugins();
    
    plugins.forEach((plugin: TeskooanoPlugin) => {
      plugin.panels?.forEach((panelConfig: PanelConfig) => {
        this.registerSinglePanel(panelConfig, plugin.id, dockviewController);
      });
    });
  }

  /**
   * Registers a single panel component
   */
  private static registerSinglePanel(
    panelConfig: PanelConfig,
    pluginId: string,
    dockviewController: any
  ): void {
    const PanelComponentOrConstructor = panelConfig.panelClass;
    const componentName = panelConfig.componentName;

    if (!PanelComponentOrConstructor) {
      console.error(
        `Panel class not found for ${componentName} in plugin ${pluginId}`
      );
      return;
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
      console.error(
        `[PanelRegistry] Error registering panel '${componentName}' directly:`,
        error
      );
    }
  }
}