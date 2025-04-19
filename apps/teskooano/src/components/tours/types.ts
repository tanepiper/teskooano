import { Config, DriveStep, PopoverDOM, State } from "driver.js";

// Define the tour steps
export interface TourStep extends DriveStep {
  id: string;
  overlayColor?: string; // Add support for per-step overlay color
  disableActiveInteraction?: boolean; // Add support for disabling interactions with highlighted element
  onNextClick?: (engineViewId?: string) => void; // Add support for custom next click actions
  onPopoverRender?: (popover: PopoverDOM, opts: { config: Config; state: State }) => void; // Add support for custom popover render actions
  onHighlightStarted?: () => void; // Add support for custom highlight started actions
}
