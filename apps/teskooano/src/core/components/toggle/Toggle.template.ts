const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2); /* 8px gap between label and switch - might be overridden by space-between */
      cursor: pointer;
      font-family: var(--font-family-base);
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .toggle-label {
      user-select: none;
      /* Allow slot to override color if needed */
    }

    /* Hide actual checkbox */
    .checkbox-input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: var(--space-8); /* 48px (e.g. 2*knob_size + 2*padding + some_track) - adjust as needed */
      height: var(--space-5); /* 24px */
      flex-shrink: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-surface-3);
      border: var(--border-width-thin) solid var(--color-border-subtle);
      transition: background-color var(--transition-duration-fast) var(--transition-timing-base),
                  border-color var(--transition-duration-fast) var(--transition-timing-base);
      border-radius: var(--radius-full); /* Pill shape for the track */
    }

    .slider:before {
      position: absolute;
      content: "";
      height: calc(var(--space-5) - (var(--space-1) * 2)); /* track height - 2*padding (24px - 8px = 16px) */
      width: calc(var(--space-5) - (var(--space-1) * 2));  /* Make it square */
      left: var(--space-1); /* Padding for knob */
      bottom: var(--space-1); /* Padding for knob */
      background-color: var(--color-text-primary);
      transition: transform var(--transition-duration-fast) var(--transition-timing-base),
                  background-color var(--transition-duration-fast) var(--transition-timing-base);
      border-radius: var(--radius-full); /* Round knob */
      box-shadow: var(--shadow-sm);
    }

    .checkbox-input:checked + .switch .slider {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .checkbox-input:checked + .switch .slider:before {
      transform: translateX(calc(var(--space-8) - var(--space-5))); /* width_of_switch - width_of_knob_container */
      background-color: var(--color-text-on-primary);
    }

    /* Focus styles */
    .checkbox-input:focus-visible + .switch .slider {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 2px var(--color-primary);
    }
    
    :host(:hover) .slider {
        border-color: var(--color-border-strong);
    }
    
    :host(:hover) .checkbox-input:checked + .switch .slider {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }

  </style>
  <label class="toggle-label" part="label">
    <slot name="label"></slot>
    <span id="label-text"></span>
  </label>
  <input type="checkbox" class="checkbox-input" id="checkbox-input" part="input">
  <label for="checkbox-input" class="switch" part="switch">
    <span class="slider" part="slider"></span>
  </label>
`;

export { template };
