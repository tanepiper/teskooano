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
 * Spectral data for A-class main sequence stars
 */
interface AClassSpectralData {
  mass: number;
  radius: number;
  luminosity: number;
  temperature: number;
  colorIndex: number;
}

/**
 * A-class spectral classifications with physical properties
 */
const A_CLASS_DATA: Record<number, AClassSpectralData> = {
  0: {
    mass: 2.18,
    radius: 2.193,
    luminosity: 38.02,
    temperature: 9700,
    colorIndex: 0.0,
  },
  1: {
    mass: 2.05,
    radius: 2.136,
    luminosity: 30.9,
    temperature: 9300,
    colorIndex: 0.04,
  },
  2: {
    mass: 1.98,
    radius: 2.117,
    luminosity: 23.99,
    temperature: 8800,
    colorIndex: 0.07,
  },
  3: {
    mass: 1.93,
    radius: 1.861,
    luminosity: 16.98,
    temperature: 8600,
    colorIndex: 0.1,
  },
  4: {
    mass: 1.88,
    radius: 1.794,
    luminosity: 13.49,
    temperature: 8250,
    colorIndex: 0.14,
  },
  5: {
    mass: 1.86,
    radius: 1.785,
    luminosity: 12.3,
    temperature: 8100,
    colorIndex: 0.16,
  },
  6: {
    mass: 1.83,
    radius: 1.775,
    luminosity: 11.22,
    temperature: 7910,
    colorIndex: 0.19,
  },
  7: {
    mass: 1.81,
    radius: 1.75,
    luminosity: 10.0,
    temperature: 7760,
    colorIndex: 0.21,
  },
  8: {
    mass: 1.77,
    radius: 1.748,
    luminosity: 9.12,
    temperature: 7590,
    colorIndex: 0.25,
  },
  9: {
    mass: 1.75,
    radius: 1.747,
    luminosity: 8.32,
    temperature: 7400,
    colorIndex: 0.27,
  },
};

/**
 * Convert B-V color index to RGB for A-class stars
 */
function colorIndexToRGB(bv: number): THREE.Color {
  const clampedBV = Math.max(-0.1, Math.min(0.3, bv));

  // A-class stars are white to bluish-white
  let r, g, b;

  if (clampedBV < 0.1) {
    // A0V-A5V: Pure white to slightly bluish
    r = 1.0;
    g = 1.0;
    b = 1.0 - clampedBV * 0.3;
  } else {
    // A6V-A9V: Slightly more blue
    r = 1.0;
    g = 1.0 - (clampedBV - 0.1) * 0.2;
    b = 0.97 - (clampedBV - 0.1) * 0.3;
  }

  return new THREE.Color(r, g, b);
}

/**
 * Generate color palette for A-class stars
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (very bright for A-class)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.3)
    .lerp(new THREE.Color(1.0, 1.0, 1.0), 0.4);

  // Surface color
  const surfaceColor = baseColor.clone();

  // Cool areas (still quite bright for A-class)
  const tempFactor = Math.max(0.6, Math.min(1.0, (temperature - 7000) / 3000));
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.9)
    .lerp(new THREE.Color(0.9, 0.9, 1.0), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for A-class stars with spectral class support
 */
export class ClassAStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 5; // Default to A5V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/A(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = A_CLASS_DATA[subclass] || A_CLASS_DATA[5];
    const baseColor = colorIndexToRGB(spectralData.colorIndex);
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    super(object, surfaceColor, {
      noiseScale: 0.02 + (spectralData.luminosity - 5.0) * 0.005,
      noiseIntensity: 0.1 + (spectralData.temperature - 7000) / 30000,
      plasmaTurbulence: 0.8 + (spectralData.mass - 1.4) * 0.2,
      lightingIntensity: 1.5 + spectralData.luminosity * 0.1,
    });

    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for A-class stars
 */
export class ClassAStarRenderer extends MainSequenceStarRenderer<ClassAStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassAStarMaterial {
    return new ClassAStarMaterial(object);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/A(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = A_CLASS_DATA[subclass] || A_CLASS_DATA[5];
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
      const match = starProps.spectralClass.match(/A(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = A_CLASS_DATA[subclass] || A_CLASS_DATA[5];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(0.02, 0.02 + (spectralData.luminosity - 5.0) * 0.005, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(0.1, 0.1 + (spectralData.temperature - 7000) / 30000, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(0.8, 0.8 + (spectralData.mass - 1.4) * 0.2, 0.5),
      ),
    );
  }
}
