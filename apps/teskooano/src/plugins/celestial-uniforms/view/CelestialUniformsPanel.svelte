<script lang="ts">
  import { onDestroy } from "svelte";
  import type { PanelInitParameters } from "dockview-core";
  import {
    CelestialUniformsController,
    type CelestialUniformsView,
  } from "../controller/CelestialUniforms.controller.js";

  let { params }: { params: PanelInitParameters } = $props();

  const panelId = $derived((params as any)?.api?.id ?? "");

  // Reactive state managed by Svelte; the view adapter below mutates these.
  let title = $state("Celestial Uniforms Editor");
  let placeholderMsg = $state("Select a celestial object to edit its properties.");
  let isShowingPlaceholder = $state(true);

  let containerEl: HTMLElement | null = $state(null);

  let controller: CelestialUniformsController | null = null;

  // View adapter — fulfils CelestialUniformsView without extending HTMLElement.
  // Closures read the current reactive values each time they are invoked.
  const viewAdapter: CelestialUniformsView = {
    clearContainer() {
      if (containerEl) containerEl.innerHTML = "";
    },
    showPlaceholder(msg: string) {
      placeholderMsg = msg;
      isShowingPlaceholder = true;
    },
    hidePlaceholder() {
      isShowingPlaceholder = false;
    },
    setTitle(t: string) {
      title = t;
    },
  };

  // Once the container div is bound to the DOM, create and initialise the
  // controller.  The effect re-runs whenever containerEl changes.
  $effect(() => {
    if (!containerEl || !panelId) return;

    controller = new CelestialUniformsController(viewAdapter, containerEl, panelId);
    controller.initialize();

    // Handle the initial focus from panel params
    const focusedObjectId =
      ((params as any)?.params as { focusedObjectId?: string })
        ?.focusedObjectId ?? null;
    controller.handleInitialSelection(focusedObjectId);

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

<div class="panel">
  <h2 class="panel-title">{title}</h2>

  {#if isShowingPlaceholder}
    <p class="placeholder">{placeholderMsg}</p>
  {/if}

  <!-- The controller renders imperative controls into this div -->
  <div
    class="container"
    class:hidden={isShowingPlaceholder}
    bind:this={containerEl}
  ></div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .panel-title {
    margin: 10px;
    font-size: 1.2em;
    font-weight: bold;
    flex-shrink: 0;
  }

  .placeholder {
    padding: 10px;
    color: var(--ui-text-color-dim, #888);
    font-style: italic;
    flex-shrink: 0;
  }

  .container {
    flex: 1;
    width: 100%;
    overflow: auto;
  }

  .hidden {
    display: none;
  }
</style>
