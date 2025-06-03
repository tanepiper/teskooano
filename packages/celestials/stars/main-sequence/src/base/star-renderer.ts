import {
  BasicCelestialRenderer,
  CelestialObject,
  type BasicRendererOptions,
} from "@teskooano/celestial-object";
import * as THREE from "three";
import type {
  MainSequenceStarRendererOptions as CoreStarOptions, // Assuming this might be part of starSpecificProps or celestial.physicalProperties typing
  MainSequenceStar,
  StarPhysicalProperties, // Use alias for clarity
  StarShaderUniforms,
} from "../types/star.types";
import {
  getStarColor,
  type StarColorDeterminationProperties,
} from "../utils/star-color-utils";
import { CelestialCoronaMaterial } from "./corona-material";
import {
  MainSequenceStarMaterial,
  MainSequenceStarMaterials,
} from "./star-material";

/**
 * Options for the MainSequenceStarRenderer constructor.
 */
export interface MainSequenceStarRendererConstructorOptions
  extends Partial<CoreStarOptions> {
  /**
   * Optional explicit color override for the star.
   * If not provided, color will be determined from spectral class and temperature.
   */
  explicitStarColor?: string | number;
}

// Define star defaults (non-material/uniform related)
const DEFAULT_STAR_OPTIONS: Pick<
  CoreStarOptions,
  "coronaDistances" | "timeOffset" | "lodDistances" | "geometrySegments"
> = {
  coronaDistances: [1.15, 1.3],
  timeOffset: 0.0,
  lodDistances: { medium: 20, low: 50, billboard: 100 }, // Example defaults
  geometrySegments: {
    // Default segments, matching BasicCelestialRenderer
    high: { widthSegments: 64, heightSegments: 32 },
    medium: { widthSegments: 32, heightSegments: 16 },
    low: { widthSegments: 16, heightSegments: 8 },
  },
};

export class MainSequenceStarRenderer extends BasicCelestialRenderer {
  protected starOptions!: CoreStarOptions; // For storing conceptual things like coronaScales etc.

  private clock: THREE.Clock;
  protected materials!: MainSequenceStarMaterials;
  protected coronaMaterials: CelestialCoronaMaterial[] = [];
  protected starProperties: StarPhysicalProperties;

  /**
   * The base color of the star as a hex value
   * This is made protected so derived classes can access it
   */
  protected baseColor: number;

  constructor(
    celestial: CelestialObject,
    constructorOptions: MainSequenceStarRendererConstructorOptions = {},
  ) {
    // Ensure we're working with a celestial object that has star properties
    if (!isMainSequenceStar(celestial)) {
      throw new Error(
        "MainSequenceStarRenderer requires a celestial object with StarPhysicalProperties",
      );
    }

    // Extract renderer options from constructor
    const { explicitStarColor, ...directOptionsFromConstructor } =
      constructorOptions;

    // Get star physical properties (store locally first to avoid using 'this' before super())
    const starProps = celestial.physicalProperties as StarPhysicalProperties;

    // Step 1: Merge star options (these don't use 'this')
    const localStarOptions: CoreStarOptions = {
      ...DEFAULT_STAR_OPTIONS,
      lodDistances: {
        ...DEFAULT_STAR_OPTIONS.lodDistances,
        ...directOptionsFromConstructor.lodDistances,
      },
      geometrySegments: {
        ...DEFAULT_STAR_OPTIONS.geometrySegments,
        ...directOptionsFromConstructor.geometrySegments,
      },
      billboardConfig: directOptionsFromConstructor.billboardConfig,
      billboardGenerator: directOptionsFromConstructor.billboardGenerator,
      // coronaScales is required in the interface, but we provide a default if not specified
      coronaDistances:
        directOptionsFromConstructor.coronaDistances ||
        DEFAULT_STAR_OPTIONS.coronaDistances,
      timeOffset:
        directOptionsFromConstructor.timeOffset ??
        DEFAULT_STAR_OPTIONS.timeOffset,
      uniforms: directOptionsFromConstructor.uniforms, // Carry over any user-provided partial uniforms for merging later
    } as CoreStarOptions;

    // Step 2: Get the star color from properties
    const colorProps: StarColorDeterminationProperties = {
      color: explicitStarColor,
      spectralClass: starProps.spectralClass,
      temperature_k: starProps.temperature_k || 5778, // Default to Sun temperature if not specified
    };
    const derivedStarColor = getStarColor(colorProps);
    const derivedHexColor = derivedStarColor.getHex();

    // Step 3: Prepare options for BasicCelestialRenderer super constructor
    const baseSuperOptions: BasicRendererOptions<Partial<StarShaderUniforms>> =
      {
        lodDistances: localStarOptions.lodDistances,
        geometrySegments: localStarOptions.geometrySegments,
        billboardConfig: localStarOptions.billboardConfig,
        billboardGenerator: localStarOptions.billboardGenerator,
        uniforms: localStarOptions.uniforms, // Pass the uniforms for potential billboard use
      };

    // Step 4: Call super() FIRST before using 'this'
    super(
      celestial,
      celestial.physicalProperties.radius,
      derivedHexColor,
      baseSuperOptions,
    );

    // Step 5: Now assign to 'this' properties after super() call
    this.starProperties = starProps;
    this.starOptions = localStarOptions;
    this.clock = new THREE.Clock();
    this.baseColor = derivedHexColor;

    // Step 6: Create materials using our material factory
    this.createStarMaterials(derivedStarColor);
  }

