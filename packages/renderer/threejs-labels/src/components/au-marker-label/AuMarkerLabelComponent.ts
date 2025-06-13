export class AuMarkerLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-au-value", "data-color"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "data-au-value" && oldValue !== newValue) ||
      (name === "data-color" && oldValue !== newValue)
    ) {
      this.render();
    }
  }

  private render() {
    const auValue = this.getAttribute("data-au-value") || "0";
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
            pointer-events: none;
            user-select: none;
          }
        </style>
        <span>${auValue} AU</span>
      `;
    }
  }
}

export const AU_MARKER_LABEL_TAG = "au-marker-label";
