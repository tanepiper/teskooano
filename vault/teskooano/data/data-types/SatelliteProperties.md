---
aliases: [SatelliteProperties]
tags: [data, types, celestial, satellites]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# SatelliteProperties

Properties specific to artificial satellites and spacecraft with 3D models, mission data, and material configuration.

## Overview

The `SatelliteProperties` interface defines properties for man-made satellites and spacecraft including 3D model paths, mission classification, operational status, and enhanced material properties for realistic rendering.

## Interface Definition

```typescript
export interface SatelliteProperties extends SpecificPropertiesBase {
  type: CelestialType.SATELLITE;
  modelPath: string;
  modelScale?: number;
  components?: string[];
  missionType?:
    | "communications"
    | "navigation"
    | "scientific"
    | "military"
    | "commercial"
    | "other";
  operationalStatus?: "active" | "inactive" | "deorbited" | "decommissioned";
  launchDate?: string;
  missionDuration?: number;
  materialProperties?: SatelliteMaterialProperties;
}
```

## Core Properties

### Classification

#### type

```typescript
type: CelestialType.SATELLITE;
```

The fundamental type classification (always SATELLITE).

### 3D Model Properties

#### modelPath

```typescript
modelPath: string;
```

Path to the 3D model file (e.g., FBX, GLB format).

- **Type**: `string`
- **Required**: Yes
- **Format**: File path (e.g., "/models/iss.glb", "/models/hubble.fbx")
- **Usage**: 3D model loading for rendering

#### modelScale

```typescript
modelScale?: number
```

Optional scale factor for the model.

- **Type**: `number`
- **Required**: No
- **Default**: 1.0
- **Usage**: Model size adjustment for proper scaling

### System Components

#### components

```typescript
components?: string[]
```

Optional array listing the main components.

- **Type**: `string[]`
- **Required**: No
- **Examples**: `["solar panels", "communication array"]`, `["telescope", "guidance system"]`
- **Usage**: Information display and system description

### Mission Properties

#### missionType

```typescript
missionType?: "communications" | "navigation" | "scientific" | "military" | "commercial" | "other"
```

Optional mission type classification.

- **Type**: String literal union
- **Required**: No
- **Values**:
  - `"communications"` - Communication satellites
  - `"navigation"` - GPS and navigation systems
  - `"scientific"` - Research and observation missions
  - `"military"` - Defense and surveillance
  - `"commercial"` - Commercial operations
  - `"other"` - Unclassified or mixed missions
- **Usage**: Mission categorization and information display

#### operationalStatus

```typescript
operationalStatus?: "active" | "inactive" | "deorbited" | "decommissioned"
```

Optional operational status.

- **Type**: String literal union
- **Required**: No
- **Values**:
  - `"active"` - Currently operational
  - `"inactive"` - Non-operational but in orbit
  - `"deorbited"` - Deliberately removed from orbit
  - `"decommissioned"` - End of operational life
- **Usage**: Status tracking and visual representation

### Temporal Properties

#### launchDate

```typescript
launchDate?: string
```

Optional launch date as ISO string.

- **Type**: `string`
- **Required**: No
- **Format**: ISO 8601 date string
- **Usage**: Historical tracking and mission timeline

#### missionDuration

```typescript
missionDuration?: number
```

Optional expected mission duration in years.

- **Type**: `number`
- **Required**: No
- **Units**: Years
- **Usage**: Mission planning and lifecycle tracking

### Material Properties

#### materialProperties

```typescript
materialProperties?: SatelliteMaterialProperties
```

Optional custom material properties for enhanced rendering.

```typescript
interface SatelliteMaterialProperties {
  metalness?: number; // Metallic factor for PBR materials (0.0 - 1.0)
  roughness?: number; // Roughness factor for PBR materials (0.0 - 1.0)
  envMapIntensity?: number; // Environment map reflection intensity (0.0 - 2.0)
}
```

**Properties:**

- **metalness**: Metallic factor for PBR materials (0.0 - 1.0)
- **roughness**: Roughness factor for PBR materials (0.0 - 1.0)
- **envMapIntensity**: Environment map reflection intensity (0.0 - 2.0)

## Usage Examples

### International Space Station

```typescript
const issProperties: SatelliteProperties = {
  type: CelestialType.SATELLITE,
  modelPath: "/models/iss.glb",
  modelScale: 1.0,
  components: [
    "solar panels",
    "communication array",
    "docking ports",
    "laboratory modules",
    "robotic arm",
    "thermal radiators",
  ],
  missionType: "scientific",
  operationalStatus: "active",
  launchDate: "1998-11-20",
  missionDuration: 25,
  materialProperties: {
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1.0,
  },
};
```

### Hubble Space Telescope

```typescript
const hubbleProperties: SatelliteProperties = {
  type: CelestialType.SATELLITE,
  modelPath: "/models/hubble.glb",
  modelScale: 1.2,
  components: [
    "primary mirror",
    "secondary mirror",
    "scientific instruments",
    "solar panels",
    "guidance system",
    "communication antenna",
  ],
  missionType: "scientific",
  operationalStatus: "active",
  launchDate: "1990-04-24",
  missionDuration: 30,
  materialProperties: {
    metalness: 0.7,
    roughness: 0.3,
    envMapIntensity: 0.8,
  },
};
```

### GPS Satellite

