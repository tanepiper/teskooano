import { CelestialObject, CelestialType } from "@teskooano/data-types";
import { AsteroidFieldInfoComponent } from "../bodies/AsteroidFieldInfo.js";
import { GasGiantInfoComponent } from "../bodies/GasGiantInfo.js";
import { GenericCelestialInfoComponent } from "../bodies/GenericCelestialInfo.js";
import { MoonInfoComponent } from "../bodies/MoonInfo.js";
import { OortCloudInfoComponent } from "../bodies/OortCloudInfo.js";
import { PlanetInfoComponent } from "../bodies/PlanetInfo.js";
import { StarInfoComponent } from "../bodies/StarInfo.js";
import type { CelestialInfoComponent } from "../utils/CelestialInfoInterface.js";

type ComponentConstructor = new () => CelestialInfoComponent;

/**
 * Manages the dynamic display of different celestial info components.
 * It handles lazy instantiation, caching, and DOM manipulation for showing
 * the correct info panel based on the celestial object's type.
 */
export class CelestialInfoViewManager {
  private _container: HTMLElement;
  private _placeholder: HTMLElement;
  private _componentMap: Map<CelestialType | "generic", ComponentConstructor> =
    new Map();
  private _componentCache: Map<ComponentConstructor, CelestialInfoComponent> =
    new Map();
  private _activeComponent: CelestialInfoComponent | null = null;

  constructor(container: HTMLElement, placeholder: HTMLElement) {
    this._container = container;
    this._placeholder = placeholder;
    this.registerComponents();
  }

  /**
   * Populates the map of celestial types to their corresponding
   * component constructors.
   */
  private registerComponents(): void {
    this._componentMap.set(CelestialType.STAR, StarInfoComponent);
    this._componentMap.set(CelestialType.PLANET, PlanetInfoComponent);
    this._componentMap.set(CelestialType.DWARF_PLANET, PlanetInfoComponent);
    this._componentMap.set(CelestialType.MOON, MoonInfoComponent);
    this._componentMap.set(CelestialType.GAS_GIANT, GasGiantInfoComponent);
    this._componentMap.set(
      CelestialType.ASTEROID_FIELD,
      AsteroidFieldInfoComponent,
    );
    this._componentMap.set(CelestialType.OORT_CLOUD, OortCloudInfoComponent);
    this._componentMap.set("generic", GenericCelestialInfoComponent);
  }

  /**
   * Shows a placeholder message in the panel.
   * @param message The text to display in the placeholder.
   */
  public showPlaceholder(message: string): void {
    if (this._activeComponent) {
      this._activeComponent.style.display = "none";
      this._activeComponent = null;
    }
    this._placeholder.style.display = "block";
    this._placeholder.textContent = message;
  }

  /**
   * Renders the information for a given celestial object.
   * It determines the correct component to use, lazy-instantiates it if
   * necessary, and updates it with the new data.
   * @param celestial The celestial object to display.
   */
  public renderInfo(celestial: CelestialObject): void {
    this._placeholder.style.display = "none";

    let componentType: CelestialType | "generic" = "generic";
    if (this._componentMap.has(celestial.type)) {
      componentType = celestial.type;
    }

    const constructor = this._componentMap.get(componentType);
    if (!constructor) {
      console.error(
        `[ViewManager] Could not find component for type: ${componentType}`,
      );
      this.showPlaceholder("Error displaying object info.");
      return;
    }

    const newActiveComponent = this.getOrCreateComponent(constructor);

    if (this._activeComponent !== newActiveComponent) {
      if (this._activeComponent) {
        this._activeComponent.style.display = "none";
      }
      newActiveComponent.style.display = "block";
      this._activeComponent = newActiveComponent;
    }

    this._activeComponent.updateData(celestial);
  }

  /**
   * Retrieves a component from the cache or creates a new one if it
   * doesn't exist.
   * @param constructor The component's constructor function.
   * @returns An instance of the requested component.
   */
  private getOrCreateComponent(
    constructor: ComponentConstructor,
  ): CelestialInfoComponent {
    if (!this._componentCache.has(constructor)) {
      const newInstance = new constructor();
      newInstance.style.display = "none";
      this._componentCache.set(constructor, newInstance);
      this._container.appendChild(newInstance);
    }
    return this._componentCache.get(constructor)!;
  }
}
