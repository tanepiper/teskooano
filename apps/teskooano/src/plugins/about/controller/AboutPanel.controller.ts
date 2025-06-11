/**
 * Controller for the AboutPanel view.
 * This class encapsulates the logic for the about panel, such as fetching
 * and displaying dynamic version information.
 */
export class AboutPanelController {
  private _shadowRoot: ShadowRoot;

  /**
   * Creates an instance of AboutPanelController.
   * @param shadowRoot The shadow root of the view, used to query for elements.
   */
  constructor(shadowRoot: ShadowRoot) {
    this._shadowRoot = shadowRoot;
  }

  /**
   * Initializes the controller.
   * This is where initial data fetching or setup occurs.
   */
  public initialize(): void {
    this.updateVersionInfo();
  }

  /**
   * Cleans up any resources, timers, or event listeners.
   */
  public dispose(): void {
    // No-op for now as there are no active listeners or timers.
  }

  /**
   * Updates the version and commit hash placeholders in the template.
   */
  private updateVersionInfo(): void {
    const versionSpan = this._shadowRoot.getElementById("app-version");
    const commitSpan = this._shadowRoot.getElementById("git-commit-hash");
    const buildTimestampSpan =
      this._shadowRoot.getElementById("build-timestamp");

    if (versionSpan) {
      versionSpan.textContent = import.meta.env.PACKAGE_VERSION || "N/A";
    }
    if (commitSpan) {
      commitSpan.textContent = import.meta.env.GIT_COMMIT_HASH || "N/A";
    }
    if (buildTimestampSpan) {
      const timestamp = import.meta.env.BUILD_TIMESTAMP;
      if (timestamp) {
        buildTimestampSpan.textContent = new Date(timestamp).toLocaleString();
      } else {
        buildTimestampSpan.textContent = "N/A";
      }
    }
  }
}
