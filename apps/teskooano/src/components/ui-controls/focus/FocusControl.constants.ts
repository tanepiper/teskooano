import { CelestialType } from "@teskooano/data-types";

// --- Constants for Camera Focusing ---
export const CAMERA_DISTANCE_SURFACE_PERCENTAGE = 0.1; // 10% from surface
export const MINIMUM_CAMERA_DISTANCE = 1;
// Enhanced distances with better defaults for stars and large bodies
export const CAMERA_DISTANCES: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 150, // Increased from 50 to allow better view of stars
  [CelestialType.GAS_GIANT]: 5, // Doubled from 20
  [CelestialType.PLANET]: 5, // Slightly increased
  [CelestialType.DWARF_PLANET]: 5, // Slightly increased
  [CelestialType.MOON]: 5, // Slightly increased
};
export const DEFAULT_CAMERA_DISTANCE = 8; // Increased default distance

// Size-based scaling factors for different celestial types
export const SIZE_BASED_SCALING: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 5.0, // Stars need much more space due to brightness/size
  [CelestialType.GAS_GIANT]: 3.0, // Gas giants are large but not as bright
  [CelestialType.PLANET]: 1.5, // Reduced from 2.0
  [CelestialType.DWARF_PLANET]: 1.5,
  [CelestialType.MOON]: 1.0, // Reduced from 1.2
};
export const DEFAULT_SIZE_SCALING = 1.5;
// --- End Constants ---