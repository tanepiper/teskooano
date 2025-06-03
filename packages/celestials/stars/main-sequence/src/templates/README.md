# Main Sequence Star Templates

This directory contains templates for implementing new spectral classes of main sequence stars.

## How to Use the Templates

1. Create a new directory in the `src` directory for your spectral class (e.g., `src/class-k/`).
2. Copy the template files from `src/templates/spectral-class-template/` to your new directory.
3. Rename the files to match your spectral class (e.g., `renderer.ts` remains the same, but you might want to rename the classes inside).
4. Replace all instances of `SpectralClass` with your spectral class name (e.g., `ClassK`).
5. Replace all instances of `[CLASS]` with your spectral class letter (e.g., `K`).
6. Fill in the appropriate default values for your spectral class in the `applySpectralClassDefaults` function.
7. Update the shader uniforms and other renderer options to match the visual characteristics of your spectral class.
8. Update the class documentation to describe your spectral class and provide examples.
9. Export your new classes from your directory's `index.ts` file.
10. Add exports for your new classes to the main `src/index.ts` file.

## Template Files

- `spectral-class-template/celestial.ts`: Template for a spectral class celestial object.
- `spectral-class-template/renderer.ts`: Template for a spectral class renderer.
- `spectral-class-template/index.ts`: Template for exporting your spectral class implementation.

## Example Implementation

To implement a K-class star:

1. Copy the template files to `src/class-k/`.
2. Replace `SpectralClass` with `ClassK` in all files.
3. Replace `[CLASS]` with `K` in all files.
4. Fill in the appropriate default values for K-class stars in the `applyClassKDefaults` function.
5. Update the shader uniforms for K-class stars (typically orange/red).
6. Update the class documentation to describe K-class stars and provide examples.
7. Export your classes from `src/class-k/index.ts`.
8. Add `export * from './class-k';` to `src/index.ts`.

## References for Spectral Classes

When implementing a new spectral class, use these references for accurate physical properties:

- O-class: Blue stars (30,000-50,000K)
- B-class: Blue-white stars (10,000-30,000K)
- A-class: White stars (7,500-10,000K)
- F-class: Yellow-white stars (6,000-7,500K)
- G-class: Yellow stars (5,200-6,000K)
- K-class: Orange stars (3,700-5,200K)
- M-class: Red dwarfs (2,400-3,700K)

For detailed physical properties for each subclass (e.g., K0 through K9), refer to astronomical databases and literature.
