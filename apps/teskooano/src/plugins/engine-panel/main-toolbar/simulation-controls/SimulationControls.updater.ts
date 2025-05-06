import type { TeskooanoButton } from "../../../../core/components/button/Button";
import { PlayIcon, PauseIcon } from "./SimulationControls.template";
import {
  formatScale,
  formatTime,
  getEngineShortName,
} from "./SimulationControls.utils";

/**
 * @interface SimulationUIElements
 * @description Defines the structure for the object holding references to the UI elements managed by the updater.
 */
export interface SimulationUIElements {
  playPauseButton: TeskooanoButton | null;
  speedUpButton: TeskooanoButton | null;
  speedDownButton: TeskooanoButton | null;
  reverseButton: TeskooanoButton | null;
  scaleValueDisplay: HTMLElement | null;
  timeValueDisplay: HTMLElement | null;
  engineValueDisplay: HTMLElement | null;
}

/**
 * Updates the time display element with the formatted simulation time.
 *
 * @param {HTMLElement | null} element - The time display element.
 * @param {number} [timeSeconds=0] - The current simulation time in seconds.
 */
export const updateTimeDisplay = (
  element: HTMLElement | null,
  timeSeconds: number = 0,
): void => {
  if (element) {
    element.textContent = formatTime(timeSeconds);
  }
};

/**
 * Updates the play/pause button's icon, title, and active state based on the simulation pause state.
 *
 * @param {TeskooanoButton | null} button - The play/pause button element.
 * @param {boolean} isPaused - Whether the simulation is currently paused.
 */
export const updatePlayPauseButton = (
  button: TeskooanoButton | null,
  isPaused: boolean,
): void => {
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
    button.setAttribute("tooltip-text", tooltipText);
    button.setAttribute("tooltip-title", stateText);
    button.setAttribute("tooltip-icon", iconSvg);

    button.toggleAttribute("active", !isPaused);

    button.refreshTooltipContent();
  }
};

/**
 * Updates the scale display element with the formatted time scale and adjusts its color for negative values.
 *
 * @param {HTMLElement | null} element - The scale display element.
 * @param {number} timeScale - The current simulation time scale.
 */
export const updateScaleDisplay = (
  element: HTMLElement | null,
  timeScale: number,
): void => {
  if (element) {
    element.textContent = formatScale(timeScale);

    element.style.color =
      timeScale < 0
        ? "var(--color-warning-emphasis)"
        : "var(--color-text-secondary)";
  }
};

/**
 * Updates the reverse button's active state based on whether the time scale is negative.
 *
 * @param {TeskooanoButton | null} button - The reverse button element.
 * @param {number} timeScale - The current simulation time scale.
 */
export const updateReverseButton = (
  button: TeskooanoButton | null,
  timeScale: number,
): void => {
  if (button) {
    button.toggleAttribute("active", timeScale < 0);
  }
};

/**
 * Updates the enabled/disabled state of the speed up and speed down buttons
 * based on the pause state and current time scale limits.
 *
 * @param {TeskooanoButton | null} speedDownButton - The speed down button element.
 * @param {TeskooanoButton | null} speedUpButton - The speed up button element.
 * @param {boolean} isPaused - Whether the simulation is currently paused.
 * @param {number} timeScale - The current simulation time scale.
 */
export const updateSpeedButtons = (
  speedDownButton: TeskooanoButton | null,
  speedUpButton: TeskooanoButton | null,
  isPaused: boolean,
  timeScale: number,
): void => {
  if (speedDownButton) {
    const disableSpeedDown =
      isPaused ||
      (timeScale > 0 && timeScale <= 0.1) ||
      (timeScale < 0 && timeScale >= -0.1);

    speedDownButton.disabled = disableSpeedDown;
  }
  if (speedUpButton) {
    const disableSpeedUp =
      isPaused ||
      (timeScale < 0 && timeScale <= -10_000_000) ||
      (timeScale > 0 && timeScale >= 10_000_000);
    speedUpButton.disabled = disableSpeedUp;
  }
};

/**
 * Updates the engine display element with the short name of the physics engine.
 *
 * @param {HTMLElement | null} element - The engine display element.
 * @param {string | undefined} engineName - The name of the current physics engine.
 */
export const updateEngineDisplay = (
  element: HTMLElement | null,
  engineName: string | undefined,
): void => {
  if (element) {
    const name = engineName || "-";
    element.textContent = getEngineShortName(name);
    element.setAttribute("data-full-name", name);
  }
};
