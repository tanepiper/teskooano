import type { CelestialObject } from "@teskooano/data-types";
import type { Subscription } from "rxjs";
import { BaseUniformsRenderer } from "./BaseUniformsRenderer";

/**
 * Renders UI controls for Star celestial objects.
 */
export class StarUniformsRenderer extends BaseUniformsRenderer {
  public render(
    container: HTMLElement,
    celestial: CelestialObject,
  ): Subscription[] {
    const subscriptions: Subscription[] = [];

    const { element, subscription } = this._createColorInput(
      "Star Color:",
      celestial.id,
      celestial,
      ["color"],
    );
    container.appendChild(element);
    subscriptions.push(subscription);

    return subscriptions;
  }
}
