import {
  getSimulationState,
  simulationState$,
  simulationStateService,
  type PhysicsEngineType,
  type PerformanceProfileType,
} from "@teskooano/core-state";

import { type TeskooanoSlider } from "../../../core/components/slider/Slider";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";
import { Subscription } from "rxjs";

const ENGINE_OPTIONS: { value: PhysicsEngineType; label: string }[] = [
  { value: "euler", label: "Euler Integrator" },
  { value: "symplectic", label: "Symplectic Euler" },
  { value: "verlet", label: "Verlet Integration" },
];

const PERFORMANCE_PROFILE_OPTIONS: {
  value: PerformanceProfileType;
  label: string;
}[] = [
  { value: "low", label: "Low (Power Saving)" },
  { value: "medium", label: "Medium (Balanced)" },
  { value: "high", label: "High (Performance)" },
  { value: "cosmic", label: "Max Quality)" },
];

/**
 * Defines the structure for the UI elements that the SettingsController will manage.
 */
export interface ISettingsPanelElements {
  formElement: HTMLFormElement;
  trailSliderElement: TeskooanoSlider;
  engineSelectElement: HTMLSelectElement;
  profileSelectElement: HTMLSelectElement;
}

/**
 * The Controller for the SettingsPanel.
 * This class encapsulates all business logic for the settings panel, including
 * event handling, state management, and synchronization with the global application state.
 * It follows the MVC pattern, where this is the 'Controller'.
 */
export class SettingsController {
  /** @internal */
  private unsubscribeSimState: Subscription | null = null;

  /**
   * Initializes the controller and binds it to the view's elements.
   */
  constructor(private elements: ISettingsPanelElements) {
    this.addEventListenersAndPopulate();
  }

  /**
   * Cleans up all subscriptions and event listeners to prevent memory leaks.
   * This should be called when the associated view is disconnected from the DOM.
   */
  public dispose(): void {
    this.removeEventListenersAndUnsubscribe();
  }

  /**
   * Sets up the initial state of the form controls, populates select elements,
   * and subscribes to state changes.
   * @internal
   */
  private addEventListenersAndPopulate(): void {
    this.elements.formElement.addEventListener("submit", this.handleFormSubmit);

    this.populateSelect(this.elements.engineSelectElement, ENGINE_OPTIONS);
    this.populateSelect(
      this.elements.profileSelectElement,
      PERFORMANCE_PROFILE_OPTIONS,
    );

    const initialState = getSimulationState();

    this.elements.trailSliderElement.value =
      initialState.visualSettings.trailLengthMultiplier;
    this.elements.trailSliderElement.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );

    this.elements.engineSelectElement.value = initialState.physicsEngine;
    this.elements.engineSelectElement.addEventListener(
      "change",
      this.handleEngineChange,
    );

    this.elements.profileSelectElement.value = initialState.performanceProfile;
    this.elements.profileSelectElement.addEventListener(
      "change",
      this.handleProfileChange,
    );

    this.unsubscribeSimState = simulationState$.subscribe(
      this.updateControlStates,
    );
  }

  /**
   * Removes all event listeners and unsubscribes from the simulation state observable.
   * @internal
   */
  private removeEventListenersAndUnsubscribe(): void {
    this.elements.formElement.removeEventListener(
      "submit",
      this.handleFormSubmit,
    );
    this.elements.trailSliderElement.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );
    this.elements.engineSelectElement.removeEventListener(
      "change",
      this.handleEngineChange,
    );
    this.elements.profileSelectElement.removeEventListener(
      "change",
      this.handleProfileChange,
    );

    this.unsubscribeSimState?.unsubscribe();
    this.unsubscribeSimState = null;
  }

  /**
   * Prevents the default form submission behavior.
   * @internal
   */
  private handleFormSubmit = (e: Event) => e.preventDefault();

  /**
   * Populates a given select element with a list of options.
   * @internal
   */
  private populateSelect(
    selectElement: HTMLSelectElement,
    options: { value: string; label: string }[],
  ): void {
    selectElement.innerHTML = "";
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      selectElement.appendChild(optionElement);
    });
  }

  /**
   * Handles the custom event fired when the trail length slider value changes.
   * Updates the global state with the new value.
   * @internal
   */
  private handleTrailChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    const value = event.detail.value;
    if (typeof value === "number" && !isNaN(value)) {
      simulationStateService.setTrailLengthMultiplier(value);
    }
  };

  /**
   * Handles the change event for the physics engine select element.
   * Updates the global state with the new engine type.
   * @internal
   */
  private handleEngineChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PhysicsEngineType;
    if (ENGINE_OPTIONS.some((opt) => opt.value === value)) {
      simulationStateService.setPhysicsEngine(value);
    }
  };

  /**
   * Handles the change event for the performance profile select element.
   * Updates the global state with the new profile.
   * @internal
   */
  private handleProfileChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PerformanceProfileType;
    if (PERFORMANCE_PROFILE_OPTIONS.some((opt) => opt.value === value)) {
      simulationStateService.setPerformanceProfile(value);
    }
  };

  /**
   * Callback function that fires when the global simulation state changes.
   * It ensures the UI controls are updated to reflect the latest state.
   * @internal
   */
  private updateControlStates = (): void => {
    const state = getSimulationState();

    if (this.elements.trailSliderElement) {
      const currentMultiplier = state.visualSettings.trailLengthMultiplier;
      if (currentMultiplier !== this.elements.trailSliderElement.value) {
        this.elements.trailSliderElement.value = currentMultiplier;
      }
    }

    if (this.elements.engineSelectElement) {
      const currentEngine = state.physicsEngine;
      if (currentEngine !== this.elements.engineSelectElement.value) {
        this.elements.engineSelectElement.value = currentEngine;
      }
    }

    if (this.elements.profileSelectElement) {
      const currentProfile = state.performanceProfile;
      if (currentProfile !== this.elements.profileSelectElement.value) {
        this.elements.profileSelectElement.value = currentProfile;
      }
    }
  };
}
