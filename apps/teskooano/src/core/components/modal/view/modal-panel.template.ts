export const modalStyles = `
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--color-surface-2, #272736);
    border: 1px solid var(--color-border, #50506a);
    border-radius: var(--radius-md, 4px);
    overflow: hidden;
    font-family: var(--font-family-base, system-ui);
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  }

  :host(.visible) {
    opacity: 1;
    transform: scale(1);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3, 12px);
    background-color: var(--color-surface-3, #333344);
    border-bottom: 1px solid var(--color-border, #50506a);
    min-height: 40px;
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-size: var(--font-size-large, 16px);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text-primary, #eeeef5);
  }

  .modal-body {
    flex: 1;
    padding: var(--space-4, 16px);
    overflow-y: auto;
    color: var(--color-text-secondary, #ccccdd);
    display: flex;
    flex-direction: column;
  }

  .modal-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2, 8px);
    padding: var(--space-3, 12px);
    background-color: var(--color-surface-3, #333344);
    border-top: 1px solid var(--color-border, #50506a);
    flex-shrink: 0;
  }

  .modal-button {
    padding: var(--space-2, 8px) var(--space-3, 12px);
    border-radius: var(--radius-sm, 4px);
    border: 1px solid transparent;
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-medium, 500);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    background-color: transparent;
    color: var(--color-text-secondary, #ccccdd);
    min-width: 80px;
  }

  .modal-button:hover {
    background-color: var(--color-surface-4, #404050);
    border-color: var(--color-border, #50506a);
  }

  .modal-button:active {
    transform: translateY(1px);
  }

  .modal-button.primary {
    background-color: var(--color-primary, #007acc);
    color: white;
    border-color: var(--color-primary, #007acc);
  }

  .modal-button.primary:hover {
    background-color: var(--color-primary-hover, #005a9e);
    border-color: var(--color-primary-hover, #005a9e);
  }

  .modal-button.secondary {
    background-color: var(--color-surface-4, #404050);
    border-color: var(--color-border, #50506a);
  }

  .modal-button.secondary:hover {
    background-color: var(--color-surface-5, #505060);
  }

  .modal-button.hidden {
    display: none;
  }

  /* Content slot styling */
  ::slotted(*) {
    display: block;
    width: 100%;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .modal-footer {
      flex-direction: column;
      gap: var(--space-1, 4px);
    }
    
    .modal-button {
      width: 100%;
      justify-content: center;
    }
  }
`;

export const modalTemplate = `
  <div class="modal-header" part="header">
    <h3 class="modal-title" part="title" id="modal-title">Modal Title</h3>
  </div>
  <div class="modal-body" part="body">
    <div class="modal-content" part="content">
      <slot name="content">Modal content goes here</slot>
    </div>
  </div>
  <div class="modal-footer" part="footer">
    <button class="modal-button secondary" id="secondary-button" part="secondary-button">
      Secondary Action
    </button>
    <button class="modal-button secondary" id="close-button" part="close-button">
      Cancel
    </button>
    <button class="modal-button primary" id="confirm-button" part="confirm-button">
      Confirm
    </button>
  </div>
`;
