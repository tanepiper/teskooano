import { CelestialStatus } from "@teskooano/data-types";
import type { CelestialHierarchy } from "../view/CelestialHierarchy.view.js";

export interface TreeInteractionHandlers {
  onFocusRequest: (objectId: string) => void;
  onFollowRequest: (objectId: string) => void;
}

/**
 * Manages tree-specific interactions like caret toggles and row events.
 */
export class TreeInteractionManager {
  private _treeListContainer: HTMLUListElement;
  private _handlers: TreeInteractionHandlers;

  constructor(
    treeListContainer: HTMLUListElement,
    handlers: TreeInteractionHandlers,
  ) {
    this._treeListContainer = treeListContainer;
    this._handlers = handlers;
  }

  public handleTreeInteraction(event: Event): void {
    const target = event.target as HTMLElement;

    const caret = target.closest(".caret") as HTMLElement | null;
    if (caret) {
      this.handleCaretToggle(event, caret);
      return;
    }

    // Handle focus/follow via button clicks using data attributes
    const focusBtn = target.closest("[id='focus-btn']");
    const followBtn = target.closest("[id='follow-btn']");
    if (focusBtn || followBtn) this.handleRowEvent(event);
  }

  public expandTreeToReveal(focusedId: string): void {
    const elementToReveal = this._treeListContainer.querySelector<HTMLElement>(
      `celestial-row[object-id="${focusedId}"]`,
    );
    let parentLi = elementToReveal?.closest("li");
    while (parentLi) {
      const parentUl = parentLi.parentElement;
      if (
        parentUl &&
        parentUl.classList.contains("nested") &&
        !parentUl.classList.contains("active")
      ) {
        parentUl.classList.add("active");
        const parentLiOfUl = parentUl.closest("li");
        const caret = parentLiOfUl?.querySelector<HTMLElement>(
          ":scope > .list-item-content > .caret",
        );
        if (caret) {
          caret.classList.add("caret-down");
          caret.setAttribute("aria-expanded", "true");
        }
      }
      parentLi = parentUl?.closest("li");
    }
  }

  private handleCaretToggle(event: Event, caret: HTMLElement): void {
    if (event.type === "touchend") {
      event.preventDefault();
    }
    const parentLi = caret.closest("li");
    const nestedList =
      parentLi?.querySelector<HTMLUListElement>(":scope > .nested");
    if (nestedList) {
      const isExpanded = nestedList.classList.toggle("active");
      caret.classList.toggle("caret-down", isExpanded);
      caret.setAttribute("aria-expanded", isExpanded.toString());
    }
  }

  private handleRowEvent(event: Event): void {
    const row = (event.target as HTMLElement).closest(
      "celestial-row",
    ) as HTMLElement | null;
    const objectId = row?.getAttribute("object-id") || undefined;
    if (!objectId) return;

    // Note: Object validation should be done by the calling controller
    // since this manager doesn't have access to the current object state

    if ((event.target as HTMLElement).id === "focus-btn") {
      console.debug(
        `[TreeInteractionManager] Focus requested via row event for: ${objectId}`,
      );
      this._handlers.onFocusRequest(objectId);
    } else if ((event.target as HTMLElement).id === "follow-btn") {
      console.debug(
        `[TreeInteractionManager] Follow requested via row event for: ${objectId}`,
      );
      this._handlers.onFollowRequest(objectId);
    }
  }
}
