/**
 * @module PopoverAPI
 * Provides constants and utility functions for interacting with the native HTML Popover API.
 * @see https:
 */

/**
 * Possible states for the `popover` HTML attribute.
 */
export const PopoverStates = {
  AUTO: "auto",
  MANUAL: "manual",
  HINT: "hint",
} as const;

export type PopoverState = (typeof PopoverStates)[keyof typeof PopoverStates];

/**
 * Possible actions for the `popovertargetaction` HTML attribute.
 */
export const PopoverTargetActions = {
  SHOW: "show",
  HIDE: "hide",
  TOGGLE: "toggle",
} as const;

export type PopoverTargetAction =
  (typeof PopoverTargetActions)[keyof typeof PopoverTargetActions];

/**
 * Checks if the native Popover API seems to be supported by the browser.
 * This is a basic check and might not cover all edge cases.
 * @returns {boolean} True if the API seems supported, false otherwise.
 */
export function isPopoverSupported(): boolean {
  return (
    typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype
  );
}

/**
 * Programmatically shows a popover element by its ID.
 * Does nothing if the element is not found or popover API is not supported.
 * @param {string} elementId The ID of the popover element.
 * @returns {boolean} True if the popover was shown, false otherwise.
 */
export function showPopoverById(elementId: string): boolean {
  if (!isPopoverSupported()) return false;
  const element = document.getElementById(elementId) as HTMLElement | null;
  if (element?.popover === null || element?.popover === undefined) {
    console.warn(`Element with ID "${elementId}" is not a popover element.`);
    return false;
  }
  try {
    element.showPopover();
    return true;
  } catch (e) {
    console.error(`Error showing popover "${elementId}":`, e);
    return false;
  }
}

/**
 * Programmatically hides a popover element by its ID.
 * Does nothing if the element is not found or popover API is not supported.
 * @param {string} elementId The ID of the popover element.
 * @returns {boolean} True if the popover was hidden, false otherwise.
 */
export function hidePopoverById(elementId: string): boolean {
  if (!isPopoverSupported()) return false;
  const element = document.getElementById(elementId) as HTMLElement | null;
  if (element?.popover === null || element?.popover === undefined) {
    if (element) {
      console.warn(`Element with ID "${elementId}" is not a popover element.`);
    }
    return false;
  }
  try {
    element.hidePopover();
    return true;
  } catch (e) {
    console.error(`Error hiding popover "${elementId}":`, e);
    return false;
  }
}

/**
 * Programmatically toggles a popover element by its ID.
 * Does nothing if the element is not found or popover API is not supported.
 * @param {string} elementId The ID of the popover element.
 * @param {boolean} [force] If true, forces the popover to show; if false, forces it to hide.
 * @returns {boolean} True if the popover was toggled, false otherwise.
 */
export function togglePopoverById(elementId: string, force?: boolean): boolean {
  if (!isPopoverSupported()) return false;
  const element = document.getElementById(elementId) as HTMLElement | null;
  if (element?.popover === null || element?.popover === undefined) {
    if (element) {
      console.warn(`Element with ID "${elementId}" is not a popover element.`);
    }
    return false;
  }
  try {
    element.togglePopover(force);
    return true;
  } catch (e) {
    console.error(`Error toggling popover "${elementId}":`, e);
    return false;
  }
}

export type PopoverToggleEvent = ToggleEvent;
