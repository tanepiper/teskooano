import { OSVector3 } from "@teskooano/core-math";

/**
 * Defines the state for a generic panel view within the UI, often for debug or informational panels.
 * This might control what visual helpers or information are displayed in a particular view.
 */
export interface PanelViewState {
  /** The camera position associated with this panel view. */
  cameraPosition: OSVector3;
  /** The camera target associated with this panel view. */
  cameraTarget: OSVector3;
  /** The ID of the object focused in this panel view, if any. */
  focusedObjectId: string | null;
  /** Whether to show a grid helper in this panel view. */
  showGrid?: boolean;
  /** Whether to show labels for celestial objects in this panel view. */
  showCelestialLabels?: boolean;
  /** Whether to show Astronomical Unit (AU) markers in this panel view. */
  showAuMarkers?: boolean;
  /** Whether to show visual effects for debris in this panel view. */
  showDebrisEffects?: boolean;
  /** Whether to show a generic debug sphere in this panel view. */
  showDebugSphere?: boolean;
}
