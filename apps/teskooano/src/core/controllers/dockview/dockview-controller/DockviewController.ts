import {
  AddGroupOptions,
  AddPanelOptions,
  createDockview,
  DockviewApi,
  DockviewPanelApi,
  IDockviewPanel,
} from "dockview-core";

import { Observable, Subject } from "rxjs";

import { FallbackPanel } from "../fallback-panel";
import { GroupManager } from "../group-manager";
import { OverlayManager } from "../overlay-manager";
import {
  ComponentConstructorWithStaticConfig,
  DockviewGroup,
  ModalResult,
  OverlayOptions,
  RegisteredComponentInfo,
} from "../types";
import { addFloatingPanel, addPanel } from "./DockviewController.api";
import { handlePanelRemoval } from "./DockviewController.events";
import { handlePanelToggleAction } from "./DockviewController.toggle";

/**
 * Controller class for managing a Dockview instance.
 * Handles component registration, panel/group management, overlays,
 * and interactions with the core Dockview API.
 * Delegates specific tasks to OverlayManager and GroupManager.
 */
export class DockviewController {
  private _api: DockviewApi;
  /** @internal Component registry mapping names to constructors and config */
  private _registeredComponents = new Map<string, RegisteredComponentInfo>();
  private _overlayManager: OverlayManager;
  private _groupManager: GroupManager;

  /** @internal Subject to emit panel IDs when they are removed */
  private _removedPanelSubject = new Subject<string>();
  /** Observable that emits the ID of a panel when it is removed from the Dockview instance. */
  public readonly onPanelRemoved$: Observable<string> =
    this._removedPanelSubject.asObservable();

  /**
   * Creates an instance of DockviewController.
   * Initializes Dockview, managers, registers default components, and sets up listeners.
   * @param element - The root HTML element to host the Dockview instance.
   */
  constructor(element: HTMLElement) {
    this._api = createDockview(element, {
      className: "dockview-theme-abyss",
      createComponent: (options) => {
        const componentInfo = this._registeredComponents.get(options.name);
        if (componentInfo) {
          try {
            return new componentInfo.constructor();
          } catch (err) {
            console.error(
              `DockviewController: Error instantiating registered component '${options.name}':`,
              err,
            );
            const errorPanel = new FallbackPanel();

            const errorMessage =
              err instanceof Error ? err.message : String(err);
            errorPanel.updateContent(
              `Error creating component: ${errorMessage}`,
            );
            return errorPanel;
          }
        }

        switch (options.name) {
          case "default":
            return new FallbackPanel();
          default:
            console.warn(
              `Unknown component requested or not registered: ${options.name}`,
            );
            const errorPanel = new FallbackPanel();
            errorPanel.updateContent(
              `Error: Unknown/unregistered component '${options.name}'`,
            );
            return errorPanel;
        }
      },
      disableFloatingGroups: false,
    });

    this._overlayManager = new OverlayManager(element);
    this._groupManager = new GroupManager(this._api);
    this._api.onDidRemovePanel((panel: IDockviewPanel) => {
      handlePanelRemoval(panel, this._removedPanelSubject, this._groupManager);
    });
  }

  /**
   * Dynamically registers a component constructor with the controller.
   * Allows adding components after initial setup.
   * Also extracts and stores static toolbar configuration if provided by the component.
   * @param name - The unique name to register the component under.
   * @param componentConstructor - The constructor function of the component.
   */
  public registerComponent(
    name: string,
    componentConstructor: ComponentConstructorWithStaticConfig,
  ): void {
    if (this._registeredComponents.has(name)) {
      console.warn(
        `DockviewController: Component '${name}' is already registered. Overwriting.`,
      );
    }

    const toolbarConfig = componentConstructor.registerToolbarButtonConfig?.();
    this._registeredComponents.set(name, {
      constructor: componentConstructor,
      toolbarConfig,
    });
  }

  /**
   * Adds a new panel to the Dockview instance using the core API.
   * It's recommended to use more specific methods like `addPanelToNamedGroup` or `addFloatingPanel`
   * unless direct API interaction is needed.
   * @param options - Options for adding the panel (Dockview AddPanelOptions).
   * @param options.component - The name of the registered component to render.
   * @returns The newly added panel API (IDockviewPanel).
   */
  public addPanel(
    options: Parameters<DockviewApi["addPanel"]>[0],
  ): IDockviewPanel {
    return addPanel(this._api, this._registeredComponents, options);
  }

  /**
   * Creates a new group or returns an existing one with the provided name.
   * Delegates to GroupManager.
   * @param groupName Logical name for the group
   * @param options Optional configuration for the new group
   * @returns The group object or null if creation failed or group not found
   */
  public createOrGetGroup(
    groupName: string,
    options?: AddGroupOptions,
  ): DockviewGroup | null {
    return this._groupManager.createOrGetGroup(groupName, options);
  }

