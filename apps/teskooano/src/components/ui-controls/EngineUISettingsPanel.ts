import type { PanelViewState } from '@teskooano/core-state'; // Need the type
import { panelRegistry } from '@teskooano/core-state'; // Assuming correct path resolution
import type { EnginePanel } from '../engine/EnginePanel'; // Corrected path

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      padding: 10px;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
      border-top: 1px solid var(--color-border-alt, #5a5a7a); /* Add separator */
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    label {
      margin-right: 10px;
      color: var(--color-text-secondary, #aaa);
    }
    /* Basic toggle switch styles */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 34px;
      height: 20px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-surface-alt, #3a3a4e);
      transition: .4s;
      border-radius: 20px;
      border: 1px solid var(--color-border-alt, #5a5a7a);
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 3px;
      bottom: 3px;
      background-color: var(--color-text-secondary, #aaa);
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: var(--color-primary, #6c63ff);
      border-color: var(--color-primary, #6c63ff);
    }
    input:checked + .slider:before {
      transform: translateX(14px);
      background-color: white;
    }
    .error-message {
        color: var(--color-error, #f44336);
        font-style: italic;
        margin-top: 10px;
    }
  </style>
  <div class="setting-row">
    <label for="grid-toggle">Show Grid</label>
    <label class="toggle-switch">
      <input type="checkbox" id="grid-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="labels-toggle">Show Celestial Labels</label>
    <label class="toggle-switch">
      <input type="checkbox" id="labels-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="au-markers-toggle">Show AU Markers</label>
    <label class="toggle-switch">
      <input type="checkbox" id="au-markers-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div id="error-message" class="error-message" style="display: none;"></div>
`;

export class EngineUISettingsPanel extends HTMLElement {
  static get observedAttributes() { return ['engine-view-id']; }

  private gridToggle: HTMLInputElement | null = null;
  private labelsToggle: HTMLInputElement | null = null;
  private auMarkersToggle: HTMLInputElement | null = null;
  private errorMessageElement: HTMLElement | null = null;

  private linkedEnginePanel: EnginePanel | null = null;
  private unsubscribeLinkedPanelState: (() => void) | null = null;
  private _engineViewId: string | null = null;
  private _linkCheckInterval: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.gridToggle = this.shadowRoot!.getElementById('grid-toggle') as HTMLInputElement;
    this.labelsToggle = this.shadowRoot!.getElementById('labels-toggle') as HTMLInputElement;
    this.auMarkersToggle = this.shadowRoot!.getElementById('au-markers-toggle') as HTMLInputElement;
    this.errorMessageElement = this.shadowRoot!.getElementById('error-message');

    this.addEventListeners();

    this._engineViewId = this.getAttribute('engine-view-id');
    this.attemptLinkToEnginePanel();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    this.unsubscribeLinkedPanelState?.();
    this.linkedEnginePanel = null;
    if (this._linkCheckInterval) {
      clearInterval(this._linkCheckInterval);
      this._linkCheckInterval = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'engine-view-id' && oldValue !== newValue) {
      this._engineViewId = newValue;
      // Unsubscribe from old panel if linked
      this.unsubscribeLinkedPanelState?.();
      this.linkedEnginePanel = null;
      this.attemptLinkToEnginePanel(); // Attempt link with new ID
    }
  }

  private addEventListeners(): void {
    this.gridToggle?.addEventListener('change', this.handleGridToggleChange);
    this.labelsToggle?.addEventListener('change', this.handleLabelsToggleChange);
    this.auMarkersToggle?.addEventListener('change', this.handleAuMarkersToggleChange);
  }

  private removeEventListeners(): void {
    this.gridToggle?.removeEventListener('change', this.handleGridToggleChange);
    this.labelsToggle?.removeEventListener('change', this.handleLabelsToggleChange);
    this.auMarkersToggle?.removeEventListener('change', this.handleAuMarkersToggleChange);
  }

  // Event handlers bound to the class instance
  private handleGridToggleChange = (event: Event): void => {
    if (!this.linkedEnginePanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    // Call the method on the linked panel (we'll add this method later)
    if (typeof this.linkedEnginePanel.setShowGrid === 'function') {
        this.linkedEnginePanel.setShowGrid(isChecked);
    } else {
        console.error(`[SettingsPanel ${this._engineViewId}] linkedEnginePanel.setShowGrid is not a function!`);
        this.showError('Error communicating with engine panel.');
    }
  }

  private handleLabelsToggleChange = (event: Event): void => {
    if (!this.linkedEnginePanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    // Call the method on the linked panel (we'll add this method later)
     if (typeof this.linkedEnginePanel.setShowCelestialLabels === 'function') {
        this.linkedEnginePanel.setShowCelestialLabels(isChecked);
     } else {
         console.error(`[SettingsPanel ${this._engineViewId}] linkedEnginePanel.setShowCelestialLabels is not a function!`);
         this.showError('Error communicating with engine panel.');
     }
  }

  private handleAuMarkersToggleChange = (event: Event): void => {
    if (!this.linkedEnginePanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    // Call the method on the linked panel
    if (typeof this.linkedEnginePanel.setShowAuMarkers === 'function') {
        this.linkedEnginePanel.setShowAuMarkers(isChecked);
    } else {
        console.error(`[SettingsPanel ${this._engineViewId}] linkedEnginePanel.setShowAuMarkers is not a function!`);
        this.showError('Error communicating with engine panel.');
    }
  }

  private updateToggleState(viewState: PanelViewState): void {
    if (this.gridToggle) {
      this.gridToggle.checked = viewState.showGrid ?? true; // Default to true if undefined
    }
    if (this.labelsToggle) {
      this.labelsToggle.checked = viewState.showCelestialLabels ?? true; // Default to true if undefined
    }
    if (this.auMarkersToggle) {
      this.auMarkersToggle.checked = viewState.showAuMarkers ?? true; // Default to true if undefined
    }
  }

  private showError(message: string): void {
    if (this.errorMessageElement) {
        this.errorMessageElement.textContent = message;
        this.errorMessageElement.style.display = 'block';
    }
  }

  private clearError(): void {
     if (this.errorMessageElement) {
        this.errorMessageElement.style.display = 'none';
        this.errorMessageElement.textContent = '';
     }
  }


  private attemptLinkToEnginePanel(): void {
    if (!this._engineViewId) {
      console.warn('[SettingsPanel] Missing engine-view-id attribute.');
      this.showError('Link to engine view failed: Missing ID.');
      return;
    }

    // Clear previous interval if any
    if (this._linkCheckInterval) {
      clearInterval(this._linkCheckInterval);
      this._linkCheckInterval = null;
    }
    // Clear previous subscription
    this.unsubscribeLinkedPanelState?.();
    this.linkedEnginePanel = null;
    this.clearError(); // Clear errors on new link attempt


    const attempt = () => {
      const potentialEnginePanel = panelRegistry.getPanelInstance<EnginePanel>(this._engineViewId!);

      if (potentialEnginePanel && typeof potentialEnginePanel.subscribeToViewState === 'function') {
        this.linkedEnginePanel = potentialEnginePanel;
        this.clearError(); // Clear error on successful link

        // Subscribe to the linked panel's state
        this.unsubscribeLinkedPanelState = this.linkedEnginePanel.subscribeToViewState(viewState => {
          this.updateToggleState(viewState);
        });

        // Get initial state
        const initialState = this.linkedEnginePanel.getViewState();
        this.updateToggleState(initialState);

        // Clear the interval check once linked
        if (this._linkCheckInterval) {
          clearInterval(this._linkCheckInterval);
          this._linkCheckInterval = null;
        }
      } else {
        console.warn(`[SettingsPanel] Engine panel ${this._engineViewId} not found or not ready yet. Retrying...`);
        // Keep trying if not found immediately
        if (!this._linkCheckInterval) {
          this._linkCheckInterval = window.setInterval(attempt, 1000); // Retry every second
        }
      }
    };

    attempt(); // Initial attempt
  }
}

// Define the custom element
customElements.define('engine-ui-settings-panel', EngineUISettingsPanel);
