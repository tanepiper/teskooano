import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";
import "./vite-env.d";

import { celestialObjectsStore } from "@teskooano/core-state";

import { TeskooanoTourModal } from "./core/tours/TourModal";
import { DockviewController } from "./core/controllers/dockview/DockviewController";
import { ToolbarController } from "./core/controllers/toolbar/ToolbarController";
import { layoutOrientationStore, Orientation } from "./core/stores/layoutStore";

import {
  getFunctionConfig,
  getLoadedModuleClass,
  getPlugins,
  loadAndRegisterComponents,
  loadAndRegisterPlugins,
  PanelConfig,
  TeskooanoPlugin,
  setAppDependencies,
} from "@teskooano/ui-plugin";

import { componentConfig as coreComponentConfig } from "./core";

import { componentConfig } from "./config/componentRegistry";
import { pluginConfig } from "./config/pluginRegistry";

import { IContentRenderer, PanelInitParameters } from "dockview-core";

// --- Centralized instance store (Example) ---
// You could use Nanostores or a simple exported object
interface AppContext {
  modalManager?: any; // Use the actual ModalManager type here
  // other shared instances...
}
export const appContext: AppContext = {}; // Export this for other modules

// --- Application Initialization --- //

async function startApp() {
  console.log("🔭 Initializing Teskooano...");
  const componentTags = Object.keys(coreComponentConfig);
  try {
    await loadAndRegisterComponents(componentTags);

    initializeApp();
  } catch (error) {
    console.error(
      "[App] Failed during critical component loading or initialization:",
      error,
    );
  }
}

