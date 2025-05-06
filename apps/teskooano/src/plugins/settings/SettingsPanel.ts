import { IContentRenderer, IDockviewPanelProps } from "dockview-core";

import {
  getSimulationState,
  simulationState$,
  simulationActions,
  type PhysicsEngineType,
  type PerformanceProfileType,
} from "@teskooano/core-state";

import { type TeskooanoSlider } from "../../core/components/slider/Slider";
import { template } from "./Settings.template";
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
 * Renders the content for the settings panel within Dockview.
 * Implemented as a Custom Element.
 */
export class SettingsPanel extends HTMLElement implements IContentRenderer {
  public static readonly componentName = "teskooano-settings-panel";

  private formElement: HTMLFormElement | null = null;
  private trailSliderElement: TeskooanoSlider | null = null;
  private engineSelectElement: HTMLSelectElement | null = null;
  private profileSelectElement: HTMLSelectElement | null = null;
  private unsubscribeSimState: Subscription | null = null;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  get element(): HTMLElement {
    return this;
  }

  /**
   * Called by Dockview to initialize the panel content.
   * @param params - Initialization parameters provided by Dockview (currently unused).
   */
  init(params: IDockviewPanelProps<any>): void {}

  connectedCallback() {
    this.formElement =
      this.shadowRoot!.querySelector<HTMLFormElement>("#settings-form");
    this.trailSliderElement = this.shadowRoot!.querySelector<TeskooanoSlider>(
      "#setting-trail-length",
    );
    this.engineSelectElement =
      this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-physics-engine",
      );
    this.profileSelectElement =
      this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-performance-profile",
      );

    if (
      !this.formElement ||
      !this.trailSliderElement ||
      !this.engineSelectElement ||
      !this.profileSelectElement
    ) {
      console.error(
        "[SettingsPanel] Failed to find essential elements in template!",
      );

      this.shadowRoot!.innerHTML =
        "<p style='color:red'>Error loading settings panel content.</p>";
      return;
    }

    this.style.display = "block";
    this.style.padding = "var(--space-md, 12px)";
    this.style.height = "100%";
    this.style.overflowY = "auto";
    this.style.boxSizing = "border-box";

    this.addEventListenersAndPopulate();
  }

  disconnectedCallback() {
    this.removeEventListenersAndUnsubscribe();
  }

  private addEventListenersAndPopulate(): void {
    if (
      !this.formElement ||
      !this.trailSliderElement ||
      !this.engineSelectElement ||
      !this.profileSelectElement
    ) {
      return;
    }

    this.formElement.addEventListener("submit", this.handleFormSubmit);

    this.populateSelect(this.engineSelectElement, ENGINE_OPTIONS);
    this.populateSelect(this.profileSelectElement, PERFORMANCE_PROFILE_OPTIONS);

    const initialState = getSimulationState();

    this.trailSliderElement.value =
      initialState.visualSettings.trailLengthMultiplier;
    this.trailSliderElement.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );

    this.engineSelectElement.value = initialState.physicsEngine;
    this.engineSelectElement.addEventListener(
      "change",
      this.handleEngineChange,
    );

    this.profileSelectElement.value = initialState.performanceProfile;
    this.profileSelectElement.addEventListener(
      "change",
      this.handleProfileChange,
    );

    this.unsubscribeSimState = simulationState$.subscribe(
      this.updateControlStates,
    );
  }

  private removeEventListenersAndUnsubscribe(): void {
    this.formElement?.removeEventListener("submit", this.handleFormSubmit);
    this.trailSliderElement?.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );
    this.engineSelectElement?.removeEventListener(
      "change",
      this.handleEngineChange,
    );
    this.profileSelectElement?.removeEventListener(
      "change",
      this.handleProfileChange,
    );

    this.unsubscribeSimState?.unsubscribe();
    this.unsubscribeSimState = null;

    this.formElement = null;
    this.trailSliderElement = null;
    this.engineSelectElement = null;
    this.profileSelectElement = null;
  }

  private handleFormSubmit = (e: Event) => e.preventDefault();

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

  private handleTrailChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    const value = event.detail.value;
    if (typeof value === "number" && !isNaN(value)) {
      simulationActions.setTrailLengthMultiplier(value);
    }
  };

  private handleEngineChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PhysicsEngineType;
    if (ENGINE_OPTIONS.some((opt) => opt.value === value)) {
      simulationActions.setPhysicsEngine(value);
    }
  };

  private handleProfileChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PerformanceProfileType;
    if (PERFORMANCE_PROFILE_OPTIONS.some((opt) => opt.value === value)) {
      simulationActions.setPerformanceProfile(value);
    }
  };

  private updateControlStates = (): void => {
    const state = getSimulationState();

    if (this.trailSliderElement) {
      const currentMultiplier = state.visualSettings.trailLengthMultiplier;
      if (currentMultiplier !== this.trailSliderElement.value) {
        this.trailSliderElement.value = currentMultiplier;
      }
    }

    if (this.engineSelectElement) {
      const currentEngine = state.physicsEngine;
      if (currentEngine !== this.engineSelectElement.value) {
        this.engineSelectElement.value = currentEngine;
      }
    }

    if (this.profileSelectElement) {
      const currentProfile = state.performanceProfile;
      if (currentProfile !== this.profileSelectElement.value) {
        this.profileSelectElement.value = currentProfile;
      }
    }
  };
}
