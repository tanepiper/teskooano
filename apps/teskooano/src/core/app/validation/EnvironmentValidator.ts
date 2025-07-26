/**
 * Validates that required DOM elements exist for application initialization
 */
export class EnvironmentValidator {
  /**
   * Validates that required HTML elements are present in the DOM
   * @throws {Error} If required elements are missing
   */
  public static validateRequiredElements(): {
    appElement: HTMLElement;
    toolbarElement: HTMLElement;
  } {
    const appElement = document.getElementById("app");
    const toolbarElement = document.getElementById("toolbar");

    if (!appElement || !toolbarElement) {
      throw new Error("Required HTML elements (#app or #toolbar) not found.");
    }

    return { appElement, toolbarElement };
  }
}
