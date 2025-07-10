# Celestial Icons

This plugin provides enhanced celestial object icons with special support for exotic star types and visual effects.

## Features

### Star Icons

- **Main Sequence Stars**: Spectral class-based gradients (O, B, A, F, G, K, M, L, T, Y)
- **Exotic Stellar Types**: Special visual effects for different star types:
  - **Pulsars/Magnetars**: Animated beam effects
  - **Black Holes**: Accretion disk with event horizon
  - **White Dwarfs**: Subtle core glow effect
  - **Protostars**: Irregular shape with pulsing animation
  - **Wolf-Rayet Stars**: Large, bright appearance
  - **Quasars**: Intense glow effects
  - **T Tauri & Herbig Ae/Be**: Young star effects

### Planet Icons

- **Terrestrial Planets**: Blue gradient for Earth-like worlds
- **Gas Giants**: Complex banded appearance with atmospheric glow
- **Moons**: Simplified appearance based on composition
- **Rings**: Visual ring systems for planets and gas giants
- **Atmospheres**: Glow effects for bodies with atmospheres

### Other Celestial Objects

- **Comets**: Bright head with animated tail
- **Asteroid Fields**: Ring representation
- **Ring Systems**: Dedicated ring icons

## Usage

The `<celestial-icon>` component accepts a configuration object that defines the visual appearance:

```typescript
const config = {
  base: {
    type: "star" | "planet",
    color: "#FFFFFF",
    gradient?: [string, string],
    radius?: number
  },
  atmosphere?: {
    color: string,
    size: number
  },
  rings?: {
    color: string,
    angle: number
  },
  special?: "pulsar" | "black-hole" | "white-dwarf" | "protostar",
  tail?: {
    color: string,
    angle: number,
    length: number
  }
};
```

## Configuration Generation

The `generateIconConfig()` function automatically creates appropriate configurations based on celestial object properties:

- **Stellar Type**: Uses `StellarType` and `ExoticStellarType` for special effects
- **Spectral Class**: Applies appropriate color gradients for main sequence stars
- **Planet Type**: Uses `PlanetType` for terrestrial and gas giant appearances
- **Atmospheric Properties**: Adds glow effects for bodies with atmospheres
- **Ring Systems**: Detects and renders ring configurations

## Visual Effects

### Animated Effects

- **Pulsar Beams**: Rotating beam lines with staggered opacity
- **Black Hole Disk**: Rotating accretion disk with event horizon
- **Protostar Pulse**: Breathing animation for young stars

### Static Effects

- **Atmospheric Glow**: Blurred stroke effects for atmospheres
- **Ring Systems**: Elliptical rings with configurable angles
- **Comet Tails**: Directional tail effects

## Architecture

The plugin follows a modular architecture:

- **Config Generator**: Creates icon configurations from celestial object data
- **Icon Component**: Renders SVG-based icons with special effects
- **Type System**: Comprehensive TypeScript types for all configurations
- **Test Suite**: Comprehensive tests for all star types and fallback behaviors
