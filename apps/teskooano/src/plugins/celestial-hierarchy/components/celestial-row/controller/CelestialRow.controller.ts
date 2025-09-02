import { CustomEvents } from "@teskooano/data-types";
import type { ActionMenuItem } from "../../../../../core/components/action-menu";
import OrbitIcon from "@fluentui/svg-icons/icons/access_time_20_regular.svg?raw";
import InfoIcon from "@fluentui/svg-icons/icons/info_20_regular.svg?raw";
import TrailIcon from "@fluentui/svg-icons/icons/timeline_20_regular.svg?raw";
import PredictionIcon from "@fluentui/svg-icons/icons/access_time_20_regular.svg?raw";

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
  private _parentPanel: any = null;
  private _host: HTMLElement;

  constructor(host: HTMLElement) {
    this._host = host;
  }

  /**
   * Sets the parent panel reference for accessing renderer and state.
   */
  public setParentPanel(panel: any): void {
    this._parentPanel = panel;
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

    // Get current visibility states
    const orbitVisible = this.getOrbitVisibility();
    const trailVisible = this.getTrailVisibility();
    const predictionVisible = this.getPredictionVisibility();

    return [
      {
        id: "orbit",
        title: `Toggle Orbit Lines`,
        iconSvg: OrbitIcon,
        active: orbitVisible,
        action: () => this.toggleOrbitVisibility(),
      },
      {
        id: "trail",
        title: `Toggle Trail Lines`,
        iconSvg: TrailIcon,
        active: trailVisible,
        action: () => this.toggleTrailVisibility(),
      },
      {
        id: "prediction",
        title: `Toggle Prediction Lines`,
        iconSvg: PredictionIcon,
        active: predictionVisible,
        action: () => this.togglePredictionVisibility(),
      },
      {
        id: "info",
        title: `Show ${objectName} Info`,
        iconSvg: InfoIcon,
        active: false,
        action: () => this.showObjectInfo(),
      },
    ];
  }

  /**
   * Gets the current orbit visibility state for this object.
   */
  private getOrbitVisibility(): boolean {
    if (!this._parentPanel || !this._objectId) return false;

    try {
      const renderer = this._parentPanel.getRenderer();
      const celestialRenderer =
        renderer?.renderingOrchestrator?.celestialManager?.getRenderer(
          this._objectId,
        );

      if (
        celestialRenderer &&
        typeof celestialRenderer.shouldShowOrbitLines === "function"
      ) {
        // Get camera distance to determine if orbit should be visible
        const camera =
          renderer?.renderingOrchestrator?.cameraManager?.getCamera();
        if (camera) {
          const object =
            renderer?.renderingOrchestrator?.objectManager?.getObject(
              this._objectId,
            );
          if (object) {
            const distance = camera.position.distanceTo(object.position);
            return celestialRenderer.shouldShowOrbitLines(
              distance,
              this._objectType as any,
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        `[CelestialRowController] Error getting orbit visibility for ${this._objectId}:`,
        error,
      );
    }

    return false;
  }

  /**
   * Gets the current trail visibility state for this object.
   */
  private getTrailVisibility(): boolean {
    if (!this._parentPanel || !this._objectId) return false;

    try {
      const renderer = this._parentPanel.getRenderer();
      const celestialRenderer =
        renderer?.renderingOrchestrator?.celestialManager?.getRenderer(
          this._objectId,
        );

      if (
        celestialRenderer &&
        typeof celestialRenderer.shouldShowTrailLines === "function"
      ) {
        // Get camera distance to determine if trail should be visible
        const camera =
          renderer?.renderingOrchestrator?.cameraManager?.getCamera();
        if (camera) {
          const object =
            renderer?.renderingOrchestrator?.objectManager?.getObject(
              this._objectId,
            );
          if (object) {
            const distance = camera.position.distanceTo(object.position);
            return celestialRenderer.shouldShowTrailLines(
              distance,
              this._objectType as any,
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        `[CelestialRowController] Error getting trail visibility for ${this._objectId}:`,
        error,
      );
    }

    return false;
  }

  /**
   * Gets the current prediction visibility state for this object.
   */
  private getPredictionVisibility(): boolean {
    if (!this._parentPanel || !this._objectId) return false;

    try {
      const renderer = this._parentPanel.getRenderer();
      const celestialRenderer =
        renderer?.renderingOrchestrator?.celestialManager?.getRenderer(
          this._objectId,
        );

      if (
        celestialRenderer &&
        typeof celestialRenderer.shouldShowPredictionLines === "function"
      ) {
        return celestialRenderer.shouldShowPredictionLines();
      }
    } catch (error) {
      console.warn(
        `[CelestialRowController] Error getting prediction visibility for ${this._objectId}:`,
        error,
      );
    }

    return false;
  }

  /**
   * Toggles orbit line visibility for this specific object.
   */
  private toggleOrbitVisibility(): void {
    if (!this._parentPanel || !this._objectId) return;

    try {
      const renderer = this._parentPanel.getRenderer();
      const celestialRenderer =
        renderer?.renderingOrchestrator?.celestialManager?.getRenderer(
          this._objectId,
        );

      if (celestialRenderer) {
        // Toggle the orbit configuration
        const currentConfig =
          celestialRenderer.positionHistoryManager?.getConfig();
        if (currentConfig) {
          const newConfig = {
            ...currentConfig,
            showOrbitLines: !currentConfig.showOrbitLines,
          };
          celestialRenderer.positionHistoryManager?.updateConfig(newConfig);
        }
      }
    } catch (error) {
      console.error(
        `[CelestialRowController] Error toggling orbit visibility for ${this._objectId}:`,
        error,
      );
    }
  }

  /**
   * Toggles trail line visibility for this specific object.
   */
  private toggleTrailVisibility(): void {
    if (!this._parentPanel || !this._objectId) return;

    try {
      const renderer = this._parentPanel.getRenderer();
      const celestialRenderer =
        renderer?.renderingOrchestrator?.celestialManager?.getRenderer(
          this._objectId,
        );

      if (celestialRenderer) {
        // Toggle the trail configuration
        const currentConfig =
          celestialRenderer.positionHistoryManager?.getConfig();
        if (currentConfig) {
          const newConfig = {
            ...currentConfig,
            showTrailLines: !currentConfig.showTrailLines,
          };
          celestialRenderer.positionHistoryManager?.updateConfig(newConfig);
        }
      }
    } catch (error) {
      console.error(
        `[CelestialRowController] Error toggling trail visibility for ${this._objectId}:`,
        error,
      );
    }
  }

  /**
   * Toggles prediction line visibility for this specific object.
   */
  private togglePredictionVisibility(): void {
    if (!this._parentPanel || !this._objectId) return;

    try {
      const renderer = this._parentPanel.getRenderer();
      const celestialRenderer =
        renderer?.renderingOrchestrator?.celestialManager?.getRenderer(
          this._objectId,
        );

      if (celestialRenderer) {
        // Toggle prediction lines
        const currentlyVisible = celestialRenderer.shouldShowPredictionLines();
        celestialRenderer.setShowPredictionLines(!currentlyVisible);
      }
    } catch (error) {
      console.error(
        `[CelestialRowController] Error toggling prediction visibility for ${this._objectId}:`,
        error,
      );
    }
  }

  /**
   * Shows object info by dispatching an info request event.
   */
  private showObjectInfo(): void {
    if (this._objectId && !this._isInactive) {
      this._host.dispatchEvent(
        new CustomEvent("celestial-info-request", {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
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
