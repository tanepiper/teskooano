import { driver, DriveStep, PopoverDOM, Config, State } from "driver.js";
import "driver.js/dist/driver.css";
import { type TourStep } from "../components/tours/types";
import { createIntroTour } from "../components/tours/intro-tour";

// Tour Controller class
export class TourController {
  private readonly driverInstance: ReturnType<typeof driver>;
  private currentStepIndex = 0;
  private currentSelectedCelestial: string | undefined;
  private tourSteps: TourStep[] = [];
  private engineViewId: string | null = null;
  constructor() {
    // Initialize driver.js with default configurations
    this.driverInstance = driver({
      animate: true,
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [],
      overlayColor: "rgba(0, 0, 0, 0.75)", // Default overlay - semi-transparent dark
      allowClose: true,
      disableActiveInteraction: false, // By default, prevent interacting with highlighted element

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
        console.log("Current step:", currentStep);
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

  public setEngineViewId(engineViewId: string): void {
    this.engineViewId = engineViewId;
  }

  /**
   * Sets the current selected celestial and updates relevant tour steps
   */
  public setCurrentSelectedCelestial(celestialName: string | undefined): void {
    this.currentSelectedCelestial = celestialName;
    this.updateDynamicTourSteps();
  }

  /**
   * Updates any tour steps that need dynamic content
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

  // Check if tour should be skipped
  public isSkippingTour(): boolean {
    return localStorage.getItem("skipTour") === "true";
  }

  // Check if tour modal has been shown
  public hasShownTourModal(): boolean {
    return localStorage.getItem("tourModalShown") === "true";
  }

  // Mark tour modal as shown
  public markTourModalAsShown(): void {
    localStorage.setItem("tourModalShown", "true");
  }

  // Start the tour from beginning
  public startTour(): void {
    this.currentStepIndex = 0;
    // Make sure dynamic content is up to date
    this.updateDynamicTourSteps();
    this.driverInstance.setSteps(this.tourSteps);
    this.driverInstance.drive();
  }

  // Resume tour from saved position or start from beginning
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

  // Restart tour
  public restartTour(): void {
    localStorage.removeItem("tourCurrentStep");
    this.startTour();
  }

  // Set skip tour preference
  public setSkipTour(skip: boolean): void {
    if (skip) {
      localStorage.setItem("skipTour", "true");
    } else {
      localStorage.removeItem("skipTour");
    }
  }
}
