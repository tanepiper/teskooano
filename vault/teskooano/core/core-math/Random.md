---
aliases: [Random]
tags: [core, math, random, prng, seeded]
type: Module
package: "@teskooano/core-math"
name: random
exports: ["createSeededRandomSync", "createSeededRandom"]
status: active
---

# Random

Seeded pseudo-random number generators for deterministic simulations, procedural generation, and reproducible random sequences in the Open Space engine.

## Overview

The `random` module provides seeded pseudo-random number generators (PRNGs) that produce deterministic sequences of random numbers. This is essential for reproducible simulations, procedural generation, and testing scenarios where the same seed should always produce the same sequence of random values.

## Key Features

### Deterministic Generation

- **Same seed, same sequence**: Identical seeds always produce identical sequences
- **Reproducible results**: Essential for testing and debugging
- **Simulation consistency**: Ensures deterministic behavior in physics simulations

### Performance Optimized

- **Synchronous generator**: High-performance seeded PRNG using cyrb128 hash
- **Asynchronous generator**: Web Crypto API-based seeded PRNG for cryptographic quality
- **Efficient algorithms**: Optimized for simulation and procedural generation

### Multiple Implementations

- **Synchronous**: Fast, deterministic PRNG using cyrb128 hash and Mulberry32
- **Asynchronous**: Cryptographically secure PRNG using Web Crypto API

## API Reference

### `createSeededRandomSync(seed: string): () => number`

Creates a seeded pseudo-random number generator using a synchronous hashing algorithm.

**Parameters:**

- `seed`: The input string seed

**Returns:** A function that returns pseudo-random numbers between 0 (inclusive) and 1 (exclusive)

**Usage:**

```typescript
import { createSeededRandomSync } from "@teskooano/core-math";

// Create deterministic random generator
const random = createSeededRandomSync("my-seed");

// Generate consistent random numbers
const value1 = random(); // Always same for same seed
const value2 = random(); // Always same sequence
const value3 = random(); // Deterministic progression
```

**Applications:**

- Performance-critical simulations
- Real-time procedural generation
- Deterministic physics simulations
- Testing and debugging

### `createSeededRandom(seed: string): Promise<() => number>`

Creates a seeded pseudo-random number generator using the Web Crypto API.

**Parameters:**

- `seed`: The input string seed

**Returns:** A Promise that resolves to a function returning pseudo-random numbers between 0 (inclusive) and 1 (exclusive)

**Usage:**

```typescript
import { createSeededRandom } from "@teskooano/core-math";

// Create cryptographically secure random generator
const random = await createSeededRandom("my-seed");

// Generate consistent random numbers
const value1 = random(); // Always same for same seed
const value2 = random(); // Always same sequence
```

**Applications:**

- Cryptographically secure random generation
- High-quality procedural generation
- Security-sensitive applications
- When maximum randomness quality is required

## Implementation Details

### Synchronous Generator (createSeededRandomSync)

Uses a combination of cyrb128 hash and Mulberry32 PRNG:

1. **cyrb128 Hash**: Converts string seed to 128-bit hash
2. **Mulberry32 PRNG**: Linear congruential generator with good statistical properties
3. **Performance**: Optimized for speed and deterministic behavior

### Asynchronous Generator (createSeededRandom)

Uses Web Crypto API for cryptographic quality:

1. **SHA-256 Hash**: Converts string seed to 256-bit hash
2. **LCG State**: Uses first 32 bits of hash as initial state
3. **Linear Congruential Generator**: Standard LCG with good properties
4. **Quality**: Cryptographically secure seed generation

## Usage Examples

### Basic Random Generation

```typescript
import {
  createSeededRandomSync,
  createSeededRandom,
} from "@teskooano/core-math";

// Synchronous generator
const syncRandom = createSeededRandomSync("test-seed");
console.log(syncRandom()); // 0.123456789
console.log(syncRandom()); // 0.987654321
console.log(syncRandom()); // 0.456789123

// Asynchronous generator
const asyncRandom = await createSeededRandom("test-seed");
console.log(asyncRandom()); // 0.123456789 (same seed, same sequence)
console.log(asyncRandom()); // 0.987654321
console.log(asyncRandom()); // 0.456789123
```

### Procedural Generation

