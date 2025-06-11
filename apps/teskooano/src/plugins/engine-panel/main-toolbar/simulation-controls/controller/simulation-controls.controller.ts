import {
  actions,
  getSimulationState,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import { Subscription } from "rxjs";
import type { TeskooanoButton } from "../../../../../core/components/button/Button";
import { PauseIcon, PlayIcon } from "../view/simulation-controls.template";
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
  private uiElements: SimulationUIElements;
  private subscriptions = new Subscription();
  private readonly speedValues = [
    0.0625, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24,
    32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608,
    10000000,
  ];

  /**
   * Constructs the controller.
   * @param {HTMLElement} view - The view instance this controller will manage.
   * @param {SimulationUIElements} uiElements - The collection of UI elements from the view.
   */
  constructor(uiElements: SimulationUIElements) {
    this.uiElements = uiElements;
  }

  /**
   * Initializes the controller by attaching all necessary event handlers and subscribing to state.
   */
  public init(): void {
    this.addEventListeners();
    // Initialize display with current state
    this.handleStateUpdate(getSimulationState());

    // Subscribe to the simulation state and pass updates to the controller.
    this.subscriptions.add(
      simulationState$.subscribe((state) => {
        this.handleStateUpdate(state);
      }),
    );
  }

  /**
   * Cleans up the controller by removing all event listeners and unsubscribing.
   */
  public dispose(): void {
    this.removeEventListeners();
    this.subscriptions.unsubscribe();
  }

  /**
   * The main state update handler.
   * It calls specific UI update methods to reflect the current state.
   * @param {SimulationState} state - The new simulation state from the store.
   */
  public handleStateUpdate(state: SimulationState): void {
    this._updateTimeDisplay(state.time);
    this._updatePlayPauseButton(state.paused);
    this._updateScaleDisplay(state.timeScale);
    this._updateReverseButton(state.timeScale);
    this._updateSpeedButtons(state.paused, state.timeScale);
    this._updateEngineDisplay(state.physicsEngine);
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
    // Use setTimeout to allow a potential 'change' event to fire first
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
    const button = this.uiElements.playPauseButton;
    if (button) {
      const stateText = isPaused ? "Play" : "Pause";
      const tooltipText = `${stateText} Simulation`;
      const iconSvg = isPaused ? PlayIcon : PauseIcon;

      const iconSpan = button.querySelector('[slot="icon"]');
      if (iconSpan) {
        iconSpan.innerHTML = iconSvg;
      } else {
        button.innerHTML = `<span slot="icon">${iconSvg}</span>`;
      }

      button.title = tooltipText;
      // Note: Assuming teskooano-button has a method to refresh its tooltip content if needed.
      // button.refreshTooltipContent();
      button.toggleAttribute("active", !isPaused);
    }
  };

  private _updateScaleDisplay = (timeScale: number): void => {
    const element = this.uiElements.scaleValueDisplay;
    if (element) {
      element.textContent = formatScale(timeScale);
      element.style.color =
        timeScale < 0
          ? "var(--color-warning-emphasis)"
          : "var(--color-text-secondary)";
    }
  };

  private _updateReverseButton = (timeScale: number): void => {
    const button = this.uiElements.reverseButton;
    if (button) {
      button.toggleAttribute("active", timeScale < 0);
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
    const element = this.uiElements.engineValueDisplay;
    if (element) {
      const name = engineName || "-";
      element.textContent = getEngineShortName(name);
      element.setAttribute("data-full-name", name);
    }
  };
}
