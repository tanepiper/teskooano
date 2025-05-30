/**
 * Template for the System Generator Modal custom element
 */
export const SystemGeneratorModalTemplate = document.createElement("template");
SystemGeneratorModalTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--font-family-base);
      line-height: var(--line-height-base);
      color: var(--color-text-secondary);
    }
    
    .system-generator-modal-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    
    .system-header {
      margin-bottom: var(--space-2);
    }
    
    .system-title {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text-primary);
      font-size: var(--font-size-3);
    }
    
    .system-description {
      margin: 0;
      font-size: var(--font-size-base);
      opacity: 0.9;
    }
    
    .physics-info {
      background: var(--color-surface-1);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-2);
      border-left: var(--border-width-thick) solid var(--color-info);
    }
    
    .section-title {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
    }
    
    .section-content {
      margin: 0;
      font-size: var(--font-size-base);
      opacity: 0.9;
    }
    
    .section-content strong {
      color: var(--color-text-primary);
    }
    
    .system-summary, .star-info {
      background: var(--color-surface-1);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-2);
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
      font-size: var(--font-size-1);
    }
    
    .star-details {
      font-size: var(--font-size-1);
      line-height: var(--line-height-base);
    }
    
    .star-details p {
      margin: 0 0 var(--space-1) 0;
    }
    
    .footer-info {
      margin-top: var(--space-4);
      font-size: var(--font-size-1);
      opacity: var(--opacity-text-muted);
      text-align: center;
    }
  </style>
  
  <div class="system-generator-modal-content">
    <!-- Content will be populated dynamically in the render() method -->
  </div>
`;
