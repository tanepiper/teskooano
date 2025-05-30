const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: var(--spacing-md); /* 10px -> 16px */
      font-family: var(--font-family-base);
      font-size: var(--font-size-1);
      border-top: var(--border-width-thin) solid var(--color-border-subtle);
    }
    .setting-row {
      display: flex;
      justify-content: space-between; /* This will space out the label (inside toggle) and the switch part */
      align-items: center;
      margin-bottom: var(--space-3); /* Increased margin a bit for better spacing */
    }
    .setting-row > teskooano-toggle {
      flex-grow: 1; /* Make the toggle take all available space in the row */
    }
    .setting-row + teskooano-slider,
    .setting-row + teskooano-toggle {
        /* This might not be needed if margin-bottom on .setting-row is enough */
        /* margin-top: var(--space-3); */ 
    }

    /* Removed custom label styling as toggle handles its own label */

    teskooano-slider {
      margin-top: var(--space-3); /* Add some space above the slider */
      margin-bottom: var(--space-3);
    }
    .error-message {
        color: var(--color-error);
        font-style: italic;
        margin-top: var(--space-3);
    }
  </style>
  <div class="setting-row">
    <teskooano-toggle label="Show Grid" id="grid-toggle"></teskooano-toggle>
  </div>
  <div class="setting-row">
    <teskooano-toggle label="Show Celestial Labels" id="labels-toggle"></teskooano-toggle>
  </div>
  <div class="setting-row">
    <teskooano-toggle label="Show AU Markers" id="au-markers-toggle"></teskooano-toggle>
  </div>
  <div class="setting-row">
    <teskooano-toggle label="Show Debris Effects" id="debris-effects-toggle"></teskooano-toggle>
  </div>
  <div class="setting-row">
    <teskooano-toggle label="Show Orbit Lines" id="orbit-lines-toggle"></teskooano-toggle>
  </div>
  <div class="setting-row">
    <teskooano-toggle label="Debug Mode" id="debug-mode-toggle"></teskooano-toggle>
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