```typescript
const gpsProperties: SatelliteProperties = {
  type: CelestialType.SATELLITE,
  modelPath: "/models/gps_satellite.glb",
  modelScale: 0.8,
  components: [
    "atomic clocks",
    "navigation payload",
    "solar panels",
    "antenna array",
    "attitude control",
  ],
  missionType: "navigation",
  operationalStatus: "active",
  launchDate: "2020-06-30",
  missionDuration: 15,
  materialProperties: {
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1.2,
  },
};
```

### Communications Satellite

```typescript
const commsatProperties: SatelliteProperties = {
  type: CelestialType.SATELLITE,
  modelPath: "/models/communications_sat.glb",
  modelScale: 1.5,
  components: [
    "high-gain antenna",
    "transponders",
    "solar arrays",
    "battery systems",
    "thermal control",
  ],
  missionType: "communications",
  operationalStatus: "active",
  launchDate: "2022-03-15",
  missionDuration: 15,
  materialProperties: {
    metalness: 0.6,
    roughness: 0.4,
    envMapIntensity: 0.9,
  },
};
```

### Decommissioned Satellite

```typescript
const oldSatProperties: SatelliteProperties = {
  type: CelestialType.SATELLITE,
  modelPath: "/models/old_satellite.glb",
  modelScale: 0.9,
  components: [
    "defunct solar panels",
    "communication equipment",
    "structural frame",
  ],
  missionType: "communications",
  operationalStatus: "decommissioned",
  launchDate: "1985-12-10",
  missionDuration: 10,
  materialProperties: {
    metalness: 0.4, // Degraded materials
    roughness: 0.8, // Weathered surface
    envMapIntensity: 0.3, // Reduced reflectivity
  },
};
```

### Military Reconnaissance Satellite

```typescript
const reconSatProperties: SatelliteProperties = {
  type: CelestialType.SATELLITE,
  modelPath: "/models/recon_satellite.glb",
  modelScale: 1.1,
  components: [
    "imaging sensors",
    "data relay systems",
    "stealth coating",
    "maneuvering thrusters",
  ],
  missionType: "military",
  operationalStatus: "active",
  launchDate: "2021-08-14",
  missionDuration: 8,
  materialProperties: {
    metalness: 0.3, // Stealth materials
    roughness: 0.9, // Non-reflective
    envMapIntensity: 0.1, // Minimal reflection
  },
};
```

## Material Properties Integration

### PBR Material Configuration

```typescript
function createSatelliteMaterial(
  props: SatelliteProperties,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial();

  if (props.materialProperties) {
    material.metalness = props.materialProperties.metalness ?? 0.5;
    material.roughness = props.materialProperties.roughness ?? 0.5;
    material.envMapIntensity = props.materialProperties.envMapIntensity ?? 1.0;
  }

  // Adjust based on operational status
  if (
    props.operationalStatus === "decommissioned" ||
    props.operationalStatus === "inactive"
  ) {
    material.roughness = Math.min(1.0, material.roughness + 0.3); // More weathered
    material.envMapIntensity *= 0.5; // Less reflective
  }

  return material;
}
```

### Mission-Based Material Adjustment

```typescript
function adjustMaterialForMission(
  material: THREE.MeshStandardMaterial,
  missionType: string,
): void {
  switch (missionType) {
    case "military":
      material.metalness = Math.min(material.metalness, 0.3); // Stealth
      material.roughness = Math.max(material.roughness, 0.8); // Non-reflective
      material.envMapIntensity = Math.min(material.envMapIntensity, 0.2);
      break;

    case "scientific":
      material.metalness = Math.max(material.metalness, 0.7); // Precision instruments
      material.roughness = Math.min(material.roughness, 0.3); // Clean surfaces
      break;

    case "communications":
      material.envMapIntensity = Math.max(material.envMapIntensity, 1.2); // Reflective dishes
      break;
  }
}
```

## Mission Lifecycle

### Age Calculation

```typescript
function calculateSatelliteAge(launchDate: string): number {
  const launch = new Date(launchDate);
  const now = new Date();
  const ageMs = now.getTime() - launch.getTime();
  return ageMs / (1000 * 60 * 60 * 24 * 365.25); // Years
}
```

### Status Determination

```typescript
function determineSatelliteStatus(
  props: SatelliteProperties,
  currentDate: Date = new Date(),
): "active" | "inactive" | "deorbited" | "decommissioned" {
  if (props.operationalStatus) {
    return props.operationalStatus;
  }

  // Auto-determine based on mission duration
  if (props.launchDate && props.missionDuration) {
    const age = calculateSatelliteAge(props.launchDate);
    if (age > props.missionDuration * 1.5) {
      return "decommissioned";
    } else if (age > props.missionDuration) {
      return "inactive";
    }
  }

  return "active";
}
```

## Integration

### Rendering System

- `modelPath` determines 3D model loading
- `materialProperties` configure PBR materials
- `operationalStatus` affects visual appearance
- `modelScale` adjusts model size

### Mission Tracking

- `missionType` categorizes satellites
- `launchDate` and `missionDuration` track lifecycle
- `components` provide system details

### Physics System

- Satellites typically have minimal gravitational effect
- Orbital mechanics follow standard physics
- May include propulsion for station-keeping

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[@teskooano/celestials-satellite]] - Satellite rendering system
