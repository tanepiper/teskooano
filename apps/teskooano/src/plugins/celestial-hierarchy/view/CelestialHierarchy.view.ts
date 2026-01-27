import {
  GroupPanelPartInitParameters,
  IContentRenderer,
  DockviewPanelApi,
} from "dockview-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { CelestialHierarchyController } from "../controller/CelestialHierarchy.controller.js";
import "../components/celestial-row/CelestialRow.component.js";
import { template } from "./CelestialHierarchy.template.js";

/**
 * The view component for the celestial hierarchy panel.
 *
 * This custom element (`<celestial-hierarchy>`) is responsible for rendering the
 * panel's UI and delegating all logic to the `CelestialHierarchyController`.
 * It implements Dockview's `IContentRenderer` to integrate with the panel system.
 */
export class CelestialHierarchy
  extends HTMLElement
  implements IContentRenderer
{
  private controller!: CelestialHierarchyController;
  private connectedWindowElement: HTMLElement | null = null;
  private panelApi: DockviewPanelApi | null = null;

  /**
   * Creates an instance of the CelestialHierarchy view.
   * Sets up the shadow DOM and instantiates the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    const treeListContainer = this.shadowRoot!.getElementById(
      "focus-tree-list",
    ) as HTMLUListElement;
    const destroyedListContainer = this.shadowRoot!.getElementById(
      "destroyed-list",
    ) as HTMLUListElement;
    this.connectedWindowElement =
      this.shadowRoot!.getElementById("connected-window");
    const resetButton = this.shadowRoot!.getElementById("reset-button")!;
    const clearButton = this.shadowRoot!.getElementById("clear-button")!;

    if (!treeListContainer || !destroyedListContainer) {
      console.error(
        "[CelestialHierarchy] Critical elements not found in shadow DOM.",
      );
      // Avoid creating controller if view is broken
      return;
    }

    this.controller = new CelestialHierarchyController(
      treeListContainer,
      destroyedListContainer,
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
    // REQUIRE panel API ID - no fallback
    if (!parameters.api?.id) {
      throw new Error(
        "[CelestialHierarchy] Panel ID is required but not provided",
      );
    }

    // Store the panel API for updating the title
    this.panelApi = parameters.api;

    const parent = (parameters.params as any)
      ?.parentInstance as CompositeEnginePanel;

    // REQUIRE parent panel connection - no fallback
    if (!parent?.panelId) {
      throw new Error(
        "[CelestialHierarchy] Must be connected to a CompositeEnginePanel",
      );
    }

    // Set data-panel-id to parent panel ID (for event extraction in nested components)
    this.setAttribute("data-panel-id", parent.panelId);

    if (
      parent &&
      typeof parent.getRenderer === "function" &&
      parent.cameraManager
    ) {
      this.controller?.setParentPanel(parent);

      // Update the connected window display and panel title
      this.updateConnectedWindowDisplay(parent);
    } else {
      console.error(
        `[CelestialHierarchy] Initialization did not provide a valid CompositeEnginePanel with an engineCameraManager.`,
        parameters.params,
      );
      this.updateConnectedWindowDisplay(null);
    }
  }

  /**
   * Updates the connected window display in the header and the panel title.
   * @param parent The parent CompositeEnginePanel, or null if not connected.
   */
  private updateConnectedWindowDisplay(
    parent: CompositeEnginePanel | null,
  ): void {
    if (!this.connectedWindowElement) return;

    if (parent) {
      // Try to get the panel title from the parent's API
      const parentTitle =
        (parent as any)._api?.title ||
        (parent as any)._params?.params?.title ||
        parent.id ||
        "Unknown Teskooano Window";

      console.log("[CelestialHierarchy] Parent title found:", parentTitle);
      console.log("[CelestialHierarchy] Parent API:", (parent as any)._api);
      console.log(
        "[CelestialHierarchy] Parent params:",
        (parent as any)._params,
      );

      this.connectedWindowElement.textContent = `For: ${parentTitle}`;
      this.connectedWindowElement.style.color =
        "var(--color-text-secondary, #aaa)";

      // Update the panel's title to include the connected window
      if (this.panelApi) {
        const newTitle = `Celestial Hierarchy (${parentTitle})`;
        (parent as any)._api.updateParameters({ title: newTitle });

        // For floating panels, use updateParameters instead of setTitle
        try {
          this.panelApi.updateParameters({ title: newTitle });
          console.log(
            "[CelestialHierarchy] updateParameters called successfully",
          );

          // Check if the title was actually set
          setTimeout(() => {
            const currentTitle = this.panelApi?.title;
            console.log(
              "[CelestialHierarchy] Current panel title after updateParameters:",
              currentTitle,
            );
          }, 100);
        } catch (error) {
          console.error("[CelestialHierarchy] Error updating title:", error);
        }
      } else {
        console.warn(
          "[CelestialHierarchy] No panel API available to set title",
        );
      }
    } else {
      this.connectedWindowElement.textContent =
        "Not connected to any Teskooano window";
      this.connectedWindowElement.style.color =
        "var(--color-text-disabled, #888)";

      // Reset the panel title to default
      if (this.panelApi) {
        console.log("[CelestialHierarchy] Resetting panel title to default");
        this.panelApi.updateParameters({ title: "Celestial Hierarchy" });
      } else {
        console.warn(
          "[CelestialHierarchy] No panel API available to reset title",
        );
      }
    }
  }

  /**
   * Required by the `IContentRenderer` interface.
   * Returns the HTMLElement instance to be rendered by Dockview.
   */
  get element(): HTMLElement {
    return this;
  }
}
