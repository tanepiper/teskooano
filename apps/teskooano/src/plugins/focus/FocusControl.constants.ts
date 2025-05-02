import { CelestialType } from "@teskooano/data-types";

export const CAMERA_DISTANCE_SURFACE_PERCENTAGE = 0.1;
export const MINIMUM_CAMERA_DISTANCE = 1;

export const CAMERA_DISTANCES: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 150,
  [CelestialType.GAS_GIANT]: 5,
  [CelestialType.PLANET]: 5,
  [CelestialType.DWARF_PLANET]: 5,
  [CelestialType.MOON]: 5,
};
export const DEFAULT_CAMERA_DISTANCE = 8;

export const SIZE_BASED_SCALING: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 5.0,
  [CelestialType.GAS_GIANT]: 3.0,
  [CelestialType.PLANET]: 1.5,
  [CelestialType.DWARF_PLANET]: 1.5,
  [CelestialType.MOON]: 1.0,
};
export const DEFAULT_SIZE_SCALING = 1.5;
