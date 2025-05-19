import { BehaviorSubject } from "rxjs";
import type { DockviewPanelApi } from "dockview-core";
import { OSVector3 } from "@teskooano/core-math";

export interface PanelViewState {
  cameraPosition: OSVector3;
  cameraTarget: OSVector3;
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
