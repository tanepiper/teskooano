import { Config, driver, PopoverDOM, State } from "driver.js";
import "driver.js/dist/driver.css";
import { type TourStep, type TourFactory } from "./types";
import { PluginExecutionContext } from "@teskooano/ui-plugin";
import { ModalResult } from "../../controllers/dockview";

/**
 * Manages and orchestrates interactive application tours using driver.js.
 * This controller acts as a central registry for multiple, distinct tours.
 * It handles the lifecycle of a tour, including starting, resuming, restarting,
 * and managing user preferences like skipping tours. The controller is designed
 * as a lazy-initialized singleton, created and configured via the `tour:initialize`
 * plugin function.
 */
export class TourController {
  /** The driver.js instance used for the tour. */
  private readonly driverInstance: ReturnType<typeof driver>;
  /** The index of the current active step in the tour. */
  private currentStepIndex = 0;
  /** The name of the currently selected celestial object, used for dynamic step content. */
  private currentSelectedCelestial: string | undefined;
  /** The ID of the active engine view panel, used by some step actions. */
  private engineViewId: string | null = null;
  private _context: PluginExecutionContext;
  private currentTourId: string | null = null;
  private tourRegistry: Map<string, TourFactory> = new Map();

  /**
   * Creates an instance of TourController.
   * @param context The plugin execution context, providing access to core app controllers.
   */
  constructor(context: PluginExecutionContext) {
    this._context = context;

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
        const currentStep = this.driverInstance.getActiveStep();
        if (currentStep && (currentStep as TourStep).onPopoverRender) {
          (currentStep as TourStep).onPopoverRender!(popover, opts);
        }
      },
      onNextClick: () => {
        const currentStep = this.driverInstance.getActiveStep() as TourStep;
        if (currentStep?.onNextClick) {
          currentStep.onNextClick(this?.engineViewId ?? undefined);
        } else {
          this.driverInstance.moveNext();
        }
      },
      onHighlightStarted: () => {
        if (!this.isSkippingTour()) {
          const currentStep = this.driverInstance.getActiveStep() as TourStep;
          if (!currentStep) return;

          localStorage.setItem("tourCurrentStep", currentStep.id);
          if (currentStep.onHighlightStarted) {
            currentStep.onHighlightStarted();
          }
        }
      },
      onDeselected: () => {
        if (!this.isSkippingTour()) {
          localStorage.setItem("skipTour", "true");
        }
      },
    });
  }

  /**
   * Registers a new tour factory with the controller.
   * This allows other parts of the application or other plugins to add new tours.
   *
   * @param tourId A unique identifier for the tour (e.g., 'intro', 'advanced-features').
   * @param factory A function that returns an array of `TourStep` objects. This factory
   *   is called when the tour is started, allowing for dynamic step generation.
   */
  public registerTour(tourId: string, factory: TourFactory): void {
    if (this.tourRegistry.has(tourId)) {
      console.warn(
        `[TourController] A tour with ID '${tourId}' is already registered. It will be overwritten.`,
      );
    }
    this.tourRegistry.set(tourId, factory);
  }

  /**
   * Checks if the tour should be prompted based on user history and, if so,
   * displays a modal asking the user if they want to start the introductory tour.
   * This should be called once during application initialization.
   */
  public async promptIfNeeded(): Promise<void> {
    if (!this.shouldPromptForTour()) {
      return;
    }

    this.markTourModalAsShown();

    try {
      const result: ModalResult =
        await this._context.dockviewController.showModal({
          id: "tour-prompt-modal",
          title: "Welcome to Teskooano!",
          content: `<p>Would you like to take a quick tour of the interface?</p>
                  <p><small>You can restart the tour later from the help menu.</small></p>`,
          confirmText: "Start Tour",
          closeText: "Maybe Later",
          hideSecondaryButton: true,
          width: 400,
          height: 220,
        });

      if (result === "confirm") {
        this.startTour();
      } else {
        this.setSkipTour(true);
      }
    } catch (error) {
      console.error("Error showing tour modal:", error);
      this.setSkipTour(true);
    }
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

    // If the tour is active, we need to refresh it to show the new dynamic content.
    if (this.driverInstance.isActive()) {
      const activeIndex = this.driverInstance.getActiveIndex();
      const tourFactory = this.tourRegistry.get(this.currentTourId || "intro");

      if (tourFactory && activeIndex !== undefined) {
        const newSteps = tourFactory(this.driverInstance, this._context);
        this.driverInstance.setSteps(newSteps);
        this.driverInstance.drive(activeIndex);
      }
    }
  }

  /**
   * Updates any tour steps that depend on dynamic application state,
   * like the currently selected celestial object.
   * @private
   */
  private updateDynamicTourSteps(tourSteps: TourStep[]): void {
    const finalStepIndex = tourSteps.findIndex(
      (step: TourStep) => step.id === "engine-view-final",
    );
    if (finalStepIndex !== -1) {
      let description =
        "Now you should see the full system in action. Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.";

      if (this.currentSelectedCelestial) {
        description = `Now you should see the ${this.currentSelectedCelestial} in the 3D view. You can see more details about it in the Celestial Info panel. Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.`;
      } else {
        description =
          "Now you should see the full system. Select a celestial body from the Focus Control panel to see more details about it. Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.";
      }

      if (tourSteps[finalStepIndex].popover) {
        tourSteps[finalStepIndex].popover.description = description;
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
   * Checks if the tour should be prompted based on localStorage flags.
   * Returns true if the prompt modal hasn't been shown AND the tour isn't set to skip.
   */
  public shouldPromptForTour(): boolean {
    const modalShown = localStorage.getItem("tourModalShown") === "true";
    const skipTour = localStorage.getItem("skipTour") === "true";
    return !modalShown && !skipTour;
  }

  /**
   * Starts a tour from its beginning (step 0).
   * It retrieves the tour steps from the registered factory for the given tourId,
   * sets them on the driver instance, and starts the tour.
   *
   * @param tourId The ID of the tour to start. Defaults to 'intro'.
   */
  public startTour(tourId: string = "intro"): void {
    const tourFactory = this.tourRegistry.get(tourId);
    if (!tourFactory) {
      console.error(
        `[TourController] Cannot start tour: No tour registered with ID '${tourId}'.`,
      );
      return;
    }

    this.currentTourId = tourId;
    this.currentStepIndex = 0;
    const tourSteps = tourFactory(this.driverInstance, this._context);

    this.updateDynamicTourSteps(tourSteps);
    this.driverInstance.setSteps(tourSteps);
    this.driverInstance.drive();
  }

  /**
   * Resumes a tour from the last completed step.
   * It reads the last known tour ID and step ID from `localStorage`. If found,
   * it finds the corresponding tour factory and drives the tour from that step.
   * If no saved state is found, it starts the 'intro' tour from the beginning.
   */
  public resumeTour(): void {
    const savedTourId = localStorage.getItem("tourCurrentId");
    const tourId = savedTourId || "intro";

    const tourFactory = this.tourRegistry.get(tourId);
    if (!tourFactory) {
      console.error(
        `[TourController] Cannot resume tour: No tour registered with ID '${tourId}'.`,
      );
      return;
    }

    this.currentTourId = tourId;
    const tourSteps = tourFactory(this.driverInstance, this._context);
    const savedStepId = localStorage.getItem("tourCurrentStep");

    if (savedStepId) {
      const stepIndex = tourSteps.findIndex((step) => step.id === savedStepId);
      this.currentStepIndex = stepIndex >= 0 ? stepIndex : 0;
    } else {
      this.currentStepIndex = 0;
    }

    this.updateDynamicTourSteps(tourSteps);
    this.driverInstance.setSteps(tourSteps);
    this.driverInstance.drive(this.currentStepIndex);
  }

  /**
   * Restarts the current or a specified tour from the beginning.
   * It clears any saved progress for the tour from `localStorage`.
   *
   * @param tourId The ID of the tour to restart. If not provided, it restarts
   *   the last active tour. If there was no active tour, it restarts the 'intro' tour.
   */
  public restartTour(tourId?: string): void {
    localStorage.removeItem("tourCurrentStep");
    this.startTour(tourId || this.currentTourId || "intro");
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
