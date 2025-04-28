import { actions, simulationState } from "@teskooano/core-state";
import { type TeskooanoButton } from "../../../shared/Button"; // Corrected relative path

// Import state type if not already imported
import type { SimulationState } from "@teskooano/core-state";

import PlayRegular from "@fluentui/svg-icons/icons/play_20_regular.svg?raw";
import PauseRegular from "@fluentui/svg-icons/icons/pause_20_regular.svg?raw";
import PreviousRegular from "@fluentui/svg-icons/icons/previous_20_regular.svg?raw";
import NextRegular from "@fluentui/svg-icons/icons/next_20_regular.svg?raw";
import ArrowClockwiseRegular from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-family: var(--font-family-base); 
    }

    .controls-container {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
    }
    .display-container {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    /* Style the SVG icons */
    teskooano-button svg {
        width: 1em; /* Adjust size as needed */
        height: 1em;
        fill: var(--color-text-primary);
        display: block;
        margin: auto;
    }

    /* Keep styles for separator and scale display */
    .separator {
        width: var(--border-width-thin); /* Use token */
        height: 20px;
        background-color: var(--color-border-subtle); /* Use token */
        margin: 0 var(--spacing-xs); /* Use token */
    }
    .display-value {
        font-family: var(--font-family-mono); /* Use token */
        font-size: var(--font-size-small); /* Use token */
        color: var(--color-text-secondary); /* Use token */
        min-width: 60px; 
        text-align: center;
        padding: var(--space-1) var(--space-2); /* Use tokens */
        border: var(--border-width-thin) solid var(--color-border-subtle); /* Use tokens */
        border-radius: var(--radius-sm); /* Use token */
        background-color: var(--color-surface-1); /* Use token */
    }
    #time-value {
        min-width: 120px;
        color: var(--color-primary); /* Use token (was primary-light) */
    }
    #engine-value {
        min-width: 30px;
        color: var(--color-text-primary); /* Use token (was text) */
        font-weight: var(--font-weight-bold); /* Use token */
        text-transform: uppercase;
    }
    /* Optional tooltip styles for engine letter */
    #engine-value:hover::after {
        content: attr(data-full-name);
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface-2); /* Use token (was surface) */
        border: var(--border-width-thin) solid var(--color-border-subtle); /* Use tokens */
        padding: var(--space-1) var(--space-2); /* Use tokens */
        border-radius: var(--radius-sm); /* Use token */
        font-size: var(--font-size-small); /* Use token */
        white-space: nowrap;
        pointer-events: none;
        opacity: 0.9;
        z-index: 10;
    }
    :host([mobile]) #time-value {
       min-width: 90px; /* Reduce width */
       font-size: 0.9em; /* Slightly smaller font */
    }
    :host([mobile]) #scale-value {
       min-width: 50px; /* Reduce width */
       font-size: 0.9em;
    }
  </style>

  <div class="controls-container">
  <teskooano-button id="reverse" title="Reverse Direction">
      ${ArrowClockwiseRegular}
  </teskooano-button>
  <teskooano-button id="speed-down" title="Decrease Speed">
      ${PreviousRegular}
  </teskooano-button>
  <teskooano-button id="play-pause" title="Play/Pause">
      ${PauseRegular} <!-- Initial state: Pause icon -->
  </teskooano-button>
   <teskooano-button id="speed-up" title="Increase Speed">
       ${NextRegular}
   </teskooano-button>
  </div>
  <div class="separator"></div>
  <div class="display-container">
    <span class="display-value" id="scale-value" title="Time Scale">-</span>
    <span class="display-value" id="time-value" title="Simulation Time">-</span>
    <span class="display-value" id="engine-value" title="Physics Engine">-</span>
  </div>
