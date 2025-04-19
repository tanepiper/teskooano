import { DriveStep } from "driver.js";

// Define the tour steps
export interface TourStep extends DriveStep {
  id: string;
  overlayColor?: string; // Add support for per-step overlay color
  disableActiveInteraction?: boolean; // Add support for disabling interactions with highlighted element
  onNextClick?: (engineViewId?: string) => void; // Add support for custom next click actions
  onPopoverRender?: () => void; // Add support for custom popover render actions
  onHighlightStarted?: () => void; // Add support for custom highlight started actions
}
