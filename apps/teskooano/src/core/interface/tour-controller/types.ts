import { Config, DriveStep, PopoverDOM, State } from "driver.js";

export interface TourStep extends DriveStep {
  id: string;
  overlayColor?: string;
  disableActiveInteraction?: boolean;
  onNextClick?: (engineViewId?: string) => void;
  onPopoverRender?: (
    popover: PopoverDOM,
    opts: { config: Config; state: State },
  ) => void;
  onHighlightStarted?: () => void;
}
