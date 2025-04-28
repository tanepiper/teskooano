// Vanilla Web Component for Engine Placeholder
import { CustomEvents } from "@teskooano/data-types"; // Add import
import { DockviewApi } from "dockview-core"; // Import DockviewApi type
import "../toolbar/SeedForm.js"; // Import SeedForm definition

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      background-color: var(--color-background-mute);
      color: var(--color-text-secondary);
      text-align: center;
      padding: var(--space-lg);
      box-sizing: border-box;
      opacity: 0;
      animation: fadeIn 0.5s ease-in forwards;
    }

    h2 {
      margin: 0 0 var(--space-sm) 0;
      color: var(--color-text-emphasis);
    }

    h3 {
      margin: 0 0 var(--space-md) 0;
      font-weight: normal;
      color: var(--color-text);
    }

    img {
      max-width: 250px;
      height: auto;
      margin-top: var(--space-lg, 2rem);
      opacity: 0.7;
      animation: pulse 2s infinite ease-in-out;
      border-radius: 1rem;
      border: 1px solid var(--color-border);
    }

    teskooano-button {
      margin-top: var(--space-lg);
      /* Override default button styles if needed, e.g.: */
      /* --button-bg: var(--color-secondary); */
      --button-border-radius: var(--border-radius-md);
    }

    .placeholder-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
      
    /* Focus styles might need adjustment if default is different */
    /* teskooano-button:focus-visible { ... } */

    /* Style for the seed form message */
    .seed-info {
      margin-top: var(--space-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      max-width: 400px;
    }

    /* Style for the seed form container */
    .seed-form-container {
      margin-top: var(--space-md);
      display: flex;
      justify-content: center;
      width: 100%;
    }

    /* Ensure button inside seed form doesn't get too big */
    toolbar-seed-form teskooano-button {
        flex-shrink: 0;
    }

    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.7;
      }
      50% {
        transform: scale(1.05);
        opacity: 1;
      }
    }
  </style>
  <div class="placeholder-container">
    <div class="placeholder-content">
   <img src="/assets/panel-icon.png" alt="Teskooano Loading Screen" />
   </div>
   <div class="placeholder-content">
    <h2>🔭 Teskooano...</h2>
    <h3>Waiting for celestial objects data...</h3>
    <teskooano-button id="start-tour-button">
      <span slot="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
        </svg>
      </span>
      <span>Start Tour</span>
    </teskooano-button>
    <p class="seed-info">
      Or use the Seed input in the toolbar to load a specific solar system arrangement.
    </p>
    <!-- Add Seed Form -->
    <div class="seed-form-container">
      <toolbar-seed-form id="placeholder-seed-form"></toolbar-seed-form>
    </div>
     
  </div>
`;

export class EnginePlaceholder extends HTMLElement {
  // Static property to hold the API reference
  private static dockviewApi: DockviewApi | null = null;

  // Static method to set the API reference
  public static setDockviewApi(api: DockviewApi): void {
    EnginePlaceholder.dockviewApi = api;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const button = this.shadowRoot?.getElementById("start-tour-button");
    if (button) {
      button.addEventListener("click", this.handleStartTourClick);
    }
  }

  disconnectedCallback() {
    const button = this.shadowRoot?.getElementById("start-tour-button");
    if (button) {
      button.removeEventListener("click", this.handleStartTourClick);
    }
  }

  private handleStartTourClick = () => {
    // Dispatch a custom event that bubbles up
    this.dispatchEvent(
      new CustomEvent(CustomEvents.START_TOUR_REQUEST, {
        bubbles: true,
        composed: true,
      }),
    );
  };
}

customElements.define("engine-placeholder", EnginePlaceholder);
