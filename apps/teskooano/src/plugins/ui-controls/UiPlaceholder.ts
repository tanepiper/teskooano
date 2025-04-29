// Vanilla Web Component for UI Placeholder

const uiTemplate = document.createElement("template");
uiTemplate.innerHTML = `
  <style>
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      background-color: var(--color-background-alt);
      color: var(--color-text-secondary);
      font-style: italic;
      padding: var(--space-md);
      box-sizing: border-box;
      opacity: 0;
      animation: fadeIn 0.5s 0.2s ease-in forwards; /* Slight delay */
    }

    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }
  </style>
  <div>
    Waiting for controls data...
  </div>
`;

class UiPlaceholder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(uiTemplate.content.cloneNode(true));
  }
}

customElements.define("ui-placeholder", UiPlaceholder);
