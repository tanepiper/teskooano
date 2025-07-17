/**
 * A Web Component for showing the AU distance markers within the engine
 * The marker has two properties - for it's value and colour
 */
export class AuMarkerLabelComponent extends HTMLElement {
  static TAG_NAME = "teskooano-au-marker";

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
            background-color: #444;
            border: 1px solid #000;
            opacity: 0.5;
            padding: 2px 5px;
            border-radius: 1rem;
            font-size: 0.6rem;
            user-select: none;
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
