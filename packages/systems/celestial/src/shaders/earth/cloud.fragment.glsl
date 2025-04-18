uniform sampler2D cloudMap;
uniform float cloudOpacity;
uniform vec3 cloudColor; // Allow tinting clouds slightly

varying vec2 vUv;

void main() {
  // Assuming cloud map uses alpha channel for transparency
  // If not, might need to use luminance or a specific channel
  float cloudAlpha = texture2D(cloudMap, vUv).a;
  // vec3 cloudSampleColor = texture2D(cloudMap, vUv).rgb; // If color needed

  // Basic lighting - slightly brighter where sun hits
  // float lighting = NdotL * 0.2 + 0.8; // Requires NdotL calculation
  
  gl_FragColor = vec4(cloudColor, cloudAlpha * cloudOpacity);
}
