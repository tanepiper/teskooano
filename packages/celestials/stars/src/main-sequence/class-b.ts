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
 * Spectral data for B-class main sequence stars
 */
interface BClassSpectralData {
  mass: number;
  radius: number;
  luminosity: number;
  temperature: number;
  colorIndex: number;
}

/**
 * B-class spectral classifications with physical properties
 */
const B_CLASS_DATA: Record<number, BClassSpectralData> = {
  0: {
    mass: 17.7,
    radius: 7.16,
    luminosity: 44668,
    temperature: 31400,
    colorIndex: -0.301,
  },
  1: {
    mass: 11.0,
    radius: 5.71,
    luminosity: 13490,
    temperature: 26000,
    colorIndex: -0.278,
  },
  2: {
    mass: 7.3,
    radius: 4.06,
    luminosity: 2692,
    temperature: 20600,
    colorIndex: -0.215,
  },
  3: {
    mass: 5.4,
    radius: 3.61,
    luminosity: 977,
    temperature: 17000,
    colorIndex: -0.178,
  },
  4: {
    mass: 5.1,
    radius: 3.46,
    luminosity: 776,
    temperature: 16400,
    colorIndex: -0.165,
  },
  5: {
    mass: 4.7,
    radius: 3.36,
    luminosity: 589,
    temperature: 15700,
    colorIndex: -0.156,
  },
  6: {
    mass: 4.3,
    radius: 3.27,
    luminosity: 372,
    temperature: 14500,
    colorIndex: -0.14,
  },
  7: {
    mass: 3.92,
    radius: 2.94,
    luminosity: 302,
    temperature: 14000,
    colorIndex: -0.128,
  },
  8: {
    mass: 3.38,
    radius: 2.86,
    luminosity: 155,
    temperature: 12300,
    colorIndex: -0.109,
  },
  9: {
    mass: 2.75,
    radius: 2.49,
    luminosity: 72,
    temperature: 10700,
    colorIndex: -0.07,
  },
};

/**
 * Convert B-V color index to RGB for B-class stars
 */
function colorIndexToRGB(bv: number): THREE.Color {
  const clampedBV = Math.max(-0.35, Math.min(0.2, bv));

  // B-class stars are blue to bluish-white
  let r, g, b;

  if (clampedBV < -0.1) {
    // B0V-B3V: Very blue
    r = 0.7 + (clampedBV + 0.35) * 0.3;
    g = 0.8 + (clampedBV + 0.35) * 0.2;
    b = 1.0;
  } else {
    // B4V-B9V: Bluish-white
    r = 0.85 + (clampedBV + 0.1) * 0.15;
    g = 0.9 + (clampedBV + 0.1) * 0.1;
    b = 1.0 - (clampedBV + 0.1) * 0.2;
  }

  return new THREE.Color(r, g, b);
}

/**
 * Generate color palette for B-class stars
 */
function generateColorPalette(baseColor: THREE.Color, temperature: number) {
  // Hot plasma areas (very bright and blue for B-class)
  const hotColor = baseColor
    .clone()
    .multiplyScalar(1.4)
    .lerp(new THREE.Color(0.8, 0.9, 1.0), 0.5);

  // Surface color
  const surfaceColor = baseColor.clone();

  // Cool areas (still quite blue for B-class)
  const tempFactor = Math.max(
    0.7,
    Math.min(1.0, (temperature - 10000) / 23000),
  );
  const coolColor = baseColor
    .clone()
    .multiplyScalar(0.8)
    .lerp(new THREE.Color(0.6, 0.7, 1.0), 1.0 - tempFactor);

  return { hotColor, surfaceColor, coolColor };
}

/**
 * Material for B-class stars with spectral class support
 */
export class ClassBStarMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    const starProps = object.properties as StarProperties;

    // Extract spectral subclass
    let subclass = 5; // Default to B5V
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/B(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = B_CLASS_DATA[subclass] || B_CLASS_DATA[5];
    const baseColor = colorIndexToRGB(spectralData.colorIndex);
    const { hotColor, surfaceColor, coolColor } = generateColorPalette(
      baseColor,
      spectralData.temperature,
    );

    super(object, surfaceColor, {
      noiseScale: 1.5 + (spectralData.luminosity - 5000) * 0.0001,
      noiseIntensity: 0.35 + (spectralData.temperature - 10000) / 20000,
      plasmaTurbulence: 0.25 + (spectralData.mass - 2.5) * 0.05,
      lightingIntensity: 1.5 + spectralData.luminosity * 0.0001,
    });

    this.uniforms.uHotColor.value = hotColor;
    this.uniforms.uSurfaceColor.value = surfaceColor;
    this.uniforms.uCoolColor.value = coolColor;
  }
}

/**
 * Renderer for B-class stars
 */
export class ClassBStarRenderer extends MainSequenceStarRenderer<ClassBStarMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassBStarMaterial {
    return new ClassBStarMaterial(object);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const starProps = star.properties as StarProperties;

    let subclass = 5;
    if (starProps.spectralClass) {
      const match = starProps.spectralClass.match(/B(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }

    const spectralData = B_CLASS_DATA[subclass] || B_CLASS_DATA[5];
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
      const match = starProps.spectralClass.match(/B(\d)V?/);
      if (match) {
        subclass = parseInt(match[1], 10);
      }
    }
    const spectralData = B_CLASS_DATA[subclass] || B_CLASS_DATA[5];
    this.setMaterialUniforms(
      "noiseScale",
      new THREE.Uniform(
        utils.lerp(1.5, 1.5 + (spectralData.luminosity - 5000) * 0.0001, 0.5),
      ),
    );
    this.setMaterialUniforms(
      "noiseIntensity",
      new THREE.Uniform(
        utils.lerp(
          0.35,
          0.35 + (spectralData.temperature - 10000) / 20000,
          0.5,
        ),
      ),
    );
    this.setMaterialUniforms(
      "plasmaTurbulence",
      new THREE.Uniform(
        utils.lerp(0.25, 0.25 + (spectralData.mass - 2.5) * 0.05, 0.5),
      ),
    );
  }
}
