import { StateSubscriptionMixin } from "@teskooano/core-state";
import { rendererEvents } from "@teskooano/renderer-threejs-core";
import type {
  WebGLCapabilities,
  PerformanceOptimization,
} from "@teskooano/renderer-threejs-core";
import * as THREE from "three";

/**
 * Controller for displaying WebGL capabilities and performance optimization information
 */
export class WebGLCapabilitiesDisplayController extends StateSubscriptionMixin {
  private _view: HTMLElement;
  private _capabilitiesElement?: HTMLElement;
  private _optimizationElement?: HTMLElement;
  private _performanceElement?: HTMLElement;

  constructor(view: HTMLElement) {
    super();
    this._view = view;
    this._initializeElements();
    this._subscribeToEvents();
  }

  private _initializeElements(): void {
    console.log("[WebGLCapabilitiesDisplay] Initializing elements");

    // The view is a custom element with shadow DOM, so we need to access the shadow root
    const shadowRoot = (this._view as any).shadowRoot;
    console.log("[WebGLCapabilitiesDisplay] Shadow root:", shadowRoot);

    if (shadowRoot) {
      this._capabilitiesElement =
        shadowRoot.querySelector("#webgl-capabilities") || undefined;
      this._optimizationElement =
        shadowRoot.querySelector("#performance-optimization") || undefined;
      this._performanceElement =
        shadowRoot.querySelector("#device-performance") || undefined;
    } else {
      // Fallback to regular querySelector if no shadow root
      this._capabilitiesElement =
        this._view.querySelector("#webgl-capabilities") || undefined;
      this._optimizationElement =
        this._view.querySelector("#performance-optimization") || undefined;
      this._performanceElement =
        this._view.querySelector("#device-performance") || undefined;
    }

    console.log(
      "[WebGLCapabilitiesDisplay] Capabilities element:",
      this._capabilitiesElement,
    );
    console.log(
      "[WebGLCapabilitiesDisplay] Optimization element:",
      this._optimizationElement,
    );
    console.log(
      "[WebGLCapabilitiesDisplay] Performance element:",
      this._performanceElement,
    );
  }

  private _subscribeToEvents(): void {
    console.log("[WebGLCapabilitiesDisplay] Setting up event listeners");

    // Subscribe to renderer ready event to get capabilities
    this._view.addEventListener("renderer-ready", (event: Event) => {
      console.log(
        "[WebGLCapabilitiesDisplay] Received renderer-ready event:",
        event,
      );
      if (event instanceof CustomEvent && event.detail?.renderer) {
        const sceneManager = event.detail.renderer.sceneManager;
        console.log(
          "[WebGLCapabilitiesDisplay] SceneManager found:",
          sceneManager,
        );
        if (sceneManager) {
          try {
            const capabilities = sceneManager.getWebGLCapabilities();
            const optimization = sceneManager.getPerformanceOptimization();
            console.log(
              "[WebGLCapabilitiesDisplay] Capabilities:",
              capabilities,
            );
            console.log(
              "[WebGLCapabilitiesDisplay] Optimization:",
              optimization,
            );
            this._updateCapabilitiesDisplay(capabilities);
            this._updateOptimizationDisplay(optimization);
          } catch (error) {
            console.error(
              "[WebGLCapabilitiesDisplay] Error getting capabilities:",
              error,
            );
          }
        }
      }
    });

    // Subscribe to performance optimization changes
    this.subscribeToState(
      rendererEvents.performanceOptimizationChanged$,
      (optimization) => {
        console.log(
          "[WebGLCapabilitiesDisplay] Performance optimization changed:",
          optimization,
        );
        this._updateOptimizationDisplay(optimization);
      },
    );
  }

  /**
   * Sets the parent panel to get access to the renderer
   */
  public setParentPanel(panel: any): void {
    console.log(
      "[WebGLCapabilitiesDisplay] setParentPanel called with:",
      panel,
    );
    // Try to get the renderer immediately if available
    if (panel && typeof panel.getRenderer === "function") {
      try {
        const renderer = panel.getRenderer();
        console.log("[WebGLCapabilitiesDisplay] Got renderer:", renderer);
        if (renderer?.sceneManager) {
          console.log(
            "[WebGLCapabilitiesDisplay] Got sceneManager:",
            renderer.sceneManager,
          );
          const capabilities = renderer.sceneManager.getWebGLCapabilities();
          const optimization =
            renderer.sceneManager.getPerformanceOptimization();
          console.log(
            "[WebGLCapabilitiesDisplay] Immediate capabilities:",
            capabilities,
          );
          console.log(
            "[WebGLCapabilitiesDisplay] Immediate optimization:",
            optimization,
          );
          this._updateCapabilitiesDisplay(capabilities);
          this._updateOptimizationDisplay(optimization);
        } else {
          console.log(
            "[WebGLCapabilitiesDisplay] No sceneManager found on renderer",
          );
        }
      } catch (error) {
        console.error(
          "[WebGLCapabilitiesDisplay] Error getting renderer immediately:",
          error,
        );
      }
    } else {
      console.log(
        "[WebGLCapabilitiesDisplay] Panel or getRenderer not available",
      );
    }
  }

