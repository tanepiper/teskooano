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
 * Spectral data for M-class main sequence stars
 */
interface MClassSpectralData {
  mass: number;
  radius: number;
  luminosity: number;
  temperature: number;
  colorIndex: number;
}

/**
 * M-class spectral classifications with physical properties
 */
const M_CLASS_DATA: Record<number, MClassSpectralData> = {
  0: {
    mass: 0.57,
    radius: 0.588,
    luminosity: 0.069,
    temperature: 3850,
    colorIndex: 1.42,
  },
  1: {
    mass: 0.5,
    radius: 0.501,
    luminosity: 0.041,
    temperature: 3660,
    colorIndex: 1.49,
  },
  2: {
    mass: 0.44,
    radius: 0.446,
    luminosity: 0.029,
    temperature: 3560,
    colorIndex: 1.51,
  },
  3: {
    mass: 0.37,
    radius: 0.361,
    luminosity: 0.016,
    temperature: 3430,
    colorIndex: 1.53,
  },
  4: {
    mass: 0.23,
    radius: 0.274,
    luminosity: 0.0072,
    temperature: 3210,
    colorIndex: 1.65,
  },
  5: {
    mass: 0.162,
    radius: 0.196,
    luminosity: 0.003,
    temperature: 3060,
    colorIndex: 1.83,
  },
  6: {
    mass: 0.102,
    radius: 0.137,
    luminosity: 0.001,
    temperature: 2810,
    colorIndex: 2.01,
  },
  7: {
    mass: 0.09,
    radius: 0.12,
    luminosity: 0.00065,
    temperature: 2680,
    colorIndex: 2.12,
  },
  8: {
    mass: 0.085,
    radius: 0.114,
    luminosity: 0.00052,
    temperature: 2570,
    colorIndex: 2.15,
  },
  9: {
    mass: 0.079,
    radius: 0.102,
    luminosity: 0.0003,
    temperature: 2380,
    colorIndex: 2.17,
  },
};

/**
 * Convert B-V color index to RGB for M-class stars
 */
function colorIndexToRGB(bv: number): THREE.Color {
  const clampedBV = Math.max(1.35, Math.min(1.9, bv));

  // M-class stars are red to deep red
  let r, g, b;

  if (clampedBV < 1.6) {
    // M0V-M5V: Red-orange
    r = 1.0;
    g = 0.4 - (clampedBV - 1.35) * 0.2;
    b = 0.1 - (clampedBV - 1.35) * 0.1;
  } else {
    // M6V-M9V: Deep red
    r = 1.0;
    g = 0.3 - (clampedBV - 1.6) * 0.3;
    b = 0.05 - (clampedBV - 1.6) * 0.05;
  }

  return new THREE.Color(r, g, b);
}

/**
 * Generate color palette for M-class stars
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (red-white for M-class)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.1)
    .lerp(new THREE.Color(1.0, 0.8, 0.6), 0.5);

  // Surface color
  const surfaceColor = baseColor.clone();

  // Cool areas (very red for M-class)
  const tempFactor = Math.max(0.1, Math.min(1.0, (temperature - 2500) / 1500));
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.5)
    .lerp(new THREE.Color(0.6, 0.2, 0.05), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for M-class stars with spectral class support
 */
export class ClassMStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 5; // Default to M5V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/M(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = M_CLASS_DATA[subclass] || M_CLASS_DATA[5];
    const baseColor = colorIndexToRGB(spectralData.colorIndex);
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    super(object, surfaceColor, {
      noiseScale: 0.8 + (spectralData.luminosity - 0.03) * 10,
      noiseIntensity: 0.1 + (spectralData.temperature - 2500) / 20000,
      plasmaTurbulence: 0.05 + (spectralData.mass - 0.15) * 0.3,
      lightingIntensity: 0.5 + spectralData.luminosity * 8,
    });

    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for M-class stars
 */
export class ClassMStarRenderer extends MainSequenceStarRenderer<ClassMStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassMStarMaterial {
    return new ClassMStarMaterial(object);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/M(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = M_CLASS_DATA[subclass] || M_CLASS_DATA[5];
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

    const starProps = object.properties as StarProperties;
    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/M(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = M_CLASS_DATA[subclass] || M_CLASS_DATA[5];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(0.8, 0.8 + (spectralData.luminosity - 0.03) * 10, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(0.1, 0.1 + (spectralData.temperature - 2500) / 20000, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(0.05, 0.05 + (spectralData.mass - 0.15) * 0.3, 0.5),
      ),
    );
  }
}
