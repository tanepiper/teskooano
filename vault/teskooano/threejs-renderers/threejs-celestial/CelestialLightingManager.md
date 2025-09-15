---
aliases:
  [
    CelestialLightingManager,
    lighting-manager,
    celestial-lighting,
    light-management,
  ]
tags: [renderer, threejs, celestial, manager, lighting, light, shadow, ambient]
type: Class
package: "@teskooano/renderer-threejs-celestial"
name: CelestialLightingManager
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/core-physics",
    "@teskooano/renderer-threejs-lighting",
    "three",
  ]
classes: ["LightingCalculator", "ShadowCasterUtils", "WasmSpatialService"]
functions: ["findBodiesInRange"]
constants: ["AU_METERS", "METERS_TO_SCENE_UNITS"]
types:
  [
    "LightSourcesMap",
    "LightSourceData",
    "ShadowCasterData",
    "RenderableCelestialObject",
    "CelestialType",
    "LightingConfig",
  ]
status: active
---

# CelestialLightingManager

Comprehensive lighting management for celestial renderers with caching, optimization, and advanced lighting calculations.

## 🎯 Purpose

The `CelestialLightingManager` provides centralized lighting functionality for celestial renderers:

- **Light Source Caching**: Efficient caching of lighting calculations
- **Distance Attenuation**: Physically-based light falloff
- **Shadow Caster Detection**: Automatic shadow caster identification
- **Dynamic Ambient Lighting**: Realistic ambient light based on nearby stars
- **Performance Optimization**: Throttled updates and intelligent caching

## 🚀 Core Features

### 1. Light Source Management

- **Light Source Caching**: Efficient caching of lighting calculations
- **Distance Attenuation**: Physically-based light falloff
- **Dynamic Updates**: Real-time light source updates

### 2. Shadow Caster Detection

- **Automatic Detection**: Automatic shadow caster identification
- **Spatial Optimization**: Uses WASM spatial service for efficient queries
- **Ring System Support**: Specialized shadow caster detection for ring systems

### 3. Ambient Lighting

- **Dynamic Ambient**: Realistic ambient light based on nearby stars
- **Intelligent Caching**: Caches ambient light calculations
- **Performance Optimization**: Throttled updates and intelligent caching

## 🏗️ Architecture

### Instance-Based Design

Each manager instance is associated with a specific celestial object and provides:

- **LightingCalculator**: Instance-based lighting calculations with caching
- **ShadowCasterUtils**: Shadow caster detection using WASM spatial service
- **Light Source Management**: Internal light sources map

### Caching System

Implements intelligent caching to avoid redundant calculations:

- **Attenuated Light Sources**: Cached distance-attenuated light data
- **Ambient Light**: Cached ambient light calculations
- **Closest Light Source**: Cached closest light source data
- **Shadow Casters**: Cached shadow caster detection results

## 🔧 Core Methods

### Light Source Management

```typescript
// Update and retrieve light sources
updateLightSources(lightSources: LightSourcesMap): void;
getLightSources(): LightSourcesMap;

// Apply distance attenuation
applyLightAttenuation(config?: LightingConfig, forceRefresh?: boolean): LightSourcesMap;

// Find specific light sources
findClosestLightSource(forceRefresh?: boolean): LightSourceData | null;
findPrimaryLightSource(object: RenderableCelestialObject, lightSources?: LightSourcesMap): LightSourceData | null;
```

### Shadow Caster Detection

```typescript
// Find shadow casters for this object
findShadowCasters(forceRefresh?: boolean): ShadowCasterData[];

// Find shadow casters for ring systems
findRingShadowCasters(forceRefresh?: boolean): ShadowCasterData[];
```

### Ambient Lighting

```typescript
// Calculate dynamic ambient lighting
calculateDynamicAmbientLight(forceRefresh?: boolean): number;

// Calculate light intensity at distance
calculateLightIntensityAtDistance(
  lightSource: LightSourceData,
  distance: number,
  falloffFactor?: number
): number;
```

### Lifecycle Management

```typescript
// Initialization
initializeLightingCalculator(object: RenderableCelestialObject): void;

// Updates
updateLightingCalculator(
  object: RenderableCelestialObject,
  allObjects?: Record<string, RenderableCelestialObject>
): void;

// Cleanup
dispose(): void;
```

## 🌟 Lighting Calculations

### Distance Attenuation

