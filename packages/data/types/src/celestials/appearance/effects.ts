/** Visual properties for atmospheric effects like glows or scattering. */
export interface AtmosphereEffectAppearance {
  glowColor?: string; // Hex string for glow
  intensity?: number; // Glow intensity (0-1)
  power?: number; // Glow power/falloff
  thickness?: number; // Glow thickness/spread
  // Potentially add mieScattering, rayleighScattering parameters for more advanced effects
}

/** Visual properties for cloud layers. */
export interface CloudLayerAppearance {
  color?: string; // Hex string
  opacity?: number; // (0-1)
  coverage?: number; // (0-1)
  speed?: number; // Animation speed
  texture?: string; // Path or identifier for cloud texture
  height?: number; // Relative height of cloud layer
}
