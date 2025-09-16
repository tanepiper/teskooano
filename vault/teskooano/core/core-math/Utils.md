---
aliases: [Utils]
tags: [core, math, utilities]
type: Module
package: "@teskooano/core-math"
name: utils
exports:
  [
    "clamp",
    "lerp",
    "degToRad",
    "radToDeg",
    "equals",
    "isPowerOfTwo",
    "ceilPowerOfTwo",
    "floorPowerOfTwo",
    "nearestPowerOfTwo",
    "uuid4",
    "debounce",
    "throttle",
    "memoize",
  ]
status: active
---

# Utils

Mathematical utility functions and general-purpose helpers for common operations, performance optimization, and function modifiers.

## Overview

The `utils` module provides a comprehensive collection of mathematical utility functions and general-purpose helpers used throughout the Open Space engine. These utilities cover mathematical operations, angle conversions, power-of-two calculations, UUID generation, and function modifiers for performance optimization.

## Mathematical Utilities

### `clamp(value: number, min: number, max: number): number`

Clamps a number between a minimum and maximum value.

**Parameters:**

- `value`: The number to clamp
- `min`: The minimum allowed value
- `max`: The maximum allowed value

**Returns:** The clamped number

**Usage:**

```typescript
import { clamp } from "@teskooano/core-math";

const value = 15;
const clamped = clamp(value, 0, 10); // 10

// Clamp angle to [0, 2π) range
const angle = 3 * Math.PI;
const normalizedAngle = clamp(angle, 0, 2 * Math.PI);
```

**Applications:**

- Value constraint in user interfaces
- Angle normalization
- Color channel clamping
- Physics constraint enforcement

### `lerp(start: number, end: number, t: number): number`

Linearly interpolates between two numbers.

**Parameters:**

- `start`: The starting value
- `end`: The ending value
- `t`: The interpolation factor (usually between 0 and 1)

**Returns:** The interpolated value

**Usage:**

```typescript
import { lerp } from "@teskooano/core-math";

// Interpolate between 0 and 100
const value = lerp(0, 100, 0.5); // 50

// Smooth animation
function animateValue(start: number, end: number, duration: number) {
  const startTime = Date.now();

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = lerp(start, end, progress);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}
```

**Applications:**

- Animation interpolation
- Smooth transitions
- Value blending
- Parameter interpolation

### `degToRad(degrees: number): number`

Converts degrees to radians.

**Parameters:**

- `degrees`: The angle in degrees

**Returns:** The angle in radians

**Usage:**

```typescript
import { degToRad } from "@teskooano/core-math";

const degrees = 90;
const radians = degToRad(degrees); // π/2

// Convert multiple angles
const angles = [0, 30, 45, 60, 90, 180, 270, 360];
const radiansArray = angles.map(degToRad);
```

**Applications:**

- User input conversion
- API interface handling
- Mathematical calculations
- Graphics programming

### `radToDeg(radians: number): number`

Converts radians to degrees.

**Parameters:**

- `radians`: The angle in radians

**Returns:** The angle in degrees

**Usage:**

```typescript
import { radToDeg } from "@teskooano/core-math";

const radians = Math.PI / 2;
const degrees = radToDeg(radians); // 90

// Convert quaternion rotation to degrees
const quat = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  Math.PI / 4,
);
const angleInDegrees = radToDeg(Math.PI / 4); // 45
```

**Applications:**

- User interface display
- Debug output
- API responses
- Mathematical visualization

### `equals(a: number, b: number, epsilon?: number): boolean`

Checks if two numbers are approximately equal within a given tolerance.

**Parameters:**

- `a`: The first number
- `b`: The second number
- `epsilon`: The tolerance for equality comparison (default: 0.000001)

**Returns:** True if the numbers are approximately equal

**Usage:**

```typescript
import { equals } from "@teskooano/core-math";

const a = 0.1 + 0.2;
const b = 0.3;
const areEqual = equals(a, b); // true (handles floating-point precision)

// Custom tolerance
const customEqual = equals(1.0, 1.001, 0.01); // true
```

**Applications:**

- Floating-point comparisons
- Numerical stability checks
- Geometric equality testing
- Physics simulation validation

