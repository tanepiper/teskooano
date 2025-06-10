import type { IDockviewPanel } from "dockview-core";
import { Subject } from "rxjs";
import type { GroupManager } from "../group-manager";

/**
 * Handles the logic for when a panel is removed from the Dockview instance.
 * @param panel - The panel that was removed.
 * @param removedPanelSubject - The subject to notify subscribers.
 * @param groupManager - The manager for tracking groups.
 */
export function handlePanelRemoval(
  panel: IDockviewPanel,
  removedPanelSubject: Subject<string>,
  groupManager: GroupManager,
): void {
  const groupId = panel.group?.id;
  const panelId = panel.id;

  removedPanelSubject.next(panelId);

  const group = panel.group;

  if (group && group.panels.length === 0 && groupId) {
    groupManager.cleanupGroupTracking(groupId);
  } else if (!group) {
    console.warn(
      `DockviewController: Removed panel '${panelId}' did not have an associated group.`,
    );
  }
}
