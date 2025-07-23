# Architecture: Three.js Rendering Helpers (`/rendering`)

This directory contains helper classes for creating and managing Three.js scenes, lighting, and rendering components with consistent, optimized configurations.

## Core Components

### `SceneHelper.ts`

**Purpose**: Central utility for creating and configuring Three.js scenes, cameras, and renderers.

**Key Features**:

- **Scene Creation**: `createScene()`, `createBasicScene()`, `createSpaceScene()`, `createDebugScene()`
- **Resize Handling**: Automatic window resize management
- **Animation Loops**: Simple animation loop creation
- **Optimized Configurations**: Pre-configured setups for different use cases

**Usage Example**:

```typescript
import { SceneHelper } from "@teskooano/renderer-threejs-helpers";

// Create a space-optimized scene
const { scene, camera, renderer } = SceneHelper.createSpaceScene();

// Set up automatic resize handling
const cleanupResize = SceneHelper.setupResizeHandler(renderer, camera);

// Create animation loop
const stopAnimation = SceneHelper.createAnimationLoop(
  scene,
  camera,
  renderer,
  (deltaTime) => {
    // Update logic here
  },
);
```

### `LightingHelper.ts` ⭐ **NEW**

**Purpose**: Utility factory for creating individual THREE.Light instances with consistent configuration.
This helper works with the existing `@teskooano/renderer-threejs-lighting` system.

### `ShadowHelper.ts` ⭐ **NEW**

**Purpose**: Utility for configuring shadows on Three.js lights with consistent settings.
Provides specialized shadow configuration for different light types and use cases.

**Light Types Supported**:

- **AmbientLight**: General scene illumination
- **DirectionalLight**: Sun-like directional lighting
- **HemisphereLight**: Natural outdoor lighting (sky/ground)
- **PointLight**: Localized spherical illumination
- **SpotLight**: Focused directional lighting
- **RectAreaLight**: Rectangular illumination
- **LightProbe**: Environment lighting

**Key Features**:

- **Consistent Configuration**: Standardized defaults for each light type
- **Shadow Setup**: Automatic shadow map configuration where applicable
- **Light Helpers**: Debug helpers for visualizing light positions
- **Type Safety**: Full TypeScript support with proper typing

**Shadow Configuration Features**:

- **Light-Specific Shadows**: Optimized shadow settings for each light type
- **Performance Presets**: Space-optimized and performance-optimized configurations
- **Dynamic Frustum**: Automatic shadow camera adjustment based on scene content
- **Debug Helpers**: Shadow camera helpers for development
- **Focused Shadows**: Target-specific shadow configuration

#### **Creating Individual Lights**

```typescript
import { LightingHelper } from "@teskooano/renderer-threejs-helpers";

// Create ambient light
const ambient = LightingHelper.createAmbientLight(0xffffff, 0.3);

// Create directional light with shadows
const directional = LightingHelper.createDirectionalLight(
  0xffffff,
  0.7,
  [10, 10, 5],
  true,
  2048,
);

// Create point light
const pointLight = LightingHelper.createPointLight(
  0xffaa00, // Warm color
  1.0, // Intensity
  50, // Distance
  2, // Decay
  [10, 5, 10], // Position
  true, // Cast shadows
  1024, // Shadow map size
);

// Create spot light
const spotLight = LightingHelper.createSpotLight(
  0xffffff, // Color
  1.0, // Intensity
  0, // Distance (infinite)
  Math.PI / 6, // 30-degree angle
  0.1, // Penumbra
  2, // Decay
  [0, 10, 0], // Position
  true, // Cast shadows
  1024, // Shadow map size
);
```

#### **Integration with Three.js Lighting System**

```typescript
import { LightingHelper } from "@teskooano/renderer-threejs-helpers";
import {
  LightSourceComponent,
  LightingManager,
} from "@teskooano/renderer-threejs-lighting";

// Create a light using the helper
const pointLight = LightingHelper.createPointLight(0xffffff, 1.0, 0, 2);

// Create a light source component for a celestial object
const lightComponent = new LightSourceComponent(celestialObject, {
  light: pointLight,
  castShadow: true,
});

// Register with the lighting manager
lightingManager.register(lightComponent);
```

#### **Light Helpers (Debug)**

```typescript
// Create visual helpers for debugging light positions
const helpers = LightingHelper.createLightHelpers(
  [directional, pointLight, spotLight],
  2,
  true,
);

// Add helpers to scene
helpers.forEach((helper) => scene.add(helper));
```

#### **Shadow Configuration**

````typescript
import { ShadowHelper } from "@teskooano/renderer-threejs-helpers";

