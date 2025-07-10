varying vec3 vColor;
varying float vTextureIndex;
varying float vInitialRotation;

uniform sampler2D asteroidTextures[5];
uniform float alphaTest;
uniform float time;
uniform float particleRotationSpeed;

void main() {
  // Create circular particle with falloff
  vec2 fromCenter = gl_PointCoord * 2.0 - 1.0;
  float len = length(fromCenter);
  if (len > 1.0) discard; 
  
  // Apply rotation to texture coordinates
  float angle = vInitialRotation + time * particleRotationSpeed;
  mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  
  vec2 center = vec2(0.5, 0.5);
  vec2 uv = gl_PointCoord - center;
  vec2 rotatedUV = rotationMatrix * uv + center;

  // Sample the appropriate texture based on texture index
  vec4 texColor;
  if (vTextureIndex < 0.5) {
      texColor = texture2D(asteroidTextures[0], rotatedUV);
  } else if (vTextureIndex < 1.5) {
      texColor = texture2D(asteroidTextures[1], rotatedUV);
  } else if (vTextureIndex < 2.5) {
      texColor = texture2D(asteroidTextures[2], rotatedUV);
  } else if (vTextureIndex < 3.5) {
      texColor = texture2D(asteroidTextures[3], rotatedUV);
  } else {
      texColor = texture2D(asteroidTextures[4], rotatedUV);
  }

  // Alpha test to discard transparent pixels
  if (texColor.a < alphaTest) discard; 

  // Apply vertex color modulation and brightness
  vec3 finalColor = texColor.rgb * vColor * 1.5; // Slight brightness boost
  float finalAlpha = texColor.a * (1.0 - len * 0.3); // Slight edge falloff
  
  gl_FragColor = vec4(finalColor, finalAlpha);
} 