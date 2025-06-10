import { Config, DriveStep, PopoverDOM, State, Driver } from "driver.js";
import { PluginExecutionContext } from "@teskooano/ui-plugin";

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

export type TourFactory = (
  driver: Driver,
  context: PluginExecutionContext,
) => TourStep[];