```typescript
import { createSeededRandomSync } from "@teskooano/core-math";

class ProceduralGenerator {
  private random: () => number;

  constructor(seed: string) {
    this.random = createSeededRandomSync(seed);
  }

  // Generate random integer in range [min, max]
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Generate random float in range [min, max]
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  // Generate random boolean
  randomBoolean(): boolean {
    return this.random() < 0.5;
  }

  // Generate random element from array
  randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }

  // Generate random vector
  randomVector3(min: number = -1, max: number = 1): OSVector3 {
    return new OSVector3(
      this.randomFloat(min, max),
      this.randomFloat(min, max),
      this.randomFloat(min, max),
    );
  }

  // Generate random color
  randomColor(): string {
    const r = Math.floor(this.random() * 256);
    const g = Math.floor(this.random() * 256);
    const b = Math.floor(this.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Usage
const generator = new ProceduralGenerator("world-seed");
const planetCount = generator.randomInt(5, 15);
const planetColors = Array.from({ length: planetCount }, () =>
  generator.randomColor(),
);
```

### Simulation Systems

```typescript
import { createSeededRandomSync } from "@teskooano/core-math";

class SimulationSystem {
  private random: () => number;
  private objects: Array<{
    id: string;
    position: OSVector3;
    velocity: OSVector3;
  }> = [];

  constructor(seed: string) {
    this.random = createSeededRandomSync(seed);
    this.initializeObjects();
  }

  private initializeObjects(): void {
    const objectCount = 100;

    for (let i = 0; i < objectCount; i++) {
      this.objects.push({
        id: `object-${i}`,
        position: new OSVector3(
          this.random() * 1000 - 500,
          this.random() * 1000 - 500,
          this.random() * 1000 - 500,
        ),
        velocity: new OSVector3(
          this.random() * 20 - 10,
          this.random() * 20 - 10,
          this.random() * 20 - 10,
        ),
      });
    }
  }

  update(deltaTime: number): void {
    for (const obj of this.objects) {
      // Apply random forces
      const force = new OSVector3(
        (this.random() - 0.5) * 0.1,
        (this.random() - 0.5) * 0.1,
        (this.random() - 0.5) * 0.1,
      );

      // Update velocity
      obj.velocity.add(force);

      // Update position
      obj.position.add(obj.velocity.clone().multiplyScalar(deltaTime));
    }
  }

  // Reset simulation with same seed
  reset(): void {
    this.objects = [];
    this.initializeObjects();
  }
}

// Usage
const simulation = new SimulationSystem("simulation-seed");
simulation.update(0.016); // 60 FPS
simulation.reset(); // Same initial state
```

### Testing and Debugging

```typescript
import { createSeededRandomSync } from "@teskooano/core-math";

class TestSuite {
  private random: () => number;

  constructor(seed: string = "test-seed") {
    this.random = createSeededRandomSync(seed);
  }

  // Generate test data
  generateTestData(count: number): Array<{ value: number; expected: number }> {
    const testData = [];

    for (let i = 0; i < count; i++) {
      const value = this.random() * 100;
      const expected = value * 2; // Simple test function
      testData.push({ value, expected });
    }

    return testData;
  }

  // Test random distribution
  testDistribution(sampleSize: number = 10000): boolean {
    const buckets = new Array(10).fill(0);

    for (let i = 0; i < sampleSize; i++) {
      const value = this.random();
      const bucket = Math.floor(value * 10);
      buckets[bucket]++;
    }

    // Check if distribution is roughly uniform
    const expected = sampleSize / 10;
    const tolerance = expected * 0.1; // 10% tolerance

    return buckets.every((count) => Math.abs(count - expected) <= tolerance);
  }

  // Test reproducibility
  testReproducibility(seed: string, iterations: number = 1000): boolean {
    const random1 = createSeededRandomSync(seed);
    const random2 = createSeededRandomSync(seed);

    for (let i = 0; i < iterations; i++) {
      if (random1() !== random2()) {
        return false;
      }
    }

    return true;
  }
}

// Usage
const testSuite = new TestSuite("test-seed");
const testData = testSuite.generateTestData(100);
const isUniform = testSuite.testDistribution();
const isReproducible = testSuite.testReproducibility("test-seed");
```

### Procedural Content Generation

