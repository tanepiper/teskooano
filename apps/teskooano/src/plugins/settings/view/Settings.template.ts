import { SimulationMode } from "@teskooano/data-types";

const template = document.createElement("template");

const SIMULATION_MODE_OPTIONS: {
  value: SimulationMode;
  label: string;
}[] = [
  { value: SimulationMode.NBODY, label: "N-Body (Full Physics)" },
  { value: SimulationMode.IDEAL, label: "Ideal (Keplerian)" },
];

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


  #current-mode-badge {
    background-color: var(--color-primary, #337ab7);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: var(--font-size-xs, 12px);
    text-transform: uppercase;
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

  .help-text {
    font-size: var(--font-size-xs, 0.8em);
    color: var(--color-text-secondary, #aaa);
    margin-top: var(--space-xxs, 2px);
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
      <span class="help-text">Choose between N-Body (unstable) or Ideal (stable) physics - in N-Body mode, you can adjust the algorithm and integrator,
      in Ideal mode, celestial bodies follow perfect orbital mechanics.</span>
    </div>
    
    <!-- N-Body Specific Controls Component -->
    <teskooano-nbody-settings></teskooano-nbody-settings>
    
    <div id="validation-messages"></div>
  </div>

  <!-- Visuals Section -->
  <div class="form-section">
    <h3>Visuals & Performance</h3>
    <div class="form-group">
      <label for="setting-trail-length">Trail Length Multiplier <span class="value-display"></span></label>
      <teskooano-slider id="setting-trail-length" min="0" max="300" value="100" step="10">
        <span slot="help-text">Sets the multiplier for the length of orbital trails behind moving objects (the base length is 10000 points). Set to 0 to disable trails.</span>
      </teskooano-slider>
    </div>
    <div class="form-group">
      <label for="setting-performance-profile">Performance Profile</label>
      <select id="setting-performance-profile">
        <option value="low">Low (Power Saving)</option>
        <option value="medium">Medium (Balanced)</option>
        <option value="high" selected>High (Performance)</option>
        <option value="cosmic">Cosmic (Max Quality)</option>
      </select>
      <span class="help-text">Adjusts rendering quality vs performance. Higher settings increase visuals but use more resources, this will be auto-selected based on your device tier.</span>
    </div>
  </div>

</form>
`;

export { template };
