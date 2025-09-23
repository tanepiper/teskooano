import { TeskooanoButton } from "@core/components/button/Button";
import LineStyleSketchRegular from "@fluentui/svg-icons/icons/line_style_sketch_20_regular.svg?raw";
import CircleMultipleConcentricRegular from "@fluentui/svg-icons/icons/circle_multiple_concentric_20_regular.svg?raw";
import { StateAccessor, simulationManager } from "@teskooano/core-state";
import { SimulationMode } from "@teskooano/data-types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--background-color-rgb, rgba(27, 27, 27, 0.95));
      color: var(--text-color-rgb, #fff);
      z-index: 200; /* Above engine, below toolbar */
    }

    :host([hidden]) {
      display: none !important;
    }

    .dynamic-grid-background {
      background-color: #0d0d0d;
      background-image: linear-gradient(rgba(50, 100, 150, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(50, 100, 150, 0.08) 1px, transparent 1px);
      background-size: 35px 35px, 35px 35px;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1em;
      box-sizing: border-box;
    }

    .dynamic-grid-background::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 150%;
      padding-top: 150%;
      transform: translate(-50%, -50%);
      background: radial-gradient(
        circle at center,
        rgba(40, 80, 120, 0.5) 0%,
        transparent 55%
      );
      z-index: -1;
    }

    .placeholder-icon {
      max-width: 256px;
      max-height: 256px;
      margin-bottom: 1em;
      opacity: 0.7;
      border-radius: 16px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 15px rgba(40, 80, 120, 0.6),
        inset 0 0 5px rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease-in-out;
    }

    .placeholder-icon:hover {
      transform: scale(1.05);
      opacity: 0.9;
      box-shadow: 0 0 25px rgba(60, 120, 180, 0.8),
        inset 0 0 8px rgba(255, 255, 255, 0.2);
    }

    #placeholder-message {
      color: var(--text-color-secondary, #aaa);
      margin: 0 0 1em 0;
    }

    #placeholder-action-area progress {
      width: 100%;
    }

    #placeholder-action-area a {
      display: inline-block;
      padding: 8px 15px;
      background-color: var(--button-primary-background-color, #333);
      color: var(--button-primary-text-color, #fff);
      text-decoration: none;
      border-radius: var(--button-border-radius, 4px);
    }

    #placeholder-action-area a:hover {
      background-color: var(--button-primary-hover-background-color, #555);
    }


    .controls-area-container {
      margin-bottom: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-sm);
      justify-content: center;
      min-width: 900px;
    }

    .controls-area-container teskooano-button {
      fill: #fff;
    }

    .switch-engine-button-helptext {
      font-size: 0.8em;
      color: var(--text-color-secondary, #aaa);
      text-align: center;
      max-width: 350px;
      line-height: 1.5;
      padding: 8px;
    }

    .switch-engine-button-helptext strong {
      color: var(--text-color, #fff);
      font-weight: 600;
    }

    .switch-engine-button-helptext em {
      color: var(--text-color-accent, #4a9eff);
      font-style: italic;
    }

    .switch-engine-button-helptext br {
      margin-bottom: 2px;
    }
  </style>
  <div class="dynamic-grid-background">
    <div id="controls-area" class="controls-area-container">
      <teskooano-button id="switch-engine-button" variant="icon" size="m">
        <span slot="icon">${LineStyleSketchRegular}</span>
        <span id="switch-engine-text">N-Body Mode</span>
      </teskooano-button>
      <div id="switch-engine-button-helptext" class="switch-engine-button-helptext">
        Bodies are affected by gravity and relative forces - increasing time decreases accuracy
        <br />click to switch to Ideal mode.
      </div>
    </div> 

    <img
      src="/assets/panel-icon.png"
      alt="Engine Placeholder Icon"
      class="placeholder-icon"
    />
    <p id="placeholder-message">
      Press the ☀ Sol or ✨ Generate Random Seed button in the toolbar to begin<br />On mobile you can slide the toolbar using touch gestures<br />For more help use the 🧭 Tour button in the toolbar
    </p>
    <div id="placeholder-action-area">
    <a href="https://teskooano.space/docs/getting-started" target="_blank" style="display: inline-block; padding: 8px 15px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px;">📚 Go To Documentation</a>
    </div>
  </div>
`;

export class HomeComponent extends HTMLElement {
  private placeholderMessage: HTMLParagraphElement;
  private placeholderActionArea: HTMLDivElement;
  private switchEngineButton: TeskooanoButton;
  private switchEngineText: HTMLSpanElement;
  private switchEngineHelptext: HTMLDivElement;

  private simulationMode: SimulationMode;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Get references to elements
    this.placeholderMessage = this.shadowRoot!.querySelector(
      "#placeholder-message",
    )!;
    this.placeholderActionArea = this.shadowRoot!.querySelector(
      "#placeholder-action-area",
    )!;
    this.switchEngineButton = this.shadowRoot!.querySelector(
      "#switch-engine-button",
    )!;
    this.switchEngineText = this.shadowRoot!.querySelector(
      "#switch-engine-text",
    )!;
    this.switchEngineHelptext = this.shadowRoot!.querySelector(
      "#switch-engine-button-helptext",
    )!;

    this.simulationMode =
      StateAccessor.getSimulationState().simulationConfig.mode;
    this.switchEngineButton.addEventListener(
      "click",
      this.handleSwitchEngineButtonClick.bind(this),
    );

    this.updateButtonContent();
  }

  private handleSwitchEngineButtonClick() {
    const newSimulationMode =
      this.simulationMode === SimulationMode.NBODY
        ? SimulationMode.IDEAL
        : SimulationMode.NBODY;
    simulationManager.setSimulationMode(newSimulationMode);
    this.simulationMode = newSimulationMode;
    this.updateButtonContent();
  }

  private updateButtonContent() {
    const iconSlot = this.switchEngineButton.querySelector(
      '[slot="icon"]',
    ) as HTMLSpanElement;

    const modeConfig = this.getModeConfiguration(this.simulationMode);

    this.switchEngineText.textContent = modeConfig.buttonText;
    this.switchEngineHelptext.innerHTML = modeConfig.helpText;
    iconSlot.innerHTML = modeConfig.icon;
  }

  private getModeConfiguration(mode: SimulationMode) {
    const configurations = {
      [SimulationMode.NBODY]: {
        buttonText: "N-Body Mode",
        icon: LineStyleSketchRegular,
        helpText: `
          <strong>N-Body Physics</strong><br>
          Bodies are affected by gravity and relative forces.<br>
          <em>Increasing time decreases accuracy</em><br>
          <span style="color: var(--text-color-secondary, #aaa);">Click to switch to Ideal mode</span>
        `,
      },
      [SimulationMode.IDEAL]: {
        buttonText: "Ideal Mode",
        icon: CircleMultipleConcentricRegular,
        helpText: `
          <strong>Ideal Orbital Mechanics</strong><br>
          Bodies follow perfect orbital mechanics with no gravitational interactions.<br>
          <em>Always accurate regardless of time scale</em><br>
          <span style="color: var(--text-color-secondary, #aaa);">Click to switch to N-Body mode</span>
        `,
      },
    };

    return configurations[mode];
  }

  /**
   * Hides the placeholder component.
   */
  public hide(): void {
    this.setAttribute("hidden", "");
  }

  /**
   * Shows the placeholder component.
   */
  public show(): void {
    this.removeAttribute("hidden");
  }

  /**
   * Sets the generating state via attribute for external control.
   * @param isGenerating - True if generating, false otherwise.
   */
  public setGenerating(isGenerating: boolean): void {
    if (isGenerating) {
      this.setAttribute("generating", "");
      this.placeholderMessage.textContent = "🪐 Generating System...";
      this.placeholderActionArea.innerHTML = `<progress style='width: 100%;'></progress>`;
    } else {
      this.removeAttribute("generating");
      this.placeholderMessage.innerHTML = `Press the ☀ Sol or ✨ Generate Random Seed button in the toolbar to begin<br />On mobile you can slide the toolbar using touch gestures<br />For more help use the 🧭 Tour button in the toolbar`;
      this.placeholderActionArea.innerHTML = `<a href="https://teskooano.space/docs/getting-started" target="_blank" style="display: inline-block; padding: 8px 15px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px;">📚 Go To Documentation</a>`;
    }
  }

  /**
   * Gets the current generating state from attributes.
   * @returns True if currently generating, false otherwise.
   */
  public getGenerating(): boolean {
    return this.hasAttribute("generating");
  }

  static get observedAttributes(): string[] {
    return ["generating", "hidden"];
  }
}

customElements.define("teskooano-home", HomeComponent);
