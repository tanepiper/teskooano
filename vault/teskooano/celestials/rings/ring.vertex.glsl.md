---
aliases: [ring.vertex.glsl]
tags: [renderer, threejs, rings, shader, vertex]
type: shader
package: "@teskooano/celestials-rings"
file: "src/shaders/ring.vertex.glsl"
status: active
---

# ring.vertex.glsl

Vertex shader for ring systems with enhanced axial inclination controls, precession support, and parent tilt inheritance.

## Overview

The ring vertex shader is responsible for transforming vertex positions and applying complex transformations for ring systems, including individual ring tilt, system axial inclination, parent tilt inheritance, and precession effects. It provides the foundation for realistic ring rendering with proper orientation and movement.

## Shader Features

- **Enhanced Axial Inclination**: Individual ring tilt and system axial inclination
- **Parent Tilt Inheritance**: Rings can inherit the parent body's axial tilt
- **Precession Support**: Ring systems can precess over time
- **Ring Rotation**: Rings spin in their own plane
- **World Position Calculation**: Transforms local positions to world space
- **Normal Transformation**: Calculates world-space normals for lighting

## Uniform Variables

### Position and Rotation

```glsl
uniform vec3 uParentPosition; // World position of the parent body
uniform float rotationAngle; // Current rotation angle of the ring
```

- **uParentPosition**: World position of the parent body for positioning
- **rotationAngle**: Current rotation angle for ring spinning

### Enhanced Axial Inclination Controls

```glsl
uniform float uAxialInclination; // Ring system axial inclination
uniform float uRingTilt; // Individual ring tilt
uniform bool uInheritParentTilt; // Whether to inherit parent's axial tilt
uniform vec3 uParentAxialTilt; // Parent's axial tilt vector
uniform float uPrecessionAngle; // Precession angle
uniform float uPrecessionRate; // Precession rate
```

- **uAxialInclination**: Overall tilt of the ring system
- **uRingTilt**: Individual tilt of each ring
- **uInheritParentTilt**: Flag for parent tilt inheritance
- **uParentAxialTilt**: Parent body's axial tilt vector
- **uPrecessionAngle**: Current precession angle
- **uPrecessionRate**: Rate of precession

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the vertex.

- **Usage**: Passed through from input UV coordinates
- **Calculation**: `uv`

### vWorldNormal

```glsl
varying vec3 vWorldNormal;
```

Vertex normal in world space.

- **Usage**: Used in fragment shader for lighting calculations
- **Calculation**: `normalize((modelMatrix * vec4(normal, 0.0)).xyz)`

### vPosition

```glsl
varying vec3 vPosition;
```

World space position of the fragment.

- **Usage**: Used in fragment shader for lighting and shadow calculations
- **Calculation**: `(modelMatrix * finalPosition).xyz`

## Transformation Functions

### rotateZ

```glsl
mat4 rotateZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    c, -s, 0.0, 0.0,
    s, c, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}
```

Rotation matrix around Z axis for ring spinning.

### rotateX

```glsl
mat4 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, c, -s, 0.0,
    0.0, s, c, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}
```

Rotation matrix around X axis for ring tilting.

### rotateAxis

```glsl
mat4 rotateAxis(vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  float omc = 1.0 - c;

  return mat4(
    axis.x * axis.x * omc + c,
    axis.x * axis.y * omc - axis.z * s,
    axis.x * axis.z * omc + axis.y * s,
    0.0,
    axis.y * axis.x * omc + axis.z * s,
    axis.y * axis.y * omc + c,
    axis.y * axis.z * omc - axis.x * s,
    0.0,
    axis.z * axis.x * omc - axis.y * s,
    axis.z * axis.y * omc + axis.x * s,
    axis.z * axis.z * omc + c,
    0.0,
    0.0, 0.0, 0.0, 1.0
  );
}
```

Rotation matrix around arbitrary axis for parent tilt inheritance.

## Main Function

