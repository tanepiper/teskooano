import * as THREE from "three"; // Keep for potential future use with complex line drawing

const sciFiLabelStyles = `
:host {
  /* Design Tokens (Scientific Theme) */
  --scientific-font-family: Arial, sans-serif;
  --scientific-text-color: #cccccc; /* Light Grey */
  --scientific-background-color: rgba(40, 40, 40, 0.9); /* Dark Grey */
  --scientific-border-color: #666666; /* Medium Grey */
  --scientific-line-color: #c019a7; /* Medium Grey */
  --scientific-accent-color: #ffffff; /* Calm Blue */

  --scientific-font-size-tiny: 0.5em;
  --scientific-font-size-small: 0.6em;
  --scientific-font-size-normal: 0.8em;
  --scientific-font-size-large: 1em;

  --scientific-padding-small: 0.5rem;
  --scientific-padding-medium: 1rem;
  --scientific-border-radius: 1rem;

  /* Styles for the component host itself */
  position: absolute; /* Crucial for CSS2DObject positioning */
  font-family: var(--scientific-font-family);
  color: var(--scientific-text-color);
  pointer-events: none; /* Labels should not intercept mouse events by default */
  display: flex;
  align-items: center; /* Align line and content box */
  opacity: 1;
  white-space: nowrap;
  left: 200px; /* Default position for full mode */
}

:host(.minimal-mode) {
  top: -5px;
  left: 95px; /* Adjusted for longer line: 75px line + 8px margin + 2px for visual balance */
}

:host(.minimal-mode) .scifi-label-content {
  padding: var(--scientific-padding-small); /* Smaller padding for minimal mode */
}

:host(.minimal-mode) .scifi-label-type {
  display: none; /* Type is always hidden in minimal mode */
}

/* Distance is now visible in minimal mode, so no specific display:none for it here */
:host(.minimal-mode) .scifi-label-distance {
  font-size: var(--scientific-font-size-small); /* Ensure style consistency if it was hidden */
  margin-bottom: 0; /* No margin if it's the last item */
}

.scifi-label-line {
  width: 50px; /* Default length for full mode (if we decide to show it) */
  height: 1px;
  background-color: var(--scientific-line-color);
  margin-right: var(--scientific-padding-medium); /* Space between line and content */
  display: none; /* Typically hidden in full mode, shown in minimal */
  transform: rotate(-5deg);
  opacity: 0.5;
  box-shadow: 0 0 10px var(--scifi-border-color); 
}

:host(.minimal-mode) .scifi-label-line {
  display: block;
  width: 75px; /* Longer line for minimal mode */
}

.scifi-label-outer-shell {
  position: relative;
  left: -18px;
  border: 1px solid var(--scientific-border-color);
  border-radius: var(--scientific-border-radius);
  box-shadow: 0 0 10px var(--scifi-border-color); 
  background-color: transparent;
  overflow: hidden;
}

.scifi-label-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  background-color: rgba(0, 0, 0, 0.5);
  padding: var(--scientific-padding-medium);
}

:host(.minimal-mode) .scifi-label-content {
  padding-top: 0;
  padding-bottom: 0;
  padding-left: var(--scientific-padding-medium);
  padding-right: var(--scientific-padding-medium);
}

.scifi-label-name {
  font-size: var(--scientific-font-size-small);
  color: var(--scientific-accent-color);
}

.scifi-label-type,
.scifi-label-distance {
  font-size: var(--scientific-font-size-small);
  margin-bottom: var(--scientific-padding-small);
}

:host(.minimal-mode) .scifi-label-type,
:host(.minimal-mode) .scifi-label-distance {
  font-size: var(--scientific-font-size-small);
  margin-bottom: 0;
}

.scifi-label-distance {
  margin-bottom: 0; /* No margin for the last element */
}

.scifi-label-minimal {
  /* background-color: var(--scientific-background-color); */
  display: flex;
  flex-direction: column;
}

:host(.hidden) {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8); /* Example: shrink when hidden */
}
`;

const sciFiLabelTemplate = document.createElement("template");
sciFiLabelTemplate.innerHTML = `
  <style>
    ${sciFiLabelStyles}
  </style>
  <div class="scifi-label-line"></div>
  <div class="scifi-label-outer-shell">
    <div class="scifi-label-content">
      <div class="scifi-label-minimal">
        <div class="scifi-label-name"></div>
        <div class="scifi-label-distance"></div>
      </div>
      <div class="scifi-label-full">
        <div class="scifi-label-type"></div>
      </div>
    </div>
  </div>
`;

export type SciFiLabelMode = "full" | "minimal";

export class SciFiLabelComponent extends HTMLElement {
  private nameElement: HTMLElement | null = null;
  private typeElement: HTMLElement | null = null;
  private distanceElement: HTMLElement | null = null;
  private currentMode: SciFiLabelMode = "full";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(sciFiLabelTemplate.content.cloneNode(true));
      this.nameElement = this.shadowRoot.querySelector(".scifi-label-name");
      this.typeElement = this.shadowRoot.querySelector(".scifi-label-type");
      this.distanceElement = this.shadowRoot.querySelector(
        ".scifi-label-distance",
      );
    }
  }

  public updateData(
    name: string,
    type: string | null, // Type can be null in minimal mode
    distanceAU: number | null, // Distance can be null in minimal mode
    mode: SciFiLabelMode,
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

  // connectedCallback() {
  // Initial data can be set here from attributes if needed
  // }

  // attributeChangedCallback(name, oldValue, newValue) {
  // Respond to attribute changes if you use them for data
  // }

  // static get observedAttributes() {
  // return ['name', 'type', 'distance']; // Example attributes
  // }

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

// Register the custom element
// It's important this runs only once.
// We can place it here or in a more central UI initialization file.
if (!customElements.get("scifi-label")) {
  customElements.define("scifi-label", SciFiLabelComponent);
}
