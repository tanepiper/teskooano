import { IContentRenderer, GroupPanelPartInitParameters } from "dockview-core";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Type alias for a Dockview group object.
 * Marked as `any` because the exact type from dockview-core is complex and potentially internal.
 */
export type DockviewGroup = any;

/**
 * Options for configuring the dimensions and content of an overlay.
 */
export interface OverlayOptions {
  /** The desired width of the overlay in pixels. */
  width: number;
  /** The desired height of the overlay in pixels. */
  height: number;
  /** The title to display in the modal header. */
  title: string;
  /** Text for the confirm button. If undefined, the button is hidden. */
  confirmText?: string;
  /** Text for the close button. If undefined, the button is hidden. */
  closeText?: string;
  /** Text for the secondary action button. If undefined, the button is hidden. */
  secondaryText?: string;
  /** If true, the secondary button is hidden regardless of whether it has text. */
  hideSecondaryButton?: boolean;
}

/**
 * Internal state representing an active overlay.
 */
export interface ActiveOverlay {
  /** The root HTML element of the overlay. */
  element: HTMLElement;
}

/**
 * Interface representing the instance side of a component that can be rendered in Dockview.
 * Extends the core IContentRenderer.
 */
export interface ComponentWithStaticConfig extends IContentRenderer {}

/**
 * Interface representing the constructor side of a Dockview component.
 * Allows defining static properties like `componentName` and `registerToolbarButtonConfig`.
 */
export interface ComponentConstructorWithStaticConfig {
  /** Standard constructor signature. */
  new (): ComponentWithStaticConfig;
  /** Optional static property defining the component's registration name. */
  componentName?: string;
  /** Optional static method to provide toolbar button configuration. */
  registerToolbarButtonConfig?: () => PanelToolbarItemConfig;
}

/**
 * Structure holding information about a registered component.
 */
export interface RegisteredComponentInfo {
  /** The constructor function for the component. */
  constructor: new () => IContentRenderer;
  /** Optional toolbar configuration associated with the component. */
  toolbarConfig?: PanelToolbarItemConfig;
}

/**
 * Represents the possible results when closing or dismissing a modal overlay.
 */
export type ModalResult = "confirm" | "close" | "secondary" | "dismissed";

/**
 * Extends Dockview's GroupPanelPartInitParameters to include a flexible `params` object.
 */
export type PanelInitParameters = GroupPanelPartInitParameters & {
  /** Optional custom parameters passed during panel creation. */
  params?: {
    /** An optional title parameter. */
    title?: string;
    /** Allows for any other custom parameters. */
    [key: string]: any;
  };
};

/**
 * Defines the state for a generic panel view within the UI, often for debug or informational panels.
 * This might control what visual helpers or information are displayed in a particular view.
 */
export interface PanelViewState {
  /** The camera position associated with this panel view. */
  cameraPosition: OSVector3;
  /** The camera target associated with this panel view. */
  cameraTarget: OSVector3;
  /** The ID of the object focused in this panel view, if any. */
  focusedObjectId: string | null;
  /** Whether to show a grid helper in this panel view. */
  showGrid?: boolean;
  /** Whether to show labels for celestial objects in this panel view. */
  showCelestialLabels?: boolean;
  /** Whether to show Astronomical Unit (AU) markers in this panel view. */
  showAuMarkers?: boolean;
  /** Whether to show visual effects for debris in this panel view. */
  showDebrisEffects?: boolean;
  /** Whether to show a generic debug sphere in this panel view. */
  showDebugSphere?: boolean;
}