```typescript
import { createSeededRandomSync } from "@teskooano/core-math";

class ProceduralContentGenerator {
  private random: () => number;

  constructor(seed: string) {
    this.random = createSeededRandomSync(seed);
  }

  // Generate star system
  generateStarSystem(): {
    starType: string;
    planetCount: number;
    planets: Array<{ name: string; distance: number; type: string }>;
  } {
    const starTypes = ["G", "K", "M", "F", "A"];
    const planetTypes = ["Terrestrial", "Gas Giant", "Ice Giant", "Dwarf"];

    const starType = this.randomChoice(starTypes);
    const planetCount = this.randomInt(1, 8);

    const planets = [];
    for (let i = 0; i < planetCount; i++) {
      planets.push({
        name: `Planet ${i + 1}`,
        distance: this.randomFloat(0.1, 50),
        type: this.randomChoice(planetTypes),
      });
    }

    return { starType, planetCount, planets };
  }

  // Generate terrain heightmap
  generateHeightmap(width: number, height: number): number[][] {
    const heightmap = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        // Simple noise generation
        const noise = this.random() * 2 - 1;
        row.push(noise);
      }
      heightmap.push(row);
    }

    return heightmap;
  }

  // Generate random choice from array
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }

  // Generate random integer in range
  private randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Generate random float in range
  private randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
}

// Usage
const generator = new ProceduralContentGenerator("galaxy-seed");
const starSystem = generator.generateStarSystem();
const heightmap = generator.generateHeightmap(256, 256);
```

### Performance Comparison

```typescript
import {
  createSeededRandomSync,
  createSeededRandom,
} from "@teskooano/core-math";

class PerformanceTest {
  async runComparison(iterations: number = 1000000): Promise<void> {
    console.log(`Running performance test with ${iterations} iterations...`);

    // Test synchronous generator
    const syncStart = performance.now();
    const syncRandom = createSeededRandomSync("test-seed");
    for (let i = 0; i < iterations; i++) {
      syncRandom();
    }
    const syncTime = performance.now() - syncStart;

    // Test asynchronous generator
    const asyncStart = performance.now();
    const asyncRandom = await createSeededRandom("test-seed");
    for (let i = 0; i < iterations; i++) {
      asyncRandom();
    }
    const asyncTime = performance.now() - asyncStart;

    console.log(`Synchronous: ${syncTime.toFixed(2)}ms`);
    console.log(`Asynchronous: ${asyncTime.toFixed(2)}ms`);
    console.log(`Speed ratio: ${(asyncTime / syncTime).toFixed(2)}x`);
  }

  // Test memory usage
  testMemoryUsage(): void {
    const generators = [];

    // Create many generators
    for (let i = 0; i < 1000; i++) {
      generators.push(createSeededRandomSync(`seed-${i}`));
    }

    // Generate numbers
    for (const generator of generators) {
      for (let i = 0; i < 1000; i++) {
        generator();
      }
    }

    console.log("Memory test completed");
  }
}

// Usage
const test = new PerformanceTest();
await test.runComparison();
test.testMemoryUsage();
```

## Best Practices

### Seed Selection

- **Use descriptive seeds** for different content types
- **Combine seeds** for hierarchical generation
- **Document seed usage** for reproducibility
- **Use consistent seeds** for related content

### Performance Optimization

- **Use synchronous generator** for performance-critical code
- **Use asynchronous generator** for high-quality randomness
- **Cache generators** when possible
- **Batch operations** for better performance

### Testing and Debugging

- **Use fixed seeds** for reproducible tests
- **Test distribution** to ensure randomness quality
- **Validate reproducibility** across runs
- **Document expected behavior** for seeded sequences

### Error Handling

- **Handle invalid seeds** gracefully
- **Provide fallback values** for edge cases
- **Validate random ranges** before use
- **Log warnings** for suspicious patterns

## 🔗 Related

- [[core/core-math/Utils|Utils]] - Utility functions for random number processing
- [[core/core-math/Constants|Constants]] - Mathematical constants for random calculations
- [[systems/procedural-generation/procedural-generation|@teskooano/systems-procedural-generation]] - Procedural generation using seeded random
- [[core/core-physics/core-physics|@teskooano/core-physics]] - Physics simulations with deterministic randomness
- [[core/core-state/core-state|@teskooano/core-state]] - State management with random events
