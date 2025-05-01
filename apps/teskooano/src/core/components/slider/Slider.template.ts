const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: var(--space-md, 12px);
      font-family: var(--font-family, sans-serif);
      --slider-track-bg: var(--color-surface-inset, #1a1a2e);
      --slider-track-height: var(--space-xs, 4px);
      --slider-thumb-bg: var(--color-primary, #6c63ff);
      --slider-thumb-size: var(--space-lg, 16px);
      --slider-thumb-border: var(--color-border-light, #8888ff);
      --slider-value-color: var(--color-text-secondary, #aaa);
      --slider-value-width: 40px; /* Fixed width for value display */
      --slider-gap: var(--space-sm, 8px);
      --slider-number-input-width: 50px; /* Width for the number input */
      --slider-number-input-bg: var(--color-surface-inset, #1a1a2e);
      --slider-number-input-border: var(--color-border-alt, #5a5a7a);
      --slider-number-input-text: var(--color-text-primary, #eee);
    }
    .slider-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 2px);
    }
    .control-row {
        display: flex;
        align-items: center;
        gap: var(--slider-gap);
    }
    label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
    }
    input[type="range"] {
      flex-grow: 1;
      appearance: none;
      -webkit-appearance: none; 
      width: 100%; 
      height: var(--slider-track-height);
      background: var(--slider-track-bg);
      outline: none;
      border-radius: var(--slider-track-height); /* Rounded track */
      cursor: pointer;
      margin: calc(var(--slider-thumb-size) / 2) 0; /* Center thumb vertically */
    }
    /* Thumb styles - WebKit */
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: var(--slider-thumb-size);
      height: var(--slider-thumb-size);
      background: var(--slider-thumb-bg);
      border: 2px solid var(--slider-thumb-border);
      border-radius: 50%;
      cursor: pointer;
      margin-top: calc((var(--slider-thumb-size) / -2) + (var(--slider-track-height) / 2)); /* Vertical align */
    }
    /* Thumb styles - Mozilla */
    input[type="range"]::-moz-range-thumb {
      width: calc(var(--slider-thumb-size) - 4px); /* Adjust for border */
      height: calc(var(--slider-thumb-size) - 4px);
      background: var(--slider-thumb-bg);
      border: 2px solid var(--slider-thumb-border);
      border-radius: 50%;
      cursor: pointer;
    }
    /* Focus styles */
    input[type="range"]:focus::-webkit-slider-thumb {
       box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(108, 99, 255, 0.3)); 
    }
    input[type="range"]:focus::-moz-range-thumb {
       box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(108, 99, 255, 0.3)); 
    }
    /* Disabled state */
     :host([disabled]) input[type="range"] {
        opacity: 0.6;
        cursor: not-allowed;
    }
     :host([disabled]) input[type="range"]::-webkit-slider-thumb {
        background: var(--color-text-disabled, #777);
        border-color: var(--color-border-disabled, #555);
        cursor: not-allowed;
    }
     :host([disabled]) input[type="range"]::-moz-range-thumb {
        background: var(--color-text-disabled, #777);
        border-color: var(--color-border-disabled, #555);
        cursor: not-allowed;
    }

    .value-container {
        display: flex;
        align-items: center;
        min-width: var(--slider-value-width); /* Ensure container takes up space */
        justify-content: flex-end; /* Align content to the right */
    }
    .value-display {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--slider-value-color);
      min-width: var(--slider-value-width);
      text-align: right;
      font-family: var(--font-family-monospace, monospace);
    }
     :host([disabled]) .value-display {
         opacity: 0.6;
     }
     :host([disabled]) .value-input {
         opacity: 0.6;
         cursor: not-allowed;
         background-color: var(--color-surface-disabled, #444);
     }
    .value-input {
        font-size: var(--font-size-sm, 0.9em);
        color: var(--slider-number-input-text);
        background-color: var(--slider-number-input-bg);
        border: 1px solid var(--slider-number-input-border);
        border-radius: var(--border-radius-sm, 4px);
        padding: var(--space-xxs, 2px) var(--space-xs, 4px);
        text-align: right;
        width: var(--slider-number-input-width);
        box-sizing: border-box;
        font-family: var(--font-family-monospace, monospace);
        -moz-appearance: textfield; /* Firefox */
    }
    .value-input::-webkit-outer-spin-button,
    .value-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    /* Hide the non-editable value display when input is shown */
    :host([editable-value]) .value-display {
        display: none;
    }
    /* Hide the input when not editable */
    :host(:not([editable-value])) .value-input {
        display: none;
    }
    /* Style for invalid input */
    .value-input.invalid {
        border-color: var(--color-error, #f44336);
        box-shadow: 0 0 0 1px var(--color-error-alpha, rgba(244, 67, 54, 0.5));
    }

    /* Help text styles */
    .help-text-row {
        margin-top: var(--space-xxs, 2px);
    }
    .help-text {
        font-size: var(--font-size-xs, 0.8em);
        color: var(--color-text-secondary, #aaa);
        display: block;
    }
  </style>
  <div class="slider-wrapper">
    <label for="slider-input"><slot name="label">Label</slot></label>
    <div class="control-row">
        <input id="slider-input" type="range" part="input" />
        <div class="value-container">
          <span id="value-display" class="value-display" part="value" aria-live="polite"></span>
          <input id="value-input" type="number" class="value-input" part="value-input" aria-label="Current value" />
        </div>
    </div>
    <div class="help-text-row">
        <span id="help-text-display" class="help-text"></span>
    </div>
  </div>
`;

export { template };
