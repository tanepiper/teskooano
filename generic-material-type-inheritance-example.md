# Generic Material Type Inheritance - Complete Example

## Overview

This document demonstrates the complete type inheritance chain we've established for the celestial rendering system, showing how materials flow through the generic type system from the base classes down to specific implementations.

## Type Inheritance Hierarchy

### 1. Base Level: BaseCelestialRenderer

```typescript
export abstract class BaseCelestialRenderer<
  TMaterial extends THREE.Material = THREE.Material,
> {
  // Generic base that can work with any THREE.Material type

  protected createMaterial?(object: RenderableCelestialObject): TMaterial;

  public createAndRegisterMaterial(
    object: RenderableCelestialObject,
  ): TMaterial | undefined {
    if (this.createMaterial) {
      const material = this.createMaterial(object);
      this.registerMaterial(object.celestialObjectId, material);
      return material;
    }
    return undefined;
  }

  public getTypedMaterial(id: string): TMaterial | undefined {
    const material = this.materialManager.getMaterial(id);
    if (material && !Array.isArray(material)) {
      return material as TMaterial;
    }
    return undefined;
  }
}
```

### 2. Star Rendering Hierarchy

#### Base Star Renderer

```typescript
export abstract class BaseStarRenderer<
  TStarMaterial extends BaseStarMaterial = BaseStarMaterial,
> extends BaseCelestialRenderer<TStarMaterial> {
  // All star renderers work with BaseStarMaterial or its subclasses
  protected abstract createMaterial(
    object: RenderableCelestialObject,
  ): TStarMaterial;
}
```

#### Main Sequence Star Renderer

```typescript
export class MainSequenceStarRenderer<
  TMainSequenceMaterial extends
    MainSequenceStarMaterial = MainSequenceStarMaterial,
> extends BaseStarRenderer<TMainSequenceMaterial> {
  // Main sequence stars work with MainSequenceStarMaterial or its subclasses
  protected createMaterial(
    object: RenderableCelestialObject,
  ): TMainSequenceMaterial {
    const color = this.getStarColor(object);
    const material = new MainSequenceStarMaterial(
      color,
    ) as TMainSequenceMaterial;
    return material;
  }
}
```

#### Specific Star Class Implementations

```typescript
// O-class stars use specific material type
export class ClassOStarRenderer extends MainSequenceStarRenderer<ClassOStarMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassOStarMaterial {
    return new ClassOStarMaterial();
  }
}

// G-class stars (like our Sun) use specific material type
export class ClassGStarRenderer extends MainSequenceStarRenderer<ClassGStarMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassGStarMaterial {
    return new ClassGStarMaterial();
  }
}

// Wolf-Rayet stars bypass MainSequenceStarRenderer and extend BaseStarRenderer directly
export class WolfRayetRenderer extends BaseStarRenderer<WolfRayetMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): WolfRayetMaterial {
    return new WolfRayetMaterial();
  }
}

// Black holes use specialized materials
export class SchwarzschildBlackHoleRenderer extends BaseStarRenderer<SchwarzschildBlackHoleMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): SchwarzschildBlackHoleMaterial {
    return new SchwarzschildBlackHoleMaterial();
  }
}
```

### 3. Gas Giant Rendering Hierarchy

#### Base Gas Giant Renderer

```typescript
export abstract class BaseGasGiantRenderer<
  TGasGiantMaterial extends BaseGasGiantMaterial = BaseGasGiantMaterial,
> extends BaseCelestialRenderer<TGasGiantMaterial> {
  // All gas giant renderers work with BaseGasGiantMaterial or its subclasses
  protected abstract createMaterial(
    object: RenderableCelestialObject,
  ): TGasGiantMaterial;
}
```

#### Specific Gas Giant Class Implementations

```typescript
// Class I gas giants
export class ClassIGasGiantRenderer extends BaseGasGiantRenderer<ClassIMaterial> {
  protected createMaterial(object: RenderableCelestialObject): ClassIMaterial {
    const properties = object.properties as GasGiantProperties;
    return new ClassIMaterial({
      atmosphereColor: new THREE.Color(properties.atmosphereColor || 0xffffe0),
      cloudColor: new THREE.Color(properties.cloudColor || 0xd2b48c),
      seed: this.generateSeed(object),
      stormMap: undefined,
    });
  }
}

// Class V gas giants
export class ClassVGasGiantRenderer extends BaseGasGiantRenderer<ClassVMaterial> {
  protected createMaterial(object: RenderableCelestialObject): ClassVMaterial {
    const properties = object.properties as GasGiantProperties;
    return new ClassVMaterial({
      baseColor: new THREE.Color(properties.atmosphereColor || 0xfff8dc),
      emissiveColor: new THREE.Color(properties.emissiveColor || 0xff6600),
      emissiveIntensity: properties.emissiveIntensity ?? 0.1,
      stormMap: undefined,
    });
  }
}
```

### 4. Terrestrial Rendering Hierarchy

#### Base Terrestrial Renderer

