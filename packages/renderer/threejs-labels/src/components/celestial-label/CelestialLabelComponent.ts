export class CelestialLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return [
      "data-name",
      "data-distance-formatted",
      "data-speed-formatted",
      "visible",
    ];
  }

  private nameSpan!: HTMLSpanElement;
  private distanceSpan!: HTMLSpanElement;
  private speedSpan!: HTMLSpanElement;
  private lastValues = {
    name: "",
    distance: "",
    speed: "",
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
      <span class="name"></span>
      <span class="distance"></span>
      <br />
      <span class="speed"></span>
    `;

    this.nameSpan = this.shadowRoot.querySelector(".name") as HTMLSpanElement;
    this.distanceSpan = this.shadowRoot.querySelector(
      ".distance",
    ) as HTMLSpanElement;
    this.speedSpan = this.shadowRoot.querySelector(".speed") as HTMLSpanElement;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return; // Skip if no change
    if (!this.isInitialized) return; // Skip if not yet initialized

    switch (name) {
      case "data-name":
        this.updateName(newValue || "Unknown");
        break;
      case "data-distance-formatted":
        this.updateDistance(newValue || "");
        break;
      case "data-speed-formatted":
        this.updateSpeed(newValue || "");
        break;
    }
  }

  private updateName(name: string) {
    if (this.lastValues.name !== name) {
      this.nameSpan.textContent = name;
      this.lastValues.name = name;
    }
  }

  private updateDistance(distance: string) {
    if (this.lastValues.distance !== distance) {
      if (distance) {
        this.distanceSpan.textContent = `⎊ ${distance}`;
        this.distanceSpan.style.display = "inline";
      } else {
        this.distanceSpan.style.display = "none";
      }
      this.lastValues.distance = distance;
    }
  }

  private updateSpeed(speed: string) {
    if (this.lastValues.speed !== speed) {
      if (speed) {
        this.speedSpan.textContent = `⟐ ${speed}`;
        this.speedSpan.style.display = "inline";
      } else {
        this.speedSpan.style.display = "none";
      }
      this.lastValues.speed = speed;
    }
  }

  private render() {
    // Initialize with current attribute values
    const name = this.getAttribute("data-name") || "Unknown";
    const distance = this.getAttribute("data-distance-formatted") || "";
    const speed = this.getAttribute("data-speed-formatted") || "";

    this.updateName(name);
    this.updateDistance(distance);
    this.updateSpeed(speed);
  }
}

export const CELESTIAL_LABEL_TAG = "celestial-label";
