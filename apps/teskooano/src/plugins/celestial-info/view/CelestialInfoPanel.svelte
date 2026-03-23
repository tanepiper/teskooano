<script lang="ts">
  import { onDestroy } from "svelte";
  import type { PanelInitParameters } from "dockview-core";
  import { CelestialInfoController } from "../controller/CelestialInfo.controller.js";
  import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";

  let { params }: { params: PanelInitParameters } = $props();

  const parentPanel = $derived(
    ((params as any)?.params as any)?.parentInstance as CompositeEnginePanel | undefined
  );

  // Use the parent panel's ID so nested components resolve the engine panel context.
  const dataPanelId = $derived(parentPanel?.panelId ?? (params as any)?.api?.id ?? "");

  // DOM refs — both elements must be in the DOM before the controller is created.
  let containerEl: HTMLElement | null = $state(null);
  let placeholderEl: HTMLElement | null = $state(null);

  let controller: CelestialInfoController | null = null;

  $effect(() => {
    if (!containerEl || !placeholderEl) return;

    controller = new CelestialInfoController(containerEl, placeholderEl);

    if (parentPanel) {
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
  <div class="placeholder" bind:this={placeholderEl}>
    Select a celestial object...
  </div>
  <div class="container" bind:this={containerEl}></div>
</div>

<style>
  .panel {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .placeholder {
    padding: 10px;
    color: var(--ui-text-color-dim, #888);
    font-style: italic;
  }

  .container {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>
