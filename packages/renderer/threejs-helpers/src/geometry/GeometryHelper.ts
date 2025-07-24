import * as THREE from "three";

/**
 * A utility class providing static methods for creating common Three.js geometries.
 *
 * This class offers a simplified API for creating various geometric shapes with
 * consistent material properties and positioning. All methods return configured
 * THREE.Mesh objects ready to be added to a scene.
 */
export class GeometryHelper {
  /**
   * Creates a box geometry with specified parameters.
   *
   * @param options - Box creation options
   * @returns Configured THREE.Mesh
   */
  static createBox(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      width?: number;
      height?: number;
      depth?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      width = 10,
      height = 10,
      depth = 10,
      name,
    } = options;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a sphere geometry with specified parameters.
   *
   * @param options - Sphere creation options
   * @returns Configured THREE.Mesh
   */
  static createSphere(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      radius?: number;
      segments?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      radius = 1,
      segments = 64,
      name,
    } = options;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a tetrahedron geometry (triangle-based pyramid).
   *
   * @param options - Tetrahedron creation options
   * @returns Configured THREE.Mesh
   */
  static createTetrahedron(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      radius?: number;
      detail?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      radius = 10,
      detail = 0,
      name,
    } = options;
    const geometry = new THREE.TetrahedronGeometry(radius, detail);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a torus geometry (donut shape).
   *
   * @param options - Torus creation options
   * @returns Configured THREE.Mesh
   */
  static createTorus(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      radius?: number;
      tubeRadius?: number;
      segments?: number;
      tubeSegments?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      radius = 10,
      tubeRadius = 5,
      segments = 16,
      tubeSegments = 32,
      name,
    } = options;
    const geometry = new THREE.TorusGeometry(
      radius,
      tubeRadius,
      segments,
      tubeSegments,
    );
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a plane geometry.
   *
   * @param options - Plane creation options
   * @returns Configured THREE.Mesh
   */
  static createPlane(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      width?: number;
      height?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      width = 10,
      height = 10,
      name,
    } = options;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a cylinder geometry.
   *
   * @param options - Cylinder creation options
   * @returns Configured THREE.Mesh
   */
  static createCylinder(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      radiusTop?: number;
      radiusBottom?: number;
      height?: number;
      segments?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      radiusTop = 10,
      radiusBottom = 10,
      height = 20,
      segments = 32,
      name,
    } = options;
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      segments,
    );
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a cone geometry.
   *
   * @param options - Cone creation options
   * @returns Configured THREE.Mesh
   */
  static createCone(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      radius?: number;
      height?: number;
      segments?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      radius = 10,
      height = 20,
      segments = 32,
      name,
    } = options;
    const geometry = new THREE.ConeGeometry(radius, height, segments);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a circle geometry.
   *
   * @param options - Circle creation options
   * @returns Configured THREE.Mesh
   */
  static createCircle(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      radius?: number;
      segments?: number;
      name?: string;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      radius = 10,
      segments = 32,
      name,
    } = options;
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a ring geometry (annulus).
   *
   * @param options - Ring creation options
   * @returns Configured THREE.Mesh
   */
  static createRing(
    options: {
      x?: number;
      y?: number;
      z?: number;
      size?: number;
      color?: number;
      wireframe?: boolean;
      innerRadius?: number;
      outerRadius?: number;
      segments?: number;
      name?: string;
      material?: THREE.Material;
    } = {},
  ): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      innerRadius = 5,
      outerRadius = 10,
      segments = 32,
      name,
      material,
    } = options;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);
    const meshMaterial =
      material ||
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        wireframe,
      });
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;
    return mesh;
  }

  /**
   * Creates a star field using points geometry.
   *
   * @param amount - Number of stars to create
   * @param color - Hex color value
   * @param size - Point size (default: 1)
   * @param spread - Spread distance for random positioning (default: 2000)
   * @returns Configured THREE.Points
   */
  static createStars(
    amount: number,
    color: number = 0xffffff,
    size: number = 1,
    spread: number = 2000,
  ): THREE.Points {
    const vertices: number[] = [];

    for (let i = 0; i < amount; i++) {
      const x = THREE.MathUtils.randFloatSpread(spread);
      const y = THREE.MathUtils.randFloatSpread(spread);
      const z = THREE.MathUtils.randFloatSpread(spread);

      vertices.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );

    const material = new THREE.PointsMaterial({
      color,
      size,
    });

    return new THREE.Points(geometry, material);
  }
}
