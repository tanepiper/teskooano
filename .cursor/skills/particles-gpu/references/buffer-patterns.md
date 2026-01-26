# Buffer Distribution Patterns

Ready-to-use position distribution functions for particle systems.

## Sphere Distributions

### Uniform Volume (Filled Sphere)

```typescript
function sphereVolume(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    // Cube root for uniform volume distribution
    const r = Math.cbrt(Math.random()) * radius;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  return positions;
}
```

### Surface Only (Hollow Sphere)

```typescript
function sphereSurface(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  return positions;
}
```

### Hemisphere

```typescript
function hemisphere(count: number, radius: number, up = true): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random()); // 0 to PI/2 only
    const r = Math.cbrt(Math.random()) * radius;

    const y = r * Math.cos(phi) * (up ? 1 : -1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  return positions;
}
```

## Box Distributions

### Uniform Box Volume

```typescript
function boxVolume(
  count: number,
  width: number,
  height: number,
  depth: number,
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * width;
    positions[i * 3 + 1] = (Math.random() - 0.5) * height;
    positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
  }

  return positions;
}
```

### Box Surface Only

```typescript
function boxSurface(
  count: number,
  width: number,
  height: number,
  depth: number,
): Float32Array {
  const positions = new Float32Array(count * 3);

  // Surface areas
  const areaXY = width * height * 2;
  const areaXZ = width * depth * 2;
  const areaYZ = height * depth * 2;
  const totalArea = areaXY + areaXZ + areaYZ;

  for (let i = 0; i < count; i++) {
    const r = Math.random() * totalArea;

    if (r < areaXY) {
      // Top or bottom face
      positions[i * 3] = (Math.random() - 0.5) * width;
      positions[i * 3 + 1] = (r < areaXY / 2 ? 0.5 : -0.5) * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
    } else if (r < areaXY + areaXZ) {
      // Front or back face
      positions[i * 3] = (Math.random() - 0.5) * width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * height;
      positions[i * 3 + 2] = (r < areaXY + areaXZ / 2 ? 0.5 : -0.5) * depth;
    } else {
      // Left or right face
      positions[i * 3] = (r < totalArea - areaYZ / 2 ? 0.5 : -0.5) * width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
    }
  }

  return positions;
}
```

## Cylinder/Disc

### Disc (Flat Circle)

```typescript
function disc(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius; // sqrt for uniform distribution

    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  return positions;
}
```

### Ring (Hollow Disc)

```typescript
function ring(
  count: number,
  innerRadius: number,
  outerRadius: number,
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r =
      innerRadius + Math.sqrt(Math.random()) * (outerRadius - innerRadius);

    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  return positions;
}
```

### Cylinder Volume

```typescript
function cylinderVolume(
  count: number,
  radius: number,
  height: number,
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;

    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * height;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  return positions;
}
```

## Special Distributions

### Galaxy Spiral

```typescript
function galaxySpiral(
  count: number,
  arms: number,
  radius: number,
  spin: number,
  randomness: number,
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const armIndex = i % arms;
    const armAngle = (armIndex / arms) * Math.PI * 2;

    const distFromCenter = Math.random() * radius;
    const spinAngle = distFromCenter * spin;
    const angle = armAngle + spinAngle;

    // Add randomness that increases with distance
    const rx = (Math.random() - 0.5) * randomness * distFromCenter;
    const ry = (Math.random() - 0.5) * randomness * 0.2;
    const rz = (Math.random() - 0.5) * randomness * distFromCenter;

    positions[i * 3] = Math.cos(angle) * distFromCenter + rx;
    positions[i * 3 + 1] = ry;
    positions[i * 3 + 2] = Math.sin(angle) * distFromCenter + rz;
  }

  return positions;
}
```

### Grid

```typescript
function grid3D(countPerAxis: number, spacing: number): Float32Array {
  const count = countPerAxis ** 3;
  const positions = new Float32Array(count * 3);
  const offset = (countPerAxis - 1) * spacing * 0.5;

  let index = 0;
  for (let x = 0; x < countPerAxis; x++) {
    for (let y = 0; y < countPerAxis; y++) {
      for (let z = 0; z < countPerAxis; z++) {
        positions[index * 3] = x * spacing - offset;
        positions[index * 3 + 1] = y * spacing - offset;
        positions[index * 3 + 2] = z * spacing - offset;
        index++;
      }
    }
  }

  return positions;
}
```

### Torus

```typescript
function torus(
  count: number,
  majorRadius: number,
  minorRadius: number,
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;

    positions[i * 3] = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
    positions[i * 3 + 1] = minorRadius * Math.sin(v);
    positions[i * 3 + 2] =
      (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
  }

  return positions;
}
```

### Cone

```typescript
function cone(count: number, radius: number, height: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const h = Math.random(); // 0 = tip, 1 = base
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius * h; // Radius scales with height

    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = h * height;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  return positions;
}
```

### Text/Path Based

```typescript
// Sample points along a path
function alongPath(
  count: number,
  path: THREE.Curve<THREE.Vector3>,
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const point = path.getPoint(t);

    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  }

  return positions;
}
```

## Utility: Add Jitter

```typescript
function addJitter(positions: Float32Array, amount: number): Float32Array {
  for (let i = 0; i < positions.length; i++) {
    positions[i] += (Math.random() - 0.5) * amount;
  }
  return positions;
}
```

## Utility: Generate Velocities

```typescript
// Random directions
function randomVelocities(count: number, speed: number): Float32Array {
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const s = speed * (0.5 + Math.random() * 0.5);

    velocities[i * 3] = s * Math.sin(phi) * Math.cos(theta);
    velocities[i * 3 + 1] = s * Math.sin(phi) * Math.sin(theta);
    velocities[i * 3 + 2] = s * Math.cos(phi);
  }

  return velocities;
}

// Outward from origin
function radialVelocities(
  positions: Float32Array,
  speed: number,
): Float32Array {
  const count = positions.length / 3;
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const s = speed * (0.5 + Math.random() * 0.5);

    velocities[i * 3] = (x / len) * s;
    velocities[i * 3 + 1] = (y / len) * s;
    velocities[i * 3 + 2] = (z / len) * s;
  }

  return velocities;
}
```
