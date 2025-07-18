import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
} from "@teskooano/data-types";
import { StateAccessor } from "@teskooano/core-state";
import { CelestialInfoComponent } from "../../utils/CelestialInfoInterface.js";
import { baseStyles } from "../../utils/CelestialStyles.js";
import { renderMainBody } from "./render-helpers.js";
import type { CompositeEnginePanel } from "../../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { BaseCelestialCard } from "../../cards/BaseCelestialCard.js";

export interface CardConfig {
  title: string;
  tagName: string; // The custom element tag name
  extraClasses?: string;
}

/**
 * An abstract base class for celestial info components.
 * Uses web components for each card section for better composability.
 *
 * @template T - The specific properties type for this celestial object
 */
export abstract class BaseCelestialInfoComponent<
    T extends
      CelestialSpecificPropertiesUnion = CelestialSpecificPropertiesUnion,
  >
  extends HTMLElement
  implements CelestialInfoComponent<T>
{
  protected shadow: ShadowRoot;
  protected parentPanel: CompositeEnginePanel | null = null;
  private container: HTMLElement;
  private currentCelestialId: string | null = null;
  private cardInstances: Map<string, BaseCelestialCard> = new Map();

  constructor(placeholderText: string) {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
      <style>${baseStyles}</style>
      <div id="container" class="placeholder">${placeholderText}</div>
    `;
    this.container = this.shadow.getElementById("container")!;
  }

  public setParentPanel(panel: CompositeEnginePanel | null): void {
    this.parentPanel = panel;
    // Update all existing card instances
    this.cardInstances.forEach((card) => {
      card.setParentPanel(panel);
    });
  }

  connectedCallback() {
    // Cards will manage their own update cycles
  }

  disconnectedCallback() {
    // Clean up card instances
    this.cardInstances.forEach((card) => {
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
    });
    this.cardInstances.clear();
  }

  /**
   * The main update method called by the view manager.
   */
  public updateData(celestial: CelestialObject<T>): void {
    if (!this.container) return;
    this.currentCelestialId = celestial.id;
    this.container.classList.remove("placeholder");
    this.container.innerHTML = this.renderCelestialInfo(celestial);
  }

  /**
   * Renders the complete celestial info using card components.
   */
  private renderCelestialInfo(celestial: CelestialObject<T>): string {
    const title = this.getTitle(celestial);
    const subtitle = this.getSubtitle(celestial);
    const cardConfigs = this.getCardConfigs();

    // Create the main body HTML
    const mainBodyHtml = renderMainBody(title, subtitle, celestial);

    // Create cards container
    const cardsHtml =
      '<div class="cards-container" id="cards-container"></div>';

    // Set up the basic structure first
    setTimeout(() => {
      this.setupCards(cardConfigs, celestial);
    }, 0);

    return `${mainBodyHtml}${cardsHtml}`;
  }

  /**
   * Sets up the card components after the DOM is ready.
   */
  private setupCards(
    cardConfigs: CardConfig[],
    celestial: CelestialObject<T>,
  ): void {
    const cardsContainer = this.shadow.getElementById("cards-container");
    if (!cardsContainer) return;

    // Clear existing cards
    this.cardInstances.forEach((card) => {
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
    });
    this.cardInstances.clear();
    cardsContainer.innerHTML = "";

    // Create new cards
    cardConfigs.forEach((config) => {
      const cardElement = document.createElement(
        config.tagName,
      ) as BaseCelestialCard;

      if (config.extraClasses) {
        cardElement.classList.add(config.extraClasses);
      }

      cardElement.setParentPanel(this.parentPanel);
      cardElement.updateData(celestial);

      this.cardInstances.set(config.tagName, cardElement);
      cardsContainer.appendChild(cardElement);
    });
  }

  /**
   * Abstract methods to be implemented by subclasses.
   */
  protected abstract getTitle(celestial: CelestialObject<T>): string;
  protected abstract getSubtitle(celestial: CelestialObject<T>): string;
  protected abstract getCardConfigs(): CardConfig[];
}
