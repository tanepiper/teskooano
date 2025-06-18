import type { CelestialIconConfig } from "../../types.js";
import { template } from "./celestial-icon.template.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class CelestialIconComponent extends HTMLElement {
  private _config: CelestialIconConfig | null = null;
  private layers: SVGGElement | null = null;
  private radialGradient: SVGRadialGradientElement | null = null;
  private proceduralGradient: SVGLinearGradientElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.layers = this.shadowRoot!.querySelector(".icon-layers");
    this.radialGradient = this.shadowRoot!.querySelector("#planet-gradient");
    this.proceduralGradient = this.shadowRoot!.querySelector(
      "#procedural-gradient",
    );
  }

  static get observedAttributes(): string[] {
    return ["config"];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "config" && newValue) {
      try {
        const parsedConfig = JSON.parse(newValue);
        this.setConfig(parsedConfig);
      } catch (e) {
        console.error("Failed to parse celestial-icon config:", e);
        this.clear();
      }
    }
  }

  public setConfig(config: CelestialIconConfig): void {
    this._config = config;
    this.renderIcon();
  }

  private clear(): void {
    if (this.layers) {
      this.layers.innerHTML = "";
    }
  }

  /**
   * Generates color stops for the procedural gradient based on surface properties.
   */
  private generateProceduralGradient(): void {
    if (!this.proceduralGradient || !this._config?.procedural) return;

    // Clear previous stops
    this.proceduralGradient.innerHTML = "";

    const { procedural } = this._config;
    const stops = [
      { color: procedural.color1, offset: procedural.height1 },
      { color: procedural.color2, offset: procedural.height2 },
      { color: procedural.color3, offset: procedural.height3 },
      { color: procedural.color4, offset: procedural.height4 },
      { color: procedural.color5, offset: procedural.height5 },
    ];

    // Ensure stops are sorted by offset and clamped between 0 and 1
    const sortedStops = stops
      .map((s) => ({ ...s, offset: Math.max(0, Math.min(1, s.offset)) }))
      .sort((a, b) => a.offset - b.offset);

    for (const stop of sortedStops) {
      const stopEl = document.createElementNS(SVG_NS, "stop");
      stopEl.setAttribute("offset", `${stop.offset * 100}%`);
      stopEl.setAttribute("stop-color", stop.color);
      this.proceduralGradient.appendChild(stopEl);
    }
  }

  private renderIcon(): void {
    this.clear();
    if (!this._config || !this.layers) return;

    const { base, rings, atmosphere, procedural } = this._config;

    // If there is a glow effect, we need to scale down the entire group
    // to ensure the final rendered icon is the same size as others.
    if (atmosphere) {
      // The glow is a stroke on a circle of radius 11. The stroke is centered,
      // so half its width extends outwards. Total visual radius = 11 + (size / 2).
      // We scale it down so the final visual radius is ~11.5 (to fit in the 24x24 box).
      const visualRadius = 11 + atmosphere.size / 2;
      const targetRadius = 11.5;
      const scale = targetRadius / visualRadius;

      // When scaling from the center, we need to translate to keep it centered.
      const translate = 12 - 12 * scale;
      this.layers.setAttribute(
        "transform",
        `translate(${translate}, ${translate}) scale(${scale})`,
      );
    } else {
      this.layers.removeAttribute("transform");
    }

    if (procedural) {
      this.generateProceduralGradient();
    }

    // 1. Render atmosphere (bottom layer)
    if (atmosphere) {
      const atmo = document.createElementNS(SVG_NS, "circle");
      atmo.setAttribute("class", "atmosphere");
      atmo.setAttribute("cx", "12");
      atmo.setAttribute("cy", "12");
      atmo.setAttribute("r", "11");
      atmo.style.stroke = atmosphere.color;
      atmo.style.strokeWidth = `${atmosphere.size}px`;
      this.layers.appendChild(atmo);
    }

    // 2. Render base planet/star (middle layer)
    const body = document.createElementNS(SVG_NS, "circle");
    body.setAttribute("class", "planet-base");
    body.setAttribute("cx", "12");
    body.setAttribute("cy", "12");
    body.setAttribute("r", "8");

    if (procedural) {
      body.setAttribute("fill", "url(#procedural-gradient)");
    } else if (base.gradient && this.radialGradient) {
      const [start, end] = base.gradient;
      const stops = this.radialGradient.querySelectorAll("stop");
      stops[0].setAttribute("stop-color", start);
      stops[1].setAttribute("stop-color", end);
      body.setAttribute("fill", "url(#planet-gradient)");
    } else {
      body.setAttribute("fill", base.color);
    }
    this.layers.appendChild(body);

    // 3. Render rings (top layer)
    if (rings) {
      const ring = document.createElementNS(SVG_NS, "ellipse");
      ring.setAttribute("class", "rings");
      ring.setAttribute("cx", "12");
      ring.setAttribute("cy", "12");
      ring.setAttribute("rx", "10");
      ring.setAttribute("ry", "4");
      ring.setAttribute("transform", `rotate(${rings.angle} 12 12)`);
      ring.style.stroke = rings.color;
      this.layers.appendChild(ring);
    }
  }
}
