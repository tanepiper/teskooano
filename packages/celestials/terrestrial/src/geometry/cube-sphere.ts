import * as THREE from "three";

/**
 * Creates a cube-to-sphere geometry by normalizing BoxGeometry vertices.
 * This technique eliminates polar distortion present in SphereGeometry
 * by providing uniform vertex distribution across the entire surface.
 *
 * The approach:
 * 1. Create a BoxGeometry with equal subdivisions on each face
 * 2. Normalize each vertex to project it onto a unit sphere
 * 3. Scale to the desired radius
 * 4. Recalculate normals for proper lighting
 *
 * @param radius - The radius of the resulting sphere
 * @param segments - Number of segments per cube face edge (higher = smoother)
 * @returns A BufferGeometry with vertices arranged on a sphere
 */
export function createCubeSphereGeometry(
  radius: number,
  segments: number,
): THREE.BufferGeometry {
  // BoxGeometry uses width segments, not total, so we use segments directly
  // This creates segments^2 quads per face, 6 faces total
  const geometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);

  const positionAttribute = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  // Normalize all vertices to create sphere shape
  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.set(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i),
    );

    // Normalize to unit sphere, then scale to desired radius
    vertex.normalize().multiplyScalar(radius);

    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  // Mark position attribute as needing update
  positionAttribute.needsUpdate = true;

  // Recalculate normals - for a sphere centered at origin,
  // normals should point outward (same direction as normalized position)
  geometry.computeVertexNormals();

  // Compute bounding sphere for frustum culling
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Creates a cube-to-sphere geometry optimized for procedural texturing.
 * This variant preserves the cube face information in UV coordinates,
 * enabling face-based texture mapping if needed.
 *
 * @param radius - The radius of the resulting sphere
 * @param segments - Number of segments per cube face edge
 * @returns A BufferGeometry with cube-sphere topology
 */
export function createCubeSphereGeometryWithFaceUVs(
  radius: number,
  segments: number,
): THREE.BufferGeometry {
  const geometry = createCubeSphereGeometry(radius, segments);

  // The default BoxGeometry UVs map each face to 0-1 range,
  // which is preserved after vertex normalization.
  // This is useful for face-based texture atlases.

  return geometry;
}

/**
 * Utility to get the spherical coordinate from a cube face position.
 * Useful for generating procedural textures that match the geometry.
 *
 * @param faceIndex - Which face of the cube (0-5: +X, -X, +Y, -Y, +Z, -Z)
 * @param u - U coordinate on the face (0-1)
 * @param v - V coordinate on the face (0-1)
 * @returns Normalized 3D position on unit sphere
 */
export function getSphericalCoordFromCubeFace(
  faceIndex: number,
  u: number,
  v: number,
): THREE.Vector3 {
  // Convert UV (0-1) to cube face coordinates (-1 to 1)
  const x = u * 2 - 1;
  const y = v * 2 - 1;

  const coord = new THREE.Vector3();

  // Map face index to 3D coordinate
  // Face order matches Three.js BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
  switch (faceIndex) {
    case 0: // +X face
      coord.set(1, -y, -x);
      break;
    case 1: // -X face
      coord.set(-1, -y, x);
      break;
    case 2: // +Y face
      coord.set(x, 1, y);
      break;
    case 3: // -Y face
      coord.set(x, -1, -y);
      break;
    case 4: // +Z face
      coord.set(x, -y, 1);
      break;
    case 5: // -Z face
      coord.set(-x, -y, -1);
      break;
    default:
      coord.set(0, 1, 0);
  }

  return coord.normalize();
}
