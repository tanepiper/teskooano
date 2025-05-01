import { AddGroupOptions, DockviewApi } from "dockview-core";
import { DockviewGroup } from "./types";

/**
 * Manages named groups within a Dockview instance.
 * Handles creation, retrieval, caching, and cleanup of logical groups.
 */
export class GroupManager {
  private _api: DockviewApi;
  private _groupNameToIdMap: Map<string, string> = new Map();
  private _groupCache: Map<string, DockviewGroup> = new Map();

  /**
   * Creates an instance of GroupManager.
   * @param api - The DockviewApi instance to interact with.
   */
  constructor(api: DockviewApi) {
    this._api = api;
  }

  /**
   * Creates a new group or returns an existing one with the provided name.
   * Handles cases where the group might have been closed by the user.
   * @param groupName Logical name for the group
   * @param options Optional configuration for the new group
   * @returns The group object or null if creation failed or group not found
   */
  public createOrGetGroup(
    groupName: string,
    options?: AddGroupOptions,
  ): DockviewGroup | null {
    let group: DockviewGroup | null = null;
    const groupId = this._groupNameToIdMap.get(groupName);

    if (groupId) {
      group = this._groupCache.get(groupId) || this._api.getGroup(groupId);

      if (group && this._api.getGroup(groupId)) {
        this._groupCache.set(groupId, group);

        return group;
      } else {
        console.warn(
          `GroupManager: Group '${groupName}' (ID: ${groupId}) not found or invalid. Removing stale entry.`,
        );
        this._groupNameToIdMap.delete(groupName);
        if (groupId) this._groupCache.delete(groupId);
        group = null;
      }
    }

    if (!group) {
      try {
        const newGroup = this._api.addGroup(options);
        const newId = newGroup.id;
        this._groupNameToIdMap.set(groupName, newId);
        this._groupCache.set(newId, newGroup);

        return newGroup;
      } catch (error) {
        console.error(
          `GroupManager: Failed to create group '${groupName}':`,
          error,
        );
        return null;
      }
    }

    return group;
  }

  /**
   * Get a group by its logical name
   * @param groupName The logical name of the group.
   * @returns The Dockview group object or null if not found.
   */
  public getGroupByName(groupName: string): DockviewGroup | null {
    const groupId = this._groupNameToIdMap.get(groupName);
    if (!groupId) {
      console.warn(`GroupManager: No ID mapped for group name '${groupName}'.`);
      return null;
    }
    const group = this._api.getGroup(groupId);
    if (!group) {
      console.warn(
        `GroupManager: Group with ID '${groupId}' not found in API.`,
      );
      this._groupNameToIdMap.delete(groupName);
      this._groupCache.delete(groupId);
    }
    return group || null;
  }

  /**
   * Maximize a group by its logical name
   * @param groupName The logical name of the group to maximize.
   * @returns True if maximization was successful, false otherwise.
   */
  public maximizeGroupByName(groupName: string): boolean {
    const group = this.getGroupByName(groupName);
    if (!group) {
      console.error(
        `GroupManager: Cannot maximize group '${groupName}' because it doesn't exist or couldn't be retrieved.`,
      );
      return false;
    }

    try {
      this._api.maximizeGroup(group);
      return true;
    } catch (error) {
      console.error(
        `GroupManager: Failed to maximize group '${groupName}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Removes tracking information (name mapping, cache) for a given group ID.
   * This should be called when a tracked group becomes empty and is removed.
   * @param groupId The ID of the group to stop tracking.
   */
  public cleanupGroupTracking(groupId: string): void {
    let groupNameToRemove: string | null = null;
    for (const [name, id] of this._groupNameToIdMap.entries()) {
      if (id === groupId) {
        groupNameToRemove = name;
        break;
      }
    }

    if (groupNameToRemove) {
      this._groupNameToIdMap.delete(groupNameToRemove);
      this._groupCache.delete(groupId);
    } else {
      console.warn(
        `GroupManager: No tracking cleanup needed for untracked group ID: ${groupId}.`,
      );
    }
  }

  /**
   * Clears all internal group tracking maps and caches.
   * Should be called when the controller is disposed.
   */
  public dispose(): void {
    this._groupNameToIdMap.clear();
    this._groupCache.clear();
  }
}
