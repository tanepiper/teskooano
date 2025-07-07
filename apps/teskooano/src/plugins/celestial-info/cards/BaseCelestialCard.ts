import { CelestialObject } from "@teskooano/data-types";
import { baseStyles } from "../utils/CelestialStyles.js";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";

/**
 * Base class for all celestial info cards.
 * Each card is an independent web component that manages its own data and updates.
 */
export abstract class BaseCelestialCard extends HTMLElement {
  protected shadow: ShadowRoot;
  protected parentPanel: CompositeEnginePanel | null = null;
  protected currentCelestial: CelestialObject | null = null;
  protected updateInterval: number | null = null;
  protected container: HTMLElement;

  constructor(private cardTitle: string) {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.render();
    this.container = this.shadow.querySelector(".info-card")!;
  }

  private render(): void {
    this.shadow.innerHTML = `
      <style>${baseStyles}</style>
      <div class="info-card">
        <h4>${this.cardTitle}</h4>
        <div class="card-content">
          <div class="info-grid">
            <!-- Content will be populated by subclasses -->
          </div>
        </div>
      </div>
    `;
  }

  public setParentPanel(panel: CompositeEnginePanel | null): void {
    this.parentPanel = panel;
    // If we now have a parent panel and celestial data, try to render again
    if (panel && this.currentCelestial) {
      this.renderContent();
    }
  }

  public updateData(celestial: CelestialObject): void {
    this.currentCelestial = celestial;
    this.renderContent();

    if (this.shouldAutoUpdate()) {
      this.startAutoUpdate();
    } else {
      this.stopAutoUpdate();
    }
  }

  private startAutoUpdate(): void {
    if (this.updateInterval) return;
    this.updateInterval = window.setInterval(() => {
      if (this.currentCelestial) {
        this.renderContent();
      }
    }, 1000);
  }

  private stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  connectedCallback(): void {
    if (this.currentCelestial && this.shouldAutoUpdate()) {
      this.startAutoUpdate();
    }
  }

  disconnectedCallback(): void {
    this.stopAutoUpdate();
  }

  /**
   * Override this method to render the card's content.
   */
  protected abstract renderContent(): void;

  /**
   * Override this method to indicate if the card should auto-update.
   * Default is false.
   */
  protected shouldAutoUpdate(): boolean {
    return false;
  }

  /**
   * Helper method to update the card's content grid.
   */
  protected updateContentGrid(html: string): void {
    const grid = this.shadow.querySelector(".info-grid");
    if (grid) {
      grid.innerHTML = html;
    }
  }

  /**
   * Helper method to check if the renderer is available and ready.
   * Cards that need renderer functionality should call this before accessing it.
   */
  protected isRendererReady(): boolean {
    return !!this.parentPanel?.getRenderer();
  }
}
