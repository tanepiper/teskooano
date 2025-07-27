import { IContentRenderer, PanelInitParameters } from "dockview-core";
import type { PanelConfig } from "@teskooano/ui-plugin";

/**
 * A factory class responsible for creating panel component constructors
 * suitable for registration with Dockview.
 *
 * It handles the distinction between standard class-based components and
 * custom element-based components, wrapping the latter as needed.
 */
export class PanelFactory {
  /**
   * Creates a constructor for a Dockview panel component based on the provided configuration.
   *
   * @param panelConfig - The configuration for the panel.
   * @param pluginId - The ID of the plugin providing the panel, for error logging.
   * @returns A constructor function that Dockview can use to create panel instances.
   * @throws {Error} If the panel configuration is invalid or the panel class is missing.
   */
  public createPanelConstructor(
    panelConfig: PanelConfig,
    pluginId: string,
  ): new () => IContentRenderer {
    const { componentName, panelClass } = panelConfig;

    if (!panelClass) {
      throw new Error(
        `Panel class is not defined for component '${componentName}' in plugin '${pluginId}'.`,
      );
    }

    const isCustomElement = panelClass.prototype instanceof HTMLElement;

    if (isCustomElement) {
      return this.createCustomElementWrapper(componentName);
    } else {
      return panelClass as new () => IContentRenderer;
    }
  }

  /**
   * Creates a wrapper class for a custom element to make it compatible
   * with the Dockview `IContentRenderer` interface.
   *
   * @param componentName - The tag name of the custom element to wrap.
   * @returns A constructor for the wrapper class.
   */
  private createCustomElementWrapper(
    componentName: string,
  ): new () => IContentRenderer {
    // This class acts as a bridge between Dockview's interface and a standard custom element.
    class CustomElementPanelWrapper implements IContentRenderer {
      private readonly _element: HTMLElement;

      get element(): HTMLElement {
        return this._element;
      }

      constructor() {
        this._element = document.createElement(componentName);
      }

      init(params: PanelInitParameters): void {
        // If the custom element has its own 'init' method, call it.
        // This allows panels to receive Dockview parameters.
        if (typeof (this._element as any).init === "function") {
          (this._element as any).init(params);
        }
      }
    }

    return CustomElementPanelWrapper;
  }
}
