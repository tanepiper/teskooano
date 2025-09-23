import { AlgorithmType, IntegratorType } from "@teskooano/data-types";
import { NBodySettingsController, type INBodySettingsElements } from "../controller/NBodySettingsController";

const template = document.createElement("template");

const ALGORITHM_OPTIONS: { value: AlgorithmType; label: string }[] = [
  { value: AlgorithmType.BARNES_HUT, label: "Barnes-Hut" },
  { value: AlgorithmType.FMM, label: "Fast Multipole (FMM)" },
  { value: AlgorithmType.P3M, label: "Particle-Mesh (P3M)" },
  { value: AlgorithmType.TREE_PM, label: "Tree-Particle-Mesh" },
];

const INTEGRATOR_OPTIONS: { value: IntegratorType; label: string }[] = [
  { value: IntegratorType.EULER, label: "Euler" },
  { value: IntegratorType.SYMPLECTIC, label: "Symplectic Euler" },
  { value: IntegratorType.VERLET, label: "Velocity Verlet" },
  { value: IntegratorType.RK4, label: "Runge-Kutta 4 (RK4)" },
  { value: IntegratorType.ADAPTIVE, label: "Adaptive RK45" },
  { value: IntegratorType.YOSHIDA4, label: "Yoshida 4th Order" },
  { value: IntegratorType.FOREST_RUTH, label: "Forest-Ruth 4th" },
  { value: IntegratorType.PEFRL, label: "PEFRL 4th Order" },
  { value: IntegratorType.LEAPFROG, label: "Leapfrog" },
];

// Generate options HTML
const allAlgorithms = ALGORITHM_OPTIONS.map(
  (alg: { value: string; label: string }) =>
    `<option value="${alg.value}">${alg.label}</option>`,
).join("");

const allIntegrators = INTEGRATOR_OPTIONS.map(
  (int: { value: string; label: string }) =>
    `<option value="${int.value}">${int.label}</option>`,
).join("");

template.innerHTML = `
<style>
  :host {
    display: block;
  }

  #nbody-specific-controls {
    display: none; /* Hidden by default */
    flex-direction: column;
    gap: var(--space-md, 16px);
    padding-top: var(--space-md, 16px);
    border-top: 1px solid var(--color-border, #444);
  }

  #nbody-specific-controls.visible {
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
  
  #config-display {
    background-color: var(--color-background-inset, #1c1c1c);
    padding: var(--space-sm, 12px);
    border-radius: var(--border-radius-sm, 4px);
    font-family: var(--font-family-mono, monospace);
    font-size: var(--font-size-xs, 12px);
    color: var(--color-text-accent, #88ddff);
    margin-top: var(--space-sm, 12px);
  }
  
  #mode-performance-display {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-xs, 12px);
    color: var(--color-text-secondary, #aaa);
    margin-top: var(--space-sm, 12px);
  }
  
  #performance-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--color-status-neutral, #888);
  }
  
  #validation-messages {
    background-color: rgba(255, 0, 0, 0.1);
    border: 1px solid var(--color-status-danger, #f00);
    border-radius: var(--border-radius-sm, 4px);
    padding: var(--space-sm, 12px);
    color: var(--color-text-danger, #ff8a8a);
    font-size: var(--font-size-xs, 12px);
    display: none; /* Hidden by default */
  }
</style>

<!-- N-Body Specific Controls -->
<div id="nbody-specific-controls">
  <div class="form-group">
    <label for="setting-algorithm">Force Algorithm</label>
    <select id="setting-algorithm">${allAlgorithms}</select>
  </div>
  <div class="form-group">
    <label for="setting-integrator">Integrator</label>
    <select id="setting-integrator">${allIntegrators}</select>
  </div>
</div>

<!-- Dynamic Displays -->
<div id="config-display">n-body (tree-pm + pefrl)</div>
<div id="mode-performance-display">
  <span id="performance-dot"></span>
  <span id="performance-text">Optimal</span>
</div>
<div id="validation-messages"></div>
`;

/**
 * N-Body specific settings component that handles algorithm and integrator selection.
 * This component is conditionally displayed when N-Body mode is selected.
 */
export class NBodySettingsComponent extends HTMLElement {
  public static readonly componentName = "teskooano-nbody-settings";

  private controller: NBodySettingsController | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  /**
   * Initializes the component with a parent controller reference.
   */
  public initialize(parentController: {
    showValidationMessage: (message: string, type?: "error" | "warning") => void;
    clearValidationMessages: () => void;
  }): void {
    const elements: INBodySettingsElements = {
      nbodyControlsElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#nbody-specific-controls"
      )!,
      algorithmSelectElement: this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-algorithm"
      )!,
      integratorSelectElement: this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-integrator"
      )!,
      configDisplayElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#config-display"
      )!,
      modePerformanceElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#mode-performance-display"
      )!,
      performanceDotElement: this.shadowRoot!.querySelector<HTMLSpanElement>(
        "#performance-dot"
      )!,
      performanceTextElement: this.shadowRoot!.querySelector<HTMLSpanElement>(
        "#performance-text"
      )!,
      validationMessagesElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#validation-messages"
      )!,
    };

    if (Object.values(elements).some((el) => !el)) {
      console.error(
        "[NBodySettingsComponent] Failed to find essential elements in template!"
      );
      return;
    }

    this.controller = new NBodySettingsController(elements, parentController);
  }

  /**
   * Updates the N-Body controls based on current state.
   */
  public updateNBodyControls(): void {
    this.controller?.updateNBodyControls();
  }

  /**
   * Updates the visibility of N-Body controls.
   */
  public updateNBodyVisibility(): void {
    this.controller?.updateNBodyVisibility();
  }

  /**
   * Cleans up the controller when the component is removed.
   */
  public disconnectedCallback(): void {
    this.controller?.dispose();
    this.controller = null;
  }
}

customElements.define(NBodySettingsComponent.componentName, NBodySettingsComponent);
