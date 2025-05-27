/**
 * Template for the System Generator Modal custom element
 */
export const SystemGeneratorModalTemplate = document.createElement("template");
SystemGeneratorModalTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--font-family-base, system-ui);
      line-height: 1.5;
      color: var(--color-text-secondary, #ccccdd);
    }
    
    .system-generator-modal-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .system-header {
      margin-bottom: 8px;
    }
    
    .system-title {
      margin: 0 0 8px 0;
      color: var(--color-text-primary, #eeeef5);
      font-size: 18px;
    }
    
    .system-description {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .physics-info {
      background: rgba(0, 100, 255, 0.1);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .section-title {
      margin: 0 0 8px 0;
      color: var(--color-text-primary, #eeeef5);
      font-size: 14px;
    }
    
    .section-content {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .system-summary, .star-info {
      background: var(--color-surface-1, #1e1e2a);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 13px;
    }
    
    .star-details {
      font-size: 13px;
      line-height: 1.4;
    }
    
    .star-details p {
      margin: 0 0 6px 0;
    }
    
    .footer-info {
      margin-top: 16px;
      font-size: 12px;
      opacity: 0.7;
      text-align: center;
    }
  </style>
  
  <div class="system-generator-modal-content">
    <!-- Content will be populated dynamically in the render() method -->
  </div>
`;
