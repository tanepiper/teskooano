import { CelestialObject, StarProperties } from "@teskooano/data-types";
import { Subscription } from "rxjs";

export abstract class StarUniformsBase extends HTMLElement {
  protected shadow: ShadowRoot;
  protected starData: CelestialObject | null = null;
  protected starProperties: StarProperties | null = null;
  protected activeInputSubscriptions: Subscription[] = [];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  public updateStarData(celestial: CelestialObject): void {
    this.cleanupSubscriptions(); // Clean up before rendering new data
    if (celestial.properties && "stellarType" in celestial.properties) {
      this.starData = celestial;
      this.starProperties = celestial.properties as StarProperties;
      this.render();
    } else {
      console.warn(
        "StarUniformsBase received data that is not a star or lacks StarProperties.",
      );
      this.starData = null;
      this.starProperties = null;
      this.shadow.innerHTML = "<p>Invalid star data provided.</p>";
    }
  }

  protected abstract render(): void;

  protected cleanupSubscriptions(): void {
    this.activeInputSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeInputSubscriptions = [];
  }

  disconnectedCallback(): void {
    this.cleanupSubscriptions();
  }

  // Helper to create a slider, for example
  protected createSlider(
    label: string,
    min: string,
    max: string,
    value: string,
    step: string,
    callback: (event: Event) => void,
  ): HTMLElement {
    const container = document.createElement("div");
    container.style.marginBottom = "10px";
    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.style.display = "block";
    labelEl.style.marginBottom = "5px";

    const sliderEl = document.createElement("input");
    sliderEl.type = "range";
    sliderEl.min = min;
    sliderEl.max = max;
    sliderEl.value = value;
    sliderEl.step = step;
    sliderEl.addEventListener("input", callback);

    container.appendChild(labelEl);
    container.appendChild(sliderEl);
    return container;
  }

  // Helper to create a color picker
  protected createColorPicker(
    label: string,
    value: string,
    callback: (event: Event) => void,
  ): HTMLElement {
    const container = document.createElement("div");
    container.style.marginBottom = "10px";
    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.style.display = "block";
    labelEl.style.marginBottom = "5px";

    const colorPickerEl = document.createElement("input");
    colorPickerEl.type = "color";
    colorPickerEl.value = value;
    colorPickerEl.addEventListener("input", callback);

    container.appendChild(labelEl);
    container.appendChild(colorPickerEl);
    return container;
  }
}
