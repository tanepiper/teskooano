# @teskooano/data-types

## Overview
The data-types package provides TypeScript interfaces and types for the Open Space game. It defines the core data structures used throughout the application, ensuring type safety and consistency across the codebase.

## Features
- Celestial object types and interfaces
- Vector and quaternion types for 3D space
- Game state type definitions
- Type-safe enums for celestial object types

## API

### CelestialObject
```typescript
interface CelestialObject {
  id: string;
  name: string;
  type: CelestialType;
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  mass: number;
  radius: number;
}
```

### CelestialType
```typescript
enum CelestialType {
  STAR = 'STAR',
  PLANET = 'PLANET',
  MOON = 'MOON',
  ASTEROID = 'ASTEROID'
}
```

### Vector3
```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}
```

### Quaternion
```typescript
interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}
```

## Testing
The package includes comprehensive tests in `index.spec.ts` that verify:
- Type definitions and interfaces
- Enum values and their validity
- Vector and quaternion operations
- Celestial object structure validation

## Usage
```typescript
import { CelestialObject, CelestialType } from '@teskooano/data-types';

const planet: CelestialObject = {
  id: 'earth',
  name: 'Earth',
  type: CelestialType.PLANET,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  mass: 5.972e24,
  radius: 6371
};
``` 