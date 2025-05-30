import "@teskooano/design-system/tokens.css";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      box-sizing: border-box;
      --icon-size: var(--font-size-base); 
      --icon-gap: var(--space-2);
    }

    :host([fullwidth]) {
        display: block; 
        width: 100%;
    }
    :host([fullwidth]) button {
        width: 100%; 
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-height: calc(var(--space-2) * 2 + var(--line-height-base) * 1em);
      padding: var(--space-2) var(--space-4); 
      border: var(--border-width-thin) solid var(--color-border-subtle); 
      border-radius: var(--radius-md); 
      background-color: var(--color-surface-2); 
      color: var(--color-text-primary); 
      font-family: var(--font-family-base); 
      font-size: var(--font-size-base); 
      font-weight: var(--font-weight-medium); 
      line-height: var(--line-height-base); 
      gap: var(--icon-gap); 
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: background-color var(--transition-duration-fast) var(--transition-timing-base),
                  border-color var(--transition-duration-fast) var(--transition-timing-base),
                  color var(--transition-duration-fast) var(--transition-timing-base),
                  box-shadow var(--transition-duration-fast) var(--transition-timing-base);
    }

    button:hover:not([disabled]) {
      border-color: var(--color-border-strong);
      background-color: var(--color-surface-3);
      color: var(--color-text-primary); 
    }

    button:active:not([disabled]) {
      background-color: var(--color-surface-1); 
      border-color: var(--color-border-strong);
      box-shadow: var(--shadow-inner); 
    }

    button:focus {
      outline: none; 
    }
    button:focus:not(:focus-visible) { 
       outline: none; 
    } 
    button:focus-visible { 
       outline: var(--border-width-medium) solid var(--color-border-focus); 
       outline-offset: 1px; 
       border-color: var(--color-border-focus); 
    }

    button[disabled] {
      opacity: 0.6; 
      cursor: not-allowed;
      background-color: var(--color-surface-1); 
      border-color: var(--color-border-subtle);
      color: var(--color-text-disabled);
    }

    /* --- Variants using host attributes --- */
    :host([variant="primary"]) button {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-text-on-primary);
    }
    :host([variant="primary"]) button:hover:not([disabled]) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
     :host([variant="primary"]) button:active:not([disabled]) {
        background-color: var(--color-primary-active);
        border-color: var(--color-primary-active);
    }
    :host([variant="primary"]) button:focus-visible {
       box-shadow: 0 0 0 var(--border-width-medium) var(--color-background), 0 0 0 calc(var(--border-width-medium) * 2) var(--color-primary);
       outline: none;
    }
    
    :host([variant="ghost"]) button {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-text-secondary);
    }
     :host([variant="ghost"]) button:hover:not([disabled]) {
        background-color: var(--color-surface-2);
        border-color: var(--color-border-subtle);
        color: var(--color-text-primary);
    }
    :host([variant="ghost"]) button:active:not([disabled]) {
        background-color: var(--color-surface-1);
    }
     :host([variant="ghost"]) button:focus-visible {
       border-color: var(--color-border-focus); 
    }

    /* --- Image Variant --- */
    :host([variant="image"]) button {
      padding: 0;
      min-height: auto;
      min-width: auto;
      width: var(--space-8);
      height: var(--space-8);
      background-color: transparent;
      border-color: transparent;
      gap: 0;
      line-height: 0;
      display: flex;
      align-items: center;
    }
    :host([variant="image"]) {
      display: inline-flex;
      align-items: center;
      margin-right: var(--space-2);
    }
    :host([variant="image"]) button:hover:not([disabled]) {
        background-color: var(--color-surface-row-hover);
        border-color: transparent;
    }
    :host([variant="image"]) button:active:not([disabled]) {
        background-color: var(--color-surface-interactive-active);
        border-color: transparent;
    }
    :host([variant="image"]) button:focus-visible {
       outline: var(--border-width-medium) solid var(--color-border-focus); 
       outline-offset: 1px; 
       border-color: transparent;
    }

    /* --- Icon Variant (New) --- */
    :host([variant="icon"]) button {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-text-secondary);
        padding: var(--space-2);
    }
    :host([variant="icon"]) button:hover:not([disabled]) {
        background-color: var(--color-surface-2);
        color: var(--color-text-primary);
    }
    :host([variant="icon"]) button:active:not([disabled]) {
        background-color: var(--color-surface-1);
    }
    :host([variant="icon"]) button:focus-visible {
       border-color: var(--color-border-focus);
       box-shadow: 0 0 0 var(--border-width-medium) var(--color-border-focus);
    }

    /* Adjust padding for icon variant based on size */
    :host([variant="icon"][size="xs"]) button,
    :host([variant="icon"][size="sm"]) button {
        padding: var(--space-1);
    }
    :host([variant="icon"][size="lg"]) button {
        padding: var(--space-3);
    }
    :host([variant="icon"][size="xl"]) button {
        padding: var(--space-4);
    }

    /* --- Sizes using host attributes --- */
    :host([size="xs"]) button {
        min-height: calc(var(--space-1) * 2 + var(--line-height-base) * 0.5em);
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-small);
        border-radius: var(--radius-sm);
        gap: var(--icon-gap); 
    }
    :host([size="xs"]) {
         --icon-size: var(--font-size-small);
         --icon-gap: var(--space-1); 
    }

    :host([size="sm"]) button {
        min-height: calc(var(--space-1) * 2 + var(--line-height-base) * 1em);
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-small);
        border-radius: var(--radius-sm);
        gap: var(--icon-gap); 
    }
    :host([size="sm"]) {
         --icon-size: var(--font-size-small);
         --icon-gap: var(--space-1); 
    }

    :host([size="lg"]) button {
        min-height: calc(var(--space-3) * 2 + var(--line-height-base) * 1em);
        padding: var(--space-3) var(--space-5);
        font-size: var(--font-size-large);
        border-radius: var(--radius-lg);
        gap: var(--icon-gap); 
    }
     :host([size="lg"]) {
         --icon-size: var(--font-size-large);
         --icon-gap: var(--space-3); 
    }

    /* XL Size */
    :host([size="xl"]) button {
        min-height: calc(var(--space-4) * 2 + var(--line-height-base) * 1em); /* Larger padding */
        padding: var(--space-4) var(--space-6); /* Larger padding */
        font-size: var(--font-size-xlarge); 
        border-radius: var(--radius-xl); 
        gap: var(--icon-gap); 
    }
    :host([size="xl"]) {
         --icon-size: var(--font-size-xlarge); /* Larger icon */
         --icon-gap: var(--space-4); /* Largest gap */
    }

    /* Add gap only if icon is followed by default slot content */
    ::slotted([slot="icon"] + slot:not([name]):not(:empty)) { 
        margin-right: var(--icon-gap);
    }

    /* Hide default slot (text) when mobile attribute is present */
    :host([mobile]) button > slot:not([name='icon']) {
      display: none;
    }

    /* Explicitly hide the tooltip when it's inside the shadow DOM */
    teskooano-tooltip {
      display: none;
    }
  </style>
  <button part="button" aria-describedby="internal-tooltip">
    <slot name="icon"></slot>
    <slot></slot> <!-- Default slot for button text -->
  </button>
  <!-- Tooltip is initially here for structure and content, but will be moved -->
  <teskooano-tooltip id="internal-tooltip" exportparts="tooltip,content,icon,text-content,title,main">
      <slot name="tooltip-icon" slot="icon"></slot>
      <slot name="tooltip-title" slot="title"></slot>
      <slot name="tooltip-text"></slot> <!-- Default slot for tooltip main text -->
  </teskooano-tooltip>
`;

export { template };
