---
title: Creating a new solar system
description: How to create a new solar system
---

In **Teskooano** you can easily use the procedural generator to create new systems and export them as JSON file, but you can also hand craft systems. This documentation goes over the process of creating a new system, but explaining how the Earth solar system was added.

It's located in `packages/systems/solar-system` and is defined as a node module, allowing full flexibility for creating a system.

## Creating the Package

In your folder in `packages/systems/<system-name>` add the following `package.json` and `tsconfig.json` files

**package.json**

```json
{
  "name": "@teskooano/systems-<system-name>",
  "version": "0.1.0-dev.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.d.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.d.ts"
    }
  },
  "files": ["src"],
  "dependencies": {
    "@teskooano/data-types": "file:../../data/types",
    "@teskooano/core-math": "file:../../core/math",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.1",
    "jsdom": "26.1.0",
    "typescript": "5.8.3",
    "vitest": "3.2.4"
  },
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "test:browser": "vitest run --browser"
  }
}
```

**tsconfig.json**

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@teskooano/data-types": ["../../data/types/src"],
      "@teskooano/core-math": ["../../core/math/src"]
    },
    "noEmit": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"],
  "references": [
    {
      "path": "../../data/types"
    },
    {
      "path": "../../core/math"
    }
  ]
}
```

Create a `src` folder with an `index.ts` - this will hold the `initializeSolarSystem()` function we need later

## Stucturing your system

The following stucture is recommended for your files, to follow the parent stucture of planets and then anything orbiting it

```
- src/
    - index.ts
    - <celestial>/
        - <celestial.ts>
        - moons/
            - <moon1.ts>
            - <moon2.ts>
            - index.ts
        - satellites/
            - <satellite1.ts>
            - index.ts

```

### Crafting a Celestial

Let's look at Earth below - it has some properties, the most important for the renderer hierachy being `id` and `parentId`

```ts
/**
 * Earth configuration object for modular solar system initialization.
 */
export const earth: CelestialObject<PlanetProperties> = {
  id: "earth",
  name: "Earth",
  seed: "earth",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 5.972168e24,
  realRadius_m: kmToM(6371.0),
  temperature: 255,
  albedo: 0.294,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1.0000010178,
    eccentricity: 0.0167086,
    inclinationDeg: 0.00005,
    longitudeOfAscendingNodeDeg: -11.26064,
    argumentOfPeriapsisDeg: 114.20783,
    meanAnomalyDeg: 358.617,
    period_s: 365.256363004 * 24 * 60 * 60,
    siderealRotationPeriod_s: 86164.09054,
    axialTiltDeg: 23.4392811,
    aphelionAU: 1.0167,
    perihelionAU: 0.98329,
    averageOrbitalSpeedKmps: 29.7827,
    timeOfPerihelion: "2023-01-04",
    epoch: "J2000",
  }),
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.TERRESTRIAL,
    isMoon: false,
    composition: [
      "silicates",
      "iron core",
      "liquid water",
      "nitrogen-oxygen atmosphere",
    ],
    atmosphere: {
      glowColor: "#87CEEB",
      intensity: 0.6,
      power: 1.2,
      thickness: 0.25,
    },
    surface: {
      roughness: 0.12,
      persistence: 0.54,
      lacunarity: 2.2,
      simplePeriod: 18,
      octaves: 9,
      bumpScale: 2.7,
      color1: "#1E3A5F",
      color2: "#3F7CAC",
      color3: "#8FBC8F",
      color4: "#9ACD32",
      color5: "#FFFAFA",
      height1: 0,
      height2: 0.09,
      height3: 0.26,
      height4: 0.4,
      height5: 0.67,
      shininess: 20,
      specularStrength: 0.15,
      ambientLightIntensity: 0.01,
      undulation: 0.8,
      terrainType: 3,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.7,
      terrainOffset: -0.5,
    },
  },
};
```
