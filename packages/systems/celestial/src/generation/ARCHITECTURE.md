## Procedural Generation Analysis

This directory contains modules responsible for generating procedural content, primarily textures for celestial bodies.

**Core Components:**

1.  **`diamond-square.ts`** (DEPRECATED/UNUSED based on `procedural-texture.ts`): Contains an implementation of the Diamond-Square algorithm for generating 2D heightmaps.
    *   Includes helper functions for seeded random number generation (`mulberry32`), wrapped matrix access (`getValueWrap`), color manipulation (`hexToRgb`, `interpolateRgb`, `rgbToCssString`), `smoothstep`, and a complex `getColorForHeight` function to map height values to colors based on various `SurfacePropertiesUnion` types.
    *   Implements the core `diamondSquare` algorithm logic (`calculateSquare`, `calculateDiamond`).
    *   Includes functions to normalize the heightmap (`normalizeMatrix`) and draw it to an `OffscreenCanvas` (`drawToCanvas`).
    *   Provides a function `generateNormalMapFromHeightMatrix` to compute a normal map from the generated heightmap.
    *   Exports `generateTerrainTexture` which orchestrates the Diamond-Square process, color mapping, and normal map generation, returning both canvases.
    *   *Note: While present, this file appears to be superseded by the Simplex Noise approach in `procedural-texture.ts` for generating the primary terrain textures mentioned in the terrestrial renderer.* The terrestrial renderer currently imports `generateTerrainTexture` from `procedural-texture.ts`, not `diamond-square.ts`.

2.  **`procedural-texture.ts`**: The primary module for generating procedural terrain textures using 3D Simplex Noise.
    *   Uses the `simplex-noise` library (`createNoise3D`).
    *   Includes many of the *same* helper functions as `diamond-square.ts` for color manipulation (`hexToRgb`, `interpolateRgb`, `rgbToCssString`), `smoothstep`, and the crucial `getColorForHeight` logic for mapping height to color based on `SurfacePropertiesUnion`.
    *   **Key Function**: `mapEquirectangularToSphere(u, v)` converts 2D texture coordinates (UV) to 3D coordinates on a unit sphere. This is essential for sampling the 3D noise function to create seamless spherical textures.
    *   **`drawColorCanvasFromNoise(...)`**: The core drawing function.
        *   Takes an `OffscreenCanvas`, a 3D noise function (`noiseFunc`), surface properties, and noise parameters (scale, octaves, persistence, lacunarity).
        *   Iterates through canvas pixels (x, y).
        *   Converts pixel coordinates (x, y) to UV coordinates (u, v).
        *   Maps UV to 3D sphere coordinates using `mapEquirectangularToSphere`.
        *   Samples the 3D `noiseFunc` at the calculated sphere coordinates (scaled by `noiseScale`) using multiple octaves (controlled by `noiseOctaves`, `noisePersistence`, `noiseLacunarity`) to generate a height value.
        *   Normalizes the height value to the 0-1 range.
        *   Determines the final color using `getColorForHeight` based on the normalized height and `surfaceProperties`.
        *   Draws the colored pixel onto the canvas.
        *   Returns the generated heightmap as a 2D number array.
    *   **`generateNormalMapFromHeightData(...)`**: Generates a normal map canvas from a 2D heightmap array. Uses central differencing to calculate slopes and encodes the resulting normal vector into RGB values.
    *   **`generateTerrainTexture(...)`**: The main exported function.
        *   Takes a `seed` and options (surface properties, canvas size, noise parameters, normal strength).
        *   Creates a 3D noise function using `createNoise3D` seeded with the provided `seed`.
        *   Creates an `OffscreenCanvas` for the color texture.
        *   Calls `drawColorCanvasFromNoise` to generate the color texture and get the raw heightmap data.
        *   Calls `generateNormalMapFromHeightData` to generate the normal map canvas using the heightmap data.
        *   Caches the generated textures (color and normal canvases, plus heightmap) in a `Map` (`textureCache`) using a key derived from the seed and options.
        *   Returns the `GeneratedTerrainTextures` object containing both canvases and the heightmap data.

**Key Characteristics & Design:**

*   **Procedural Noise**: Primarily uses 3D Simplex Noise (`simplex-noise` library) for generating heightmaps suitable for seamless spherical mapping.
*   **Height-to-Color Mapping**: Implements detailed logic (`getColorForHeight`) to translate normalized height values into specific colors based on different planetary surface property types (`ProceduralSurfaceProperties`, `DesertSurfaceProperties`, `IceSurfaceProperties`, etc.), including smooth blending between color bands.
*   **Spherical Projection**: Correctly maps 2D texture coordinates to 3D sphere coordinates (`mapEquirectangularToSphere`) before sampling the 3D noise function, which is crucial for creating textures that wrap seamlessly around a sphere.
*   **Normal Map Generation**: Includes functionality to generate normal maps directly from the heightmap data, allowing for surface detail lighting effects.
*   **OffscreenCanvas**: Uses `OffscreenCanvas` for potentially better performance by allowing texture generation off the main thread (though currently not explicitly using Workers).
*   **Configuration**: Texture generation is configurable via options passed to `generateTerrainTexture`, controlling noise parameters, surface appearance, and output size.
*   **Caching**: Implements a simple in-memory cache (`textureCache`) to avoid regenerating textures with the same parameters.
*   **Code Duplication**: Significant duplication of helper functions (color manipulation, `getColorForHeight`) exists between `diamond-square.ts` and `procedural-texture.ts`. Given `diamond-square.ts` appears unused for terrain, its helpers could potentially be removed or centralized. 