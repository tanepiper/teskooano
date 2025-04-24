import * as THREE from "three";

/**
 * Creates a single layer of stars as a `THREE.Points` object.
 * Stars are distributed spherically around the origin.
 *
 * @param count - The number of stars (points) in this layer.
 * @param baseDistance - The average distance of stars from the origin.
 * @param distanceSpread - The random variation added to the base distance for each star.
 * @param minBrightness - The minimum HSL lightness value for star colors (0-1).
 * @param maxBrightness - The maximum HSL lightness value for star colors (0-1).
 * @param size - The base size of each star point.
 * @param colorTint - An optional `THREE.Color` to subtly tint all stars in this layer.
 * @returns A `THREE.Points` object representing the star field layer.
 */
export function createStarField(
  count: number,
  baseDistance: number,
  distanceSpread: number,
  minBrightness: number,
  maxBrightness: number,
  size: number = 4.0,
  colorTint?: THREE.Color,
): THREE.Points {
  const starGeometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];

  // Define some star colors for variation
  const starColors = [
    new THREE.Color("#FFFFFF"), // White
    new THREE.Color("#FFE4B5"), // Moccasin (warm white)
    new THREE.Color("#B0C4DE"), // Light steel blue
    new THREE.Color("#FFB6C1"), // Light pink
    new THREE.Color("#87CEEB"), // Sky blue
    new THREE.Color("#FFA07A"), // Light salmon
  ];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = baseDistance + Math.random() * distanceSpread;

    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    );

    // Create color variation
    const baseColor = starColors[Math.floor(Math.random() * starColors.length)];
    const starColor = new THREE.Color();

    // Get HSL components
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);

    // Add some random variation to the color
    const newColor = new THREE.Color().setHSL(
      hsl.h + (Math.random() * 0.1 - 0.05), // Slight hue variation
      hsl.s * (0.5 + Math.random() * 0.5), // Moderate saturation variation
      minBrightness + Math.random() * (maxBrightness - minBrightness), // Brightness within specified range
    );

    // If a color tint is provided, blend with it
    if (colorTint) {
      newColor.lerp(colorTint, 0.3);
    }

    colors.push(newColor.r, newColor.g, newColor.b);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  starGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3),
  );

  const starMaterial = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    depthWrite: false,
    fog: false,
  });

  return new THREE.Points(starGeometry, starMaterial);
}

/**
 * Creates multiple star field layers with varying densities, brightnesses, sizes, and tints
 * to simulate depth. Uses `createStarField` internally for each layer.
 *
 * @returns An array of `THREE.Points` objects, each representing a star field layer.
 */
export function createStarLayers(): THREE.Points[] {
  const baseDistance = 9000000;
  const starLayers: THREE.Points[] = [];

  // Create closest layer - fewer, brighter stars with warm tint
  const closeLayer = createStarField(
    10000, // count
    baseDistance * 0.5, // baseDistance
    400000, // distanceSpread
    0.9, // minBrightness
    1.0, // maxBrightness
    5.0, // size
    new THREE.Color("#FFE4B5").multiplyScalar(0.3), // Warm tint
  );
  starLayers.push(closeLayer);

  // Create middle layer - medium density with slight blue tint
  const middleLayer = createStarField(
    20000, // count
    baseDistance, // baseDistance
    500000, // distanceSpread
    0.7, // minBrightness
    0.9, // maxBrightness
    4.0, // size
    new THREE.Color("#B0C4DE").multiplyScalar(0.2), // Slight blue tint
  );
  starLayers.push(middleLayer);

  // Create distant layer - many dimmer stars with purple tint
  const distantLayer = createStarField(
    50000, // count
    baseDistance * 1.1, // baseDistance
    600000, // distanceSpread
    0.5, // minBrightness
    0.7, // maxBrightness
    3.0, // size
    new THREE.Color("#9370DB").multiplyScalar(0.2), // Slight purple tint
  );
  starLayers.push(distantLayer);

  return starLayers;
}

/**
 * Updates the colors of stars in each layer to distinct debug colors (Red, Green, Blue)
 * if `isDebugMode` is true. This helps visualize the different layers.
 * If `isDebugMode` is false, this function currently does nothing (it doesn't revert colors).
 *
 * @param starLayers - The array of star field layer `THREE.Points` objects.
 * @param isDebugMode - A boolean flag indicating whether to apply debug colors.
 */
export function updateStarColors(
  starLayers: THREE.Points[],
  isDebugMode: boolean,
): void {
  if (starLayers.length === 3) {
    const debugColors = [
      new THREE.Color("#FF0000"), // Red for close layer
      new THREE.Color("#00FF00"), // Green for middle layer
      new THREE.Color("#0000FF"), // Blue for far layer
    ];

    starLayers.forEach((layer, index) => {
      if (isDebugMode) {
        // In debug mode, set all stars in layer to debug color
        const colors = new Float32Array(
          layer.geometry.attributes.position.count * 3,
        );
        for (let i = 0; i < colors.length; i += 3) {
          colors[i] = debugColors[index].r;
          colors[i + 1] = debugColors[index].g;
          colors[i + 2] = debugColors[index].b;
        }
        layer.geometry.setAttribute(
          "color",
          new THREE.BufferAttribute(colors, 3),
        );
      }
    });
  }
}

/** Base distance used as a reference for creating star layers. */
export const BASE_DISTANCE = 9000000;
