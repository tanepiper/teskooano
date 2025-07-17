import {
  AlgorithmType,
  IntegratorType,
  SimulationMode,
} from "@teskooano/core-state";

const template = document.createElement("template");

const SIMULATION_MODE_OPTIONS: {
  value: SimulationMode;
  label: string;
}[] = [
  { value: "nbody", label: "N-Body (Full Physics)" },
  { value: "ideal", label: "Ideal (Keplerian)" },
];

const ALGORITHM_OPTIONS: { value: AlgorithmType; label: string }[] = [
  { value: "barnes-hut", label: "Barnes-Hut" },
  { value: "fmm", label: "Fast Multipole (FMM)" },
  { value: "p3m", label: "Particle-Mesh (P3M)" },
  { value: "tree-pm", label: "Tree-Particle-Mesh" },
];

const INTEGRATOR_OPTIONS: { value: IntegratorType; label: string }[] = [
  { value: "euler", label: "Euler" },
  { value: "symplectic", label: "Symplectic Euler" },
  { value: "verlet", label: "Velocity Verlet" },
  { value: "rk4", label: "Runge-Kutta 4 (RK4)" },
  { value: "adaptive", label: "Adaptive RK45" },
  { value: "yoshida4", label: "Yoshida 4th Order" },
  { value: "forest-ruth", label: "Forest-Ruth 4th" },
  { value: "pefrl", label: "PEFRL 4th Order" },
  { value: "leapfrog", label: "Leapfrog" },
];

// Full list of algorithms and integrators for the UI
const allAlgorithms = ALGORITHM_OPTIONS.map(
  (alg: { value: string; label: string }) =>
    `<option value="${alg.value}">${alg.label}</option>`,
).join("");
const allIntegrators = INTEGRATOR_OPTIONS.map(
  (int: { value: string; label: string }) =>
    `<option value="${int.value}">${int.label}</option>`,
).join("");
const allModes = SIMULATION_MODE_OPTIONS.map(
  (mode: { value: string; label: string }) =>
    `<option value="${mode.value}">${mode.label}</option>`,
).join("");

template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--font-family-sans, sans-serif);
    font-size: var(--font-size-sm, 14px);
    color: var(--color-text-primary, #eee);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 24px);
  }

  .form-section {
    border: 1px solid var(--color-border, #444);
    border-radius: var(--border-radius-md, 8px);
    padding: var(--space-md, 16px);
  }
  
  .form-section h3 {
    margin: 0 0 var(--space-md, 16px) 0;
    font-size: var(--font-size-md, 16px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-text-secondary, #ccc);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  label {
    font-weight: var(--font-weight-bold, 600);
  }

  select, input {
    width: 100%;
    padding: var(--space-xs, 8px);
    border-radius: var(--border-radius-sm, 4px);
    background-color: var(--color-background-input, #2a2a2a);
    color: var(--color-text-primary, #eee);
    border: 1px solid var(--color-border, #444);
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

  #current-mode-badge {
    background-color: var(--color-primary, #337ab7);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: var(--font-size-xs, 12px);
    text-transform: uppercase;
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

<form id="settings-form" novalidate>

  <!-- Simulation Mode Section -->
  <div class="form-section">
    <h3>
      <span>Simulation Mode</span>
      <span id="current-mode-badge">N-BODY</span>
    </h3>
    <div class="form-group">
      <label for="setting-simulation-mode">Physics Model</label>
      <select id="setting-simulation-mode">
        ${allModes}
      </select>
    </div>
    
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
  </div>

  <!-- Visuals Section -->
  <div class="form-section">
    <h3>Visuals & Performance</h3>
    <div class="form-group">
      <label for="setting-trail-length">Trail Length</label>
      <teskooano-slider id="setting-trail-length" min="0" max="1000" value="150" step="10"></teskooano-slider>
    </div>
    <div class="form-group">
      <label for="setting-performance-profile">Performance Profile</label>
      <select id="setting-performance-profile">
        <option value="low">Low (Power Saving)</option>
        <option value="medium">Medium (Balanced)</option>
        <option value="high" selected>High (Performance)</option>
        <option value="cosmic">Cosmic (Max Quality)</option>
      </select>
    </div>
  </div>

</form>
`;

export { template };
