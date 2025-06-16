export class CelestialLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-name", "data-distance-formatted"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "data-name" && oldValue !== newValue) ||
      (name === "data-distance-formatted" && oldValue !== newValue)
    ) {
      this.render();
    }
  }

  private render() {
    const name = this.getAttribute("data-name") || "Unknown";
    const distanceText = this.getAttribute("data-distance-formatted");

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
            user-select: none;
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }

          .distance {
            font-size: 0.8em;
            color: #ccc;
            margin-left: 8px;
          }

          :host(:not([visible])) {
            opacity: 0;
            pointer-events: none;
          }
        </style>
        <span>${name}</span>
        ${distanceText ? `<span class="distance">${distanceText}</span>` : ""}
      `;
    }
  }
}

export const CELESTIAL_LABEL_TAG = "celestial-label";
