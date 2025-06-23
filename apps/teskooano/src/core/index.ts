/**
 * @fileoverview
 *
 * This file serves as the main entry point for the `@teskooano/core` module.
 * It exports the public-facing API of the core components, controllers,
 * and services, providing a single, consistent import path for other parts
 * of the application.
 */

// --- Components ---
export { TeskooanoButton } from "./components/button/Button";
export { ButtonTooltipManager } from "./components/button/ButtonTooltipManager";
export { TeskooanoCard } from "./components/card/Card";
export { TeskooanoModal } from "./components/modal/Modal";
export {
  TeskooanoModalManager,
  type ModalOptions,
} from "./components/modal/ModalManager";
export { TeskooanoOutputDisplay } from "./components/output/OutputDisplay";
export { TeskooanoLabeledValue } from "./components/output/LabeledValue";
export { TeskooanoSelect } from "./components/select/Select";
export { TeskooanoSlider } from "./components/slider/Slider";
export { TeskooanoTooltip } from "./components/tooltip/Tooltip";

// --- Controllers ---
export {
  DockviewController,
  GroupManager,
  OverlayManager,
  FallbackPanel,
} from "./controllers/dockview";
export type {
  DockviewGroup,
  OverlayOptions,
  ActiveOverlay,
  ComponentWithStaticConfig,
  ComponentConstructorWithStaticConfig,
  RegisteredComponentInfo,
  ModalResult,
  PanelInitParameters,
} from "./controllers/dockview/types";

export { ToolbarController } from "./controllers/toolbar/ToolbarController";
export type { ToolbarInitOptions } from "./controllers/toolbar";

// --- Interfaces & High-Level Controllers ---
export { EngineToolbar } from "./interface/engine-toolbar/EngineToolbar";
export { EngineToolbarManager } from "./interface/engine-toolbar/EngineToolbarManager";

export { TourController } from "./interface/tour-controller/TourController";
export type { TourStep } from "./interface/tour-controller/types";

// --- Configuration ---
export { pluginConfig } from "./config/pluginRegistry";
