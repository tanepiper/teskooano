import {
  actions,
  getSimulationState,
  type SimulationState,
} from "@teskooano/core-state";
import type { SimulationUIElements } from "./SimulationControls.updater";
import {
  updateTimeDisplay,
  updatePlayPauseButton,
  updateScaleDisplay,
  updateReverseButton,
  updateSpeedButtons,
  updateEngineDisplay,
} from "./SimulationControls.updater";

let previousPausedState: boolean | undefined = undefined;
let previousTimeScaleState: number | undefined = undefined;
let previousEngineState: string | undefined = undefined;

/**
 * The main state update handler. Called when the simulationState changes.
 * It compares the new state with the previous state and calls specific UI
 * update functions only for the parts of the state that have changed.
 *
 * @param {SimulationState} state - The new simulation state.
 * @param {SimulationUIElements} uiElements - References to the UI elements.
 */
const handleStateUpdate = (
  state: SimulationState,
  uiElements: SimulationUIElements,
): void => {
  updateTimeDisplay(uiElements.timeValueDisplay, state.time);

  if (state.paused !== previousPausedState) {
    updatePlayPauseButton(uiElements.playPauseButton, state.paused);

    updateSpeedButtons(
      uiElements.speedDownButton,
      uiElements.speedUpButton,
      state.paused,
      state.timeScale,
    );
    previousPausedState = state.paused;
  }

  if (state.timeScale !== previousTimeScaleState) {
    updateScaleDisplay(uiElements.scaleValueDisplay, state.timeScale);
    updateReverseButton(uiElements.reverseButton, state.timeScale);

    updateSpeedButtons(
      uiElements.speedDownButton,
      uiElements.speedUpButton,
      state.paused,
      state.timeScale,
    );
    previousTimeScaleState = state.timeScale;
  }

  if (state.physicsEngine !== previousEngineState) {
    updateEngineDisplay(uiElements.engineValueDisplay, state.physicsEngine);
    previousEngineState = state.physicsEngine;
  }
};

/**
 * Sets up the event listeners for the simulation control buttons.
 *
 * @param {SimulationUIElements} uiElements - References to the UI elements.
 * @returns {Function[]} An array of cleanup functions to remove the listeners.
 */
export const setupEventHandlers = (
  uiElements: SimulationUIElements,
): { add: () => void; remove: () => void } => {
  const playPauseHandler = actions.togglePause;
  const speedUpHandler = (): void => {
    const currentScale = getSimulationState().timeScale;
    const newScale =
      currentScale === 0
        ? 1
        : currentScale < 0
          ? Math.min(currentScale / 2, -0.1)
          : Math.min(currentScale * 2, 10_000_000);
    actions.setTimeScale(newScale);
  };

  const speedDownHandler = (): void => {
    const currentScale = getSimulationState().timeScale;
    const newScale =
      currentScale > 0
        ? Math.max(currentScale / 2, 0.1)
        : currentScale < 0
          ? Math.max(currentScale * 2, -10_000_000)
          : 0;
    actions.setTimeScale(newScale);
  };

  const reverseHandler = (): void => {
    const currentScale = getSimulationState().timeScale;
    actions.setTimeScale(currentScale === 0 ? -1 : -currentScale);
  };

  const add = (): void => {
    uiElements.playPauseButton?.addEventListener("click", playPauseHandler);
    uiElements.speedUpButton?.addEventListener("click", speedUpHandler);
    uiElements.speedDownButton?.addEventListener("click", speedDownHandler);
    uiElements.reverseButton?.addEventListener("click", reverseHandler);
  };

  const remove = (): void => {
    uiElements.playPauseButton?.removeEventListener("click", playPauseHandler);
    uiElements.speedUpButton?.removeEventListener("click", speedUpHandler);
    uiElements.speedDownButton?.removeEventListener("click", speedDownHandler);
    uiElements.reverseButton?.removeEventListener("click", reverseHandler);
  };

  return { add, remove };
};

/**
 * Creates and returns the state update handler function, bound to the UI elements.
 *
 * @param {SimulationUIElements} uiElements - References to the UI elements.
 * @returns {(state: SimulationState) => void} The state update handler function.
 */
export const createStateUpdateHandler = (
  uiElements: SimulationUIElements,
): ((state: SimulationState) => void) => {
  previousPausedState = undefined;
  previousTimeScaleState = undefined;
  previousEngineState = undefined;

  return (state) => handleStateUpdate(state, uiElements);
};
