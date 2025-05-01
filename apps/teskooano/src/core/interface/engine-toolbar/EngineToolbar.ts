import { Subscription } from "rxjs"; // Import Subscription
import { DockviewController } from "../../controllers/dockview/DockviewController";

import { EngineToolbarManager } from "./EngineToolbarManager";

import BoxMultipleArrowLeftFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_left_24_regular.svg?raw";
import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";

import {
  pluginManager,
  FunctionToolbarItemConfig,
  PanelToolbarItemConfig,
  ToolbarItemConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

export interface EnginePanelWithToolbarToggle {
  requestToolbarToggle(): void;
}

export class EngineToolbar {
  private readonly _element: HTMLElement;
  private _toggleButton: HTMLElement | null = null;
  private _collapsibleContainer: HTMLElement | null = null;
  private _widgetContainer: HTMLElement | null = null;
  private _dockviewController: DockviewController;
  private _apiId: string;
  private _parentEngine: EnginePanelWithToolbarToggle;
  private _isExpanded: boolean = true;
  private _activeFloatingPanels: Map<string, string> = new Map();
  private _expansionSubscription: Subscription | null = null;

  /**
   * The root HTML element for the toolbar.
   */
  get element(): HTMLElement {
    return this._element;
  }

  constructor(
    apiId: string,
    dockviewController: DockviewController,
    parentEngine: EnginePanelWithToolbarToggle,
  ) {
    this._apiId = apiId;
    this._dockviewController = dockviewController;
    this._parentEngine = parentEngine;

    this._element = document.createElement("div");
    this._element.classList.add("engine-overlay-toolbar-container");

    this.injectStyles();
    this.createBaseStructure();
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

    document.head.appendChild(style);
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
      this._parentEngine.requestToolbarToggle();
    });

    leftSection.appendChild(toggleButton);
    this._toggleButton = toggleButton;

    const collapsibleContainer = document.createElement("div");
    collapsibleContainer.classList.add("toolbar-collapsible-buttons");

    leftSection.appendChild(collapsibleContainer);
    this._collapsibleContainer = collapsibleContainer; // Store reference

    this._element.appendChild(leftSection);

    const widgetContainer = document.createElement("div");
    widgetContainer.classList.add("toolbar-widget-area");
    this._element.appendChild(widgetContainer);
    this._widgetContainer = widgetContainer; // Store reference
  }

  private populateItemsFromPlugins(): void {
    const itemConfigs =
      pluginManager.getToolbarItemsForTarget("engine-toolbar");
    const widgetConfigs =
      pluginManager.getToolbarWidgetsForTarget("engine-toolbar");

    this.renderDynamicButtons(itemConfigs);
    this.renderDynamicWidgets(widgetConfigs);
  }

  /** Listen only for panel removals to clean up internal tracking */
  private listenForPanelRemovals(): void {
    this._dockviewController.onPanelRemoved$.subscribe((removedPanelId) => {
      if (this._activeFloatingPanels.has(removedPanelId)) {
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

  /** Handles clicks for buttons configured as 'panel' type */
  private handlePanelButtonClick(config: PanelToolbarItemConfig): void {
    const panelId = `${config.componentName}_${this._apiId}_float`;
    const behaviour = config.behaviour ?? "toggle";

    const calculatePosition = () => {
      if (config.initialPosition) {
        return config.initialPosition;
      }
      const baseOffset = 50;
      const panelIndex = this._activeFloatingPanels.size;
      const cascadeOffset = panelIndex * 30;
      let defaultWidth = 500;
      let defaultHeight = 300;

      return {
        top: baseOffset + cascadeOffset,
        left: baseOffset + cascadeOffset,
        width: defaultWidth,
        height: defaultHeight,
      };
    };

    if (behaviour === "toggle") {
      const existingPanel = this._dockviewController.api.getPanel(panelId);
      if (existingPanel?.api.isVisible) {
        try {
          this._dockviewController.api.removePanel(existingPanel);
        } catch (error) {
          console.error(
            `[EngineToolbar ${this._apiId}] Error removing panel ${panelId}:`,
            error,
          );
        }
      } else {
        const position = calculatePosition();

        if (existingPanel) {
          try {
            existingPanel.api.setSize(position);
            const newTitle = config.panelTitle ?? config.title;
            if (existingPanel.api.title !== newTitle) {
              existingPanel.api.updateParameters({ title: newTitle });
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
    } else if (behaviour === "create") {
      const newPanelId = `${config.componentName}_${this._apiId}_float_${Date.now()}`;
      const position = calculatePosition();

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
    const functionId = config.functionId;
    if (!functionId) {
      console.error(
        `[EngineToolbar ${this._apiId}] Function button clicked, but config lacks functionId.`,
      );
      return;
    }
    try {
      await pluginManager.execute(functionId); // Call with functionId
    } catch (error) {
      console.error(
        `[EngineToolbar ${this._apiId}] Error executing function '${functionId}':`,
        error,
      );
    }
  }

  /**
   * @param isExpanded True if the toolbar should be expanded, false otherwise.
   */
  public updateExpansionUI(isExpanded: boolean): void {
    // Store the state locally (optional, manager is source of truth but good for immediate UI)
    this._isExpanded = isExpanded;

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
  }

  /**
   * Subscribes to the expansion state Observable provided by the manager.
   */
  private subscribeToExpansionState(): void {
    const manager = pluginManager.getManagerInstance<EngineToolbarManager>(
      "engine-toolbar-manager",
    );

    if (manager && typeof manager.getExpansionState$ === "function") {
      // Get the specific observable for this panel ID
      const expansionState$ = manager.getExpansionState$(this._apiId);

      // Subscribe only if the observable was found
      if (expansionState$) {
        this._expansionSubscription = expansionState$.subscribe(
          (isExpanded: boolean) => {
            this.updateExpansionUI(isExpanded);
          },
        );
      } else {
        console.warn(
          `[EngineToolbar ${this._apiId}] Could not get expansion state observable for this panel ID from manager.`,
        );
      }
    } else {
      console.error(
        `[EngineToolbar ${this._apiId}] Cannot subscribe to expansion state: EngineToolbarManager not found or lacks getExpansionState$ method.`,
      );
    }
  }
}
