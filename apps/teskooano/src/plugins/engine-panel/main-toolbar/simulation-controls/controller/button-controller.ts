import { actions } from "@teskooano/core-state";
import type { TeskooanoButton } from "../../../../../core/components/button/Button";
import { PauseIcon, PlayIcon } from "../view/simulation-controls.template";
import {
  getConfigurationDisplayName,
  getConfigurationShortName,
} from "./simulation-controls.utils";

export interface ButtonControlConfig {
  playPauseButton: TeskooanoButton | null;
  reverseButton: TeskooanoButton | null;
  engineValueDisplay: HTMLElement | null;
}

/**
 * Manages button states and updates for the simulation controls.
 * Handles play/pause, reverse, and engine display logic.
 */
export class ButtonController {
  private config: ButtonControlConfig;

  constructor(config: ButtonControlConfig) {
    this.config = config;
  }

  /**
   * Updates the play/pause button state
   */
  public updatePlayPauseButton(isPaused: boolean): void {
    const button = this.config.playPauseButton;
    if (!button) return;

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
    button.toggleAttribute("active", !isPaused);
  }

  /**
   * Updates the reverse button state
   */
  public updateReverseButton(timeScale: number): void {
    const button = this.config.reverseButton;
    if (button) {
      button.toggleAttribute("active", timeScale < 0);
    }
  }

  /**
   * Updates the engine display
   */
  public updateEngineDisplay(config: any): void {
    const element = this.config.engineValueDisplay;
    if (element) {
      const shortName = getConfigurationShortName(config);
      const fullName = getConfigurationDisplayName(config);
      element.textContent = shortName;
      element.setAttribute("data-full-name", fullName);
    }
  }

  /**
   * Toggles the simulation pause state
   */
  public togglePause = (): void => {
    actions.togglePause();
  };

  /**
   * Creates event handlers for button interactions
   */
  public createEventHandlers() {
    return {
      playPauseHandler: this.togglePause,
    };
  }
}