## Power-of-Two Utilities

### `isPowerOfTwo(value: number): boolean`

Checks if a number is a power of two.

**Parameters:**

- `value`: The number to check

**Returns:** True if the number is a power of two

**Usage:**

```typescript
import { isPowerOfTwo } from "@teskooano/core-math";

console.log(isPowerOfTwo(1)); // true
console.log(isPowerOfTwo(2)); // true
console.log(isPowerOfTwo(4)); // true
console.log(isPowerOfTwo(8)); // true
console.log(isPowerOfTwo(3)); // false
console.log(isPowerOfTwo(5)); // false
```

**Applications:**

- Texture size validation
- Buffer size optimization
- Graphics hardware requirements
- Memory alignment checks

### `ceilPowerOfTwo(value: number): number`

Calculates the smallest power of two greater than or equal to the given number.

**Parameters:**

- `value`: The input number

**Returns:** The ceiling power of two

**Usage:**

```typescript
import { ceilPowerOfTwo } from "@teskooano/core-math";

console.log(ceilPowerOfTwo(3)); // 4
console.log(ceilPowerOfTwo(5)); // 8
console.log(ceilPowerOfTwo(9)); // 16
console.log(ceilPowerOfTwo(16)); // 16 (already power of two)
```

**Applications:**

- Texture size optimization
- Buffer allocation
- Graphics hardware requirements
- Memory management

### `floorPowerOfTwo(value: number): number`

Calculates the largest power of two less than or equal to the given number.

**Parameters:**

- `value`: The input number

**Returns:** The floor power of two

**Usage:**

```typescript
import { floorPowerOfTwo } from "@teskooano/core-math";

console.log(floorPowerOfTwo(3)); // 2
console.log(floorPowerOfTwo(5)); // 4
console.log(floorPowerOfTwo(9)); // 8
console.log(floorPowerOfTwo(16)); // 16 (already power of two)
```

**Applications:**

- Memory optimization
- Performance-critical allocations
- Graphics hardware constraints
- Buffer size management

### `nearestPowerOfTwo(value: number): number`

Calculates the nearest power of two to the given number.

**Parameters:**

- `value`: The input number

**Returns:** The nearest power of two

**Usage:**

```typescript
import { nearestPowerOfTwo } from "@teskooano/core-math";

console.log(nearestPowerOfTwo(3)); // 4
console.log(nearestPowerOfTwo(6)); // 8
console.log(nearestPowerOfTwo(5)); // 4
console.log(nearestPowerOfTwo(12)); // 16
```

**Applications:**

- Optimal size selection
- Performance optimization
- Graphics hardware compatibility
- Memory efficiency

## General Utilities

### `uuid4(): string`

Generates a Version 4 UUID (Universally Unique Identifier).

**Returns:** A string representing the generated UUID

**Usage:**

```typescript
import { uuid4 } from "@teskooano/core-math";

const id1 = uuid4(); // "550e8400-e29b-41d4-a716-446655440000"
const id2 = uuid4(); // "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

// Generate unique IDs for objects
class GameObject {
  public readonly id = uuid4();

  constructor(public name: string) {}
}

const obj1 = new GameObject("Player");
const obj2 = new GameObject("Enemy");
console.log(obj1.id !== obj2.id); // true
```

**Applications:**

- Unique object identification
- Session management
- Database primary keys
- Distributed system coordination

## Function Modifiers

### `debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void`

Creates a debounced function that delays invoking the provided function until after `wait` milliseconds have elapsed since the last time the debounced function was invoked.

**Parameters:**

- `func`: The function to debounce
- `wait`: The number of milliseconds to delay

**Returns:** A debounced function

**Usage:**

```typescript
import { debounce } from "@teskooano/core-math";

// Debounce search input
const searchInput = document.getElementById("search");
const debouncedSearch = debounce((query: string) => {
  console.log(`Searching for: ${query}`);
  // Perform search operation
}, 300);

searchInput.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});

// Debounce resize handler
const debouncedResize = debounce(() => {
  console.log("Window resized");
  // Handle resize
}, 250);

window.addEventListener("resize", debouncedResize);
```

**Applications:**

- Search input optimization
- Resize event handling
- API call optimization
- User input processing

