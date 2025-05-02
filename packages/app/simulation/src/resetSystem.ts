import { celestialFactory } from "@teskooano/core-state";

/**
 * Reset all celestial objects from the store to prepare for a new system initialization
 * @param skipStateClear - Set to true if calling code will use createSolarSystem which also clears state
 */
export function resetCelestialObjects(skipStateClear: boolean = false) {
  if (!skipStateClear) {
    celestialFactory.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
  } else {
    console.warn(
      "[SYSTEM] Skipping state clear as createSolarSystem will handle it",
    );
  }
}