```typescript
applyDistanceAttenuation(
  lightSources: LightSourcesMap,
  config: LightingConfig = {},
  forceRefresh: boolean = false
): LightSourcesMap {
  // Return cached result if valid
  if (!forceRefresh && this.cacheValid && this.attenuatedLightSourcesCache) {
    return this.attenuatedLightSourcesCache;
  }

  const { falloffFactor = 0.00000001, modifyInPlace = true } = config;
  const resultSources = modifyInPlace ? lightSources : new Map(lightSources);

  resultSources.forEach((lightData) => {
    const distanceSq = this.object.position.distanceToSquared(lightData.position);
    const attenuation = 1.0 / (1.0 + distanceSq * falloffFactor);
    lightData.intensity = (lightData.intensity ?? 1.0) * attenuation;
  });

  // Update cache
  this.attenuatedLightSourcesCache = resultSources;
  this.cacheValid = true;

  return resultSources;
}
```

### Dynamic Ambient Lighting

```typescript
calculateDynamicAmbientLight(forceRefresh?: boolean): number {
  if (!forceRefresh && this.cacheValid && this.ambientLightCache !== null) {
    return this.ambientLightCache;
  }

  let totalAmbient = 0;

  for (const [starId, lightData] of this.lightSources.entries()) {
    const distance = this.object.position.distanceTo(lightData.position);
    const distanceSq = distance * distance;

    // Get luminosity from star properties or light intensity
    let luminosity = lightData.intensity ?? 1.0;
    if (this.allObjects && this.allObjects[starId]) {
      const starObject = this.allObjects[starId];
      if (starObject.type === CelestialType.STAR && starObject.properties) {
        const starProps = starObject.properties as any;
        luminosity = starProps.systemLighting?.starLightIntensity ?? lightData.intensity ?? 1.0;
      }
    }

    // Calculate ambient falloff (stronger than direct light falloff)
    const ambientFalloff = 1.0 / (1.0 + distanceSq * 0.000000001);
    const ambientContribution = 0.5 * luminosity * ambientFalloff;
    totalAmbient += ambientContribution;
  }

  // Clamp between minimum and maximum
  const result = Math.max(0.05, Math.min(totalAmbient, 0.5));

  this.ambientLightCache = result;
  this.cacheValid = true;

  return result;
}
```

## 🌑 Shadow Caster Detection

### Object-Based Shadow Casters

```typescript
findShadowCasters(forceRefresh?: boolean): ShadowCasterData[] {
  if (!forceRefresh && this.cacheValid && this.shadowCasterCache.length > 0) {
    return this.shadowCasterCache;
  }

  const shadowCasters: ShadowCasterData[] = [];

  // If object is a planet-like body, its moons are shadow casters
  if (this.object.type === CelestialType.PLANET ||
      this.object.type === CelestialType.DWARF_PLANET ||
      this.object.type === CelestialType.GAS_GIANT) {

    const searchDistance = 0.1 * AU_METERS; // 0.1 AU in meters
    const positionInMeters = new THREE.Vector3(
      this.object.position.x / METERS_TO_SCENE_UNITS,
      this.object.position.y / METERS_TO_SCENE_UNITS,
      this.object.position.z / METERS_TO_SCENE_UNITS
    );

    const nearbyBodies = this.spatialService.findBodiesInRange(positionInMeters, searchDistance);

    // Filter for moons of this object
    for (const bodyId of nearbyBodies) {
      const moon = this.allObjects[bodyId];
      if (moon && moon.type === CelestialType.MOON && moon.parentId === this.object.id) {
        shadowCasters.push({
          position: moon.position.clone(),
          radius: moon.radius ?? 0,
        });
      }
    }
  }
  // Universal rule: any object can be shadowed by its parent, unless parent is a star
  else if (this.object.parentId) {
    const parentBody = this.allObjects[this.object.parentId];
    if (parentBody && parentBody.type !== CelestialType.STAR) {
      shadowCasters.push({
        position: parentBody.position.clone(),
        radius: parentBody.radius ?? 0,
      });
    }
  }

  this.shadowCasterCache = shadowCasters;
  this.cacheValid = true;

  return shadowCasters;
}
```

## 🚀 Usage Example

```typescript
// Create lighting manager
const lightingManager = new CelestialLightingManager(renderer);

// Initialize with celestial object
lightingManager.initializeLightingCalculator(celestialObject);

// Update with current light sources
lightingManager.updateLightSources(lightSources);

// Get attenuated light sources
const attenuatedLights = lightingManager.applyLightAttenuation({
  falloffFactor: 0.00000001,
  modifyInPlace: false,
});

// Find closest light source
const closestLight = lightingManager.findClosestLightSource();

// Calculate ambient lighting
const ambientIntensity = lightingManager.calculateDynamicAmbientLight();

// Find shadow casters
const shadowCasters = lightingManager.findShadowCasters();

// Update with new object data
lightingManager.updateLightingCalculator(updatedObject, allObjects);

// Cleanup
lightingManager.dispose();
```

