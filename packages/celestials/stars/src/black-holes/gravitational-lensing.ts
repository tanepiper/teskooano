import * as THREE from "three";
import { GeometryUtilities } from "@teskooano/renderer-threejs-celestial";
// Import shader code (assume raw-loader or similar is set up)
import blurHorizontalShader from "./blur-horizontal.glsl?raw";
import blurVerticalShader from "./blur-vertical.glsl?raw";
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
          
          
          vec2 distortedUv = vUv + offset;
          vec4 backgroundColor = texture2D(tBackground, distortedUv);
          
          
          backgroundColor.rgb += vec3(einsteinRing * 0.05); 
          
          
          gl_FragColor = backgroundColor;
          
          
          
          float alpha = min(0.7, distortionStrength * 0.8); 
          
          
          alpha *= smoothstep(1.0, 0.7, dist);
          
          gl_FragColor.a = alpha;
        }
      `,
    };

    const resolutionLine = `
      uniform vec2 resolution;
    `;

    lensingShader.fragmentShader =
      resolutionLine + lensingShader.fragmentShader;

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
  update(time: number, renderTarget: THREE.WebGLRenderTarget): void {
    this.uniforms.time.value = time;
    this.uniforms.tBackground.value = renderTarget.texture;
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

function createBlurMaterial(fragmentShader: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      blurSize: { value: 1.0 / 2048.0 }, // less blur
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
    transparent: false,
  });
}

/**
 * Helper to create a gravitational lensing effect for massive objects
 */
export class GravitationalLensingHelper {
  private material: GravitationalLensingMaterial;
  private mesh: THREE.Mesh;
  private renderTarget: THREE.WebGLRenderTarget;
  private startTime: number = Date.now() / 1000;
  private backgroundTarget: THREE.WebGLRenderTarget;
  private blurTargetH: THREE.WebGLRenderTarget;
  private blurTargetV: THREE.WebGLRenderTarget;
  private blurMaterialH: THREE.ShaderMaterial;
  private blurMaterialV: THREE.ShaderMaterial;
  private blurQuadH: THREE.Mesh;
  private blurQuadV: THREE.Mesh;
  private blurSceneH: THREE.Scene;
  private blurSceneV: THREE.Scene;
  private orthoCamera: THREE.OrthographicCamera;

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
    const width = Math.floor(window.innerWidth * 0.5);
    const height = Math.floor(window.innerHeight * 0.5);
    this.backgroundTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });
    this.blurTargetH = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });
    this.blurTargetV = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });
    this.blurMaterialH = createBlurMaterial(blurHorizontalShader);
    this.blurMaterialV = createBlurMaterial(blurVerticalShader);
    this.blurQuadH = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.blurMaterialH,
    );
    this.blurQuadV = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.blurMaterialV,
    );
    this.blurSceneH = new THREE.Scene();
    this.blurSceneV = new THREE.Scene();
    this.blurSceneH.add(this.blurQuadH);
    this.blurSceneV.add(this.blurQuadV);
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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

    const segments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const geometry = new THREE.SphereGeometry(sphereRadius, segments, segments);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = "gravitational-lensing";
    this.mesh.renderOrder = 1000;

    object.add(this.mesh);

    window.addEventListener("resize", () => this.onWindowResize(renderer));
  }

  /**
   * Recursively clones only allowed objects (celestial/background), skipping lines, AU markers, and labels.
   */
  private static cloneAllowedObject(
    obj: THREE.Object3D,
  ): THREE.Object3D | null {
    // Exclude all lines
    if (obj instanceof THREE.Line) return null;
    // Exclude AU marker rings (meshes with RingGeometry)
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.RingGeometry)
      return null;
    // Exclude CSS2DObjects and similar (labels, markers)
    const ctor = obj.constructor?.name || "";
    if (
      ctor.includes("CSS2D") ||
      ctor.toLowerCase().includes("label") ||
      ctor.toLowerCase().includes("marker")
    )
      return null;
    // Exclude asteroid belts
    if (
      obj.userData?.isAsteroidField ||
      obj.userData?.asteroidField ||
      (obj.name && obj.name.toLowerCase().includes("asteroid")) ||
      (obj.name && obj.name.toLowerCase().includes("belt"))
    )
      return null;
    // Exclude objects with userData.isMarker or userData.isLabel
    if (obj.userData?.isMarker || obj.userData?.isLabel) return null;
    // Recursively clone children
    const clone = obj.clone(false);
    for (const child of obj.children) {
      const childClone = GravitationalLensingHelper.cloneAllowedObject(child);
      if (childClone) clone.add(childClone);
    }
    return clone;
  }

  /**
   * Update the lensing effect - call this before rendering the scene
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    // 1. Hide the lensing mesh so it is not included in the full-scene render
    this.mesh.visible = false;

    // 2. Build a filtered scene with only celestial objects and background
    const filteredScene = new THREE.Scene();
    if (scene.background) filteredScene.background = scene.background;
    for (const child of scene.children) {
      const allowed = GravitationalLensingHelper.cloneAllowedObject(child);
      if (allowed) filteredScene.add(allowed);
    }

    // 3. Render the filtered scene to backgroundTarget
    renderer.setRenderTarget(this.backgroundTarget);
    renderer.clear();
    renderer.render(filteredScene, camera);
    renderer.setRenderTarget(null);

    // 4. Horizontal blur pass (use dedicated mesh/scene)
    this.blurMaterialH.uniforms.tDiffuse.value = this.backgroundTarget.texture;
    this.blurMaterialH.uniforms.blurSize.value =
      1.0 / this.backgroundTarget.width;
    renderer.setRenderTarget(this.blurTargetH);
    renderer.clear();
    renderer.render(this.blurSceneH, this.orthoCamera);
    renderer.setRenderTarget(null);

    // 5. Vertical blur pass (use dedicated mesh/scene)
    this.blurMaterialV.uniforms.tDiffuse.value = this.blurTargetH.texture;
    this.blurMaterialV.uniforms.blurSize.value =
      1.0 / this.backgroundTarget.height;
    renderer.setRenderTarget(this.blurTargetV);
    renderer.clear();
    renderer.render(this.blurSceneV, this.orthoCamera);
    renderer.setRenderTarget(null);

    // 6. Show the lensing mesh for the final render
    this.mesh.visible = true;

    // 7. Prepare the main temp scene (celestial objects only, as before)
    const tempScene = new THREE.Scene();
    if (scene.background) tempScene.background = scene.background;
    for (const child of scene.children) {
      const allowed = GravitationalLensingHelper.cloneAllowedObject(child);
      if (allowed) tempScene.add(allowed);
    }

    // 8. Render the main scene (celestial objects) to the lensing render target
    const originalRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(tempScene, camera);
    renderer.setRenderTarget(originalRenderTarget);

    // 9. Update the lensing material with the blurred full-scene texture
    const elapsedTime = Date.now() / 1000 - this.startTime;
    this.material.update(elapsedTime, this.blurTargetV);
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
