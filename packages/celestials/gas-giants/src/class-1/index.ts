import {
  BasicRendererOptions,
  CelestialObject,
  CelestialObjectConstructorParams,
} from "@teskooano/celestial-object";
import { GasGiantClass1Renderer } from "./renderer"; // Import the specific renderer

export interface Class1GasGiantProperties {
  // Define any specific properties for Class 1 Gas Giants here in the future
  // For example: dominantGases?: string[]; magneticFieldStrength?: number;
}

// Combine constructor params with specific properties for type safety if needed
export type Class1GasGiantConstructorParams = CelestialObjectConstructorParams &
  Partial<Class1GasGiantProperties>; // Make specific props optional for now

/**
 * Represents a Class 1 Gas Giant celestial object.
 * Extends the base CelestialObject and uses its own GasGiantClass1Renderer by default,
 * unless a rendererInstance is explicitly provided in the constructor parameters.
 */
export class Class1GasGiant extends CelestialObject {
  /**
   * Creates an instance of a Class 1 Gas Giant.
   * @param params - The constructor parameters. The rendererInstance, if provided, should be of type CelestialRenderer.
   */
  constructor(params: Class1GasGiantConstructorParams) {
    // Ensure physicalProperties is provided for the super constructor
    if (
      !params.physicalProperties ||
      params.physicalProperties.radius === undefined
    ) {
      throw new Error(
        "Class1GasGiant requires physicalProperties with at least a radius.",
      );
    }

    // Default albedo for a Class 1 Gas Giant if not provided
    if (params.physicalProperties.albedo === undefined) {
      params.physicalProperties.albedo = 0.55; // Typical albedo for Jupiter
    }

    super(params); // Base class constructor is called first.
    // It will set this.renderer to params.rendererInstance or BasicCelestialRenderer.

    // If no specific renderer was injected through params, use the specialized GasGiantClass1Renderer.
    if (params.rendererInstance === undefined) {
      // Dispose of the BasicCelestialRenderer that super() might have created if we are replacing it.
      if (this.renderer && typeof this.renderer.dispose === "function") {
        this.renderer.dispose();
      }

      // Configure renderer options for the GasGiantClass1Renderer
      const rendererOptions: BasicRendererOptions = {
        lodDistances: {
          // Example: distances scaled by the actual physical radius of the gas giant
          // These factors might need tuning based on visual appearance and performance.
          medium: params.physicalProperties.radius * 10,
          low: params.physicalProperties.radius * 50,
          billboard: params.physicalProperties.radius * 200,
        },
        billboardConfig: {
          visuals: {
            // Class 1 Gas Giants might have a slightly dimmer or different colored billboard
            // compared to a star by default. Let's give it a subtle color and moderate opacity.
            color: 0xccaabb, // A muted brownish-pink, can be adjusted
            opacity: 0.85,
            // size: can be left to default calculation based on radius, or set explicitly
          },
          light: {
            // The light intensity will be influenced by albedo (set above) if not specified here.
            // We can still override it for a specific aesthetic for gas giants.
            intensity: 1.5, // Relatively dim, as it's mostly reflected light
            decay: 2.0,
          },
        },
        // To use a DefaultBillboard with different *internal* defaults (e.g. different texture logic),
        // you could instantiate it here:
        // billboardGenerator: new DefaultBillboard({ defaultOpacity: 0.7, ...etc... }),
        // Otherwise, BasicCelestialRenderer will use its own new DefaultBillboard()
      };

      this.renderer = new GasGiantClass1Renderer(this, rendererOptions);
    }
    // If params.rendererInstance was provided, super() has already set it, and we respect that.
  }

  /**
   * Updates the physics state of the Class 1 Gas Giant.
   * This is where specific physics calculations for this celestial type would go.
   * For example, interacting with its moons, atmospheric dynamics, etc.
   * @param deltaTime - The time elapsed, in seconds, since the last physics update.
   */
  public updatePhysics(deltaTime: number): void {
    // Placeholder for Class 1 Gas Giant specific physics
    // console.log(`Updating physics for Class1GasGiant ${this.name}: ${deltaTime}s`);

    // Example: Apply some generic force or update orbital position based on deltaTime
    // This would typically involve calls to your physics engine services

    // After updating physicsState, notify observers about the state change.
    this._updateObservableState();
  }

  // Potentially override other methods or add new ones specific to Class 1 Gas Giants
  // For example, a method to get specific atmospheric data if that becomes a property.
}

// Example of how to instantiate (assuming necessary data is available):
// const jupiterParams: CelestialObjectConstructorParams = {
//   id: 'jupiter',
//   name: 'Jupiter',
//   status: CelestialStatus.ACTIVE,
//   orbit: {
//     semiMajorAxis_m: 778.57e9, // meters
//     eccentricity: 0.0489,
//     inclination: 0.02268928, // radians (1.3 degrees)
//     longitudeOfAscendingNode: 1.75492247, // radians (100.556 degrees)
//     argumentOfPeriapsis: 4.83644898, // radians (277.12 degrees)
//     meanAnomaly: 0.32190526, // radians (at a specific epoch)
//     period_s: 374335776 // seconds (approx 11.86 years)
//   },
//   physicsState: {
//     id: 'jupiter',
//     mass_kg: 1.898e27, // kg
//     position_m: { x: 0, y: 0, z: 0 }, // Will be calculated by physics engine
//     velocity_mps: { x: 0, y: 0, z: 0 } // Will be calculated by physics engine
//   }
//   // rendererInstance can be omitted to use BasicCelestialRenderer
// };
//
// const jupiter = new Class1GasGiant(jupiterParams);
//
// jupiter.state$.subscribe(state => {
//   console.log('Jupiter state changed:', state);
// });
//
// jupiter.updatePhysics(0.016); // Simulate a time step
