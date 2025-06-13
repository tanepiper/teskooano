import {
  fromEvent,
  BehaviorSubject,
  map,
  startWith,
  tap,
  Subscription,
} from "rxjs";
import {
  type FunctionToolbarItemConfig,
  type PanelToolbarItemConfig,
  type PluginExecutionContext,
  type RegisteredItem,
  type ToolbarItemConfig,
  type ToolbarItemDefinition,
  type ToolbarRegistration,
  type ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";
import { template as toolbarTemplate } from "./ToolbarController.template.js";
import { createToolbarButton } from "./ToolbarController.utils.js";

/**
 * Controller for the main application toolbar.
 *
 * It dynamically populates the toolbar with buttons and widgets based on
 * plugin registrations, and handles responsive layout changes.
 */
export class ToolbarController {
  private _element: HTMLElement;
  private _buttonContainer: HTMLElement;
  private _widgetContainer: HTMLElement;
  private _context: PluginExecutionContext;
  private _isMobileDevice$: BehaviorSubject<boolean>;
  private _pluginChangesSubscription: Subscription;

  /**
   * URL for the main Teskooano website.
   * @private
   * @readonly
   */
  private readonly WEBSITE_URL = "https://teskooano.space";

  /**
   * Initializes the ToolbarController.
   * @param element The target HTMLElement to render the toolbar into.
   * @param context The PluginExecutionContext for accessing plugin manager and Dockview controller.
   */
  constructor(element: HTMLElement, context: PluginExecutionContext) {
    this._element = element;
    this._context = context;

    this._element.appendChild(toolbarTemplate.content.cloneNode(true));
    this._buttonContainer = this._element.querySelector(
      ".left-button-group",
    )! as HTMLElement;
    this._widgetContainer = this._element.querySelector(
      ".widget-area",
    )! as HTMLElement;

    this._isMobileDevice$ = new BehaviorSubject<boolean>(
      this.detectMobileDevice(),
    );

    fromEvent(window, "resize")
      .pipe(
        startWith(null),
        map(() => this.detectMobileDevice()),
        tap((isMobile) => this._isMobileDevice$.next(isMobile)),
      )
      .subscribe();

    this.setupStaticListeners();
    this.setupMobileAttributeToggle();

    this._pluginChangesSubscription =
      this._context.pluginManager.pluginsChanged$.subscribe(() => {
        this.reRenderToolbars();
      });
  }

  /**
   * Cleans up subscriptions when the controller is no longer needed.
   */
  public destroy(): void {
    this._pluginChangesSubscription.unsubscribe();
  }

  /**
   * Detects if the current device is a mobile device based on window width.
   * @returns `true` if the window width is less than 768px, otherwise `false`.
   */
  public detectMobileDevice(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * Sets up event listeners for static elements like the logo.
   * @private
   */
  private setupStaticListeners(): void {
    const logoButton = this._element.querySelector("#toolbar-logo");
    if (logoButton) {
      logoButton.addEventListener("click", () => {
        window.open(this.WEBSITE_URL, "_blank");
      });
    }
  }

  /**
   * Clears and re-populates the toolbar items and widgets.
   * This is called initially and whenever plugins change.
   * @private
   */
  private reRenderToolbars(): void {
    // Clear existing dynamic items
    this._buttonContainer.innerHTML = "";
    this._widgetContainer.innerHTML = "";

    // Repopulate
    this.populateItems(this._buttonContainer);
    this.populateWidgets(this._widgetContainer);
  }

  /**
   * Dynamically populates toolbar buttons from plugin registrations.
   * @param targetId The ID of the container element for the buttons.
   * @private
   */
  private populateItems(buttonContainer: HTMLElement): void {
    try {
      const items: ToolbarItemConfig[] =
        this._context.pluginManager.getToolbarItemsForTarget("main-toolbar");

      items.forEach((item: ToolbarItemConfig) => {
        try {
          const configAny = item as any;
          const buttonOptions = {
            title: item.title,
            iconSvg: item.iconSvg,
            tooltipText: configAny.tooltipText,
            tooltipTitle: configAny.tooltipTitle,
            tooltipIconSvg: configAny.tooltipIconSvg,
            tooltipHorizontalAlign: configAny.tooltipHorizontalAlign,
            mobileAware: item.id === "main-toolbar-add-view",
          };

          if (item.type === "function") {
            const buttonConfig = item as FunctionToolbarItemConfig;
            const buttonElement = createToolbarButton(
              buttonConfig.id,
              buttonOptions,
            );
            fromEvent(buttonElement, "click").subscribe(async () => {
              this._context.pluginManager.execute(buttonConfig.functionId);
            });
            buttonContainer.appendChild(buttonElement);
          } else if (item.type === "panel") {
            const panelConfig = item as PanelToolbarItemConfig;
            const buttonElement = createToolbarButton(
              panelConfig.id,
              buttonOptions,
            );
            fromEvent(buttonElement, "click").subscribe(() => {
              this._context.dockviewController.handlePanelToggleAction(
                panelConfig,
              );
            });
            buttonContainer.appendChild(buttonElement);
          }
        } catch (error) {
          console.error(`[ToolbarController] Error creating item '${item.id}'`);
        }
      });
    } catch (error) {
      console.error(
        "[ToolbarController] Error populating toolbar items.",
        error,
      );
    }
  }

  /**
   * Dynamically populates toolbar widgets from plugin registrations.
   * @param targetId The ID of the container element for the widgets.
   * @private
   */
  private populateWidgets(widgetContainer: HTMLElement): void {
    try {
      const widgets: ToolbarWidgetConfig[] =
        this._context.pluginManager.getToolbarWidgetsForTarget("main-toolbar");
      widgets.forEach((widget: ToolbarWidgetConfig) => {
        try {
          const widgetElement = document.createElement(widget.componentName);
          if (widget.id) widgetElement.id = widget.id;
          if (widget.params) {
            Object.entries(widget.params).forEach(([key, value]) => {
              widgetElement.setAttribute(key, String(value));
            });
          }
          widgetContainer.appendChild(widgetElement);

          // After appending, check for and call setContext if it exists
          if (typeof (widgetElement as any).setContext === "function") {
            (widgetElement as any).setContext(this._context);
          }
        } catch (error) {
          console.error(
            `[ToolbarController] Error creating widget '${widget.id}'`,
          );
          throw error;
        }
      });
    } catch (error) {
      console.error("[ToolbarController] Error populating widgets.");
      throw error;
    }
  }

  /**
   * Subscribes to the mobile device state to toggle the 'mobile' attribute
   * on designated buttons.
   * @private
   */
  private setupMobileAttributeToggle(): void {
    this._isMobileDevice$.subscribe((isMobile) => {
      const mobileAwareButtons = this._element.querySelectorAll<HTMLElement>(
        "[data-mobile-aware='true']",
      );
      mobileAwareButtons.forEach((button) => {
        button.toggleAttribute("mobile", isMobile);
      });
    });
  }
}
