export class AuMarkerLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-au-display-value", "data-color"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "data-au-display-value" && oldValue !== newValue) ||
      (name === "data-color" && oldValue !== newValue)
    ) {
      this.render();
    }
  }

  private render() {
    const auValue = this.getAttribute("data-au-display-value") || "0";
    const color = this.getAttribute("data-color") || "#FFA500";
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            color: ${color};
            background-color: rgba(0,0,0,0.6);
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 12px;
            user-select: none;
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }

          :host(:not([visible])) {
            opacity: 0;
            pointer-events: none;
          }
        </style>
        <span>${auValue} AU</span>
      `;
    }
  }
}

export const AU_MARKER_LABEL_TAG = "au-marker-label";
