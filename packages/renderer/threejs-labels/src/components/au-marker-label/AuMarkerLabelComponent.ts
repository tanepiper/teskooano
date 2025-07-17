/**
 * A Web Component for showing the AU distance markers within the engine
 * The marker has two properties - for it's value and colour
 */
export class AuMarkerLabelComponent extends HTMLElement {
  static TAG_NAME = "teskooano-au-marker";

  static get observedAttributes() {
    return ["data-au-display-value", "data-color"];
  }

  private textSpan!: HTMLSpanElement;
  private lastValues = {
    auValue: "",
    color: "",
  };
  private isInitialized = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // Don't render during construction - wait for connectedCallback
  }

  connectedCallback() {
    if (!this.isInitialized) {
      this.createElements();
      this.render();
      this.isInitialized = true;
    }
  }

  private createElements() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: #FFA500;
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
      <span class="text"></span>
    `;

    this.textSpan = this.shadowRoot.querySelector(".text") as HTMLSpanElement;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return; // Skip if no change
    if (!this.isInitialized) return; // Skip if not yet initialized

    switch (name) {
      case "data-au-display-value":
        this.updateAuValue(newValue || "0");
        break;
      case "data-color":
        this.updateColor(newValue || "#FFA500");
        break;
    }
  }

  private updateAuValue(auValue: string) {
    if (this.lastValues.auValue !== auValue) {
      this.textSpan.textContent = `${auValue} AU`;
      this.lastValues.auValue = auValue;
    }
  }

  private updateColor(color: string) {
    if (this.lastValues.color !== color) {
      this.style.color = color;
      this.lastValues.color = color;
    }
  }

  private render() {
    // Initialize with current attribute values
    const auValue = this.getAttribute("data-au-display-value") || "0";
    const color = this.getAttribute("data-color") || "#FFA500";

    this.updateAuValue(auValue);
    this.updateColor(color);
  }
}