async function initializeApp() {
  const appElement = document.getElementById("app");
  const toolbarElement = document.getElementById("toolbar");

  if (!appElement || !toolbarElement) {
    throw new Error("Required HTML elements (#app or #toolbar) not found.");
  }
  const componentTags = Object.keys(componentConfig);
  await loadAndRegisterComponents(componentTags);

  const pluginIds = Object.keys(pluginConfig);
  await loadAndRegisterPlugins(pluginIds);

  const dockviewController = new DockviewController(appElement);

  const toolbarController = new ToolbarController(
    toolbarElement,
    dockviewController,
  );

  const ModalManagerClass = getLoadedModuleClass("teskooano-modal-manager");
  if (!ModalManagerClass) {
    console.error(
      "[App] Failed to get TeskooanoModalManager class after loading.",
    );

    return;
  }
  const modalManager = new ModalManagerClass(dockviewController);

  setAppDependencies({
    dockviewApi: dockviewController.api,
    dockviewController: dockviewController,
  });

  appContext.modalManager = modalManager;

  TeskooanoTourModal.setModalManager(modalManager);

  console.log("Registering Dockview panel components...");

  const plugins = getPlugins();
  plugins.forEach((plugin: TeskooanoPlugin) => {
    plugin.panels?.forEach((panelConfig: PanelConfig) => {
      // Assume panelClass might be a Custom Element constructor OR an IContentRenderer
      const PanelComponentOrConstructor = panelConfig.panelClass;
      const componentName = panelConfig.componentName;

      if (PanelComponentOrConstructor) {
        // Check if it looks like a Custom Element constructor (extends HTMLElement)
        // This is a heuristic, might need refinement
        const isCustomElementConstructor =
          PanelComponentOrConstructor.prototype instanceof HTMLElement;

        if (isCustomElementConstructor) {
          console.log(
            `[App] Registering panel '${componentName}' as Custom Element via wrapper.`,
          );
          // Create a simple IContentRenderer wrapper dynamically
          class CustomElementPanelWrapper implements IContentRenderer {
            private _element: HTMLElement;
            private _params: PanelInitParameters | undefined;

            get element(): HTMLElement {
              return this._element;
            }

            constructor() {
              // Create the custom element using the componentName as the tag
              // This REQUIRES the componentName to match the customElements.define() tag
              console.log(
                `[CustomElementPanelWrapper] Constructor running for component: ${componentName}`,
              );
              this._element = document.createElement(componentName);
              console.log(
                `[CustomElementPanelWrapper] Created element:`,
                this._element,
              );
            }

            init(params: PanelInitParameters): void {
              this._params = params;
              console.log(
                `[CustomElementPanelWrapper] Init running for element:`,
                this._element,
              );
              // Pass params to the custom element if it has a specific method
              if (typeof (this._element as any).init === "function") {
                console.log(
                  `[CustomElementPanelWrapper] Calling init() on element...`,
                );
                (this._element as any).init(params);
              } else {
                console.log(
                  `[CustomElementPanelWrapper] Element does not have an init() method.`,
                );
              }
            }

            // Optional: Add dispose, update, focus methods if needed
            // dispose?(): void {
            //   if (typeof (this._element as any).dispose === 'function') {
            //     (this._element as any).dispose();
            //   }
            // }
          }

          // Register the WRAPPER class
          dockviewController.registerComponent(
            componentName,
            CustomElementPanelWrapper,
          );
        } else {
          // Assume it's already a valid IContentRenderer constructor
          console.log(
            `[App] Registering panel '${componentName}' directly as IContentRenderer.`,
          );
          try {
            dockviewController.registerComponent(
              componentName,
              PanelComponentOrConstructor as new () => IContentRenderer, // Cast needed
            );
          } catch (e) {
            console.error(
              `[App] Error registering panel '${componentName}' directly. Is it a valid IContentRenderer constructor?`,
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

  console.log("Dockview panel registration complete.");

  // Ensure at least one engine panel is created on startup via the plugin function
  const addPanelFunc = getFunctionConfig("engine:add_composite_panel");
  if (addPanelFunc?.execute) {
    console.log("[App] Calling engine:add_composite_panel for initial view...");
    addPanelFunc.execute();
  } else {
    console.error(
      "[App] Failed to find engine:add_composite_panel function during initialization!",
    );
  }

  setupEventListeners();

  console.log("🪐 Teskooano Initialized.");
}

function setupEventListeners() {
  const portraitMediaQuery = window.matchMedia("(orientation: portrait)");
  const narrowWidthMediaQuery = window.matchMedia("(max-width: 1024px)");
  function updateOrientation() {
    const isPortraitMode =
      portraitMediaQuery.matches || narrowWidthMediaQuery.matches;
    const newOrientation: Orientation = isPortraitMode
      ? "portrait"
      : "landscape";
    layoutOrientationStore.set(newOrientation);
  }
  updateOrientation(); // Initial check
  portraitMediaQuery.addEventListener("change", updateOrientation);
  narrowWidthMediaQuery.addEventListener("change", updateOrientation);
  window.addEventListener("resize", updateOrientation);

  // Focus changes listener
  document.addEventListener("engine-focus-request", (event: Event) => {
    const focusEvent = event as CustomEvent<{
      targetPanelId: string;
      objectId: string | null;
      distance?: number;
    }>;
    const { objectId } = focusEvent.detail;
    if (objectId) {
      const objects = celestialObjectsStore.get();
      const selectedObject = objects[objectId];
      // tourController.setCurrentSelectedCelestial(selectedObject?.name);
      const func = getFunctionConfig("tour:setCelestialFocus"); // Hypothetical function ID
      if (func?.execute) {
        func.execute({ celestialName: selectedObject?.name });
      } else {
        // console.warn("Function tour:setCelestialFocus not found");
      }
    } else {
      // tourController.setCurrentSelectedCelestial(undefined);
    }
  });

  // Listener for Start Tour Requests from Placeholders
  document.body.addEventListener("start-tour-request", () => {
    // Use plugin function
    const restartFunc = getFunctionConfig("tour:restart");
    if (restartFunc?.execute) {
      restartFunc.execute();
    } else {
      console.warn("Function tour:restart not found for start-tour-request");
    }
  });
}

// --- Start the App --- //
startApp();
