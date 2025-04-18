/**
 * Shared UI type definitions that can be used across different UI implementations
 */

/**
 * UI Component types
 */
export enum UIComponentType {
  PANEL = "panel",
  FOLDER = "folder",
  BUTTON = "button",
  SLIDER = "slider",
  CHECKBOX = "checkbox",
  DROPDOWN = "dropdown",
  COLOR = "color",
  TEXT = "text",
  NUMBER = "number",
  LABEL = "label",
  TOOLBAR = "toolbar",
  WINDOW = "window",
}

/**
 * UI Layer definitions for z-index organization
 */
export enum UILayer {
  BASE = 0, // Base layer (lowest)
  BACKGROUND = 1, // Background elements
  CONTENT = 2, // Main content elements
  TOOLTIP = 3, // Tooltip/hover elements
  MODAL = 4, // Modal dialogs
  DEBUG = 99, // Debug layer (highest)
}

/**
 * UI Slot types for layout organization
 */
export enum UISlotType {
  HEADER = "header", // Top section of a container
  CONTENT = "content", // Main content area
  FOOTER = "footer", // Bottom section of a container
  LEFT = "left", // Left side of a container
  RIGHT = "right", // Right side of a container
}

/**
 * UI Event types
 */
export enum UIEventType {
  CLICK = "click",
  HOVER = "hover",
  HOVER_START = "hoverStart",
  HOVER_END = "hoverEnd",
  CHANGE = "change",
  FINISH_CHANGE = "finishChange",
  DRAG_START = "dragStart",
  DRAG = "drag",
  DRAG_END = "dragEnd",
  FOCUS = "focus",
  BLUR = "blur",
  KEY_DOWN = "keyDown",
  KEY_UP = "keyUp",
}

/**
 * Mouse event types
 */
export enum MouseEvents {
  CLICK = "click",
  DBLCLICK = "dblclick",
  MOUSEDOWN = "mousedown",
  MOUSEUP = "mouseup",
  MOUSEMOVE = "mousemove",
  MOUSEENTER = "mouseenter",
  MOUSELEAVE = "mouseleave",
  CONTEXTMENU = "contextmenu",
}

/**
 * Keyboard event types
 */
export enum KeyboardEvents {
  KEYDOWN = "keydown",
  KEYUP = "keyup",
  KEYPRESS = "keypress",
}

/**
 * Focus mode for UI components
 */
export enum UIFocusMode {
  NONE = "none",
  KEYBOARD = "keyboard",
  MOUSE = "mouse",
  TOUCH = "touch",
}

/**
 * Theme options for styling the UI
 */
export interface UIThemeOptions {
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  accentColor?: string;
  textColor?: string;
  disabledColor?: string;
  hoverColor?: string; // Color for hover state
  activeColor?: string; // Color for active/selected state
  spacing?: number;
  borderRadius?: number;
  opacity?: number;
}

/**
 * Type definitions for component getters and setters
 */
export type UIGetter<T> = () => T;
export type UISetter<T> = (value: T) => void;

/**
 * Standard UI component events
 */
export enum UIEvents {
  COMPONENT_ADDED = "ui-component-added",
  COMPONENT_REMOVED = "ui-component-removed",
  COMPONENT_SHOWN = "ui-component-shown",
  COMPONENT_HIDDEN = "ui-component-hidden",
  COMPONENT_ENABLED = "ui-component-enabled",
  COMPONENT_DISABLED = "ui-component-disabled",
  PANEL_COLLAPSED = "ui-panel-collapsed",
  PANEL_EXPANDED = "ui-panel-expanded",
  DRAG_START = "ui-drag-start",
  DRAG_MOVE = "ui-drag-move",
  DRAG_END = "ui-drag-end",
  FOCUS = "ui-focus",
  BLUR = "ui-blur",
  VALUE_CHANGE = "ui-value-change",
  VALUE_CHANGE_DONE = "ui-value-change-done",
  LAYER_CHANGED = "ui-layer-changed",
  THEME_CHANGED = "ui-theme-changed",
}

/**
 * Base UI Component interface
 * Implementations should extend this with rendering-specific details
 */
export interface BaseUIComponent {
  id: string;
  type: UIComponentType;
  parent?: BaseUIComponent;
  children: BaseUIComponent[];
  visible: boolean;
  disabled: boolean;
  layer?: UILayer;
  zIndex?: number;

  // Methods all components should implement
  add(component: BaseUIComponent): BaseUIComponent;
  remove(component: BaseUIComponent): void;
  destroy(): void;
  show(): BaseUIComponent;
  hide(): BaseUIComponent;
  enable(): BaseUIComponent;
  disable(): BaseUIComponent;
  onChange(callback: (value: any) => void): BaseUIComponent;
  onFinishChange(callback: (value: any) => void): BaseUIComponent;
}

/**
 * Base UI Event data
 */
export interface BaseUIEvent {
  type: UIEventType;
  component: BaseUIComponent;
  value?: any;
  originalEvent?: MouseEvent | TouchEvent | KeyboardEvent;
  stopPropagation?: () => void;
  preventDefault?: () => void;
}

/**
 * Base UI Drag Event data
 */
export interface BaseUIDragEvent extends BaseUIEvent {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  currentX: number;
  currentY: number;
}

/**
 * Base Controller interface
 */
export interface BaseController<T> extends BaseUIComponent {
  value: T;
  initialValue: T;
  getValue(): T;
  setValue(value: T): BaseController<T>;
  reset(): BaseController<T>;
  min?(min: number): BaseController<T>;
  max?(max: number): BaseController<T>;
  step?(step: number): BaseController<T>;
  name(name: string): BaseController<T>;
  updateDisplay(): BaseController<T>;
}

/**
 * Base UI Slot configuration
 */
export interface BaseUISlot {
  type: UISlotType;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  elements?: string[]; // IDs of elements in this slot
}

/**
 * Base style interfaces
 */

export interface BasePanelStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  titleBarColor?: string;
  titleTextColor?: string;
}

export interface BaseButtonStyle {
  backgroundColor?: string;
  hoverColor?: string;
  activeColor?: string;
  textColor?: string;
  borderRadius?: number;
}

export interface BaseSliderStyle {
  trackColor?: string;
  thumbColor?: string;
  valueColor?: string;
  valueTextColor?: string;
}

export interface BaseCheckboxStyle {
  checkColor?: string;
  boxColor?: string;
  labelColor?: string;
}

export interface BaseDropdownStyle {
  backgroundColor?: string;
  optionBackgroundColor?: string;
  optionHoverColor?: string;
  textColor?: string;
  borderRadius?: number;
}

export interface BaseColorStyle {
  swatchBorderColor?: string;
  swatchSize?: number;
}

export interface BaseTextStyle {
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

export interface BaseNumberStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
}
