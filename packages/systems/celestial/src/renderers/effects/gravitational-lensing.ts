import * as THREE from "three";

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
    } = {},
  ) {
    const lensingShader = {
      uniforms: {
        tBackground: { value: null },
        intensity: { value: options.intensity ?? 1.0 },
        radius: { value: options.radius ?? 1.0 },
        distortionScale: { value: options.distortionScale ?? 1.0 },
        time: { value: 0 },
        objectWorldPosition: { value: new THREE.Vector3() },
        objectRadius: { value: 0.0 },
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
        uniform vec3 objectWorldPosition;
        uniform float objectRadius;
        uniform vec2 resolution;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float viewAngle = dot(normalize(vNormal), viewDir);
          
          
          float dist = length(vUv - vec2(0.5, 0.5)) * 2.0;
          
          
          
          float distortionStrength = smoothstep(0.0, 1.0, dist) * intensity;
          
          
          float einsteinRing = 1.0 - abs(dist - 0.8) * 5.0;
          einsteinRing = max(0.0, einsteinRing) * 0.7; 
          
          
          float timeOffset = time * 0.05;
          float dynamicDistortion = sin(dist * 10.0 + timeOffset) * 0.03 * distortionStrength; 
          
          
          vec2 offset = normalize(vUv - vec2(0.5, 0.5)) * (distortionStrength * distortionScale + dynamicDistortion);
          
          
          offset *= (1.0 + einsteinRing * 0.3); 
          
          
          vec2 distortedUv = gl_FragCoord.xy / resolution + offset;
          vec4 backgroundColor = texture2D(tBackground, distortedUv);
          
          
          backgroundColor.rgb += vec3(einsteinRing * 0.05); 
          
          
          gl_FragColor = backgroundColor;
          
          
          
          float alpha = min(0.7, distortionStrength * 0.8); 
          
          
          alpha *= smoothstep(1.0, 0.7, dist);
          
          gl_FragColor.a = alpha;
        }
      `,
    };

    super({
      uniforms: {
        ...lensingShader.uniforms,
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: lensingShader.vertexShader,
      fragmentShader: lensingShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
  }

  /**
   * Update the material with the current time and render target
   */
  update(time: number, renderTarget?: THREE.WebGLRenderTarget): void {
    this.uniforms.time.value = time;
    if (renderTarget && renderTarget.texture) {
      this.uniforms.tBackground.value = renderTarget.texture;
    }
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
  dispose(): void {}
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
    } = {},
  ) {
    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
      },
    );

    this.material = new GravitationalLensingMaterial({
      intensity: options.intensity,
      radius: options.radius,
      distortionScale: options.distortionScale,
    });

    const boundingBox = new THREE.Box3().setFromObject(object);
    const objectSize = new THREE.Vector3();
    boundingBox.getSize(objectSize);

    const scale = options.lensSphereScale ?? 5.0;
    const maxDimension = Math.max(objectSize.x, objectSize.y, objectSize.z);
    const sphereRadius = maxDimension * scale;

    const geometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = "gravitational-lensing";
    this.mesh.renderOrder = 1000;

    object.add(this.mesh);

    window.addEventListener("resize", () => this.onWindowResize(renderer));
  }

  /**
   * Update the lensing effect - call this before rendering the scene
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    this.mesh.visible = false;

    const originalRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(originalRenderTarget);

    const elapsedTime = Date.now() / 1000 - this.startTime;
    this.material.update(elapsedTime, this.renderTarget);

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

    window.removeEventListener("resize", () => this.onWindowResize);
  }
}
