import { StarUniformsBase } from "./StarUniformsBase";
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

export class PostMainSequenceStarUniforms extends StarUniformsBase {
  constructor() {
    super();
  }

  protected render(): void {
    if (!this.starData || !this.starProperties) {
      this.shadow.innerHTML = "<p>Star data not available.</p>";
      return;
    }
    const starId = this.starData.id;

    this.shadow.innerHTML = `
      <style>
        ${baseStyles}
        h4 { margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .uniform-group { margin-bottom: 20px; padding: 10px; border: 1px solid #333; border-radius: 4px; }
      </style>
      <div class="uniform-panel">
        <h4>Post-Main Sequence Star Uniforms (${this.starData.name})</h4>
        <p style="font-style: italic; color: #aaa;">Uniforms for Giants, Supergiants, Hypergiants.</p>
        <div class="uniform-group">
          <h5>General Star Properties (Surface)</h5>
        </div>
        <div class="uniform-group">
          <h5>General Corona Properties (Extended Atmosphere)</h5>
        </div>
      </div>
    `;

    const surfaceGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(2)",
    );
    const coronaGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(3)",
    );

    if (surfaceGroup) {
      surfaceGroup.appendChild(
        this.createColorPicker(
          "Star Color",
          this.starProperties.color || "#FFB347",
          (e) => {
            // Default to an evolved star color (e.g., orange)
            updateUniform(
              starId,
              "BaseStarMaterial",
              "starColor",
              (e.target as HTMLInputElement).value,
            );
          },
        ),
      );
      surfaceGroup.appendChild(
        this.createSlider(
          "Corona Intensity (Atmosphere)",
          "0",
          "10",
          "2",
          "0.1",
          (e) => {
            // Potentially more intense/larger atmosphere
            updateUniform(
              starId,
              "BaseStarMaterial",
              "coronaIntensity",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      surfaceGroup.appendChild(
        this.createSlider(
          "Pulse Speed (Variability)",
          "0.05",
          "1",
          "0.2",
          "0.01",
          (e) => {
            // Often variable, but maybe slower pulsations
            updateUniform(
              starId,
              "BaseStarMaterial",
              "pulseSpeed",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      surfaceGroup.appendChild(
        this.createSlider("Glow Intensity", "0", "5", "1.5", "0.1", (e) => {
          updateUniform(
            starId,
            "BaseStarMaterial",
            "glowIntensity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      surfaceGroup.appendChild(
        this.createSlider(
          "Temperature Variation",
          "0",
          "0.5",
          "0.1",
          "0.01",
          (e) => {
            // Less surface turbulence, more large scale convection
            updateUniform(
              starId,
              "BaseStarMaterial",
              "temperatureVariation",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      // Metallic effect might be less relevant or different for these types
    }

    if (coronaGroup) {
      coronaGroup.appendChild(
        this.createColorPicker(
          "Atmosphere Color",
          this.starProperties.color || "#FFB347",
          (e) => {
            updateUniform(
              starId,
              "CoronaMaterial",
              "starColor",
              (e.target as HTMLInputElement).value,
            );
          },
        ),
      );
      coronaGroup.appendChild(
        this.createSlider(
          "Atmosphere Opacity",
          "0",
          "1",
          "0.4",
          "0.01",
          (e) => {
            updateUniform(
              starId,
              "CoronaMaterial",
              "opacity",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      coronaGroup.appendChild(
        this.createSlider(
          "Atmosphere Pulse Speed",
          "0.05",
          "1",
          "0.3",
          "0.01",
          (e) => {
            updateUniform(
              starId,
              "CoronaMaterial",
              "pulseSpeed",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      coronaGroup.appendChild(
        this.createSlider(
          "Atmosphere Noise Scale (Convection Cells)",
          "0.5",
          "10",
          "3",
          "0.1",
          (e) => {
            // Larger scale features
            updateUniform(
              starId,
              "CoronaMaterial",
              "noiseScale",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
    }
    // Placeholder for mass loss effects, specific giant phenomena
    const specificGroup = document.createElement("div");
    specificGroup.className = "uniform-group";
    specificGroup.innerHTML = `<h5>Evolutionary Features</h5> <p style="color: #888;">Controls for mass loss, envelope instability etc. (TODO)</p>`;
    this.shadow.querySelector(".uniform-panel")?.appendChild(specificGroup);
  }
}

customElements.define(
  "post-main-sequence-star-uniforms",
  PostMainSequenceStarUniforms,
);
