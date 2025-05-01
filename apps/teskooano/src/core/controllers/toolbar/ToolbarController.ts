import {
  PanelToolbarItemConfig,
  execute, // Assuming this type is added
  getToolbarItemsForTarget,
  getToolbarWidgetsForTarget,
  type FunctionToolbarItemConfig, // Get all items for a target
  type ToolbarItemConfig, // Assuming this function is added to the plugin package
  type ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";
import type { DockviewController } from "../dockview/DockviewController.js";
import "./ToolbarController.css";

import {
  createToolbarHandlers,
  type ToolbarTemplateHandlers,
} from "./ToolbarController.handlers.js";

import TourIcon from "@fluentui/svg-icons/icons/compass_northwest_24_regular.svg?raw";

/**
 * @class ToolbarController
 * @description Manages the main application toolbar, dynamically rendering buttons
 * and widgets based on plugin registrations and handling user interactions.
 * It also adapts the toolbar layout based on screen size (mobile/desktop).
 */
export class ToolbarController {
  /**
   * The container element for the toolbar UI.
   * @private
   */
  private _element: HTMLElement;
  /**
   * Reference to the Dockview controller for adding/managing panels.
   * @private
   */
  private _dockviewController: DockviewController;
  /**
   * Tracks whether the application is currently viewed on a mobile-like device width.
   * @private
   */
  private _isMobileDevice: boolean = false;

  /**
   * Reference to the Settings button element.
   * @private
   */
  private _settingsButton: HTMLElement | null = null;
  /**
   * Reference to the Tour button element.
   * @private
   */
  private _tourButton: HTMLElement | null = null;

  /**
   * Handlers for toolbar button clicks and other interactions.
   * @private
   */
  private _handlers: ToolbarTemplateHandlers;

  /**
   * URL for the Teskooano GitHub repository.
   * @private
   * @readonly
   */
  private readonly GITHUB_REPO_URL = "https://github.com/tanepiper/teskooano";
  /**
   * URL for the main Teskooano website.
   * @private
   * @readonly
   */
  private readonly WEBSITE_URL = "https://teskooano.space";

  /**
   * Initializes the ToolbarController.
   * @param {HTMLElement} element - The DOM element to attach the toolbar to.
   * @param {DockviewController} dockviewController - The Dockview controller instance.
   */
  constructor(element: HTMLElement, dockviewController: DockviewController) {
    this._element = element;
    this._dockviewController = dockviewController;
    this._isMobileDevice = this.detectMobileDevice();
    this._handlers = createToolbarHandlers(this);

    window.addEventListener("resize", this.handleResize);

    this.createToolbar();
  }

  /**
   * Handles window resize events to check for mobile state changes and update the UI.
   * @private
   */
  private handleResize = (): void => {
    const wasMobile = this._isMobileDevice;
    const isNowMobile = this.detectMobileDevice();
    if (wasMobile !== isNowMobile) {
      this.updateToolbarForMobileState();
    }
  };

  /**
   * Detects if the current device context resembles a mobile device based on screen width or user agent.
   * Updates the internal `_isMobileDevice` state.
   * @public
   * @returns {boolean} True if the device is considered mobile, false otherwise.
   */
  public detectMobileDevice(): boolean {
    const isMobileWidth = window.innerWidth < 768;
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    this._isMobileDevice = isMobileWidth || isMobileDevice;
    return this._isMobileDevice;
  }

  /**
   * Cleans up resources, specifically removing the window resize event listener.
   * Should be called when the controller is no longer needed.
   * @public
   */
  public destroy(): void {
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * Updates specific toolbar elements' visual appearance based on the current mobile state.
   * For example, adjusts spacing and toggles mobile attributes on buttons.
   * @public
   */
  public updateToolbarForMobileState(): void {
    this._element.style.gap = this._isMobileDevice
      ? "var(--space-xs, 4px)"
      : "var(--space-md, 12px)";

    this._tourButton?.toggleAttribute("mobile", this._isMobileDevice);
    // Potentially add other elements that need mobile state adjustments here
    // e.g., find the "Add View" button by its ID if it needs specific styling.
    const addViewButton = this._element.querySelector<HTMLElement>(
      "#main-toolbar-add-view",
    );
    addViewButton?.toggleAttribute("mobile", this._isMobileDevice);
  }

  /**
   * Clears the existing toolbar content and rebuilds it by setting up layout,
   * creating static buttons, and loading dynamic items from the plugin system.
   * @private
   */
  private createToolbar(): void {
    this._element.innerHTML = "";
    this._element.classList.add("toolbar-container");

    const { leftButtonGroup, widgetArea } = this._setupToolbarLayout();
    this._createStaticButtons(leftButtonGroup);
    this._loadAndCreatePluginItems(leftButtonGroup, widgetArea);

    this._element.appendChild(leftButtonGroup);
    this._element.appendChild(widgetArea);

    this.updateToolbarForMobileState();
  }

  /**
   * Creates the main layout containers (div elements) for the toolbar sections.
   * @private
   * @returns {{ leftButtonGroup: HTMLDivElement, widgetArea: HTMLDivElement }} An object containing the created container elements.
   */
  private _setupToolbarLayout(): {
    leftButtonGroup: HTMLDivElement;
    widgetArea: HTMLDivElement;
  } {
    const leftButtonGroup = document.createElement("div");
    leftButtonGroup.classList.add("toolbar-section", "left-button-group");

    const widgetArea = document.createElement("div");
    widgetArea.classList.add("toolbar-section", "widget-area");

    return { leftButtonGroup, widgetArea };
  }

  /**
   * Creates and configures the static buttons (Logo, Tour, Settings)
   * and appends them to the specified container.
   * @private
   * @param {HTMLElement} container - The container element (e.g., leftButtonGroup) to append the buttons to.
   */
  private _createStaticButtons(container: HTMLElement): void {
    const logoButton = document.createElement("teskooano-button");
    logoButton.id = "toolbar-logo";
    logoButton.title = "Visit Teskooano Website";
    logoButton.setAttribute("variant", "image");
    logoButton.setAttribute("size", "sm");
    logoButton.setAttribute("tooltip-text", "Visit Teskooano Website");
    logoButton.setAttribute("tooltip-title", "Teskooano");
    logoButton.setAttribute("tooltip-icon-svg", TourIcon);
    logoButton.innerHTML = `<span slot="icon"><img src="/assets/icon.png" alt="Teskooano Logo" style="width: 45px; height: 45px; object-fit: contain;"></span>`;
    logoButton.addEventListener("click", () => {
      window.open(this.WEBSITE_URL, "_blank");
    });
    container.appendChild(logoButton);
  }

  /**
   * Fetches and creates toolbar items (widgets, buttons) registered via the plugin system
   * for the "main-toolbar" target and appends them to the appropriate containers.
   * Handles basic parameter setting for widgets and function execution for buttons.
   * @private
   * @param {HTMLElement} buttonContainer - The container for buttons.
   * @param {HTMLElement} widgetContainer - The container for widgets.
   */
  private _loadAndCreatePluginItems(
    buttonContainer: HTMLElement,
    widgetContainer: HTMLElement,
  ): void {
    const targetId = "main-toolbar";

    try {
      const widgets: ToolbarWidgetConfig[] =
        getToolbarWidgetsForTarget(targetId);
      widgets.forEach((widgetConfig) => {
        try {
          const widgetElement = document.createElement(
            widgetConfig.componentName,
          );
          widgetElement.classList.add("toolbar-widget");
          if (widgetConfig.id) {
            widgetElement.id = widgetConfig.id;
          }
          if (widgetConfig.params) {
            Object.entries(widgetConfig.params).forEach(([key, value]) => {
              if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              ) {
                widgetElement.setAttribute(key, String(value));
              } else {
                console.error(
                  // Use error here as it's unexpected
                  `[ToolbarController] Cannot set complex param '${key}' as attribute on ${widgetConfig.componentName}`,
                );
              }
            });
          }
          widgetContainer.appendChild(widgetElement);
        } catch (widgetError) {
          console.error(
            `[ToolbarController] Error creating widget '${widgetConfig.id ?? widgetConfig.componentName}':`,
            widgetError,
          );
        }
      });
    } catch (pluginError) {
      console.error(
        `[ToolbarController] Error fetching or processing toolbar widgets for target '${targetId}':`,
        pluginError,
      );
      const errorEl = document.createElement("div");
      errorEl.textContent = "Error loading toolbar widgets.";
      errorEl.style.color = "red";
      widgetContainer.appendChild(errorEl);
    }

    try {
      const items: ToolbarItemConfig[] = getToolbarItemsForTarget(targetId);
      items.forEach((item) => {
        try {
          if (item.type === "function") {
            const buttonConfig = item as FunctionToolbarItemConfig;
            if (!buttonConfig.functionId) {
              console.error(
                // Use error here as it's unexpected
                `[ToolbarController] Skipping function item '${buttonConfig.id}' - missing functionId.`,
              );
              return;
            }

            const buttonElement = document.createElement("teskooano-button");
            buttonElement.id = buttonConfig.id;
            buttonElement.setAttribute("variant", "icon");
            buttonElement.setAttribute("size", "sm");
            if (buttonConfig.iconSvg) {
              buttonElement.innerHTML = `<span slot="icon">${buttonConfig.iconSvg}</span>`;
            }

            const configAny = buttonConfig as any;
            if (configAny.tooltipText) {
              buttonElement.setAttribute("tooltip-text", configAny.tooltipText);
            }
            if (configAny.tooltipTitle) {
              buttonElement.setAttribute(
                "tooltip-title",
                configAny.tooltipTitle,
              );
            }
            if (configAny.tooltipIconSvg) {
              buttonElement.setAttribute(
                "tooltip-icon-svg",
                configAny.tooltipIconSvg,
              );
            }
            if (!configAny.tooltipText && buttonConfig.title) {
              buttonElement.setAttribute("title", buttonConfig.title);
            }

            const functionId = buttonConfig.functionId;
            buttonElement.addEventListener("click", async () => {
              try {
                await execute(functionId);
              } catch (execError) {
                console.error(
                  `[ToolbarController] Error executing function '${functionId}':`,
                  execError,
                );
              }
            });

            buttonContainer.appendChild(buttonElement);
          } else if (item.type === "panel") {
            const panelConfig = item as PanelToolbarItemConfig;

            if (!panelConfig.componentName) {
              console.error(
                `[ToolbarController] Skipping panel item '${panelConfig.id}' - missing componentName.`,
              );
              return; // Continue to next item
            }

            const buttonElement = document.createElement("teskooano-button");
            buttonElement.id = panelConfig.id;
            buttonElement.setAttribute("variant", "icon");
            buttonElement.setAttribute("size", "sm");
            if (panelConfig.iconSvg) {
              buttonElement.innerHTML = `<span slot="icon">${panelConfig.iconSvg}</span>`;
            }

            // Handle tooltips (similar to function buttons)
            const configAny = panelConfig as any;
            if (configAny.tooltipText)
              buttonElement.setAttribute("tooltip-text", configAny.tooltipText);
            if (configAny.tooltipTitle)
              buttonElement.setAttribute(
                "tooltip-title",
                configAny.tooltipTitle,
              );
            if (configAny.tooltipIconSvg)
              buttonElement.setAttribute(
                "tooltip-icon-svg",
                configAny.tooltipIconSvg,
              );
            if (!configAny.tooltipText && panelConfig.title)
              buttonElement.setAttribute("title", panelConfig.title);

            buttonElement.addEventListener("click", () => {
              this._dockviewController.handlePanelToggleAction(panelConfig);
            });

            buttonContainer.appendChild(buttonElement);
          }
        } catch (elementError) {
          console.error(
            `[ToolbarController] Error creating toolbar item '${item.id}':`,
            elementError,
          );
        }
      });
    } catch (pluginError) {
      console.error(
        `[ToolbarController] Error fetching or processing toolbar items for target '${targetId}':`,
        pluginError,
      );
      const errorEl = document.createElement("div");
      errorEl.textContent = "Error loading toolbar buttons/items.";
      errorEl.style.color = "red";
      buttonContainer.appendChild(errorEl);
    }
  }

  /**
   * Opens the Teskooano GitHub repository in a new browser window or tab.
   * Intended to be called by the GitHub button's click handler.
   * @public
   */
  public openGitHubRepo(): void {
    window.open(this.GITHUB_REPO_URL, "_blank");
  }
}