// Configure shadows for a directional light
ShadowHelper.configureDirectionalLightShadows(directional, {
  mapSize: 2048,
  cameraNear: 0.5,
  cameraFar: 500,
  bias: -0.0001,
});

// Configure high-quality shadows for space scenes
ShadowHelper.configureSpaceShadows(directional, {
  mapSize: 4096,
  cameraFar: 1000,
});

// Configure performance-optimized shadows
ShadowHelper.configurePerformanceShadows(pointLight, {
  mapSize: 512,
  disableShadows: false,
});

// Configure focused shadows for a specific target
ShadowHelper.configureFocusedShadows(directional, targetObject, {
  padding: 10,
  mapSize: 2048,
});

// Create shadow camera helper for debugging
const shadowHelper = ShadowHelper.createShadowCameraHelper(directional);
scene.add(shadowHelper);

// Dynamically update shadow frustum based on scene objects
ShadowHelper.updateShadowFrustum(directional, sceneObjects, {
  padding: 5,
  maxDistance: 1000,
});

### `LineHelper.ts`
**Purpose**: Utility for creating and managing Three.js line geometries with optimized performance.

**Features**:
- **Line Building**: Efficient line creation with material management
- **Performance Optimization**: Reusable line geometries and materials
- **Memory Management**: Automatic cleanup and resource pooling

## Integration Patterns

### **Scene + Lighting Setup**
```typescript
import { SceneHelper, LightingHelper, ShadowHelper } from "@teskooano/renderer-threejs-helpers";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";

// Create scene
const { scene, camera, renderer } = SceneHelper.createSpaceScene();

// Create lighting manager
const lightingManager = new LightingManager(scene);

// Create lights using helper
const ambient = LightingHelper.createAmbientLight(0x001122, 0.1);
const directional = LightingHelper.createDirectionalLight(0xffffff, 0.5, [0, 50, 0]);

// Configure shadows for space scenes
ShadowHelper.configureSpaceShadows(directional, {
  mapSize: 4096,
  cameraFar: 1000,
});

// Add lights to scene
scene.add(ambient);
scene.add(directional);

// Set up resize handling
const cleanupResize = SceneHelper.setupResizeHandler(renderer, camera);

// Create animation loop
const stopAnimation = SceneHelper.createAnimationLoop(scene, camera, renderer);
````

### **Dynamic Lighting Changes**

```typescript
// Update lighting dynamically
const updateLighting = (time: number) => {
  // Animate directional light position
  directional.position.x = Math.sin(time * 0.001) * 50;
  directional.position.z = Math.cos(time * 0.001) * 50;

  // Update light intensity based on time
  ambient.intensity = 0.1 + Math.sin(time * 0.002) * 0.05;
};
```

## Performance Considerations

### **Shadow Maps**

- **Basic Scenes**: 2048x2048 resolution
- **Space Scenes**: 4096x4096 resolution for detailed shadows
- **Debug Mode**: Disable shadows for faster rendering

### **Light Count**

- **Mobile**: Limit to 2-3 lights with shadows
- **Desktop**: Can handle 4-6 lights with shadows
- **High-End**: Support for 8+ lights with complex setups

### **Helper Visibility**

- **Development**: Show light helpers for debugging
- **Production**: Hide helpers for better performance

## Best Practices

1. **Use LightingHelper for Creation**: Create lights with consistent configuration
2. **Use ShadowHelper for Configuration**: Configure shadows with appropriate settings for your use case
3. **Use Three.js Lighting System for Management**: Let LightingManager handle light influence and shadows
4. **Optimize Shadow Maps**: Use appropriate shadow map sizes for your use case
5. **Limit Light Count**: Balance visual quality with performance
6. **Debug with Helpers**: Use light and shadow helpers during development, disable in production
7. **Choose Shadow Presets**: Use space-optimized shadows for astronomical scenes, performance-optimized for mobile

## Architecture Notes

### **Separation of Concerns**

- **LightingHelper**: Creates individual light instances with consistent configuration
- **ShadowHelper**: Configures shadows with optimized settings for different use cases
- **@teskooano/renderer-threejs-lighting**: Manages light sources, shadow casting, and light influence
- **SceneHelper**: Handles scene, camera, and renderer setup

### **Integration Flow**

1. Use `LightingHelper` to create lights with proper configuration
2. Use `ShadowHelper` to configure shadows with appropriate settings
3. Use `LightSourceComponent` to wrap lights for celestial objects
4. Use `LightingManager` to manage all lights and their interactions
5. Use `SceneHelper` for scene setup and management

This architecture provides a clean separation between light creation (helpers), light management (lighting system), and scene management (scene helpers).
