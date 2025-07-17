const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
        display: block;
        font-family: var(--font-family-monospace, monospace);
        font-size: 0.9em;
        color: var(--color-text, #e0e0fc);
        padding: var(--space-sm, 8px) var(--space-md, 12px);
        border-top: 1px solid var(--color-border-alt, #5a5a7a);
        height: 100%;
    }

    .info-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-md, 12px);
        overflow-y: auto;
        overflow-x: hidden;
        height: 100%;
        padding-right: var(--space-xs, 4px); /* Space for scrollbar */
    }
    
    /* Custom scrollbar styling for the container */
    .info-container::-webkit-scrollbar {
        width: 8px;
    }
    
    .info-container::-webkit-scrollbar-track {
        background: var(--color-surface-alt, #2a2a3a);
        border-radius: 4px;
    }
    
    .info-container::-webkit-scrollbar-thumb {
        background: var(--color-border, #555);
        border-radius: 4px;
    }
    
    .info-container::-webkit-scrollbar-thumb:hover {
        background: var(--color-border-alt, #5a5a7a);
    }
    .info-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 10px;
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
      align-items: center;
      gap: var(--space-md, 12px);
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
      font-size: 0.8em;
      color: var(--color-text-secondary, #aaa);
      text-align: center;
    }
    
    /* WebGL Capabilities Styles */
    .capability-section, .performance-section, .optimization-section {
      margin-top: var(--space-md, 12px);
      padding: var(--space-sm, 8px);
      background: var(--color-surface-alt, #2a2a3a);
      border-radius: 6px;
      border: 1px solid var(--color-border-alt, #5a5a7a);
    }
    
    .capability-section h4, .performance-section h4, .optimization-section h4 {
      margin: 0 0 var(--space-sm, 8px) 0;
      color: var(--color-primary, #7c7cff);
      font-size: 0.95em;
      font-weight: 600;
    }
    
    .capability-table, .optimization-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85em;
    }
    
    .capability-table td, .optimization-table td {
      padding: 2px 4px;
      border-bottom: 1px solid var(--color-border-alt, #5a5a7a);
    }
    
    .capability-table td:first-child, .optimization-table td:first-child {
      color: var(--color-text-secondary, #aaa);
      text-align: right;
      padding-right: var(--space-sm, 8px);
    }
    
    .capability-table td:last-child, .optimization-table td:last-child {
      color: var(--color-primary-light, #9fa8da);
      font-weight: 500;
    }
    
    .performance-indicator {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-xs, 4px);
    }
    
    .performance-label {
      color: var(--color-text-secondary, #aaa);
      font-size: 0.85em;
    }
    
    .performance-value {
      font-weight: 600;
      font-size: 0.85em;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      font-size: 0.75em;
      letter-spacing: 0.5px;
    }
    
    .performance-value.high-end {
      background: var(--color-success, #4caf50);
      color: #fff;
    }
    
    .performance-value.mid-range {
      background: var(--color-warning, #ff9800);
      color: #fff;
    }
    
    .performance-value.low-end {
      background: var(--color-error, #f44336);
      color: #fff;
    }
    
    .performance-value.excellent {
      background: var(--color-success, #4caf50);
      color: #fff;
    }
    
    .performance-value.good {
      background: var(--color-warning, #ff9800);
      color: #fff;
    }
    
    .performance-value.fair {
      background: var(--color-warning, #ff9800);
      color: #fff;
    }
    
    .performance-value.limited {
      background: var(--color-error, #f44336);
      color: #fff;
    }
  </style>
  
  <div class="info-container">
  <!-- Renderer Stats Section -->
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
  
  <!-- WebGL Capabilities Section -->
  <div id="webgl-capabilities">
    <div class="capability-section">
      <h4>WebGL Capabilities</h4>
      <div style="color: var(--color-text-secondary, #aaa); font-style: italic;">
        Loading capabilities...
      </div>
    </div>
  </div>
  
  <!-- Performance Optimization Section -->
  <div id="performance-optimization">
    <div class="optimization-section">
      <h4>Active Performance Optimizations</h4>
      <div style="color: var(--color-text-secondary, #aaa); font-style: italic;">
        Loading optimizations...
        </div>
        </div>
    </div>
  </div>
`;

export { template };
