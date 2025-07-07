import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";
import type { DetailLevel } from "../types";

/**
 * Utility class providing geometry-related helper functions for celestial renderers.
 * Centralizes common geometry operations like segment calculations and position utilities.
 */
export class GeometryUtilities {
  /**
   * Maps a qualitative detail level (e.g., "high") to a concrete number of segments for creating geometries.
   * @param detailLevel A string representing the desired detail level.
   * @param defaultSegments A fallback number of segments if the detail level is not specified.
   * @returns The calculated number of segments.
   */
  public static getSegmentsForDetailLevel(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 32,
  ): number {
    if (!detailLevel) return defaultSegments;

    switch (detailLevel) {
      case "high":
        return 64;
      case "medium":
        return 32;
      case "low":
        return 8;
      case "very-low":
        return 4;
      default:
        return defaultSegments;
    }
  }

  /**
   * Gets the world position of a celestial object.
   * @param object The celestial object.
   * @returns A clone of the object's position vector.
   */
  public static getWorldPosition(
    object: RenderableCelestialObject,
  ): THREE.Vector3 {
    return object.position.clone();
  }

  /**
   * Calculates the distance between two celestial objects.
   * @param object1 The first celestial object.
   * @param object2 The second celestial object.
   * @returns The distance between the objects.
   */
  public static getDistanceBetweenObjects(
    object1: RenderableCelestialObject,
    object2: RenderableCelestialObject,
  ): number {
    return object1.position.distanceTo(object2.position);
  }

  /**
   * Calculates the squared distance between two celestial objects (more efficient for comparisons).
   * @param object1 The first celestial object.
   * @param object2 The second celestial object.
   * @returns The squared distance between the objects.
   */
  public static getSquaredDistanceBetweenObjects(
    object1: RenderableCelestialObject,
    object2: RenderableCelestialObject,
  ): number {
    return object1.position.distanceToSquared(object2.position);
  }

  /**
   * Creates a standard sphere geometry with the specified detail level.
   * @param radius The radius of the sphere.
   * @param detailLevel The detail level for the sphere.
   * @returns A THREE.SphereGeometry with appropriate segment count.
   */
  public static createSphereGeometry(
    radius: number,
    detailLevel?: DetailLevel | string,
  ): THREE.SphereGeometry {
    const segments = this.getSegmentsForDetailLevel(detailLevel);
    return new THREE.SphereGeometry(radius, segments, segments);
  }

  /**
   * Creates a standard plane geometry with the specified detail level.
   * @param width The width of the plane.
   * @param height The height of the plane.
   * @param detailLevel The detail level for the plane.
   * @returns A THREE.PlaneGeometry with appropriate segment count.
   */
  public static createPlaneGeometry(
    width: number,
    height: number,
    detailLevel?: DetailLevel | string,
  ): THREE.PlaneGeometry {
    const segments = this.getSegmentsForDetailLevel(detailLevel);
    return new THREE.PlaneGeometry(width, height, segments, segments);
  }

  /**
   * Creates a standard ring geometry with the specified detail level.
   * @param innerRadius The inner radius of the ring.
   * @param outerRadius The outer radius of the ring.
   * @param detailLevel The detail level for the ring.
   * @returns A THREE.RingGeometry with appropriate segment count.
   */
  public static createRingGeometry(
    innerRadius: number,
    outerRadius: number,
    detailLevel?: DetailLevel | string,
  ): THREE.RingGeometry {
    const segments = this.getSegmentsForDetailLevel(detailLevel);
    return new THREE.RingGeometry(innerRadius, outerRadius, segments);
  }

  /**
   * Calculates an appropriate radius scale based on the detail level.
   * Lower detail levels might use simplified representations.
   * @param baseRadius The base radius of the object.
   * @param detailLevel The detail level.
   * @returns The scaled radius.
   */
  public static getScaledRadius(
    baseRadius: number,
    detailLevel?: DetailLevel | string,
  ): number {
    if (!detailLevel) return baseRadius;

    switch (detailLevel) {
      case "high":
        return baseRadius;
      case "medium":
        return baseRadius * 0.98;
      case "low":
        return baseRadius * 0.95;
      case "very-low":
        return baseRadius * 0.9;
      default:
        return baseRadius;
    }
  }

  /**
   * Creates a bounding box for a celestial object.
   * @param object The celestial object.
   * @param padding Optional padding to add to the bounding box.
   * @returns A THREE.Box3 representing the object's bounding box.
   */
  public static createBoundingBox(
    object: RenderableCelestialObject,
    padding: number = 0,
  ): THREE.Box3 {
    const radius = (object.radius || 1) + padding;
    const min = object.position.clone().subScalar(radius);
    const max = object.position.clone().addScalar(radius);
    return new THREE.Box3(min, max);
  }

  /**
   * Creates a bounding sphere for a celestial object.
   * @param object The celestial object.
   * @param padding Optional padding to add to the bounding sphere.
   * @returns A THREE.Sphere representing the object's bounding sphere.
   */
  public static createBoundingSphere(
    object: RenderableCelestialObject,
    padding: number = 0,
  ): THREE.Sphere {
    const radius = (object.radius || 1) + padding;
    return new THREE.Sphere(object.position.clone(), radius);
  }

  /**
   * Determines if a celestial object is within the view frustum of a camera.
   * @param object The celestial object to test.
   * @param camera The camera to test against.
   * @param padding Optional padding for the object's radius.
   * @returns True if the object is likely visible to the camera.
   */
  public static isObjectInViewFrustum(
    object: RenderableCelestialObject,
    camera: THREE.Camera,
    padding: number = 0,
  ): boolean {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4();

    if (
      camera instanceof THREE.PerspectiveCamera ||
      camera instanceof THREE.OrthographicCamera
    ) {
      matrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      );
      frustum.setFromProjectionMatrix(matrix);

      const sphere = this.createBoundingSphere(object, padding);
      return frustum.intersectsSphere(sphere);
    }

    return true; // Default to visible for unknown camera types
  }

  /**
   * Calculates the apparent size of an object from a camera's perspective.
   * @param object The celestial object.
   * @param camera The viewing camera.
   * @returns The apparent angular size in radians.
   */
  public static getApparentAngularSize(
    object: RenderableCelestialObject,
    camera: THREE.Camera,
  ): number {
    const distance = camera.position.distanceTo(object.position);
    const radius = object.radius || 1;
    return 2 * Math.atan(radius / distance);
  }
}
