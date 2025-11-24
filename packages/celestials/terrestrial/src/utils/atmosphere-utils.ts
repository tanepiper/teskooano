import {
  PlanetProperties,
  PlanetType,
  RendererBackend,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";
import { AtmosphereMaterial } from "../materials/atmosphere.material";
import { AtmosphereMaterialFactory } from "../materials/atmosphere-factory";
import { GeometryUtilities } from "@teskooano/renderer-threejs-celestial";

export interface AtmosphereMeshResult {
  mesh: THREE.Mesh;
  material: THREE.Material;
}

/**
 * Service for creating cloud and atmosphere meshes and materials.
 */
export class AtmosphereService {
  private materialFactory = new AtmosphereMaterialFactory();

  /**
   * Creates an atmosphere mesh and its material for a celestial object.
   *
   * @param object - The celestial object to add an atmosphere to.
   * @param segments - The number of segments for the sphere geometry.
   * @param baseRadiusInput - The base radius of the planet body.
   * @param rendererBackend - The renderer backend to use (webgl or webgpu).
   * @returns An AtmosphereMeshResult containing the mesh and material, or null if no atmosphere is defined.
   */
  createAtmosphereMesh(
    object: RenderableCelestialObject,
    segments: number = GeometryUtilities.getOptimizedAtmosphereSegments(
      "high",
      64,
    ),
    baseRadiusInput?: number,
    rendererBackend: RendererBackend = "webgpu",
  ): AtmosphereMeshResult | null {
    const props = object.properties as PlanetProperties | undefined;
    const atmosphereProps = props?.atmosphere;
    if (!atmosphereProps || !object.id) return null;

    const baseRadius =
      baseRadiusInput ?? object.realRadius_m ?? object.radius ?? 1;
    const atmosphereRadius = baseRadius * 1.05; // Atmosphere slightly larger than planet
    const atmosphereGeometry = new THREE.SphereGeometry(
      atmosphereRadius,
      segments,
      segments,
    );

    let atmosphereColor = new THREE.Color(
      atmosphereProps.glowColor || "#FFFFFF",
    );
    // Adjust default color based on planet type if color isn't explicitly set
    if (!atmosphereProps.glowColor) {
      if (props?.classType === PlanetType.LAVA) {
        atmosphereColor = new THREE.Color("#FF6644"); // Orangey-red for lava atmosphere
      } else {
        atmosphereColor = new THREE.Color("#88AAFF"); // Bluish for typical atmosphere
      }
    }

    const atmosphereMaterial = this.materialFactory.createMaterial({
      rendererBackend,
      atmosphereProps,
      planetRadius: baseRadius,
      parentId: object.id,
    });

    const atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial,
    );
    atmosphereMesh.name = `${object.id}-atmosphere`;
    atmosphereMesh.renderOrder = 2; // Render atmosphere after clouds

    return { mesh: atmosphereMesh, material: atmosphereMaterial };
  }
}
