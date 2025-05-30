/**
 * Custom element that displays relative time (e.g., "5m ago", "2h 30m ago").
 * Updates automatically every minute.
 *
 * @element relative-time
 *
 * @example
 * ```html
 * <relative-time timestamp="1640995200000"></relative-time>
 * ```
 */
export class RelativeTime extends HTMLElement {
  static observedAttributes = ["timestamp"];

  private _timestamp: number = 0;
  private _updateInterval: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline;
        font-size: var(--font-size-1);
        color: var(--color-text-secondary);
        white-space: nowrap;
      }
    `;

    const span = document.createElement("span");
    span.id = "time-display";

    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(span);
  }

  connectedCallback() {
    this._updateDisplay();
    // Update every minute
    this._updateInterval = window.setInterval(() => {
      this._updateDisplay();
    }, 60000);
  }

  disconnectedCallback() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "timestamp" && newValue) {
      this._timestamp = parseInt(newValue, 10);
      this._updateDisplay();
    }
  }

  private _updateDisplay(): void {
    const display = this.shadowRoot!.getElementById("time-display");
    if (!display) return;

    if (!this._timestamp) {
      display.textContent = "";
      return;
    }

    const now = Date.now();
    const elapsedMs = now - this._timestamp;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    if (elapsedSeconds < 60) {
      display.textContent = `${elapsedSeconds}s ago`;
    } else if (elapsedSeconds < 3600) {
      const minutes = Math.floor(elapsedSeconds / 60);
      display.textContent = `${minutes}m ago`;
    } else {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      display.textContent = `${hours}h ${minutes}m ago`;
    }
  }

  /**
   * Sets the timestamp programmatically
   */
  setTimestamp(timestamp: number): void {
    this._timestamp = timestamp;
    this.setAttribute("timestamp", timestamp.toString());
  }
}

// Register the custom element
customElements.define("relative-time", RelativeTime);
