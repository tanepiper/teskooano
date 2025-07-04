import { CelestialObject } from "@teskooano/data-types";
import { StateAccessor } from "@teskooano/core-state";
import { CelestialInfoComponent } from "../../utils/CelestialInfoInterface.js";
import { baseStyles } from "../../utils/CelestialStyles.js";
import { renderPhysics } from "./render-helpers.js";

/**
 * An abstract base class for celestial info components.
 * It handles the common boilerplate of setting up the shadow DOM, applying
 * base styles, and providing a simple render loop.
 */
export abstract class BaseCelestialInfoComponent
  extends HTMLElement
  implements CelestialInfoComponent
{
  protected shadow: ShadowRoot;
  private container: HTMLElement;
  private physicsUpdateInterval: number | null = null;
  private currentCelestialId: string | null = null;

  constructor(placeholderText: string) {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
      <style>${baseStyles}</style>
      <div id="container" class="placeholder">${placeholderText}</div>
    `;
    this.container = this.shadow.getElementById("container")!;
  }

  connectedCallback() {
    this.startPhysicsUpdates();
  }

  disconnectedCallback() {
    this.stopPhysicsUpdates();
  }

  private startPhysicsUpdates(): void {
    if (this.physicsUpdateInterval) return;
    this.physicsUpdateInterval = window.setInterval(() => {
      if (!this.currentCelestialId) return;

      const physicsDataContainer = this.shadow.getElementById(
        `physics-data-${this.currentCelestialId}`,
      );
      if (!physicsDataContainer) return;

      const allObjects = StateAccessor.getCurrentCelestialObjects();
      const celestial = allObjects[this.currentCelestialId];

      if (celestial?.physicsStateReal) {
        physicsDataContainer.innerHTML = renderPhysics(
          this.currentCelestialId,
          celestial.physicsStateReal,
        )
          .replace(/<div.*?>/, "")
          .replace("</div>", ""); // Render only the inner part
      }
    }, 1000);
  }

  private stopPhysicsUpdates(): void {
    if (this.physicsUpdateInterval) {
      clearInterval(this.physicsUpdateInterval);
      this.physicsUpdateInterval = null;
    }
  }

  /**
   * The main update method called by the view manager.
   * It removes the placeholder class and updates the container's content
   * by calling the subclass's render method.
   * @param celestial The celestial object whose data needs to be rendered.
   */
  public updateData(celestial: CelestialObject): void {
    if (!this.container) return;
    this.currentCelestialId = celestial.id;
    this.container.classList.remove("placeholder");
    this.container.innerHTML = this.renderDetails(celestial);
  }

  /**
   * Abstract method to be implemented by subclasses.
   * This method should return the specific HTML content for the given
   * celestial object.
   * @param celestial The celestial object to render.
   * @returns An HTML string to be injected into the component's container.
   */
  protected abstract renderDetails(celestial: CelestialObject): string;
}
