// ============================================================================
// VERTEX SHADER TEMPLATE
// ============================================================================

attribute vec3 aPosition;           // Vertex position
attribute vec3 aNormal;             // Vertex normal
attribute vec2 aTexCoord;           // Texture coordinates
attribute vec4 aColor;              // Vertex color (optional)

uniform mat4 uModelMatrix;          // Model transformation
uniform mat4 uViewMatrix;           // View (camera) transformation
uniform mat4 uProjectionMatrix;     // Projection matrix
uniform mat4 uNormalMatrix;         // Normal transformation (inverse transpose of model-view)

varying vec3 vNormal;               // Pass normal to fragment shader
varying vec2 vTexCoord;             // Pass texture coords to fragment shader
varying vec3 vPosition;             // World position
varying vec4 vColor;                // Pass color to fragment shader

void main() {
    // Transform position to world space
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vPosition = worldPosition.xyz;

    // Transform to clip space
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    // Transform normal to world space
    vNormal = mat3(uNormalMatrix) * aNormal;

    // Pass texture coordinates
    vTexCoord = aTexCoord;

    // Pass vertex color
    vColor = aColor;
}

// ============================================================================
// FRAGMENT SHADER TEMPLATE
// ============================================================================

precision mediump float;

// Varyings from vertex shader
varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vPosition;
varying vec4 vColor;

// Material properties
uniform vec3 uAmbientColor;         // Ambient color
uniform vec3 uDiffuseColor;         // Diffuse color
uniform vec3 uSpecularColor;        // Specular color
uniform float uShininess;           // Specular shininess

// Textures
uniform sampler2D uDiffuseTexture;  // Diffuse texture
uniform sampler2D uNormalTexture;   // Normal map (optional)
uniform bool uUseTexture;           // Whether to use texture

// Lighting
uniform vec3 uLightPosition;        // Light position in world space
uniform vec3 uLightColor;           // Light color
uniform vec3 uViewPosition;         // Camera position in world space

void main() {
    // Normalize interpolated normal
    vec3 normal = normalize(vNormal);

    // Light direction
    vec3 lightDir = normalize(uLightPosition - vPosition);

    // View direction
    vec3 viewDir = normalize(uViewPosition - vPosition);

    // Ambient component
    vec3 ambient = uAmbientColor * uLightColor;

    // Diffuse component (Lambertian reflection)
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uDiffuseColor * uLightColor;

    // Specular component (Blinn-Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
    vec3 specular = spec * uSpecularColor * uLightColor;

    // Sample texture if enabled
    vec4 texColor = uUseTexture ? texture2D(uDiffuseTexture, vTexCoord) : vec4(1.0);

    // Combine components
    vec3 result = (ambient + diffuse + specular) * texColor.rgb;

    // Output final color
    gl_FragColor = vec4(result, texColor.a);
}

// ============================================================================
// SIMPLE UNLIT VERTEX SHADER
// ============================================================================

attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uMVP;  // Combined model-view-projection matrix

varying vec2 vTexCoord;

void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
    vTexCoord = aTexCoord;
}

// ============================================================================
// SIMPLE UNLIT FRAGMENT SHADER
// ============================================================================

precision mediump float;

varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec4 uColor;

void main() {
    gl_FragColor = texture2D(uTexture, vTexCoord) * uColor;
}

// ============================================================================
// POST-PROCESSING VERTEX SHADER (Fullscreen Quad)
// ============================================================================

attribute vec2 aPosition;  // [-1, 1] range

varying vec2 vTexCoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aPosition * 0.5 + 0.5;  // Convert to [0, 1] range
}

// ============================================================================
// POST-PROCESSING FRAGMENT SHADER EXAMPLES
// ============================================================================

// --- Grayscale ---
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(gray), color.a);
}

// --- Blur (simple box blur) ---
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uTexelSize;  // 1.0 / texture dimensions

void main() {
    vec4 sum = vec4(0.0);
    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            vec2 offset = vec2(float(x), float(y)) * uTexelSize;
            sum += texture2D(uTexture, vTexCoord + offset);
        }
    }
    gl_FragColor = sum / 25.0;
}

// --- Edge Detection (Sobel) ---
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uTexelSize;

void main() {
    float sobelX[9];
    sobelX[0] = -1.0; sobelX[1] =  0.0; sobelX[2] =  1.0;
    sobelX[3] = -2.0; sobelX[4] =  0.0; sobelX[5] =  2.0;
    sobelX[6] = -1.0; sobelX[7] =  0.0; sobelX[8] =  1.0;

    float sobelY[9];
    sobelY[0] = -1.0; sobelY[1] = -2.0; sobelY[2] = -1.0;
    sobelY[3] =  0.0; sobelY[4] =  0.0; sobelY[5] =  0.0;
    sobelY[6] =  1.0; sobelY[7] =  2.0; sobelY[8] =  1.0;

    float gx = 0.0;
    float gy = 0.0;

    for (int i = 0; i < 9; i++) {
        int x = i % 3 - 1;
        int y = i / 3 - 1;
        vec2 offset = vec2(float(x), float(y)) * uTexelSize;
        float sample = texture2D(uTexture, vTexCoord + offset).r;
        gx += sample * sobelX[i];
        gy += sample * sobelY[i];
    }

    float edge = sqrt(gx * gx + gy * gy);
    gl_FragColor = vec4(vec3(edge), 1.0);
}

// --- Vignette ---
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uVignetteStrength;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    vec2 center = vTexCoord - 0.5;
    float dist = length(center);
    float vignette = 1.0 - smoothstep(0.3, 0.7, dist * uVignetteStrength);
    gl_FragColor = vec4(color.rgb * vignette, color.a);
}
