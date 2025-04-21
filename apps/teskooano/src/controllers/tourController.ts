import { Config, driver, PopoverDOM, State } from "driver.js";
import "driver.js/dist/driver.css";
import { createIntroTour } from "../components/tours/intro-tour";
import { type TourStep } from "../components/tours/types";

/**
 * Manages the application tour using driver.js.
 * Handles starting, resuming, restarting, and skipping the tour.
 * Dynamically updates tour steps based on application state.
 */
export class TourController {
  /** The driver.js instance used for the tour. */
  private readonly driverInstance: ReturnType<typeof driver>;
  /** The index of the current active step in the tour. */
  private currentStepIndex = 0;
  /** The name of the currently selected celestial object, used for dynamic step content. */
  private currentSelectedCelestial: string | undefined;
  /** The array of tour steps configured for the current tour. */
  private tourSteps: TourStep[] = [];
  /** The ID of the active engine view panel, used by some step actions. */
  private engineViewId: string | null = null;

  /**
   * Creates an instance of TourController.
   * Initializes driver.js with default configuration and loads the intro tour steps.
   */
  constructor() {
    // Initialize driver.js with default configurations
    this.driverInstance = driver({
      animate: true,
      showProgress: true,
      showButtons: ["next", "previous"],
      steps: [],
      overlayColor: "rgba(0, 0, 0, 0.75)",
      allowClose: true,
      disableActiveInteraction: false,

      onPopoverRender: (
        popover: PopoverDOM,
        opts: { config: Config; state: State },
      ) => {
        const currentStep =
          this.tourSteps[this.driverInstance.getActiveIndex()!];
        if (currentStep.onPopoverRender) {
          currentStep.onPopoverRender(popover, opts);
        }
      },
      onNextClick: () => {
        // Move to next step
        const currentStep =
          this.tourSteps[this.driverInstance.getActiveIndex()!];
        if (currentStep.onNextClick) {
          currentStep.onNextClick(this?.engineViewId ?? undefined);
        } else {
          this.driverInstance.moveNext();
        }
      },
      onHighlightStarted: () => {
        // Save current step to localStorage if not skipping
        if (!this.isSkippingTour()) {
          const currentStep =
            this.tourSteps[this.driverInstance.getActiveIndex()!];
          localStorage.setItem("tourCurrentStep", currentStep.id);
          if (currentStep.onHighlightStarted) {
            currentStep.onHighlightStarted();
          }
        }
      },
      onDeselected: () => {
        // When tour is closed, don't automatically start it next time
        if (!this.isSkippingTour()) {
          localStorage.setItem("skipTour", "true");
        }
      },
    });

    // Clone the base steps to our instance variable
    this.tourSteps = createIntroTour(this.driverInstance);
  }

  /**
   * Sets the ID of the currently active engine view panel.
   * This ID might be needed by specific tour steps to interact with the correct panel.
   * @param engineViewId - The ID of the active engine view Dockview panel.
   */
  public setEngineViewId(engineViewId: string): void {
    this.engineViewId = engineViewId;
  }

  /**
   * Sets the current selected celestial object name.
   * Updates relevant tour steps that might display dynamic content based on the selection.
   * @param celestialName - The name of the selected celestial object, or undefined if none is selected.
   */
  public setCurrentSelectedCelestial(celestialName: string | undefined): void {
    this.currentSelectedCelestial = celestialName;
    this.updateDynamicTourSteps();
  }

  /**
   * Updates any tour steps that depend on dynamic application state,
   * like the currently selected celestial object.
   * @private
   */
  private updateDynamicTourSteps(): void {
    // Find the engine-view-final step and update its description
    const finalStepIndex = this.tourSteps.findIndex(
      (step) => step.id === "engine-view-final",
    );
    if (finalStepIndex !== -1) {
      // Create a custom description based on the selected celestial
      let description =
        "Now you should see the full system in action. Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.";

      if (this.currentSelectedCelestial) {
        description = `Now you should see the ${this.currentSelectedCelestial} in the 3D view. You can see more details about it in the Celestial Info panel. Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.`;
      } else {
        description =
          "Now you should see the full system. Select a celestial body from the Focus Control panel to see more details about it. Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.";
      }

      // Update the step description
      if (this.tourSteps[finalStepIndex].popover) {
        this.tourSteps[finalStepIndex].popover.description = description;
      }
    }
  }

  /**
   * Checks if the user has previously chosen to skip the tour.
   * Reads the preference from localStorage.
   * @returns True if the tour should be skipped, false otherwise.
   */
  public isSkippingTour(): boolean {
    return localStorage.getItem("skipTour") === "true";
  }

  /**
   * Checks if the initial tour prompt modal has been shown before.
   * Reads the preference from localStorage.
   * @returns True if the modal has been shown, false otherwise.
   */
  public hasShownTourModal(): boolean {
    return localStorage.getItem("tourModalShown") === "true";
  }

  /**
   * Marks the initial tour prompt modal as shown in localStorage.
   */
  public markTourModalAsShown(): void {
    localStorage.setItem("tourModalShown", "true");
  }

  /**
   * Starts the tour from the very beginning (step 0).
   * Ensures dynamic steps are updated before starting.
   */
  public startTour(): void {
    this.currentStepIndex = 0;
    // Make sure dynamic content is up to date
    this.updateDynamicTourSteps();
    this.driverInstance.setSteps(this.tourSteps);
    this.driverInstance.drive();
  }

  /**
   * Resumes the tour from the last saved step (read from localStorage).
   * If no saved step is found, starts from the beginning.
   * Ensures dynamic steps are updated before starting.
   */
  public resumeTour(): void {
    const savedStepId = localStorage.getItem("tourCurrentStep");

    if (savedStepId) {
      // Find the index of the saved step
      const stepIndex = this.tourSteps.findIndex(
        (step) => step.id === savedStepId,
      );
      this.currentStepIndex = stepIndex >= 0 ? stepIndex : 0;
    } else {
      this.currentStepIndex = 0;
    }

    // Make sure dynamic content is up to date
    this.updateDynamicTourSteps();
    this.driverInstance.setSteps(this.tourSteps);
    this.driverInstance.drive(this.currentStepIndex);
  }

  /**
   * Restarts the tour from the beginning, clearing any saved step progress.
   */
  public restartTour(): void {
    localStorage.removeItem("tourCurrentStep");
    this.startTour();
  }

  /**
   * Sets the user's preference for skipping the tour in the future.
   * Stores the preference in localStorage.
   * @param skip - True to skip the tour in the future, false to show it.
   */
  public setSkipTour(skip: boolean): void {
    if (skip) {
      localStorage.setItem("skipTour", "true");
    } else {
      localStorage.removeItem("skipTour");
    }
  }
}
