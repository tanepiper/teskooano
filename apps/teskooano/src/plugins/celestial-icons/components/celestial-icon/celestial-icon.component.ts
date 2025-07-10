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

  /**
   * Creates a pulsar effect with animated beams
   */
  private createPulsarEffect(): void {
    if (!this.layers) return;

    // Create pulsar beams
    for (let i = 0; i < 4; i++) {
      const beam = document.createElementNS(SVG_NS, "line");
      beam.setAttribute("class", "pulsar-beam");
      beam.setAttribute("x1", "12");
      beam.setAttribute("y1", "12");
      beam.setAttribute("x2", "12");
      beam.setAttribute("y2", "2");
      beam.setAttribute("stroke", "#FFFFFF");
      beam.setAttribute("stroke-width", "1");
      beam.setAttribute("opacity", "0.8");
      beam.setAttribute("transform", `rotate(${i * 90} 12 12)`);
      this.layers.appendChild(beam);
    }
  }

  /**
   * Creates a black hole effect with accretion disk
   */
  private createBlackHoleEffect(): void {
    if (!this.layers) return;

    // Create accretion disk
    const disk = document.createElementNS(SVG_NS, "ellipse");
    disk.setAttribute("class", "black-hole-disk");
    disk.setAttribute("cx", "12");
    disk.setAttribute("cy", "12");
    disk.setAttribute("rx", "10");
    disk.setAttribute("ry", "3");
    disk.setAttribute("fill", "none");
    disk.setAttribute("stroke", "#FF6B6B");
    disk.setAttribute("stroke-width", "1");
    disk.setAttribute("opacity", "0.6");
    this.layers.appendChild(disk);

    // Create inner event horizon
    const horizon = document.createElementNS(SVG_NS, "circle");
    horizon.setAttribute("class", "black-hole-horizon");
    horizon.setAttribute("cx", "12");
    horizon.setAttribute("cy", "12");
    horizon.setAttribute("r", "2");
    horizon.setAttribute("fill", "#000000");
    horizon.setAttribute("stroke", "#333333");
    horizon.setAttribute("stroke-width", "0.5");
    this.layers.appendChild(horizon);
  }

  /**
   * Creates a white dwarf effect with subtle glow
   */
  private createWhiteDwarfEffect(): void {
    if (!this.layers) return;

    // Create inner core glow
    const core = document.createElementNS(SVG_NS, "circle");
    core.setAttribute("class", "white-dwarf-core");
    core.setAttribute("cx", "12");
    core.setAttribute("cy", "12");
    core.setAttribute("r", "2");
    core.setAttribute("fill", "#FFFFFF");
    core.setAttribute("opacity", "0.9");
    this.layers.appendChild(core);
  }

  /**
   * Creates a protostar effect with irregular shape
   */
  private createProtostarEffect(): void {
    if (!this.layers) return;

    // Create irregular protostar shape
    const protostar = document.createElementNS(SVG_NS, "path");
    protostar.setAttribute("class", "protostar-shape");
    protostar.setAttribute(
      "d",
      "M 12,8 Q 14,10 12,12 Q 10,14 12,16 Q 14,14 12,12 Q 14,10 12,8",
    );
    protostar.setAttribute("fill", "#FF8A4A");
    protostar.setAttribute("opacity", "0.8");
    this.layers.appendChild(protostar);
  }

  private renderIcon(): void {
    this.clear();
    if (!this._config || !this.layers) return;

    const { base, rings, atmosphere, procedural, tail, special } = this._config;

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

    // 2. Render comet tail
    if (tail) {
      const tailPath = document.createElementNS(SVG_NS, "path");
      tailPath.setAttribute("class", "comet-tail");

      // Create a teardrop/triangle shape for the tail
      const tailLength = tail.length || 10;
      const tailWidth = 5;
      const d = `M 12,12 L ${12 + tailLength},${12 - tailWidth / 2} L ${
        12 + tailLength
      },${12 + tailWidth / 2} Z`;

      tailPath.setAttribute("d", d);
      tailPath.setAttribute("fill", tail.color);
      tailPath.setAttribute("transform", `rotate(${tail.angle} 12 12)`);
      this.layers.appendChild(tailPath);
    }

    // 3. Render special effects for exotic stars
    if (special) {
      switch (special) {
        case "pulsar":
          this.createPulsarEffect();
          break;
        case "black-hole":
          this.createBlackHoleEffect();
          break;
        case "white-dwarf":
          this.createWhiteDwarfEffect();
          break;
        case "protostar":
          this.createProtostarEffect();
          break;
      }
    }

    // 4. Render base planet/star (middle layer)
    const body = document.createElementNS(SVG_NS, "circle");
    body.setAttribute("class", "planet-base");
    body.setAttribute("cx", "12");
    body.setAttribute("cy", "12");

    const radius = base.radius ?? 8;
    body.setAttribute("r", String(radius));

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

    // 5. Render rings (top layer)
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
