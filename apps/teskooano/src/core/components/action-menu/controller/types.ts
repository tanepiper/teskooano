export interface ActionMenuConfig {
  /** The size of buttons in the menu */
  buttonSize?: "xs" | "sm" | "md" | "lg";
  /** The direction the menu appears from the toggle button */
  direction?: "left" | "right" | "top" | "bottom";
  /** Whether to close the menu when an action is clicked */
  closeOnAction?: boolean;
  /** The title for the toggle button */
  toggleTitle?: string;
  /** Custom icon SVG for the toggle button */
  toggleIconSvg?: string;
}

export interface ActionMenuItem {
  /** Unique identifier for this action */
  id: string;
  /** Display title/tooltip for the action */
  title: string;
  /** SVG icon for the action button */
  iconSvg: string;
  /** Whether this action is currently active/selected */
  active?: boolean;
  /** Whether this action is disabled */
  disabled?: boolean;
  /** Optional data to pass with the action event */
  data?: any;
  /** Optional explicit action function to execute when clicked */
  action?: (context: ActionMenuContext) => void | Promise<void>;
}

export interface ActionMenuContext {
  /** The action that was triggered */
  action: ActionMenuItem;
  /** The click event */
  event: MouseEvent;
  /** The instance ID of the menu */
  instanceId: string;
  /** Optional context data passed from the parent */
  contextData?: any;
}

export interface ActionMenuEvent {
  /** The action that was triggered */
  action: ActionMenuItem;
  /** The event that triggered the action */
  event: MouseEvent;
  /** The instance ID of the menu that triggered the action */
  instanceId: string;
}
