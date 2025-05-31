import { StarUniformsBase } from "./StarUniformsBase";
import { baseStyles } from "../../utils/CelestialStyles";
import { UniformControlUtils } from "../../utils/UniformControlUtils";
import { Subscription } from "rxjs";

// Placeholder for actual uniform update logic - replace with RxJS later
const updateUniform = (
  starId: string,
  material: string,
  uniform: string,
  value: any,
) => {
  console.log(`Update Uniform: ${starId} - ${material}.${uniform} = ${value}`);
  // This should eventually dispatch an action or update an observable
  // to communicate with the ThreeJS rendering engine.
  // For example, using a custom event or an RxJS subject:
  // starUniformUpdateService.updateUniform(starId, material, uniform, value);
};

export class MainSequenceStarUniforms extends StarUniformsBase {
  constructor() {
    super();
  }

  protected render(): void {
    this.cleanupSubscriptions(); // Clear any existing subscriptions from previous renders
    if (!this.starData || !this.starProperties) {
      this.shadow.innerHTML = "<p>Star data not available.</p>";
      return;
    }

    const starId = this.starData.id;
    const currentCelestialForUtils = this.starData; // For clarity when passing to utils

    this.shadow.innerHTML = `
      <style>
        ${baseStyles}
        h4 {
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 1px solid #444;
          padding-bottom: 5px;
        }
        .uniform-group {
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #333;
          border-radius: 4px;
        }
        .uniform-control label {
            display: block;
            margin-bottom: 5px;
        }
        .uniform-control input[type=\"color\"] {
            width: 100%; /* Make color input take full width of its parent */
            height: 30px;
        }
         /* Ensure teskooano-slider also fits well */
        .uniform-control teskooano-slider {
            width: 100%; 
        }
      </style>
      <div class="uniform-panel">
        <h4>Main Sequence Star Uniforms (${this.starData.name})</h4>
        <div class="uniform-group" id="global-settings">
          <h5>Global Settings</h5>
        </div>
        <div class="uniform-group" id="surface-group">
          <h5>Star Surface (BaseStarMaterial)</h5>
        </div>
        <div class="uniform-group" id="corona-group">
          <h5>Corona (CoronaMaterial)</h5>
        </div>
      </div>
    `;

    const globalGroup = this.shadow.getElementById("global-settings");
    const surfaceGroup = this.shadow.getElementById("surface-group");
    const coronaGroup = this.shadow.getElementById("corona-group");

    if (!globalGroup || !surfaceGroup || !coronaGroup) return;

    // Log properties for debugging
    console.log(
      "[MainSequenceStarUniforms] Star Properties:",
      JSON.parse(JSON.stringify(this.starProperties)),
    );

    const addCtrl = (
      parentElement: HTMLElement,
      label: string,
      propertyPath: string[],
      type: "color" | "number",
      options: any = {},
    ) => {
      const { element, subscription } =
        type === "color"
          ? UniformControlUtils.createColorInput(
              label,
              starId,
              currentCelestialForUtils,
              propertyPath,
              options.initialValue,
            )
          : UniformControlUtils.createNumericInput(
              label,
              starId,
              currentCelestialForUtils,
              propertyPath,
              options,
            );
      parentElement.appendChild(element);
      this.activeInputSubscriptions.push(subscription);
    };

    // Global settings that affect both base star and corona
    // Default color for a G-class star (sol-like) from base-star.ts: 0xffcc00
    // This control should target StarProperties.color, which the material uses.
    addCtrl(globalGroup, "Star Color", ["color"], "color", {
      initialValue: this.starProperties.color || "#ffcc00",
    });

    // Time offset is a root property of StarProperties
    addCtrl(globalGroup, "Time Offset", ["timeOffset"], "number", {
      min: "0",
      max: "1000",
      step: "1",
      initialValue:
        this.starProperties.timeOffset || Math.floor(Math.random() * 1000),
    });

    // Base star uniforms - from MainSequenceStarMaterial in main-sequence-star.ts
    const baseStarPath = ["shaderUniforms", "baseStar"];

    // Default values from main-sequence-star.ts MainSequenceStarMaterial
    addCtrl(
      surfaceGroup,
      "Corona Intensity",
      baseStarPath.concat(["coronaIntensity"]),
      "number",
      {
        min: "0",
        max: "5",
        step: "0.1",
        initialValue: 0.3, // Default from MainSequenceStarMaterial
      },
    );

    addCtrl(
      surfaceGroup,
      "Pulse Speed",
      baseStarPath.concat(["pulseSpeed"]),
      "number",
      {
        min: "0",
        max: "2",
        step: "0.05",
        initialValue: 0.5, // Default from MainSequenceStarMaterial
      },
    );

    addCtrl(
      surfaceGroup,
      "Glow Intensity",
      baseStarPath.concat(["glowIntensity"]),
      "number",
      {
        min: "0",
        max: "2",
        step: "0.1",
        initialValue: 0.4, // Default from MainSequenceStarMaterial
      },
    );

    addCtrl(
      surfaceGroup,
      "Temperature Variation",
      baseStarPath.concat(["temperatureVariation"]),
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: 0.1, // Default from MainSequenceStarMaterial
      },
    );

    addCtrl(
      surfaceGroup,
      "Metallic Effect",
      baseStarPath.concat(["metallicEffect"]),
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: 0.6, // Default from MainSequenceStarMaterial
      },
    );

    addCtrl(
      surfaceGroup,
      "Noise Evolution Speed",
      baseStarPath.concat(["noiseEvolutionSpeed"]),
      "number",
      {
        min: "0",
        max: "0.5",
        step: "0.01",
        initialValue: 0.05, // Default from MainSequenceStarMaterial
      },
    );

    // Corona uniforms - from CoronaMaterial in base-star.ts
    const coronaPath = ["shaderUniforms", "corona"];

    addCtrl(
      coronaGroup,
      "Corona Opacity",
      coronaPath.concat(["opacity"]),
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: 0.6, // Default from CoronaMaterial
      },
    );

    addCtrl(
      coronaGroup,
      "Corona Pulse Speed",
      coronaPath.concat(["pulseSpeed"]),
      "number",
      {
        min: "0",
        max: "2",
        step: "0.05",
        initialValue: 0.3, // Default from CoronaMaterial
      },
    );

    addCtrl(
      coronaGroup,
      "Corona Noise Scale",
      coronaPath.concat(["noiseScale"]),
      "number",
      {
        min: "0.1",
        max: "10",
        step: "0.1",
        initialValue: 3.0, // Default from CoronaMaterial
      },
    );

    addCtrl(
      coronaGroup,
      "Corona Noise Evolution",
      coronaPath.concat(["noiseEvolutionSpeed"]),
      "number",
      {
        min: "0",
        max: "5",
        step: "0.1",
        initialValue: 1.0, // Default from CoronaMaterial
      },
    );
  }
}

customElements.define("main-sequence-star-uniforms", MainSequenceStarUniforms);
