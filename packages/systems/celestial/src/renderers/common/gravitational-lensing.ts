import * as THREE from 'three';

/**
 * Material for gravitational lensing effect around massive objects
 * - Simulates the bending of light around massive objects like black holes
 * - Uses a sphere around the object to create a distortion effect
 * - Dynamically samples the background scene for realistic distortion
 */
export class GravitationalLensingMaterial extends THREE.ShaderMaterial {
  constructor(
    options: {
      intensity?: number;
      radius?: number;
      distortionScale?: number;
    } = {}
  ) {
    // Set up the uniforms for the lensing effect
    const lensingShader = {
      uniforms: {
        tBackground: { value: null }, // Will capture scene behind the object
        intensity: { value: options.intensity ?? 1.0 },
        radius: { value: options.radius ?? 1.0 },
        distortionScale: { value: options.distortionScale ?? 1.0 },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tBackground;
        uniform float intensity;
        uniform float radius;
        uniform float distortionScale;
        uniform float time;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          // Calculate position in object space
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float viewAngle = dot(normalize(vNormal), viewDir);
          
          // Schwarzschild radius effect - stronger near center
          float dist = length(vUv - vec2(0.5, 0.5)) * 2.0;
          
          // Calculate distortion strength based on distance from center
          // Stronger near the edge of the object for a lensing effect
          float distortionStrength = smoothstep(0.0, 1.0, dist) * intensity;
          
          // The Einstein ring effect - stronger at a specific radius, but more subtle now
          float einsteinRing = 1.0 - abs(dist - 0.8) * 5.0;
          einsteinRing = max(0.0, einsteinRing) * 0.7; // Reduce ring intensity to 70%
          
          // Dynamic distortion pattern - reduced intensity
          float timeOffset = time * 0.05;
          float dynamicDistortion = sin(dist * 10.0 + timeOffset) * 0.03 * distortionStrength; // Reduced from 0.05 to 0.03
          
          // Calculate pixel offset for sampling the background
          vec2 offset = normalize(vUv - vec2(0.5, 0.5)) * (distortionStrength * distortionScale + dynamicDistortion);
          
          // Add Einstein ring enhancement - more subtle
          offset *= (1.0 + einsteinRing * 0.3); // Reduced from 0.5 to 0.3
          
          // Sample the background with distortion
          vec2 distortedUv = gl_FragCoord.xy / resolution + offset;
          vec4 backgroundColor = texture2D(tBackground, distortedUv);
          
          // Intensify the ring - much more subtle now
          backgroundColor.rgb += vec3(einsteinRing * 0.05); // Reduced from 0.1 to 0.05
          
          // Final color with distortion
          gl_FragColor = backgroundColor;
          
          // Add transparency for areas outside the lensing effect - MUCH more transparent
          // Reduced from distortionStrength * 1.5 to distortionStrength * 0.8
          float alpha = min(0.7, distortionStrength * 0.8); // Also cap maximum alpha at 0.7 (was 1.0)
          
          // Fade out alpha at edges for a smoother transition
          alpha *= smoothstep(1.0, 0.7, dist);
          
          gl_FragColor.a = alpha;
        }
      `
    };
    
    // We need to replace the resolution variable in the shader
    const resolutionLine = `
      uniform vec2 resolution;
    `;
    
    lensingShader.fragmentShader = resolutionLine + lensingShader.fragmentShader;
    
    super({
      uniforms: {
        ...lensingShader.uniforms,
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: lensingShader.vertexShader,
      fragmentShader: lensingShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor
    });
  }
  
  /**
   * Update the material with the current time and render target
   */
  update(time: number, renderTarget: THREE.WebGLRenderTarget): void {
    this.uniforms.time.value = time;
    this.uniforms.tBackground.value = renderTarget.texture;
    this.uniforms.resolution.value.set(
      renderTarget.width,
      renderTarget.height
    );
  }
  
  /**
   * Set the distortion intensity
   */
  setIntensity(value: number): void {
    this.uniforms.intensity.value = value;
  }
  
  /**
   * Set the distortion radius
   */
  setRadius(value: number): void {
    this.uniforms.radius.value = value;
  }
  
  /**
   * Set the distortion scale
   */
  setDistortionScale(value: number): void {
    this.uniforms.distortionScale.value = value;
  }
  
  /**
   * Dispose of material resources
   */
  dispose(): void {
    // Clean up resources
  }
}

/**
 * Helper to create a gravitational lensing effect for massive objects
 */
export class GravitationalLensingHelper {
  private material: GravitationalLensingMaterial;
  private mesh: THREE.Mesh;
  private renderTarget: THREE.WebGLRenderTarget;
  private startTime: number = Date.now() / 1000;
  
  /**
   * Create a new gravitational lensing effect
   */
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    object: THREE.Object3D,
    options: {
      intensity?: number;
      radius?: number;
      distortionScale?: number;
      lensSphereScale?: number;
    } = {}
  ) {
    // Create a render target to capture the scene at a lower resolution for better performance
    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * 0.5, 
      window.innerHeight * 0.5, 
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
      }
    );
    
    // Create the material for lensing effect
    this.material = new GravitationalLensingMaterial({
      intensity: options.intensity,
      radius: options.radius,
      distortionScale: options.distortionScale
    });
    
    // Create a large sphere around the object for the lensing effect
    // Scale it based on the object's size (or use a default scaling)
    const boundingBox = new THREE.Box3().setFromObject(object);
    const objectSize = new THREE.Vector3();
    boundingBox.getSize(objectSize);
    
    const scale = options.lensSphereScale ?? 5.0;
    const maxDimension = Math.max(objectSize.x, objectSize.y, objectSize.z);
    const sphereRadius = maxDimension * scale;
    
    const geometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'gravitational-lensing';
    this.mesh.renderOrder = 1000; // Render after everything else
    
    // Position the lens mesh at the same position as the object
    object.add(this.mesh);
    
    // Set up the resize handler
    window.addEventListener('resize', () => this.onWindowResize(renderer));
  }
  
  /**
   * Update the lensing effect - call this before rendering the scene
   */
  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    // Hide the lensing mesh temporarily
    this.mesh.visible = false;
    
    // Render the scene to the render target
    const originalRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(originalRenderTarget);
    
    // Update the material with the render target
    const elapsedTime = Date.now() / 1000 - this.startTime;
    this.material.update(elapsedTime, this.renderTarget);
    
    // Make the lensing mesh visible again
    this.mesh.visible = true;
  }
  
  /**
   * Handle window resize
   */
  private onWindowResize(renderer: THREE.WebGLRenderer): void {
    const width = window.innerWidth * 0.5;
    const height = window.innerHeight * 0.5;
    
    this.renderTarget.setSize(width, height);
    this.material.uniforms.resolution.value.set(width, height);
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.material) {
      this.material.dispose();
    }
    
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    window.removeEventListener('resize', () => this.onWindowResize);
  }
} 