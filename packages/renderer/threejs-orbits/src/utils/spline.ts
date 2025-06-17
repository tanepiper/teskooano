import { OSVector3 } from "@teskooano/core-math";

/**
 * Generates points for a Catmull-Rom spline.
 * The curve will pass through all the given points.
 *
 * @param points - An array of OSVector3 points that define the spline.
 * @param totalPointBudget - The total number of points to generate for the spline.
 * @param tension - The "tightness" of the curve. 0 is loose, 1 is tight. Defaults to 0.5.
 * @returns An array of OSVector3 points representing the smoothed curve.
 */
export function catmullRomSpline(
  points: OSVector3[],
  totalPointBudget: number,
  tension = 0.5,
): OSVector3[] {
  if (points.length < 2) {
    return points;
  }

  const numSegments = points.length - 1;
  const pointsPerSegment = Math.max(
    1,
    Math.floor(totalPointBudget / numSegments),
  );

  const res: OSVector3[] = [];
  const p = [...points];

  // To draw a curve through all points, we need to add "virtual" points
  // at the beginning and end of the sequence.
  p.unshift(points[0]);
  p.push(points[points.length - 1]);

  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2];

    for (let t = 0; t < pointsPerSegment; t++) {
      const t2 = t / pointsPerSegment;
      const t3 = t2 * t2;
      const t4 = t3 * t2;

      const s = tension;

      const a1 = -s * t4 + 2 * s * t3 - s * t2;
      const a2 = (2 - s) * t4 + (s - 3) * t3 + 1;
      const a3 = (s - 2) * t4 + (3 - 2 * s) * t3 + s * t2;
      const a4 = s * t4 - s * t3;

      const x = p0.x * a1 + p1.x * a2 + p2.x * a3 + p3.x * a4;
      const y = p0.y * a1 + p1.y * a2 + p2.y * a3 + p3.y * a4;
      const z = p0.z * a1 + p1.z * a2 + p2.z * a3 + p3.z * a4;

      res.push(new OSVector3(x, y, z));
    }
  }

  // Add the last point to make sure the curve is complete
  res.push(points[points.length - 1]);

  return res;
}
