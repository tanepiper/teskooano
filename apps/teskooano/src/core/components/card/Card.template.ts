// Remove existing import if present, tokens should be loaded globally

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      /* Default to fixed width */
      display: inline-block;
      width: var(--card-fixed-width, 300px); /* Default fixed width, customizable via CSS variable */
      background-color: var(--color-surface-2);
      border: var(--border-width-thin) solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden; /* Ensure content respects border radius */
      box-shadow: var(--shadow-sm);
      box-sizing: border-box;
      transition: border-color var(--transition-duration-fast) var(--transition-timing-base);
    }

    :host(:hover) {
      border-color: var(--color-border-strong);
    }

    :host([variant="fluid"]) {
      display: block; /* Block display for fluid */
      width: auto; /* Allow width to be determined by container */
      max-width: 100%; /* Prevent overflow */
    }

    :host([variant="full"]) {
      display: block;
      width: 100%; /* Full width */
    }

    .card-container {
      display: flex;
      flex-direction: column;
      height: 100%; /* Allow container to fill host */
    }

    ::slotted([slot="image"]) {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9; /* Common aspect ratio for images */
      object-fit: cover; /* Ensure image covers the area */
      background-color: var(--color-surface-1); /* Placeholder color */
      margin-bottom: var(--space-3); /* Space below image */
      flex-shrink: 0;
    }

    .content-area {
       padding: var(--space-4);
       display: flex;
       flex-direction: column;
       flex-grow: 1; /* Allow content area to take remaining space */
    }

    ::slotted([slot="label"]) {
      display: block;
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-1);
      text-transform: uppercase;
      font-weight: var(--font-weight-medium);
      letter-spacing: 0.5px;
    }

    ::slotted([slot="title"]) {
      display: block;
      font-size: var(--font-size-large);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--space-2);
      line-height: var(--line-height-heading);
    }

    ::slotted(:not([slot])) { /* Default slot for content */
      display: block;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      margin-bottom: var(--space-4); /* Space below main content */
      flex-grow: 1; /* Allow content to push CTA down */
    }

    .cta-area {
        margin-top: auto; /* Push CTA to bottom if content doesn't fill */
        padding-top: var(--space-3); /* Space above CTA if content is short */
        border-top: var(--border-width-thin) solid var(--color-border-subtle);
        margin-left: calc(-1 * var(--space-4)); /* Extend border full width */
        margin-right: calc(-1 * var(--space-4));
        padding-left: var(--space-4);
        padding-right: var(--space-4);
        padding-bottom: var(--space-4); /* Consistent padding at bottom */
    }

    ::slotted([slot="cta"]) {
      display: flex; /* Allow multiple buttons */
      gap: var(--space-2);
      justify-content: flex-end; /* Align button(s) to the right */
    }

    /* Hide empty slots/areas visually */
    slot[name="label"]:not(:slotted(*)),
    slot[name="image"]:not(:slotted(*)),
    slot[name="cta"]:not(:slotted(*)) {
      display: none;
    }

     /* Hide CTA border if no CTA slot content */
    .cta-area:has(slot[name="cta"]:not(:slotted(*))) {
        display: none;
    }

  </style>
  <div class="card-container" part="container">
    <slot name="image"></slot>
    <div class="content-area" part="content-area">
      <slot name="label"></slot>
      <slot name="title"></slot>
      <slot></slot> <!-- Default slot for content -->
    </div>
    <div class="cta-area" part="cta-area">
        <slot name="cta"></slot>
    </div>
  </div>
`;

export { template };
