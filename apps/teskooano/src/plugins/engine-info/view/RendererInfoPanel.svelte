<script lang="ts">
  import { onDestroy } from "svelte";
  import type { PanelInitParameters } from "dockview-core";
  import { RendererInfoDisplayController } from "../controller/RendererInfoDisplay.controller.js";
  import { WebGLCapabilitiesDisplayController } from "../controller/WebGLCapabilitiesDisplay.controller.js";
  import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
  import type { RendererInfoParams } from "../types.js";

  let { params }: { params: PanelInitParameters } = $props();

  const rendererParams = $derived((params as any)?.params as RendererInfoParams);
  const parentPanel = $derived(
    rendererParams?.parentInstance as CompositeEnginePanel | undefined
  );

  const dataPanelId = $derived(
    parentPanel?.panelId ?? (params as any)?.api?.id ?? ""
  );

  // Root element (acts as the "view" passed to controllers)
  let rootEl: HTMLElement | null = $state(null);

  // Specific element refs for the renderer controller
  let camPosValueEl: HTMLElement | null = $state(null);
  let fovValueEl: HTMLElement | null = $state(null);

  let rendererController: RendererInfoDisplayController | null = null;
  let webglController: WebGLCapabilitiesDisplayController | null = null;

  $effect(() => {
    if (!rootEl || !camPosValueEl || !fovValueEl) return;

    rendererController = new RendererInfoDisplayController(rootEl as any, {
      camPosValue: camPosValueEl,
      fovValue: fovValueEl,
    });

    webglController = new WebGLCapabilitiesDisplayController(rootEl);

    if (parentPanel && typeof parentPanel.getRenderer === "function") {
      rendererController.setParentPanel(parentPanel);
      webglController.setParentPanel(parentPanel);
    }

    rendererController.initialize();

    return () => {
      rendererController?.dispose();
      webglController?.dispose();
      rendererController = null;
      webglController = null;
    };
  });

  onDestroy(() => {
    rendererController?.dispose();
    webglController?.dispose();
    rendererController = null;
    webglController = null;
  });
</script>

<!-- Root element passed as the "view" to both controllers -->
<div class="panel" data-panel-id={dataPanelId} bind:this={rootEl}>
  <div class="info-container">
    <!-- Device Performance Section -->
    <div id="device-performance">
      <div class="section">
        <h4>Device Performance Monitoring</h4>
        <div class="loading">Loading device data...</div>
      </div>
    </div>

    <!-- Renderer Stats Section -->
    <div class="info-grid">
      <span class="label">Cam Pos:</span>
      <span class="value" id="cam-pos-value" bind:this={camPosValueEl}>-</span>

      <span class="label">FOV:</span>
      <span class="value" id="fov-value" bind:this={fovValueEl}>-</span>
    </div>

    <!-- WebGL Capabilities Section -->
    <div id="webgl-capabilities">
      <div class="section">
        <h4>WebGL Capabilities</h4>
        <div class="loading">Loading capabilities...</div>
      </div>
    </div>

    <!-- Performance Optimization Section -->
    <div id="performance-optimization">
      <div class="section">
        <h4>Active Performance Optimizations</h4>
        <div class="loading">Loading optimizations...</div>
      </div>
    </div>
  </div>
</div>

<style>
  .panel {
    display: block;
    font-family: var(--font-family-monospace, monospace);
    font-size: 0.9em;
    color: var(--color-text, #e0e0fc);
    padding: var(--space-sm, 8px) var(--space-md, 12px);
    height: 100%;
  }

  .info-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding-right: var(--space-xs, 4px);
  }

  .info-container::-webkit-scrollbar {
    width: 8px;
  }

  .info-container::-webkit-scrollbar-track {
    background: var(--color-surface-alt, #2a2a3a);
    border-radius: 4px;
  }

  .info-container::-webkit-scrollbar-thumb {
    background: var(--color-border, #555);
    border-radius: 4px;
  }

  .info-container::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-alt, #5a5a7a);
  }

  .info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px;
    align-items: center;
    margin-bottom: var(--space-sm, 8px);
  }

  .label {
    color: var(--color-text-secondary, #aaa);
    text-align: right;
  }

  .value {
    font-weight: bold;
    color: var(--color-primary-light, #9fa8da);
  }

  :global(.loading) {
    color: var(--color-text-secondary, #aaa);
    font-style: italic;
    font-size: 0.85em;
  }

  :global(.section) {
    border: 1px solid var(--color-border, #3a3a5a);
    border-radius: 4px;
    padding: var(--space-sm, 8px);
  }

  :global(.section h4) {
    margin: 0 0 var(--space-xs, 4px) 0;
    font-size: 0.9em;
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
