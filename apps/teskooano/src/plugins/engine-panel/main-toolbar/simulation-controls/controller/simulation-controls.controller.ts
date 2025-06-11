import {
  actions,
  getSimulationState,
  type SimulationState,
} from "@teskooano/core-state";
import type { TeskooanoButton } from "../../../../../core/components/button/Button";
import { PlayIcon, PauseIcon } from "../view/simulation-controls.template";
import {
  formatScale,
  formatTime,
  getEngineShortName,
} from "./simulation-controls.utils";

/**
 * Defines the structure for an object holding references to the UI elements
 * that the controller will interact with.
 */
export interface SimulationUIElements {
  playPauseButton: TeskooanoButton | null;
  speedUpButton: TeskooanoButton | null;
  speedDownButton: TeskooanoButton | null;
  reverseButton: TeskooanoButton | null;
  scaleValueDisplay: HTMLElement | null;
  scaleSelect: HTMLSelectElement | null;
  timeValueDisplay: HTMLElement | null;
  engineValueDisplay: HTMLElement | null;
}

/**
 * Controller for the SimulationControls component.
 *
 * This class embodies the "Controller" in an MVC-like pattern. It is
 * responsible for all business logic, including:
 * - Handling user interactions from the view (e.g., button clicks).
 * - Updating the view's DOM elements in response to state changes.
 * - Managing component-level state and logic (e.g., speed constants).
 * - Setting up and tearing down all event listeners.
 */
export class SimulationControlsController {
  private view: HTMLElement;
  private uiElements: SimulationUIElements;
  private previousState: Partial<SimulationState> = {};
  private readonly speedValues = [
    0.0625, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24,
    32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608,
    10000000,
  ];

  /**
   * Constructs the controller.
   * @param {HTMLElement} view - The view instance (the custom element).
   * @param {SimulationUIElements} uiElements - A collection of the view's DOM elements.
   */
  constructor(view: HTMLElement, uiElements: SimulationUIElements) {
    this.view = view;
    this.uiElements = uiElements;
  }

  /**
   * Initializes the controller by attaching all necessary event handlers.
   */
  public init(): void {
    this.addEventListeners();
    // Initialize display with current state
    this.handleStateUpdate(getSimulationState());
  }

  /**
   * Cleans up the controller by removing all event listeners.
   */
  public dispose(): void {
    this.removeEventListeners();
  }

  /**
   * The main state update handler.
   * It compares the new state with the previous state and calls specific UI
   * update methods only for the parts of the state that have changed.
   * @param {SimulationState} state - The new simulation state from the store.
   */
  public handleStateUpdate(state: SimulationState): void {
    this._updateTimeDisplay(state.time);

    if (state.paused !== this.previousState.paused) {
      this._updatePlayPauseButton(state.paused);
      this._updateSpeedButtons(state.paused, state.timeScale);
      this.previousState.paused = state.paused;
    }

    if (state.timeScale !== this.previousState.timeScale) {
      this._updateScaleDisplay(state.timeScale);
      this._updateReverseButton(state.timeScale);
      this._updateSpeedButtons(state.paused, state.timeScale);
      this.previousState.timeScale = state.timeScale;
    }

    if (state.physicsEngine !== this.previousState.physicsEngine) {
      this._updateEngineDisplay(state.physicsEngine);
      this.previousState.physicsEngine = state.physicsEngine;
    }
  }

  private addEventListeners(): void {
    this.uiElements.playPauseButton?.addEventListener(
      "click",
      this.playPauseHandler,
    );
    this.uiElements.speedUpButton?.addEventListener(
      "click",
      this.speedUpHandler,
    );
    this.uiElements.speedDownButton?.addEventListener(
      "click",
      this.speedDownHandler,
    );
    this.uiElements.reverseButton?.addEventListener(
      "click",
      this.reverseHandler,
    );
    this.uiElements.scaleValueDisplay?.addEventListener(
      "click",
      this.showScaleSelect,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "change",
      this.handleScaleSelectChange,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "blur",
      this.handleScaleSelectBlur,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "keydown",
      this.handleScaleSelectKeydown,
    );
  }

  private removeEventListeners(): void {
    this.uiElements.playPauseButton?.removeEventListener(
      "click",
      this.playPauseHandler,
    );
    this.uiElements.speedUpButton?.removeEventListener(
      "click",
      this.speedUpHandler,
    );
    this.uiElements.speedDownButton?.removeEventListener(
      "click",
      this.speedDownHandler,
    );
    this.uiElements.reverseButton?.removeEventListener(
      "click",
      this.reverseHandler,
    );
    this.uiElements.scaleValueDisplay?.removeEventListener(
      "click",
      this.showScaleSelect,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "change",
      this.handleScaleSelectChange,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "blur",
      this.handleScaleSelectBlur,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "keydown",
      this.handleScaleSelectKeydown,
    );
  }

