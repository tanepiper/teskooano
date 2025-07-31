import * as THREE from "three";
import type {
  RenderableCelestialObject,
  StarProperties,
} from "@teskooano/data-types";
import { MainSequenceStarRenderer } from "./main-sequence-star";
import {
  BaseCelestialRendererOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { EnhancedStarMaterial } from "../materials/enhanced-star.material";
import { utils } from "@teskooano/core-math";

/**
 * Spectral data for G-class main sequence stars
 */
interface GClassSpectralData {
  mass: number; // Solar masses
  radius: number; // Solar radii
  luminosity: number; // Solar luminosities
  temperature: number; // Effective temperature in K
  colorIndex: number; // B-V color index
}

/**
 * G-class spectral classifications with physical properties
 * Data source: Standard stellar classification tables
 */
const G_CLASS_DATA: Record<number, GClassSpectralData> = {
  0: {
    mass: 1.06,
    radius: 1.1,
    luminosity: 1.35,
    temperature: 5930,
    colorIndex: 0.6,
  },
  1: {
    mass: 1.03,
    radius: 1.06,
    luminosity: 1.2,
    temperature: 5860,
    colorIndex: 0.62,
  },
  2: {
    mass: 1.0,
    radius: 1.012,
    luminosity: 1.02,
    temperature: 5770,
    colorIndex: 0.65,
  }, // Our Sun
  3: {
    mass: 0.99,
    radius: 1.002,
    luminosity: 0.98,
    temperature: 5720,
    colorIndex: 0.66,
  },
  4: {
    mass: 0.985,
    radius: 0.991,
    luminosity: 0.91,
    temperature: 5680,
    colorIndex: 0.67,
  },
  5: {
    mass: 0.98,
    radius: 0.977,
    luminosity: 0.89,
    temperature: 5660,
    colorIndex: 0.68,
  },
  6: {
    mass: 0.97,
    radius: 0.949,
    luminosity: 0.79,
    temperature: 5600,
    colorIndex: 0.7,
  },
  7: {
    mass: 0.95,
    radius: 0.927,
    luminosity: 0.74,
    temperature: 5550,
    colorIndex: 0.71,
  },
  8: {
    mass: 0.94,
    radius: 0.914,
    luminosity: 0.68,
    temperature: 5480,
    colorIndex: 0.73,
  },
  9: {
    mass: 0.9,
    radius: 0.853,
    luminosity: 0.55,
    temperature: 5380,
    colorIndex: 0.78,
  },
};

/**
 * Convert B-V color index to RGB color
 * Based on empirical stellar color tables
 */
function colorIndexToRGB(bv: number): THREE.Color {
  // Clamp B-V to reasonable range for G-class stars
  const clampedBV = Math.max(0.55, Math.min(0.85, bv));

  // Empirical conversion from B-V to RGB (normalized to [0,1])
  // These values are based on stellar photometry data
  let r, g, b;

  if (clampedBV < 0.65) {
    // G0V-G2V: More blue-white to yellow-white
    r = 1.0;
    g = 0.94 + (0.65 - clampedBV) * 0.12; // Slightly more blue for cooler B-V
    b = 0.72 + (0.65 - clampedBV) * 0.28;
  } else {
    // G3V-G9V: Yellow to orange-yellow
    r = 1.0;
    g = 0.94 - (clampedBV - 0.65) * 0.35; // Less green as B-V increases
    b = 0.72 - (clampedBV - 0.65) * 0.55; // Much less blue as B-V increases
  }

  return new THREE.Color(r, g, b);
}

/**
 * Generate hot, surface, and cool colors based on main color and temperature
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (increase temperature effect)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.2)
    .lerp(new THREE.Color(1.0, 1.0, 0.9), 0.3);

  // Surface color (the base spectral color)
  const surfaceColor = baseColor.clone();

  // Cool areas (lower temperature, more orange/red)
  const tempFactor = Math.max(0.3, Math.min(1.0, (temperature - 5300) / 700)); // Normalize to G-class range
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.7)
    .lerp(new THREE.Color(0.8, 0.4, 0.1), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for G-class stars with spectral class support
 * Supports G0V through G9V with accurate colors and properties
 */
export class ClassGStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass from spectralClass (e.g., "G2V" -> 2)
    let subclass = 2; // Default to G2V (our Sun)
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/G(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    // Get spectral data for this subclass
    const spectralData = G_CLASS_DATA[subclass] || G_CLASS_DATA[2];

    // Calculate base color from B-V color index
    const baseColor = colorIndexToRGB(spectralData.colorIndex);

    // Generate color palette
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    // Create material with calculated colors
    super(object, surfaceColor, {
      // Adjust noise parameters based on stellar properties
      noiseScale: 0.03 + (spectralData.luminosity - 1.0) * 0.02, // More active stars have more complex patterns
      noiseIntensity: 0.12 + (spectralData.temperature - 5400) / 8000, // Hotter stars more active
      plasmaTurbulence: 0.6 + (spectralData.mass - 0.9) * 0.3, // More massive stars more turbulent
      lightingIntensity: 1.0 + spectralData.luminosity * 0.2, // Brighter stars emit more light
    });

    // Override colors with our calculated values
    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for G-class stars
 */
export class ClassGStarRenderer extends MainSequenceStarRenderer<ClassGStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a G-class star
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassGStarMaterial {
    return new ClassGStarMaterial(object);
  }

  /**
   * Get star color based on spectral class
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 2; // Default to G2V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/G(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    // Get spectral data and calculate color
    const spectralData = G_CLASS_DATA[subclass] || G_CLASS_DATA[2];
    return colorIndexToRGB(spectralData.colorIndex);
  }

  public update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    console.log("update");
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );
    this.setMaterialUniforms("time", new THREE.Uniform(time));

    const starProps = object.properties as StarProperties;
    let subclass = 2; // Default to G2V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/G(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = G_CLASS_DATA[subclass] || G_CLASS_DATA[2];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(0.03, 0.03 + (spectralData.luminosity - 1.0) * 0.02, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(0.12, 0.12 + (spectralData.temperature - 5400) / 8000, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(0.6, 0.6 + (spectralData.mass - 0.9) * 0.3, 0.5),
      ),
    );
  }
}
