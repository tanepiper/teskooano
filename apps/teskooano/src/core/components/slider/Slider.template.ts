const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: var(--space-md);
      font-family: var(--font-family-base);
      --slider-track-bg: var(--color-surface-1);
      --slider-track-height: var(--space-1); /* 4px */
      --slider-thumb-bg: var(--color-primary);
      --slider-thumb-size: var(--space-4); /* 16px */
      --slider-thumb-border-color: var(--color-primary-hover); /* Aligned with styles.css range thumb */
      --slider-value-color: var(--color-text-secondary);
      --slider-value-width: var(--space-7); /* 40px */
      --slider-gap: var(--space-2); /* 8px */
      --slider-number-input-width: var(--space-8); /* 48px, close to 50px */
      --slider-number-input-bg: var(--color-surface-1);
      --slider-number-input-border: var(--color-border-subtle);
      --slider-number-input-text: var(--color-text-primary);
    }
    .slider-wrapper {
      display: flex;
      flex-direction: column;
      gap: calc(var(--space-1) / 2); /* 2px */
    }
    .control-row {
        display: flex;
        align-items: center;
        gap: var(--slider-gap);
    }
    label {
      font-size: var(--font-size-1);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }
    input[type="range"] {
      flex-grow: 1;
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      height: var(--slider-track-height);
      background: var(--slider-track-bg);
      outline: none;
      border-radius: var(--slider-track-height);
      cursor: pointer;
      margin: calc(var(--slider-thumb-size) / 2) 0;
    }
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: var(--slider-thumb-size);
      height: var(--slider-thumb-size);
      background: var(--slider-thumb-bg);
      border: var(--border-width-medium) solid var(--slider-thumb-border-color); /* Use token for width */
      border-radius: 50%;
      cursor: pointer;
      margin-top: calc((var(--slider-thumb-size) / -2) + (var(--slider-track-height) / 2));
    }
    input[type="range"]::-moz-range-thumb {
      width: calc(var(--slider-thumb-size) - (var(--border-width-medium) * 2)); /* Adjust for border */
      height: calc(var(--slider-thumb-size) - (var(--border-width-medium) * 2));
      background: var(--slider-thumb-bg);
      border: var(--border-width-medium) solid var(--slider-thumb-border-color);
      border-radius: 50%;
      cursor: pointer;
    }
    input[type="range"]:focus::-webkit-slider-thumb {
       /* Align with global input[type=range]:focus-visible thumb styles */
       outline: var(--border-width-medium) solid var(--color-border-focus);
    }
    input[type="range"]:focus::-moz-range-thumb {
       outline: var(--border-width-medium) solid var(--color-border-focus);
    }
     :host([disabled]) input[type="range"] {
        opacity: 0.6;
        cursor: not-allowed;
    }
     :host([disabled]) input[type="range"]::-webkit-slider-thumb {
        background: var(--color-text-disabled);
        border-color: var(--color-border-subtle);
        cursor: not-allowed;
    }
     :host([disabled]) input[type="range"]::-moz-range-thumb {
        background: var(--color-text-disabled);
        border-color: var(--color-border-subtle);
        cursor: not-allowed;
    }

    .value-container {
        display: flex;
        align-items: center;
        min-width: var(--slider-value-width);
        justify-content: flex-end;
    }
    .value-display {
      font-size: var(--font-size-1);
      color: var(--slider-value-color);
      min-width: var(--slider-value-width);
      text-align: right;
      font-family: var(--font-family-monospace);
    }
     :host([disabled]) .value-display {
         opacity: 0.6;
     }
     :host([disabled]) .value-input {
         opacity: 0.6;
         cursor: not-allowed;
         background-color: var(--color-surface-1); /* Changed from --color-surface-disabled */
     }
    .value-input {
        font-size: var(--font-size-1);
        color: var(--slider-number-input-text);
        background-color: var(--slider-number-input-bg);
        border: var(--border-width-thin) solid var(--slider-number-input-border);
        border-radius: var(--radius-sm);
        padding: calc(var(--space-1) / 2) var(--space-1);
        text-align: right;
        width: var(--slider-number-input-width);
        box-sizing: border-box;
        font-family: var(--font-family-monospace);
        -moz-appearance: textfield;
    }
    .value-input::-webkit-outer-spin-button,
    .value-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    :host([editable-value]) .value-display {
        display: none;
    }
    :host(:not([editable-value])) .value-input {
        display: none;
    }
    .value-input.invalid {
        border-color: var(--color-error);
        box-shadow: 0 0 0 var(--border-width-thin) var(--color-error);
    }

    .help-text-row {
        margin-top: calc(var(--space-1) / 2);
    }
    .help-text {
        font-size: var(--font-size-1);
        color: var(--color-text-secondary);
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