## 🎯 Performance Optimizations

### Caching Strategy

- **Light Source Caching**: Avoids recalculating attenuation
- **Ambient Light Caching**: Caches ambient calculations
- **Shadow Caster Caching**: Caches shadow detection results
- **Cache Invalidation**: Automatic cache clearing on object updates

### Calculation Optimizations

- **Squared Distance**: Uses squared distance for efficiency
- **Early Returns**: Returns cached results when possible
- **Batch Processing**: Processes multiple light sources efficiently
- **Spatial Optimization**: Uses WASM spatial service for shadow detection

## 🔗 Integration Points

### With BaseCelestialRenderer

- Provides lighting calculations for renderers
- Integrates with material and shader systems
- Supports both direct and ambient lighting

### With WASM Spatial Service

- Uses spatial service for efficient shadow caster detection
- Integrates with physics engine data
- Provides accurate spatial queries

### With State Management

- Integrates with simulation state for object data
- Supports dynamic object updates
- Maintains consistency with physics engine

## ⚡ Performance Considerations

### Efficiency

- **Intelligent Caching**: Avoids redundant calculations through caching
- **Squared Distance**: Uses squared distance for efficiency
- **Early Returns**: Returns cached results when possible
- **Batch Processing**: Processes multiple light sources efficiently

### Quality Metrics

- **Accuracy**: Accurate lighting calculations for realistic rendering
- **Performance**: Minimal performance impact on rendering
- **Memory Usage**: Efficient memory usage with caching
- **Consistency**: Consistent lighting calculations across frames

### Performance Monitoring

- **Cache Hit Rate**: Monitor cache effectiveness
- **Calculation Time**: Track lighting calculation performance
- **Memory Usage**: Monitor memory usage for caching
- **Light Count**: Track number of lights being processed

## 🔌 Integration Points

### Primary Integration

- **BaseCelestialRenderer**: Provides lighting calculations for renderers
- **WasmSpatialService**: Uses spatial service for shadow detection
- **State Management**: Integrates with simulation state

### Secondary Integration

- **Lighting System**: Integration with lighting management systems
- **Performance Monitoring**: Integration with performance monitoring
- **Debug Systems**: Integration with debug and development systems

## 🐛 Debug Features

### Validation

- **Light Validation**: Validates light source data
- **Cache Validation**: Validates cache integrity
- **Distance Validation**: Validates distance calculations
- **Configuration Validation**: Validates lighting configuration

### Monitoring

- **Cache Stats**: Tracks cache statistics and effectiveness
- **Calculation Stats**: Monitors lighting calculation performance
- **Memory Stats**: Monitors memory usage for caching
- **Light Stats**: Tracks light source processing statistics

### Debugging Tools

- **Cache Info**: Get detailed cache information
- **Calculation Info**: Get calculation performance information
- **Memory Info**: Get memory usage information
- **Light Info**: Get light source processing information

## 🔮 Future Enhancements

### Optimization Opportunities

- **Advanced Caching**: More sophisticated caching strategies
- **Predictive Calculations**: Predict lighting needs for better performance
- **Memory Optimization**: Optimize memory usage for caching
- **Performance Profiling**: Enhanced performance monitoring

### Potential Improvements

- **Multi-threaded Calculations**: Parallel lighting calculations for better performance
- **Advanced Attenuation**: More sophisticated attenuation models
- **Dynamic Ambient**: More dynamic ambient lighting calculations
- **Advanced Validation**: More sophisticated validation and error handling

## 🔗 Related Components

- [[BaseCelestialRenderer]] - Uses this manager for lighting calculations
- [[LightingCalculator]] - Instance-based lighting calculations
- [[ShadowCasterUtils]] - Shadow caster detection utilities
- [[WasmSpatialService]] - Spatial queries for shadow detection

## 📚 Architecture Patterns

- **Manager Pattern**: Centralized lighting management
- **Caching Pattern**: Intelligent result caching
- **Strategy Pattern**: Configurable lighting calculations
- **Observer Pattern**: Integrates with state management

---

_The CelestialLightingManager provides comprehensive, performance-optimized lighting calculations with intelligent caching and advanced features for realistic celestial lighting._
