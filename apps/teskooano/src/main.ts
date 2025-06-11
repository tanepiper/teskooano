import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";
import "./vite-env.d";

import { getCelestialObjects } from "@teskooano/core-state";

import { TourController } from "./core/interface/tour-controller";

import {
  pluginManager,
  PanelConfig,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";

import { pluginConfig } from "./config/pluginRegistry";
import { pluginConfig as corePluginConfig } from "./core/config/pluginRegistry";

import {
  IContentRenderer,
  PanelInitParameters,
  DockviewApi,
} from "dockview-core";

interface AppContext {
  modalManager?: any;
  dockviewController?: any;
}
export const appContext: AppContext = {};

async function initializeApp() {
  console.log("🔭 Initializing Teskooano...");
  const appElement = document.getElementById("app");
  const toolbarElement = document.getElementById("toolbar");

  if (!appElement || !toolbarElement) {
    throw new Error("Required HTML elements (#app or #toolbar) not found.");
  }

  const pluginIds = [
    ...Object.keys(pluginConfig),
    ...Object.keys(corePluginConfig),
  ];
  await pluginManager.loadAndRegisterPlugins(pluginIds);

  pluginManager.setAppDependencies({
    dockviewApi: null as any,
    dockviewController: null,
  });

  let dockviewController: any;
  let dockviewApi: DockviewApi | undefined;

  try {
    const result: any = await pluginManager.execute("dockview:initialize", {
      appElement,
    });

    if (
      result &&
      typeof result === "object" &&
      "controller" in result &&
      "api" in result
    ) {
      dockviewController = result.controller;
      dockviewApi = result.api;
    } else {
      const message =
        result && typeof result === "object" && "message" in result
          ? result.message
          : "Unknown error or unexpected result structure from dockview:initialize";
      console.error(
        "[App] Failed to initialize Dockview via plugin function:",
        message,
        result,
      );
      throw new Error(`Dockview initialization failed: ${message}`);
    }
  } catch (error) {
    console.error("[App] Error calling dockview:initialize function:", error);
    throw error;
  }

  if (!dockviewController || !dockviewApi) {
    console.error(
      "[App] Dockview controller or API is invalid after initialization attempt.",
    );
    return;
  }
  pluginManager.setAppDependencies({
    dockviewApi: dockviewApi,
    dockviewController: dockviewController,
  });

  appContext.dockviewController = dockviewController;

  try {
    await pluginManager.execute("toolbar:initialize", {
      targetElement: toolbarElement,
    });
  } catch (error) {
    console.error(
      "[App] Unhandled error during toolbar initialization:",
      error,
    );
    // Depending on the desired behavior, you might want to re-throw or
    // display a more user-friendly error message.
    return; // Stop execution if toolbar fails
  }

  const modalManager = pluginManager.getManagerInstance<any>("modal-manager");

  if (!modalManager) {
    console.error(
      "[App] Failed to get ModalManager instance from plugin manager.",
    );
    return;
  } else {
    if (typeof modalManager.initialize === "function") {
      modalManager.initialize(dockviewController);
    } else {
      console.error(
        "[App] ModalManager instance from plugin system does not have an initialize method.",
      );
      return;
    }
  }

  appContext.modalManager = modalManager;

  // Initialize the tour controller and prompt if needed.
  try {
    await pluginManager.execute("tour:initialize");
  } catch (error) {
    console.error("[App] Failed to initialize tour controller:", error);
  }

  await pluginManager.execute("system-controls:initialize");

  const plugins = pluginManager.getPlugins();
  plugins.forEach((plugin: TeskooanoPlugin) => {
    plugin.panels?.forEach((panelConfig: PanelConfig) => {
      const PanelComponentOrConstructor = panelConfig.panelClass;
      const componentName = panelConfig.componentName;

      if (PanelComponentOrConstructor) {
        const isCustomElementConstructor =
          PanelComponentOrConstructor.prototype instanceof HTMLElement;

        if (isCustomElementConstructor) {
          class CustomElementPanelWrapper implements IContentRenderer {
            private _element: HTMLElement;
            private _params: PanelInitParameters | undefined;

            get element(): HTMLElement {
              return this._element;
            }

            constructor() {
              this._element = document.createElement(componentName);
            }

            init(params: PanelInitParameters): void {
              this._params = params;
              if (typeof (this._element as any).init === "function") {
                (this._element as any).init(params);
              }
            }
          }
          dockviewController.registerComponent(
            componentName,
            CustomElementPanelWrapper,
          );
        } else {
          try {
            dockviewController.registerComponent(
              componentName,
              PanelComponentOrConstructor as new () => IContentRenderer,
            );
          } catch (e) {
            console.error(
              `[App] Error registering panel '${componentName}' directly:`,
              e,
            );
          }
        }
      } else {
        console.error(
          `Panel class not found for ${componentName} in plugin ${plugin.id}`,
        );
      }
    });
  });

  try {
    await pluginManager.execute("view:addCompositeEnginePanel");
  } catch (error) {
    console.error(
      "[App] Error calling view:addCompositeEnginePanel function:",
      error,
    );
  }

  setupEventListeners();

  console.log("🪐 Teskooano Initialized.");
}

function setupEventListeners() {
  document.addEventListener("engine-focus-request", (event: Event) => {
    const focusEvent = event as CustomEvent<{
      targetPanelId: string;
      objectId: string | null;
      distance?: number;
    }>;
    const { objectId } = focusEvent.detail;
    if (objectId) {
      const objects = getCelestialObjects();
      const selectedObject = objects[objectId];
      if (selectedObject && selectedObject.name) {
        try {
          pluginManager.execute("tour:setCelestialFocus", {
            celestialName: selectedObject.name,
          });
        } catch (error) {
          console.error("[App] Error calling tour:setCelestialFocus:", error);
        }
      } else {
        console.warn(`[App] Could not find object or name for ID: ${objectId}`);
      }
    }
  });

  document.body.addEventListener("start-tour-request", () => {
    try {
      pluginManager.execute("tour:restart");
    } catch (error) {
      console.error("[App] Error calling tour:restart:", error);
    }
  });
}

initializeApp().catch((err) => {
  console.error("[App] Unhandled error during application startup:", err);
});
