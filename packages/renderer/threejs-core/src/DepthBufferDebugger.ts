import * as THREE from "three";
import { SceneManager } from "./SceneManager";

/**
 * Debug utility for analyzing depth buffer issues and material settings.
 *
 * This helps identify problems with occlusion, depth testing, and render ordering
 * that can cause objects to appear through each other incorrectly.
 */
export class DepthBufferDebugger {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private sceneManager: SceneManager;
  private camera: THREE.PerspectiveCamera;

  constructor(sceneManager: SceneManager) {
    this.scene = sceneManager.scene;
    this.renderer = sceneManager.renderer;
    this.sceneManager = sceneManager;
    this.camera = sceneManager.camera;
  }

  /**
   * Analyzes all materials in the scene and reports depth buffer configuration issues.
   */
  public analyzeSceneMaterials(): {
    issues: string[];
    summary: {
      totalObjects: number;
      depthWriteEnabled: number;
      depthTestEnabled: number;
      transparentObjects: number;
      conflictingSettings: number;
    };
  } {
    const issues: string[] = [];
    let totalObjects = 0;
    let depthWriteEnabled = 0;
    let depthTestEnabled = 0;
    let transparentObjects = 0;
    let conflictingSettings = 0;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
        totalObjects++;
        const material = object.material;

        if (Array.isArray(material)) {
          // Handle multiple materials
          material.forEach((mat, index) => {
            const analysis = this.analyzeMaterial(
              mat,
              `${object.name}-material-${index}`,
            );
            issues.push(...analysis.issues);
            if (analysis.depthWrite) depthWriteEnabled++;
            if (analysis.depthTest) depthTestEnabled++;
            if (analysis.transparent) transparentObjects++;
            if (analysis.hasConflict) conflictingSettings++;
          });
        } else {
          const analysis = this.analyzeMaterial(
            material,
            object.name || object.type,
          );
          issues.push(...analysis.issues);
          if (analysis.depthWrite) depthWriteEnabled++;
          if (analysis.depthTest) depthTestEnabled++;
          if (analysis.transparent) transparentObjects++;
          if (analysis.hasConflict) conflictingSettings++;
        }
      }
    });

    return {
      issues,
      summary: {
        totalObjects,
        depthWriteEnabled,
        depthTestEnabled,
        transparentObjects,
        conflictingSettings,
      },
    };
  }

  /**
   * Analyzes a single material for depth buffer configuration issues.
   */
  private analyzeMaterial(
    material: THREE.Material,
    objectName: string,
  ): {
    issues: string[];
    depthWrite: boolean;
    depthTest: boolean;
    transparent: boolean;
    hasConflict: boolean;
  } {
    const issues: string[] = [];
    let hasConflict = false;

    const depthWrite = material.depthWrite;
    const depthTest = material.depthTest;
    const transparent = material.transparent;
    const opacity = (material as any).opacity ?? 1.0;

    // Check for common problematic configurations
    if (transparent && depthWrite) {
      issues.push(
        `${objectName}: Transparent object with depthWrite=true can cause sorting issues`,
      );
      hasConflict = true;
    }

    if (!depthTest && !transparent) {
      issues.push(
        `${objectName}: Opaque object with depthTest=false will ignore depth buffer`,
      );
      hasConflict = true;
    }

    if (transparent && opacity >= 1.0) {
      issues.push(
        `${objectName}: Object marked transparent but opacity=1.0 - consider making opaque`,
      );
    }

    if (!transparent && opacity < 1.0) {
      issues.push(
        `${objectName}: Object has opacity<1.0 but not marked transparent`,
      );
    }

    // Check for LOD-specific issues
    if (objectName.includes("billboard") && depthWrite) {
      issues.push(
        `${objectName}: Billboard with depthWrite=true can occlude other objects incorrectly`,
      );
      hasConflict = true;
    }

    if (objectName.includes("orbital") || objectName.includes("trail")) {
      if (depthWrite) {
        issues.push(
          `${objectName}: Orbital line with depthWrite=true can interfere with depth buffer`,
        );
        hasConflict = true;
      }
    }

    return {
      issues,
      depthWrite,
      depthTest,
      transparent,
      hasConflict,
    };
  }

  /**
   * Checks for render order conflicts and inconsistencies.
   */
  public analyzeRenderOrder(): {
    issues: string[];
    orderMap: Map<number, string[]>;
  } {
    const issues: string[] = [];
    const orderMap = new Map<number, string[]>();

    this.scene.traverse((object) => {
      const renderOrder = object.renderOrder || 0;
      const objectName = object.name || object.type || "unnamed";

      if (!orderMap.has(renderOrder)) {
        orderMap.set(renderOrder, []);
      }
      orderMap.get(renderOrder)!.push(objectName);

      // Check for objects that should have explicit render orders but don't
      if (renderOrder === 0) {
        if (
          objectName.includes("billboard") ||
          objectName.includes("sprite") ||
          objectName.includes("orbital") ||
          objectName.includes("trail")
        ) {
          issues.push(
            `${objectName}: Should have explicit renderOrder but using default (0)`,
          );
        }
      }
    });

    return { issues, orderMap };
  }

  /**
   * Performs a comprehensive depth buffer analysis and logs results.
   */
  public runFullAnalysis(): void {
    console.group("🔍 Depth Buffer Analysis");

    // Depth precision analysis
    this.analyzeDepthPrecision();

    // Material analysis
    const materialAnalysis = this.analyzeSceneMaterials();
    console.group("📋 Material Configuration");
    console.log("Summary:", materialAnalysis.summary);
    if (materialAnalysis.issues.length > 0) {
      console.warn("Issues found:");
      materialAnalysis.issues.forEach((issue) => console.warn(`  ⚠️ ${issue}`));
    } else {
      console.log("✅ No material configuration issues found");
    }
    console.groupEnd();

    // Render order analysis
    const renderOrderAnalysis = this.analyzeRenderOrder();
    console.group("🎯 Render Order Analysis");
    if (renderOrderAnalysis.issues.length > 0) {
      console.warn("Issues found:");
      renderOrderAnalysis.issues.forEach((issue) =>
        console.warn(`  ⚠️ ${issue}`),
      );
    } else {
      console.log("✅ No render order issues found");
    }

    console.log("Render Order Distribution:");
    Array.from(renderOrderAnalysis.orderMap.keys())
      .sort((a, b) => a - b)
      .forEach((order) => {
        const objects = renderOrderAnalysis.orderMap.get(order)!;
        console.log(
          `  ${order}: ${objects.slice(0, 5).join(", ")}${objects.length > 5 ? "..." : ""}`,
        );
      });
    console.groupEnd();

    // WebGL state analysis
    this.analyzeWebGLState();

    console.groupEnd();
  }

  /**
   * Analyzes current WebGL renderer state.
   */
  private analyzeWebGLState(): void {
    console.group("🖥️ WebGL State");

    const gl = this.renderer.getContext();
    console.log("Depth test enabled:", gl.isEnabled(gl.DEPTH_TEST));
    console.log("Depth write enabled:", gl.getParameter(gl.DEPTH_WRITEMASK));
    console.log(
      "Depth function:",
      this.getDepthFunctionName(gl.getParameter(gl.DEPTH_FUNC)),
    );
    console.log("Blend enabled:", gl.isEnabled(gl.BLEND));

    if (gl.isEnabled(gl.BLEND)) {
      console.log("Blend src factor:", gl.getParameter(gl.BLEND_SRC_RGB));
      console.log("Blend dst factor:", gl.getParameter(gl.BLEND_DST_RGB));
    }

    console.groupEnd();
  }

  /**
   * Helper to convert WebGL depth function constants to readable names.
   */
  private getDepthFunctionName(func: number): string {
    const gl = this.renderer.getContext();
    switch (func) {
      case gl.NEVER:
        return "NEVER";
      case gl.LESS:
        return "LESS";
      case gl.EQUAL:
        return "EQUAL";
      case gl.LEQUAL:
        return "LEQUAL";
      case gl.GREATER:
        return "GREATER";
      case gl.NOTEQUAL:
        return "NOTEQUAL";
      case gl.GEQUAL:
        return "GEQUAL";
      case gl.ALWAYS:
        return "ALWAYS";
      default:
        return `Unknown (${func})`;
    }
  }

  /**
   * Analyzes depth buffer precision based on camera settings.
   */
  private analyzeDepthPrecision(): void {
    console.group("📏 Depth Precision Analysis");

    // Find the camera in the scene or use the renderer's camera
    let camera: THREE.PerspectiveCamera | null = this.camera;

    if (!camera) {
      console.warn("No perspective camera found");
      console.groupEnd();
      return;
    }

    const near = camera.near;
    const far = camera.far;
    const ratio = far / near;

    console.log(`Camera near: ${near}`);
    console.log(`Camera far: ${far}`);
    console.log(`Near/Far ratio: ${ratio.toLocaleString()}:1`);

    // Check if logarithmic depth is enabled by looking for log depth defines
    const logDepthEnabled = this.isLogDepthEnabled();

    if (logDepthEnabled) {
      console.log(
        `🚀 LOGARITHMIC DEPTH ENABLED: Ratio ${ratio.toLocaleString()}:1 is acceptable with log depth!`,
      );
      console.log(
        "   Log depth provides uniform precision across entire range",
      );
      console.log("   Massive near/far ratios are now supported");
    } else {
      // Analyze precision issues for linear depth
      if (ratio > 10000) {
        console.error(
          `🚨 CRITICAL: Near/far ratio too high (${ratio.toLocaleString()}:1)`,
        );
        console.error("   This will cause severe depth precision issues!");
        console.error("   Recommended: Keep ratio below 10,000:1");

        if (ratio > 1000000) {
          console.error("   Consider using logarithmic depth buffer");
        }
      } else if (ratio > 1000) {
        console.warn(
          `⚠️ WARNING: Near/far ratio high (${ratio.toLocaleString()}:1)`,
        );
        console.warn("   May cause depth precision issues at distance");
        console.warn("   Consider moving near plane farther out");
      } else {
        console.log(`✅ Good near/far ratio (${ratio.toLocaleString()}:1)`);
      }
    }

    // Calculate approximate depth precision at different distances
    const depthBits = 24; // Standard depth buffer
    const precision = Math.pow(2, depthBits);

    console.log("\n📊 Depth Precision at Distance:");
    const testDistances = [
      near * 10,
      near * 100,
      near * 1000,
      far * 0.1,
      far * 0.5,
    ];
    testDistances.forEach((distance) => {
      if (distance >= near && distance <= far) {
        if (logDepthEnabled) {
          // Logarithmic depth provides uniform precision
          const logPrecision = 1 / precision; // Much more uniform
          console.log(
            `  Distance ${distance.toFixed(1)}: ~${logPrecision.toFixed(6)} units precision (LOG DEPTH) ✅`,
          );
        } else {
          // Linear depth precision calculation
          const depthValue = (1 / distance - 1 / far) / (1 / near - 1 / far);
          const depthResolution = 1 / precision;
          const actualResolution = (depthResolution * (far - near)) / distance;

          const status = actualResolution > 0.000001 ? "✅" : "❌";
          console.log(
            `  Distance ${distance.toFixed(1)}: ~${actualResolution.toFixed(6)} units precision ${status}`,
          );
        }
      }
    });

    console.groupEnd();
  }

  /**
   * Checks if logarithmic depth buffer is enabled by examining scene materials.
   */
  private isLogDepthEnabled(): boolean {
    let logDepthFound = false;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
        const material = object.material;

        const checkMaterial = (mat: THREE.Material) => {
          if ((mat as any).defines?.USE_LOGDEPTHBUF) {
            logDepthFound = true;
          }
        };

        if (Array.isArray(material)) {
          material.forEach(checkMaterial);
        } else {
          checkMaterial(material);
        }
      }
    });

    return logDepthFound;
  }

  /**
   * Creates a visual depth buffer preview (for advanced debugging).
   */
  public createDepthVisualization(): THREE.Material {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDepth: { value: null },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDepth;
        uniform float cameraNear;
        uniform float cameraFar;
        varying vec2 vUv;
        
        float readDepth(sampler2D depthSampler, vec2 coord) {
          float fragCoordZ = texture2D(depthSampler, coord).x;
          float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
          return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        }
        
        void main() {
          float depth = readDepth(tDepth, vUv);
          gl_FragColor = vec4(vec3(1.0 - depth), 1.0);
        }
      `,
    });
  }
}
