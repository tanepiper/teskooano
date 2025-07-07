/**
 * Shared styles for celestial info components.
 */
export const baseStyles = `
  .main-body {
    margin-bottom: 2rem;
  }

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
`;