  /**
   * Get a group by its logical name.
   * Delegates to GroupManager.
   */
  public getGroupByName(groupName: string): DockviewGroup | null {
    return this._groupManager.getGroupByName(groupName);
  }

  /**
   * Adds a panel directly to a specific group using the group's reference.
   * This method interacts directly with the Dockview API.
   * @param group - The target Dockview group object.
   * @param panelOptions - Options for the panel to add (must include `id` and `component`).
   * @returns The API of the newly added panel, or null if creation failed.
   */
  public addPanelToGroup(
    group: DockviewGroup,
    panelOptions: AddPanelOptions,
  ): IDockviewPanel | null {
    try {
      const panelWithPosition = {
        ...panelOptions,
      };

      if (!panelWithPosition.position) {
        panelWithPosition.position = {
          referenceGroup: group.id,
        };
      }

      const panel = this.addPanel(panelWithPosition);

      panel.api.setActive();
      return panel;
    } catch (error) {
      console.error(
        `DockviewController: Failed to add panel '${panelOptions.id}' to group ID '${group.id}':`,
        error,
      );
      return null;
    }
  }

  /**
   * Adds a panel to a named group, creating the group if it doesn't exist.
   * Uses GroupManager to get/create the group.
   */
  public addPanelToNamedGroup(
    groupName: string,
    panelOptions: AddPanelOptions,
    groupOptions?: AddGroupOptions,
  ): IDockviewPanel | null {
    const group = this.createOrGetGroup(groupName, groupOptions);

    if (!group) {
      console.error(
        `DockviewController: Cannot add panel '${panelOptions.id}' because group '${groupName}' could not be created or retrieved.`,
      );
      return null;
    }

    return this.addPanelToGroup(group, panelOptions);
  }

  /**
   * Maximize a group by its logical name.
   * Delegates to GroupManager.
   */
  public maximizeGroupByName(groupName: string): boolean {
    return this._groupManager.maximizeGroupByName(groupName);
  }

  /**
   * Exits the maximized state if any group is currently maximized.
   * Uses the core Dockview API.
   */
  public exitMaximizedGroup(): void {
    try {
      this._api.exitMaximizedGroup();
    } catch (error) {
      console.error(
        `DockviewController: Failed to exit maximized group:`,
        error,
      );
    }
  }

  /**
   * Retrieves the static toolbar button configuration for a registered component.
   * @param componentName - The name the component was registered under.
   * @returns The static PanelToolbarButtonConfig or undefined if not found.
   */
  public getToolbarButtonConfig(
    componentName: string,
  ): RegisteredComponentInfo["toolbarConfig"] {
    return this._registeredComponents.get(componentName)?.toolbarConfig;
  }

  /**
   * Exposes the raw Dockview API instance for advanced use cases.
   * @returns The underlying DockviewApi instance.
   */
  public get api(): DockviewApi {
    return this._api;
  }

  /**
   * Shows a modal-like overlay centered in the Dockview container.
   * Delegates to OverlayManager.
   * @param id Unique ID for this overlay instance.
   * @param element The HTML element to display within the overlay.
   * @param options Dimensions for the overlay.
   * @returns A promise that resolves with the result when the overlay is hidden.
   */
  public showOverlay(
    id: string,
    element: HTMLElement,
    options: OverlayOptions,
  ): Promise<ModalResult> {
    return this._overlayManager.showOverlay(id, element, options);
  }

  /**
   * Hides and cleans up a specific overlay.
   * Delegates to OverlayManager.
   * @param id The ID of the overlay to hide.
   * @param result The reason the overlay is being hidden (e.g., 'confirm', 'close').
   */
  public hideOverlay(id: string, result: ModalResult): void {
    this._overlayManager.hideOverlay(id, result);
  }

  public dispose(): void {
    try {
      this._api.dispose();
    } catch (error) {
      console.error("DockviewController: Error disposing Dockview API:", error);
    }

    this._removedPanelSubject.complete();
    this._registeredComponents.clear();
    this._overlayManager.dispose();
    this._groupManager.dispose();
  }

  /**
   * Adds a new panel within its own new floating group.
   * @param panelOptions - Options for the panel to add (must include `id` and `component`).
   * @param position - Optional absolute position and size for the floating group.
   * @returns The API of the newly added panel, or null if creation failed.
   */
  public addFloatingPanel(
    panelOptions: AddPanelOptions,
    position?: { top: number; left: number; width: number; height: number },
  ): DockviewPanelApi | undefined {
    const panel = addFloatingPanel(this._api, panelOptions, position);
    return panel?.api;
  }

  /**
   * Handles the action triggered by a toolbar button configured with type: 'panel'.
   * Toggles or creates a floating panel based on the provided configuration.
   * @param config - The configuration object for the panel button.
   */
  public handlePanelToggleAction(
    config: RegisteredComponentInfo["toolbarConfig"],
  ): void {
    handlePanelToggleAction(this._api, config);
  }
}
