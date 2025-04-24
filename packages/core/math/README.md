# @teskooano/core-math

This package provides core mathematical types, constants, and utility functions for the Teskooano engine.

## Features

- **`OSVector3`**: A custom 3D vector class for internal engine calculations (Y-up coordinate system).
- **Constants**: Common mathematical constants (PI, EPSILON, etc.).
- **Utilities**: A collection of math utilities (`clamp`, `lerp`, `degToRad`, etc.) and general helpers (`generateUUID`, `debounce`, `throttle`, `memoize`).

## Installation

This is an internal package and typically used as a workspace dependency within the Teskooano monorepo.

## Usage

```typescript
import { OSVector3, constants, utils } from "@teskooano/core-math";

const vec1 = new OSVector3(1, 2, 3);
const vec2 = new OSVector3(4, 5, 6);

vec1.add(vec2);
console.log(vec1.toString()); // Output similar to: (5.000e+0, 7.000e+0, 9.000e+0)

const clampedValue = utils.clamp(15, 0, 10); // 10

const radians = utils.degToRad(90); // Math.PI / 2
```