  private _updateCapabilitiesDisplay(capabilities: WebGLCapabilities): void {
    console.log(
      "[WebGLCapabilitiesDisplay] _updateCapabilitiesDisplay called with:",
      capabilities,
    );
    if (!this._capabilitiesElement) {
      console.log("[WebGLCapabilitiesDisplay] No capabilities element found");
      return;
    }

    const gpuTier = this._getGPUTier(capabilities);
    const performanceClass = this._getPerformanceClass(capabilities);

    this._capabilitiesElement.innerHTML = `
      <div class="capability-section">
        <h4>WebGL Capabilities</h4>
        <table class="capability-table">
          <tr>
            <td>WebGL Version:</td>
            <td>${capabilities.isWebGL2 ? "WebGL 2.0" : "WebGL 1.0"}</td>
          </tr>
          <tr>
            <td>Precision:</td>
            <td>${capabilities.precision}</td>
          </tr>
          <tr>
            <td>Max Textures:</td>
            <td>${capabilities.maxTextures}</td>
          </tr>
          <tr>
            <td>Max Texture Size:</td>
            <td>${capabilities.maxTextureSize.toLocaleString()}px</td>
          </tr>
          <tr>
            <td>Max Vertex Uniforms:</td>
            <td>${capabilities.maxVertexUniforms.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Max Fragment Uniforms:</td>
            <td>${capabilities.maxFragmentUniforms.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Max Varyings:</td>
            <td>${capabilities.maxVaryings}</td>
          </tr>
          <tr>
            <td>Max Attributes:</td>
            <td>${capabilities.maxAttributes}</td>
          </tr>
          <tr>
            <td>Vertex Textures:</td>
            <td>${capabilities.vertexTextures ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <td>Max Samples:</td>
            <td>${capabilities.maxSamples}</td>
          </tr>
        </table>
      </div>
      
      <div class="performance-section">
        <h4>Device Performance Classification</h4>
        <div class="performance-indicator">
          <span class="performance-label">GPU Tier:</span>
          <span class="performance-value ${gpuTier.toLowerCase()}">${gpuTier}</span>
        </div>
        <div class="performance-indicator">
          <span class="performance-label">Performance Class:</span>
          <span class="performance-value ${performanceClass.toLowerCase()}">${performanceClass}</span>
        </div>
      </div>
    `;
  }

  private _updateOptimizationDisplay(
    optimization: PerformanceOptimization,
  ): void {
    console.log(
      "[WebGLCapabilitiesDisplay] _updateOptimizationDisplay called with:",
      optimization,
    );
    if (!this._optimizationElement) {
      console.log("[WebGLCapabilitiesDisplay] No optimization element found");
      return;
    }

    this._optimizationElement.innerHTML = `
      <div class="optimization-section">
        <h4>Active Performance Optimizations</h4>
        <table class="optimization-table">
          <tr>
            <td>Antialiasing:</td>
            <td>${optimization.antialias ? "Enabled" : "Disabled"}</td>
          </tr>
          <tr>
            <td>Shadows:</td>
            <td>${optimization.shadows ? "Enabled" : "Disabled"}</td>
          </tr>
          <tr>
            <td>HDR:</td>
            <td>${optimization.hdr ? "Enabled" : "Disabled"}</td>
          </tr>
          <tr>
            <td>Pixel Ratio:</td>
            <td>${optimization.pixelRatio.toFixed(2)}x</td>
          </tr>
          <tr>
            <td>Shadow Map Type:</td>
            <td>${this._getShadowMapTypeName(optimization.shadowMapType)}</td>
          </tr>
          <tr>
            <td>Max Lights:</td>
            <td>${optimization.maxLights}</td>
          </tr>
          <tr>
            <td>Max Shadow Casters:</td>
            <td>${optimization.maxShadowCasters}</td>
          </tr>
          <tr>
            <td>LOD Distance Multiplier:</td>
            <td>${optimization.lodDistanceMultiplier.toFixed(2)}x</td>
          </tr>
          <tr>
            <td>Trail Quality:</td>
            <td>${optimization.trailQuality}</td>
          </tr>
          <tr>
            <td>Particle Count Multiplier:</td>
            <td>${optimization.particleCountMultiplier.toFixed(2)}x</td>
          </tr>
        </table>
      </div>
    `;
  }

  private _getGPUTier(capabilities: WebGLCapabilities): string {
    if (
      capabilities.maxTextures >= 16 &&
      capabilities.maxTextureSize >= 8192 &&
      capabilities.maxFragmentUniforms >= 1024
    ) {
      return "High-End";
    } else if (
      capabilities.maxTextures >= 8 &&
      capabilities.maxTextureSize >= 4096 &&
      capabilities.maxFragmentUniforms >= 512
    ) {
      return "Mid-Range";
    } else {
      return "Low-End";
    }
  }

  private _getPerformanceClass(capabilities: WebGLCapabilities): string {
    const score = this._calculatePerformanceScore(capabilities);

    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Limited";
  }

  private _calculatePerformanceScore(capabilities: WebGLCapabilities): number {
    let score = 0;

    // WebGL version (20 points)
    score += capabilities.isWebGL2 ? 20 : 10;

    // Texture capabilities (25 points)
    score += Math.min(25, (capabilities.maxTextures / 16) * 25);

    // Texture size (20 points)
    score += Math.min(20, (capabilities.maxTextureSize / 16384) * 20);

    // Uniform capacity (25 points)
    const uniformScore = (capabilities.maxFragmentUniforms / 1024) * 25;
    score += Math.min(25, uniformScore);

    // Additional features (10 points)
    if (capabilities.vertexTextures) score += 5;
    if (capabilities.maxSamples >= 4) score += 5;

    return Math.round(score);
  }

  private _getShadowMapTypeName(type: THREE.ShadowMapType): string {
    switch (type) {
      case THREE.BasicShadowMap:
        return "Basic";
      case THREE.PCFShadowMap:
        return "PCF";
      case THREE.PCFSoftShadowMap:
        return "PCF Soft";
      case THREE.VSMShadowMap:
        return "VSM";
      default:
        return "Unknown";
    }
  }

  public dispose(): void {
    super.dispose();
  }
}
