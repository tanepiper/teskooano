import type { TeskooanoButton } from "../../../../../core/components/button/Button";
import {
  SimulationControlsController,
  type SimulationUIElements,
} from "../controller/simulation-controls.controller";
import { template } from "./simulation-controls.template";

/**
 * @element teskooano-simulation-controls
 * @description
 * A custom element that provides UI controls for managing the simulation's
 * playback (play, pause, speed, time). It serves as the View in an MVC-like
 * pattern, delegating all logic to its corresponding Controller.
 * It subscribes to the global `simulationState$` and passes updates to the
 * controller to keep the UI synchronized.
 *
 * @attr {boolean} mobile - If present, applies styles optimized for smaller screens.
 */
export class SimulationControls extends HTMLElement {
  /** @internal A collection of references to the component's UI elements. */
  private uiElements: SimulationUIElements = {
    playPauseButton: null,
    speedUpButton: null,
    speedDownButton: null,
    reverseButton: null,
    scaleValueDisplay: null,
    scaleSelect: null,
    timeValueDisplay: null,
    engineValueDisplay: null,
  };

  /** @internal The controller instance that manages all component logic. */
  private controller: SimulationControlsController | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  /**
   * Standard custom element lifecycle callback.
   * Fired when the element is connected to the DOM.
   * @internal
   */
  async connectedCallback(): Promise<void> {
    // Ensure the child teskooano-button components are defined before we query them.
    await customElements.whenDefined("teskooano-button");

    // If the element is disconnected while waiting, abort initialization.
    if (!this.isConnected) {
      return;
    }

    this.queryElements();

    // Instantiate the controller and initialize it.
    this.controller = new SimulationControlsController(this.uiElements);
    this.controller.init();
  }

  /**
   * Standard custom element lifecycle callback.
   * Fired when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback(): void {
    this.controller?.dispose();
    this.controller = null;
  }

  /**
   * Queries the shadow DOM to get references to all interactive UI elements
   * and stores them in the `uiElements` property for the controller to use.
   * @private
   */
  private queryElements(): void {
    const shadowRoot = this.shadowRoot!;
    this.uiElements.playPauseButton = shadowRoot.getElementById(
      "play-pause",
    ) as TeskooanoButton | null;
    this.uiElements.speedUpButton = shadowRoot.getElementById(
      "speed-up",
    ) as TeskooanoButton | null;
    this.uiElements.speedDownButton = shadowRoot.getElementById(
      "speed-down",
    ) as TeskooanoButton | null;
    this.uiElements.reverseButton = shadowRoot.getElementById(
      "reverse",
    ) as TeskooanoButton | null;
    this.uiElements.scaleValueDisplay =
      shadowRoot.getElementById("scale-value");
    this.uiElements.scaleSelect = shadowRoot.getElementById(
      "scale-select",
    ) as HTMLSelectElement | null;
    this.uiElements.timeValueDisplay = shadowRoot.getElementById("time-value");
    this.uiElements.engineValueDisplay =
      shadowRoot.getElementById("engine-value");
  }
}
