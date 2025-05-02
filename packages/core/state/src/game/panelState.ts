import { BehaviorSubject } from "rxjs";
import type { DockviewPanelApi } from "dockview-core";
import type * as THREE from "three";

export interface PanelViewState {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  focusedObjectId: string | null;
  showGrid?: boolean;
  showCelestialLabels?: boolean;
  showAuMarkers?: boolean;
  showDebrisEffects?: boolean;
  showDebugSphere?: boolean;
}

export const activePanelApi = new BehaviorSubject<DockviewPanelApi | null>(
  null,
);

export const panelActions = {
  setActivePanel(panelApi: DockviewPanelApi | null) {
    activePanelApi.next(panelApi);
  },
  getActivePanel(): DockviewPanelApi | null {
    return activePanelApi.getValue();
  },
};
