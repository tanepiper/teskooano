import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
// Import ONLY the definitions needed by this component itself
import "../shared/CollapsibleSection";
// REMOVE import of specific content components like SeedForm
// import '../engine/SeedForm';
import {
  layoutOrientationStore,
  Orientation,
} from "../../core/stores/layoutStore"; // Import layout store

// --- Define the expected structure for panel parameters ---
interface UiPanelSectionConfig {
  id: string; // Unique ID for the section (optional, but good practice)
  title: string;
  class: string;
  componentTag: string; // The HTML tag of the web component to render (e.g., 'seed-form')
  startClosed?: boolean;
}

interface UiPanelParams {
  engineViewId?: string; // Add optional engineViewId
  sections?: UiPanelSectionConfig[];
}
// --- End Parameter Definition ---

/**
 * A generic Dockview panel that hosts configurable, collapsible UI sections.
 */
export class UiPanel implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _params:
    | (GroupPanelPartInitParameters & { params?: UiPanelParams })
    | undefined;
  private _api: DockviewPanelApi | undefined;
  private _engineViewId: string | null = null;
  // --- View Orientation Handling ---
  private _layoutUnsubscribe: (() => void) | null = null;
  private _currentOrientation: Orientation | null = null;

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this._element.id = `ui-panel-${this._api?.id}`;
    this._element.classList.add("ui-panel");
    this._element.style.height = "100%";
    this._element.style.width = "100%";
    this._element.style.padding = "10px";
    this._element.style.boxSizing = "border-box";
    this._element.style.overflowY = "auto";

    // --- Subscribe to layout orientation changes ---
    this._layoutUnsubscribe = layoutOrientationStore.subscribe(
      (orientation) => {
        if (this._currentOrientation !== orientation) {
          this._currentOrientation = orientation;
          if (orientation === "portrait") {
            this._element.classList.remove("layout-internal-landscape");
            this._element.classList.add("layout-internal-portrait");
          } else {
            this._element.classList.remove("layout-internal-portrait");
            this._element.classList.add("layout-internal-landscape");
          }
        }
      },
    );
    // Apply initial class
    const initialOrientation = layoutOrientationStore.get();
    this._currentOrientation = initialOrientation;
    if (initialOrientation === "portrait") {
      this._element.classList.add("layout-internal-portrait");
    } else {
      this._element.classList.add("layout-internal-landscape");
    }
    // --- End layout subscription ---
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this._params = parameters as GroupPanelPartInitParameters & {
      params?: UiPanelParams;
    };
    this._api = parameters.api;
    this._engineViewId = this._params?.params?.engineViewId ?? null;
    this._element.innerHTML = "";

    // --- Create layout containers ---
    const leftContainer = document.createElement("div");
    leftContainer.classList.add("ui-panel-left-container");

    const rightContainer = document.createElement("div");
    rightContainer.classList.add("ui-panel-right-container");
    // --- End layout containers ---

    const sections = this._params?.params?.sections;
    if (!sections || sections.length === 0) {
      this._element.textContent = "No UI sections configured for this panel.";
      console.warn(
        `UiPanel [${this._api?.title}] initialized with no sections defined in params.`,
      );
      return;
    }

    sections.forEach((config: UiPanelSectionConfig) => {
      try {
        const sectionContainer = document.createElement("collapsible-section");
        sectionContainer.id = config.id;
        sectionContainer.classList.add(config.class);
        sectionContainer.setAttribute("title", config.title);
        if (config.startClosed) {
          sectionContainer.setAttribute("closed", "");
        }
        const isDefined = !!customElements.get(config.componentTag);
        if (!isDefined) {
          throw new Error(
            `Custom element <${config.componentTag}> is not defined.`,
          );
        }
        const contentComponent = document.createElement(config.componentTag);

        if (this._engineViewId) {
          contentComponent.setAttribute("engine-view-id", this._engineViewId);
        } else {
          console.warn(
            ` -> Added component <${config.componentTag}> (no engine view linked)`,
          );
        }

        // --- Sort into containers ---
        if (config.id === "focus-selector-section") {
          // Assuming this ID for the focus selector
          leftContainer.appendChild(sectionContainer);
        } else {
          rightContainer.appendChild(sectionContainer);
        }
        // --- End sorting ---

        // sectionContainer.appendChild(contentComponent); // Content is added within collapsible-section
        // this._element.appendChild(sectionContainer); // Now append containers instead
      } catch (error) {
        console.error(
          `Error creating section '${config.title}' with component <${config.componentTag}>:`,
          error,
        );
        const errorPlaceholder = document.createElement("div");
        errorPlaceholder.textContent = `Error loading section: ${config.title}`;
        errorPlaceholder.style.color = "red";
        this._element.appendChild(errorPlaceholder);
      }
    });

    // --- Append containers to the main element ---
    this._element.appendChild(leftContainer);
    this._element.appendChild(rightContainer);
    // --- End appending containers ---
  }

  dispose(): void {
    // Unsubscribe from layout changes
    if (this._layoutUnsubscribe) {
      this._layoutUnsubscribe();
      this._layoutUnsubscribe = null;
    }
  }
}
