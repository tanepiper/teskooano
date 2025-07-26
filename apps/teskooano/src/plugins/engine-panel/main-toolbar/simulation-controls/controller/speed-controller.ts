import { actions, StateAccessor } from "@teskooano/core-state";
import { formatScale } from "./simulation-controls.utils";

export interface SpeedControlConfig {
  scaleValueDisplay: HTMLElement | null;
  scaleSelect: HTMLSelectElement | null;
  speedValues: number[];
}

/**
 * Manages speed controls and scale display for the simulation.
 * Handles the dropdown selection and speed adjustments.
 */
export class SpeedController {
  private config: SpeedControlConfig;

  constructor(config: SpeedControlConfig) {
    this.config = config;
  }

  /**
   * Updates the scale display with the current time scale
   */
  public updateScaleDisplay(timeScale: number): void {
    const element = this.config.scaleValueDisplay;
    if (element) {
      element.textContent = formatScale(timeScale);
      element.style.color =
        timeScale < 0
          ? "var(--color-warning-emphasis)"
          : "var(--color-text-secondary)";
    }
  }

  /**
   * Shows the scale selection dropdown
   */
  public showScaleSelect = (): void => {
    const { scaleValueDisplay, scaleSelect, speedValues } = this.config;
    if (!scaleValueDisplay || !scaleSelect) return;

    scaleValueDisplay.style.display = "none";
    scaleSelect.style.display = "inline-block";
    scaleSelect.innerHTML = "";

    let currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    currentScale =
      currentScale < 0
        ? Math.abs(currentScale)
        : currentScale === 0
          ? 1
          : currentScale;

    speedValues.forEach((val) => {
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

  /**
   * Hides the scale select and optionally applies the change
   */
  public hideScaleSelectAndApply = (applyChange: boolean): void => {
    const { scaleValueDisplay, scaleSelect } = this.config;
    if (!scaleValueDisplay || !scaleSelect) return;

    if (applyChange) {
      const selectedValue = parseFloat(scaleSelect.value);
      if (!isNaN(selectedValue)) {
        const currentSimState = StateAccessor.getCurrentSimulationState();
        const newScale =
          currentSimState.timeScale < 0 ? -selectedValue : selectedValue;
        actions.setTimeScale(newScale);
      }
    }
    scaleSelect.style.display = "none";
    scaleValueDisplay.style.display = "";
  };

  /**
   * Increases the simulation speed
   */
  public speedUp = (): void => {
    const currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    if (currentScale === 0) {
      actions.setTimeScale(1);
      return;
    }
    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);
    const nextSpeed =
      this.config.speedValues.find((v) => v > absScale) ||
      this.config.speedValues[this.config.speedValues.length - 1];
    actions.setTimeScale(nextSpeed * sign);
  };

  /**
   * Decreases the simulation speed
   */
  public speedDown = (): void => {
    const currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    if (currentScale === 0) {
      actions.setTimeScale(-1);
      return;
    }
    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);
    const prevSpeed =
      [...this.config.speedValues].reverse().find((v) => v < absScale) ||
      this.config.speedValues[0];
    actions.setTimeScale(prevSpeed * sign);
  };

  /**
   * Reverses the simulation direction
   */
  public reverse = (): void => {
    const currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    actions.setTimeScale(currentScale === 0 ? -1 : -currentScale);
  };

  /**
   * Updates the state of speed control buttons
   */
  public updateSpeedButtons(
    isPaused: boolean,
    timeScale: number,
    speedDownButton: HTMLElement | null,
    speedUpButton: HTMLElement | null,
  ): void {
    if (speedDownButton) {
      (speedDownButton as any).disabled =
        isPaused ||
        (Math.abs(timeScale) <= this.config.speedValues[0] && timeScale !== 0);
    }
    if (speedUpButton) {
      (speedUpButton as any).disabled =
        isPaused ||
        Math.abs(timeScale) >=
          this.config.speedValues[this.config.speedValues.length - 1];
    }
  }

  /**
   * Creates event handlers for scale select interactions
   */
  public createEventHandlers() {
    return {
      handleScaleSelectChange: () => this.hideScaleSelectAndApply(true),
      handleScaleSelectBlur: () => {
        setTimeout(() => {
          if (document.activeElement !== this.config.scaleSelect) {
            this.hideScaleSelectAndApply(false);
          }
        }, 100);
      },
      handleScaleSelectKeydown: (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.hideScaleSelectAndApply(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          this.hideScaleSelectAndApply(false);
        }
      },
    };
  }
}
