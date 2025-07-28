import * as THREE from "three";

/**
 * Helper for enabling logarithmic depth buffer in materials.
 *
 * This provides much better depth precision across huge distance ranges
 * like those found in space simulations, where objects can range from
 * meters to astronomical units in distance.
 */
export class LogarithmicDepthMaterial {
  /**
   * Logarithmic depth vertex shader chunk to replace the default depth calculation.
   */
  private static readonly logDepthVertexChunk = `
    #ifdef USE_LOGDEPTHBUF
      gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC * 0.5;
    #endif
  `;

  /**
   * Logarithmic depth fragment shader chunk.
   */
  private static readonly logDepthFragmentChunk = `
    #ifdef USE_LOGDEPTHBUF
      gl_FragDepthEXT = log2( vFragDepth ) * logDepthBufFC * 0.5;
    #endif
  `;

  /**
   * Enables logarithmic depth buffer for a material.
   * This modifies the material to use log depth calculations for better precision.
   */
  public static enableLogDepth(material: THREE.Material): void {
    if (!material) return;

    // Enable logarithmic depth buffer
    (material as any).defines = (material as any).defines || {};
    (material as any).defines.USE_LOGDEPTHBUF = true;
    (material as any).defines.USE_LOGDEPTHBUF_EXT = true;

    // For custom shader materials, we need to inject the log depth code
    if (material instanceof THREE.ShaderMaterial) {
      this.injectLogDepthIntoShader(material);
    }

    material.needsUpdate = true;
  }

  /**
   * Enables logarithmic depth buffer for all materials in a scene.
   */
  public static enableLogDepthForScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
        const material = object.material;

        if (Array.isArray(material)) {
          material.forEach((mat) => this.enableLogDepth(mat));
        } else {
          this.enableLogDepth(material);
        }
      }
    });
  }

  /**
   * Configures a camera for logarithmic depth buffer.
   */
  public static configureCameraForLogDepth(
    camera: THREE.PerspectiveCamera,
  ): void {
    // With log depth, we can use much more aggressive near/far ratios
    camera.near = 0.001; // 1mm
    camera.far = 1000000; // 1,000 km (covers entire solar system)
    camera.updateProjectionMatrix();
  }

  /**
   * Injects logarithmic depth calculations into a shader material.
   */
  private static injectLogDepthIntoShader(
    material: THREE.ShaderMaterial,
  ): void {
    // Add the necessary uniforms
    material.uniforms.logDepthBufFC = {
      value:
        2.0 / (Math.log(material.userData.far || 1000000 + 1.0) / Math.LN2),
    };

    // Inject vertex shader modifications
    if (
      material.vertexShader &&
      !material.vertexShader.includes("USE_LOGDEPTHBUF")
    ) {
      material.vertexShader = this.injectVertexLogDepth(material.vertexShader);
    }

    // Inject fragment shader modifications
    if (
      material.fragmentShader &&
      !material.fragmentShader.includes("USE_LOGDEPTHBUF")
    ) {
      material.fragmentShader = this.injectFragmentLogDepth(
        material.fragmentShader,
      );
    }
  }

  /**
   * Injects log depth calculations into vertex shader.
   */
  private static injectVertexLogDepth(vertexShader: string): string {
    // Add uniform declaration
    const uniformDeclaration = `
      #ifdef USE_LOGDEPTHBUF
        uniform float logDepthBufFC;
        varying float vFragDepth;
      #endif
    `;

    // Add to main function
    const mainInjection = `
      #ifdef USE_LOGDEPTHBUF
        vFragDepth = 1.0 + gl_Position.w;
        gl_Position.z = log2( max( EPSILON, vFragDepth ) ) * logDepthBufFC - 1.0;
        gl_Position.z *= gl_Position.w;
      #endif
    `;

    let modifiedShader = vertexShader;

    // Insert uniform declarations after version directive
    modifiedShader = modifiedShader.replace(
      /(#version\s+\d+.*?\n)/,
      `$1${uniformDeclaration}\n`,
    );

    // Insert log depth calculation before the end of main()
    modifiedShader = modifiedShader.replace(
      /(\s*gl_Position\s*=.*?;)/,
      `$1\n${mainInjection}`,
    );

    return modifiedShader;
  }

  /**
   * Injects log depth calculations into fragment shader.
   */
  private static injectFragmentLogDepth(fragmentShader: string): string {
    // Add varying declaration and extension
    const declarations = `
      #ifdef USE_LOGDEPTHBUF
        #extension GL_EXT_frag_depth : enable
        varying float vFragDepth;
      #endif
    `;

    // Add depth calculation
    const depthCalculation = `
      #ifdef USE_LOGDEPTHBUF
        gl_FragDepthEXT = log2( vFragDepth ) * logDepthBufFC * 0.5;
      #endif
    `;

    let modifiedShader = fragmentShader;

    // Insert declarations after version directive
    modifiedShader = modifiedShader.replace(
      /(#version\s+\d+.*?\n)/,
      `$1${declarations}\n`,
    );

    // Insert depth calculation at the end of main(), before the final brace
    modifiedShader = modifiedShader.replace(
      /(\s*}\s*$)/,
      `${depthCalculation}\n$1`,
    );

    return modifiedShader;
  }

  /**
   * Creates a test material with logarithmic depth enabled.
   * Useful for testing log depth functionality.
   */
  public static createTestMaterial(): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });

    this.enableLogDepth(material);
    return material;
  }
}
