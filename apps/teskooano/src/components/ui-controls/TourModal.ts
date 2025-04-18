export class TourModal extends HTMLElement {
  private modalContainer: HTMLDivElement;
  private onAccept: () => void = () => {};
  private onDecline: () => void = () => {};

  constructor() {
    super();
    this.modalContainer = document.createElement('div');
    this.modalContainer.className = 'tour-modal';
    this.render();
  }

  connectedCallback() {
    document.body.appendChild(this.modalContainer);
  }

  disconnectedCallback() {
    if (this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
    }
  }

  private render() {
    this.modalContainer.innerHTML = `
      <div class="tour-modal-content">
        <h2>Welcome to Teskooano</h2>
        <p>Would you like to take a quick tour of the application?</p>
        <div class="tour-modal-buttons">
          <button id="tour-accept" class="tour-button tour-button-accept">Yes, show me around</button>
          <button id="tour-decline" class="tour-button tour-button-decline">No, I'll explore on my own</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .tour-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .tour-modal-content {
        background-color: var(--color-background, #1a1a1a);
        color: var(--color-text, #fff);
        border-radius: 8px;
        padding: 20px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
      }
      
      .tour-modal h2 {
        margin-top: 0;
        color: var(--color-accent, #3498db);
      }
      
      .tour-modal-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      
      .tour-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      
      .tour-button-accept {
        background-color: var(--color-accent, #3498db);
        color: #fff;
      }
      
      .tour-button-decline {
        background-color: var(--color-background-light, #333);
        color: var(--color-text, #fff);
      }
    `;
    
    document.head.appendChild(style);

    // Add event listeners
    const acceptButton = this.modalContainer.querySelector('#tour-accept');
    const declineButton = this.modalContainer.querySelector('#tour-decline');

    if (acceptButton) {
      acceptButton.addEventListener('click', () => {
        this.onAccept();
        this.close();
      });
    }

    if (declineButton) {
      declineButton.addEventListener('click', () => {
        this.onDecline();
        this.close();
      });
    }
  }

  public setCallbacks(onAccept: () => void, onDecline: () => void) {
    this.onAccept = onAccept;
    this.onDecline = onDecline;
  }

  public close() {
    if (this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
    }
  }
}

// Register the custom element
customElements.define('tour-modal', TourModal); 