  /**
   * Creates the star materials using the MainSequenceStarMaterial factory
   */
  protected createStarMaterials(starColor: THREE.Color): void {
    // Create the body material
    this.materials = MainSequenceStarMaterial.createMaterials({
      starColor,
      timeOffset: this.starOptions.timeOffset,
      customUniforms: this.starOptions.uniforms,
    });

    // Apply luminosity-based adjustments based on star's physical properties
    if (this.starProperties.luminosity_Watts) {
      // Convert Watts to solar luminosities (Lsun)
      const luminosity_Lsun = this.starProperties.luminosity_Watts / 3.828e26;
      this.adjustUniformsForLuminosity(
        this.materials.uniforms,
        luminosity_Lsun,
      );
    }

    // Create corona materials - all main sequence stars have coronas
    this.createCoronaMaterials(starColor);
  }

  /**
   * Creates corona materials for different LOD levels
   * This method is protected instead of private to allow derived classes to override it
   */
  protected createCoronaMaterials(starColor: THREE.Color): void {
    this.coronaMaterials = [];

    // Create a separate corona material for each scale factor
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Create base material with diminishing opacity for outer layers
      const opacityMultiplier = i === 0 ? 0.7 : 0.5 * (1 - i * 0.2);

      // Create the corona material - use standard for now
      const coronaMaterial = new CelestialCoronaMaterial({
        starColor,
        timeOffset: this.starOptions.timeOffset,
        customUniforms: this.starOptions.uniforms,
        opacityMultiplier,
      });

      this.coronaMaterials.push(coronaMaterial);
    }
  }

  /**
   * Rebuild all LOD groups with the current materials
   * This is useful when materials have been changed and the meshes need to be updated
   */
  protected rebuildLODGroups(): void {
    // Remove existing LOD groups if the LOD object exists
    if (this.lod) {
      // Remove all children from the LOD object
      while (this.lod.children.length > 0) {
        const child = this.lod.children[0];
        this.lod.remove(child);
      }

      // Recreate the LOD levels
      this.createLODs(this.celestial.physicalProperties.radius, this.baseColor);
    }
  }

  /**
   * Adjust material uniforms based on star luminosity
   */
  private adjustUniformsForLuminosity(
    uniforms: StarShaderUniforms,
    luminosity_Lsun: number,
  ): void {
    if (uniforms.uGlowIntensity && uniforms.uCoronaIntensity) {
      let glowIntensity = uniforms.uGlowIntensity.value;
      let coronaIntensity = uniforms.uCoronaIntensity.value;

      if (luminosity_Lsun > 10) {
        glowIntensity = Math.min(
          2.0,
          glowIntensity * (1 + Math.log10(luminosity_Lsun / 10)),
        );
        coronaIntensity = Math.min(
          1.5,
          coronaIntensity * (1 + Math.log10(luminosity_Lsun / 10)),
        );
      } else if (luminosity_Lsun < 0.1 && luminosity_Lsun > 0) {
        glowIntensity = Math.max(
          0.3,
          glowIntensity * (1 - Math.log10(1 / (luminosity_Lsun * 10)) * 0.5),
        );
        coronaIntensity = Math.max(
          0.3,
          coronaIntensity * (1 - Math.log10(1 / (luminosity_Lsun * 10)) * 0.5),
        );
      }

      uniforms.uGlowIntensity.value = glowIntensity;
      uniforms.uCoronaIntensity.value = coronaIntensity;

      // Also adjust corona opacity based on luminosity
      for (const coronaMaterial of this.coronaMaterials) {
        if (coronaMaterial.uniforms.uOpacity) {
          const baseOpacity = coronaMaterial.uniforms.uOpacity.value;
          const adjustedOpacity =
            luminosity_Lsun > 1
              ? Math.min(
                  1.0,
                  baseOpacity * (1 + Math.log10(luminosity_Lsun) * 0.3),
                )
              : baseOpacity;

          coronaMaterial.setOpacity(adjustedOpacity);
        }
      }
    }
  }

  protected override createHighDetailGroupLOD(radius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `${this.celestial.id}-lod0-high`;
    const segments =
      this.starOptions.geometrySegments?.high?.widthSegments ?? 64;
    const geometry = new THREE.SphereGeometry(
      radius,
      segments,
      this.starOptions.geometrySegments?.high?.heightSegments ?? segments,
    );
    const mesh = new THREE.Mesh(geometry, this.materials.bodyMaterial);
    mesh.name = `${this.celestial.id}-body`;
    group.add(mesh);

    // Add corona layers for high detail level
    this.starOptions.coronaDistances.forEach((scaleFactor, index) => {
      if (this.coronaMaterials[index]) {
        const coronaGeometry = new THREE.SphereGeometry(
          radius * scaleFactor,
          segments,
          this.starOptions.geometrySegments?.high?.heightSegments ?? segments,
        );
        const coronaMesh = new THREE.Mesh(
          coronaGeometry,
          this.coronaMaterials[index],
        );
        coronaMesh.name = `${this.celestial.id}-corona-${index}`;
        group.add(coronaMesh);
      }
    });

    return group;
  }

  protected override createMediumDetailGroupLOD(radius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `${this.celestial.id}-lod1-medium`;
    const segments =
      this.starOptions.geometrySegments?.medium?.widthSegments ?? 32;
    const geometry = new THREE.SphereGeometry(
      radius,
      segments,
      this.starOptions.geometrySegments?.medium?.heightSegments ?? segments,
    );
    const mesh = new THREE.Mesh(geometry, this.materials.bodyMaterial);
    mesh.name = `${this.celestial.id}-body-medium`;
    group.add(mesh);

    // Add single corona layer for medium detail level
    if (
      this.starOptions.coronaDistances.length > 0 &&
      this.coronaMaterials[0]
    ) {
      const coronaGeometry = new THREE.SphereGeometry(
        radius * this.starOptions.coronaDistances[0],
        segments,
        this.starOptions.geometrySegments?.medium?.heightSegments ?? segments,
      );
      const coronaMesh = new THREE.Mesh(
        coronaGeometry,
        this.coronaMaterials[0],
      );
      coronaMesh.name = `${this.celestial.id}-corona-medium-0`;
      group.add(coronaMesh);
    }

    return group;
  }

  protected override createLowDetailGroupLOD(radius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `${this.celestial.id}-lod2-low`;
    const segments =
      this.starOptions.geometrySegments?.low?.widthSegments ?? 16;
    const geometry = new THREE.SphereGeometry(
      radius,
      segments,
      this.starOptions.geometrySegments?.low?.heightSegments ?? segments,
    );
    const mesh = new THREE.Mesh(geometry, this.materials.bodyMaterial);
    mesh.name = `${this.celestial.id}-body-low`;
    group.add(mesh);

    // Add minimal corona effect for low detail level
    // For very distant stars, we might skip the corona to improve performance
    if (
      this.starOptions.coronaDistances.length > 0 &&
      this.coronaMaterials[0]
    ) {
      const coronaGeometry = new THREE.SphereGeometry(
        radius * this.starOptions.coronaDistances[0],
        segments / 2,
        this.starOptions.geometrySegments?.low?.heightSegments ?? segments / 2,
      );
      const coronaMesh = new THREE.Mesh(
        coronaGeometry,
        this.coronaMaterials[0],
      );
      coronaMesh.name = `${this.celestial.id}-corona-low`;
      group.add(coronaMesh);
    }

    return group;
  }

  public override update(camera?: THREE.Camera): void {
    super.update();
    const elapsedTime =
      this.clock.getElapsedTime() + (this.starOptions.timeOffset || 0);

    // Update time using the material's update method
    this.materials.update(elapsedTime);

    // Update corona materials with the current time
    for (const coronaMaterial of this.coronaMaterials) {
      coronaMaterial.updateTime(elapsedTime);
    }

    if (camera && this.materials.bodyMaterial.uniforms.cameraPosition) {
      this.materials.bodyMaterial.uniforms.cameraPosition.value.copy(
        camera.position,
      );
    }
  }

  public override dispose(): void {
    super.dispose();
    this.materials.dispose();

    // Dispose corona materials
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];
  }
}

/**
 * Type guard to check if a celestial object has star physical properties
 */
function isMainSequenceStar(
  celestial: CelestialObject,
): celestial is MainSequenceStar {
  const props = celestial.physicalProperties as StarPhysicalProperties;
  return (
    props &&
    typeof props.spectralClass === "string" &&
    typeof props.luminosity_Watts === "number" &&
    typeof props.stellarMass_kg === "number"
  );
}
