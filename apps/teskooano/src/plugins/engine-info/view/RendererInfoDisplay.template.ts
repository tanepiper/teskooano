const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
        display: block;
        font-family: var(--font-family-monospace, monospace);
        font-size: 0.9em;
        color: var(--color-text, #e0e0fc);
        padding: var(--space-sm, 8px) var(--space-md, 12px); /* Added padding */
        border-top: 1px solid var(--color-border-alt, #5a5a7a); /* Add separator */
    }
    .info-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 10px; /* Row gap, Column gap */
        align-items: center;
        margin-bottom: var(--space-sm, 8px);
    }
    .label {
        color: var(--color-text-secondary, #aaa);
        text-align: right;
    }
    .value {
        font-weight: bold;
        color: var(--color-primary-light, #9fa8da);
    }
    #fps-value {
      /* Dynamic color set in update */
    }
    .controls {
      margin-top: var(--space-sm, 8px);
      display: flex;
      justify-content: center;
      align-items: center; /* Vertically center items */
      gap: var(--space-md, 12px); /* Gap between button and status */
    }
    button {
      background: var(--color-button-background, #444);
      color: var(--color-button-text, #fff);
      border: 1px solid var(--color-border, #555);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 0.8em;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    button:hover {
      background: var(--color-button-hover, #555);
    }
    button:disabled {
      background: var(--color-surface-alt, #3a3a4e);
      color: var(--color-text-disabled, #777);
      cursor: not-allowed;
      border-color: var(--color-border-alt, #5a5a7a);
    }
    .status {
      /* Removed margin-top as it's handled by flex gap */
      font-size: 0.8em;
      color: var(--color-text-secondary, #aaa);
      text-align: center;
    }
  </style>
  <div class="info-grid">
      <span class="label">FPS:</span>
      <span class="value" id="fps-value">-</span>

      <span class="label">Draw Calls:</span>
      <span class="value" id="draw-calls-value">-</span>

      <span class="label">Triangles:</span>
      <span class="value" id="triangles-value">-</span>

      <span class="label">Memory:</span>
      <span class="value" id="memory-value">-</span>

      <span class="label">Cam Pos:</span>
      <span class="value" id="cam-pos-value">-</span>

      <span class="label">FOV:</span>
      <span class="value" id="fov-value">-</span>
  </div>
`;

export { template };
