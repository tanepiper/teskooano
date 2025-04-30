import { DockviewController } from "../../controllers/dockview/DockviewController";
import { CompositeEnginePanel } from "../../../plugins/engine-panel/panels/CompositeEnginePanel"; // Import parent panel type
import { Subscription } from "rxjs"; // Import Subscription

import BoxMultipleArrowLeftFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_left_24_regular.svg?raw";
import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";

// --- Import from ui-plugin --- //
import {
  FunctionToolbarItemConfig,
  getFunctionConfig,
  getToolbarItemsForTarget,
  getToolbarWidgetsForTarget,
  PanelToolbarItemConfig,
  ToolbarItemConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

export class EngineToolbar {
  private readonly _element: HTMLElement;
  private _toggleButton: HTMLElement | null = null; // Reference to the toggle button
  private _collapsibleContainer: HTMLElement | null = null; // Container for dynamic buttons
  private _widgetContainer: HTMLElement | null = null; // Container for widgets
  private _dockviewController: DockviewController; // Reference to the controller
  private _apiId: string; // Keep for potential unique ID needs
  private _parentEngine: CompositeEnginePanel; // Store reference to parent engine
  private _isExpanded: boolean = true; // Keep local state for immediate UI reference
  private _activeFloatingPanels: Map<string, string> = new Map(); // Track panelId -> componentName
  private _expansionSubscription: Subscription | null = null; // Add subscription property

  /**
   * The root HTML element for the toolbar.
   */
  get element(): HTMLElement {
    return this._element;
  }

  constructor(
    apiId: string,
    dockviewController: DockviewController,
    parentEngine: CompositeEnginePanel,
  ) {
    this._apiId = apiId;
    this._dockviewController = dockviewController;
    this._parentEngine = parentEngine; // Store parent engine reference

    this._element = document.createElement("div");
    this._element.classList.add("engine-overlay-toolbar-container"); // Main container class

    this.injectStyles(); // Inject styles first
    this.createBaseStructure();
    // Subscribe to manager's expansion state
    this.subscribeToExpansionState();
    this.populateItemsFromPlugins();
    this.listenForPanelRemovals();
  }

  /** Inject CSS for toolbar structure, icons, and animation */
  private injectStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .engine-overlay-toolbar-container {
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: 9999;
        display: inline-flex;
        align-items: center; /* Align items vertically */
        justify-content: space-between; /* Push widget area to the right */
        background-color: rgba(40, 40, 60, 0.7);
        border-radius: 4px;
        padding: 4px;
        gap: 4px;
        overflow: visible; /* Allow content overflow */
        color: white; /* Default text/icon color */
      }

      .engine-overlay-toolbar-container teskooano-button {
        flex-shrink: 0; /* Prevent buttons from shrinking */
        color: inherit; /* Inherit color from container */
      }

      .engine-overlay-toolbar-container teskooano-button svg {
        width: 18px;
        height: 18px;
      }

      teskooano-button.toolbar-toggle-button svg {
        fill: rgba(191, 237, 9, 0.85);
      }

      .engine-overlay-toolbar-container teskooano-button:not(.toolbar-toggle-button):hover svg{
        fill: rgba(191, 237, 9, 0.85);
      }

      .toolbar-collapsible-buttons {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        max-width: 0; /* Initially hidden */
        overflow: hidden;
        transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
        white-space: nowrap; /* Prevent wrapping during transition */
        opacity: 0; /* Start hidden */
        visibility: hidden; /* Start hidden */
      }

      .toolbar-collapsible-buttons.expanded {
        max-width: 500px; /* Adjust as needed */
        opacity: 1;
        visibility: visible;
      }

      .toolbar-widget-area {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }

      .toolbar-widget-area > * {
        flex-shrink: 0;
      }
    `;
    // Prepending ensures it's available before elements are created
    // Appending to document head is generally better for global styles
    document.head.appendChild(style);
    // If scoping is needed, append to this._element and use more specific selectors
  }

  /** Creates the main toggle button and the container for dynamic buttons and widgets */
  private createBaseStructure(): void {
    this._element.innerHTML = ""; // Clear previous content

    const leftSection = document.createElement("div");
    leftSection.style.display = "inline-flex";
    leftSection.style.alignItems = "center";
    leftSection.style.gap = "4px";

    const toggleButton = document.createElement("teskooano-button");
    toggleButton.id = `engine-toolbar-toggle-${this._apiId}`;
    toggleButton.classList.add("toolbar-toggle-button");
    toggleButton.setAttribute("variant", "icon");
    toggleButton.setAttribute("size", "lg");
    // Title and Icon will be set by updateExpansionUI

    const iconSpan = document.createElement("span");
    iconSpan.slot = "icon";
    // Icon will be set by updateExpansionUI
    toggleButton.appendChild(iconSpan);

    toggleButton.addEventListener("click", () => {
      // Request toggle via parent panel, which will call the manager
      if (typeof this._parentEngine.requestToolbarToggle === "function") {
        console.log(
          `[EngineToolbar ${this._apiId}] Requesting toggle via parent panel.`,
        );
        this._parentEngine.requestToolbarToggle();
      } else {
        console.error(
          `[EngineToolbar ${this._apiId}] Parent panel does not have requestToolbarToggle method!`,
        );
      }
      // The actual UI update will be triggered by the manager calling updateExpansionUI
    });

    leftSection.appendChild(toggleButton);
    this._toggleButton = toggleButton; // Store reference

    const collapsibleContainer = document.createElement("div");
    collapsibleContainer.classList.add("toolbar-collapsible-buttons");
    // Expanded class will be set by updateExpansionUI
    // if (this._isExpanded) { ... } // REMOVE

    leftSection.appendChild(collapsibleContainer);
    this._collapsibleContainer = collapsibleContainer; // Store reference

    this._element.appendChild(leftSection);

    // Create container for widgets (aligned right by flexbox)
    const widgetContainer = document.createElement("div");
    widgetContainer.classList.add("toolbar-widget-area");
    this._element.appendChild(widgetContainer);
    this._widgetContainer = widgetContainer; // Store reference
  }

  /** Fetches items (buttons and widgets) from the plugin manager and renders them */
  private populateItemsFromPlugins(): void {
    console.log(
      `[EngineToolbar ${this._apiId}] Fetching items for target 'engine-toolbar'`,
    );
    const itemConfigs = getToolbarItemsForTarget("engine-toolbar");
    const widgetConfigs = getToolbarWidgetsForTarget("engine-toolbar");

    console.log(
      `[EngineToolbar ${this._apiId}] Found ${itemConfigs.length} items and ${widgetConfigs.length} widgets.`,
    );
    this.renderDynamicButtons(itemConfigs);
    this.renderDynamicWidgets(widgetConfigs);
  }

  /** Listen only for panel removals to clean up internal tracking */
  private listenForPanelRemovals(): void {
    this._dockviewController.onPanelRemoved$.subscribe((removedPanelId) => {
      if (this._activeFloatingPanels.has(removedPanelId)) {
        console.log(
          `[EngineToolbar ${this._apiId}] Detected removal of tracked floating panel '${removedPanelId}'. Removing from active map.`,
        );
        this._activeFloatingPanels.delete(removedPanelId);
      }
    });
  }

  /** Clears and re-renders buttons in the collapsible container */
  private renderDynamicButtons(buttons: ToolbarItemConfig[]): void {
    if (!this._collapsibleContainer) return;

    this._collapsibleContainer.innerHTML = ""; // Clear existing buttons

    buttons.forEach((config) => {
      const button = document.createElement("teskooano-button");
      button.id = `engine-toolbar-button-${config.id}`;
      button.title = config.title ?? "";
      button.setAttribute("variant", "icon");
      button.setAttribute("size", "small");

      const iconSpan = document.createElement("span");
      iconSpan.slot = "icon";
      iconSpan.innerHTML = config.iconSvg ?? "";
      button.appendChild(iconSpan);

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

  /** Clears and re-renders widgets in the widget container */
  private renderDynamicWidgets(widgets: ToolbarWidgetConfig[]): void {
    if (!this._widgetContainer) return;

    this._widgetContainer.innerHTML = ""; // Clear existing widgets

    widgets.forEach((config) => {
      try {
        const widgetElement = document.createElement(config.componentName);
        // Optionally add a common class for styling all widgets
        // widgetElement.classList.add("engine-toolbar-widget");

        if (config.id) {
          widgetElement.id = `engine-toolbar-widget-${config.id}`;
        }
        // Apply params as attributes (simple values only for now)
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
        // Optionally add an error placeholder to the UI
        const errorEl = document.createElement("div");
        errorEl.textContent = "⚠";
        errorEl.title = `Error loading widget: ${config.id}`;
        errorEl.style.color = "red";
        this._widgetContainer?.appendChild(errorEl);
      }
    });
  }

  /** Handles clicks for buttons configured as 'panel' type */
  private handlePanelButtonClick(config: PanelToolbarItemConfig): void {
    const panelId = `${config.componentName}_${this._apiId}_float`;
    const behaviour = config.behaviour ?? "toggle";

    // --- ADD Offset Calculation Logic ---
    const calculatePosition = () => {
      if (config.initialPosition) {
        return config.initialPosition; // Use provided position
      }
      // Calculate offset based on existing tracked panels for this toolbar
      const baseOffset = 50; // Initial offset from top/left
      const panelIndex = this._activeFloatingPanels.size; // 0-based index
      const cascadeOffset = panelIndex * 30; // Stagger each new panel
      // --- Adjust default width/height and add specific size for focus-control ---
      let defaultWidth = 500; // Increased default width
      let defaultHeight = 300; // Increased default height

      return {
        top: baseOffset + cascadeOffset,
        left: baseOffset + cascadeOffset,
        width: defaultWidth,
        height: defaultHeight,
      };
      // --- END Adjust ---
    };
    // --- END ADD ---

    console.log(
      `[EngineToolbar ${this._apiId}] Handling panel button click for: ${config.id}, panelId: ${panelId}, component: ${config.componentName}, behaviour: ${behaviour}`,
    );

    // --- Toggle Behaviour ---
    if (behaviour === "toggle") {
      const existingPanel = this._dockviewController.api.getPanel(panelId);
      if (existingPanel?.api.isVisible) {
        console.log(
          `[EngineToolbar ${this._apiId}] Panel ${panelId} exists and is visible, removing (toggle off).`,
        );
        try {
          this._dockviewController.api.removePanel(existingPanel);
          // Let the subscription handle _activeFloatingPanels cleanup
        } catch (error) {
          console.error(
            `[EngineToolbar ${this._apiId}] Error removing panel ${panelId}:`,
            error,
          );
        }
      } else {
        const position = calculatePosition();
        console.log(
          `[EngineToolbar ${this._apiId}] Calculated position:`,
          JSON.stringify(position),
        );
        if (existingPanel) {
          console.log(
            `[EngineToolbar ${this._apiId}] Panel ${panelId} exists but is hidden. Activating and setting size.`,
          );
          try {
            existingPanel.api.setSize(position);
            const newTitle = config.panelTitle ?? config.title;
            if (existingPanel.api.title !== newTitle) {
              existingPanel.api.updateParameters({ title: newTitle });
            }
            existingPanel.api.setActive();
            // Re-track just in case removal listener didn't fire/was missed
            this._activeFloatingPanels.set(panelId, config.componentName);
          } catch (e) {
            console.error(
              `[EngineToolbar ${this._apiId}] Error setting size/activating existing panel ${panelId}:`,
              e,
            );
          }
        } else {
          console.log(
            `[EngineToolbar ${this._apiId}] Panel ${panelId} does not exist. Creating new panel.`,
          );
          const panelApi = this._dockviewController.addFloatingPanel(
            {
              id: panelId, // Use derived ID for toggle
              component: config.componentName,
              title: config.panelTitle ?? config.title,
              params: {
                title: config.panelTitle ?? config.title,
                parentInstance: this._parentEngine, // CRITICAL
              },
            },
            position,
          );
          if (panelApi) {
            this._activeFloatingPanels.set(panelId, config.componentName);
            panelApi.setActive?.();
          } else {
            console.error(
              `[EngineToolbar ${this._apiId}] Failed to create floating panel ${panelId}`,
            );
          }
        }
      }
    }
    // --- Create Behaviour ---
    else if (behaviour === "create") {
      console.log(
        `[EngineToolbar ${this._apiId}] Creating new panel instance for ${config.componentName} (behaviour: create).`,
      );
      const newPanelId = `${config.componentName}_${this._apiId}_float_${Date.now()}`;
      const position = calculatePosition();
      console.log(
        `[EngineToolbar ${this._apiId}] Calculated position for new panel ${newPanelId}:`,
        position,
      );
      const panelApi = this._dockviewController.addFloatingPanel(
        {
          id: newPanelId,
          component: config.componentName,
          title: config.panelTitle ?? config.title,
          params: {
            title: config.panelTitle ?? config.title,
            parentInstance: this._parentEngine, // CRITICAL
          },
        },
        position,
      );
      if (panelApi) {
        this._activeFloatingPanels.set(newPanelId, config.componentName);
        panelApi.setActive?.();
      } else {
        console.error(
          `[EngineToolbar ${this._apiId}] Failed to create floating panel ${newPanelId}`,
        );
      }
    }
  }

  /** Handles clicks for buttons configured as 'function' type */
  private async handleFunctionButtonClick(
    config: FunctionToolbarItemConfig,
  ): Promise<void> {
    console.log(
      `[EngineToolbar ${this._apiId}] Handling function button click for: ${config.id}, functionId: ${config.functionId}`,
    );
    const funcConfig = getFunctionConfig(config.functionId);
    if (funcConfig && typeof funcConfig.execute === "function") {
      try {
        // Pass the apiId or parentEngine if the function needs context?
        // For now, pass nothing.
        await funcConfig.execute(/* pass args if needed */);
      } catch (error) {
        console.error(
          `[EngineToolbar ${this._apiId}] Error executing function '${config.functionId}' for button '${config.id}':`,
          error,
        );
      }
    } else {
      console.warn(
        `[EngineToolbar ${this._apiId}] Function configuration or execute method not found for functionId: ${config.functionId}`,
      );
    }
  }

  /**
   * @param isExpanded True if the toolbar should be expanded, false otherwise.
   */
  public updateExpansionUI(isExpanded: boolean): void {
    // Store the state locally (optional, manager is source of truth but good for immediate UI)
    this._isExpanded = isExpanded;
    console.log(
      `[EngineToolbar ${this._apiId}] Updating UI. Expanded: ${isExpanded}`,
    );

    if (!this._toggleButton || !this._collapsibleContainer) return;

    const iconSpan = this._toggleButton.querySelector("span[slot='icon']");

    // Update container class
    this._collapsibleContainer.classList.toggle("expanded", isExpanded);

    // Update button icon and title
    if (iconSpan) {
      iconSpan.innerHTML = isExpanded
        ? BoxMultipleArrowLeftFilled
        : BoxMultipleArrowRightFilled;
    }
    this._toggleButton.title = isExpanded ? "Hide Tools" : "Show Tools";
  }

  /** Clean up listeners when the toolbar is destroyed */
  public dispose(): void {
    console.log(`Disposing EngineToolbar for ${this._apiId}...`);

    // Unsubscribe from expansion state
    this._expansionSubscription?.unsubscribe();
    this._expansionSubscription = null;

    // Remove the element from the DOM
    this._element.remove();

    // Clear internal references
    this._toggleButton = null;
    this._collapsibleContainer = null;
    this._widgetContainer = null;
    this._activeFloatingPanels.clear();

    console.log(`[EngineToolbar ${this._apiId}] disposed.`);
  }

  /**
   * Subscribes to the expansion state Observable provided by the manager.
   */
  private subscribeToExpansionState(): void {
    // Ensure existing subscription is cleaned up
    this._expansionSubscription?.unsubscribe();

    // Get manager instance via parent
    const manager = this._parentEngine.getToolbarManagerInstance?.();

    if (manager) {
      const state$ = manager.getExpansionState$(this._apiId);
      if (state$) {
        this._expansionSubscription = state$.subscribe((isExpanded) => {
          console.log(
            `[EngineToolbar ${this._apiId}] Received expansion state update: ${isExpanded}`,
          );
          this.updateExpansionUI(isExpanded);
        });
        console.log(
          `[EngineToolbar ${this._apiId}] Subscribed to expansion state.`,
        );
      } else {
        console.error(
          `[EngineToolbar ${this._apiId}] Could not get expansion state observable from manager.`,
        );
      }
    } else {
      console.error(
        `[EngineToolbar ${this._apiId}] Could not get EngineToolbarManager instance to subscribe to state.`,
      );
    }
  }
}
