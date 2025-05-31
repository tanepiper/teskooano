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

export class NeutronStarUniforms extends StarUniformsBase {
  constructor() {
    super();
  }

  protected render(): void {
    if (!this.starData || !this.starProperties) {
      this.shadow.innerHTML = "<p>Star data not available.</p>";
      return;
    }
    const starId = this.starData.id;

    // NeutronStarRenderer uses NeutronStarMaterial (extends BaseStarMaterial with specific options)
    // and PulsarJetMaterial (custom ShaderMaterial)
    // and an enhanced glow and gravitational lensing.

    this.shadow.innerHTML = `
      <style>
        ${baseStyles}
        h4 { margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .uniform-group { margin-bottom: 20px; padding: 10px; border: 1px solid #333; border-radius: 4px; }
      </style>
      <div class="uniform-panel">
        <h4>Neutron Star Uniforms (${this.starData.name})</h4>

        <div class="uniform-group">
          <h5>Core Star Properties (NeutronStarMaterial)</h5>
          <!-- NeutronStarMaterial uses BaseStarMaterial, so similar controls but with different defaults/ranges perhaps -->
        </div>

        <div class="uniform-group">
          <h5>Pulsar Jets (PulsarJetMaterial)</h5>
        </div>
        
        <div class="uniform-group">
          <h5>Enhanced Glow & Corona</h5>
        </div>

        <div class="uniform-group">
          <h5>Gravitational Lensing</h5>
          <p style="color: #888;">Lensing effect controls (TODO - likely managed by GravitationalLensingHelper)</p>
        </div>
      </div>
    `;

    const coreGroup = this.shadow.querySelector(".uniform-group:nth-child(1)");
    const jetGroup = this.shadow.querySelector(".uniform-group:nth-child(2)");
    const glowCoronaGroup = this.shadow.querySelector(
      ".uniform-group:nth-child(3)",
    );

    if (coreGroup) {
      coreGroup.appendChild(
        this.createColorPicker(
          "Core Color",
          this.starProperties.color || "#ADD8E6",
          (e) => {
            // Pale blue default
            updateUniform(
              starId,
              "NeutronStarMaterial",
              "starColor",
              (e.target as HTMLInputElement).value,
            );
          },
        ),
      );
      coreGroup.appendChild(
        this.createSlider("Core Intensity", "0.1", "10", "2", "0.1", (e) => {
          updateUniform(
            starId,
            "NeutronStarMaterial",
            "glowIntensity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      coreGroup.appendChild(
        this.createSlider("Core Pulse Speed", "0.5", "20", "5", "0.5", (e) => {
          // Fast pulses
          updateUniform(
            starId,
            "NeutronStarMaterial",
            "pulseSpeed",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
    }

    if (jetGroup) {
      jetGroup.appendChild(
        this.createColorPicker("Jet Color", "#FFFFFF", (e) => {
          // White/blueish default for jets
          updateUniform(
            starId,
            "PulsarJetMaterial",
            "jetColor",
            (e.target as HTMLInputElement).value,
          ); // Assuming a uniform like 'jetColor'
        }),
      );
      jetGroup.appendChild(
        this.createSlider("Jet Intensity", "0", "5", "1", "0.1", (e) => {
          updateUniform(
            starId,
            "PulsarJetMaterial",
            "intensity",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
      jetGroup.appendChild(
        this.createSlider(
          "Jet Speed/Animation",
          "0.1",
          "10",
          "1",
          "0.1",
          (e) => {
            updateUniform(
              starId,
              "PulsarJetMaterial",
              "timeScale",
              parseFloat((e.target as HTMLInputElement).value),
            ); // Assuming a time uniform for animation
          },
        ),
      );
      jetGroup.appendChild(
        this.createSlider("Jet Cone Angle", "1", "45", "15", "1", (e) => {
          updateUniform(
            starId,
            "PulsarJetMaterial",
            "coneAngle",
            parseFloat((e.target as HTMLInputElement).value),
          );
        }),
      );
    }

    if (glowCoronaGroup) {
      // NeutronStarRenderer overrides addCorona for much larger scales/opacities.
      // These are CoronaMaterial uniforms.
      glowCoronaGroup.appendChild(
        this.createColorPicker(
          "Glow/Corona Color",
          this.starProperties.color || "#ADD8E6",
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
      glowCoronaGroup.appendChild(
        this.createSlider(
          "Glow/Corona Opacity",
          "0.1",
          "1",
          "0.7",
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
      glowCoronaGroup.appendChild(
        this.createSlider(
          "Glow/Corona Pulse Speed",
          "0.5",
          "15",
          "3",
          "0.1",
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
      glowCoronaGroup.appendChild(
        this.createSlider(
          "Glow/Corona Noise Scale",
          "1",
          "10",
          "4",
          "0.1",
          (e) => {
            updateUniform(
              starId,
              "CoronaMaterial",
              "noiseScale",
              parseFloat((e.target as HTMLInputElement).value),
            );
          },
        ),
      );
      // Enhanced glow might have its own parameters if it's a separate material/effect beyond corona
    }
  }
}

customElements.define("neutron-star-uniforms", NeutronStarUniforms);
