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

export class EvolvedSpecialStarUniforms extends StarUniformsBase {
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
        <h4>Evolved & Special Star Uniforms (${this.starData.name})</h4>
        <p style="font-style: italic; color: #aaa;">Uniforms for Wolf-Rayet, Carbon Stars, Variable Stars etc.</p>
        <div class="uniform-group">
          <h5>Star Properties</h5>
        </div>
        <div class="uniform-group">
          <h5>Corona / Stellar Wind</h5>
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
      let defaultColor = "#ADD8E6"; // Light blue default
      if (this.starProperties.stellarType === "CARBON_STAR") {
        defaultColor = "#A52A2A"; // Brownish-red for Carbon star
      }
      surfaceGroup.appendChild(
        this.createColorPicker(
          "Star Color",
          this.starProperties.color || defaultColor,
          (e) => {
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
          "Intensity/Brightness",
          "0.1",
          "10",
          "1",
          "0.1",
          (e) => {
            // General intensity
            updateUniform(
              starId,
              "BaseStarMaterial",
              "glowIntensity",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      surfaceGroup.appendChild(
        this.createSlider(
          "Pulsation/Variability Speed",
          "0.05",
          "5",
          "0.5",
          "0.05",
          (e) => {
            updateUniform(
              starId,
              "BaseStarMaterial",
              "pulseSpeed",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
    }

    if (coronaGroup) {
      coronaGroup.appendChild(
        this.createColorPicker(
          "Corona/Wind Color",
          this.starProperties.color || "#FFFFFF",
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
          "Corona/Wind Opacity",
          "0",
          "1",
          "0.3",
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
          "Corona/Wind Pulse Speed",
          "0.1",
          "5",
          "1",
          "0.05",
          (e) => {
            // Often have strong winds
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
          "Corona/Wind Noise Scale",
          "0.5",
          "8",
          "2",
          "0.1",
          (e) => {
            // Can be quite turbulent
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

    if (this.starProperties.stellarType === "WOLF_RAYET") {
      const specificGroup = document.createElement("div");
      specificGroup.className = "uniform-group";
      specificGroup.innerHTML = `<h5>Wolf-Rayet Features</h5> <p style="color: #888;">Controls for strong stellar winds, emission lines (TODO)</p>`;
      this.shadow.querySelector(".uniform-panel")?.appendChild(specificGroup);
    } else if (this.starProperties.stellarType === "CARBON_STAR") {
      const specificGroup = document.createElement("div");
      specificGroup.className = "uniform-group";
      specificGroup.innerHTML = `<h5>Carbon Star Features</h5> <p style="color: #888;">Controls for carbon soot atmosphere, deep red color variants (TODO)</p>`;
      this.shadow.querySelector(".uniform-panel")?.appendChild(specificGroup);
    } else if (this.starProperties.stellarType === "VARIABLE_STAR") {
      const specificGroup = document.createElement("div");
      specificGroup.className = "uniform-group";
      specificGroup.innerHTML = `<h5>Variable Star Features</h5> <p style="color: #888;">Controls for pulsation period, amplitude, type (TODO)</p>`;
      this.shadow.querySelector(".uniform-panel")?.appendChild(specificGroup);
    }
  }
}

customElements.define(
  "evolved-special-star-uniforms",
  EvolvedSpecialStarUniforms,
);
