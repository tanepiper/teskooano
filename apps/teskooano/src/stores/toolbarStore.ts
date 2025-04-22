import { atom } from "nanostores";

// --- Types ---

// Base config for all toolbar buttons
export interface ToolbarButtonConfig {
  id: string; // Unique identifier
  iconSvg: string; // Raw SVG string for button icon
  title: string; // Tooltip text
  type: "panel" | "function"; // Button behavior type
}

// Configuration for panel-type buttons
export interface PanelToolbarButtonConfig extends ToolbarButtonConfig {
  type: "panel";
  componentName: string; // Component to render in panel
  panelId?: string; // Optional custom panel ID
  panelTitle?: string; // Optional panel title override
  behaviour: "toggle" | "create"; // Panel behavior - toggle or always create new
  initialPosition?: {
    // Optional position for floating panel
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

// Configuration for function-type buttons
export interface FunctionToolbarButtonConfig extends ToolbarButtonConfig {
  type: "function";
  action: () => Promise<void>; // Async function to execute on click
}

// Combined button type
export type ToolbarButtonType =
  | PanelToolbarButtonConfig
  | FunctionToolbarButtonConfig;

// --- Stores ---

// Store for expanded/collapsed state
export const $isToolbarExpanded = atom<boolean>(true);

// Store for registered buttons - key is button ID
export const $toolbarButtons = atom<Record<string, ToolbarButtonType>>({});

// --- Actions ---

/**
 * Toggle the toolbar expanded state
 */
export function toggleToolbar(): void {
  $isToolbarExpanded.set(!$isToolbarExpanded.get());
}

/**
 * Register a new button in the toolbar
 * @param config Button configuration
 */
export function registerToolbarButton(config: ToolbarButtonType): void {
  const buttons = { ...$toolbarButtons.get() };
  buttons[config.id] = config;
  $toolbarButtons.set(buttons);
}

/**
 * Unregister a button from the toolbar
 * @param id Button ID to remove
 */
export function unregisterToolbarButton(id: string): void {
  const buttons = { ...$toolbarButtons.get() };
  if (buttons[id]) {
    delete buttons[id];
    $toolbarButtons.set(buttons);
  }
}
