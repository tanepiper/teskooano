import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import type { AddPanelOptions } from "dockview-core";
import { EngineToolbarManager } from "../../../../core/interface/engine-toolbar";

/**
 * Manages the creation of new engine view panels.
 *
 * This class is not a singleton but is instantiated by an initializer function.
 * It handles panel ID generation, configuration, and interaction with the
 * Dockview API and other plugin-provided managers.
 */
export class EngineViewManager {
  private context: PluginExecutionContext;
  private _enginePanelCounter = 0;

  /**
   * Constructs an EngineViewManager instance.
   * @param {PluginExecutionContext} context - The plugin execution context, providing access to core APIs like `dockviewApi` and `pluginManager`.
   */
  constructor(context: PluginExecutionContext) {
    this.context = context;
  }

  /**
   * Creates and adds a new composite engine view panel to the Dockview layout.
   *
   * It dynamically initializes a corresponding `EngineToolbarManager` for the new
   * panel and sets the new panel as active.
   *
   * @returns {Promise<{ success: boolean; panelId: string | null }>} An object indicating the result of the operation.
   */
  public async createPanel(): Promise<{
    success: boolean;
    panelId: string | null;
  }> {
    const { dockviewApi, pluginManager, dockviewController } = this.context;
    if (!dockviewApi || !dockviewController) {
      console.error(
        "[EngineViewManager] Cannot add panel: Dockview API or Controller not available.",
      );
      return { success: false, panelId: null };
    }

    const engineToolbarManager =
      await pluginManager.execute<EngineToolbarManager>(
        "engine-toolbar:initialize",
      );

    if (!engineToolbarManager) {
      console.error(
        "[EngineViewManager] Cannot add panel: EngineToolbarManager could not be initialized.",
      );
      return { success: false, panelId: null };
    }

    this._enginePanelCounter++;
    const counter = this._enginePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    const panelOptions: AddPanelOptions = {
      id: compositeViewId,
      component: "teskooano-engine-view",
      title: compositeViewTitle,
      params: {
        title: compositeViewTitle,
        dockviewController,
        engineToolbarManager,
      },
    };

    try {
      const newPanel = dockviewApi.addPanel(panelOptions);
      newPanel.api.setActive();

      return { success: true, panelId: compositeViewId };
    } catch (error) {
      console.error(
        `[EngineViewManager] Failed to add engine panel for counter ${counter}:`,
        error,
      );
      this._enginePanelCounter--;
      return { success: false, panelId: null };
    }
  }
}
