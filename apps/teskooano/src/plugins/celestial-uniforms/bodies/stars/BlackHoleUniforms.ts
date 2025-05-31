import { StarUniformsBase } from "./StarUniformsBase"; // Still extends this for consistency, though it's not a typical star
import { baseStyles } from "../../utils/CelestialStyles";

// Placeholder for actual uniform update logic
const updateUniform = (
  starId: string,
  material: string,
  uniform: string,
  value: any,
) => {
  console.log(`Update Uniform: ${starId} - ${material}.${uniform} = ${value}`);
};

export class BlackHoleUniforms extends StarUniformsBase {
  constructor() {
    super();
  }

  protected render(): void {
    if (!this.starData || !this.starProperties) {
      this.shadow.innerHTML =
        "<p>Star data not available (or not a black hole).</p>";
      return;
    }
    const starId = this.starData.id;

    // Black Hole Renderers (Schwarzschild, Kerr) use:
    // - AccretionDiskMaterial
    // - EventHorizonMaterial
    // - GravitationalLensingHelper
    // - Potentially jets (especially for Kerr)

    this.shadow.innerHTML = `
      <style>
        ${baseStyles}
        h4 { margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .uniform-group { margin-bottom: 20px; padding: 10px; border: 1px solid #333; border-radius: 4px; }
      </style>
      <div class="uniform-panel">
        <h4>Black Hole Uniforms (${this.starData.name})</h4>

        <div class="uniform-group">
          <h5>Accretion Disk</h5>
        </div>

        <div class="uniform-group">
          <h5>Event Horizon</h5>
        </div>

        <div class="uniform-group">
          <h5>Jets (if applicable, e.g., Kerr)</h5>
        </div>
        
        <div class="uniform-group">
          <h5>Gravitational Lensing</h5>
          <p style="color: #888;">Lensing effect controls (TODO - likely managed by GravitationalLensingHelper)</p>
        </div>
      </div>
    `;

    const accretionDiskGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(1)",
    );
    const eventHorizonGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(2)",
    );
    const jetsGroup = this.shadow.querySelector(".uniform-group:nth-child(3)");

    if (accretionDiskGroup) {
      accretionDiskGroup.appendChild(
        this.createColorPicker("Disk Inner Color", "#FFA500", (e) => {
          // Hot orange/yellow
          updateUniform(
            starId,
            "AccretionDiskMaterial",
            "innerColor",
            (e.target as HTMLInputElement).value,
          );
        }),
      );
      accretionDiskGroup.appendChild(
        this.createColorPicker("Disk Outer Color", "#FF4500", (e) => {
          // Cooler red/orange
          updateUniform(
            starId,
            "AccretionDiskMaterial",
            "outerColor",
            (e.target as HTMLInputElement).value,
          );
        }),
      );
      accretionDiskGroup.appendChild(
        this.createSlider("Disk Opacity", "0.1", "1", "0.8", "0.01", (e) => {
          updateUniform(
            starId,
            "AccretionDiskMaterial",
            "opacity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      accretionDiskGroup.appendChild(
        this.createSlider(
          "Disk Rotation Speed",
          "0.01",
          "1",
          "0.1",
          "0.01",
          (e) => {
            updateUniform(
              starId,
              "AccretionDiskMaterial",
              "rotationSpeed",
              parseFloat((e.target as HTMLInputElement).value),
            ); // Or 'timeScale'
          },
        ),
      );
      // Add controls for texture scale, noise, etc. if applicable to AccretionDiskMaterial
    }

    if (eventHorizonGroup) {
      eventHorizonGroup.appendChild(
        this.createColorPicker(
          "Horizon Edge Color (subtle glow)",
          "#111111",
          (e) => {
            updateUniform(
              starId,
              "EventHorizonMaterial",
              "edgeColor",
              (e.target as HTMLInputElement).value,
            );
          },
        ),
      );
      eventHorizonGroup.appendChild(
        this.createSlider(
          "Horizon Distortion Scale",
          "0",
          "1",
          "0.5",
          "0.01",
          (e) => {
            updateUniform(
              starId,
              "EventHorizonMaterial",
              "distortionScale",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      // EventHorizonMaterial is often a very dark sphere or a distortion effect.
      // The ARCHITECTURE.md doesn't specify its uniforms, so these are guesses.
    }

    if (jetsGroup) {
      // Similar to Neutron Star jets but potentially more powerful/different appearance
      // These uniforms would apply if the black hole has a PulsarJetMaterial or similar
      jetsGroup.appendChild(
        this.createColorPicker("Jet Color", "#ADD8E6", (e) => {
          updateUniform(
            starId,
            "BlackHoleJetMaterial",
            "jetColor",
            (e.target as HTMLInputElement).value,
          );
        }),
      );
      jetsGroup.appendChild(
        this.createSlider("Jet Intensity", "0", "10", "2", "0.1", (e) => {
          updateUniform(
            starId,
            "BlackHoleJetMaterial",
            "intensity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      jetsGroup.appendChild(
        this.createSlider("Jet Speed", "0.1", "20", "2", "0.1", (e) => {
          updateUniform(
            starId,
            "BlackHoleJetMaterial",
            "timeScale",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      // Check if KerrBlackHoleRenderer.ts has specific jet material/uniforms
      const kerrNote = document.createElement("p");
      kerrNote.textContent =
        "Jet controls primarily for Kerr black holes (TODO: check specific uniforms)";
      kerrNote.style.color = "#888";
      jetsGroup.appendChild(kerrNote);
    }
  }
}

customElements.define("black-hole-uniforms", BlackHoleUniforms);
