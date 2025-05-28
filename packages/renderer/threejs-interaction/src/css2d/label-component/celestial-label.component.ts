import { celestialLabelTemplate } from "./celestial-label.template";

export type CelestialLabelMode = "full" | "minimal";

export class CelestialLabelComponent extends HTMLElement {
  private nameElement: HTMLElement | null = null;
  private typeElement: HTMLElement | null = null;
  private distanceElement: HTMLElement | null = null;
  private currentMode: CelestialLabelMode = "full";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(
        celestialLabelTemplate.content.cloneNode(true),
      );
      this.nameElement = this.shadowRoot.querySelector(".celestial-label-name");
      this.typeElement = this.shadowRoot.querySelector(".celestial-label-type");
      this.distanceElement = this.shadowRoot.querySelector(
        ".celestial-label-distance",
      );
    }
  }

  public updateData(
    name: string,
    type: string | null, // Type can be null in minimal mode
    distanceAU: number | null, // Distance can be null in minimal mode
    mode: CelestialLabelMode,
  ): void {
    this.currentMode = mode;

    if (this.nameElement) {
      this.nameElement.textContent = name;
    }

    // Distance is now shown in minimal mode
    if (this.distanceElement) {
      this.distanceElement.textContent = `${distanceAU !== null ? distanceAU.toFixed(2) : "N/A"} AU`;
      this.distanceElement.style.display = ""; // Make sure it's displayed
    }

    if (mode === "full") {
      this.classList.remove("minimal-mode");
      if (this.typeElement) {
        this.typeElement.textContent = `Type: ${type || "N/A"}`;
        this.typeElement.style.display = "";
      }

      if (this.nameElement) {
        // ensure margin is correct for full mode
        this.nameElement.style.marginBottom = "var(--scientific-padding-small)";
      }
    } else {
      // Minimal mode
      this.classList.add("minimal-mode");
      if (this.typeElement) {
        this.typeElement.style.display = "none"; // Type is hidden
      }

      if (this.nameElement) {
        // Name is followed by distance, so it needs its bottom margin
        this.nameElement.style.marginBottom = "var(--scientific-padding-small)";
      }
    }
  }

  public setVisibility(visible: boolean): void {
    if (visible) {
      this.classList.remove("hidden");
      this.style.opacity = "1";
      this.style.visibility = "visible";
      this.style.transform = "scale(1)";
    } else {
      this.classList.add("hidden");
      this.style.opacity = "0";
      this.style.visibility = "hidden";
      this.style.transform = "scale(0.8)";
    }
  }
}

if (!customElements.get("celestial-label")) {
  customElements.define("celestial-label", CelestialLabelComponent);
}