### `throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void`

Creates a throttled function that only invokes the provided function at most once per every `limit` milliseconds.

**Parameters:**

- `func`: The function to throttle
- `limit`: The throttling period in milliseconds

**Returns:** A throttled function

**Usage:**

```typescript
import { throttle } from "@teskooano/core-math";

// Throttle scroll handler
const throttledScroll = throttle(() => {
  console.log("Scrolling...");
  // Handle scroll
}, 100);

window.addEventListener("scroll", throttledScroll);

// Throttle mouse move handler
const throttledMouseMove = throttle((event: MouseEvent) => {
  console.log(`Mouse at: ${event.clientX}, ${event.clientY}`);
  // Handle mouse movement
}, 16); // ~60 FPS

document.addEventListener("mousemove", throttledMouseMove);
```

**Applications:**

- Scroll event optimization
- Mouse movement handling
- Animation frame limiting
- Performance-critical event handling

### `memoize<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T>`

Creates a memoized function that caches the results of function calls.

**Parameters:**

- `func`: The function to memoize

**Returns:** A memoized function

**Usage:**

```typescript
import { memoize } from "@teskooano/core-math";

// Memoize expensive calculation
const expensiveCalculation = memoize((n: number) => {
  console.log(`Calculating for ${n}`);
  // Simulate expensive operation
  let result = 0;
  for (let i = 0; i < n * 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
});

// First call - performs calculation
const result1 = expensiveCalculation(5); // "Calculating for 5"

// Second call - returns cached result
const result2 = expensiveCalculation(5); // No console output

// Memoize vector operations
const vectorLength = memoize((x: number, y: number, z: number) => {
  return Math.sqrt(x * x + y * y + z * z);
});

const len1 = vectorLength(3, 4, 0); // 5
const len2 = vectorLength(3, 4, 0); // 5 (cached)
```

**Applications:**

- Expensive calculation caching
- API response caching
- Mathematical function optimization
- Performance-critical computations

## Usage Examples

### Animation System

```typescript
import { lerp, clamp, degToRad } from "@teskooano/core-math";

class AnimationSystem {
  private animations: Map<string, Animation> = new Map();

  createAnimation(
    id: string,
    startValue: number,
    endValue: number,
    duration: number,
    easing: (t: number) => number = (t) => t,
  ): void {
    const animation: Animation = {
      startValue,
      endValue,
      duration,
      easing,
      startTime: Date.now(),
      isActive: true,
    };

    this.animations.set(id, animation);
  }

  update(): void {
    const currentTime = Date.now();

    for (const [id, animation] of this.animations) {
      if (!animation.isActive) continue;

      const elapsed = currentTime - animation.startTime;
      const progress = clamp(elapsed / animation.duration, 0, 1);
      const easedProgress = animation.easing(progress);
      const currentValue = lerp(
        animation.startValue,
        animation.endValue,
        easedProgress,
      );

      // Apply animation value
      this.applyAnimationValue(id, currentValue);

      if (progress >= 1) {
        animation.isActive = false;
      }
    }
  }

  private applyAnimationValue(id: string, value: number): void {
    // Apply animation value to target object
    console.log(`Animation ${id}: ${value}`);
  }
}
```

### Performance Optimization

```typescript
import {
  isPowerOfTwo,
  ceilPowerOfTwo,
  memoize,
  throttle,
} from "@teskooano/core-math";

// Optimize texture sizes
class TextureManager {
  private textureCache = new Map<string, WebGLTexture>();

  createTexture(width: number, height: number): WebGLTexture {
    // Ensure power-of-two dimensions for better performance
    const optimizedWidth = ceilPowerOfTwo(width);
    const optimizedHeight = ceilPowerOfTwo(height);

    console.log(
      `Original: ${width}x${height}, Optimized: ${optimizedWidth}x${optimizedHeight}`,
    );

    // Create texture with optimized dimensions
    return this.createWebGLTexture(optimizedWidth, optimizedHeight);
  }

  private createWebGLTexture(width: number, height: number): WebGLTexture {
    // WebGL texture creation logic
    return {} as WebGLTexture;
  }
}

// Memoize expensive calculations
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

// Throttle performance monitoring
const performanceMonitor = throttle(() => {
  const memory = (performance as any).memory;
  if (memory) {
    console.log(`Memory usage: ${memory.usedJSHeapSize / 1024 / 1024} MB`);
  }
}, 1000); // Check every second
```

