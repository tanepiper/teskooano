import {
  PanelInitParameters,
  IContentRenderer,
  GroupPanelPartInitParameters,
  DockviewPanelApi,
} from "dockview-core";
import { PluginManagerController } from "../controller/plugin-manager.controller";
import { template } from "./plugin-manager.template";

/**
 * @element teskooano-plugin-manager-panel
 * A Dockview panel that displays a list of all loaded plugins.
 * It dynamically updates when plugins are loaded, unloaded, or reloaded.
 */
export class PluginManagerPanel
  extends HTMLElement
  implements IContentRenderer
{
  public static readonly componentName = "teskooano-plugin-manager";

  /** @internal */
  private panelApi: DockviewPanelApi | undefined;
  /** @internal */
  private pluginListContainer: HTMLElement | null = null;
  /** @internal */
  private controller: PluginManagerController | undefined;

  /**
   * The root element of the panel.
   * Required by the IContentRenderer interface.
   */
  get element(): HTMLElement {
    return this;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  /**
   * Dockview lifecycle method called when the panel is initialized.
   * @param params - The initialization parameters from Dockview.
   */
  init(params: PanelInitParameters): void {
    this.panelApi = (params as GroupPanelPartInitParameters).api;
  }

  /**
   * Custom element lifecycle callback invoked when the element is added to the DOM.
   * @internal
   */
  connectedCallback() {
    this.pluginListContainer =
      this.shadowRoot?.getElementById("plugin-list-container") || null;

    if (this.pluginListContainer) {
      this.controller = new PluginManagerController(this.pluginListContainer);
      this.controller.init();
    } else {
      console.error(
        "PluginManagerPanel: Could not find plugin list container element.",
      );
    }
  }

  /**
   * Custom element lifecycle callback invoked when the element is removed from the DOM.
   * @internal
   */
  disconnectedCallback() {
    this.controller?.dispose();
  }
}
