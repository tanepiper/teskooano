import { OSVector3 } from "@teskooano/core-math";

/**
 * Calculates the perpendicular distance from a point to a line segment.
 * @param point - The point.
 * @param lineStart - The start of the line segment.
 * @param lineEnd - The end of the line segment.
 * @returns The perpendicular distance.
 */
function perpendicularDistance(
  point: OSVector3,
  lineStart: OSVector3,
  lineEnd: OSVector3,
): number {
  const lineVec = lineEnd.clone().sub(lineStart);
  const pointVec = point.clone().sub(lineStart);

  const lineLenSq = lineVec.lengthSq();
  if (lineLenSq === 0) {
    return point.distanceTo(lineStart);
  }

  // Project pointVec onto lineVec
  const t = Math.max(0, Math.min(1, pointVec.dot(lineVec) / lineLenSq));
  const projection = lineStart.clone().add(lineVec.multiplyScalar(t));

  return point.distanceTo(projection);
}

/**
 * Simplifies a path using the Ramer-Douglas-Peucker algorithm.
 * @param points - The array of OSVector3 points to simplify.
 * @param epsilon - The maximum distance of a point from the simplified path.
 * @returns A new array with the simplified points.
 */
export function simplifyPath(
  points: OSVector3[],
  epsilon: number,
): OSVector3[] {
  if (points.length < 3) {
    return points;
  }

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    // Recursive call
    const recResults1 = simplifyPath(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyPath(points.slice(index), epsilon);

    // Build the result list
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}
