import * as THREE from "three";
import {
  BasicCelestialRenderer,
  type BasicRendererOptions,
} from "@teskooano/celestial-object";
import type { Class1GasGiant } from ".";

const GAS_GIANT_HIGH_DETAIL_SEGMENTS = 64;
const GAS_GIANT_MEDIUM_DETAIL_SEGMENTS = 32;
const GAS_GIANT_LOW_DETAIL_SEGMENTS = 16;

/**
 * Specific renderer for Class 1 Gas Giants.
 * Manages a THREE.Group containing the visual elements for the gas giant.
 */
export class GasGiantClass1Renderer extends BasicCelestialRenderer {
  private gasGiant: Class1GasGiant;
  private static readonly DEFAULT_VISUAL_RADIUS = 70; // Default visual radius in scene units if actual is zero/undefined
  private static readonly DEFAULT_BASE_COLOR = 0xaa8866;
  private static readonly VISUAL_RADIUS_SCALE_FACTOR = 1e7; // Example: 1 unit in scene = 10,000 km

  constructor(celestial: Class1GasGiant, options?: BasicRendererOptions) {
    const physicalRadiusMeters = celestial.physicalProperties.radius;
    const visualRadius =
      physicalRadiusMeters > 0
        ? physicalRadiusMeters /
          GasGiantClass1Renderer.VISUAL_RADIUS_SCALE_FACTOR
        : GasGiantClass1Renderer.DEFAULT_VISUAL_RADIUS;

    const baseColor = GasGiantClass1Renderer.DEFAULT_BASE_COLOR;

    super(celestial, visualRadius, baseColor, options);
    this.gasGiant = celestial;
  }

  protected createHighDetailGroupLOD(
    radius: number,
    color: number,
  ): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(
      radius,
      GAS_GIANT_HIGH_DETAIL_SEGMENTS,
      GAS_GIANT_HIGH_DETAIL_SEGMENTS,
    );
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color).multiplyScalar(0.1),
    });
    const bodyMesh = new THREE.Mesh(geometry, material);
    bodyMesh.name = `${this.gasGiant.id}-high-detail-body`;
    group.add(bodyMesh);
    return group;
  }

  protected createMediumDetailGroupLOD(
    radius: number,
    color: number,
  ): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(
      radius,
      GAS_GIANT_MEDIUM_DETAIL_SEGMENTS,
      GAS_GIANT_MEDIUM_DETAIL_SEGMENTS,
    );
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color).multiplyScalar(0.05),
    });
    const bodyMesh = new THREE.Mesh(geometry, material);
    bodyMesh.name = `${this.gasGiant.id}-medium-detail-body`;
    group.add(bodyMesh);
    return group;
  }

  protected createLowDetailGroupLOD(
    radius: number,
    color: number,
  ): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(
      radius,
      GAS_GIANT_LOW_DETAIL_SEGMENTS,
      GAS_GIANT_LOW_DETAIL_SEGMENTS,
    );
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
    });
    const bodyMesh = new THREE.Mesh(geometry, material);
    bodyMesh.name = `${this.gasGiant.id}-low-detail-body`;
    group.add(bodyMesh);
    return group;
  }
}
