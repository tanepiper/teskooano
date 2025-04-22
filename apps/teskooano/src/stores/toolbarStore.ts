import { map, MapStore } from "nanostores";

// --- Types ---

// Base config for all toolbar buttons
export interface ToolbarButtonConfig {
  id: string; // Unique identifier (within a specific toolbar instance)
  iconSvg: string; // Raw SVG string for button icon
  title: string; // Tooltip text
  type: "panel" | "function"; // Button behavior type
}

// Configuration for panel-type buttons
export interface PanelToolbarButtonConfig extends ToolbarButtonConfig {
  type: "panel";
  componentName: string; // Component to render in panel
  panelId?: string; // Optional custom panel ID (will be namespaced by apiId)
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
  action: (apiId: string) => Promise<void>; // Async function to execute on click
}

// Combined button type
export type ToolbarButtonType =
  | PanelToolbarButtonConfig
  | FunctionToolbarButtonConfig;

// --- Stores ---

// Store for expanded/collapsed state per toolbar instance (key = apiId)
// Default state for any new toolbar ID will be 'true' (expanded)
export const $toolbarExpansionStates = map<Record<string, boolean>>({});

// Store for registered buttons per toolbar instance (outer key = apiId, inner key = button ID)
export const $toolbarButtonConfigs = map<
  Record<string, Record<string, ToolbarButtonType>>
>({});

// --- Actions ---

/**
 * Set the initial state for a toolbar instance if it doesn't exist.
 * @param apiId The unique ID of the toolbar instance (panel API ID).
 */
function ensureToolbarState(apiId: string): void {
  // Use store directly
  if ($toolbarExpansionStates.get()[apiId] === undefined) {
    // Set default expansion state for this new toolbar ID
    $toolbarExpansionStates.setKey(apiId, true); // Default to expanded
    // Set default empty button config for this new toolbar ID
    $toolbarButtonConfigs.setKey(apiId, {});
  }
}

/**
 * Toggle the toolbar expanded state for a specific instance.
 * @param apiId The unique ID of the toolbar instance.
 */
export function toggleToolbar(apiId: string): void {
  ensureToolbarState(apiId); // Ensure state exists before toggling
  const store = $toolbarExpansionStates; // Reference the store directly
  const currentState = store.get()[apiId];
  store.setKey(apiId, !currentState);
}

/**
 * Get the expansion state for a specific toolbar instance.
 * Defaults to true if the state hasn't been initialized yet.
 * @param apiId The unique ID of the toolbar instance.
 */
export function getToolbarExpandedState(apiId: string): boolean {
  return $toolbarExpansionStates.get()[apiId] ?? true; // Default to true
}

/**
 * Register a new button for a specific toolbar instance.
 * @param apiId The unique ID of the toolbar instance.
 * @param config Button configuration.
 */
export function registerToolbarButton(
  apiId: string,
  config: ToolbarButtonType,
): void {
  ensureToolbarState(apiId); // Ensure state exists
  const store = $toolbarButtonConfigs; // Reference the store directly
  const currentButtons = store.get()[apiId] || {}; // Get buttons for this instance, or default to empty
  const updatedButtons = { ...currentButtons, [config.id]: config };
  store.setKey(apiId, updatedButtons);
}

/**
 * Unregister a button from a specific toolbar instance.
 * @param apiId The unique ID of the toolbar instance.
 * @param buttonId Button ID to remove.
 */
export function unregisterToolbarButton(apiId: string, buttonId: string): void {
  const store = $toolbarButtonConfigs; // Reference the store directly
  const currentButtons = store.get()[apiId];
  if (currentButtons && currentButtons[buttonId]) {
    const updatedButtons = { ...currentButtons };
    delete updatedButtons[buttonId];
    store.setKey(apiId, updatedButtons);
  }
}

/**
 * Get the button configurations for a specific toolbar instance.
 * Returns an empty object if the state hasn't been initialized.
 * @param apiId The unique ID of the toolbar instance.
 */
export function getToolbarButtons(
  apiId: string,
): Record<string, ToolbarButtonType> {
  return $toolbarButtonConfigs.get()[apiId] ?? {}; // Default to empty object
}

/**
 * Clean up the state for a specific toolbar instance when it's disposed.
 * @param apiId The unique ID of the toolbar instance.
 */
export function cleanupToolbarState(apiId: string): void {
  // Remove from expansion states
  const expansionStore = $toolbarExpansionStates; // Reference the store directly
  const currentExpansionStates = { ...expansionStore.get() };
  delete currentExpansionStates[apiId];
  expansionStore.set(currentExpansionStates);

  // Remove from button configs
  const buttonStore = $toolbarButtonConfigs; // Reference the store directly
  const currentButtonConfigs = { ...buttonStore.get() };
  delete currentButtonConfigs[apiId];
  buttonStore.set(currentButtonConfigs);
}
