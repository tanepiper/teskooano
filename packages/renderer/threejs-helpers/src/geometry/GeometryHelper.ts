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
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param width - Box width (default: 10)
   * @param height - Box height (default: 10)
   * @param depth - Box depth (default: 10)
   * @returns Configured THREE.Mesh
   */
  static createBox(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    width: number = 10,
    height: number = 10,
    depth: number = 10,
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    return mesh;
  }

  /**
   * Creates a sphere geometry with specified parameters.
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param radius - Sphere radius (default: 1)
   * @param segments - Number of segments (default: 64)
   * @returns Configured THREE.Mesh
   */
  static createSphere(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    radius: number = 1,
    segments: number = 64,
  ): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    return mesh;
  }

  /**
   * Creates a tetrahedron geometry (triangle-based pyramid).
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param radius - Radius of the tetrahedron (default: 10)
   * @param detail - Level of detail (default: 0)
   * @returns Configured THREE.Mesh
   */
  static createTetrahedron(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    radius: number = 10,
    detail: number = 0,
  ): THREE.Mesh {
    const geometry = new THREE.TetrahedronGeometry(radius, detail);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    return mesh;
  }

  /**
   * Creates a torus geometry (donut shape).
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param radius - Major radius (default: 10)
   * @param tubeRadius - Minor radius (default: 5)
   * @param segments - Number of segments (default: 16)
   * @param tubeSegments - Number of tube segments (default: 32)
   * @returns Configured THREE.Mesh
   */
  static createTorus(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    radius: number = 10,
    tubeRadius: number = 5,
    segments: number = 16,
    tubeSegments: number = 32,
  ): THREE.Mesh {
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
    return mesh;
  }

  /**
   * Creates a plane geometry.
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param width - Plane width (default: 10)
   * @param height - Plane height (default: 10)
   * @returns Configured THREE.Mesh
   */
  static createPlane(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    width: number = 10,
    height: number = 10,
  ): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    return mesh;
  }

  /**
   * Creates a cylinder geometry.
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param radiusTop - Top radius (default: 10)
   * @param radiusBottom - Bottom radius (default: 10)
   * @param height - Cylinder height (default: 20)
   * @param segments - Number of segments (default: 32)
   * @returns Configured THREE.Mesh
   */
  static createCylinder(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    radiusTop: number = 10,
    radiusBottom: number = 10,
    height: number = 20,
    segments: number = 32,
  ): THREE.Mesh {
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
    return mesh;
  }

  /**
   * Creates a cone geometry.
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param radius - Base radius (default: 10)
   * @param height - Cone height (default: 20)
   * @param segments - Number of segments (default: 32)
   * @returns Configured THREE.Mesh
   */
  static createCone(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    radius: number = 10,
    height: number = 20,
    segments: number = 32,
  ): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(radius, height, segments);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    return mesh;
  }

  /**
   * Creates a circle geometry.
   *
   * @param x - X position
   * @param y - Y position
   * @param z - Z position
   * @param size - Scale factor
   * @param color - Hex color value
   * @param wireframe - Whether to render as wireframe
   * @param radius - Circle radius (default: 10)
   * @param segments - Number of segments (default: 32)
   * @returns Configured THREE.Mesh
   */
  static createCircle(
    x: number,
    y: number,
    z: number,
    size: number = 1,
    color: number = 0xffffff,
    wireframe: boolean = false,
    radius: number = 10,
    segments: number = 32,
  ): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
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
