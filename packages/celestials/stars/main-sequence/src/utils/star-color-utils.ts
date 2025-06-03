import * as THREE from "three";
// We'll need to define or import a type for star properties relevant to color determination.
// For now, let's assume it takes an object with optional spectralClass and color string.

export interface StarColorDeterminationProperties {
  color?: string | number; // Hex string or number
  spectralClass?: string; // e.g., "G2V", "M"
  temperature_k?: number; // Optional: Could be used for more fine-grained color
}

/**
 * Determines the primary color for a star based on its properties.
 * It prioritizes an explicit color, then spectral class, then temperature.
 * Falls back to a default color if no specific color can be determined.
 * @param props - Properties of the star relevant for color determination.
 * @returns A THREE.Color object representing the star's color.
 */
export function getStarColor(
  props: StarColorDeterminationProperties,
): THREE.Color {
  if (props.color) {
    try {
      return new THREE.Color(props.color);
    } catch (e) {
      console.warn(
        `[getStarColor] Invalid color string/number provided: '${props.color}'. Falling back.`,
        e,
      );
    }
  }

  if (props.spectralClass) {
    const mainClass = props.spectralClass.charAt(0).toUpperCase();
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
        return new THREE.Color(0xffdd88); // Yellow
      case "K":
        return new THREE.Color(0xffaa55); // Orange
      case "M":
        return new THREE.Color(0xff6644); // Red
      case "L":
      case "T":
      case "Y":
        return new THREE.Color(0xb65b3a); // Dim reddish-brown
      case "C":
        return new THREE.Color(0xff6040); // Deep red
      case "S":
        return new THREE.Color(0xff735a); // Reddish
      case "W":
        return new THREE.Color(0xcadbff); // Pale blue/white
      // Other specific types like D (White Dwarf), X (Black Hole - though color is tricky)
      // could be handled if needed, but often they'd have an explicit color or shader.
      default:
        break;
    }
  }

  // TODO: Implement color from temperature_k if spectralClass is not sufficient
  // This would involve a black-body radiation approximation (e.g., using a precomputed table or algorithm).
  // if (props.temperature_k) { ... }

  return new THREE.Color(0xffdd88); // Default to a G-type like yellow
}
