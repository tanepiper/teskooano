import {
  CelestialObject,
  CelestialType,
  CelestialTypes,
} from "@teskooano/celestial-object";
import { BehaviorSubject, Observable } from "rxjs";
import {
  MainSequenceStar,
  MainSequenceStarConstructorParams,
  StarPhysicalProperties,
} from "../types/star.types";
import {
  MainSequenceStarRenderer,
  MainSequenceStarRendererConstructorOptions,
} from "./star-renderer";

/**
 * Abstract base class for all main sequence stars in the simulation.
 * This class provides common functionality shared by all spectral types (O, B, A, F, G, K, M).
 *
 * MainSequenceStarCelestial implements IMainSequenceStar and provides:
 * - Proper typing for star-specific physical properties
 * - Standard behaviors for all main sequence stars
 * - Spectral class tracking
 * - Default main sequence star renderer setup
 */
export abstract class MainSequenceStarCelestial
  extends CelestialObject
  implements MainSequenceStar
{
  /** The type of this celestial object, fixed to MAIN_SEQUENCE_STAR. */
  public readonly type: CelestialType =
    CelestialTypes.MAIN_SEQUENCE_STAR as CelestialType;

  /** The spectral class of the star (e.g., "G2V") */
  public spectralClass: string;

  /** Physical properties specific to stars */
  public override physicalProperties: StarPhysicalProperties;

  /** Subject for emitting spectral class changes */
  private _spectralClassSubject: BehaviorSubject<string>;

  /**
   * Observable stream of spectral class changes
   */
  public readonly spectralClass$: Observable<string>;

  /**
   * Constructor for MainSequenceStarCelestial
   * @param params - The construction parameters for the star
   */
  constructor(params: MainSequenceStarConstructorParams) {
    // Validate that we have StarPhysicalProperties
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error(
        "MainSequenceStarCelestial requires StarPhysicalProperties",
      );
    }

    super({
      ...params,
      type: CelestialTypes.MAIN_SEQUENCE_STAR as CelestialType,
    });

    // Store reference to star-specific physical properties
    this.physicalProperties = params.physicalProperties;

    // Initialize spectral class from physical properties
    this.spectralClass = this.physicalProperties.spectralClass;
    this._spectralClassSubject = new BehaviorSubject<string>(
      this.spectralClass,
    );
    this.spectralClass$ = this._spectralClassSubject.asObservable();

    // If a renderer wasn't provided, create a default MainSequenceStarRenderer
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      this.setupDefaultRenderer();
    }
  }

  /**
   * Updates the physics of the main sequence star.
   * @param deltaTime - The time step for the physics update (in seconds).
   */
  public updatePhysics(deltaTime: number): void {
    // Base implementation - derived classes can extend this
    this._updateObservableState();
  }

  /**
   * Sets up a default renderer for the star if one wasn't provided
   */
  protected setupDefaultRenderer(): void {
    // The renderer will extract properties directly from this celestial object
    // No need to manually pass star-specific properties anymore
    const rendererOptions: MainSequenceStarRendererConstructorOptions = {
      // Default options for main sequence stars
      timeOffset: Math.random() * 1000, // Random offset for variation between stars
    };

    // Create the renderer - it will extract physical properties from this celestial
    this.renderer = new MainSequenceStarRenderer(this, rendererOptions);
  }

  /**
   * Updates the spectral class and notifies observers
   * @param newSpectralClass - The new spectral class
   */
  public setSpectralClass(newSpectralClass: string): void {
    if (this.spectralClass !== newSpectralClass) {
      this.spectralClass = newSpectralClass;
      this.physicalProperties.spectralClass = newSpectralClass;
      this._spectralClassSubject.next(newSpectralClass);
      this._updateObservableState();
    }
  }

  /**
   * Calculate and update the habitable zone for this star
   * @returns The updated habitable zone range in AU
   */
  public calculateHabitableZone(): { min: number; max: number } {
    // Simple approximation based on stellar luminosity in solar units
    const luminosityFactor = Math.sqrt(
      this.physicalProperties.luminosity_Watts / 3.828e26,
    );

    const habitableZoneMin = 0.75 * luminosityFactor; // Inner edge
    const habitableZoneMax = 1.8 * luminosityFactor; // Outer edge

    // Update the physical properties
    this.physicalProperties.habitableZoneMin_AU = habitableZoneMin;
    this.physicalProperties.habitableZoneMax_AU = habitableZoneMax;

    this._updateObservableState();

    return { min: habitableZoneMin, max: habitableZoneMax };
  }

  /**
   * Retrieves data about the star's habitable zone
   * @returns Information about the habitable zone
   */
  public getHabitableZoneInfo(): {
    inner: number;
    outer: number;
    width: number;
    centerDistance: number;
  } {
    // Make sure habitable zone is calculated
    if (
      !this.physicalProperties.habitableZoneMin_AU ||
      !this.physicalProperties.habitableZoneMax_AU
    ) {
      this.calculateHabitableZone();
    }

    const inner = this.physicalProperties.habitableZoneMin_AU!;
    const outer = this.physicalProperties.habitableZoneMax_AU!;

    return {
      inner,
      outer,
      width: outer - inner,
      centerDistance: (inner + outer) / 2,
    };
  }

  /**
   * Dispose of resources
   */
  public override dispose(): void {
    this._spectralClassSubject.complete();
    super.dispose();
  }
}

/**
 * Type guard to check if physical properties are StarPhysicalProperties
 */
function isStarPhysicalProperties(props: any): props is StarPhysicalProperties {
  return (
    props &&
    typeof props.spectralClass === "string" &&
    typeof props.luminosity_Watts === "number" &&
    typeof props.stellarMass_kg === "number"
  );
}
