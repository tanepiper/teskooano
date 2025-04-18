import { AddPanelOptions, DockviewApi } from "dockview-core";
import "../components/toolbar/SimulationControls"; // Import for side effect (registers element)
import "../components/toolbar/SeedForm"; // Import the new ToolbarSeedForm
import { DockviewController } from "./dockviewController";
import '../components/shared/Button.js';
import { TeskooanoButton } from '../components/shared/Button'; // Ensure type import if needed elsewhere
import { ToolbarSeedForm } from "../components/toolbar/SeedForm";

/**
 * ToolbarController is responsible for managing the toolbar and adding engine views.
 * It is initialized with a DOM element and a DockviewController.
 * It also has a counter for the number of engine views.
 * It renders the toolbar and adds the simulation controls.
 * It also adds the engine views and the corresponding engine UI panels.
 */
export class ToolbarController {
  /**
   * The DOM element that the toolbar will be added to.
   */
  private _element: HTMLElement;
  /**
   * The DockviewController that the toolbar will use to add panels.
   */
  private _dockviewController: DockviewController;
  /**
   * A counter specifically for engine views.
   */
  private _enginePanelCounter = 0; // Counter specifically for engine views

  // Define a constant for the settings panel ID
  private readonly SETTINGS_PANEL_ID = 'app_settings_panel';

  /**
   * Constructor for the ToolbarController.
   * @param element - The DOM element that the toolbar will be added to.
   * @param dockviewController - The DockviewController that the toolbar will use to add panels.
   */
  constructor(element: HTMLElement, dockviewController: DockviewController) {
    this._element = element;
    this._dockviewController = dockviewController;
    this.render();
  }

  /**
   * Adds the engine views and the corresponding engine UI panels.
   */
  private addEnginePanels(): void {
    this._enginePanelCounter++;
    const engineViewId = `engine_view_${this._enginePanelCounter}`;
    const engineUiId = `engine_ui_${this._enginePanelCounter}`;
    const engineViewTitle = `Engine View ${this._enginePanelCounter}`;
    const engineUiTitle = `Engine ${this._enginePanelCounter} UI`;

    // Find the currently active panel, or any existing panel as fallback
    let referencePanelId: string | undefined = undefined;
    const activePanel = this._dockviewController.api.activePanel;
    if (activePanel) {
      referencePanelId = activePanel.id;
    } else if (this._dockviewController.api.panels.length > 0) {
      // Fallback: Use the last panel in the list if no panel is active
      referencePanelId =
        this._dockviewController.api.panels[
          this._dockviewController.api.panels.length - 1
        ].id;
      console.log(
        `Add Panels: No active panel, using last panel '${referencePanelId}' as reference.`
      );
    }

    // Determine position for the ENGINE VIEW panel
    let enginePositionOptions: AddPanelOptions["position"] = undefined;
    if (referencePanelId) {
      // Place new engine view below the reference panel
      enginePositionOptions = {
        referencePanel: referencePanelId,
        direction: "below",
      };
    } // Else, let Dockview decide default position

    // Add Engine View Panel
    const enginePanelOptions: AddPanelOptions = {
      id: engineViewId,
      component: "engine_view",
      title: engineViewTitle,
      params: { title: engineViewTitle },
      position: enginePositionOptions,
    };

    try {
      console.log(`Adding engine panel: ${engineViewId}`);
      this._dockviewController.api.addPanel(enginePanelOptions);
    } catch (error) {
      console.error(`Failed to add engine panel ${engineViewId}:`, error);
      // Don't proceed to add UI panel if engine panel fails
      return;
    }

    // Add Corresponding Engine UI Panel
    const engineUiPanelOptions: AddPanelOptions = {
      id: engineUiId,
      component: "ui_view",
      title: engineUiTitle,
      params: {
        engineViewId: engineViewId,
        sections: [
          {
            id: `focus-section-${this._enginePanelCounter}`,
            title: "Focus Control",
            componentTag: "focus-control",
            startClosed: false,
          },
          {
            id: `celestial-info-section-${this._enginePanelCounter}`,
            title: "Selected Object",
            componentTag: "celestial-info",
            startClosed: false,
          },
          {
            id: `renderer-info-section-${this._enginePanelCounter}`,
            title: "Renderer Info",
            componentTag: "renderer-info-display",
            startClosed: false,
          },
          {
            id: `engine-settings-section-${this._enginePanelCounter}`,
            title: "View Settings",
            componentTag: "engine-ui-settings-panel",
            startClosed: false,
          },
        ],
      },
      // Position it properly, now that we don't have a global UI panel
      position: {
        referencePanel: engineViewId,
        direction: "right",
      },
      minimumWidth: 250,
      maximumWidth: 400,
    };

    try {
      console.log(`Adding engine UI panel: ${engineUiId}`);
      this._dockviewController.api.addPanel(engineUiPanelOptions);
    } catch (error) {
      console.error(`Failed to add engine UI panel ${engineUiId}:`, error);
    }
  }

