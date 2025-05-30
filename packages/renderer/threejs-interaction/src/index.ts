export { ControlsManager } from "./ControlsManager";
export { CSS2DManager } from "./css2d";

// Exports from css2d subdirectory
export {
  CSS2DLayerType,
  CSS2DLabelFactory,
  CSS2DCelestialLabelFactory,
} from "./css2d";
export type {
  ILabelFactory, // Explicit type export
  LabelCreationContext,
  CelestialLabelCreationContext,
  LabelUpdateContext,
  CelestialLabelUpdateContext,
  CelestialLabelComponentFactory, // Explicit type export
} from "./css2d";

export type { LabelFactoryMap } from "./css2d";

export { ControlsManager as CameraManager } from "./ControlsManager";