`;

export class SimulationControls extends HTMLElement {
  private playPauseButton: TeskooanoButton | null = null;
  private speedUpButton: TeskooanoButton | null = null;
  private speedDownButton: TeskooanoButton | null = null;
  private reverseButton: TeskooanoButton | null = null;
  private scaleValueDisplay: HTMLElement | null = null;
  private timeValueDisplay: HTMLElement | null = null;
  private engineValueDisplay: HTMLElement | null = null;
  private unsubscribeSimState: (() => void) | null = null;

  // Store previous relevant state pieces to avoid unnecessary updates
  private previousPausedState: boolean | undefined = undefined;
  private previousTimeScaleState: number | undefined = undefined;
  private previousEngineState: string | undefined = undefined;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.playPauseButton = this.shadowRoot!.getElementById(
      "play-pause",
    ) as TeskooanoButton | null;
    this.speedUpButton = this.shadowRoot!.getElementById(
      "speed-up",
    ) as TeskooanoButton | null;
    this.speedDownButton = this.shadowRoot!.getElementById(
      "speed-down",
    ) as TeskooanoButton | null;
    this.reverseButton = this.shadowRoot!.getElementById(
      "reverse",
    ) as TeskooanoButton | null;
    this.scaleValueDisplay = this.shadowRoot!.getElementById("scale-value");
    this.timeValueDisplay = this.shadowRoot!.getElementById("time-value");
    this.engineValueDisplay = this.shadowRoot!.getElementById("engine-value");

    this.addEventListeners();

    // Subscribe to the main state atom
    this.unsubscribeSimState = simulationState.subscribe(
      this.handleStateUpdate,
    );
    // Call handler initially to set UI from current state
    this.handleStateUpdate(simulationState.get());
  }

  disconnectedCallback() {
    this.unsubscribeSimState?.();
    this.removeEventListeners();
  }

  private addEventListeners(): void {
    this.playPauseButton?.addEventListener("click", actions.togglePause);
    this.speedUpButton?.addEventListener("click", () => {
      const currentScale = simulationState.get().timeScale;
      const newScale =
        currentScale === 0
          ? 1
          : currentScale < 0
            ? Math.min(currentScale / 2, -0.1)
            : Math.min(currentScale * 2, 10000000);
      actions.setTimeScale(newScale);
    });
    this.speedDownButton?.addEventListener("click", () => {
      const currentScale = simulationState.get().timeScale;
      const newScale =
        currentScale > 0
          ? Math.max(currentScale / 2, 0.1)
          : currentScale < 0
            ? Math.max(currentScale * 2, -10000000)
            : 0;
      actions.setTimeScale(newScale);
    });
    this.reverseButton?.addEventListener("click", () => {
      const currentScale = simulationState.get().timeScale;
      actions.setTimeScale(currentScale === 0 ? -1 : -currentScale);
    });
  }

  private removeEventListeners(): void {
    this.playPauseButton?.removeEventListener("click", actions.togglePause);
    // No removal needed for anonymous arrow functions used for speed/reverse
  }

  // Main handler called on ANY state change
  private handleStateUpdate = (state: SimulationState): void => {
    // 1. Always update time display (most frequent change)
    this.updateTimeDisplay(state.time);

    // 2. Update play/pause ONLY if paused state changed
    if (state.paused !== this.previousPausedState) {
      this.updatePlayPauseButton(state.paused);
      this.previousPausedState = state.paused;
      // Also re-evaluate speed button disabled state when pause changes
      this.updateSpeedButtons(state.paused, state.timeScale);
    }

    // 3. Update scale/speed/reverse ONLY if timeScale changed
    if (state.timeScale !== this.previousTimeScaleState) {
      this.updateScaleDisplay(state.timeScale);
      this.updateReverseButton(state.timeScale);
      // Also re-evaluate speed button disabled state when scale changes
      this.updateSpeedButtons(state.paused, state.timeScale);
      this.previousTimeScaleState = state.timeScale;
    }

    // 4. Update engine ONLY if physicsEngine changed
    if (state.physicsEngine !== this.previousEngineState) {
      this.updateEngineDisplay(state.physicsEngine);
      this.previousEngineState = state.physicsEngine;
    }
  };

  // Specific update function for Time Display
  private updateTimeDisplay(timeSeconds: number = 0): void {
    if (this.timeValueDisplay) {
      this.timeValueDisplay.textContent = this.formatTime(timeSeconds);
    }
  }

  // Specific update function for Play/Pause Button
  private updatePlayPauseButton(isPaused: boolean): void {
    if (this.playPauseButton) {
      this.playPauseButton.innerHTML = isPaused ? PlayRegular : PauseRegular;
      this.playPauseButton.title = isPaused
        ? "Play Simulation"
        : "Pause Simulation";
      this.playPauseButton.toggleAttribute("active", !isPaused);
    }
  }

  // Specific update function for Scale Display
  private updateScaleDisplay(timeScale: number): void {
    if (this.scaleValueDisplay) {
      this.scaleValueDisplay.textContent = this.formatScale(timeScale);
      this.scaleValueDisplay.style.color =
        timeScale < 0 ? "var(--color-warning)" : "var(--color-text-secondary)";
    }
  }

  // Specific update function for Reverse Button state
  private updateReverseButton(timeScale: number): void {
    if (this.reverseButton) {
      this.reverseButton.toggleAttribute("active", timeScale < 0);
    }
  }

  // Specific update function for Speed Button disabled states
  private updateSpeedButtons(isPaused: boolean, timeScale: number): void {
    if (this.speedDownButton) {
      const disableSpeedDown =
        isPaused ||
        (timeScale > 0 && timeScale <= 0.1) ||
        (timeScale < 0 && timeScale >= -10000000);
      this.speedDownButton.disabled = disableSpeedDown;
    }
    if (this.speedUpButton) {
      const disableSpeedUp =
        isPaused ||
        (timeScale < 0 && timeScale <= -0.1) ||
        (timeScale > 0 && timeScale >= 10000000);
      this.speedUpButton.disabled = disableSpeedUp;
    }
  }

  // Specific update function for Engine Display
  private updateEngineDisplay(engineName: string | undefined): void {
    if (this.engineValueDisplay) {
      const name = engineName || "-";
      this.engineValueDisplay.textContent = this.getEngineShortName(name);
      this.engineValueDisplay.setAttribute("data-full-name", name);
    }
  }

  private formatScale(scale: number): string {
    const absScale = Math.abs(scale);
    let scaleText: string;
    if (scale === 0) return "0.0x";

    if (absScale >= 1000000) {
      scaleText = `${(scale / 1000000).toFixed(1)}M`;
    } else if (absScale >= 1000) {
      scaleText = `${(scale / 1000).toFixed(1)}K`;
    } else {
      scaleText = absScale < 1 ? scale.toFixed(2) : scale.toFixed(1);
    }
    return `${scaleText}x`;
  }

  private formatTime(timeSeconds: number = 0): string {
    const days = Math.floor(timeSeconds / 86400);
    const hours = Math.floor((timeSeconds % 86400) / 3600);
    const minutes = Math.floor((timeSeconds % 3600) / 60);
    const seconds = Math.floor(timeSeconds % 60);
    return `${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  private getEngineShortName(engineName: string): string {
    if (!engineName) return "-";

    // Get first letter or first letter of each word for acronym
    const words = engineName.split(/[\s-_]+/);
    if (words.length > 1) {
      // Create acronym from first letter of each word
      return words.map((word) => word.charAt(0).toUpperCase()).join("");
    } else {
      // Just use first letter
      return engineName.charAt(0).toUpperCase();
    }
  }
}