  /**
   * Toggles the visibility of the floating settings panel.
   */
  private toggleSettingsPanel(): void {
    const existingPanel = this._dockviewController.api.panels.find(p => p.id === this.SETTINGS_PANEL_ID);

    if (existingPanel) {
        console.log(`Closing existing settings panel: ${this.SETTINGS_PANEL_ID}`);
        existingPanel.api.close();
    } else {
        console.log(`Adding settings panel: ${this.SETTINGS_PANEL_ID}`);
        const settingsPanelOptions: AddPanelOptions = {
            id: this.SETTINGS_PANEL_ID,
            component: 'settings_view', // Placeholder component name
            title: 'Settings',
            floating: {
                position: { top: 80, left: 80 },
                width: 450,
                height: 500,
            },
            params: {},
            // Consider making it non-closable via header x button if toggled only via toolbar
            // isClosable: false 
        };
        try {
             this._dockviewController.api.addPanel(settingsPanelOptions);
        } catch (error) {
            console.error(`Failed to add settings panel ${this.SETTINGS_PANEL_ID}:`, error);
        }
    }
  }

  private render(): void {
    // Clear existing content
    this._element.innerHTML = "";
    // Apply cosmic theme styles
    this._element.classList.add('toolbar-cosmic-background'); // Apply CSS class for background
    this._element.style.padding = "var(--space-sm, 8px)"; // Add some padding
    this._element.style.display = "flex"; // Use flexbox
    this._element.style.alignItems = "center"; // Center items vertically
    this._element.style.gap = "var(--space-md, 12px)"; // Add gap between items

    // Add Application Icon
    const appIcon = document.createElement('img');
    appIcon.src = '/assets/icon.png'; // *** Adjust this path if needed ***
    appIcon.alt = 'Teskooano App Icon';
    appIcon.title = 'Teskooano: 3D N-Body Simulation';
    appIcon.style.height = 'calc(var(--toolbar-height, 50px) * 0.7)'; // ~70% of toolbar height
    appIcon.style.width = 'auto'; // Maintain aspect ratio
    appIcon.style.verticalAlign = 'middle'; // Helps alignment
    this._element.appendChild(appIcon); // Add icon first

    // --- Add Settings Button --- 
    const settingsButton = document.createElement('teskooano-button');
    settingsButton.title = "Application Settings";
    // Add Gear Icon
    const gearIcon = document.createElement('span');
    gearIcon.slot = 'icon';
    gearIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zM8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1"/>
    </svg>`;
    settingsButton.appendChild(gearIcon);
    settingsButton.addEventListener('click', this.toggleSettingsPanel.bind(this)); // Use bind or arrow function
    this._element.appendChild(settingsButton);
    // --- End Settings Button --- 

    // Add "Add View" button
    const addButton = document.createElement("teskooano-button");

    // Create icon element
    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('slot', 'icon');
    iconSpan.textContent = '+'; // Simple plus icon
    iconSpan.style.fontWeight = 'bold'; // Make icon slightly bolder

    // Create text element (optional, could just append text node)
    const textSpan = document.createElement('span');
    textSpan.textContent = "Add Teskooano";

    // Append icon and text to the button
    addButton.appendChild(iconSpan);
    addButton.appendChild(textSpan);
    
    addButton.title = "Add a new engine view"; // Add a tooltip

    addButton.addEventListener('click', () => {
      this.addEnginePanels();
    });

    this._element.appendChild(addButton);

    // Add Separator
    const separator1 = document.createElement('div');
    separator1.style.width = '1px';
    separator1.style.height = 'calc(var(--toolbar-height, 50px) * 0.6)'; // Adjust height relative to toolbar
    separator1.style.backgroundColor = 'var(--color-border, #50506a)'; 
    separator1.style.margin = '0 var(--space-xs, 4px)'; // Small horizontal margin
    this._element.appendChild(separator1);

    // Add the simulation controls
    const simControls = document.createElement("toolbar-simulation-controls");
    this._element.appendChild(simControls);
    
    // Add Separator before seed form
    const separator2 = document.createElement('div');
    separator2.style.width = '1px';
    separator2.style.height = 'calc(var(--toolbar-height, 50px) * 0.6)'; 
    separator2.style.backgroundColor = 'var(--color-border, #50506a)'; 
    separator2.style.margin = '0 var(--space-xs, 4px)';
    this._element.appendChild(separator2);
    
    // Add the seed form
    const seedForm = document.createElement("toolbar-seed-form") as ToolbarSeedForm;
    ToolbarSeedForm.setDockviewApi(this._dockviewController.api);
    this._element.appendChild(seedForm);
  }
}
