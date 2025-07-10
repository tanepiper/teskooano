import { IContentRenderer, IDockviewPanelProps } from "dockview-core";
import { type TeskooanoSlider } from "../../../core/components/slider/Slider";
import { EnhancedSettingsController } from "../controller/EnhancedSettingsController";
import { template } from "./Settings.template";

/**
 * The View component for the application settings panel.
 * As a 'dumb' component, its sole responsibilities are to render the UI,
 * create its associated controller, and clean up when it's removed from the DOM.
 * @element teskooano-settings-panel
 */
export class SettingsPanel extends HTMLElement implements IContentRenderer {
  /**
   * The HTML tag name for this custom element.
   */
  public static readonly componentName = "teskooano-settings-panel";

  /** @internal */
  private controller: EnhancedSettingsController | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  /**
   * The root element of this component. Required by Dockview's `IContentRenderer`.
   */
  get element(): HTMLElement {
    return this;
  }

  /**
   * Called by Dockview to initialize the panel.
   */
  init(params: IDockviewPanelProps<any>): void {}

  /**
   * Custom Element lifecycle callback. Fired when the element is added to the DOM.
   * This is where the controller is instantiated and the view is wired up.
   * @internal
   */
  connectedCallback() {
    const elements = {
      formElement:
        this.shadowRoot!.querySelector<HTMLFormElement>("#settings-form")!,
      trailSliderElement: this.shadowRoot!.querySelector<TeskooanoSlider>(
        "#setting-trail-length",
      )!,
      simulationModeSelectElement:
        this.shadowRoot!.querySelector<HTMLSelectElement>(
          "#setting-simulation-mode",
        )!,
      currentModeBadgeElement: this.shadowRoot!.querySelector<HTMLSpanElement>(
        "#current-mode-badge",
      )!,
      nbodyControlsElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#nbody-specific-controls",
      )!,
      algorithmSelectElement:
        this.shadowRoot!.querySelector<HTMLSelectElement>(
          "#setting-algorithm",
        )!,
      integratorSelectElement:
        this.shadowRoot!.querySelector<HTMLSelectElement>(
          "#setting-integrator",
        )!,
      configDisplayElement:
        this.shadowRoot!.querySelector<HTMLDivElement>("#config-display")!,
      modePerformanceElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#mode-performance-display",
      )!,
      performanceDotElement:
        this.shadowRoot!.querySelector<HTMLSpanElement>("#performance-dot")!,
      performanceTextElement:
        this.shadowRoot!.querySelector<HTMLSpanElement>("#performance-text")!,
      profileSelectElement: this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-performance-profile",
      )!,
      validationMessagesElement: this.shadowRoot!.querySelector<HTMLDivElement>(
        "#validation-messages",
      )!,
    };

    if (Object.values(elements).some((el) => !el)) {
      console.error(
        "[SettingsPanel] Failed to find essential elements in template!",
      );
      return;
    }

    this.style.display = "block";
    this.style.padding = "var(--space-md, 12px)";
    this.style.height = "100%";
    this.style.overflowY = "auto";
    this.style.boxSizing = "border-box";

    this.controller = new EnhancedSettingsController(elements);
  }

  /**
   * Custom Element lifecycle callback. Fired when the element is removed from the DOM.
   * This is where the controller is disposed of to prevent memory leaks.
   * @internal
   */
  disconnectedCallback() {
    this.controller?.dispose();
    this.controller = null;
  }
}
