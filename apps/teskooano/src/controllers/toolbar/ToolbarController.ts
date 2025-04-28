import {
  type FunctionToolbarItemConfig, // Specific config for function buttons
  getFunctionConfig, // Assuming this type is added
  getToolbarItemsForTarget,
  getToolbarWidgetsForTarget, // Get all items for a target
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
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

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
   * Reference to the GitHub button element.
   * @private
   */
  private _githubButton: HTMLElement | null = null;
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
   * Creates and configures the static buttons (Logo, GitHub, Tour, Settings)
   * and appends them to the specified container.
   * @private
   * @param {HTMLElement} container - The container element (e.g., leftButtonGroup) to append the buttons to.
   */
  private _createStaticButtons(container: HTMLElement): void {
    const logoButton = document.createElement("teskooano-button");
    logoButton.id = "toolbar-logo";
    logoButton.title = "Visit Teskooano Website";
    logoButton.setAttribute("variant", "image");
    logoButton.setAttribute("size", "medium");
    logoButton.innerHTML = `<span slot="icon"><img src="/assets/icon.png" alt="Teskooano Logo" style="width: 45px; height: 45px; object-fit: contain;"></span>`;
    logoButton.addEventListener("click", () => {
      window.open(this.WEBSITE_URL, "_blank");
    });
    container.appendChild(logoButton);

    this._githubButton = document.createElement("teskooano-button");
    this._githubButton.id = "toolbar-github";
    this._githubButton.title = "View on GitHub";
    this._githubButton.setAttribute("variant", "icon");
    this._githubButton.setAttribute("size", "medium");
    this._githubButton.innerHTML = `<span slot="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.341-3.369-1.341-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.891 1.529 2.341 1.088 2.91.832.092-.647.348-1.088.635-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.446-1.27.098-2.64 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.82c.85.004 1.705.115 2.504.336 1.91-1.294 2.748-1.025 2.748-1.025.546 1.37.201 2.387.099 2.64.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.688-4.566 4.935.359.309.678.92.678 1.852 0 1.338-.012 2.419-.012 2.748 0 .267.18.577.688.48C19.137 20.166 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg></span>`;
    this._githubButton.addEventListener(
      "click",
      this._handlers.handleGitHubClick,
    );
    container.appendChild(this._githubButton);

    this._tourButton = document.createElement("teskooano-button");
    this._tourButton.id = "toolbar-tour";
    this._tourButton.title = "Start Tour";
    this._tourButton.setAttribute("variant", "icon");
    this._tourButton.setAttribute("size", "medium");
    this._tourButton.innerHTML = `<span slot="icon">${TourIcon}</span>`;
    this._tourButton.addEventListener("click", this._handlers.handleTourClick);
    container.appendChild(this._tourButton);

    this._settingsButton = document.createElement("teskooano-button");
    this._settingsButton.id = "toolbar-settings";
    this._settingsButton.title = "Settings";
    this._settingsButton.setAttribute("variant", "icon");
    this._settingsButton.setAttribute("size", "medium");
    this._settingsButton.innerHTML = `<span slot="icon">${SettingsIcon}</span>`;
    this._settingsButton.addEventListener(
      "click",
      this._handlers.handleSettingsClick,
    );
    container.appendChild(this._settingsButton);
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
            buttonElement.title = buttonConfig.title ?? "";
            buttonElement.setAttribute("variant", "icon");
            buttonElement.setAttribute("size", "medium");
            if (buttonConfig.iconSvg) {
              buttonElement.innerHTML = `<span slot="icon">${buttonConfig.iconSvg}</span>`;
            }

            const functionId = buttonConfig.functionId;
            buttonElement.addEventListener("click", () => {
              const funcConfig = getFunctionConfig(functionId);
              if (funcConfig?.execute) {
                try {
                  funcConfig.execute();
                } catch (execError) {
                  console.error(
                    `[ToolbarController] Error executing function '${functionId}':`,
                    execError,
                  );
                }
              } else {
                console.error(
                  // Use error here as it's unexpected
                  `[ToolbarController] Button clicked, but function '${functionId}' not found via getFunctionConfig.`,
                );
              }
            });

            buttonContainer.appendChild(buttonElement);
          } else if (item.type === "panel") {
            console.warn(
              // Use warn as it's planned but not implemented
              `[ToolbarController] Skipping panel item '${item.id}' - panel item handling not implemented.`,
            );
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
