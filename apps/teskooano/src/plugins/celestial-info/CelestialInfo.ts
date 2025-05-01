import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import { celestialObjectsStore } from "@teskooano/core-state";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";

import { CelestialInfoComponent } from "./utils/CelestialInfoInterface";
import { FormatUtils } from "./utils/formatters";

import { AsteroidFieldInfoComponent } from "./bodies/AsteroidFieldInfo";
import { GasGiantInfoComponent } from "./bodies/GasGiantInfo";
import { GenericCelestialInfoComponent } from "./bodies/GenericCelestialInfo";
import { MoonInfoComponent } from "./bodies/MoonInfo";
import { OortCloudInfoComponent } from "./bodies/OortCloudInfo";
import { PlanetInfoComponent } from "./bodies/PlanetInfo";
import { StarInfoComponent } from "./bodies/StarInfo";

import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";

import { template } from "./CelestialInfo.template";

/**
 * Custom Element `celestial-info`.
 *
 * Displays detailed information about the currently selected celestial object.
 * It dynamically loads the appropriate sub-component based on the object type
 * and listens for changes in the global celestial objects store and focus events.
 *
 * Implements Dockview `IContentRenderer` to be used as a panel content.
 */
export class CelestialInfo extends HTMLElement implements IContentRenderer {
  private shadow: ShadowRoot;
  private unsubscribeObjectsStore: (() => void) | null = null;
  private currentSelectedId: string | null = null;

  private components: Map<CelestialType | "generic", CelestialInfoComponent> =
    new Map();

  private activeComponent: CelestialInfoComponent | null = null;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "celestial-info";

  /**
   * Generates the configuration required to register this panel as a toolbar button.
   *
   * @returns {PanelToolbarItemConfig} Configuration object for the UI plugin manager.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "celestial_info", // Base ID
      target: "engine-toolbar",
      iconSvg: InfoIcon,
      title: "Celestial Info",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Celestial Info",
      behaviour: "toggle",
    };
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    this.shadow.appendChild(template.content.cloneNode(true));

    this.components.set(CelestialType.STAR, new StarInfoComponent());
    this.components.set(CelestialType.PLANET, new PlanetInfoComponent());
    this.components.set(CelestialType.DWARF_PLANET, new PlanetInfoComponent()); // Re-use Planet component
    this.components.set(CelestialType.MOON, new MoonInfoComponent());
    this.components.set(CelestialType.GAS_GIANT, new GasGiantInfoComponent());
    this.components.set(
      CelestialType.ASTEROID_FIELD,
      new AsteroidFieldInfoComponent(),
    );
    this.components.set(CelestialType.OORT_CLOUD, new OortCloudInfoComponent());
    this.components.set("generic", new GenericCelestialInfoComponent());

    this.activeComponent = this.components.get("generic")!;

    const container = this.shadow.querySelector(".container") as HTMLElement;
    if (container) {
      this.components.forEach((component) => {
        component.style.display = "none"; // Hide initially
        container.appendChild(component);
      });
    }
  }

  init(parameters: GroupPanelPartInitParameters): void {
    const params = (parameters.params as { focusedObjectId?: string }) || {};
    if (params.focusedObjectId) {
      this.handleSelectionChange(params.focusedObjectId);
    }
  }

  get element(): HTMLElement {
    return this;
  }

  connectedCallback() {
    this.setupObjectListener();

    document.addEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    document.addEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated, // Use bound handler
    );
  }

  disconnectedCallback() {
    this.unsubscribeObjectsStore?.();
    this.unsubscribeObjectsStore = null;

    document.removeEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    // REMOVE LISTENER FOR FOCUS REQUESTS
    document.removeEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated, // Use bound handler
    );
  }

  private handleRendererFocusChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{
      focusedObjectId: string | null;
    }>;
    if (customEvent.detail) {
      if (this.currentSelectedId !== customEvent.detail.focusedObjectId) {
        this.handleSelectionChange(customEvent.detail.focusedObjectId);
      }
    }
  };

  private handleFocusRequestInitiated = (event: Event): void => {
    const customEvent = event as CustomEvent<{ objectId: string | null }>;
    if (customEvent.detail && customEvent.detail.objectId) {
      if (this.currentSelectedId !== customEvent.detail.objectId) {
        this.handleSelectionChange(customEvent.detail.objectId);
      }
    } else {
      console.warn("[CelestialInfo] Received focus request with no objectId.");
    }
  };

  private setupObjectListener() {
    this.unsubscribeObjectsStore = celestialObjectsStore.subscribe(
      (allCelestials) => {
        if (this.currentSelectedId) {
          const currentObject = allCelestials[this.currentSelectedId];
          if (
            currentObject &&
            currentObject.status !== CelestialStatus.DESTROYED
          ) {
            this.renderInfo(currentObject);
          } else if (!currentObject) {
            this.showPlaceholder("Selected object data not found.");
            this.currentSelectedId = null; // Clear selection
          } else {
            this.showPlaceholder(
              `Object '${currentObject.name}' has been destroyed.`,
            );
            this.currentSelectedId = null; // Clear selection
          }
        }
      },
    );
  }

  private handleSelectionChange(selectedId: string | null) {
    if (selectedId === this.currentSelectedId) return; // No change

    this.currentSelectedId = selectedId;

    if (!selectedId) {
      this.showPlaceholder("Select a celestial object...");
      return;
    }

    const allCelestials = celestialObjectsStore.get();
    const celestialData = allCelestials[selectedId];

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed.`,
        );
        if (this.activeComponent) {
          this.activeComponent.style.display = "none";
        }
        this.activeComponent = null;
      } else {
        this.renderInfo(celestialData);
      }
    } else {
      this.showPlaceholder("Selected object data not found.");
      if (this.activeComponent) {
        this.activeComponent.style.display = "none";
      }
      this.activeComponent = null;
    }
  }

  private showPlaceholder(message: string) {
    if (this.activeComponent) {
      this.activeComponent.style.display = "none";
      this.activeComponent = null; // Clear active component reference
    }

    const placeholder = this.shadow.querySelector(
      ".placeholder",
    ) as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "block";
      placeholder.textContent = message;
    }
  }

  private renderInfo(celestial: CelestialObject) {
    const placeholder = this.shadow.querySelector(
      ".placeholder",
    ) as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "none";
    }

    let componentType: CelestialType | "generic" = "generic";
    if (this.components.has(celestial.type)) {
      componentType = celestial.type;
    } else if (celestial.type === CelestialType.DWARF_PLANET) {
      componentType = CelestialType.PLANET;
    }

    const newActiveComponent = this.components.get(componentType);

    if (!newActiveComponent) {
      console.error(
        `[CelestialInfo] Could not find component for type: ${componentType}`,
      );
      this.showPlaceholder("Error displaying object info.");
      return;
    }

    if (this.activeComponent !== newActiveComponent) {
      if (this.activeComponent) {
        this.activeComponent.style.display = "none";
      }
      newActiveComponent.style.display = "block";
      this.activeComponent = newActiveComponent;
    }

    this.activeComponent.updateData(celestial);
  }
}

customElements.define("celestial-info", CelestialInfo);

export { FormatUtils };
