import {
  type CelestialObject,
  type CelestialSpecificPropertiesUnion,
  CustomEvents,
  type SliderValueChangePayload,
} from "@teskooano/data-types";
import { actions, StateAccessor } from "@teskooano/core-state";
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
    const newObj = this._deepClone(obj);
    let current = newObj;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof current[key] !== "object" || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[path[path.length - 1]] = value;
    return newObj;
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

    // If we're trying to access materialParams and it doesn't exist or is undefined, initialize it
    if (
      propertyPathToUniform[0] === "materialParams" &&
      currentCelestialObject.properties
    ) {
      const starProps = currentCelestialObject.properties as any;
      const materialParams = starProps.materialParams;

      // Check if materialParams is missing, undefined, or null
      if (!materialParams || typeof materialParams !== "object") {
        starProps.materialParams = {
          noiseScale: 0.5,
          noiseIntensity: 0.2,
          plasmaTurbulence: 0.1,
          lightingIntensity: 1.0,
        };
        // Update the object with the initialized materialParams
        actions.updateCelestialObject(currentCelestialObject.id, {
          properties: starProps,
        });
        // Re-read the value from the updated properties
        initialValueForInput =
          starProps.materialParams[propertyPathToUniform[1]];
      } else if (materialParams[propertyPathToUniform[1]] === undefined) {
        // If the specific material param is missing, initialize it with a default
        const defaultValues = {
          noiseScale: 0.5,
          noiseIntensity: 0.2,
          plasmaTurbulence: 0.1,
          lightingIntensity: 1.0,
        };
        materialParams[propertyPathToUniform[1]] =
          defaultValues[
            propertyPathToUniform[1] as keyof typeof defaultValues
          ] ?? 0;
        // Update the object with the initialized materialParams
        actions.updateCelestialObject(currentCelestialObject.id, {
          properties: starProps,
        });
        // Re-read the value from the updated properties
        initialValueForInput = materialParams[propertyPathToUniform[1]];
      }
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
          const latestCelestial = StateAccessor.getCelestialObject(celestialId);
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

    // If we're trying to access color properties and they don't exist, initialize them with sensible defaults
    if (
      propertyPathToUniform.length === 1 &&
      currentCelestialObject.properties
    ) {
      const starProps = currentCelestialObject.properties as any;
      const colorProperty = propertyPathToUniform[0];

      // Check if the color property is missing or undefined
      if (
        starProps[colorProperty] === undefined ||
        starProps[colorProperty] === null
      ) {
        // Set sensible defaults based on the color property
        if (colorProperty === "color") {
          // Main star color - use a warm yellow-white
          starProps[colorProperty] = "#FFF5E1";
        } else if (colorProperty === "hotColor") {
          // Hot color for plasma - use bright yellow-white
          starProps[colorProperty] = "#FFFF99";
        } else if (colorProperty === "surfaceColor") {
          // Surface color - use main color or warm white
          starProps[colorProperty] = starProps.color || "#FFF5E1";
        } else if (colorProperty === "coolColor") {
          // Cool color for sunspots - use darker orange-brown
          starProps[colorProperty] = "#CC7700";
        }

        // Update the object with the initialized color
        actions.updateCelestialObject(currentCelestialObject.id, {
          properties: starProps,
        });
        // Re-read the value from the updated properties
        initialValueForInput = starProps[colorProperty];
      }
    }

    input.value = String(initialValueForInput ?? "#000000");

    const subscription = fromEvent(input, "change")
      .pipe(
        map((event) => (event.target as HTMLInputElement).value),
        distinctUntilChanged(),
        tap((newColor) => {
          const latestCelestial = StateAccessor.getCelestialObject(celestialId);
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
