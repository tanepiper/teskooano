import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { WebGLCapabilitiesDisplayController } from "../controller/WebGLCapabilitiesDisplay.controller.js";
import type { RendererInfoParams } from "../types";
import type {
  WebGLCapabilities,
  PerformanceOptimization,
} from "@teskooano/renderer-threejs-core";
import * as THREE from "three";
import { template } from "./WebGLCapabilitiesDisplay.template.js";

/**
 * Utility functions for formatting data
 */
function formatNumber(num?: number): string {
  return num != null && Number.isFinite(num) ? num.toLocaleString() : "-";
}

function formatMemory(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "- MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A custom element (`<webgl-capabilities-display>`) that displays WebGL capabilities,
 * performance optimizations, and device performance monitoring information.
 *
 * This view component is responsible for rendering the UI and delegating all
 * business logic to the `WebGLCapabilitiesDisplayController`. It implements Dockview's
 * `IContentRenderer` interface to be used as panel content.
 */
export class WebGLCapabilitiesDisplay
  extends HTMLElement
  implements IContentRenderer
{
  private _controller: WebGLCapabilitiesDisplayController;

  /**
   * Renders the WebGL capabilities section
   */
  public static renderCapabilitiesSection(
    capabilities: WebGLCapabilities,
  ): string {
    const gpuTier = WebGLCapabilitiesDisplay.getGPUTier(capabilities);
    const performanceClass =
      WebGLCapabilitiesDisplay.getPerformanceClass(capabilities);

    return `
      <div class="section">
        <h4>WebGL Capabilities</h4>
        <table class="capabilities-table">
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

  /**
   * Renders the performance optimization section
   */
  public static renderOptimizationSection(
    optimization: PerformanceOptimization,
  ): string {
    return `
      <div class="section">
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
            <td>${WebGLCapabilitiesDisplay.getShadowMapTypeName(optimization.shadowMapType)}</td>
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

  /**
   * Renders the device performance monitoring section
   */
  public static renderDevicePerformanceSection(stats: any): string {
    const fps = stats.currentFPS;
    const drawCalls = stats.drawCalls;
    const triangles = stats.triangles;
    const memory = stats.memory?.usedJSHeapSize;
    const predictionLines = stats.predictionLines;
    const predictionSegments = stats.predictionSegments;
    const trailLines = stats.trailLines;
    const trailSegments = stats.trailSegments;

    return `
      <div class="section">
        <h4>Device Performance Monitoring</h4>
        <table class="device-table">
          <tr>
            <td>Current FPS:</td>
            <td>${formatNumber(fps)}</td>
          </tr>
          <tr>
            <td>Target FPS:</td>
            <td>${stats.targetFPS}</td>
          </tr>
          <tr>
            <td>Draw Calls:</td>
            <td>${formatNumber(drawCalls)}</td>
          </tr>
          <tr>
            <td>Triangles:</td>
            <td>${formatNumber(triangles)}</td>
          </tr>
          <tr>
            <td>Memory Usage:</td>
            <td>${formatMemory(memory)}</td>
          </tr>
          <tr>
            <td>Prediction Lines:</td>
            <td>${formatNumber(predictionLines)}</td>
          </tr>
          <tr>
            <td>Prediction Segments:</td>
            <td>${formatNumber(predictionSegments)}</td>
          </tr>
          <tr>
            <td>Trail Lines:</td>
            <td>${formatNumber(trailLines)}</td>
          </tr>
          <tr>
            <td>Trail Segments:</td>
            <td>${formatNumber(trailSegments)}</td>
          </tr>
          <tr>
            <td>Performance Optimization:</td>
            <td>${stats.isOptimizationEnabled ? "Enabled" : "Disabled"}</td>
          </tr>
          <tr>
            <td>Device Memory:</td>
            <td>${stats.deviceMemoryGB ? `${stats.deviceMemoryGB} GB` : "Unknown"}</td>
          </tr>
          <tr>
            <td>Battery Level:</td>
            <td>${stats.batteryLevel ? `${(stats.batteryLevel * 100).toFixed(0)}%` : "Unknown"} ${stats.isCharging ? "(Charging)" : ""}</td>
          </tr>
          <tr>
            <td>User State:</td>
            <td>${stats.isIdle ? "Idle" : "Active"}</td>
          </tr>
          <tr>
            <td>Idle Detection:</td>
            <td><span class="status-indicator ${stats.isIdleDetectionSupported ? "supported" : "unsupported"}"></span>${stats.isIdleDetectionSupported ? "Supported" : "Not Supported"}</td>
          </tr>
        </table>
        
        <div class="performance-indicator">
          <span class="performance-label">Device Tier:</span>
          <span class="performance-value ${stats.performanceConfig.deviceTier}">${stats.performanceConfig.deviceTier}</span>
        </div>
        
        <div class="performance-indicator">
          <span class="performance-label">Performance Reduction:</span>
          <span class="performance-value">${(stats.performanceConfig.performanceReductionMultiplier * 100).toFixed(0)}%</span>
        </div>
        
        <div class="performance-indicator">
          <span class="performance-label">Adaptive Scaling:</span>
          <span class="performance-value">${stats.performanceConfig.enableAdaptiveScaling ? "Enabled" : "Disabled"}</span>
        </div>
      </div>
    `;
  }

  /**
   * Gets the GPU tier based on capabilities
   */
  private static getGPUTier(capabilities: WebGLCapabilities): string {
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

  /**
   * Gets the performance class based on capabilities
   */
  private static getPerformanceClass(capabilities: WebGLCapabilities): string {
    const score =
      WebGLCapabilitiesDisplay.calculatePerformanceScore(capabilities);

    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Limited";
  }

  /**
   * Calculates performance score based on capabilities
   */
  private static calculatePerformanceScore(
    capabilities: WebGLCapabilities,
  ): number {
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

  /**
   * Gets the shadow map type name
   */
  private static getShadowMapTypeName(type: THREE.ShadowMapType): string {
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

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "webgl-capabilities-display";

  /**
   * Constructs the `WebGLCapabilitiesDisplay` panel.
   *
   * This sets up the shadow DOM, clones the HTML template, and instantiates
   * the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this._controller = new WebGLCapabilitiesDisplayController(this);
  }

  /**
   * Standard custom element lifecycle callback.
   * Called when the element is added to the document's DOM. This method
   * initializes the controller.
   */
  connectedCallback() {
    this._controller.initialize();
  }

  /**
   * Standard custom element lifecycle callback.
   * Called when the element is removed from the document's DOM. This method
   * cleans up the controller to prevent memory leaks.
   */
  disconnectedCallback() {
    this._controller.dispose();
  }

  /**
   * Dockview `IContentRenderer` initialization method.
   *
   * This method is called by Dockview when the panel is created. It receives the
   * parent `CompositeEnginePanel` instance via the parameters and passes it to
   * the controller.
   *
   * @param parameters - Initialization parameters from Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    // REQUIRE panel API ID - no fallback
    if (!parameters.api?.id) {
      throw new Error(
        "[WebGLCapabilitiesDisplay] Panel ID is required but not provided",
      );
    }

    const params = parameters.params as RendererInfoParams;

    // REQUIRE parent panel connection - no fallback
    if (!params.parentInstance?.panelId) {
      throw new Error(
        "[WebGLCapabilitiesDisplay] Must be connected to a CompositeEnginePanel",
      );
    }

    // Set data-panel-id to parent panel ID (for event extraction in nested components)
    this.setAttribute("data-panel-id", params.parentInstance.panelId);

    if (
      params.parentInstance &&
      typeof params.parentInstance.getRenderer === "function"
    ) {
      this._controller.setParentPanel(
        params.parentInstance as CompositeEnginePanel,
      );
    } else {
      console.warn(
        `[WebGLCapabilitiesDisplay] Parent instance not provided or invalid in init params.`,
      );
    }
  }

  /**
   * Required by Dockview's `IContentRenderer` interface.
   *
   * @returns The root element of the panel content, which is the custom element itself.
   */
  get element(): HTMLElement {
    return this;
  }
}
