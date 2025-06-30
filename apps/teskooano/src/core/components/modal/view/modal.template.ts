export const modalStyles = `
  :host {
    display: block;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  :host(.visible) {
    opacity: 1;
  }

  .modal-content {
    background: var(--background-color-rgb, 27, 27, 27);
    color: var(--text-color-rgb, 221, 221, 221);
    padding: 24px;
    border-radius: var(--border-radius-large, 8px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 500px;
    transform: scale(0.95);
    transition: transform 0.3s ease-in-out;
  }

  :host(.visible) .modal-content {
    transform: scale(1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color-rgb, 51, 51, 51);
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5em;
    font-weight: 500;
  }

  .modal-body {
    margin-bottom: 24px;
    font-size: 1em;
    line-height: 1.6;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  #confirm-btn,
  #secondary-btn,
  #close-btn {
    padding: 10px 20px;
    border-radius: var(--border-radius-medium, 4px);
    border: none;
    cursor: pointer;
    font-size: 1em;
    transition:
      background-color 0.2s,
      transform 0.1s;
  }

  #confirm-btn {
    background-color: var(--primary-color, #007acc);
    color: white;
  }

  #confirm-btn:hover {
    background-color: var(--primary-color-hover, #005a9e);
  }

  #secondary-btn,
  #close-btn {
    background-color: var(--secondary-background-color, #333);
    color: var(--text-color-rgb, 221, 221, 221);
    border: 1px solid var(--border-color-rgb, 51, 51, 51);
  }

  #secondary-btn:hover,
  #close-btn:hover {
    background-color: var(--secondary-background-color-hover, #444);
  }

  #confirm-btn:active,
  #secondary-btn:active,
  #close-btn:active {
    transform: translateY(1px);
  }

  .hidden {
    display: none;
  }
`;

export const modalTemplate = `
  <div class="modal-content" part="content">
    <div class="modal-header" part="header">
      <h2 id="modal-title"><slot name="title">Modal Title</slot></h2>
    </div>
    <div class="modal-body" part="body">
      <slot>Modal Body</slot>
    </div>
    <div class="modal-footer" part="footer">
      <button id="secondary-btn" class="hidden">Secondary</button>
      <button id="close-btn" class="hidden">Close</button>
      <button id="confirm-btn" class="hidden">Confirm</button>
    </div>
  </div>
`;
