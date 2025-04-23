import { PanelToolbarButtonConfig } from "../../stores/toolbarStore";
import { IContentRenderer, GroupPanelPartInitParameters } from "dockview-core";

/**
 * Type alias for a Dockview group object.
 * Marked as `any` because the exact type from dockview-core is complex and potentially internal.
 */
export type DockviewGroup = any;

/**
 * Options for configuring the dimensions of an overlay.
 */
export interface OverlayOptions {
  /** The desired width of the overlay in pixels. */
  width: number;
  /** The desired height of the overlay in pixels. */
  height: number;
}

/**
 * Internal state representing an active overlay.
 */
export interface ActiveOverlay {
  /** The Dockview Overlay instance. Use `any` for now due to type complexity/privacy. */
  overlay: any;
  /** The root HTML element of the overlay. */
  element: HTMLElement;
  /** The resolve function for the Promise returned by `showOverlay`. */
  resolve: (result: ModalResult) => void;
}

/**
 * Interface representing the instance side of a component that can be rendered in Dockview.
 * Extends the core IContentRenderer.
 */
export interface ComponentWithStaticConfig extends IContentRenderer {
  // Add any required instance-side properties or methods common to your components here.
}

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
  registerToolbarButtonConfig?: () => PanelToolbarButtonConfig;
}

/**
 * Structure holding information about a registered component.
 */
export interface RegisteredComponentInfo {
  /** The constructor function for the component. */
  constructor: new () => IContentRenderer;
  /** Optional toolbar configuration associated with the component. */
  toolbarConfig?: PanelToolbarButtonConfig;
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
