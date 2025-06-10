import type {
  DockviewApi,
  AddPanelOptions,
  IDockviewPanel,
} from "dockview-core";
import type { RegisteredComponentInfo } from "../types";

/**
 * Adds a new panel to the Dockview instance using the core API.
 * @param api The DockviewApi instance.
 * @param registeredComponents The map of registered components.
 * @param options Options for adding the panel.
 * @returns The newly added panel API.
 */
export function addPanel(
  api: DockviewApi,
  registeredComponents: Map<string, RegisteredComponentInfo>,
  options: Parameters<DockviewApi["addPanel"]>[0],
): IDockviewPanel {
  if (
    typeof options.component === "string" &&
    !registeredComponents.has(options.component) &&
    options.component !== "default"
  ) {
    console.warn(
      `DockviewController: Component '${options.component}' not pre-registered. Panel may fail to render.`,
    );
  }
  return api.addPanel(options);
}

/**
 * Adds a new panel within its own new floating group.
 * @param api The DockviewApi instance.
 * @param panelOptions Options for the panel to add.
 * @param position Optional absolute position and size for the floating group.
 * @returns The API of the newly added panel, or null if creation failed.
 */
export function addFloatingPanel(
  api: DockviewApi,
  panelOptions: AddPanelOptions,
  position?: { top: number; left: number; width: number; height: number },
): IDockviewPanel | null {
  let temporaryPanel: IDockviewPanel | null = null;
  try {
    const initialPanelOptions: AddPanelOptions = {
      ...panelOptions,
      position: undefined,
    };
    temporaryPanel = api.addPanel(initialPanelOptions);

    if (!temporaryPanel || !temporaryPanel.api) {
      console.error(
        `DockviewController: Failed to create initial panel instance for ${panelOptions.id}.`,
      );
      return null;
    }

    api.addFloatingGroup(temporaryPanel, {
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
    return temporaryPanel;
  } catch (error) {
    console.error(
      `DockviewController: Error adding floating panel ${panelOptions.id}:`,
      error,
    );

    if (temporaryPanel) {
      try {
        api.removePanel(temporaryPanel);
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
