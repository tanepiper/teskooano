import { CustomEvents } from "@teskooano/data-types";
import { renderableStore } from "@teskooano/core-state";
import { labelStateManager } from "@teskooano/renderer-threejs-labels";
import type { ActionMenuItem } from "../../../../../core/components/action-menu";
import LabelIcon from "@fluentui/svg-icons/icons/tag_20_regular.svg?raw";

/**
 * Controller for CelestialRowComponent that handles all business logic,
 * renderer interactions, and state management.
 */
export class CelestialRowController {
  private _objectId: string | null = null;
  private _objectName: string | null = null;
  private _objectType: string | null = null;
  private _isInactive: boolean = false;
  private _isFocused: boolean = false;
  private _isFollowing: boolean = false;

  private _host: HTMLElement;

  constructor(host: HTMLElement) {
    this._host = host;
  }

  /**
   * Sets the parent panel reference for accessing renderer and state.
   * Note: This method is kept for compatibility but is no longer used
   * since we now access the renderableStore directly.
   */
  public setParentPanel(_panel: any): void {
    // No longer needed since we use renderableStore directly
  }

  /**
   * Updates the controller state from component attributes.
   */
  public updateFromAttributes(attributes: {
    objectId?: string | null;
    objectName?: string | null;
    objectType?: string | null;
    inactive?: boolean;
    focused?: boolean;
    following?: boolean;
  }): void {
    this._objectId = attributes.objectId ?? this._objectId;
    this._objectName = attributes.objectName ?? this._objectName;
    this._objectType = attributes.objectType ?? this._objectType;
    this._isInactive = attributes.inactive ?? this._isInactive;
    this._isFocused = attributes.focused ?? this._isFocused;
    this._isFollowing = attributes.following ?? this._isFollowing;
  }

  /**
   * Gets the display name for button titles.
   */
  public getDisplayName(): string {
    return this._objectName || this._objectId || "Unknown";
  }

  /**
   * Gets the object type for tooltips.
   */
  public getObjectType(): string {
    return this._objectType || "Object";
  }

  /**
   * Handles focus button click.
   */
  public handleFocusClick(): void {
    if (this._objectId && !this._isInactive) {
      this._host.dispatchEvent(
        new CustomEvent(CustomEvents.FOCUS_REQUEST, {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
      );
    }
  }

  /**
   * Handles follow button click.
   */
  public handleFollowClick(): void {
    if (this._objectId && !this._isInactive) {
      this._host.dispatchEvent(
        new CustomEvent(CustomEvents.FOLLOW_REQUEST, {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
      );
    }
  }

  /**
   * Creates action menu items based on current state.
   */
  public createActionMenuItems(): ActionMenuItem[] {
    if (!this._objectId) return [];

    const objectName = this._objectName || "Object";

    // Get current label visibility state
    const labelsVisible = this.getLabelVisibility();

    return [
      {
        id: "labels",
        title: `${labelsVisible ? "Hide" : "Show"} ${objectName} Labels`,
        iconSvg: LabelIcon,
        active: labelsVisible,
        action: () => this.toggleLabelVisibility(),
      },
    ];
  }

  /**
   * Gets the current label visibility state for this object.
   */
  private getLabelVisibility(): boolean {
    if (!this._objectId) return true;

    try {
      // Get the computed visibility from the label state manager
      const visibility = labelStateManager.getComputedVisibility(
        this._objectId,
      );
      return visibility;
    } catch (error) {
      console.warn(
        `[CelestialRowController] Error getting label visibility for ${this._objectId}:`,
        error,
      );
      return true; // Default to visible on error
    }
  }

  /**
   * Toggles label visibility for this specific object.
   */
  private toggleLabelVisibility(): void {
    if (!this._objectId) return;

    try {
      // Get current explicit visibility state
      const currentExplicitVisibility = labelStateManager.getExplicitVisibility(
        this._objectId,
      );
      const currentComputedVisibility = labelStateManager.getComputedVisibility(
        this._objectId,
      );

      // Toggle the explicit state (this is what the user is controlling)
      const newExplicitVisibility =
        currentExplicitVisibility === false ? true : false;

      console.log(
        `[CelestialRowController] Toggling label visibility for ${this._objectId}: explicit ${currentExplicitVisibility} -> ${newExplicitVisibility}, computed ${currentComputedVisibility}`,
      );

      // Update the explicit visibility state
      labelStateManager.setObjectVisibility(
        this._objectId,
        newExplicitVisibility,
      );

      console.log(`[CelestialRowController] Label visibility update completed`);

      // Verify the change was applied
      const verifyVisibility = labelStateManager.getComputedVisibility(
        this._objectId,
      );
      console.log(
        `[CelestialRowController] Verified new computed visibility: ${verifyVisibility}`,
      );

      // Update the action menu to reflect the new state
      this._host.dispatchEvent(
        new Event("action-menu-update", { bubbles: true }),
      );
    } catch (error) {
      console.error(
        `[CelestialRowController] Error toggling label visibility for ${this._objectId}:`,
        error,
      );
    }
  }

  /**
   * Gets the current object ID.
   */
  public get objectId(): string | null {
    return this._objectId;
  }

  /**
   * Gets whether the row is currently inactive.
   */
  public get isInactive(): boolean {
    return this._isInactive;
  }

  /**
   * Gets whether this object is currently focused.
   */
  public get isFocused(): boolean {
    return this._isFocused;
  }

  /**
   * Gets whether this object is currently being followed.
   */
  public get isFollowing(): boolean {
    return this._isFollowing;
  }
}
