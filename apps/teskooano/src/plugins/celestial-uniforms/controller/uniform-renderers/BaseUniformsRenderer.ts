import {
  type CelestialObject,
  type CelestialSpecificPropertiesUnion,
  CustomEvents,
  type SliderValueChangePayload,
} from "@teskooano/data-types";
import { actions, getCelestialObjects } from "@teskooano/core-state";
import { Subscription, fromEvent } from "rxjs";
import { map, distinctUntilChanged, tap } from "rxjs/operators";

/**
 * Abstract base class for rendering uniform controls for a specific celestial type.
 * Provides common helper methods for creating UI elements and handling state updates.
 */
export abstract class BaseUniformsRenderer {
  /**
   * Renders the specific UI controls for a celestial object into a container.
   * @param container The HTMLElement to render the controls into.
   * @param celestial The celestial object to generate controls for.
   * @returns An array of RxJS subscriptions for the created controls.
   */
  public abstract render(
    container: HTMLElement,
    celestial: CelestialObject,
  ): Subscription[];

  /**
   * Deep clones an object.
   */
  protected _deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this._deepClone(item)) as any;
    }
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = this._deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  /**
   * Updates a property at a given path within an object.
   */
  protected _updatePropertyPath(
    obj: any,
    path: string[],
    value: any,
  ): CelestialSpecificPropertiesUnion {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof current[key] !== "object" || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
    return obj;
  }

  /**
   * Creates a numeric slider input control.
   */
  protected _createNumericInput(
    labelText: string,
    celestialId: string,
    currentCelestialObject: CelestialObject,
    propertyPathToUniform: string[],
    options: { min?: number; max?: number; step?: number } = {},
  ): { element: HTMLElement; subscription: Subscription } {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";

    const slider = document.createElement("teskooano-slider");
    slider.setAttribute("label", labelText);
    slider.setAttribute("min", options.min?.toString() ?? "-100");
    slider.setAttribute("max", options.max?.toString() ?? "100");
    slider.setAttribute("step", options.step?.toString() ?? "0.01");
    slider.setAttribute("editable-value", "");

    let initialValueForInput: any = currentCelestialObject.properties;
    try {
      for (const key of propertyPathToUniform) {
        initialValueForInput = initialValueForInput[key];
      }
    } catch (e) {
      console.warn(
        `Could not resolve path ${propertyPathToUniform.join(".")} for ${labelText}. Defaulting to 0.`,
      );
      initialValueForInput = 0;
    }
    const numericInitialValue = Number(initialValueForInput ?? 0);
    slider.setAttribute("value", String(numericInitialValue));

    const subscription = fromEvent<CustomEvent<SliderValueChangePayload>>(
      slider,
      CustomEvents.SLIDER_CHANGE,
    )
      .pipe(
        map((event) => event.detail.value),
        distinctUntilChanged((prev, curr) => prev === curr && !isNaN(prev)),
        tap((newValue) => {
          const latestCelestial = getCelestialObjects()[celestialId];
          if (latestCelestial && latestCelestial.properties) {
            const clonedProperties = this._deepClone(
              latestCelestial.properties,
            );
            const updatedProperties = this._updatePropertyPath(
              clonedProperties,
              propertyPathToUniform,
              newValue,
            );
            actions.updateCelestialObject(celestialId, {
              properties: updatedProperties,
            });
          }
        }),
      )
      .subscribe();

    wrapper.appendChild(slider);
    return { element: wrapper, subscription };
  }

  /**
   * Creates a color picker input control.
   */
  protected _createColorInput(
    labelText: string,
    celestialId: string,
    currentCelestialObject: CelestialObject,
    propertyPathToUniform: string[],
  ): { element: HTMLElement; subscription: Subscription } {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "color";

    let initialValueForInput: any = currentCelestialObject.properties;
    try {
      for (const key of propertyPathToUniform) {
        initialValueForInput = initialValueForInput[key];
      }
    } catch (e) {
      console.warn(
        `Could not resolve path ${propertyPathToUniform.join(".")} for ${labelText}. Defaulting to #000000.`,
      );
      initialValueForInput = "#000000";
    }
    input.value = String(initialValueForInput ?? "#000000");

    const subscription = fromEvent(input, "change")
      .pipe(
        map((event) => (event.target as HTMLInputElement).value),
        distinctUntilChanged(),
        tap((newColor) => {
          const latestCelestial = getCelestialObjects()[celestialId];
          if (latestCelestial && latestCelestial.properties) {
            const clonedProperties = this._deepClone(
              latestCelestial.properties,
            );
            const updatedProperties = this._updatePropertyPath(
              clonedProperties,
              propertyPathToUniform,
              newColor,
            );
            actions.updateCelestialObject(celestialId, {
              properties: updatedProperties,
            });
          }
        }),
      )
      .subscribe();

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return { element: wrapper, subscription };
  }
}
