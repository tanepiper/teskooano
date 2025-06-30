const template = document.createElement("template");

template.innerHTML = `
  <style>
    :host {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 100;
      pointer-events: none; /* Let clicks pass through the host */
    }

    .engine-overlay-toolbar-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: all; /* Capture clicks on the actual toolbar */
    }
  </style>
  <div class="engine-overlay-toolbar-container">
    <slot></slot>
  </div>
`;

export { template };
