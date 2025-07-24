import * as THREE from "three";
import { BufferPool } from "../memory/BufferPool";

/**
 * Comprehensive utility class for creating and managing THREE.js lines and curves.
 *
 * This class provides methods to efficiently create, update, and manage
 * line geometries with buffer reuse for optimized memory usage. It also
 * includes utilities for creating various types of curves and complex line patterns.
 */
export class LineHelper {
  /** Buffer pool for efficient memory management */
  private bufferPool: BufferPool;

  /**
   * Creates a new LineHelper instance.
   *
   * @param maxCachedBufferSize - The maximum size of buffer to keep in the cache
   */
  constructor(maxCachedBufferSize = 10000) {
    this.bufferPool = new BufferPool(maxCachedBufferSize);
  }

  /**
   * Creates a new THREE.js Line with a buffered geometry of the given size.
   *
   * @param size - The number of points the line can hold
   * @param material - The material to use for the line
   * @param name - Optional name for the line
   * @returns A new THREE.js Line object
   */
  createLine(
    size: number,
    material: THREE.Material,
    name?: string,
  ): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = this.bufferPool.getBuffer(size);

    geometry.setAttribute("position", positionAttribute);
    geometry.setDrawRange(0, 0);

    const line = new THREE.Line(geometry, material);

    if (name) {
      line.name = name;
    }

