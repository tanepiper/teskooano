import {
  AddGroupOptions,
  AddPanelOptions,
  createDockview,
  DockviewApi,
  DockviewPanelApi,
  IContentRenderer,
  IDockviewPanel,
} from "dockview-core";

import { Observable, Subject } from "rxjs";

import { FallbackPanel } from "./FallbackPanel";
import { GroupManager } from "./GroupManager";
import { OverlayManager } from "./OverlayManager";
import {
  ComponentConstructorWithStaticConfig,
  DockviewGroup,
  ModalResult,
  OverlayOptions,
  RegisteredComponentInfo,
} from "./types";

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
      this.handlePanelRemoval(panel);
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

    let toolbarConfig: RegisteredComponentInfo["toolbarConfig"] | undefined =
      undefined;
    if (
      typeof componentConstructor.registerToolbarButtonConfig === "function"
    ) {
      try {
        toolbarConfig = componentConstructor.registerToolbarButtonConfig();
      } catch (err) {
        console.error(
          `DockviewController: Error calling registerToolbarButtonConfig for '${name}':`,
          err,
        );
      }
    }

    this._registeredComponents.set(name, {
      constructor: componentConstructor as new () => IContentRenderer,
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
    if (
      typeof options.component === "string" &&
      !this._registeredComponents.has(options.component) &&
      options.component !== "default"
    ) {
      console.warn(
        `DockviewController: Component '${options.component}' not pre-registered. Panel may fail to render.`,
      );
    }

    return this._api.addPanel(options);
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

      const panel = this._api.addPanel(panelWithPosition);

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
    const group = this._groupManager.createOrGetGroup(groupName, groupOptions);

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
    const componentInfo = this._registeredComponents.get(componentName);
    return componentInfo?.toolbarConfig;
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
  ): DockviewPanelApi | null {
    let temporaryPanel: IDockviewPanel | null = null;
    try {
      const initialPanelOptions: AddPanelOptions = {
        ...panelOptions,
        position: undefined,
      };
      temporaryPanel = this._api.addPanel(initialPanelOptions);

      if (!temporaryPanel || !temporaryPanel.api) {
        console.error(
          `DockviewController: Failed to create initial panel instance for ${panelOptions.id}.`,
        );
        return null;
      }

      this._api.addFloatingGroup(temporaryPanel, {
        position: position,
      });

      if (position && temporaryPanel.api) {
        try {
          temporaryPanel.api.setSize(position);
        } catch (e) {
          console.error(
            `DockviewController: Error calling setSize after addFloatingGroup for ${panelOptions.id}:`,
            e,
          );
        }
      }

      temporaryPanel.api.setActive();
      return temporaryPanel.api;
    } catch (error) {
      console.error(
        `DockviewController: Error adding floating panel ${panelOptions.id}:`,
        error,
      );

      if (temporaryPanel) {
        try {
          this._api.removePanel(temporaryPanel);
        } catch (cleanupError) {
          console.error(
            `DockviewController: Error cleaning up temporary panel ${panelOptions.id}:`,
            cleanupError,
          );
        }
      }
      return null;
    }
  }

  /**
   * Internal handler called when a panel is removed from the Dockview instance.
   * Notifies subscribers via `onPanelRemoved$` and triggers group tracking cleanup.
   * @param panel - The panel that was removed.
   * @internal
   */
  private handlePanelRemoval(panel: IDockviewPanel): void {
    const groupId = panel.group?.id;
    const panelId = panel.id;

    this._removedPanelSubject.next(panelId);

    const group = panel.group;

    if (group && group.panels.length === 0 && groupId) {
      this._groupManager.cleanupGroupTracking(groupId);
    } else if (group) {
    } else {
      console.warn(
        `DockviewController: Removed panel '${panelId}' did not have an associated group.`,
      );
    }
  }

  /**
   * Handles the action triggered by a toolbar button configured with type: 'panel'.
   * Toggles or creates a floating panel based on the provided configuration.
   * @param config - The configuration object for the panel button.
   */
  public handlePanelToggleAction(
    config: RegisteredComponentInfo["toolbarConfig"],
  ): void {
    if (!config) {
      console.error(
        "[DockviewController] handlePanelToggleAction called with undefined config",
      );
      return;
    }

    const panelId = `${config.componentName}_float`;
    const behaviour = config.behaviour ?? "toggle";

    const existingPanel = this.api.getPanel(panelId);

    if (behaviour === "toggle") {
      if (existingPanel?.api.isVisible) {
        try {
          this.api.removePanel(existingPanel);
        } catch (error) {
          console.error(
            `[DockviewController] Error removing panel ${panelId}:`,
            error,
          );
        }
      } else {
        if (existingPanel) {
          existingPanel.api.setActive();
        } else {
          // Default position if not specified in config
          let position = { top: 100, left: 100, width: 500, height: 400 };

          // Check if initialPosition is defined in the config and use it
          // The type for 'config' is RegisteredComponentInfo["toolbarConfig"]
          // We need to ensure it can hold initialPosition, or cast safely.
          const toolbarItemConfig = config as any; // Cast to access potential custom fields

          if (toolbarItemConfig.initialPosition) {
            const ip = toolbarItemConfig.initialPosition;
            // Ensure all values are numbers. If they were functions, they should be resolved before this point.
            // Or, resolve them here if they are indeed functions.
            // For now, assuming they are numbers or resolvable to numbers.
            position = {
              top:
                typeof ip.top === "function"
                  ? ip.top()
                  : (ip.top ?? position.top),
              left:
                typeof ip.left === "function"
                  ? ip.left()
                  : (ip.left ?? position.left),
              width:
                typeof ip.width === "function"
                  ? ip.width()
                  : (ip.width ?? position.width),
              height:
                typeof ip.height === "function"
                  ? ip.height()
                  : (ip.height ?? position.height),
            };
          }

          this.addFloatingPanel(
            {
              id: panelId,
              component: config.componentName,
              title: config.panelTitle ?? config.title,
              params: { title: config.panelTitle ?? config.title },
            },
            position,
          );
        }
      }
    } else if (behaviour === "create") {
      const newPanelId = `${config.componentName}_float_${Date.now()}`;
      const position = { top: 100, left: 100, width: 500, height: 400 };
      this.addFloatingPanel(
        {
          id: newPanelId,
          component: config.componentName,
          title: config.panelTitle ?? config.title,
          params: { title: config.panelTitle ?? config.title },
        },
        position,
      );
    }
  }
}