### Input Handling

```typescript
import { debounce, throttle, clamp } from "@teskooano/core-math";

class InputManager {
  private debouncedSearch: (query: string) => void;
  private throttledMouseMove: (event: MouseEvent) => void;

  constructor() {
    // Debounce search to avoid excessive API calls
    this.debouncedSearch = debounce((query: string) => {
      this.performSearch(query);
    }, 300);

    // Throttle mouse movement for smooth tracking
    this.throttledMouseMove = throttle((event: MouseEvent) => {
      this.updateMousePosition(event.clientX, event.clientY);
    }, 16); // ~60 FPS
  }

  setupEventListeners(): void {
    // Search input
    const searchInput = document.getElementById("search") as HTMLInputElement;
    searchInput.addEventListener("input", (e) => {
      this.debouncedSearch(e.target.value);
    });

    // Mouse movement
    document.addEventListener("mousemove", this.throttledMouseMove);

    // Scroll with clamping
    window.addEventListener(
      "scroll",
      throttle(() => {
        const scrollY = clamp(window.scrollY, 0, document.body.scrollHeight);
        this.updateScrollPosition(scrollY);
      }, 16),
    );
  }

  private performSearch(query: string): void {
    console.log(`Searching for: ${query}`);
    // Perform search operation
  }

  private updateMousePosition(x: number, y: number): void {
    // Update mouse position
  }

  private updateScrollPosition(y: number): void {
    // Update scroll position
  }
}
```

### Mathematical Utilities

```typescript
import { equals, degToRad, radToDeg, lerp, clamp } from "@teskooano/core-math";

// Angle utilities
class AngleUtils {
  static normalizeAngle(angle: number): number {
    return clamp(angle, 0, 2 * Math.PI);
  }

  static angleDifference(a: number, b: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
  }

  static lerpAngle(a: number, b: number, t: number): number {
    const diff = this.angleDifference(a, b);
    return a + diff * t;
  }

  static isAngleEqual(
    a: number,
    b: number,
    tolerance: number = 0.001,
  ): boolean {
    return equals(this.angleDifference(a, b), 0, tolerance);
  }
}

// Vector utilities
class VectorUtils {
  static lerpVector(v1: OSVector3, v2: OSVector3, t: number): OSVector3 {
    return new OSVector3(
      lerp(v1.x, v2.x, t),
      lerp(v1.y, v2.y, t),
      lerp(v1.z, v2.z, t),
    );
  }

  static clampVector(v: OSVector3, min: OSVector3, max: OSVector3): OSVector3 {
    return new OSVector3(
      clamp(v.x, min.x, max.x),
      clamp(v.y, min.y, max.y),
      clamp(v.z, min.z, max.z),
    );
  }
}
```

## Performance Considerations

### Memory Management

- **Memoization**: Use with caution for functions with large parameter spaces
- **Debouncing/Throttling**: Clear timeouts when components unmount
- **Power-of-Two**: Prefer for graphics operations and memory allocations

### Optimization Tips

- **Memoize expensive calculations** that are called repeatedly with same inputs
- **Throttle high-frequency events** like mouse movement and scroll
- **Debounce user input** to reduce unnecessary processing
- **Use power-of-two sizes** for textures and buffers when possible

## 🔗 Related

- [[core/core-math/Constants|Constants]] - Mathematical constants used by utilities
- [[core/core-math/OSVector3|OSVector3]] - Vector operations using utility functions
- [[core/core-math/OSQuaternion|OSQuaternion]] - Quaternion operations with angle utilities
- [[core/core-math/OSMatrix3|OSMatrix3]] - Matrix operations with mathematical utilities
- [[core/core-math/OSMatrix4|OSMatrix4]] - 4D matrix operations with utility functions
- [[core/core-physics/core-physics|@teskooano/core-physics]] - Physics calculations using utilities
- [[threejs-renderers/threejs/threejs|@teskooano/renderer-threejs]] - Rendering optimizations with utilities
