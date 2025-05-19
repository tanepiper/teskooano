import {
  getSimulationState,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import { Subscription } from "rxjs";
import type { TeskooanoButton } from "../../../../core/components/button/Button";
import {
  createStateUpdateHandler,
  setupEventHandlers,
} from "./SimulationControls.handlers";
import { template } from "./SimulationControls.template";
import type { SimulationUIElements } from "./SimulationControls.updater";

/**
 * @element simulation-controls
 * @description Web component displaying simulation controls (play/pause, speed, time scale, time display).
 * It subscribes to the `simulationState` nanostore and updates the UI accordingly.
 *
 * @attr {boolean} mobile - If present, applies styles optimized for smaller screens.
 */
export class SimulationControls extends HTMLElement {
  /** References to the UI elements within the shadow DOM. */
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

  /** Function to unsubscribe from the simulation state store. */
  private unsubscribeSimState: Subscription | null = null;

  /** The state update handler function, bound to this component's UI elements. */
  private stateUpdateHandler: ((state: SimulationState) => void) | null = null;

  /** Object containing functions to add and remove event listeners. */
  private eventHandlers: { add: () => void; remove: () => void } | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback(): Promise<void> {
    await customElements.whenDefined("teskooano-button");

    this.queryElements();

    if (!this.isConnected) {
      return;
    }

    this.stateUpdateHandler = createStateUpdateHandler(this.uiElements);
    this.eventHandlers = setupEventHandlers(this.uiElements);

    this.eventHandlers.add();

    this.unsubscribeSimState = simulationState$.subscribe(
      this.stateUpdateHandler,
    );

    requestAnimationFrame(() => {
      if (this.isConnected) {
        this.stateUpdateHandler!(getSimulationState());
      }
    });
  }

  disconnectedCallback(): void {
    this.unsubscribeSimState?.unsubscribe();
    this.eventHandlers?.remove();

    this.unsubscribeSimState = null;
    this.stateUpdateHandler = null;
    this.eventHandlers = null;

    Object.keys(this.uiElements).forEach((key) => {
      this.uiElements[key as keyof SimulationUIElements] = null;
    });
  }

  /**
   * Queries the shadow DOM to get references to the UI elements.
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
