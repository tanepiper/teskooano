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
 * Spectral data for O-class main sequence stars
 */
interface OClassSpectralData {
  mass: number;
  radius: number;
  luminosity: number;
  temperature: number;
  colorIndex: number;
}

/**
 * O-class spectral classifications with physical properties
 */
const O_CLASS_DATA: Record<number, OClassSpectralData> = {
  0: {
    mass: 150.0,
    radius: 18.0,
    luminosity: 2000000,
    temperature: 48000,
    colorIndex: -0.335,
  },
  1: {
    mass: 135.0,
    radius: 17.0,
    luminosity: 1800000,
    temperature: 47000,
    colorIndex: -0.333,
  },
  2: {
    mass: 120.0,
    radius: 16.0,
    luminosity: 1600000,
    temperature: 46000,
    colorIndex: -0.33,
  },
  3: {
    mass: 120.0,
    radius: 15.0,
    luminosity: 1400000,
    temperature: 44900,
    colorIndex: -0.33,
  },
  4: {
    mass: 85.31,
    radius: 13.43,
    luminosity: 1073019,
    temperature: 42900,
    colorIndex: -0.326,
  },
  5: {
    mass: 60.0,
    radius: 12.0,
    luminosity: 790000,
    temperature: 41400,
    colorIndex: -0.323,
  },
  6: {
    mass: 43.71,
    radius: 10.71,
    luminosity: 540422,
    temperature: 39500,
    colorIndex: -0.321,
  },
  7: {
    mass: 30.85,
    radius: 9.52,
    luminosity: 317322,
    temperature: 37100,
    colorIndex: -0.318,
  },
  8: {
    mass: 23.0,
    radius: 8.5,
    luminosity: 170000,
    temperature: 35100,
    colorIndex: -0.315,
  },
  9: {
    mass: 19.63,
    radius: 7.51,
    luminosity: 92762,
    temperature: 33300,
    colorIndex: -0.312,
  },
};

/**
 * Convert B-V color index to RGB for O-class stars
 */
function colorIndexToRGB(bv: number): THREE.Color {
  const clampedBV = Math.max(-0.35, Math.min(-0.2, bv));

  // O-class stars are very blue
  let r, g, b;

  // O-class stars are extremely blue
  r = 0.6 + (clampedBV + 0.35) * 0.4;
  g = 0.7 + (clampedBV + 0.35) * 0.3;
  b = 1.0;

  return new THREE.Color(r, g, b);
}

/**
 * Generate color palette for O-class stars
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (very bright and blue for O-class)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.5)
    .lerp(new THREE.Color(0.7, 0.8, 1.0), 0.6);

  // Surface color
  const surfaceColor = baseColor.clone();

  // Cool areas (still quite blue for O-class)
  const tempFactor = Math.max(
    0.8,
    Math.min(1.0, (temperature - 30000) / 20000),
  );
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.7)
    .lerp(new THREE.Color(0.5, 0.6, 1.0), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for O-class stars with spectral class support
 */
export class ClassOStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 5; // Default to O5V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/O(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = O_CLASS_DATA[subclass] || O_CLASS_DATA[5];
    const baseColor = colorIndexToRGB(spectralData.colorIndex);
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    super(object, surfaceColor, {
      noiseScale: 0.01 + (spectralData.luminosity - 200000) * 0.00000003,
      noiseIntensity: 0.08 + (spectralData.temperature - 30000) * 0.0000012,
      plasmaTurbulence: 1.6 + (spectralData.mass - 16) * 0.01,
      lightingIntensity: 1.0 + spectralData.luminosity * 0.000002,
    });

    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for O-class stars
 */
export class ClassOStarRenderer extends MainSequenceStarRenderer<ClassOStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassOStarMaterial {
    return new ClassOStarMaterial(object);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/O(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = O_CLASS_DATA[subclass] || O_CLASS_DATA[5];
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
      const match = starProps.spectralClass.match(/O(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = O_CLASS_DATA[subclass] || O_CLASS_DATA[5];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(
          0.01,
          0.01 + (spectralData.luminosity - 200000) * 0.00000003,
          0.5,
        ),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(
          0.08,
          0.08 + (spectralData.temperature - 30000) * 0.0000012,
          0.5,
        ),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(1.6, 1.6 + (spectralData.mass - 16) * 0.01, 0.5),
      ),
    );
  }
}
