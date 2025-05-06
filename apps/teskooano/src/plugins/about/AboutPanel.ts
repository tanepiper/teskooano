import {
  DockviewApi,
  PanelInitParameters,
  IContentRenderer,
  GroupPanelPartInitParameters,
  DockviewPanelApi,
} from "dockview-core";
import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { template } from "./About.template";
import "../../core/components/card";

/**
 * Represents the content panel for the About information.
 * Implemented as a Custom Element for Dockview.
 * Content is defined directly in the associated template.
 * @element teskooano-about-panel
 */
export class AboutPanel extends HTMLElement implements IContentRenderer {
  public static readonly componentName = "teskooano-about-panel";

  private panelApi: DockviewPanelApi | undefined;

  /** Root element accessible for Dockview */
  get element(): HTMLElement {
    return this;
  }

  constructor() {
    super();
    // Panels manage their own shadow DOM
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  /**
   * Dockview initialization function.
   * @param params
   */
  init(params: PanelInitParameters): void {
    this.panelApi = (params as GroupPanelPartInitParameters).api;
    // Content is rendered via template, no specific action needed here
  }

  connectedCallback() {
    // No dynamic rendering needed, but update dynamic values
    this.updateVersionInfo();
  }

  disconnectedCallback() {
    // Clean up if necessary
  }

  /**
   * Updates the version and commit hash placeholders in the template.
   */
  private updateVersionInfo() {
    const versionSpan = this.shadowRoot?.getElementById("app-version");
    const commitSpan = this.shadowRoot?.getElementById("git-commit-hash");

    if (versionSpan) {
      versionSpan.textContent = import.meta.env.PACKAGE_VERSION || "N/A";
    }
    if (commitSpan) {
      commitSpan.textContent = import.meta.env.GIT_COMMIT_HASH || "N/A";
    }
  }
}

// Define the custom element if not already defined
if (!customElements.get(AboutPanel.componentName)) {
  customElements.define(AboutPanel.componentName, AboutPanel);
}