  // Event Handlers (bound to the class instance)
  private playPauseHandler = () => actions.togglePause();
  private speedUpHandler = () => {
    const currentScale = getSimulationState().timeScale;
    if (currentScale === 0) {
      actions.setTimeScale(1);
      return;
    }
    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);
    const nextSpeed =
      this.speedValues.find((v) => v > absScale) ||
      this.speedValues[this.speedValues.length - 1];
    actions.setTimeScale(nextSpeed * sign);
  };
  private speedDownHandler = () => {
    const currentScale = getSimulationState().timeScale;
    if (currentScale === 0) {
      actions.setTimeScale(-1);
      return;
    }
    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);
    const prevSpeed =
      [...this.speedValues].reverse().find((v) => v < absScale) ||
      this.speedValues[0];
    actions.setTimeScale(prevSpeed * sign);
  };
  private reverseHandler = () => {
    const currentScale = getSimulationState().timeScale;
    actions.setTimeScale(currentScale === 0 ? -1 : -currentScale);
  };

  private showScaleSelect = () => {
    const { scaleValueDisplay, scaleSelect } = this.uiElements;
    if (!scaleValueDisplay || !scaleSelect) return;

    scaleValueDisplay.style.display = "none";
    scaleSelect.style.display = "inline-block";
    scaleSelect.innerHTML = "";

    let currentScale = getSimulationState().timeScale;
    currentScale =
      currentScale < 0
        ? Math.abs(currentScale)
        : currentScale === 0
          ? 1
          : currentScale;

    this.speedValues.forEach((val) => {
      const option = document.createElement("option");
      option.value = val.toString();
      option.textContent = formatScale(val);
      scaleSelect.appendChild(option);
      if (val === currentScale) {
        option.selected = true;
      }
    });

    scaleSelect.focus();
  };

  private hideScaleSelectAndApply = (applyChange: boolean) => {
    const { scaleValueDisplay, scaleSelect } = this.uiElements;
    if (!scaleValueDisplay || !scaleSelect) return;

    if (applyChange) {
      const selectedValue = parseFloat(scaleSelect.value);
      if (!isNaN(selectedValue)) {
        const currentSimState = getSimulationState();
        const newScale =
          currentSimState.timeScale < 0 ? -selectedValue : selectedValue;
        actions.setTimeScale(newScale);
      }
    }
    scaleSelect.style.display = "none";
    scaleValueDisplay.style.display = "";
  };

  private handleScaleSelectChange = () => this.hideScaleSelectAndApply(true);
  private handleScaleSelectBlur = () => {
    setTimeout(() => {
      if (document.activeElement !== this.uiElements.scaleSelect) {
        this.hideScaleSelectAndApply(false);
      }
    }, 100);
  };

  private handleScaleSelectKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.hideScaleSelectAndApply(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.hideScaleSelectAndApply(false);
    }
  };

  // UI Updaters
  private _updateTimeDisplay = (timeSeconds: number = 0): void => {
    if (this.uiElements.timeValueDisplay) {
      this.uiElements.timeValueDisplay.textContent = formatTime(timeSeconds);
    }
  };

  private _updatePlayPauseButton = (isPaused: boolean): void => {
    const { playPauseButton } = this.uiElements;
    if (playPauseButton) {
      const stateText = isPaused ? "Play" : "Pause";
      const iconSvg = isPaused ? PlayIcon : PauseIcon;
      const iconSpan = playPauseButton.querySelector('[slot="icon"]');
      if (iconSpan) {
        iconSpan.innerHTML = iconSvg;
      }
      playPauseButton.title = `${stateText} Simulation`;
      playPauseButton.toggleAttribute("active", !isPaused);
    }
  };

  private _updateScaleDisplay = (timeScale: number): void => {
    const { scaleValueDisplay } = this.uiElements;
    if (scaleValueDisplay) {
      scaleValueDisplay.textContent = formatScale(timeScale);
      scaleValueDisplay.style.color =
        timeScale < 0
          ? "var(--color-warning-emphasis)"
          : "var(--color-text-secondary)";
    }
  };

  private _updateReverseButton = (timeScale: number): void => {
    const { reverseButton } = this.uiElements;
    if (reverseButton) {
      reverseButton.toggleAttribute("active", timeScale < 0);
    }
  };

  private _updateSpeedButtons = (
    isPaused: boolean,
    timeScale: number,
  ): void => {
    const { speedDownButton, speedUpButton } = this.uiElements;
    if (speedDownButton) {
      speedDownButton.disabled =
        isPaused ||
        (Math.abs(timeScale) <= this.speedValues[0] && timeScale !== 0);
    }
    if (speedUpButton) {
      speedUpButton.disabled =
        isPaused ||
        Math.abs(timeScale) >= this.speedValues[this.speedValues.length - 1];
    }
  };

  private _updateEngineDisplay = (engineName: string | undefined): void => {
    const { engineValueDisplay } = this.uiElements;
    if (engineValueDisplay) {
      const name = engineName || "-";
      engineValueDisplay.textContent = getEngineShortName(name);
      engineValueDisplay.setAttribute("data-full-name", name);
    }
  };
}
