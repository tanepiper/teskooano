import * as THREE from 'three';
import { type OrbitalParameters, CelestialType } from '@teskooano/data-types';
import type { MapStore } from 'nanostores';
import type { RenderableCelestialObject } from '@teskooano/renderer-threejs';
import type { ObjectManager } from '../ObjectManager'; // Adjust path as needed
import { calculateOrbitPoints, updateOrbitLine } from './'; // Import from index

// --- Material Definitions ---
const KEPLERIAN_DEFAULT_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xffffff, // White
  linewidth: 1.5,
  transparent: true,
  opacity: 0.7,
  depthTest: false,
});
const KEPLERIAN_MOON_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xaaaaaa, // Dim Gray
  linewidth: 1.0,
  transparent: true,
  opacity: 0.5,
  depthTest: false,
});

/**
 * Manages the creation, update, visibility, and highlighting of static Keplerian orbit lines.
 */
export class KeplerianOrbitManager {
  /** Map storing static Keplerian orbit lines, keyed by celestial object ID. */
  public lines: Map<string, THREE.Line> = new Map();

  private objectManager: ObjectManager;
  private renderableObjectsStore: MapStore<Record<string, RenderableCelestialObject>>;

  /**
   * Creates an instance of KeplerianOrbitManager.
   * @param objectManager - The scene's ObjectManager instance.
   * @param renderableObjectsStore - The Nanostore containing RenderableCelestialObject data.
   */
  constructor(
    objectManager: ObjectManager,
    renderableObjectsStore: MapStore<Record<string, RenderableCelestialObject>>
  ) {
    this.objectManager = objectManager;
    this.renderableObjectsStore = renderableObjectsStore;
  }

  /**
   * Creates or updates a static Keplerian orbit line for a given object.
   * @param objectId - The unique ID of the celestial object whose orbit is being drawn.
   * @param orbitalParameters - The OrbitalParameters for the object.
   * @param parentId - The ID of the parent object around which this object orbits.
   * @param isVisible - The current visibility state for orbit lines.
   * @param highlightedObjectId - The ID of the currently highlighted object (or null).
   * @param highlightColor - The color to use for highlighting.
   */
  createOrUpdate(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    parentId: string,
    isVisible: boolean,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color
  ): void {
    const existingLine = this.lines.get(objectId);
    const parentObject3D = this.objectManager.getObject(parentId);
    const allRenderableObjects = this.renderableObjectsStore.get(); // Get latest state
    const parentState = allRenderableObjects[parentId];

    if (!parentObject3D || !parentState) {
      if (existingLine) this.remove(objectId);
      return;
    }

    const parentWorldPosition = new THREE.Vector3();
    parentObject3D.getWorldPosition(parentWorldPosition);
    const orbitPoints = calculateOrbitPoints(orbitalParameters); // Assumes this returns relative points

    if (orbitPoints.length === 0) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // Determine material based on parent type
    const isMoon = parentState.type !== CelestialType.STAR; // Assuming CelestialType is available
    const targetMaterial = isMoon
        ? KEPLERIAN_MOON_MATERIAL
        : KEPLERIAN_DEFAULT_MATERIAL;

    if (existingLine) {
      updateOrbitLine(existingLine, orbitPoints); // Update geometry
      existingLine.position.copy(parentWorldPosition); // Update position
      existingLine.visible = isVisible; // Update visibility

      // Update material if necessary
      if (existingLine.material !== targetMaterial) {
          if (existingLine.material instanceof THREE.Material) {
              existingLine.material.dispose(); // Dispose old material
          }
          existingLine.material = targetMaterial.clone(); // Assign cloned new material
      }
      this.applyHighlight(objectId, existingLine, highlightedObjectId, highlightColor); // Apply highlight
    } else {
      // Create new line
      const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const material = targetMaterial.clone(); // Clone material for new line
      const newLine = new THREE.Line(geometry, material);

      newLine.name = `orbit-line-${objectId}`;
      newLine.position.copy(parentWorldPosition);
      newLine.visible = isVisible;
      newLine.frustumCulled = false;
      this.objectManager.addRawObjectToScene(newLine);
      this.lines.set(objectId, newLine);
      this.applyHighlight(objectId, newLine, highlightedObjectId, highlightColor); // Apply highlight
    }
  }

  /**
   * Removes a specific Keplerian orbit line from the scene and internal tracking.
   * @param objectId - The ID of the object whose line should be removed.
   */
  remove(objectId: string): void {
    const line = this.lines.get(objectId);
    if (line) {
      this.objectManager.removeRawObjectFromScene(line);
      line.geometry.dispose();
      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
      this.lines.delete(objectId);
    }
  }

  /**
   * Removes all managed Keplerian lines.
   */
  clearAll(): void {
    this.lines.forEach((_, id) => this.remove(id));
    this.lines.clear(); // Ensure map is empty
  }

  /**
   * Sets the visibility of all managed Keplerian lines.
   * @param visible - True to make lines visible, false to hide.
   */
  setVisibility(visible: boolean): void {
    this.lines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Applies or removes the highlight effect for a specific object's line.
   * @param targetObjectId - The ID of the object to potentially highlight or unhighlight.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   */
  applyHighlightToObject(targetObjectId: string, highlightedObjectId: string | null, highlightColor: THREE.Color): void {
      const line = this.lines.get(targetObjectId);
      if (line) {
          this.applyHighlight(targetObjectId, line, highlightedObjectId, highlightColor);
      }
  }

  /**
   * Resets the highlight on a previously highlighted line if it's no longer the target.
   * @param previouslyHighlightedId - The ID that was previously highlighted.
   * @param currentHighlightedId - The ID currently being highlighted (or null).
   */
  resetPreviousHighlight(previouslyHighlightedId: string, currentHighlightedId: string | null): void {
      if (previouslyHighlightedId && previouslyHighlightedId !== currentHighlightedId) {
          const previousLine = this.lines.get(previouslyHighlightedId);
          if (previousLine && previousLine.material instanceof THREE.LineBasicMaterial && previousLine.userData.defaultColor) {
              previousLine.material.color.copy(previousLine.userData.defaultColor);
          }
      }
  }

  /**
   * Helper to apply highlight state to a single line.
   * @param lineObjectId - The ID of the object this line belongs to.
   * @param line - The line object itself.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   * @private
   */
  private applyHighlight(
      lineObjectId: string,
      line: THREE.Line,
      highlightedObjectId: string | null,
      highlightColor: THREE.Color
  ): void {
      if (!(line.material instanceof THREE.LineBasicMaterial)) return;

      if (highlightedObjectId === lineObjectId) {
          if (!line.userData.defaultColor) {
              line.userData.defaultColor = line.material.color.clone();
          }
          line.material.color.copy(highlightColor);
      } else if (line.userData.defaultColor) {
          // Only reset if it was previously highlighted (has defaultColor)
          line.material.color.copy(line.userData.defaultColor);
          // Optional: delete line.userData.defaultColor; to signify it's no longer highlighted
      }
  }

  /**
   * Cleans up resources for all managed lines.
   */
  dispose(): void {
    this.clearAll();
    // Any other specific cleanup for this manager
  }
} 