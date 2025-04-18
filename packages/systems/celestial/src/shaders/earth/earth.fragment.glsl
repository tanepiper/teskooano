uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D specularMap;
uniform sampler2D bumpMap;
// uniform sampler2D cloudMap; // Add later

uniform vec3 lightColor;
uniform float ambientIntensity;
uniform float diffuseIntensity;
uniform float specularIntensity;
uniform float shininess;
uniform float bumpScale;
uniform vec3 uWorldLightPosition; // New: Light position in world space
uniform vec3 uCameraPosition; // RENAMED: Camera position in world space

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition; // Still needed for specular
varying vec3 vViewNormal; // Still needed for specular

// Function to calculate perturbed normal from bump map
// Assumes bump map is grayscale height
// From https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl
vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float bumpScale ) {
	vec3 vSigmaX = dFdx( surf_pos );
	vec3 vSigmaY = dFdy( surf_pos );
	vec3 vN = surf_norm; // normalized
	vec3 R1 = cross( vSigmaY, vN );
	vec3 R2 = cross( vN, vSigmaX );
	float fDet = dot( vSigmaX, R1 );
	fDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 ); // Added for double-sided materials if needed
	vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
	return normalize( abs( fDet ) * surf_norm - vGrad * bumpScale );
}

float height( sampler2D bumpMap, vec2 uv ) {
	return texture2D( bumpMap, uv ).r; // Assuming height is in red channel
}

void main() {
  // --- Calculate gradient from bump map --- 
  vec2 texelSize = 1.0 / vec2(textureSize(bumpMap, 0)); // Get size of one texel
  float hx = height(bumpMap, vUv + vec2(texelSize.x, 0.0)) - height(bumpMap, vUv - vec2(texelSize.x, 0.0));
  float hy = height(bumpMap, vUv + vec2(0.0, texelSize.y)) - height(bumpMap, vUv - vec2(0.0, texelSize.y));
  vec2 dHdxy = vec2(hx, hy);

  // --- Calculate perturbed normal in World Space --- 
  vec3 perturbedWorldNormal = perturbNormalArb( vWorldPosition, normalize(vWorldNormal), dHdxy, bumpScale );
  // vec3 worldNormal = normalize(vWorldNormal); // Old geometric normal
  vec3 worldNormal = perturbedWorldNormal; // USE PERTURBED NORMAL FOR LIGHTING

  // --- World Space Lighting Calculations --- 
  vec3 worldLightDir = normalize(uWorldLightPosition - vWorldPosition);
  float NdotL = max(dot(worldNormal, worldLightDir), 0.0); // Use perturbed normal
  
  // --- World-Space Blinn-Phong --- 
  vec3 cameraToFrag = normalize(vWorldPosition - uCameraPosition);
  vec3 worldHalfVector = normalize(worldLightDir - cameraToFrag); 
  float NdotH = max(dot(worldNormal, worldHalfVector), 0.0); // Use perturbed normal

  // Sample textures
  vec3 dayColor = texture2D(dayMap, vUv).rgb;
  vec3 nightColor = texture2D(nightMap, vUv).rgb;
  float specularMask = texture2D(specularMap, vUv).r;

  // Blend factor for day/night transition (Uses World NdotL)
  float blendFactor = smoothstep(0.0, 0.1, NdotL); 
  
  // Calculate lighting components
  vec3 ambient = ambientIntensity * lightColor;
  vec3 diffuse = diffuseIntensity * NdotL * lightColor; // NdotL now uses perturbed normal
  
  // Calculate Blinn-Phong specular highlight (NdotH now uses perturbed normal)
  float specularFactor = pow(NdotH, shininess) * specularIntensity * specularMask;
  vec3 specular = specularFactor * lightColor;
  
  // Calculate lit color 
  vec3 litColor = dayColor * diffuse + specular;
  
  // Calculate emissive night color
  vec3 emissiveNight = nightColor;
  
  // Blend between lit color and emissive night color
  vec3 blendedColor = mix(emissiveNight, litColor, blendFactor);
  
  // Add ambient light
  vec3 outgoingLight = blendedColor + ambient * dayColor;
  
  gl_FragColor = vec4(outgoingLight, 1.0);

  // Apply sRGB encoding if necessary (often done automatically by Three.js)
  #ifdef SRGB_DECODE
    // gl_FragColor = sRGBTransferOETF(gl_FragColor);
  #endif
}
