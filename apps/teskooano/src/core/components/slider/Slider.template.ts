const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: var(--space-md, 12px);
      font-family: var(--font-family, sans-serif);
    }
    .slider-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 2px);
    }
    .control-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm, 8px);
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
      height: 4px;
      background: var(--color-surface-inset, #1a1a2e);
      outline: none;
      border-radius: 2px;
      cursor: pointer;
      margin: 8px 0;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: var(--color-primary, #6c63ff);
      border: 2px solid var(--color-border-light, #8888ff);
      border-radius: 50%;
      cursor: pointer;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: var(--color-primary, #6c63ff);
      border: 2px solid var(--color-border-light, #8888ff);
      border-radius: 50%;
      cursor: pointer;
    }
    
    input[type="range"]:focus::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.3);
    }
    
    input[type="range"]:focus::-moz-range-thumb {
      box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.3);
    }
    
    :host([disabled]) input[type="range"] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .value-container {
      display: flex;
      align-items: center;
      min-width: 50px;
      justify-content: flex-end;
    }
    
    .value-display {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      min-width: 40px;
      text-align: right;
      font-family: var(--font-family-monospace, monospace);
    }
    
    .value-input {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-primary, #eee);
      background-color: var(--color-surface-inset, #1a1a2e);
      border: 1px solid var(--color-border-alt, #5a5a7a);
      border-radius: var(--border-radius-sm, 4px);
      padding: 2px 4px;
      text-align: right;
      width: 50px;
      box-sizing: border-box;
      font-family: var(--font-family-monospace, monospace);
      -moz-appearance: textfield;
    }
    
    .value-input::-webkit-outer-spin-button,
    .value-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    .value-input.invalid {
      border-color: var(--color-error, #f44336);
      box-shadow: 0 0 0 1px rgba(244, 67, 54, 0.5);
    }
    
    :host([editable-value]) .value-display {
      display: none;
    }
    
    :host(:not([editable-value])) .value-input {
      display: none;
    }
    
    :host([disabled]) .value-display,
    :host([disabled]) .value-input {
      opacity: 0.6;
    }
    
    .help-text {
      font-size: var(--font-size-xs, 0.8em);
      color: var(--color-text-secondary, #aaa);
      margin-top: var(--space-xxs, 2px);
    }
  </style>
  <div class="slider-wrapper">
    <label for="slider-input"><slot name="label">Label</slot></label>
    <div class="control-row">
      <input id="slider-input" type="range" />
      <div class="value-container">
        <span id="value-display" class="value-display"></span>
        <input id="value-input" type="number" class="value-input" />
      </div>
    </div>
    <span id="help-text-display" class="help-text"><slot name="help-text"></slot></span>
  </div>
`;

export { template };
