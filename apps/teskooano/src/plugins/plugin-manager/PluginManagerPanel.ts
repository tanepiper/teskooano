import {
  PanelInitParameters,
  IContentRenderer,
  GroupPanelPartInitParameters,
  DockviewPanelApi,
} from "dockview-core";
import { pluginManager, TeskooanoPlugin } from "@teskooano/ui-plugin";
import { template } from "./PluginManagerPanel.template";
import "../../core/components/card"; // Ensure card component is registered

/**
 * @element teskooano-plugin-manager-panel
 * A Dockview panel that displays a list of all loaded plugins.
 */
export class PluginManagerPanel
  extends HTMLElement
  implements IContentRenderer
{
  public static readonly componentName = "teskooano-plugin-manager";

  private panelApi: DockviewPanelApi | undefined;
  private pluginListContainer: HTMLElement | null = null;

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

  init(params: PanelInitParameters): void {
    this.panelApi = (params as GroupPanelPartInitParameters).api;
  }

  connectedCallback() {
    if (this.shadowRoot && !this.pluginListContainer) {
      this.pluginListContainer = this.shadowRoot.getElementById(
        "plugin-list-container",
      );
    }
    this.renderPluginList();
    // TODO: Listen for plugin registration/unregistration events if pluginManager supports it
    // and then call this.renderPluginList() to update the view dynamically.
    // Example: pluginManager.onPluginsChanged?.(() => this.renderPluginList());
  }

  disconnectedCallback() {
    // Clean up listeners if any were added
  }

  private renderPluginList() {
    if (!this.pluginListContainer) {
      // Attempt to query it again, in case connectedCallback ran before shadowRoot was fully populated
      if (this.shadowRoot) {
        this.pluginListContainer = this.shadowRoot.getElementById(
          "plugin-list-container",
        );
      }
      // If still not found, log warning and exit
      if (!this.pluginListContainer) {
        console.warn(
          "PluginManagerPanel: pluginListContainer not found in shadow DOM.",
        );
        return;
      }
    }

    const plugins = pluginManager.getPlugins();

    if (plugins.length === 0) {
      this.pluginListContainer.innerHTML = `<p class="no-plugins">No plugins loaded or found.</p>`;
      return;
    }

    // Clear previous content
    this.pluginListContainer.innerHTML = "";

    const ul = document.createElement("ul");
    plugins.forEach((plugin: TeskooanoPlugin) => {
      const li = document.createElement("li");

      // Prepare optional parts
      const iconHtml = (plugin as any).icon
        ? `${(plugin as any).icon}` // Assuming plugin.icon is an SVG string
        : "";
      const versionHtml = (plugin as any).version
        ? `<div class="plugin-version">Version: ${(plugin as any).version}</div>`
        : "";
      const nameHtml = plugin.name
        ? `<span slot="title" class="plugin-name">
        ${iconHtml}
        ${plugin.name}</span>`
        : '<span slot="title">Unnamed Plugin</span>';
      const descriptionHtml = plugin.description
        ? `<div class="plugin-description">${plugin.description}</div>`
        : "";

      li.innerHTML = `
      <teskooano-card variant="fluid">
        ${nameHtml}
        <div class="plugin-id">ID: ${plugin.id}</div>
        ${versionHtml}
        ${descriptionHtml}
      </teskooano-card>
      `;
      ul.appendChild(li);
    });
    this.pluginListContainer.appendChild(ul);
  }
}
