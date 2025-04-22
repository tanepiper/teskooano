import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";
import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";

// Define the structure for the custom event detail
export interface ToolbarButtonClickDetail {
  panelId: string;
  componentType: string;
  behaviour: "toggle" | "create";
  panelTitle: string;
}

/**
 * Represents the overlay toolbar for the engine view.
 * Creates buttons and emits a 'toolbar-button-click' event when a button is clicked.
 */
export class EngineToolbar {
  private readonly _element: HTMLElement;
  private readonly _apiId: string; // ID of the parent panel for unique button IDs

  /**
   * The root HTML element for the toolbar.
   */
  get element(): HTMLElement {
    return this._element;
  }

  constructor(apiId: string) {
    this._apiId = apiId; // Store the parent panel's API ID

    this._element = document.createElement("div");
    this._element.classList.add("engine-overlay-toolbar");
    // Basic styling - adjust as needed
    this._element.style.position = "absolute";
    this._element.style.top = "5px";
    this._element.style.left = "5px";
    this._element.style.zIndex = "10";
    this._element.style.display = "flex";
    this._element.style.gap = "4px";
    this._element.style.padding = "4px";
    this._element.style.backgroundColor = "rgba(40, 40, 60, 0.7)";
    this._element.style.borderRadius = "4px";

    this.injectStyles();
    this.initializeButtons();
  }

  /** Inject CSS for toolbar button icons */
  private injectStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .engine-overlay-toolbar teskooano-button {
        /* Explicitly set button color for icon inheritance */
        color: white;
      }
      .engine-overlay-toolbar teskooano-button svg {
        /* Let color inherit from host via ::slotted rule in Button.ts */
        width: 18px; /* Adjust icon size */
        height: 18px;
      }
      /* Add any other specific styles for the toolbar itself or its buttons */
    `;
    // Append to the toolbar element itself or document head if preferred
    this._element.appendChild(style); // Changed to append to element
  }

  /**
   * Creates and configures the toolbar buttons.
   */
  private initializeButtons(): void {
    this._element.innerHTML = ""; // Clear existing buttons (needed if re-initializing)

    const buttons = [
      {
        id: "engine_settings",
        iconSvg: SettingsIcon,
        title: "Engine Settings",
        panelId: `engine_settings_${this._apiId}`, // Use stored apiId
        component: "engine-ui-settings-panel",
        behaviour: "toggle" as const,
      },
      {
        id: "focus",
        iconSvg: TargetIcon,
        title: "Focus Control",
        panelId: `focus_${this._apiId}`, // Use stored apiId
        component: "focus-control",
        behaviour: "toggle" as const,
      },
      {
        id: "renderer_info",
        iconSvg: DataUsageIcon,
        title: "Renderer Info",
        panelId: `renderer_info_${this._apiId}`, // Use stored apiId
        component: "renderer-info-display",
        behaviour: "toggle" as const,
      },
      {
        id: "celestial_info",
        iconSvg: InfoIcon,
        title: "Celestial Info",
        panelId: `celestial_info_${this._apiId}`, // Use stored apiId
        component: "celestial-info",
        behaviour: "toggle" as const,
      },
      // Add more buttons here
    ];

    buttons.forEach((config) => {
      const button = document.createElement("teskooano-button");
      button.id = `engine-toolbar-button-${config.id}-${this._apiId}`; // Ensure unique ID across panels
      button.title = config.title;
      button.setAttribute("variant", "icon"); // Use icon variant if available
      button.setAttribute("size", "small"); // Use small size if available
      button.style.fill = "white";

      const iconSpan = document.createElement("span");
      iconSpan.slot = "icon";
      iconSpan.innerHTML = config.iconSvg;
      button.appendChild(iconSpan);

      button.addEventListener("click", () => {
        const detail: ToolbarButtonClickDetail = {
          panelId: config.panelId,
          componentType: config.component,
          behaviour: config.behaviour,
          panelTitle: config.title,
        };
        // Dispatch custom event from the toolbar element
        this._element.dispatchEvent(
          new CustomEvent<ToolbarButtonClickDetail>("toolbar-button-click", {
            detail: detail,
            bubbles: true, // Allow event to bubble up
            composed: true, // Allow event to cross shadow DOM boundaries
          }),
        );
      });

      this._element.appendChild(button);
    });
  }

  /**
   * Cleans up event listeners or other resources if necessary.
   * Currently, event listeners are on the buttons which are removed when
   * initializeButtons clears the innerHTML, so explicit cleanup might not be needed.
   */
  public dispose(): void {
    // Clear content to remove buttons and listeners
    this._element.innerHTML = "";
    console.log(`EngineToolbar for ${this._apiId} disposed.`);
  }
}
