import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { FocusControlController } from "../controller/FocusControl.controller.js";
import "../components/celestial-row/CelestialRow.component.js";
import { template } from "./FocusControl.template.js";

/**
 * The view component for the focus control panel.
 *
 * This custom element (`<focus-control>`) is responsible for rendering the
 * panel's UI and delegating all logic to the `FocusControlController`.
 * It implements Dockview's `IContentRenderer` to integrate with the panel system.
 */
export class FocusControl extends HTMLElement implements IContentRenderer {
  private controller!: FocusControlController;

  /**
   * Creates an instance of the FocusControl view.
   * Sets up the shadow DOM and instantiates the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    const treeListContainer = this.shadowRoot!.getElementById(
      "focus-tree-list",
    ) as HTMLUListElement;
    const resetButton = this.shadowRoot!.getElementById("reset-view")!;
    const clearButton = this.shadowRoot!.getElementById("clear-focus")!;

    if (!treeListContainer || !resetButton || !clearButton) {
      console.error(
        "[FocusControl] Critical elements not found in shadow DOM.",
      );
      // Avoid creating controller if view is broken
      return;
    }

    this.controller = new FocusControlController(
      this,
      treeListContainer,
      resetButton,
      clearButton,
    );
  }

  /**
   * Standard lifecycle callback.
   * Called when the element is added to the DOM.
   * Initializes the controller.
   */
  connectedCallback() {
    this.controller?.initialize();
  }

  /**
   * Standard lifecycle callback.
   * Called when the element is removed from the DOM.
   * Disposes of the controller to clean up resources.
   */
  disconnectedCallback() {
    this.controller?.dispose();
  }

  /**
   * Initialization method called by Dockview when the panel is created.
   * It receives the parent panel instance, which is then passed to the controller.
   * @param parameters The initialization parameters from Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const parent = (parameters.params as any)
      ?.parentInstance as CompositeEnginePanel;

    if (
      parent &&
      typeof parent.getRenderer === "function" &&
      parent.engineCameraManager
    ) {
      this.controller?.setParentPanel(parent);
    } else {
      console.error(
        `[FocusControl] Initialization did not provide a valid CompositeEnginePanel with an engineCameraManager.`,
        parameters.params,
      );
    }
  }

  /**
   * Required by the `IContentRenderer` interface.
   * Returns the HTMLElement instance to be rendered by Dockview.
   */
  get element(): HTMLElement {
    return this;
  }

  /**
   * A public method that provides a clear API for external components
   * to request that an object be followed.
   * Delegates the call directly to the controller.
   * @param objectId The ID of the object to follow.
   * @returns True if the follow request was successfully initiated.
   */
  public publicFollowObject = (objectId: string): boolean => {
    return this.controller?.publicFollowObject(objectId) ?? false;
  };
}
