<script lang="ts">
  import { onDestroy } from "svelte";
  import type { PanelInitParameters } from "dockview-core";
  import {
    EngineSettingsController,
    type ControlRegistration,
  } from "../controller/EngineSettings.controller.js";
  import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";

  let { params }: { params: PanelInitParameters } = $props();

  const parentPanel = $derived(
    ((params as any)?.params as any)?.parentInstance as CompositeEnginePanel | undefined
  );

  // Use parent panel ID so nested components resolve the engine panel context.
  const dataPanelId = $derived(
    parentPanel?.panelId ?? (params as any)?.api?.id ?? ""
  );

  // Toggle settings config
  const toggleConfig = [
    { key: "showGrid", label: "Show Grid" },
    { key: "showCelestialLabels", label: "Show Celestial Labels" },
    { key: "showAuMarkers", label: "Show AU Markers" },
    { key: "showDebrisEffects", label: "Show Debris Effects" },
    { key: "showOrbitLines", label: "Show Orbit Lines" },
    { key: "showPredictionLines", label: "Show Prediction Lines" },
    { key: "isDebugMode", label: "Debug Mode" },
  ] as const;

  // DOM refs
  let errorMsgEl: HTMLElement | null = $state(null);
  // Individual toggle input refs — keyed by config index
  let toggleRefs: (HTMLInputElement | null)[] = $state(
    new Array(toggleConfig.length).fill(null),
  );
  let fovSliderRef: HTMLElement | null = $state(null);

  let controller: EngineSettingsController | null = null;

  $effect(() => {
    // Wait until all toggle refs AND the slider AND the error element are bound
    const allTogglesReady = toggleRefs.every((r) => r !== null);
    if (!allTogglesReady || !fovSliderRef || !errorMsgEl) return;

    const controls: ControlRegistration[] = [
      ...toggleConfig.map((cfg, i) => ({
        key: cfg.key as any,
        type: "toggle" as const,
        element: toggleRefs[i] as HTMLInputElement,
      })),
      {
        key: "fov" as const,
        type: "slider" as const,
        element: fovSliderRef,
      },
    ];

    controller = new EngineSettingsController(controls, errorMsgEl);

    if (
      parentPanel &&
      typeof parentPanel.getViewState === "function" &&
      typeof parentPanel.subscribeToViewState === "function"
    ) {
      controller.setParentPanel(parentPanel);
    }

    controller.initialize();

    return () => {
      controller?.dispose();
      controller = null;
    };
  });

  onDestroy(() => {
    controller?.dispose();
    controller = null;
  });
</script>

<div class="panel" data-panel-id={dataPanelId}>
  <div id="engine-section" class="section">
    <div class="section-title">Engine Settings</div>

    {#each toggleConfig as cfg, i}
      <div class="setting-row">
        <label for={cfg.key}>{cfg.label}</label>
        <label class="toggle-switch">
          <input
            type="checkbox"
            id={cfg.key}
            name={cfg.key}
            bind:this={toggleRefs[i]}
          />
          <span class="slider-knob"></span>
        </label>
      </div>
    {/each}
  </div>

  <div id="camera-section" class="section">
    <div class="section-title">Camera Settings</div>

    <div class="setting-row-full">
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <teskooano-slider
        id="fov"
        name="fov"
        min="30"
        max="140"
        step="1"
        value="75"
        editable-value
        bind:this={fovSliderRef}
      >
        <span slot="label">FOV</span>
        <span slot="help-text">Adjust the camera Field of View (degrees)</span>
      </teskooano-slider>
    </div>
  </div>

  <div
    id="error-message"
    class="error-message"
    style="display: none;"
    bind:this={errorMsgEl}
  ></div>
</div>

<style>
  .panel {
    display: block;
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: 10px;
    font-family: var(--font-family, sans-serif);
    font-size: 0.9em;
    border-top: 1px solid var(--color-border-alt, #5a5a7a);
    box-sizing: border-box;
  }

  .section {
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--color-border-alt, #5a5a7a);
  }

  .section-title {
    margin: 8px 0 10px 0;
    font-weight: 600;
    color: var(--color-text-primary, #ddd);
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .setting-row-full {
    margin-bottom: 12px;
  }

  label {
    margin-right: 10px;
    color: var(--color-text-secondary, #aaa);
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
    margin-right: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider-knob {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-surface-alt, #3a3a4e);
    transition: 0.4s;
    border-radius: 20px;
    border: 1px solid var(--color-border-alt, #5a5a7a);
  }

  .slider-knob::before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 3px;
    bottom: 3px;
    background-color: var(--color-text-secondary, #aaa);
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider-knob {
    background-color: var(--color-primary, #6c63ff);
    border-color: var(--color-primary, #6c63ff);
  }

  input:checked + .slider-knob::before {
    transform: translateX(14px);
    background-color: white;
  }

  .error-message {
    color: var(--color-error, #f44336);
    font-style: italic;
    margin-top: 10px;
  }
</style>
