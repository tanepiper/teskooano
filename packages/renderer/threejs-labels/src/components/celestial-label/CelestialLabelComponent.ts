export class CelestialLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-name"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "data-name" && oldValue !== newValue) {
      this.render();
    }
  }

  private render() {
    const name = this.getAttribute("data-name") || "Unknown";
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            color: white;
            background-color: rgba(0,0,0,0.5);
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 12px;
            pointer-events: none;
            user-select: none;
          }
        </style>
        <span>${name}</span>
      `;
    }
  }
}

export const CELESTIAL_LABEL_TAG = "celestial-label";
