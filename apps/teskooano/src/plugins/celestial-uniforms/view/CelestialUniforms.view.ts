import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { CelestialUniformsController } from "../controller/CelestialUniforms.controller";
import { template } from "./CelestialUniforms.template";

/**
 * Custom Element `celestial-uniforms-editor`.
 *
 * This is the "dumb" view component for the celestial uniforms editor. It is
 * responsible for creating the DOM structure and delegating all logic to the
 * `CelestialUniformsController`.
 *
 * Implements Dockview `IContentRenderer` to be used as a panel content.
 */
export class CelestialUniformsEditor
  extends HTMLElement
  implements IContentRenderer
{
  private _shadow: ShadowRoot;
  private _controller: CelestialUniformsController | null = null;
  private _container: HTMLElement | null = null;
  private _placeholder: HTMLElement | null = null;
  private _titleEl: HTMLElement | null = null;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "celestial-uniforms-editor";

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._shadow.appendChild(template.content.cloneNode(true));
  }

  init(parameters: GroupPanelPartInitParameters): void {
    const params = (parameters.params as { focusedObjectId?: string }) || {};
    this._controller?.handleInitialSelection(params.focusedObjectId ?? null);
  }

  get element(): HTMLElement {
    return this;
  }

  connectedCallback(): void {
    this._container = this._shadow.querySelector(".container");
    this._placeholder = this._shadow.querySelector(".placeholder");
    this._titleEl = this._shadow.querySelector("#uniforms-title");

    if (this._container && this._placeholder && this._titleEl) {
      this._controller = new CelestialUniformsController(
        this,
        this._container,
        this._placeholder,
        this._titleEl,
      );
      this._controller.initialize();
    } else {
      console.error(
        "[CelestialUniformsEditor] Could not find essential elements in shadow DOM.",
      );
    }
  }

  disconnectedCallback(): void {
    this._controller?.dispose();
    this._controller = null;
  }

  /**
   * Clears the main content container.
   */
  public clearContainer(): void {
    if (this._container) {
      this._container.innerHTML = "";
    }
  }

  /**
   * Displays the placeholder message and hides the main container.
   * @param message The message to display.
   */
  public showPlaceholder(message: string): void {
    if (this._container) {
      this._container.style.display = "none";
    }
    if (this._placeholder) {
      this._placeholder.style.display = "block";
      this._placeholder.textContent = message;
    }
  }

  /**
   * Hides the placeholder and shows the main container.
   */
  public hidePlaceholder(): void {
    if (this._placeholder) {
      this._placeholder.style.display = "none";
    }
    if (this._container) {
      this._container.style.display = "block";
    }
  }

  /**
   * Sets the panel's title text.
   * @param title The text to set as the title.
   */
  public setTitle(title: string): void {
    if (this._titleEl) {
      this._titleEl.textContent = title;
    }
  }
}
