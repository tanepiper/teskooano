const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: 10px !important;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
      border-top: 1px solid var(--color-border-alt, #5a5a7a);
    }
    
    .section {
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px dashed var(--color-border-alt, #5a5a7a);
    }
    
    .section-title {
      margin: 8px 0 10px 0;
      font-weight: 600;
      color: var(--color-text-primary, #ddd);
    }
    
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .setting-row-full {
      margin-bottom: 12px;
    }
    
    label {
      margin-right: 10px;
      color: var(--color-text-secondary, #aaa);
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 34px;
      height: 20px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-surface-alt, #3a3a4e);
      transition: .4s;
      border-radius: 20px;
      border: 1px solid var(--color-border-alt, #5a5a7a);
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 3px;
      bottom: 3px;
      background-color: var(--color-text-secondary, #aaa);
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: var(--color-primary, #6c63ff);
      border-color: var(--color-primary, #6c63ff);
    }
    
    input:checked + .slider:before {
      transform: translateX(14px);
      background-color: white;
    }
    
    .error-message {
      color: var(--color-error, #f44336);
      font-style: italic;
      margin-top: 10px;
    }
  </style>
  
  <div id="engine-section" class="section">
    <div class="section-title">Engine Settings</div>
  </div>
  
  <div id="camera-section" class="section">
    <div class="section-title">Camera Settings</div>
  </div>
  
  <div id="error-message" class="error-message" style="display: none;"></div>
`;

export { template };
