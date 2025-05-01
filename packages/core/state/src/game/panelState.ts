import { BehaviorSubject } from "rxjs";
import type { DockviewPanelApi } from "dockview-core";
import type * as THREE from "three";

// --- Panel-Specific View State ---
// This will eventually live *inside* each EnginePanel instance,
// but we define the type here for consistency.
export interface PanelViewState {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  focusedObjectId: string | null;
  showGrid?: boolean;
  showCelestialLabels?: boolean;
  showAuMarkers?: boolean;
  showDebrisEffects?: boolean;
  showDebugSphere?: boolean;
  // Add other view-specific settings here (e.g., wireframe mode)
}

// --- Global Active Panel State ---
// Store holding a reference to the currently active panel's API
// We store the API object as it provides access to the panel's methods/properties.
export const activePanelApi = new BehaviorSubject<DockviewPanelApi | null>(
  null,
);

// --- Actions --- (Converted to simple functions)
export const panelActions = {
  setActivePanel(panelApi: DockviewPanelApi | null) {
    activePanelApi.next(panelApi);
  },
  getActivePanel(): DockviewPanelApi | null {
    return activePanelApi.getValue();
  },
};
