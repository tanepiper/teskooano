import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelInitParameters } from "../types";

/**
 * A basic fallback panel component used by DockviewController when
 * a requested component cannot be found or instantiated.
 */
export class FallbackPanel implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _params: PanelInitParameters | undefined;

  /**
   * The root HTML element for this panel.
   */
  get element(): HTMLElement {
    return this._element;
  }

  /**
   * Creates an instance of FallbackPanel.
   */
  constructor() {
    this._element = document.createElement("div");
    this._element.style.color = "var(--color-text)";
    this._element.style.padding = "10px";
    this._element.style.height = "100%";
    this._element.style.boxSizing = "border-box";
    this._element.textContent = "Panel Content Initializing...";
  }

  /**
   * Initializes the panel with parameters provided by Dockview.
   * Sets the initial text content based on the title parameter.
   * @param parameters - Initialization parameters from Dockview.
   */
  init(parameters: GroupPanelPartInitParameters): void {
    this._params = parameters as PanelInitParameters;
    const title = this._params?.params?.title ?? "Untitled Panel";
    this._element.textContent = `Content for: ${title}`;
  }

  /**
   * Updates the text content of the panel's element.
   * @param newText - The new text to display.
   */
  updateContent(newText: string): void {
    this._element.textContent = newText;
  }
}
