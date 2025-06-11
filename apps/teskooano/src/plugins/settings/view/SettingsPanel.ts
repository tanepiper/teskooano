import { IContentRenderer, IDockviewPanelProps } from "dockview-core";
import { type TeskooanoSlider } from "../../../core/components/slider/Slider";
import { SettingsController } from "../controller/SettingsController";
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
  private controller: SettingsController | null = null;

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
    const formElement =
      this.shadowRoot!.querySelector<HTMLFormElement>("#settings-form");
    const trailSliderElement = this.shadowRoot!.querySelector<TeskooanoSlider>(
      "#setting-trail-length",
    );
    const engineSelectElement =
      this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-physics-engine",
      );
    const profileSelectElement =
      this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-performance-profile",
      );

    if (
      !formElement ||
      !trailSliderElement ||
      !engineSelectElement ||
      !profileSelectElement
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

    this.controller = new SettingsController({
      formElement,
      trailSliderElement,
      engineSelectElement,
      profileSelectElement,
    });
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
