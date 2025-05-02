import { template } from "./Card.template";

/**
 * A container element `<teskooano-card>` used to display grouped content,
 * often including text, imagery, and actions.
 *
 * @element teskooano-card
 *
 * @attr {"fixed" | "fluid" | "full"} [variant="fixed"] - Controls the width behavior:
 *   - `fixed`: Default fixed width (configurable via `--card-fixed-width` CSS variable).
 *   - `fluid`: Takes the width of its container.
 *   - `full`: Takes 100% width of its container.
 *
 * @slot image - Optional slot for an image, usually displayed at the top.
 * @slot label - Optional slot for a small label or category text.
 * @slot title - Slot for the main title of the card.
 * @slot - Default slot for the primary content body of the card.
 * @slot cta - Optional slot for call-to-action elements, typically buttons, displayed at the bottom.
 *
 * @csspart container - The main internal container div of the card.
 * @csspart content-area - The div wrapping the label, title, and default content slots.
 * @csspart cta-area - The div wrapping the cta slot, typically at the bottom.
 *
 * @cssprop [--card-fixed-width=300px] - Sets the width when `variant="fixed"`.
 */
export class TeskooanoCard extends HTMLElement {
  /**
   * Attributes observed for changes.
   * @internal
   */
  static observedAttributes = ["variant"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  /**
   * Called when the element is added to the document's DOM.
   * Ensures the initial variant is set if not provided.
   * @internal
   */
  connectedCallback() {
    // Set default variant if none is provided
    if (!this.hasAttribute("variant")) {
      this.setAttribute("variant", "fixed");
    }
    this._validateSlots();
  }

  /**
   * Called when an observed attribute changes.
   * @param name - The name of the attribute that changed.
   * @param oldValue - The previous value of the attribute.
   * @param newValue - The new value of the attribute.
   * @internal
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "variant" && oldValue !== newValue) {
      // Validation could be added here if needed, but CSS handles defaults/invalid values gracefully.
    }
  }

  /**
   * Checks for required slots and logs warnings if they are missing.
   * @internal
   */
  private _validateSlots() {
    const titleSlot = this.shadowRoot?.querySelector(
      'slot[name="title"]',
    ) as HTMLSlotElement;
    const contentSlot = this.shadowRoot?.querySelector(
      "slot:not([name])",
    ) as HTMLSlotElement;

    if (!titleSlot || titleSlot.assignedNodes({ flatten: true }).length === 0) {
      console.warn(
        `TeskooanoCard (${this.id || "no-id"}): Required slot [title] is empty.`,
      );
    }
    if (
      !contentSlot ||
      contentSlot.assignedNodes({ flatten: true }).length === 0
    ) {
      console.warn(
        `TeskooanoCard (${this.id || "no-id"}): Required default slot (for content) is empty.`,
      );
    }
  }

  // --- Getters/Setters for attributes --- //

  /**
   * Gets the current width variant of the card.
   * @returns {"fixed" | "fluid" | "full" | null}
   */
  get variant(): "fixed" | "fluid" | "full" | null {
    return this.getAttribute("variant") as "fixed" | "fluid" | "full" | null;
  }

  /**
   * Sets the width variant of the card.
   * @param { "fixed" | "fluid" | "full" | null } value - The desired variant.
   */
  set variant(value: "fixed" | "fluid" | "full" | null) {
    if (value) {
      this.setAttribute("variant", value);
    } else {
      this.removeAttribute("variant");
      // Optionally set back to default if removed
      // this.setAttribute("variant", "fixed");
    }
  }

  disconnectedCallback() {}
}
