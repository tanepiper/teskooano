import {
  PanelToolbarItemConfig,
  pluginManager,
  type FunctionToolbarItemConfig,
  type ToolbarItemConfig,
  type ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";
import type { DockviewController } from "../dockview/DockviewController.js";
import { template as toolbarTemplate } from "./ToolbarController.template.js";

import {
  createToolbarHandlers,
  type ToolbarTemplateHandlers,
} from "./ToolbarController.handlers.js";

import { BehaviorSubject, fromEvent } from "rxjs";
import { map, startWith, tap } from "rxjs/operators";

/**
 * @class ToolbarController
 * @description Manages the main application toolbar, dynamically rendering buttons
 * and widgets based on plugin registrations and handling user interactions.
 * It also adapts the toolbar layout based on screen size (mobile/desktop) using RxJS.
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
   * Reactive state for mobile device detection.
   * @private
   */
  private _isMobileDevice$: BehaviorSubject<boolean>;

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
    // Initialize the reactive mobile state
    this._isMobileDevice$ = new BehaviorSubject<boolean>(
      this.detectMobileDevice(),
    );
    this._handlers = createToolbarHandlers(this);

    // Use RxJS for resize events
    fromEvent(window, "resize")
      .pipe(
        map(() => this.detectMobileDevice()), // Check mobile state on resize
        startWith(this._isMobileDevice$.value), // Emit initial state
        // distinctUntilChanged(), // Optional: Only emit if state changes
        tap((isMobile) => this._isMobileDevice$.next(isMobile)), // Update the subject
        tap((isMobile) => this.updateToolbarStyles(isMobile)), // Update styles directly
      )
      .subscribe(); // Subscribe to start listening

    this.createToolbar();
  }

  /**
   * Detects if the current device context resembles a mobile device based on screen width or user agent.
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
    return isMobileWidth || isMobileDevice;
  }

  /**
   * Cleans up resources, specifically removing the window resize event listener subscription.
   * Should be called when the controller is no longer needed.
   * @public
   */
  public destroy(): void {
    this._isMobileDevice$.complete(); // Signal completion
  }

  /**
   * Updates specific toolbar elements' visual appearance based on the current mobile state.
   * This is now triggered by the RxJS resize observable.
   * @param {boolean} isMobile - The current mobile state.
   * @private
   */
  private updateToolbarStyles(isMobile: boolean): void {
    this._element.style.gap = isMobile
      ? "var(--space-xs, 4px)"
      : "var(--space-md, 12px)";

    this._tourButton?.toggleAttribute("mobile", isMobile);
    const addViewButton = this._element.querySelector<HTMLElement>(
      "#main-toolbar-add-view",
    );
    addViewButton?.toggleAttribute("mobile", isMobile);
  }

  /**
   * Clears the existing toolbar content and rebuilds it using the template,
   * populating it with dynamic plugin items and attaching static listeners.
   * @private
   */
  private createToolbar(): void {
    this._element.innerHTML = "";
    this._element.classList.add("toolbar-container");

    const templateContent = toolbarTemplate.content.cloneNode(
      true,
    ) as DocumentFragment;

    const leftButtonGroup = templateContent.querySelector(
      ".left-button-group",
    ) as HTMLElement;
    const widgetArea = templateContent.querySelector(
      ".widget-area",
    ) as HTMLElement;
    const logoButton = templateContent.querySelector(
      "#toolbar-logo",
    ) as HTMLElement;

    if (!leftButtonGroup || !widgetArea || !logoButton) {
      console.error(
        "[ToolbarController] Could not find required elements (button group, widget area, or logo) in template!",
      );
      return;
    }

    // Attach listener for the static logo button found in the template
    fromEvent(logoButton, "click").subscribe(() => {
      window.open(this.WEBSITE_URL, "_blank");
    });

    // Load dynamic items into their respective containers
    this._loadAndCreatePluginItems(leftButtonGroup, widgetArea);

    this._element.appendChild(templateContent);
  }

  /**
   * Fetches and creates toolbar items (widgets, buttons) registered via the plugin system
   * using the helper function for buttons.
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
        pluginManager.getToolbarWidgetsForTarget(targetId);
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
      const items: ToolbarItemConfig[] =
        pluginManager.getToolbarItemsForTarget(targetId);
      items.forEach((item) => {
        try {
          const configAny = item as any;
          const buttonOptions = {
            title: item.title,
            variant: "icon" as const,
            size: "sm" as const,
            iconSvg: item.iconSvg,
            tooltipText: configAny.tooltipText,
            tooltipTitle: configAny.tooltipTitle,
            tooltipIconSvg: configAny.tooltipIconSvg,
            mobileAware: item.id === "main-toolbar-add-view",
          };

          if (item.type === "function") {
            const buttonConfig = item as FunctionToolbarItemConfig;
            if (!buttonConfig.functionId) {
              console.error(
                `[ToolbarController] Skipping function item '${buttonConfig.id}' - missing functionId.`,
              );
              return;
            }

            const buttonElement = this._createButtonElement(
              buttonConfig.id,
              buttonOptions,
            );

            const functionId = buttonConfig.functionId;
            fromEvent(buttonElement, "click").subscribe(async () => {
              try {
                await pluginManager.execute(functionId);
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
              return;
            }

            const buttonElement = this._createButtonElement(
              panelConfig.id,
              buttonOptions,
            );

            fromEvent(buttonElement, "click").subscribe(() => {
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
   * Helper function to create a 'teskooano-button' element with common configurations.
   * @param id The ID for the button.
   * @param options Configuration options (title, variant, size, iconSvg, tooltip, etc.).
   * @returns The configured button element.
   * @private
   */
  private _createButtonElement(
    id: string,
    options: {
      title?: string;
      variant?: "icon" | "image" | "text"; // Add other variants if needed
      size?: "sm" | "md" | "lg";
      iconSvg?: string;
      imageUrl?: string; // For image variant
      imageAlt?: string; // For image variant
      tooltipText?: string;
      tooltipTitle?: string;
      tooltipIconSvg?: string;
      tooltipHorizontalAlign?: "start" | "center" | "end";
      mobileAware?: boolean; // Flag if it needs the mobile attribute toggled
    },
  ): HTMLElement {
    const buttonElement = document.createElement("teskooano-button");
    buttonElement.id = id;

    if (options.title) buttonElement.title = options.title;
    buttonElement.setAttribute("variant", options.variant ?? "icon");
    buttonElement.setAttribute("size", options.size ?? "sm");

    if (options.iconSvg) {
      buttonElement.innerHTML = `<span slot="icon">${options.iconSvg}</span>`;
    } else if (options.variant === "image" && options.imageUrl) {
      buttonElement.innerHTML = `<span slot="icon"><img src="${options.imageUrl}" alt="${options.imageAlt ?? ""}" style="width: 45px; height: 45px; object-fit: contain;"></span>`;
    }

    if (options.tooltipText)
      buttonElement.setAttribute("tooltip-text", options.tooltipText);
    if (options.tooltipTitle)
      buttonElement.setAttribute("tooltip-title", options.tooltipTitle);
    if (options.tooltipIconSvg)
      buttonElement.setAttribute("tooltip-icon-svg", options.tooltipIconSvg);
    if (options.tooltipHorizontalAlign)
      buttonElement.setAttribute(
        "tooltip-horizontal-align",
        options.tooltipHorizontalAlign,
      );

    if (!options.tooltipText && options.title) {
      buttonElement.title = options.title;
    }

    if (options.mobileAware) {
      buttonElement.dataset.mobileAware = "true";
    }

    return buttonElement;
  }
}
