<script setup>
import DefaultTheme from "vitepress/theme";
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vitepress";

const { Layout } = DefaultTheme;
const router = useRouter();
const nebulaCanvas = ref(null);
let animationFrame = null;

// Nebula background setup
const setupNebula = () => {
  if (!nebulaCanvas.value) return;

  const canvas = nebulaCanvas.value;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return;

  // Fragment shader - creates the nebula effect
  const fragmentShaderSource = `
    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
      vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
      a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
      a.xy = mix(a.xz, a.yw, f.y);
      return mix(a.x, a.y, f.z);
    }
    
    float fbm(vec3 p) {
      float f = 0.;
      f += .5 * noise(p); p *= 2.02;
      f += .25 * noise(p); p *= 2.03;
      f += .125 * noise(p);
      return f;
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy - 0.5;
      uv.x *= resolution.x / resolution.y;
      
      vec3 p = vec3(uv * 2., time * 0.05);
      float noise = fbm(p);
      
      // More subtle nebula colors
      vec3 purple = vec3(0.4, 0.3, 0.6);
      vec3 darkBlue = vec3(0.1, 0.15, 0.3);
      vec3 blue = vec3(0.2, 0.4, 0.6);
      
      vec3 color = mix(
        darkBlue,
        mix(purple, blue, noise),
        smoothstep(0.2, 0.6, noise)
      );
      
      // Very subtle stars
      float stars = pow(noise, 20.0) * 1.0;
      color += vec3(stars);
      
      // Apply stronger fade out at edges
      float vignette = 1.0 - smoothstep(0.3, 1.3, length(uv));
      color *= vignette;
      
      // Apply very low opacity for the effect
      gl_FragColor = vec4(color, 0.15);
    }
  `;

  // Vertex shader - basic 2D positioning
  const vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // Compile shaders
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Setup a quad covering the entire viewport
  const vertices = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Setup position attribute
  const positionLocation = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Setup uniforms
  const timeLocation = gl.getUniformLocation(program, "time");
  const resolutionLocation = gl.getUniformLocation(program, "resolution");

  // Animation function
  const startTime = Date.now();
  const animate = () => {
    const time = (Date.now() - startTime) * 0.001; // convert to seconds

    gl.uniform1f(timeLocation, time);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationFrame = requestAnimationFrame(animate);
  };

  animate();
};

// Handle window resize
const handleResize = () => {
  if (nebulaCanvas.value) {
    nebulaCanvas.value.width = window.innerWidth;
    nebulaCanvas.value.height = window.innerHeight;
  }
};

// Apply medium zoom on load
onMounted(() => {
  setupNebula();
  window.addEventListener("resize", handleResize);
});

// Clean up on unmount
onBeforeUnmount(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <link rel="me" href="https://mastodon.gamedev.place/@teskooano" />

  <div class="nebula-container">
    <canvas ref="nebulaCanvas" class="nebula-canvas"></canvas>
  </div>
  <Layout />
</template>

<style>
.nebula-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -100;
  pointer-events: none;
}

.nebula-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
