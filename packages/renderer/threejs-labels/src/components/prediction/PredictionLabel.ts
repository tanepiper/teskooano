const styles = `
:host {
  display: block;
  position: relative;
  top: -1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-family: sans-serif;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  border: 1px solid #000000;
  opacity: 0.5;
}

:host([data-time-category="short"]) {
  background-color: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.8);
  color: rgba(204, 235, 206, 1);
}

:host([data-time-category="medium"]) {
  background-color: rgba(255, 235, 59, 0.2);
  border-color: rgba(255, 235, 59, 0.8);
  color: rgba(255, 249, 196, 1);
}

:host([data-time-category="long"]) {
  background-color: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.8);
  color: rgba(251, 204, 201, 1);
}
`;

export class PredictionLabel extends HTMLElement {
  private shadow: ShadowRoot;
  private textSpan: HTMLSpanElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = styles;
    this.shadow.appendChild(style);

    this.textSpan = document.createElement("span");
    this.shadow.appendChild(this.textSpan);
  }

  setText(text: string): void {
    this.textSpan.textContent = text;
  }

  setTimeCategory(timeInSeconds: number) {
    const ONE_DAY = 86400;
    const NINETY_DAYS = ONE_DAY * 90;

    if (timeInSeconds < ONE_DAY) {
      this.dataset.timeCategory = "short";
    } else if (timeInSeconds < NINETY_DAYS) {
      this.dataset.timeCategory = "medium";
    } else {
      this.dataset.timeCategory = "long";
    }
  }
}
