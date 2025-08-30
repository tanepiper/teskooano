---
aliases: [LogarithmicDepthMaterial, log-depth, logarithmic-depth, depth-buffer]
tags: [renderer, threejs, core, depth, precision, space-scale]
type: Class
package: "@teskooano/renderer-threejs-core"
name: LogarithmicDepthMaterial
dependencies: ["three"]
classes:
  [
    "THREE.Material",
    "THREE.ShaderMaterial",
    "THREE.Scene",
    "THREE.PerspectiveCamera",
  ]
functions: []
constants: ["logDepthVertexChunk", "logDepthFragmentChunk"]
types: []
status: active
---

# LogarithmicDepthMaterial

Helper for enabling logarithmic depth buffer in materials, providing superior precision across massive distance ranges for space simulations.

## 🎯 Purpose

The LogarithmicDepthMaterial provides:

- **Space-Scale Precision**: Enables rendering across astronomical distances without depth precision loss
- **Massive Near/Far Ratios**: Supports ratios up to 1,000,000:1 without artifacts
- **Automatic Material Patching**: Automatically applies log depth to all materials in a scene
- **Shader Integration**: Injects logarithmic depth calculations into custom shaders
- **Camera Configuration**: Optimizes camera settings for logarithmic depth

## 🏗️ Architecture

### Core Concept

Traditional linear depth buffers lose precision at large distances. Logarithmic depth provides uniform precision across the entire range by using logarithmic calculations.

### Implementation Strategy

```typescript
class LogarithmicDepthMaterial {
  // Static methods for enabling log depth
  static enableLogDepth(material: THREE.Material): void;
  static enableLogDepthForScene(scene: THREE.Scene): void;
  static configureCameraForLogDepth(camera: THREE.PerspectiveCamera): void;

  // Shader injection methods
  private static injectLogDepthIntoShader(material: THREE.ShaderMaterial): void;
  private static injectVertexLogDepth(vertexShader: string): string;
  private static injectFragmentLogDepth(fragmentShader: string): string;
}
```

### Shader Chunks

Pre-defined GLSL code chunks for logarithmic depth calculations:

```glsl
// Vertex shader chunk
#ifdef USE_LOGDEPTHBUF
  gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC * 0.5;
#endif

// Fragment shader chunk
#ifdef USE_LOGDEPTHBUF
  gl_FragDepthEXT = log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif
```

## 🔧 Core Methods

### Material Configuration

#### enableLogDepth()

Enables logarithmic depth buffer for a single material.

```typescript
public static enableLogDepth(material: THREE.Material): void
```

**Process:**

1. Sets `USE_LOGDEPTHBUF` and `USE_LOGDEPTHBUF_EXT` defines
2. For `ShaderMaterial`, injects log depth code into shaders
3. Sets `material.needsUpdate = true`

#### enableLogDepthForScene()

Enables logarithmic depth buffer for all materials in a scene.

```typescript
public static enableLogDepthForScene(scene: THREE.Scene): void
```

**Process:**

1. Traverses all objects in the scene
2. Finds `THREE.Mesh` and `THREE.Sprite` objects
3. Applies `enableLogDepth()` to all materials
4. Handles both single materials and material arrays

### Camera Configuration

#### configureCameraForLogDepth()

Optimizes camera settings for logarithmic depth buffer.

```typescript
public static configureCameraForLogDepth(camera: THREE.PerspectiveCamera): void
```

**Settings:**

- **Near Plane**: 0.001 (1mm) - ultra-aggressive for log depth
- **Far Plane**: 1,000,000 (1,000 km) - covers entire solar system
- **Update**: Calls `camera.updateProjectionMatrix()`

### Shader Injection

#### injectLogDepthIntoShader()

Injects logarithmic depth calculations into custom shader materials.

```typescript
private static injectLogDepthIntoShader(material: THREE.ShaderMaterial): void
```

**Process:**

1. Adds `logDepthBufFC` uniform
2. Injects vertex shader modifications
3. Injects fragment shader modifications
4. Handles shader compilation

## 🔄 Integration Flow

### Scene Integration

```typescript
// SceneManager automatically enables log depth
private enableLogarithmicDepth(): void {
  // Apply to existing materials
  LogarithmicDepthMaterial.enableLogDepthForScene(this.scene);

  // Set up auto-application for future materials
  this.setupAutoLogDepthApplication();
}

// Auto-application for new objects
private setupAutoLogDepthApplication(): void {
  const originalAdd = this.scene.add.bind(this.scene);
  this.scene.add = function (...objects: Object3D[]) {
    const result = originalAdd(...objects);

    // Apply log depth to newly added objects
    objects.forEach((obj) => {
      LogarithmicDepthMaterial.enableLogDepthForScene(obj as any);
    });

    return result;
  };
}
```

