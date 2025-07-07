/**
 * Shared styles for celestial info components.
 */
export const baseStyles = `
  .main-body {
    margin-bottom: 2rem;
  }

  /* Enhanced Header Styles */
  .celestial-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-alt, var(--color-surface)) 100%);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .celestial-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      var(--color-accent, #4fc3f7) 0%, 
      var(--color-warning, #ffc107) 25%, 
      var(--color-success, #4caf50) 50%, 
      var(--color-info, #17a2b8) 75%, 
      var(--color-accent, #4fc3f7) 100%);
  }

  .icon-container {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .icon-container celestial-icon {
    font-size: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .header-content {
    flex: 1;
    min-width: 0; /* Prevent flex item from overflowing */
  }

  .celestial-title {
    margin: 0 0 0.25rem 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text-primary, #fff);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    line-height: 1.2;
  }

  .celestial-subtitle {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .celestial-id {
    font-family: var(--font-mono, "Courier New", monospace);
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #666);
    background: rgba(0, 0, 0, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-accent {
    flex-shrink: 0;
    width: 4px;
    height: 60px;
    background: linear-gradient(180deg, 
      var(--color-accent, #4fc3f7) 0%, 
      var(--color-warning, #ffc107) 50%, 
      var(--color-success, #4caf50) 100%);
    border-radius: 2px;
    opacity: 0.7;
  }

  /* Legacy styles for backward compatibility */
  .title {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .subtitle {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
    font-weight: 400;
    color: var(--color-text-secondary);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    font-style: italic;
    color: var(--color-text-secondary);
  }

  .basic-info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    margin-bottom: 1.5rem;
  }

  .basic-info dt {
    font-weight: 600;
    color: var(--color-text);
  }

  .basic-info dd {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .cards-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .info-card h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .card-content {
    font-size: 0.9rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    align-items: start;
  }

  .info-grid dt {
    font-weight: 600;
    color: var(--color-text);
    min-width: fit-content;
  }

  .info-grid dd {
    margin: 0;
    color: var(--color-text-secondary);
    word-break: break-word;
  }

  .physics-card {
    font-family: var(--font-mono, "Courier New", monospace);
    background: var(--color-surface-alt, var(--color-surface));
  }

  .physics-card .info-grid {
    font-size: 0.85rem;
  }

  /* Responsive design for smaller screens */
  @media (max-width: 600px) {
    .celestial-header {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
      padding: 1rem;
    }

    .header-accent {
      width: 60px;
      height: 4px;
    }

    .celestial-title {
      font-size: 1.5rem;
    }
  }
`;
