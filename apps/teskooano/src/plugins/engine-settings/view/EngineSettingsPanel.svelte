<script lang="ts">
  import type { PanelInitParameters } from "dockview-core";
  import { StateAccessor } from "@teskooano/core-state";
  import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
  import type { CompositeEngineState } from "../../engine-panel/panels/types.js";
  import Slider from "@core/components/slider/Slider.svelte";

  let { params }: { params: PanelInitParameters } = $props();

  const parentPanel = $derived(
    ((params as any)?.params as any)?.parentInstance as CompositeEnginePanel | undefined,
  );

  const dataPanelId = $derived(
    parentPanel?.panelId ?? (params as any)?.api?.id ?? "",
  );

  // Toggle config — drives the rendered list
  const toggleConfig = [
    { key: "showGrid", label: "Show Grid" },
    { key: "showCelestialLabels", label: "Show Celestial Labels" },
    { key: "showAuMarkers", label: "Show AU Markers" },
    { key: "showDebrisEffects", label: "Show Debris Effects" },
    { key: "showOrbitLines", label: "Show Orbit Lines" },
    { key: "showPredictionLines", label: "Show Prediction Lines" },
    { key: "isDebugMode", label: "Debug Mode" },
  ] as const;

  // Reactive view state — synced directly from the parent panel
  let viewState = $state<CompositeEngineState>({});
  let fovValue = $state(75);
  let errorMsg = $state("");

  $effect(() => {
    const panel = parentPanel;
    if (!panel) return;

    try {
      viewState = panel.getViewState();
    } catch {
      errorMsg = "Could not read initial panel state.";
    }

    // Sync FOV from core-state camera manager
    if (panel.panelId) {
      try {
        const cm = StateAccessor.getCameraManager(panel.panelId);
        fovValue = cm.getCameraFov() ?? 75;
      } catch {
        // camera not ready yet
      }
    }

    // Subscribe to view state changes
    const sub = panel.viewState$.subscribe((newState: CompositeEngineState) => {
      viewState = newState;
      // Also refresh FOV when view state updates
      if (panel.panelId) {
        try {
          const cm = StateAccessor.getCameraManager(panel.panelId);
          const fov = cm.getCameraFov();
          if (typeof fov === "number") fovValue = fov;
        } catch {
          // ignore
        }
      }
    });

    return () => sub.unsubscribe();
  });

  function handleToggle(key: keyof CompositeEngineState, checked: boolean) {
    if (!parentPanel) return;
    parentPanel.updateViewState({ [key]: checked } as Partial<CompositeEngineState>);
  }

  function handleFovChange(value: number) {
    if (!dataPanelId) return;
    try {
      const cm = StateAccessor.getCameraManager(dataPanelId);
      cm.setCameraFov(value);
    } catch {
      errorMsg = "Failed to update FOV.";
    }
  }
</script>

<div class="panel" data-panel-id={dataPanelId}>
  <div id="engine-section" class="section">
    <div class="section-title">Engine Settings</div>

    {#each toggleConfig as cfg}
      <div class="setting-row">
        <label for={cfg.key}>{cfg.label}</label>
        <label class="toggle-switch">
          <input
            type="checkbox"
            id={cfg.key}
            name={cfg.key}
            checked={viewState[cfg.key] ?? false}
            onchange={(e) => handleToggle(cfg.key, (e.target as HTMLInputElement).checked)}
          />
          <span class="slider-knob"></span>
        </label>
      </div>
    {/each}
  </div>

  <div id="camera-section" class="section">
    <div class="section-title">Camera Settings</div>

    <div class="setting-row-full">
      <Slider
        id="fov"
        name="fov"
        min={30}
        max={140}
        step={1}
        value={fovValue}
        editableValue={true}
        onchange={handleFovChange}
      >
        {#snippet label()}FOV{/snippet}
        {#snippet helpText()}Adjust the camera Field of View (degrees){/snippet}
      </Slider>
    </div>
  </div>

  {#if errorMsg}
    <div class="error-message">{errorMsg}</div>
  {/if}
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
