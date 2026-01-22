import {
  KeplerianSettingsController,
  type IKeplerianSettingsElements,
} from "../controller/KeplerianSettingsController";

const template = document.createElement("template");

template.innerHTML = `
<style>
  :host {
    display: block;
  }

  #keplerian-specific-controls {
    display: none; /* Hidden by default */
    flex-direction: column;
    gap: var(--space-md, 16px);
    padding-top: var(--space-md, 16px);
    border-top: 1px solid var(--color-border, #444);
    margin-top: var(--space-md, 16px);
  }

  #keplerian-specific-controls.visible {
    display: flex;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  label {
    font-weight: var(--font-weight-bold, 600);
  }

  select {
    width: 100%;
    padding: var(--space-xs, 8px);
    border-radius: var(--border-radius-sm, 4px);
    background-color: var(--color-background-input, #2a2a2a);
    color: var(--color-text-primary, #eee);
    border: 1px solid var(--color-border, #444);
  }

  .help-text {
    font-size: var(--font-size-xs, 0.8em);
    color: var(--color-text-secondary, #aaa);
    margin-top: var(--space-xxs, 2px);
  }
</style>

<div id="keplerian-specific-controls">
  <div class="form-group">
    <label for="setting-kepler-mode">Orbit Visualization</label>
    <select id="setting-kepler-mode">
      <option value="full">Full Orbit (Complete Path)</option>
      <option value="trail">Trail Orbit (Aged History)</option>
    </select>
    <span class="help-text">
      Choose whether to show the complete orbital path or a trailing arc that evaporates over time.
    </span>
  </div>
</div>
`;

/**
 * Keplerian specific settings component that handles orbit mode selection.
 * This component is conditionally displayed when Ideal (Kepler) mode is selected.
 */
export class KeplerianSettingsComponent extends HTMLElement {
  public static readonly componentName = "teskooano-keplerian-settings";

  private controller: KeplerianSettingsController | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  /**
   * Initializes the component with a parent controller reference.
   */
  public initialize(parentController: {
    showValidationMessage: (
      message: string,
      type?: "error" | "warning",
    ) => void;
    clearValidationMessages: () => void;
  }): void {
    const elements: IKeplerianSettingsElements = {
      keplerianControlsElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#keplerian-specific-controls",
      )!,
      orbitModeSelectElement: this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-kepler-mode",
      )!,
    };

    if (Object.values(elements).some((el) => !el)) {
      console.error(
        "[KeplerianSettingsComponent] Failed to find essential elements in template!",
      );
      return;
    }

    this.controller = new KeplerianSettingsController(
      elements,
      parentController,
    );

    // Initial visibility check
    this.updateKeplerianVisibility();
  }

  /**
   * Updates the Keplerian controls based on current state.
   */
  public updateKeplerianControls(): void {
    this.controller?.updateKeplerianControls();
  }

  /**
   * Updates the visibility of Keplerian controls.
   */
  public updateKeplerianVisibility(): void {
    this.controller?.updateKeplerianVisibility();
  }

  /**
   * Cleans up the controller when the component is removed.
   */
  public disconnectedCallback(): void {
    this.controller?.dispose();
    this.controller = null;
  }
}

customElements.define(
  KeplerianSettingsComponent.componentName,
  KeplerianSettingsComponent,
);
