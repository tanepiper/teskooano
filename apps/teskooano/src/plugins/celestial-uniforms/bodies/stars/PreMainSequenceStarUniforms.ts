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

export class PreMainSequenceStarUniforms extends StarUniformsBase {
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
        <h4>Pre-Main Sequence Star Uniforms (${this.starData.name})</h4>
        <p style="font-style: italic; color: #aaa;">Specific uniforms for Protostars, T-Tauri, Herbig Ae/Be types will be added here.</p>
        <div class="uniform-group">
          <h5>General Star Properties (Surface)</h5>
        </div>
        <div class="uniform-group">
          <h5>General Corona Properties</h5>
        </div>
      </div>
    `;

    const surfaceGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(2)",
    );
    const coronaGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(3)",
    );

    // Common controls, similar to MainSequence for now
    if (surfaceGroup) {
      surfaceGroup.appendChild(
        this.createColorPicker(
          "Star Color",
          this.starProperties.color || "#FFDAB9",
          (e) => {
            // Default to a younger star color
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
        this.createSlider("Corona Intensity", "0", "5", "1.5", "0.1", (e) => {
          // Slightly higher default
          updateUniform(
            starId,
            "BaseStarMaterial",
            "coronaIntensity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      surfaceGroup.appendChild(
        this.createSlider("Pulse Speed", "0.1", "3", "0.8", "0.05", (e) => {
          // More active
          updateUniform(
            starId,
            "BaseStarMaterial",
            "pulseSpeed",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      // Add other relevant BaseStarMaterial uniforms if needed
    }

    if (coronaGroup) {
      coronaGroup.appendChild(
        this.createColorPicker(
          "Corona Color",
          this.starProperties.color || "#FFDAB9",
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
        this.createSlider("Corona Opacity", "0", "1", "0.6", "0.01", (e) => {
          // More visible corona
          updateUniform(
            starId,
            "CoronaMaterial",
            "opacity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      coronaGroup.appendChild(
        this.createSlider(
          "Corona Pulse Speed",
          "0.1",
          "3",
          "1.0",
          "0.05",
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
          "Corona Noise Scale",
          "0.1",
          "5",
          "1.2",
          "0.1",
          (e) => {
            // More pronounced noise
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
    // Placeholder for accretion disk, jets for specific pre-main sequence types
    if (
      this.starProperties.stellarType === "PROTOSTAR" ||
      this.starProperties.stellarType === "T_TAURI"
    ) {
      const specificGroup = document.createElement("div");
      specificGroup.className = "uniform-group";
      specificGroup.innerHTML = `<h5>Accretion / Activity</h5> <p style="color: #888;">Controls for accretion disk, jets etc. (TODO)</p>`;
      this.shadow.querySelector(".uniform-panel")?.appendChild(specificGroup);
    }
  }
}

customElements.define(
  "pre-main-sequence-star-uniforms",
  PreMainSequenceStarUniforms,
);