```typescript
export class BaseTerrestrialRenderer<
  TTerrestrialMaterial extends
    ProceduralPlanetMaterial = ProceduralPlanetMaterial,
> extends BaseCelestialRenderer<TTerrestrialMaterial> {
  // Terrestrial objects use ProceduralPlanetMaterial or its subclasses
  protected createMaterial(
    object: RenderableCelestialObject,
  ): TTerrestrialMaterial {
    const bodyMaterial = this.materialService.createMaterial(object);
    return bodyMaterial as TTerrestrialMaterial;
  }
}
```

### 5. Other Renderers (Non-Generic)

Some renderers don't need specific material types and use the default generic:

```typescript
// Ring systems use basic materials
export class RingSystemRenderer extends BaseCelestialRenderer {
  // Uses default THREE.Material generic parameter
}

// Particle systems use shader materials
export class AsteroidFieldRenderer extends BaseCelestialRenderer {
  // Uses default THREE.Material generic parameter
}

// Comet renderers use multiple material types
export class CometRenderer extends BaseCelestialRenderer {
  // Uses default THREE.Material generic parameter for flexibility
}
```

## Type Safety Benefits

### 1. Compile-Time Type Checking

```typescript
// This is now type-safe and will catch errors at compile time
const oStarRenderer = new ClassOStarRenderer();
const material = oStarRenderer.getTypedMaterial("star-id");
// material is correctly typed as ClassOStarMaterial | undefined

// This would cause a compile error if you tried to assign the wrong type
const gasGiantRenderer = new ClassVGasGiantRenderer(object, deps);
// const wrongMaterial: ClassOStarMaterial = gasGiantRenderer.createMaterial(object); // ERROR!
```

### 2. Better IntelliSense Support

```typescript
const starRenderer = new ClassGStarRenderer();
const material = starRenderer.getTypedMaterial("sun-id");
if (material) {
  // IDE now knows this is ClassGStarMaterial and shows appropriate methods/properties
  material.uniforms.starColor.value = new THREE.Color(0xffcc00);
  material.uniforms.coronaIntensity.value = 0.5;
}
```

### 3. Polymorphic Usage

```typescript
// You can still use them polymorphically through base types
const renderers: BaseStarRenderer[] = [
  new ClassOStarRenderer(),
  new ClassGStarRenderer(),
  new WolfRayetRenderer(),
];

// Each renderer creates its appropriate material type
renderers.forEach((renderer) => {
  const material = renderer.createAndRegisterMaterial(starObject);
  // material is correctly typed for each renderer
});
```

## Usage Examples

### Creating a New Star Type

```typescript
// 1. Define the material
export class ClassTStarMaterial extends MainSequenceStarMaterial {
  constructor() {
    super(new THREE.Color(0xff4500), {
      coronaIntensity: 0.9,
      temperatureVariation: 0.2,
    });
  }
}

// 2. Create the renderer with proper typing
export class ClassTStarRenderer extends MainSequenceStarRenderer<ClassTStarMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassTStarMaterial {
    return new ClassTStarMaterial();
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xff4500); // Orange-red
  }
}

// 3. Use with full type safety
const tStarRenderer = new ClassTStarRenderer();
const tStarMaterial = tStarRenderer.getTypedMaterial("t-star-id");
// tStarMaterial is typed as ClassTStarMaterial | undefined
```

### Working with Material Updates

```typescript
// Type-safe material updates
export class EnhancedTerrestrialRenderer extends BaseTerrestrialRenderer<ProceduralPlanetMaterial> {
  updatePlanetSurface(
    objectId: string,
    surfaceProps: ProceduralSurfaceProperties,
  ): void {
    const material = this.getTypedMaterial(objectId);
    if (material) {
      // TypeScript knows this is ProceduralPlanetMaterial
      material.uniforms.uColor1.value.set(surfaceProps.color1);
      material.uniforms.uTerrainAmplitude.value = surfaceProps.terrainAmplitude;
      material.needsUpdate = true;
    }
  }
}
```

## Migration Path

### For Existing Code

```typescript
// Old approach (still works for backward compatibility)
const material = renderer.getMaterial("object-id"); // Returns THREE.Material | undefined

// New approach (type-safe)
const typedMaterial = renderer.getTypedMaterial("object-id"); // Returns TMaterial | undefined
```

### For New Renderers

```typescript
// Follow the pattern:
// 1. Extend appropriate base renderer with your material type
// 2. Implement createMaterial() method
// 3. Use getTypedMaterial() for type-safe access

export class MyCustomRenderer extends BaseCelestialRenderer<MyCustomMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): MyCustomMaterial {
    return new MyCustomMaterial(object.properties);
  }
}
```

## Conclusion

This enhanced generic type system provides:

- **Type Safety**: Compile-time checking prevents material type mismatches
- **Better IDE Support**: IntelliSense works correctly with specific material types
- **Maintainability**: Clear contracts between renderers and their materials
- **Extensibility**: Easy to add new renderer/material combinations
- **Backward Compatibility**: Existing code continues to work unchanged

The type inheritance chain ensures that each level of the hierarchy maintains appropriate constraints while allowing for maximum flexibility and type safety.