    line.frustumCulled = false;
    return line;
  }

  /**
   * Updates an existing line with new points.
   *
   * @param line - The line to update
   * @param points - The new points to display
   * @param maxPoints - The maximum number of points to display
   * @returns The updated line
   */
  updateLine(
    line: THREE.Line,
    points: THREE.Vector3[],
    maxPoints: number,
  ): THREE.Line {
    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;

    const numPointsToDraw = Math.min(
      points.length,
      maxPoints,
      positionAttribute.count,
    );

    // Update the points
    for (let i = 0; i < numPointsToDraw; i++) {
      const point = points[i];
      const offset = i * 3;

      const positions = positionAttribute.array as Float32Array;
      positions[offset] = point.x;
      positions[offset + 1] = point.y;
      positions[offset + 2] = point.z;
    }

    positionAttribute.needsUpdate = true;
    geometry.setDrawRange(0, numPointsToDraw);

    return line;
  }

  /**
   * Resizes a line's buffer capacity if needed.
   *
   * @param line - The line to resize
   * @param newCapacity - The new capacity needed
   * @returns The line with updated buffer capacity
   */
  resizeLineBuffer(line: THREE.Line, newCapacity: number): THREE.Line {
    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;
    const existingCapacity = positionAttribute.count;

    if (existingCapacity >= newCapacity) {
      return line; // No need to resize
    }

    // Get a new buffer from the pool
    const newPositionAttribute = this.bufferPool.getBuffer(newCapacity);

    // Copy existing data to the new buffer
    const newPositions = newPositionAttribute.array as Float32Array;
    newPositions.set(positionAttribute.array.slice(0, existingCapacity * 3));

    // Return the old buffer to the pool
    this.bufferPool.releaseBuffer(positionAttribute, existingCapacity);

    // Set the new buffer
    geometry.deleteAttribute("position");
    geometry.setAttribute("position", newPositionAttribute);

    return line;
  }

  /**
   * Properly disposes a line and returns its buffer to the pool.
   *
   * @param line - The line to dispose
   */
  disposeLine(line: THREE.Line): void {
    if (!line.geometry) return;

    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;

    if (positionAttribute) {
      // Return the buffer to the pool
      this.bufferPool.releaseBuffer(positionAttribute, positionAttribute.count);

      // Remove the attribute from the geometry
      geometry.deleteAttribute("position");
    }

    // Dispose the material if needed
    if (line.material instanceof THREE.Material) {
      line.material.dispose();
    } else if (Array.isArray(line.material)) {
      line.material.forEach((mat) => mat.dispose());
    }
  }

  /**
   * Clears all cached buffers.
   */
  clear(): void {
    this.bufferPool.clear();
  }

  //-------- ----------
  // CURVE CREATION HELPERS
  //-------- ----------

  /**
   * Creates points for a spiral curve.
   *
   * @param len - Number of points to generate
   * @param rotationCount - Number of rotations (default: 8)
   * @param height - Total height of the spiral (default: 5)
   * @param maxRadius - Maximum radius of the spiral (default: 5)
   * @returns Array of Vector3 points
   */
  static createSpiralPoints(
    len: number,
    rotationCount: number = 8,
    height: number = 5,
    maxRadius: number = 5,
  ): THREE.Vector3[] {
    const yDelta = height / len;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < len; i++) {
      const per = i / (len - 1);
      const radian = Math.PI * 2 * rotationCount * per;
      const radius = maxRadius * per;
      const v = new THREE.Vector3();
      v.x = Math.cos(radian) * radius;
      v.z = Math.sin(radian) * radius;
      v.y = i * yDelta;
      points.push(v);
    }

    return points;
  }

  /**
   * Updates a group of lines with spiral patterns.
   *
   * @param lines - Group containing line objects
   * @param rs - Base rotation count
   * @param rDelta - Rotation delta per line
   * @param height - Height of the spiral
   * @param radius - Radius of the spiral
   */
  static updateLinesGroup(
    lines: THREE.Group,
    rs: number,
    rDelta: number,
    height: number,
    radius: number,
  ): void {
    lines.children.forEach((line, i) => {
      const per = (i + 1) / lines.children.length;
      const points = this.createSpiralPoints(
        150,
        rs + rDelta * per,
        height,
        radius,
      );
      (line as THREE.Line).geometry.setFromPoints(points);
    });
  }

  /**
   * Creates a group of spiral lines with different parameters.
   *
   * @param lineCount - Number of lines to create
   * @param colors - Array of colors for the lines
   * @param baseRotation - Base rotation count
   * @param rotationDelta - Rotation delta per line
   * @param height - Height of the spiral
   * @param radius - Radius of the spiral
   * @returns Group containing all the lines
   */
  static createSpiralLinesGroup(
    lineCount: number = 12,
    colors: number[] = [
      0x00ff00, 0xff0000, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00,
    ],
    baseRotation: number = 1,
    rotationDelta: number = 0.2,
    height: number = 0,
    radius: number = 5,
  ): THREE.Group {
    const lines = new THREE.Group();
    lines.name = "spiral-lines-group";

    for (let i = 0; i < lineCount; i++) {
      const per = i / lineCount;
      const points = this.createSpiralPoints(
        100,
        baseRotation + rotationDelta * per,
        height,
        radius,
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: colors[i % colors.length],
          linewidth: 6,
        }),
      );
      lines.add(line);
    }

    return lines;
  }

  //-------- ----------
  // CURVE UTILITIES
  //-------- ----------

  /**
   * Creates a line curve between two points.
   *
   * @param start - Start point
   * @param end - End point
   * @param pointCount - Number of points to generate (default: 20)
   * @returns Array of Vector3 points
   */
  static createLineCurve(
    start: THREE.Vector3,
    end: THREE.Vector3,
    pointCount: number = 20,
  ): THREE.Vector3[] {
    const curve = new THREE.LineCurve3(start, end);
    return curve.getPoints(pointCount);
  }

  /**
   * Creates a quadratic Bezier curve.
   *
   * @param start - Start point
   * @param control - Control point
   * @param end - End point
   * @param pointCount - Number of points to generate (default: 20)
   * @returns Array of Vector3 points
   */
  static createQuadraticBezierCurve(
    start: THREE.Vector3,
    control: THREE.Vector3,
    end: THREE.Vector3,
    pointCount: number = 20,
  ): THREE.Vector3[] {
    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    return curve.getPoints(pointCount);
  }

  /**
   * Creates a cubic Bezier curve.
   *
   * @param start - Start point
   * @param control1 - First control point
   * @param control2 - Second control point
   * @param end - End point
   * @param pointCount - Number of points to generate (default: 20)
   * @returns Array of Vector3 points
   */
  static createCubicBezierCurve(
    start: THREE.Vector3,
    control1: THREE.Vector3,
    control2: THREE.Vector3,
    end: THREE.Vector3,
    pointCount: number = 20,
  ): THREE.Vector3[] {
    const curve = new THREE.CubicBezierCurve3(start, control1, control2, end);
    return curve.getPoints(pointCount);
  }

  /**
   * Creates a custom curve using a function.
   *
   * @param curveFunction - Function that takes t (0-1) and returns a Vector3
   * @param pointCount - Number of points to generate (default: 50)
   * @returns Array of Vector3 points
   */
  static createCustomCurve(
    curveFunction: (t: number) => THREE.Vector3,
    pointCount: number = 50,
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < pointCount; i++) {
      const t = i / (pointCount - 1);
      points.push(curveFunction(t));
    }

    return points;
  }

  /**
   * Creates a curve path from multiple curves.
   *
   * @param curves - Array of curves to combine
   * @param pointCount - Number of points to generate (default: 50)
   * @returns Array of Vector3 points
   */
  static createCurvePath(
    curves: THREE.Curve<THREE.Vector3>[],
    pointCount: number = 50,
  ): THREE.Vector3[] {
    const curvePath = new THREE.CurvePath();
    curves.forEach((curve) => curvePath.add(curve));
    return curvePath.getSpacedPoints(pointCount) as THREE.Vector3[];
  }

  //-------- ----------
  // GEOMETRY CREATION
  //-------- ----------

  /**
   * Creates a line from points with a material.
   *
   * @param points - Array of Vector3 points
   * @param material - Material for the line
   * @param name - Optional name for the line
   * @returns THREE.Line object
   */
  static createLineFromPoints(
    points: THREE.Vector3[],
    material: THREE.LineBasicMaterial | THREE.LineDashedMaterial,
    name?: string,
  ): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    if (name) {
      line.name = name;
    }

    return line;
  }

  /**
   * Creates a points object from an array of points.
   *
   * @param points - Array of Vector3 points
   * @param material - Material for the points
   * @param name - Optional name for the points object
   * @returns THREE.Points object
   */
  static createPointsFromPoints(
    points: THREE.Vector3[],
    material: THREE.PointsMaterial,
    name?: string,
  ): THREE.Points {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const pointsObject = new THREE.Points(geometry, material);

    if (name) {
      pointsObject.name = name;
    }

    return pointsObject;
  }

  //-------- ----------
  // ANIMATION HELPERS
  //-------- ----------

  /**
   * Updates a geometry with new points from a curve.
   *
   * @param curve - The curve to sample points from
   * @param geometry - The geometry to update
   * @param alpha - Alpha value for curve sampling (0-1)
   * @param smoothing - Smoothing factor for alpha interpolation (0-1)
   */
  static updateGeometryFromCurve(
    curve: THREE.Curve<THREE.Vector3>,
    geometry: THREE.BufferGeometry,
    alpha: number = 1,
    smoothing: number = 0,
  ): void {
    const positionAttribute = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const count = positionAttribute.count;

    for (let i = 0; i < count; i++) {
      const linearAlpha = i / (count - 1);
      const smoothAlpha = THREE.MathUtils.smootherstep(linearAlpha, 0, 1);
      const finalAlpha = THREE.MathUtils.lerp(
        linearAlpha,
        smoothAlpha,
        smoothing,
      );
      const point = curve.getPoint(finalAlpha * alpha);

      positionAttribute.setXYZ(i, point.x, point.y, point.z);
    }

    positionAttribute.needsUpdate = true;
  }

  /**
   * Creates an alpha function from a curve for animation.
   *
   * @param curve - The curve to create the alpha function from
   * @param grain - Number of samples for the curve (default: 100)
   * @returns Function that takes n/d and returns alpha value
   */
  static createCurveAlphaFunction(
    curve: THREE.Curve<THREE.Vector3>,
    grain: number = 100,
  ): (n: number, d: number) => number {
    const points = curve.getPoints(grain);
    const yValues = points.map((v) => v.y);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const range = yMax - yMin;

    return (n: number, d: number) => {
      const alpha = n / d;
      const point = curve.getPoint(alpha);
      return 1 - Math.sqrt(Math.pow(point.y - yMax, 2)) / range;
    };
  }
}