### Camera Integration

```typescript
// SceneManager configures camera for log depth
const camera = CameraHelper.createCamera(CameraPreset.Space, {
  near: 0.00001, // Ultra-aggressive near plane
  far: 1000000, // Massive far plane
  // ... other options
});

// Configure for logarithmic depth
if (camera instanceof PerspectiveCamera) {
  LogarithmicDepthMaterial.configureCameraForLogDepth(camera);
}
```

## 🚀 Usage Examples

### Basic Material Setup

```typescript
import { LogarithmicDepthMaterial } from "@teskooano/renderer-threejs-core";

// Enable for a single material
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
LogarithmicDepthMaterial.enableLogDepth(material);

// Enable for entire scene
const scene = new THREE.Scene();
LogarithmicDepthMaterial.enableLogDepthForScene(scene);

// Configure camera
const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.001, 1000000);
LogarithmicDepthMaterial.configureCameraForLogDepth(camera);
```

### Custom Shader Integration

```typescript
// Custom shader material
const customMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vPosition;
    void main() {
      gl_FragColor = vec4(vPosition, 1.0);
    }
  `,
});

// Enable logarithmic depth (automatically injects code)
LogarithmicDepthMaterial.enableLogDepth(customMaterial);
```

### Test Material Creation

```typescript
// Create a test material with log depth enabled
const testMaterial = LogarithmicDepthMaterial.createTestMaterial();
// Returns a red MeshBasicMaterial with log depth already enabled
```

## 🎯 Performance Considerations

### Precision Benefits

- **Uniform Precision**: Logarithmic depth provides uniform precision across entire range
- **Massive Ratios**: Supports near/far ratios up to 1,000,000:1
- **No Artifacts**: Eliminates z-fighting at large distances

### Computational Overhead

- **Minimal Cost**: Logarithmic calculations add minimal GPU overhead
- **Shader Complexity**: Slightly more complex shaders, but negligible impact
- **Memory Usage**: No additional memory requirements

### Compatibility

- **WebGL Extension**: Requires `GL_EXT_frag_depth` extension
- **Fallback Support**: Graceful degradation for unsupported devices
- **Browser Support**: Modern browsers support logarithmic depth

## 🔍 Debug Features

### Depth Precision Analysis

```typescript
// Analyze depth precision at different distances
const depthBits = 24; // Standard depth buffer
const precision = Math.pow(2, depthBits);

// Linear depth precision (without log depth)
const linearPrecision = (depthResolution * (far - near)) / distance;

// Logarithmic depth precision (with log depth)
const logPrecision = 1 / precision; // Much more uniform
```

### Material Analysis

```typescript
// Check if material has log depth enabled
const hasLogDepth = (material as any).defines?.USE_LOGDEPTHBUF;

// Check if scene has log depth materials
scene.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    const material = object.material;
    if ((material as any).defines?.USE_LOGDEPTHBUF) {
      console.log(`${object.name} has log depth enabled`);
    }
  }
});
```

## 📚 Related Components

- [[SceneManager]] - Automatically enables log depth for scenes
- [[Performance Optimization]] - Log depth performance considerations
- [[DepthBufferDebugger]] - Debug depth buffer issues
- [[RenderOrderManager]] - Render order management with log depth

## 🏛️ Architecture Patterns

- **Utility Pattern**: Static helper methods for material configuration
- **Decorator Pattern**: Adds log depth functionality to existing materials
- **Auto-Application Pattern**: Automatically applies to new scene objects
- **Shader Injection Pattern**: Modifies shader code for log depth support

## 🔧 Advanced Usage

### Custom Shader Integration

```typescript
// Manual shader injection for custom materials
const vertexShader = `
  uniform float logDepthBufFC;
  varying float vFragDepth;
  
  void main() {
    vFragDepth = 1.0 + gl_Position.w;
    gl_Position.z = log2( max( EPSILON, vFragDepth ) ) * logDepthBufFC - 1.0;
    gl_Position.z *= gl_Position.w;
  }
`;

const fragmentShader = `
  #extension GL_EXT_frag_depth : enable
  uniform float logDepthBufFC;
  varying float vFragDepth;
  
  void main() {
    gl_FragDepthEXT = log2( vFragDepth ) * logDepthBufFC * 0.5;
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;
```

### Performance Monitoring

```typescript
// Monitor log depth performance
const startTime = performance.now();
LogarithmicDepthMaterial.enableLogDepthForScene(scene);
const endTime = performance.now();
console.log(`Log depth setup took: ${endTime - startTime}ms`);
```

---

_The LogarithmicDepthMaterial enables space-scale rendering by providing uniform depth precision across massive distance ranges, essential for accurate astronomical visualization._
