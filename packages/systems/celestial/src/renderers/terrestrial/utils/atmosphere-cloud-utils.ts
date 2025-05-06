import { PlanetProperties, PlanetType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { AtmosphereMaterial } from "../materials/atmosphere.material";
import { CloudMaterial } from "../materials/clouds.material";

export interface CloudMeshResult {
  mesh: THREE.Mesh;
  material: CloudMaterial;
}

export interface AtmosphereMeshResult {
  mesh: THREE.Mesh;
  material: AtmosphereMaterial;
}

/**
 * Service for creating cloud and atmosphere meshes and materials.
 */
export class AtmosphereCloudService {
  /**
   * Creates a cloud mesh and its material for a celestial object.
   *
   * @param object - The celestial object to add clouds to.
   * @param segments - The number of segments for the sphere geometry.
   * @param baseRadiusInput - The base radius of the planet body.
   * @returns A CloudMeshResult containing the mesh and material, or null if no clouds are defined.
   */
  createCloudMesh(
    object: RenderableCelestialObject,
    segments: number = 64,
    baseRadiusInput?: number,
  ): CloudMeshResult | null {
    const props = object.properties as PlanetProperties | undefined;
    const clouds = props?.clouds;
    if (!clouds || !object.celestialObjectId) return null;

    const baseRadius =
      baseRadiusInput ?? object.realRadius_m ?? object.radius ?? 1;
    const cloudRadius = baseRadius * 1.015;

    let cloudColor = new THREE.Color(0xffffff);
    let cloudOpacity = 0.8;
    let cloudSpeed = 1.0;

    if (clouds) {
      if (clouds.color) cloudColor = new THREE.Color(clouds.color);
      if (clouds.opacity !== undefined) cloudOpacity = clouds.opacity;
      if (clouds.speed !== undefined) cloudSpeed = clouds.speed;
    } else {
      // Default adjustments based on planet type if cloud props are minimal
      if (props?.planetType === PlanetType.LAVA) {
        cloudColor = new THREE.Color(0x555555);
        cloudSpeed = 1.5;
      } else if (props?.planetType === PlanetType.ICE) {
        cloudOpacity = 0.6;
      }
    }

    const cloudGeometry = new THREE.SphereGeometry(
      cloudRadius,
      segments,
      segments,
    );
    const cloudMaterial = new CloudMaterial({
      color: cloudColor,
      opacity: cloudOpacity,
      speed: cloudSpeed,
      sunPosition: new THREE.Vector3(1, 0, 0), // Default sun position, updated later
    });

    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.name = `${object.celestialObjectId}-clouds`;
    cloudMesh.renderOrder = 1; // Render clouds after the planet body

    return { mesh: cloudMesh, material: cloudMaterial };
  }

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
    const atmosphereProps = props?.atmosphere;
    if (!atmosphereProps || !object.celestialObjectId) return null;

    const baseRadius =
      baseRadiusInput ?? object.realRadius_m ?? object.radius ?? 1;
    const atmosphereRadius = baseRadius * 1.05; // Atmosphere slightly larger than planet
    const atmosphereGeometry = new THREE.SphereGeometry(
      atmosphereRadius,
      segments,
      segments,
    );

    let atmosphereColor = new THREE.Color(atmosphereProps.color || "#FFFFFF"); // Default white if not specified
    // Adjust default color based on planet type if color isn't explicitly set
    if (!atmosphereProps.color) {
      if (props?.planetType === PlanetType.LAVA) {
        atmosphereColor = new THREE.Color("#FF6644"); // Orangey-red for lava atmosphere
      } else {
        atmosphereColor = new THREE.Color("#88AAFF"); // Bluish for typical atmosphere
      }
    }

    const opacity = atmosphereProps.opacity ?? 0.7;
    const atmosphereMaterial = new AtmosphereMaterial(atmosphereColor, {
      opacity: opacity,
      sunPosition: new THREE.Vector3(1, 0, 0), // Default sun position, updated later
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
