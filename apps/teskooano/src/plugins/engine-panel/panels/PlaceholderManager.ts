/**
 * Manages the visibility and content of placeholder elements within a parent component.
 * It assumes that the necessary HTML elements are provided to its constructor.
 */
export class PlaceholderManager {
  private placeholderWrapper: HTMLElement;
  private placeholderMessage: HTMLParagraphElement;
  private placeholderActionArea: HTMLDivElement;
  private engineContainer: HTMLElement; // The main content container to hide/show

  /**
   * Creates an instance of PlaceholderManager.
   * @param placeholderWrapper The main wrapper element for the placeholder content.
   * @param placeholderMessage The element displaying the placeholder text message.
   * @param placeholderActionArea The element containing action items like links or progress bars.
   * @param engineContainer The main engine/content container that is hidden when the placeholder is shown.
   */
  constructor(
    placeholderWrapper: HTMLElement,
    placeholderMessage: HTMLParagraphElement,
    placeholderActionArea: HTMLDivElement,
    engineContainer: HTMLElement,
  ) {
    this.placeholderWrapper = placeholderWrapper;
    this.placeholderMessage = placeholderMessage;
    this.placeholderActionArea = placeholderActionArea;
    this.engineContainer = engineContainer;
  }

  /**
   * Updates the placeholder content based on the system generation state
   * and ensures the placeholder is visible (and the engine container is hidden).
   * @param isGenerating - True if the system is currently generating, false otherwise.
   */
  public showMessage(isGenerating: boolean): void {
    if (isGenerating) {
      this.placeholderMessage.textContent = "Generating System...";
      this.placeholderActionArea.innerHTML = `<progress style='width: 100%;'></progress>`;
    } else {
      this.placeholderMessage.textContent = "Load or Generate a System";
      this.placeholderActionArea.innerHTML = `<a href="https://teskooano.space/docs/getting-started" target="_blank" style="display: inline-block; padding: 8px 15px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px;">📚 Go To Documentation</a>`;
    }
    this.placeholderWrapper.classList.remove("hidden");
    this.engineContainer.style.display = "none";
  }

  /**
   * Hides the placeholder and makes the engine container visible.
   * It assumes the engine container should be set to 'block' display.
   */
  public hide(): void {
    this.placeholderWrapper.classList.add("hidden");
    this.engineContainer.style.display = "block"; // Default display for engine container
  }

  /**
   * Performs cleanup if necessary. Currently, this manager does not hold
   * any resources that require explicit disposal beyond DOM element references
   * managed by its consumer.
   */
  public dispose(): void {
    // No specific resources to dispose in this version.
    console.debug("[PlaceholderManager] dispose called.");
  }
}
