import {
  actions,
  simulationState,
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

// Store previous relevant state pieces to avoid unnecessary updates
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
  // 1. Always update time display (most frequent change)
  updateTimeDisplay(uiElements.timeValueDisplay, state.time);

  // 2. Update play/pause ONLY if paused state changed
  if (state.paused !== previousPausedState) {
    updatePlayPauseButton(uiElements.playPauseButton, state.paused);
    // Also re-evaluate speed button disabled state when pause changes
    updateSpeedButtons(
      uiElements.speedDownButton,
      uiElements.speedUpButton,
      state.paused,
      state.timeScale,
    );
    previousPausedState = state.paused;
  }

  // 3. Update scale/speed/reverse ONLY if timeScale changed
  if (state.timeScale !== previousTimeScaleState) {
    updateScaleDisplay(uiElements.scaleValueDisplay, state.timeScale);
    updateReverseButton(uiElements.reverseButton, state.timeScale);
    // Also re-evaluate speed button disabled state when scale changes
    updateSpeedButtons(
      uiElements.speedDownButton,
      uiElements.speedUpButton,
      state.paused, // Use current paused state
      state.timeScale,
    );
    previousTimeScaleState = state.timeScale;
  }

  // 4. Update engine ONLY if physicsEngine changed
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
    const currentScale = simulationState.get().timeScale;
    const newScale =
      currentScale === 0
        ? 1 // Start forward from zero
        : currentScale < 0
          ? Math.min(currentScale / 2, -0.1) // Speed up towards -0.1 from negative
          : Math.min(currentScale * 2, 10_000_000); // Speed up towards positive max
    actions.setTimeScale(newScale);
  };

  const speedDownHandler = (): void => {
    const currentScale = simulationState.get().timeScale;
    const newScale =
      currentScale > 0
        ? Math.max(currentScale / 2, 0.1) // Slow down towards 0.1 from positive
        : currentScale < 0
          ? Math.max(currentScale * 2, -10_000_000) // Slow down towards negative max
          : 0; // Already at zero, stay zero (should be disabled anyway)
    actions.setTimeScale(newScale);
  };

  const reverseHandler = (): void => {
    const currentScale = simulationState.get().timeScale;
    actions.setTimeScale(currentScale === 0 ? -1 : -currentScale); // Toggle sign, or start at -1 from 0
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
  // Reset previous state cache when handler is created
  previousPausedState = undefined;
  previousTimeScaleState = undefined;
  previousEngineState = undefined;
  // Return the handler function, bound to the specific UI elements
  return (state) => handleStateUpdate(state, uiElements);
};
