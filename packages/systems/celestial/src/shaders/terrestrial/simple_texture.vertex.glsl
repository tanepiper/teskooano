// Vertex shader for rendering pre-baked texture maps

// Attributes from THREE.SphereGeometry (ensure tangents are computed!)
attribute vec4 tangent; // Add tangent attribute

// NEW: Uniforms for displacement mapping
uniform sampler2D heightMap;        // Texture containing height data (0.0 to 1.0)
uniform float displacementScale; // Multiplier for height displacement

varying vec2 vUv;
varying vec3 vNormalView; // Original sphere normal (view space)
varying vec3 vViewPosition; // Position in view space (AFTER displacement)
varying mat3 vTBN; // Pass TBN matrix to fragment shader

void main() {
  vUv = uv;
  
  // --- Displacement Calculation ---
  float height = 0.0;
  if (displacementScale > 0.0 && textureSize(heightMap, 0).x > 0) { // Check if heightMap is valid
    height = texture2D(heightMap, vUv).r; // Sample height (assuming it's in red channel)
  }
  vec3 displacement = normalize(position) * height * displacementScale; // Displace along original normal
  vec3 displacedPosition = position + displacement;
  // --- End Displacement ---

  // Calculate view-space position using the DISPLACED position
  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = mvPosition.xyz;

  // Calculate normal and TBN based on ORIGINAL geometry for consistent lighting/normal mapping
  // (Recalculating normals on displaced geometry is complex and often not needed for this effect)
  vNormalView = normalize(normalMatrix * normal);
  vec3 tangentView = normalize(normalMatrix * tangent.xyz);
  vec3 bitangentView = normalize(cross(vNormalView, tangentView) * tangent.w);
  vTBN = mat3(tangentView, bitangentView, vNormalView);

  gl_Position = projectionMatrix * mvPosition;
} 