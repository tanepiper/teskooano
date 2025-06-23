import type { IOrbitVisualizationStrategy } from "./IOrbitVisualizationStrategy";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { KeplerianManager } from "../../keplerian/KeplerianManager";
import * as THREE from "three";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { Observable } from "rxjs";

export class KeplerianStrategy implements IOrbitVisualizationStrategy {
  private keplerianManager: KeplerianManager;
  private highlightedObjectId: string | null = null;
  private isVisible: boolean = true;
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  constructor(
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ) {
    this.keplerianManager = new KeplerianManager(
      objectManager,
      renderableObjects$,
    );
  }

  update(objects: Record<string, RenderableCelestialObject>): void {
    Object.values(objects).forEach((obj) => {
      if (obj.orbit && obj.parentId) {
        this.keplerianManager.createOrUpdate(
          obj.celestialObjectId,
          obj.orbit,
          obj.parentId,
          this.isVisible,
          this.highlightedObjectId,
          this.highlightColor,
        );
      } else if (this.keplerianManager.lines.has(obj.celestialObjectId)) {
        this.keplerianManager.remove(obj.celestialObjectId);
      }
    });
  }

  highlight(objectId: string | null, color: THREE.Color): void {
    const previouslyHighlightedId = this.highlightedObjectId;
    this.highlightedObjectId = objectId;
    this.highlightColor = color;

    if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        objectId,
      );
    }

    if (objectId) {
      this.keplerianManager.applyHighlightToObject(objectId, objectId, color);
    } else if (previouslyHighlightedId) {
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        null,
      );
    }
  }

  setVisibility(visible: boolean): void {
    this.isVisible = visible;
    this.keplerianManager.setVisibility(visible);
  }

  dispose(): void {
    this.keplerianManager.dispose();
  }
}
