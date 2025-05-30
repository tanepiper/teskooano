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
import { formatScale } from "./SimulationControls.utils";

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

  const speedValues = [
    0.0625, // 1/16
    0.125, // 1/8
    0.25, // 1/4
    0.5, // 1/2
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    12,
    14,
    16,
    20,
    24,
    32,
    48,
    64,
    96,
    128,
    192,
    256,
    384,
    512,
    768,
    1024,
    2048,
    4096,
    8192,
    16384,
    32768,
    65536,
    131072,
    262144,
    524288,
    1048576,
    2097152,
    4194304,
    8388608,
    10000000,
  ];

  const speedUpHandler = (): void => {
    const currentScale = getSimulationState().timeScale;

    // If scale is 0, set to first positive speed (1/16 or -1/16)
    if (currentScale === 0) {
      actions.setTimeScale(1); // Start at real time (x1)
      return;
    }

    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);

    // Find the next speed value
    let nextSpeed = speedValues[0];

    for (let i = 0; i < speedValues.length; i++) {
      if (absScale < speedValues[i]) {
        // Found the next speed up
        nextSpeed = speedValues[i];
        break;
      } else if (absScale === speedValues[i] && i < speedValues.length - 1) {
        // Exact match, take the next value
        nextSpeed = speedValues[i + 1];
        break;
      } else if (i === speedValues.length - 1) {
        // At max speed already
        nextSpeed = speedValues[i];
      }
    }

    actions.setTimeScale(nextSpeed * sign);
  };

  const speedDownHandler = (): void => {
    const currentScale = getSimulationState().timeScale;

    // If scale is 0, set to -1 (real time in reverse)
    if (currentScale === 0) {
      actions.setTimeScale(-1);
      return;
    }

    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);

    // Find the previous speed value
    let prevSpeed = speedValues[0]; // Default to minimum if nothing smaller found

    for (let i = speedValues.length - 1; i >= 0; i--) {
      if (absScale > speedValues[i]) {
        // Found the next speed down
        prevSpeed = speedValues[i];
        break;
      } else if (absScale === speedValues[i] && i > 0) {
        // Exact match, take the previous value
        prevSpeed = speedValues[i - 1];
        break;
      } else if (i === 0 && absScale <= speedValues[0]) {
        // Already at or below minimum speed, stay at minimum
        prevSpeed = speedValues[0];
      }
    }

    actions.setTimeScale(prevSpeed * sign);
  };

  const reverseHandler = (): void => {
    const currentScale = getSimulationState().timeScale;
    actions.setTimeScale(currentScale === 0 ? -1 : -currentScale);
  };

  const showScaleSelect = () => {
    if (!uiElements.scaleValueDisplay || !uiElements.scaleSelect) return;

    uiElements.scaleValueDisplay.style.display = "none";
    uiElements.scaleSelect.style.display = "inline-block";
    uiElements.scaleSelect.innerHTML = ""; // Clear previous options

    const currentSimState = getSimulationState();
    let currentScale = currentSimState.timeScale;
    // If current scale is negative, we use its absolute for matching,
    // but the dropdown will only contain positive values.
    // The reverse button handles direction.
    if (currentScale < 0) currentScale = Math.abs(currentScale);
    if (currentScale === 0) currentScale = 1; // Default to 1x if 0

    speedValues.forEach((val) => {
      const option = document.createElement("option");
      option.value = val.toString();
      option.textContent = formatScale(val);
      uiElements.scaleSelect!.appendChild(option);
      if (val === currentScale) {
        option.selected = true;
      }
    });
    // Ensure a value is selected if currentScale wasn't in the list (e.g. very small fractional)
    // or if it was 0 and defaulted to 1.
    if (
      !uiElements.scaleSelect.value &&
      uiElements.scaleSelect.options.length > 0
    ) {
      // Attempt to find the closest value or default to 1x
      let closestMatch = speedValues.find((v) => v === 1) || speedValues[0];
      let smallestDiff = Infinity;
      speedValues.forEach((v) => {
        const diff = Math.abs(v - currentScale);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestMatch = v;
        }
      });
      uiElements.scaleSelect.value = closestMatch.toString();
    }

    uiElements.scaleSelect.focus();
  };

  const hideScaleSelectAndApply = (applyChange: boolean) => {
    if (!uiElements.scaleValueDisplay || !uiElements.scaleSelect) return;

    if (applyChange) {
      const selectedValue = parseFloat(uiElements.scaleSelect.value);
      if (!isNaN(selectedValue)) {
        const currentSimState = getSimulationState();
        // Preserve sign if it was negative, otherwise use positive selected value
        const newScale =
          currentSimState.timeScale < 0 ? -selectedValue : selectedValue;
        if (newScale !== currentSimState.timeScale) {
          actions.setTimeScale(newScale);
        }
      }
    }

    uiElements.scaleSelect.style.display = "none";
    uiElements.scaleValueDisplay.style.display = "";
  };

  const handleScaleValueClick = () => {
    showScaleSelect();
  };

  const handleScaleSelectChange = () => {
    hideScaleSelectAndApply(true);
  };

  const handleScaleSelectBlur = () => {
    // setTimeout to allow 'change' event to fire first if a value was selected by click
    setTimeout(() => {
      if (document.activeElement !== uiElements.scaleSelect) {
        hideScaleSelectAndApply(false); // Don't apply change on blur, only on explicit select/enter
      }
    }, 100);
  };

  const handleScaleSelectKeydown = (event: KeyboardEvent) => {
    if (!uiElements.scaleSelect) return;

    const currentScale = parseFloat(uiElements.scaleSelect.value);
    let currentIndex = speedValues.findIndex((v) => v === currentScale);
    if (currentIndex === -1 && speedValues.length > 0) {
      // if not found, pick closest or first
      let smallestDiff = Infinity;
      speedValues.forEach((v, i) => {
        const diff = Math.abs(v - currentScale);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          currentIndex = i;
        }
      });
    }

    if (event.key === "Enter") {
      event.preventDefault();
      hideScaleSelectAndApply(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      hideScaleSelectAndApply(false);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex > 0) {
        const newScaleValue = speedValues[currentIndex - 1];
        uiElements.scaleSelect.value = newScaleValue.toString();
        // Apply immediately as per user request for arrow keys
        const currentSimState = getSimulationState();
        const newScale =
          currentSimState.timeScale < 0 ? -newScaleValue : newScaleValue;
        actions.setTimeScale(newScale);
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (currentIndex < speedValues.length - 1) {
        const newScaleValue = speedValues[currentIndex + 1];
        uiElements.scaleSelect.value = newScaleValue.toString();
        // Apply immediately as per user request for arrow keys
        const currentSimState = getSimulationState();
        const newScale =
          currentSimState.timeScale < 0 ? -newScaleValue : newScaleValue;
        actions.setTimeScale(newScale);
      }
    }
  };

  const add = (): void => {
    uiElements.playPauseButton?.addEventListener("click", playPauseHandler);
    uiElements.speedUpButton?.addEventListener("click", speedUpHandler);
    uiElements.speedDownButton?.addEventListener("click", speedDownHandler);
    uiElements.reverseButton?.addEventListener("click", reverseHandler);
    uiElements.scaleValueDisplay?.addEventListener(
      "click",
      handleScaleValueClick,
    );
    uiElements.scaleSelect?.addEventListener("change", handleScaleSelectChange);
    uiElements.scaleSelect?.addEventListener("blur", handleScaleSelectBlur);
    uiElements.scaleSelect?.addEventListener(
      "keydown",
      handleScaleSelectKeydown,
    );
  };

  const remove = (): void => {
    uiElements.playPauseButton?.removeEventListener("click", playPauseHandler);
    uiElements.speedUpButton?.removeEventListener("click", speedUpHandler);
    uiElements.speedDownButton?.removeEventListener("click", speedDownHandler);
    uiElements.reverseButton?.removeEventListener("click", reverseHandler);
    uiElements.scaleValueDisplay?.removeEventListener(
      "click",
      handleScaleValueClick,
    );
    uiElements.scaleSelect?.removeEventListener(
      "change",
      handleScaleSelectChange,
    );
    uiElements.scaleSelect?.removeEventListener("blur", handleScaleSelectBlur);
    uiElements.scaleSelect?.removeEventListener(
      "keydown",
      handleScaleSelectKeydown,
    );
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