```glsl
void main() {
  vUv = uv;

  // Start with the base position
  vec4 finalPosition = vec4(position, 1.0);

  // Apply ring rotation (spinning in its own plane)
  finalPosition = rotateZ(rotationAngle) * finalPosition;

  // Apply individual ring tilt
  if (uRingTilt != 0.0) {
    finalPosition = rotateX(uRingTilt) * finalPosition;
  }

  // Apply ring system axial inclination
  if (uAxialInclination != 0.0) {
    finalPosition = rotateX(uAxialInclination) * finalPosition;
  }

  // Apply parent axial tilt inheritance if enabled
  if (uInheritParentTilt) {
    // Create rotation matrix from parent's axial tilt vector
    vec3 parentAxis = normalize(uParentAxialTilt);
    if (length(parentAxis) > 0.0) {
      // Calculate the angle from the default Y-axis to the parent's tilt axis
      vec3 defaultAxis = vec3(0.0, 1.0, 0.0);
      float dotProduct = dot(defaultAxis, parentAxis);
      float angle = acos(clamp(dotProduct, -1.0, 1.0));

      if (angle > 0.001) { // Only apply if there's a significant tilt
        vec3 rotationAxis = normalize(cross(defaultAxis, parentAxis));
        finalPosition = rotateAxis(rotationAxis, angle) * finalPosition;
      }
    }
  }

  // Apply precession if enabled
  if (uPrecessionRate > 0.0) {
    finalPosition = rotateZ(uPrecessionAngle) * finalPosition;
  }

  // Transform normal to world space
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

  // Calculate world position with all transformations applied
  vPosition = (modelMatrix * finalPosition).xyz;

  // Final position for rendering
  gl_Position = projectionMatrix * modelViewMatrix * finalPosition;

  #include <logdepthbuf_vertex>
}
```

## Transformation Pipeline

The vertex shader applies transformations in this specific order:

1. **Ring Rotation**: Spinning in its own plane using `rotateZ(rotationAngle)`
2. **Individual Ring Tilt**: Each ring's own tilt using `rotateX(uRingTilt)`
3. **System Axial Inclination**: Overall ring system tilt using `rotateX(uAxialInclination)`
4. **Parent Tilt Inheritance**: Inherit parent body's axial tilt using `rotateAxis`
5. **Precession**: Apply precession effects using `rotateZ(uPrecessionAngle)`

## Parent Tilt Inheritance

The parent tilt inheritance system:

1. **Axis Normalization**: Normalizes the parent's axial tilt vector
2. **Angle Calculation**: Calculates angle between default Y-axis and parent's tilt axis
3. **Rotation Axis**: Determines the rotation axis using cross product
4. **Transformation**: Applies rotation around the calculated axis

## Usage in Fragment Shader

The varying variables are used in the fragment shader for:

### vPosition

- **Lighting Calculations**: Distance calculations to light sources
- **Shadow Calculations**: Position for shadow ray intersection tests
- **World Space Effects**: Position-based effects

### vWorldNormal

- **Lighting Calculations**: Normal for lighting direction calculations
- **Surface Effects**: Normal-based surface effects
- **Shadow Casting**: Normal for shadow calculations

### vUv

- **Texture Sampling**: UV coordinates for texture sampling
- **Procedural Effects**: UV-based procedural effects

## Performance Considerations

- **Efficient Transformations**: Uses matrix multiplication for transformations
- **Conditional Transformations**: Only applies transformations when needed
- **Normal Normalization**: Ensures correct lighting calculations
- **Minimal Calculations**: Only performs necessary transformations

## Integration with Fragment Shader

The vertex shader works in conjunction with fragment shaders to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **Transformation Data**: Properly transformed positions and normals
3. **Lighting Foundation**: Essential data for realistic lighting calculations
4. **Shadow Effects**: Data for shadow rendering

## Dependencies

- **Model Matrix**: Object transformation matrix
- **Projection Matrix**: Camera projection matrix
- **Model View Matrix**: Combined model and view transformation
- **Normal Matrix**: Normal transformation matrix

## 🔗 Related

- [[ring.fragment.glsl]] - Ring fragment shader that uses this vertex shader output
- [[accretion-disk.fragment.glsl]] - Accretion disk fragment shader that uses this vertex shader output
- [[RingMaterial]] - Material that uses this shader
- [[AccretionDiskMaterial]] - Material that uses this shader
- [[RingSystemRenderer]] - Renderer that creates the geometry for this shader
