import {
  StateAccessor,
  simulationState$,
  StateSubscriptionMixin,
  type SimulationState,
} from "@teskooano/core-state";
import type { TeskooanoButton } from "../../../../../core/components/button/Button";
import {
  TimeDisplayManager,
  type TimeDisplayConfig,
} from "./time-display-manager";
import { SpeedController, type SpeedControlConfig } from "./speed-controller";
import {
  ButtonController,
  type ButtonControlConfig,
} from "./button-controller";

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
 * Main controller for the SimulationControls component.
 *
 * This class has been refactored to use specialized managers for different concerns:
 * - TimeDisplayManager: Handles time display and date editing
 * - SpeedController: Manages speed controls and scale display
 * - ButtonController: Handles button states and interactions
 *
 * The main controller now focuses on orchestration and state subscription.
 */
export class SimulationControlsController extends StateSubscriptionMixin {
  private uiElements: SimulationUIElements;
  private timeDisplayManager: TimeDisplayManager;
  private speedController: SpeedController;
  private buttonController: ButtonController;

  private readonly speedValues = [
    0.0625, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24,
    32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608,
    10000000,
  ];

  /**
   * Constructs the controller and initializes specialized managers.
   */
  constructor(uiElements: SimulationUIElements) {
    super();
    this.uiElements = uiElements;

    // Initialize specialized managers
    this.timeDisplayManager = this.createTimeDisplayManager();
    this.speedController = this.createSpeedController();
    this.buttonController = this.createButtonController();
  }

  /**
   * Initializes the controller by setting up managers and subscribing to state.
   */
  public init(): void {
    this.setupEventListeners();
    this.handleStateUpdate(StateAccessor.getSimulationState());

    this.subscribeToState(simulationState$, (state: SimulationState) => {
      this.handleStateUpdate(state);
    });
  }

  /**
   * Resets the simulation start date to the current time.
   */
  public resetStartDate(): void {
    this.timeDisplayManager.resetStartDate();
  }

  /**
   * Sets a custom start date for the simulation.
   */
  public setStartDate(startDate: Date): void {
    this.timeDisplayManager.setStartDate(startDate);
  }

  /**
   * Gets the current simulation date.
   */
  public getCurrentDate(): Date {
    return this.timeDisplayManager.getCurrentDate();
  }

  /**
   * Cleans up the controller and all managers.
   */
  public dispose(): void {
    this.removeEventListeners();
    this.timeDisplayManager.dispose();
    super.dispose();
  }

  /**
   * The main state update handler - delegates to specialized managers.
   */
  public handleStateUpdate(state: SimulationState): void {
    this.timeDisplayManager.updateDisplay(state.time);
    this.buttonController.updatePlayPauseButton(state.paused);
    this.buttonController.updateReverseButton(state.timeScale);
    this.buttonController.updateEngineDisplay(state.simulationConfig);
    this.speedController.updateScaleDisplay(state.timeScale);
    this.speedController.updateSpeedButtons(
      state.paused,
      state.timeScale,
      this.uiElements.speedDownButton,
      this.uiElements.speedUpButton,
    );
  }

  /**
   * Creates the time display manager with proper configuration.
   */
  private createTimeDisplayManager(): TimeDisplayManager {
    const config: TimeDisplayConfig = {
      element: this.uiElements.timeValueDisplay!,
      compact: this.uiElements.timeValueDisplay?.closest("[mobile]") !== null,
      onDateChange: (newDate: Date) => {
        // Optional callback for external date change handling
        console.log(`Date changed to: ${newDate.toISOString()}`);
      },
    };
    return new TimeDisplayManager(config);
  }

  /**
   * Creates the speed controller with proper configuration.
   */
  private createSpeedController(): SpeedController {
    const config: SpeedControlConfig = {
      scaleValueDisplay: this.uiElements.scaleValueDisplay,
      scaleSelect: this.uiElements.scaleSelect,
      speedValues: this.speedValues,
    };
    return new SpeedController(config);
  }

  /**
   * Creates the button controller with proper configuration.
   */
  private createButtonController(): ButtonController {
    const config: ButtonControlConfig = {
      playPauseButton: this.uiElements.playPauseButton,
      reverseButton: this.uiElements.reverseButton,
      engineValueDisplay: this.uiElements.engineValueDisplay,
    };
    return new ButtonController(config);
  }

  /**
   * Sets up all event listeners using the specialized managers.
   */
  private setupEventListeners(): void {
    const buttonHandlers = this.buttonController.createEventHandlers();
    const speedHandlers = this.speedController.createEventHandlers();

    // Button events
    this.uiElements.playPauseButton?.addEventListener(
      "click",
      buttonHandlers.playPauseHandler,
    );
    this.uiElements.speedUpButton?.addEventListener(
      "click",
      this.speedController.speedUp,
    );
    this.uiElements.speedDownButton?.addEventListener(
      "click",
      this.speedController.speedDown,
    );
    this.uiElements.reverseButton?.addEventListener(
      "click",
      this.speedController.reverse,
    );

    // Speed control events
    this.uiElements.scaleValueDisplay?.addEventListener(
      "click",
      this.speedController.showScaleSelect,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "change",
      speedHandlers.handleScaleSelectChange,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "blur",
      speedHandlers.handleScaleSelectBlur,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "keydown",
      speedHandlers.handleScaleSelectKeydown,
    );
  }

  /**
   * Removes all event listeners.
   */
  private removeEventListeners(): void {
    const buttonHandlers = this.buttonController.createEventHandlers();
    const speedHandlers = this.speedController.createEventHandlers();

    // Button events
    this.uiElements.playPauseButton?.removeEventListener(
      "click",
      buttonHandlers.playPauseHandler,
    );
    this.uiElements.speedUpButton?.removeEventListener(
      "click",
      this.speedController.speedUp,
    );
    this.uiElements.speedDownButton?.removeEventListener(
      "click",
      this.speedController.speedDown,
    );
    this.uiElements.reverseButton?.removeEventListener(
      "click",
      this.speedController.reverse,
    );

    // Speed control events
    this.uiElements.scaleValueDisplay?.removeEventListener(
      "click",
      this.speedController.showScaleSelect,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "change",
      speedHandlers.handleScaleSelectChange,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "blur",
      speedHandlers.handleScaleSelectBlur,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "keydown",
      speedHandlers.handleScaleSelectKeydown,
    );
  }
}
