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
 * Spectral data for K-class main sequence stars
 */
interface KClassSpectralData {
  mass: number;
  radius: number;
  luminosity: number;
  temperature: number;
  colorIndex: number;
}

/**
 * K-class spectral classifications with physical properties
 */
const K_CLASS_DATA: Record<number, KClassSpectralData> = {
  0: {
    mass: 0.88,
    radius: 0.813,
    luminosity: 0.46,
    temperature: 5270,
    colorIndex: 0.82,
  },
  1: {
    mass: 0.86,
    radius: 0.797,
    luminosity: 0.41,
    temperature: 5170,
    colorIndex: 0.86,
  },
  2: {
    mass: 0.82,
    radius: 0.783,
    luminosity: 0.37,
    temperature: 5100,
    colorIndex: 0.88,
  },
  3: {
    mass: 0.78,
    radius: 0.755,
    luminosity: 0.28,
    temperature: 4830,
    colorIndex: 0.99,
  },
  4: {
    mass: 0.73,
    radius: 0.713,
    luminosity: 0.2,
    temperature: 4600,
    colorIndex: 1.09,
  },
  5: {
    mass: 0.7,
    radius: 0.701,
    luminosity: 0.17,
    temperature: 4440,
    colorIndex: 1.15,
  },
  6: {
    mass: 0.69,
    radius: 0.669,
    luminosity: 0.14,
    temperature: 4300,
    colorIndex: 1.24,
  },
  7: {
    mass: 0.64,
    radius: 0.63,
    luminosity: 0.1,
    temperature: 4100,
    colorIndex: 1.34,
  },
  8: {
    mass: 0.62,
    radius: 0.615,
    luminosity: 0.087,
    temperature: 3990,
    colorIndex: 1.36,
  },
  9: {
    mass: 0.59,
    radius: 0.608,
    luminosity: 0.079,
    temperature: 3930,
    colorIndex: 1.4,
  },
};

/**
 * Convert B-V color index to RGB for K-class stars
 */
function colorIndexToRGB(bv: number): THREE.Color {
  const clampedBV = Math.max(0.8, Math.min(1.2, bv));

  // K-class stars are orange to light orange
  let r, g, b;

  if (clampedBV < 1.0) {
    // K0V-K5V: Light orange
    r = 1.0;
    g = 0.7 - (clampedBV - 0.8) * 0.2;
    b = 0.3 - (clampedBV - 0.8) * 0.3;
  } else {
    // K6V-K9V: More orange
    r = 1.0;
    g = 0.6 - (clampedBV - 1.0) * 0.3;
    b = 0.2 - (clampedBV - 1.0) * 0.2;
  }

  return new THREE.Color(r, g, b);
}

/**
 * Generate color palette for K-class stars
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (orange-white for K-class)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.15)
    .lerp(new THREE.Color(1.0, 0.9, 0.7), 0.4);

  // Surface color
  const surfaceColor = baseColor.clone();

  // Cool areas (more red/orange for K-class)
  const tempFactor = Math.max(0.2, Math.min(1.0, (temperature - 4000) / 1500));
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.6)
    .lerp(new THREE.Color(0.8, 0.4, 0.1), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for K-class stars with spectral class support
 */
export class ClassKStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 5; // Default to K5V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/K(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = K_CLASS_DATA[subclass] || K_CLASS_DATA[5];
    const baseColor = colorIndexToRGB(spectralData.colorIndex);
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    super(object, surfaceColor, {
      noiseScale: 0.035 + (spectralData.luminosity - 0.3) * 0.03,
      noiseIntensity: 0.13 + (spectralData.temperature - 4000) / 20000,
      plasmaTurbulence: 0.5 + (spectralData.mass - 0.5) * 0.4,
      lightingIntensity: 0.8 + spectralData.luminosity * 0.3,
    });

    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for K-class stars
 */
export class ClassKStarRenderer extends MainSequenceStarRenderer<ClassKStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassKStarMaterial {
    return new ClassKStarMaterial(object);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/K(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = K_CLASS_DATA[subclass] || K_CLASS_DATA[5];
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
    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/K(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = K_CLASS_DATA[subclass] || K_CLASS_DATA[5];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(0.035, 0.035 + (spectralData.luminosity - 0.3) * 0.03, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(0.13, 0.13 + (spectralData.temperature - 4000) / 20000, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(0.5, 0.5 + (spectralData.mass - 0.5) * 0.4, 0.5),
      ),
    );
  }
}
