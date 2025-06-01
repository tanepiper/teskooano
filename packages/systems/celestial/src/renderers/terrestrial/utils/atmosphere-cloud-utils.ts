import { PlanetProperties, PlanetType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { AtmosphereMaterial } from "../materials/atmosphere.material";

export interface AtmosphereMeshResult {
  mesh: THREE.Mesh;
  material: AtmosphereMaterial;
}

/**
 * Service for creating cloud and atmosphere meshes and materials.
 */
export class AtmosphereService {
  /**
   * Creates an atmosphere mesh and its material for a celestial object.
   *
   * @param object - The celestial object to add an atmosphere to.
   * @param segments - The number of segments for the sphere geometry.
   * @param baseRadiusInput - The base radius of the planet body.
   * @returns An AtmosphereMeshResult containing the mesh and material, or null if no atmosphere is defined.
   */
  createAtmosphereMesh(
    object: RenderableCelestialObject,
    segments: number = 64,
    baseRadiusInput?: number,
  ): AtmosphereMeshResult | null {
    const props = object.properties as PlanetProperties | undefined;
    const atmosphereProps = props?.atmosphere || (object as any).atmosphere;

    if (!atmosphereProps || !object.celestialObjectId) return null;

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
      if (props?.planetType === PlanetType.LAVA) {
        atmosphereColor = new THREE.Color("#FF6644"); // Orangey-red for lava atmosphere
      } else {
        atmosphereColor = new THREE.Color("#88AAFF"); // Bluish for typical atmosphere
      }
    }

    const atmosphereMaterial = new AtmosphereMaterial(atmosphereProps, {
      planetRadius: baseRadius,
      parentId: object.celestialObjectId,
    });

    const atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial,
    );
    atmosphereMesh.name = `${object.celestialObjectId}-atmosphere`;
    atmosphereMesh.renderOrder = 2; // Render atmosphere after clouds

    return { mesh: atmosphereMesh, material: atmosphereMaterial };
  }
}
