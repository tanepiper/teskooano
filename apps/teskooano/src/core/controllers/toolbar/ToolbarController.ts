import { fromEvent, Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";
import {
  type FunctionToolbarItemConfig,
  type PanelToolbarItemConfig,
  type PluginExecutionContext,
  type ToolbarItemConfig,
  type ToolbarWidgetConfig,
  pluginManager,
} from "@teskooano/ui-plugin";
import {
  createComponentState,
  type ReactiveState,
} from "@teskooano/ui-plugin/patterns";
import { template as toolbarTemplate } from "./ToolbarController.template.js";
import { createToolbarButton } from "./ToolbarController.utils.js";

interface ToolbarState {
  items: ToolbarItemConfig[];
  widgets: ToolbarWidgetConfig[];
  isMobile: boolean;
}

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
  private _state: ReactiveState;
  private _subscriptions: Subscription = new Subscription();

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

    this._state = createComponentState<ToolbarState>(
      {
        items: [],
        widgets: [],
        isMobile: this.detectMobileDevice(),
      },
      { componentName: "ToolbarController" },
    );

    this.setupStateSubscriptions();
    this.setupStateWatchers();
    this.setupStaticListeners();

    // Initial population
    this.loadToolbarData();
  }

  /**
   * Cleans up subscriptions when the controller is no longer needed.
   */
  public destroy(): void {
    this._subscriptions.unsubscribe();
    this._state.dispose();
  }

  /**
   * Detects if the current device is a mobile device based on window width.
   * @returns `true` if the device's screen width is less than 768px, otherwise `false`.
   */
  public detectMobileDevice(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * Sets up subscriptions to global events and state changes.
   * @private
   */
  private setupStateSubscriptions(): void {
    const resizeSub = fromEvent(window, "resize")
      .pipe(
        startWith(null),
        map(() => this.detectMobileDevice()),
      )
      .subscribe((isMobile) => this._state.set("isMobile", isMobile));

    const pluginChangesSub = pluginManager.pluginsChanged$.subscribe(() => {
      this.loadToolbarData();
    });

    this._subscriptions.add(resizeSub);
    this._subscriptions.add(pluginChangesSub);
  }

  /**
   * Sets up watchers that react to state changes and update the UI.
   * @private
   */
  private setupStateWatchers(): void {
    this._state.watch("items", (items: ToolbarItemConfig[]) =>
      this.renderItems(items),
    );
    this._state.watch("widgets", (widgets: ToolbarWidgetConfig[]) =>
      this.renderWidgets(widgets),
    );
    this._state.watch("isMobile", (isMobile: boolean) =>
      this.updateMobileState(isMobile),
    );
  }

  /**
   * Loads the current toolbar items and widgets from the plugin manager into the state.
   * @private
   */
  private loadToolbarData(): void {
    this._state.update({
      items: pluginManager.getToolbarItemsForTarget("main-toolbar"),
      widgets: pluginManager.getToolbarWidgetsForTarget("main-toolbar"),
    });
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
   * Clears and re-populates the toolbar buttons based on the current state.
   * @param items The array of toolbar item configurations.
   * @private
   */
  private renderItems(items: ToolbarItemConfig[]): void {
    this._buttonContainer.innerHTML = "";
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

        let buttonElement: HTMLElement;

        if (item.type === "function") {
          const buttonConfig = item as FunctionToolbarItemConfig;
          buttonElement = createToolbarButton(buttonConfig.id, buttonOptions);
          this._subscriptions.add(
            fromEvent(buttonElement, "click").subscribe(() => {
              this._context.pluginManager.execute(buttonConfig.functionId);
            }),
          );
        } else if (item.type === "panel") {
          const panelConfig = item as PanelToolbarItemConfig;
          buttonElement = createToolbarButton(panelConfig.id, buttonOptions);
          this._subscriptions.add(
            fromEvent(buttonElement, "click").subscribe(() => {
              this._context.dockviewController.handlePanelToggleAction(
                panelConfig,
              );
            }),
          );
        } else {
          return;
        }

        this._buttonContainer.appendChild(buttonElement);
      } catch (error) {
        console.error(
          `[ToolbarController] Error creating item '${item.id}'`,
          error,
        );
      }
    });
  }

  /**
   * Clears and re-populates the toolbar widgets based on the current state.
   * @param widgets The array of toolbar widget configurations.
   * @private
   */
  private renderWidgets(widgets: ToolbarWidgetConfig[]): void {
    this._widgetContainer.innerHTML = "";
    widgets.forEach((widget) => {
      try {
        const widgetElement = document.createElement(widget.componentName);
        if (widget.id) widgetElement.id = widget.id;
        if (widget.params) {
          Object.entries(widget.params).forEach(([key, value]) => {
            widgetElement.setAttribute(key, String(value));
          });
        }
        this._widgetContainer.appendChild(widgetElement);

        if (typeof (widgetElement as any).setContext === "function") {
          (widgetElement as any).setContext(this._context);
        }
      } catch (error) {
        console.error(
          `[ToolbarController] Error creating widget '${widget.id}'`,
          error,
        );
      }
    });
  }

  /**
   * Toggles the 'mobile' attribute on designated buttons based on the mobile state.
   * @param isMobile The current mobile state.
   * @private
   */
  private updateMobileState(isMobile: boolean): void {
    const mobileAwareButtons = this._element.querySelectorAll<HTMLElement>(
      "[data-mobile-aware='true']",
    );
    mobileAwareButtons.forEach((button) => {
      button.toggleAttribute("mobile", isMobile);
    });
  }
}
