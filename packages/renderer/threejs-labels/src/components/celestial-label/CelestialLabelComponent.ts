export class CelestialLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-name", "data-distance-formatted", "data-speed-formatted"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "data-name" && oldValue !== newValue) ||
      (name === "data-distance-formatted" && oldValue !== newValue) ||
      (name === "data-speed-formatted" && oldValue !== newValue)
    ) {
      this.render();
    }
  }

  private render() {
    const name = this.getAttribute("data-name") || "Unknown";
    const distanceText = this.getAttribute("data-distance-formatted");
    const speedText = this.getAttribute("data-speed-formatted");

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: relative;
            font-family: monospace;
            left: 50px;
            top: -20px;
            display: block;
            color: white;
            background-color: rgba(0,0,0,0.5);
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: bold;
            user-select: none;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }

          .distance {
            font-size: 0.8rem;
            color: #ccc;
            margin-left: 8px;
          }

          .speed {
            font-size: 0.8rem;
            color: #aaf;
            margin-left: 8px;
          }

          :host(:not([visible])) {
            opacity: 0;
          }
        </style>
        <span>${name}</span>
        ${distanceText ? `<span class="distance">⎊ ${distanceText}</span>` : ""}
        <br />
        ${speedText ? `<span class="speed">⟐ ${speedText}</span>` : ""}
      `;
    }
  }
}

export const CELESTIAL_LABEL_TAG = "celestial-label";
