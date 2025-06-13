import * as THREE from "three";
import { StarFieldLayerOptions } from "./types";

/**
 * Creates a single layer of stars as a `THREE.Points` object based on provided options.
 * Stars are distributed spherically around the origin.
 *
 * @returns A `THREE.Points` object representing the star field layer.
 */
export function createStarField(
  baseDistance: number,
  options: StarFieldLayerOptions,
): THREE.Points {
  const {
    count,
    distanceMultiplier,
    distanceSpread,
    minBrightness,
    maxBrightness,
    size = 4.0,
    colorTint,
  } = options;

  const starGeometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];

  const starColors = [
    new THREE.Color("#FFFFFF"),
    new THREE.Color("#FFE4B5"),
    new THREE.Color("#B0C4DE"),
    new THREE.Color("#FFB6C1"),
    new THREE.Color("#87CEEB"),
    new THREE.Color("#FFA07A"),
  ];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius =
      baseDistance * distanceMultiplier + Math.random() * distanceSpread;

    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    );

    const baseColor = starColors[Math.floor(Math.random() * starColors.length)];
    const starColor = new THREE.Color();

    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);

    const newColor = new THREE.Color().setHSL(
      hsl.h + (Math.random() * 0.1 - 0.05),
      hsl.s * (0.5 + Math.random() * 0.5),
      minBrightness + Math.random() * (maxBrightness - minBrightness),
    );

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
