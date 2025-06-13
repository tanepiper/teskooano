import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { Subject, takeUntil } from "rxjs";

import { EngineToolbarManager } from "./EngineToolbarManager";
import { template } from "./engine-toolbar.template"; // Import the template

import BoxMultipleArrowLeftFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_left_24_regular.svg?raw";
import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";

import {
  FunctionToolbarItemConfig,
  PanelToolbarItemConfig,
  ToolbarItemConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

import { createToolbarButton } from "../../controllers/toolbar/ToolbarController.utils";

/**
 * A UI component that displays a small, collapsible toolbar, typically
 * overlaid on a specific engine panel. It is created and managed by the
 * {@link EngineToolbarManager}.
 */
export class EngineToolbar {
  private readonly _element: HTMLElement;
  private _toggleButton: HTMLElement | null = null;
  private _collapsibleContainer: HTMLElement | null = null;
  private _widgetContainer: HTMLElement | null = null;
  private _context: PluginExecutionContext;
  private _manager: EngineToolbarManager;
  private _apiId: string;
  private _parentEngine: any;
  private _isExpanded: boolean = true;
  private _activeFloatingPanels: Map<string, string> = new Map();
  // Use Subject for easier cleanup on dispose
  private _destroy$ = new Subject<void>();

  /**
   * The root HTML element for the toolbar.
   */
  get element(): HTMLElement {
    return this._element;
  }

  /**
   * Creates an instance of EngineToolbar.
   * @param apiId - A unique identifier for the panel this toolbar is attached to.
   * @param context - The plugin execution context.
   * @param parentEngine - A reference to the parent engine instance.
   * @param manager - The EngineToolbarManager instance that is creating this toolbar.
   */
  constructor(
    apiId: string,
    context: PluginExecutionContext,
    parentEngine: any,
    manager: EngineToolbarManager,
  ) {
    this._apiId = apiId;
    this._context = context;
    this._parentEngine = parentEngine;
    this._manager = manager;

    this._element = document.createElement("div");
    this._element.classList.add("engine-overlay-toolbar-container");

    // injectStyles(); // Removed - styles are in the template
    this.createBaseStructure();
    this.subscribeToExpansionState();
    this.populateItemsFromPlugins();
    this.listenForPanelRemovals();
    this.listenForPluginChanges();
  }

  /** Inject CSS for toolbar structure, icons, and animation */
  // private injectStyles(): void { ... } // Removed

  /**
   * Creates the main toggle button and the container for dynamic buttons and widgets
   */
  private createBaseStructure(): void {
    // Clone the template content
    const templateContent = template.content.cloneNode(true);
    this._element.appendChild(templateContent);

    // Get references to the elements defined in the template
    // Use more specific selectors if necessary, especially if IDs change
    this._toggleButton = this._element.querySelector<HTMLElement>(
      "#engine-toolbar-toggle-button",
    );
    this._collapsibleContainer = this._element.querySelector<HTMLElement>(
      ".toolbar-collapsible-buttons",
    );
    this._widgetContainer = this._element.querySelector<HTMLElement>(
      ".toolbar-widget-area",
    );

    // Check if elements were found
    if (!this._toggleButton) {
      console.error(
        `[EngineToolbar ${this._apiId}] Toggle button not found in template.`,
      );
      return; // Stop further setup if essential elements are missing
    }
    if (!this._collapsibleContainer) {
      console.error(
        `[EngineToolbar ${this._apiId}] Collapsible container not found in template.`,
      );
      // Decide if this is critical; maybe toolbar can function without it?
    }
    if (!this._widgetContainer) {
      console.error(
        `[EngineToolbar ${this._apiId}] Widget container not found in template.`,
      );
      // Decide if this is critical
    }

    // Attach the toggle listener
    this._toggleButton?.addEventListener("click", () => {
      this._manager.toggleToolbarExpansion(this._apiId);
    });
  }

  /**
   * Fetches toolbar items from the PluginManager and populates the toolbar.
   */
  private populateItemsFromPlugins(): void {
    const itemConfigs =
      this._context.pluginManager.getToolbarItemsForTarget("engine-toolbar");
    const widgetConfigs =
      this._context.pluginManager.getToolbarWidgetsForTarget("engine-toolbar");
    console.log(`[EngineToolbar ${this._apiId}] Populating with items:`, {
      itemConfigs,
      widgetConfigs,
    });
    this.renderDynamicButtons(itemConfigs);
    this.renderDynamicWidgets(widgetConfigs);
  }

  /**
   * Subscribes to panel removal events to clean up internal tracking
   * of active floating panels.
   */
  private listenForPanelRemovals(): void {
    this._context.dockviewController.onPanelRemoved$
      .pipe(takeUntil(this._destroy$)) // Auto-unsubscribe on dispose
      .subscribe((removedPanelId: string) => {
        if (this._activeFloatingPanels.has(removedPanelId)) {
          this._activeFloatingPanels.delete(removedPanelId);
        }
      });
  }

  /**
   * Subscribes to the PluginManager's `pluginsChanged$` observable and
   * repopulates the toolbar items whenever plugins are added or removed.
   */
  private listenForPluginChanges(): void {
    this._context.pluginManager.pluginsChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        console.log(
          `[EngineToolbar ${this._apiId}] Repopulating items due to plugin change.`,
        );
        this.populateItemsFromPlugins();
      });
  }

  /**
   * Clears and re-renders buttons in the collapsible container
   * @param buttons - An array of {@link ToolbarItemConfig}.
   */
  private renderDynamicButtons(buttons: ToolbarItemConfig[]): void {
    if (!this._collapsibleContainer) return;

    this._collapsibleContainer.innerHTML = "";

    buttons.forEach((config) => {
      const button = createToolbarButton(`engine-toolbar-button-${config.id}`, {
        title: config.title,
        iconSvg: config.iconSvg,
        size: "sm",
      });

      button.addEventListener("click", async () => {
        if (config.type === "panel") {
          this.handlePanelButtonClick(config as PanelToolbarItemConfig);
        } else if (config.type === "function") {
          this.handleFunctionButtonClick(config as FunctionToolbarItemConfig);
        }
      });

      this._collapsibleContainer?.appendChild(button);
    });
  }

  /**
   * Clears and re-renders widgets in the widget container
   * @param widgets - An array of {@link ToolbarWidgetConfig}.
   */
  private renderDynamicWidgets(widgets: ToolbarWidgetConfig[]): void {
    if (!this._widgetContainer) return;

    this._widgetContainer.innerHTML = "";

    widgets.forEach((config) => {
      try {
        const widgetElement = document.createElement(config.componentName);

        if (config.id) {
          widgetElement.id = `engine-toolbar-widget-${config.id}`;
        }
        if (config.params) {
          Object.entries(config.params).forEach(([key, value]) => {
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              widgetElement.setAttribute(key, String(value));
            } else {
              console.warn(
                `[EngineToolbar ${this._apiId}] Cannot set complex param '${key}' as attribute on widget ${config.componentName}`,
              );
            }
          });
        }

        this._widgetContainer?.appendChild(widgetElement);
      } catch (error) {
        console.error(
          `[EngineToolbar ${this._apiId}] Error creating widget '${config.componentName}' (ID: ${config.id}):`,
          error,
        );
        const errorEl = document.createElement("div");
        errorEl.textContent = "⚠";
        errorEl.title = `Error loading widget: ${config.id}`;
        errorEl.style.color = "red";
        this._widgetContainer?.appendChild(errorEl);
      }
    });
  }

  /**
   * Calculates the screen position for a new floating panel, applying a
   * cascade to avoid complete overlap.
   * @param config - The configuration of the panel button.
   * @returns An object with top, left, width, and height properties.
   */
  private calculatePanelPosition(config: PanelToolbarItemConfig): {
    top: number;
    left: number;
    width: number;
    height: number;
  } {
    // Add type assertion for safety if PanelToolbarItemConfig definition is uncertain
    const panelConfig = config as any;
    if (panelConfig.initialPosition) {
      return panelConfig.initialPosition;
    }
    const baseOffset = 50;
    // Use a different approach to avoid overlap if many panels are opened quickly
    const panelIndex = this._activeFloatingPanels.size;
    const cascadeOffset = (panelIndex % 10) * 30; // Cascade up to 10 then repeat
    const defaultWidth = panelConfig.initialPosition?.width ?? 500;
    const defaultHeight = panelConfig.initialPosition?.height ?? 300;

    return {
      top: baseOffset + cascadeOffset,
      left: baseOffset + cascadeOffset,
      width: defaultWidth,
      height: defaultHeight,
    };
  }

  /**
   * Creates a new floating panel or activates an existing one.
   * @param config - The configuration for the panel.
   * @param panelId - The unique ID for the panel to be created or activated.
   */
  private createOrActivatePanel(
    config: PanelToolbarItemConfig,
    panelId: string,
  ): void {
    const existingPanel =
      this._context.dockviewController.api.getPanel(panelId);
    const position = this.calculatePanelPosition(config);
    const title = config.panelTitle ?? config.title;
    // Add type assertion for safety
    const panelConfig = config as any;

    if (existingPanel) {
      try {
        // Ensure panel is visible and sized correctly
        if (!existingPanel.api.isVisible) {
          // This might require specific Dockview logic if simply setting size/active doesn't show it
          // For now, assume setActive brings it to front if hidden/inactive
        }
        existingPanel.api.setSize(position);
        if (existingPanel.api.title !== title) {
          existingPanel.api.updateParameters({ title });
        }
        existingPanel.api.setActive();
        this._activeFloatingPanels.set(panelId, config.componentName);
      } catch (e) {
        console.error(
          `[EngineToolbar ${this._apiId}] Error setting size/activating existing panel ${panelId}:`,
          e,
        );
      }
    } else {
      const panelApi = this._context.dockviewController.addFloatingPanel(
        {
          id: panelId,
          component: config.componentName,
          title: title,
          params: {
            // Pass necessary params, ensure 'title' matches if Dockview uses it
            title: title,
            parentInstance: this._parentEngine, // Pass parent reference if needed by the panel
            ...(panelConfig.params ?? {}), // Spread any additional params from config
          },
        },
        position,
      );
      if (panelApi) {
        this._activeFloatingPanels.set(panelId, config.componentName);
        panelApi?.setActive(); // Corrected optional chaining
      } else {
        console.error(
          `[EngineToolbar ${this._apiId}] Failed to create floating panel ${panelId}`,
        );
      }
    }
  }

  /**
   * Handles clicks for buttons that are configured to create or toggle panels.
   * @param config - The configuration for the panel button.
   */
  private handlePanelButtonClick(config: PanelToolbarItemConfig): void {
    const basePanelId = `${config.componentName}_${this._apiId}_float`;
    const behaviour = config.behaviour ?? "toggle";

    if (behaviour === "toggle") {
      const panelId = basePanelId;
      const existingPanel =
        this._context.dockviewController.api.getPanel(panelId);
      if (existingPanel?.api.isVisible) {
        // If visible, remove it
        try {
          this._context.dockviewController.api.removePanel(existingPanel);
          // No need to manage _activeFloatingPanels here, onPanelRemoved$ handles it
        } catch (error) {
          console.error(
            `[EngineToolbar ${this._apiId}] Error removing panel ${panelId}:`,
            error,
          );
        }
      } else {
        // If not visible (or doesn't exist), create or activate it
        this.createOrActivatePanel(config, panelId);
      }
    } else if (behaviour === "create") {
      // Always create a new panel with a unique ID
      const panelId = `${basePanelId}_${Date.now()}`;
      this.createOrActivatePanel(config, panelId);
    }
  }

  /**
   * Handles clicks for buttons that are configured to execute a plugin function.
   * @param config - The configuration for the function button.
   */
  private async handleFunctionButtonClick(
    config: FunctionToolbarItemConfig,
  ): Promise<void> {
    const functionId = config.functionId;
    if (!functionId) {
      console.error(
        `[EngineToolbar ${this._apiId}] Function button clicked, but config lacks functionId.`,
      );
      return;
    }
    try {
      await this._context.pluginManager.execute(functionId);
    } catch (error) {
      console.error(
        `[EngineToolbar ${this._apiId}] Error executing function '${functionId}':`,
        error,
      );
    }
  }

  /**
   * Updates the UI of the toolbar to reflect its expanded or collapsed state.
   * @param isExpanded - `true` if the toolbar should be expanded, `false` otherwise.
   */
  public updateExpansionUI(isExpanded: boolean): void {
    this._isExpanded = isExpanded;

    if (!this._toggleButton || !this._collapsibleContainer) return;

    const iconSpan = this._toggleButton.querySelector("span[slot='icon']");

    this._collapsibleContainer.classList.toggle("expanded", isExpanded);

    if (iconSpan) {
      // Use the stored SVG strings directly
      iconSpan.innerHTML = isExpanded
        ? BoxMultipleArrowLeftFilled
        : BoxMultipleArrowRightFilled; // Use the imported SVG
    }
    this._toggleButton.title = isExpanded ? "Hide Tools" : "Show Tools";
  }

  /**
   * Cleans up all resources, subscriptions, and DOM elements created by this toolbar instance.
   */
  public dispose(): void {
    this._destroy$.next(); // Signal completion for observables
    this._destroy$.complete();

    this._element.remove();

    this._toggleButton = null;
    this._collapsibleContainer = null;
    this._widgetContainer = null;
    this._activeFloatingPanels.clear();
  }

  /**
   * Subscribes to the expansion state `Observable` from the `EngineToolbarManager`.
   */
  private subscribeToExpansionState(): void {
    const expansionState$ = this._manager.getExpansionState$(this._apiId);

    if (expansionState$) {
      expansionState$
        .pipe(takeUntil(this._destroy$))
        .subscribe((isExpanded: boolean) => {
          this.updateExpansionUI(isExpanded);
        });
    } else {
      console.warn(
        `[EngineToolbar ${this._apiId}] Could not get expansion state observable for this panel ID from manager.`,
      );
    }
  }
}
