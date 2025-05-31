import type { StarProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";

/**
 * Determines the primary color for a star based on its properties (explicit color or spectral class).
 * Falls back to a default color (typically for G-type stars) if no specific color can be determined.
 * @param object - The renderable celestial object (star).
 * @returns A THREE.Color object representing the star's color.
 */
export function getStarColor(object: RenderableCelestialObject): THREE.Color {
  const starProps = object.properties as StarProperties;

  if (starProps?.color) {
    try {
      return new THREE.Color(starProps.color);
    } catch (e) {
      console.warn(
        `[getStarColor] Invalid color string provided: '${starProps.color}'. Falling back.`,
        e,
      );
    }
  }

  if (starProps?.spectralClass) {
    // Extract the first letter of the spectral class for broad categorization
    const mainClass = starProps.spectralClass.charAt(0).toUpperCase();
    switch (mainClass) {
      case "O":
        return new THREE.Color(0x9bb0ff); // Bluish
      case "B":
        return new THREE.Color(0xaabfff); // Blue-white
      case "A":
        return new THREE.Color(0xf8f7ff); // White
      case "F":
        return new THREE.Color(0xfff4ea); // Yellow-white
      case "G":
        return new THREE.Color(0xffdd88); // Yellow (adjusted for more saturation)
      case "K":
        return new THREE.Color(0xffaa55); // Orange
      case "M":
        return new THREE.Color(0xff6644); // Red
      case "L": // Brown dwarfs
      case "T":
      case "Y":
        return new THREE.Color(0xb65b3a); // Dim reddish-brown for brown dwarfs
      case "C": // Carbon stars
        return new THREE.Color(0xff6040); // Deep red for carbon stars
      case "S":
        return new THREE.Color(0xff735a); // Reddish for S-type stars
      case "W": // Wolf-Rayet
        return new THREE.Color(0xcadbff); // Pale blue/white for Wolf-Rayet
      default:
        // If spectralClass is something unexpected (e.g. "D" for white dwarf, "X" for black hole)
        // and no explicit color is set, fall back.
        break; // Fall through to default
    }
  }
  // Default color (e.g., for unclassified or if spectral class doesn't match common types)
  return new THREE.Color(0xffdd88); // Default to a G-type like yellow
}
