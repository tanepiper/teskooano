import { CelestialStatus, CustomEvents } from "@teskooano/data-types";
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

    if (
      event.type === CustomEvents.FOCUS_REQUEST ||
      event.type === CustomEvents.FOLLOW_REQUEST
    ) {
      this.handleRowEvent(event);
    }
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
    const customEvent = event as CustomEvent<{ objectId: string }>;
    const objectId = customEvent.detail?.objectId;
    if (!objectId) return;

    // Note: Object validation should be done by the calling controller
    // since this manager doesn't have access to the current object state

    if (event.type === CustomEvents.FOCUS_REQUEST) {
      console.debug(
        `[TreeInteractionManager] Focus requested via row event for: ${objectId}`,
      );
      this._handlers.onFocusRequest(objectId);
    } else if (event.type === CustomEvents.FOLLOW_REQUEST) {
      console.debug(
        `[TreeInteractionManager] Follow requested via row event for: ${objectId}`,
      );
      this._handlers.onFollowRequest(objectId);
    }
  }
}
