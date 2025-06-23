import { pluginManager } from "@teskooano/ui-plugin";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import { PluginDetailCard } from "../components/plugin-detail-card/plugin-detail-card.component";

export class PluginManagerController extends StateSubscriptionMixin {
  private container: HTMLElement;

  /**
   * Constructs the controller.
   * @param container - The HTML element where the plugin list will be rendered.
   */
  constructor(container: HTMLElement) {
    super();
    this.container = container;
  }

  /**
   * Initializes the controller, subscribing to plugin changes and performing the initial render.
   */
  public init(): void {
    // ✅ Using StateSubscriptionMixin for clean subscription management
    this.subscribeToState(
      pluginManager.pluginsChanged$,
      () => {
        this.renderPluginList();
      }
    );
    this.renderPluginList();
  }

  /**
   * Disposes of the controller, cleaning up all subscriptions.
   */
  public dispose(): void {
    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();
  }

  /**
   * Fetches plugins and renders them into the container using the PluginDetailCard component.
   * @internal
   */
  private renderPluginList(): void {
    const plugins = pluginManager.getPlugins();
    this.container.innerHTML = "";

    if (plugins.length === 0) {
      this.container.innerHTML = `<p class="no-plugins">No plugins loaded or found.</p>`;
      return;
    }

    plugins.forEach((plugin) => {
      const card = new PluginDetailCard();
      card.plugin = plugin;
      this.container.appendChild(card);
    });
  }
}
