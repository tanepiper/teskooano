varying vec3 vColor;
varying float vInitialRotation;
uniform sampler2D cloudTexture;
uniform float alphaTest;
uniform float time;
uniform float particleRotationSpeed;

void main() {
    vec4 texColor = texture2D(cloudTexture, gl_PointCoord);
    
    if (texColor.a < alphaTest) discard;

    gl_FragColor = texColor * vec4(vColor, 1.0);
} 