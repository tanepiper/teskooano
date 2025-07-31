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
 * Spectral data for F-class main sequence stars
 */
interface FClassSpectralData {
  mass: number;
  radius: number;
  luminosity: number;
  temperature: number;
  colorIndex: number;
}

/**
 * F-class spectral classifications with physical properties
 */
const F_CLASS_DATA: Record<number, FClassSpectralData> = {
  0: {
    mass: 1.61,
    radius: 1.728,
    luminosity: 7.24,
    temperature: 7220,
    colorIndex: 0.3,
  },
  1: {
    mass: 1.5,
    radius: 1.679,
    luminosity: 6.17,
    temperature: 7020,
    colorIndex: 0.33,
  },
  2: {
    mass: 1.46,
    radius: 1.622,
    luminosity: 5.13,
    temperature: 6820,
    colorIndex: 0.37,
  },
  3: {
    mass: 1.44,
    radius: 1.578,
    luminosity: 4.68,
    temperature: 6750,
    colorIndex: 0.39,
  },
  4: {
    mass: 1.38,
    radius: 1.533,
    luminosity: 4.17,
    temperature: 6670,
    colorIndex: 0.41,
  },
  5: {
    mass: 1.33,
    radius: 1.473,
    luminosity: 3.63,
    temperature: 6550,
    colorIndex: 0.44,
  },
  6: {
    mass: 1.25,
    radius: 1.359,
    luminosity: 2.69,
    temperature: 6350,
    colorIndex: 0.49,
  },
  7: {
    mass: 1.21,
    radius: 1.324,
    luminosity: 2.45,
    temperature: 6280,
    colorIndex: 0.5,
  },
  8: {
    mass: 1.18,
    radius: 1.221,
    luminosity: 1.95,
    temperature: 6180,
    colorIndex: 0.53,
  },
  9: {
    mass: 1.13,
    radius: 1.167,
    luminosity: 1.66,
    temperature: 6050,
    colorIndex: 0.56,
  },
};

/**
 * Convert B-V color index to RGB for F-class stars
 */
function colorIndexToRGB(bv: number): THREE.Color {
  const clampedBV = Math.max(0.25, Math.min(0.65, bv));

  // F-class stars are yellowish-white
  let r, g, b;

  if (clampedBV < 0.45) {
    // F0V-F5V: More white with slight yellow tint
    r = 1.0;
    g = 1.0 - (clampedBV - 0.25) * 0.1;
    b = 0.95 - (clampedBV - 0.25) * 0.2;
  } else {
    // F6V-F9V: More yellow
    r = 1.0;
    g = 0.95 - (clampedBV - 0.45) * 0.15;
    b = 0.85 - (clampedBV - 0.45) * 0.3;
  }

  return new THREE.Color(r, g, b);
}

/**
 * Generate color palette for F-class stars
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (bright for F-class)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.25)
    .lerp(new THREE.Color(1.0, 1.0, 0.95), 0.3);

  // Surface color
  const surfaceColor = baseColor.clone();

  // Cool areas (slightly more yellow/orange for F-class)
  const tempFactor = Math.max(0.4, Math.min(1.0, (temperature - 6000) / 1500));
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.8)
    .lerp(new THREE.Color(0.9, 0.7, 0.5), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for F-class stars with spectral class support
 */
export class ClassFStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 5; // Default to F5V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/F(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = F_CLASS_DATA[subclass] || F_CLASS_DATA[5];
    const baseColor = colorIndexToRGB(spectralData.colorIndex);
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    super(object, surfaceColor, {
      noiseScale: 0.025 + (spectralData.luminosity - 1.5) * 0.01,
      noiseIntensity: 0.11 + (spectralData.temperature - 6000) / 25000,
      plasmaTurbulence: 0.7 + (spectralData.mass - 1.0) * 0.25,
      lightingIntensity: 1.2 + spectralData.luminosity * 0.15,
    });

    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for F-class stars
 */
export class ClassFStarRenderer extends MainSequenceStarRenderer<ClassFStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassFStarMaterial {
    return new ClassFStarMaterial(object);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/F(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = F_CLASS_DATA[subclass] || F_CLASS_DATA[5];
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
      const match = starProps.spectralClass.match(/F(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = F_CLASS_DATA[subclass] || F_CLASS_DATA[5];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(0.025, 0.025 + (spectralData.luminosity - 1.5) * 0.01, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(0.11, 0.11 + (spectralData.temperature - 6000) / 25000, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(0.7, 0.7 + (spectralData.mass - 1.0) * 0.25, 0.5),
      ),
    );
  }
}
