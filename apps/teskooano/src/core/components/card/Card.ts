import { template } from "./Card.template";
import { createComponentState } from "@teskooano/ui-plugin/patterns";

interface CardState {
  variant: "fixed" | "fluid" | "full";
  hasTitleSlot: boolean;
  hasContentSlot: boolean;
  hasImageSlot: boolean;
  hasLabelSlot: boolean;
  hasCtaSlot: boolean;
}

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

  // Use the new reactive state pattern
  private state = createComponentState(
    {
      variant: "fixed" as const,
      hasTitleSlot: false,
      hasContentSlot: false,
      hasImageSlot: false,
      hasLabelSlot: false,
      hasCtaSlot: false,
    } as CardState,
    {
      componentName: "teskooano-card",
    },
  );

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
    this.updateStateFromAttributes();
    this.setupStateWatchers();
    this.validateSlots();
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
    if (oldValue === newValue) return;

    if (name === "variant") {
      this.state.set(
        "variant",
        (newValue as "fixed" | "fluid" | "full") || "fixed",
      );
    }
  }

  private updateStateFromAttributes(): void {
    const variant = this.getAttribute("variant") as "fixed" | "fluid" | "full";
    this.state.set("variant", variant || "fixed");
  }

  private setupStateWatchers(): void {
    // Watch for variant changes
    this.state.watch("variant", (variant: "fixed" | "fluid" | "full") => {
      if (variant) {
        this.setAttribute("variant", variant);
      } else {
        this.removeAttribute("variant");
        this.setAttribute("variant", "fixed"); // Set back to default
      }
    });

    // Watch for slot changes to update validation
    this.state.watch("hasTitleSlot", (hasTitleSlot: boolean) => {
      if (!hasTitleSlot) {
        console.warn(
          `TeskooanoCard (${this.id || "no-id"}): Required slot [title] is empty.`,
        );
      }
    });

    this.state.watch("hasContentSlot", (hasContentSlot: boolean) => {
      if (!hasContentSlot) {
        console.warn(
          `TeskooanoCard (${this.id || "no-id"}): Required default slot (for content) is empty.`,
        );
      }
    });
  }

  /**
   * Checks for required slots and updates state accordingly.
   * @internal
   */
  private validateSlots() {
    const titleSlot = this.shadowRoot?.querySelector(
      'slot[name="title"]',
    ) as HTMLSlotElement;
    const contentSlot = this.shadowRoot?.querySelector(
      "slot:not([name])",
    ) as HTMLSlotElement;
    const imageSlot = this.shadowRoot?.querySelector(
      'slot[name="image"]',
    ) as HTMLSlotElement;
    const labelSlot = this.shadowRoot?.querySelector(
      'slot[name="label"]',
    ) as HTMLSlotElement;
    const ctaSlot = this.shadowRoot?.querySelector(
      'slot[name="cta"]',
    ) as HTMLSlotElement;

    // Update state with slot availability
    this.state.set(
      "hasTitleSlot",
      !!(titleSlot && titleSlot.assignedNodes({ flatten: true }).length > 0),
    );
    this.state.set(
      "hasContentSlot",
      !!(
        contentSlot && contentSlot.assignedNodes({ flatten: true }).length > 0
      ),
    );
    this.state.set(
      "hasImageSlot",
      !!(imageSlot && imageSlot.assignedNodes({ flatten: true }).length > 0),
    );
    this.state.set(
      "hasLabelSlot",
      !!(labelSlot && labelSlot.assignedNodes({ flatten: true }).length > 0),
    );
    this.state.set(
      "hasCtaSlot",
      !!(ctaSlot && ctaSlot.assignedNodes({ flatten: true }).length > 0),
    );
  }

  // --- Getters/Setters for attributes --- //

  /**
   * Gets the current width variant of the card.
   * @returns {"fixed" | "fluid" | "full" | null}
   */
  get variant(): "fixed" | "fluid" | "full" | null {
    return this.state.get("variant");
  }

  /**
   * Sets the width variant of the card.
   * @param { "fixed" | "fluid" | "full" | null } value - The desired variant.
   */
  set variant(value: "fixed" | "fluid" | "full" | null) {
    this.state.set("variant", value || "fixed");
  }

  /**
   * Cleanup when component is disconnected
   */
  disconnectedCallback() {
    this.state.cleanup(); // Automatic cleanup of all subscriptions
  }
}
