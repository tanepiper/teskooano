import { type OrbitalParameters, CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import { OrbitCalculator } from "./OrbitCalculator";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";

/**
 * Manages the creation, update, visibility, and highlighting of static Keplerian orbit lines.
 *
 * This class is responsible for maintaining and rendering the classic elliptical orbit paths
 * based on Keplerian orbital elements. It works with the ObjectManager to add/remove lines
 * from the scene and handles visual properties like highlighting and visibility.
 */
export class KeplerianManager {
  /** Map storing static Keplerian orbit lines, keyed by celestial object ID. */
  public lines: Map<string, THREE.Line> = new Map();

  /** Object manager for adding/removing objects from the scene */
  private objectManager: ObjectManager;

  /** Observable for renderable object updates */
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  /** Latest state of renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** Subscription to renderable objects updates */
  private objectsSubscription: Subscription | null = null;

  /** Line builder utility for efficient line creation and update */
  private lineBuilder: LineBuilder;

  /**
   * Creates an instance of KeplerianManager.
   *
   * @param objectManager - The scene's ObjectManager instance.
   * @param renderableObjects$ - An Observable emitting RenderableCelestialObject data.
   */
  constructor(
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ) {
    this.objectManager = objectManager;
    this.renderableObjects$ = renderableObjects$;
    this.lineBuilder = new LineBuilder();

    this.objectsSubscription = this.renderableObjects$.subscribe((objects) => {
      this.latestRenderableObjects = objects;
    });
  }

  /**
   * Creates or updates a static Keplerian orbit line for a given object.
   *
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
    highlightColor: THREE.Color,
  ): void {
    const existingLine = this.lines.get(objectId);
    const parentObject3D = this.objectManager.getObject(parentId);
    const allRenderableObjects = this.latestRenderableObjects;
    const parentState = allRenderableObjects[parentId];
    const objectState = allRenderableObjects[objectId];

    if (!parentObject3D || !parentState) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // Get parent position
    const parentWorldPosition = new THREE.Vector3();
    parentObject3D.getWorldPosition(parentWorldPosition);

    // Calculate orbit points
    const orbitPointsOS =
      OrbitCalculator.calculateOrbitPoints(orbitalParameters);
    const orbitPointsTHREE = orbitPointsOS.map((p) => p.toThreeJS());

    if (orbitPointsTHREE.length === 0) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // Choose the appropriate material based on type
    const isMoon = parentState.type !== CelestialType.STAR;
    const materialType = isMoon ? "KEPLERIAN_MOON" : "KEPLERIAN";

    if (existingLine) {
      // Update existing line
      this.lineBuilder.updateLine(
        existingLine,
        orbitPointsTHREE,
        orbitPointsTHREE.length,
      );
      existingLine.position.copy(parentWorldPosition);
      existingLine.visible = isVisible;

      this.applyHighlight(
        objectId,
        existingLine,
        highlightedObjectId,
        highlightColor,
      );
    } else {
      // Create new line
      const material = SharedMaterials.clone(materialType);

      const newLine = this.lineBuilder.createLine(
        orbitPointsTHREE.length,
        material,
        `orbit-line-${objectId}`,
      );

      // Update the line with the calculated points
      this.lineBuilder.updateLine(
        newLine,
        orbitPointsTHREE,
        orbitPointsTHREE.length,
      );

      newLine.position.copy(parentWorldPosition);
      newLine.visible = isVisible;
      newLine.frustumCulled = false;

      this.objectManager.addRawObjectToScene(newLine);
      this.lines.set(objectId, newLine);

      this.applyHighlight(
        objectId,
        newLine,
        highlightedObjectId,
        highlightColor,
      );
    }
  }

  /**
   * Removes a specific Keplerian orbit line from the scene and internal tracking.
   *
   * @param objectId - The ID of the object whose line should be removed.
   */
  remove(objectId: string): void {
    const line = this.lines.get(objectId);
    if (line) {
      this.objectManager.removeRawObjectFromScene(line);
      this.lineBuilder.disposeLine(line);
      this.lines.delete(objectId);
    }
  }

  /**
   * Removes all managed Keplerian lines.
   */
  clearAll(): void {
    this.lines.forEach((_, id) => this.remove(id));
    this.lines.clear();
  }

  /**
   * Sets the visibility of all managed Keplerian lines.
   *
   * @param visible - True to make lines visible, false to hide.
   */
  setVisibility(visible: boolean): void {
    this.lines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Applies or removes the highlight effect for a specific object's line.
   *
   * @param targetObjectId - The ID of the object to potentially highlight or unhighlight.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   */
  applyHighlightToObject(
    targetObjectId: string,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
  ): void {
    const line = this.lines.get(targetObjectId);
    if (line) {
      this.applyHighlight(
        targetObjectId,
        line,
        highlightedObjectId,
        highlightColor,
      );
    }
  }

  /**
   * Resets the highlight on a previously highlighted line if it's no longer the target.
   *
   * @param previouslyHighlightedId - The ID that was previously highlighted.
   * @param currentHighlightedId - The ID currently being highlighted (or null).
   */
  resetPreviousHighlight(
    previouslyHighlightedId: string,
    currentHighlightedId: string | null,
  ): void {
    if (
      previouslyHighlightedId &&
      previouslyHighlightedId !== currentHighlightedId
    ) {
      const previousLine = this.lines.get(previouslyHighlightedId);
      if (
        previousLine &&
        previousLine.material instanceof THREE.LineBasicMaterial &&
        previousLine.userData.defaultColor
      ) {
        previousLine.material.color.copy(previousLine.userData.defaultColor);
      }
    }
  }

  /**
   * Helper to apply highlight state to a single line.
   *
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
    highlightColor: THREE.Color,
  ): void {
    if (!(line.material instanceof THREE.LineBasicMaterial)) return;

    if (highlightedObjectId === lineObjectId) {
      if (!line.userData.defaultColor) {
        line.userData.defaultColor = line.material.color.clone();
      }
      line.material.color.copy(highlightColor);
    } else if (line.userData.defaultColor) {
      line.material.color.copy(line.userData.defaultColor);
    }
  }

  /**
   * Cleans up resources for all managed lines.
   */
  dispose(): void {
    this.clearAll();
    this.objectsSubscription?.unsubscribe();
    this.lineBuilder.clear();
  }
}
