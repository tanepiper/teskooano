<script lang="ts">
  import { onDestroy } from "svelte";
  import type { PanelInitParameters } from "dockview-core";
  import {
    DebugPanelController,
    type DebugPanelView,
  } from "../controller/debug-panel.controller.js";
  import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
  import type { SystemHierarchyNode } from "@teskooano/core-debug";
  import RendererStats from "../components/renderer-stats/RendererStats.svelte";
  import SystemHierarchy from "../components/system-hierarchy/SystemHierarchy.svelte";
  import HierarchyStats from "../components/hierarchy-stats/HierarchyStats.svelte";

  let { params }: { params: PanelInitParameters } = $props();

  const parentPanel = $derived(
    ((params as any)?.params as any)?.parentInstance as
      | CompositeEnginePanel
      | undefined,
  );

  const dataPanelId = $derived(
    parentPanel?.panelId ?? (params as any)?.api?.id ?? "",
  );

  // Reactive state driving Svelte sub-components
  let statsData = $state({ drawCalls: 0, triangles: 0 });
  let hierarchyNodes: SystemHierarchyNode[] = $state([]);
  let hierarchyTick = $state(0);

  let controller: DebugPanelController | null = null;
  let updateInterval: number | null = null;

  const viewAdapter: DebugPanelView = {
    renderStats(stats: { drawCalls: number; triangles: number }) {
      statsData = stats;
    },
    renderHierarchy(nodes: SystemHierarchyNode[]) {
      hierarchyNodes = nodes;
    },
    getHierarchyStatsComponent() {
      return { updateStats: () => { hierarchyTick += 1; } };
    },
  };

  $effect(() => {
    controller = new DebugPanelController(viewAdapter, parentPanel ?? null);

    updateInterval = window.setInterval(() => {
      controller?.updateData();
    }, 2000);

    return () => {
      if (updateInterval) {
        window.clearInterval(updateInterval);
        updateInterval = null;
      }
      controller?.dispose();
      controller = null;
    };
  });

  onDestroy(() => {
    if (updateInterval) {
      window.clearInterval(updateInterval);
      updateInterval = null;
    }
    controller?.dispose();
    controller = null;
  });
</script>

<div class="panel" data-panel-id={dataPanelId}>
  <RendererStats drawCalls={statsData.drawCalls} triangles={statsData.triangles} />
  <SystemHierarchy nodes={hierarchyNodes} />
  <HierarchyStats tick={hierarchyTick} />
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    width: 100%;
    overflow: auto;
    padding: 1rem;
    box-sizing: border-box;
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-sm);
  }
</style>
