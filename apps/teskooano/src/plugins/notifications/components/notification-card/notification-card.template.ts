export const styles = `
  :host {
    display: block;
    margin-bottom: 0.75rem;
    border-radius: 0.5rem;
    background-color: rgba(30, 41, 59, 0.8);
    color: #f1f5f9;
    padding: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-left: 4px solid transparent;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
    backdrop-filter: blur(5px);
    width: 350px;
    max-width: 90vw;
  }

  :host(.info) {
    border-left-color: #3b82f6;
  }

  :host(.success) {
    border-left-color: #22c55e;
  }

  :host(.warning) {
    border-left-color: #f97316;
  }

  :host(.error) {
    border-left-color: #ef4444;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .title {
    font-size: 1rem;
  }

  .close-button {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    padding: 0.25rem;
  }
  .close-button:hover {
    color: #f1f5f9;
  }

  .message {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.4;
    color: #cbd5e1;
  }
`;

export const template = `
  <div class="header">
    <span class="title"></span>
    <button class="close-button" part="close-button" aria-label="Close">
      &times;
    </button>
  </div>
  <div class="message"></div>
`;
