<script lang="ts">
  import { pluginManager } from "@teskooano/ui-plugin";
  import type {
    FunctionToolbarItemConfig,
    PanelToolbarItemConfig,
    PluginExecutionContext,
    ToolbarItemConfig,
    ToolbarWidgetConfig,
  } from "@teskooano/ui-plugin";
  import Button from "@core/components/button/Button.svelte";

  interface Props {
    context: PluginExecutionContext;
  }

  let { context }: Props = $props();

  const WEBSITE_URL = "https://teskooano.space";

  // Reactive toolbar data — refreshed when plugins change
  let items = $state<ToolbarItemConfig[]>([]);
  let widgets = $state<ToolbarWidgetConfig[]>([]);
  let isMobile = $state(window.innerWidth < 768);

  function loadData() {
    items = pluginManager.getToolbarItemsForTarget("main-toolbar");
    widgets = pluginManager.getToolbarWidgetsForTarget("main-toolbar");
  }

  $effect(() => {
    loadData();

    const sub = pluginManager.pluginsChanged$.subscribe(() => loadData());
    const onResize = () => {
      isMobile = window.innerWidth < 768;
    };
    window.addEventListener("resize", onResize);

    return () => {
      sub.unsubscribe();
      window.removeEventListener("resize", onResize);
    };
  });

  // Widget container ref — custom elements are mounted as children of this div
  let widgetAreaEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!widgetAreaEl) return;

    // Clear and re-mount web-component widgets.
    // This still uses custom elements since widgets (SimulationControls,
    // SystemControls) are still web components pending their own migration.
    widgetAreaEl.innerHTML = "";
    for (const widget of widgets) {
      try {
        const el = document.createElement(widget.componentName);
        if (widget.id) el.id = widget.id;
        if (widget.params) {
          for (const [key, val] of Object.entries(widget.params)) {
            el.setAttribute(key, String(val));
          }
        }
        widgetAreaEl.appendChild(el);
        if (typeof (el as any).setContext === "function") {
          (el as any).setContext(context);
        }
      } catch (err) {
        console.error(`[Toolbar] Failed to mount widget '${widget.id}'`, err);
      }
    }
  });

  function handleItemClick(item: ToolbarItemConfig) {
    if (item.type === "function") {
      context.pluginManager.execute((item as FunctionToolbarItemConfig).functionId);
    } else if (item.type === "panel") {
      context.dockviewController.handlePanelToggleAction(item as PanelToolbarItemConfig);
    }
  }
</script>

<div class="toolbar-container">
  <!-- Logo -->
  <div class="toolbar-section">
    <Button
      id="toolbar-logo"
      variant="image"
      title="Visit Teskooano Website"
      tooltipText="Visit Teskooano Website"
      tooltipTitle="Teskooano"
      tooltipHorizontalAlign="start"
      onclick={() => window.open(WEBSITE_URL, "_blank")}
    >
      {#snippet icon()}
        <img src="/assets/icon.png" alt="Teskooano Logo" />
      {/snippet}
    </Button>
  </div>

  <!-- Dynamic plugin buttons -->
  <div class="toolbar-section left-button-group">
    {#each items as item (item.id)}
      {@const cfg = item as any}
      <Button
        id={item.id}
        variant="ghost"
        size="sm"
        title={item.title}
        iconSvg={item.iconSvg}
        tooltipText={cfg.tooltipText}
        tooltipTitle={cfg.tooltipTitle}
        tooltipIconSvg={cfg.tooltipIconSvg}
        tooltipHorizontalAlign={cfg.tooltipHorizontalAlign}
        mobile={isMobile && item.id === "main-toolbar-add-view"}
        onclick={() => handleItemClick(item)}
      />
    {/each}
  </div>

  <!-- Widget area — web-component widgets mounted here imperatively -->
  <div class="toolbar-section widget-area" bind:this={widgetAreaEl}></div>
</div>

<style>
  .toolbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-surface-2);
    border-bottom: var(--border-width-thin, 1px) solid var(--color-border-subtle);
    gap: var(--space-md);
    box-sizing: border-box;
    height: 60px;
    overflow: hidden;
    fill: var(--color-text-primary);
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-shrink: 0;
  }

  .left-button-group {
    flex-grow: 0;
    gap: var(--space-xs, 10px);
  }

  .widget-area {
    flex-grow: 1;
    justify-content: flex-start;
    overflow-x: auto;
    white-space: nowrap;
    gap: var(--space-sm);
    display: flex;
    align-items: center;
    touch-action: pan-x;
    -webkit-overflow-scrolling: touch;
  }

  .widget-area::-webkit-scrollbar,
  .widget-area::-webkit-scrollbar-button {
    display: none;
  }

  :global(#toolbar-logo img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
