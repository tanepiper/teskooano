import { fromEvent, BehaviorSubject, map, startWith, tap } from "rxjs";
import {
  type FunctionToolbarItemConfig,
  type PanelToolbarItemConfig,
  type PluginExecutionContext,
  type ToolbarItemConfig,
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

    this.render();
  }

  /**
   * Detects if the current device is a mobile device based on window width.
   * @returns `true` if the window width is less than 768px, otherwise `false`.
   */
  public detectMobileDevice(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * Renders the basic toolbar structure from the template.
   * @private
   */
  private render(): void {
    const logoButton = this._element.querySelector("#toolbar-logo");
    if (logoButton) {
      logoButton.addEventListener("click", () => {
        window.open(this.WEBSITE_URL, "_blank");
      });
    }

    this.populateItems(this._buttonContainer);
    this.populateWidgets(this._widgetContainer);
    this.setupMobileAttributeToggle();
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

      items.forEach((item) => {
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
      console.error("[ToolbarController] Error populating toolbar items.");
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
      widgets.forEach((widget) => {
        try {
          const widgetElement = document.createElement(widget.componentName);
          if (widget.id) widgetElement.id = widget.id;
          if (widget.params) {
            Object.entries(widget.params).forEach(([key, value]) => {
              widgetElement.setAttribute(key, String(value));
            });
          }
          widgetContainer.appendChild(widgetElement);
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
