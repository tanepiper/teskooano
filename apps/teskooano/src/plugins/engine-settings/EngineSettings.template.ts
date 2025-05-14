const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: auto;
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
    .setting-row input[type=range] {
      flex-grow: 1;
      margin: 0 10px;
    }
    .setting-row .value-display {
      min-width: 30px; /* Ensure space for value */
      text-align: right;
      color: var(--color-text-primary, #eee);
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
    /* Add margin to the slider component */
    teskooano-slider {
      /* Override default margin if needed, or use existing variables */
      /* Example: margin-bottom: var(--space-sm, 8px); */
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
  <div class="setting-row">
    <label for="debris-effects-toggle">Show Debris Effects</label>
    <label class="toggle-switch">
      <input type="checkbox" id="debris-effects-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="orbit-lines-toggle">Show Orbit Lines</label>
    <label class="toggle-switch">
      <input type="checkbox" id="orbit-lines-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="debug-mode-toggle">Debug Mode</label>
    <label class="toggle-switch">
      <input type="checkbox" id="debug-mode-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <teskooano-slider 
    id="fov-slider" 
    label="FOV" 
    min="30" 
    max="140" 
    step="1" 
    value="75"
    editable-value
    help-text="Adjust the camera Field of View (degrees)"
  ></teskooano-slider>
  <div id="error-message" class="error-message" style="display: none;"></div>
`;

export { template };
