import { actions, getCelestialObjects } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  CustomEvents,
  SliderValueChangePayload,
} from "@teskooano/data-types";
import { Subscription, fromEvent } from "rxjs";
import { map, distinctUntilChanged, tap } from "rxjs/operators";

export class UniformControlUtils {
  // New helper method to safely get a value from a nested property path
  public static getValueFromPath(obj: any, path: string[]): any {
    if (!obj || !path || path.length === 0) {
      return undefined;
    }

    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  public static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => UniformControlUtils.deepClone(item)) as any;
    }
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = UniformControlUtils.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  public static updatePropertyPath(
    obj: any,
    path: string[],
    value: any,
  ): CelestialSpecificPropertiesUnion {
    if (!path || path.length === 0) {
      console.warn(
        "[UniformControlUtils] Empty property path provided to updatePropertyPath",
      );
      return obj;
    }

    const clonedObj = UniformControlUtils.deepClone(obj); // Clone the original object to avoid direct mutation
    let current = clonedObj;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      // Create the nested object structure if it doesn't exist
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      } else if (typeof current[key] !== "object") {
        // If current property exists but is not an object, convert it to an object
        // to maintain the path structure
        console.warn(
          `[UniformControlUtils] Converting non-object property '${key}' to object at path: ${path.slice(0, i + 1).join(".")}`,
        );
        current[key] = {};
      }
      current = current[key];
    }

    // Set the final property with the new value
    const finalKey = path[path.length - 1];
    current[finalKey] = value;

    console.log(
      `[UniformControlUtils] Updated property at path: ${path.join(".")} to value: ${value}`,
    );

    return clonedObj;
  }

  public static createNumericInput(
    labelText: string,
    celestialId: string,
    currentCelestialObject: CelestialObject, // Full object to get initial value from properties
    propertyPathToUniform: string[],
    options?: {
      min?: string;
      max?: string;
      step?: string;
      initialValue?: number;
    },
  ): { element: HTMLElement; subscription: Subscription } {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";

    const slider = document.createElement("teskooano-slider");
    slider.setAttribute("label", labelText);
    slider.setAttribute("min", options?.min ?? "-100");
    slider.setAttribute("max", options?.max ?? "100");
    slider.setAttribute("step", options?.step ?? "0.01");
    slider.setAttribute("editable-value", "");

    // Use the helper method to safely get the initial value
    let initialValue = UniformControlUtils.getValueFromPath(
      currentCelestialObject.properties,
      propertyPathToUniform,
    );

    // Fall back to provided initialValue if the path doesn't exist
    if (initialValue === undefined) {
      initialValue = options?.initialValue ?? 0;
      console.log(
        `[UniformControlUtils] Using default value ${initialValue} for ${labelText} at path ${propertyPathToUniform.join(".")}`,
      );
    } else {
      console.log(
        `[UniformControlUtils] Found existing value ${initialValue} for ${labelText} at path ${propertyPathToUniform.join(".")}`,
      );
    }

    const numericInitialValue = Number(initialValue);
    slider.setAttribute(
      "value",
      String(isNaN(numericInitialValue) ? 0 : numericInitialValue),
    );

    const subscription = fromEvent<CustomEvent<SliderValueChangePayload>>(
      slider,
      CustomEvents.SLIDER_CHANGE,
    )
      .pipe(
        map((event) => event.detail.value),
        distinctUntilChanged((prev, curr) => prev === curr && !isNaN(prev)),
        tap((newValue) => {
          console.log(
            `[UniformControlUtils] Numeric input changed for ${labelText} (${celestialId}). New value: ${newValue}. Attempting state update with path: ${propertyPathToUniform.join(".")}`,
          );

          // Ensure the value is properly converted to a number
          const numericValue = Number(newValue);

          if (isNaN(numericValue)) {
            console.warn(
              `[UniformControlUtils] Invalid numeric value received for ${labelText}: ${newValue}`,
            );
            return;
          }

          const latestCelestial = getCelestialObjects()[celestialId];
          if (latestCelestial && latestCelestial.properties) {
            const clonedProperties = UniformControlUtils.deepClone(
              latestCelestial.properties,
            );
            const updatedProperties = UniformControlUtils.updatePropertyPath(
              clonedProperties,
              propertyPathToUniform,
              numericValue, // Use the parsed numeric value
            );

            console.log(
              `[UniformControlUtils] Dispatching updateCelestialObject action for ${celestialId} with updated property at ${propertyPathToUniform.join(".")}`,
            );
            actions.updateCelestialObject(celestialId, {
              properties: updatedProperties,
            });
          } else {
            console.warn(
              `[UniformControlUtils] Could not find celestial object ${celestialId} or its properties for update.`,
            );
          }
        }),
      )
      .subscribe();

    wrapper.appendChild(slider);
    return { element: wrapper, subscription };
  }

  public static createColorInput(
    labelText: string,
    celestialId: string,
    currentCelestialObject: CelestialObject, // Full object
    propertyPathToUniform: string[],
    initialValue?: string,
  ): { element: HTMLElement; subscription: Subscription } {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "color";

    // Use the helper method to safely get the initial value
    let valueFromPath = UniformControlUtils.getValueFromPath(
      currentCelestialObject.properties,
      propertyPathToUniform,
    );

    // Fall back to provided initialValue if the path doesn't exist
    if (valueFromPath === undefined) {
      valueFromPath = initialValue ?? "#000000";
      console.log(
        `[UniformControlUtils] Using default color ${valueFromPath} for ${labelText} at path ${propertyPathToUniform.join(".")}`,
      );
    } else {
      console.log(
        `[UniformControlUtils] Found existing color ${valueFromPath} for ${labelText} at path ${propertyPathToUniform.join(".")}`,
      );
    }

    // Ensure it's a valid color format for HTML input (add # if missing)
    if (
      typeof valueFromPath === "string" &&
      !valueFromPath.startsWith("#") &&
      valueFromPath.match(/^[0-9A-Fa-f]{6}$/)
    ) {
      valueFromPath = "#" + valueFromPath;
    }

    input.value = String(valueFromPath);

    const subscription = fromEvent(input, "input") // Use 'input' for live updates on color pickers
      .pipe(
        map((event) => (event.target as HTMLInputElement).value),
        distinctUntilChanged(),
        tap((newColor) => {
          console.log(
            `[UniformControlUtils] Color input changed for ${labelText} (${celestialId}). New color: ${newColor}. Attempting state update with path: ${propertyPathToUniform.join(".")}`,
          );
          const latestCelestial = getCelestialObjects()[celestialId];
          if (latestCelestial && latestCelestial.properties) {
            const clonedProperties = UniformControlUtils.deepClone(
              latestCelestial.properties,
            );
            const updatedProperties = UniformControlUtils.updatePropertyPath(
              clonedProperties,
              propertyPathToUniform,
              newColor,
            );
            actions.updateCelestialObject(celestialId, {
              properties: updatedProperties,
            });
          } else {
            console.warn(
              `[UniformControlUtils] Could not find celestial object ${celestialId} or its properties for update.`,
            );
          }
        }),
      )
      .subscribe();

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return { element: wrapper, subscription };
  }
}
