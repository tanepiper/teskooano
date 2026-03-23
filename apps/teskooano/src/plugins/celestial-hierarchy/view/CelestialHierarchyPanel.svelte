<script lang="ts">
  import type { PanelInitParameters } from "dockview-core";
  import { CelestialHierarchyController } from "../controller/CelestialHierarchy.controller.js";
  import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
  import Button from "@core/components/button/Button.svelte";

  import ArrowSyncCircleIcon from "@fluentui/svg-icons/icons/arrow_sync_circle_24_regular.svg?raw";
  import DismissCircleIcon from "@fluentui/svg-icons/icons/dismiss_circle_24_regular.svg?raw";

  let { params }: { params: PanelInitParameters } = $props();

  const parentPanel = $derived(
    ((params as any)?.params as any)
      ?.parentInstance as CompositeEnginePanel | undefined,
  );

  const dataPanelId = $derived(
    parentPanel?.panelId ?? (params as any)?.api?.id ?? "",
  );

  const connectedWindowText = $derived(
    parentPanel
      ? `For: ${(parentPanel as any)._api?.title ?? parentPanel.id ?? "Engine Window"}`
      : "Not connected to any Teskooano window",
  );

  // DOM element refs — only what's needed for the controller
  let treeListEl: HTMLUListElement | null = $state(null);
  let destroyedListEl: HTMLUListElement | null = $state(null);

  let controller: CelestialHierarchyController | null = null;

  $effect(() => {
    if (!treeListEl || !destroyedListEl) return;

    controller = new CelestialHierarchyController(treeListEl, destroyedListEl);

    if (parentPanel?.getRenderer && parentPanel?.cameraManager) {
      controller.setParentPanel(parentPanel);
    }

    controller.initialize();

    return () => {
      controller?.dispose();
      controller = null;
    };
  });

  function handleReset() {
    controller?.resetView();
  }

  function handleClearFocus() {
    controller?.clearFocus();
  }
</script>

<!-- data-panel-id set to parent panel's ID so celestial-row children resolve the engine panel -->
<div class="panel" data-panel-id={dataPanelId}>
  <div class="panel-header">
    <p class="connected-window">{connectedWindowText}</p>
  </div>

  <div class="control-section">
    <div class="button-row">
      <Button
        title="Reset Camera View & Clear Focus"
        iconSvg={ArrowSyncCircleIcon}
        onclick={handleReset}
      >Reset</Button>
      <Button
        title="Clear Camera Focus"
        iconSvg={DismissCircleIcon}
        onclick={handleClearFocus}
      >Clear</Button>
    </div>
  </div>

  <div class="target-list-container">
    <ul id="focus-tree-list" bind:this={treeListEl}></ul>
  </div>

  <div class="destroyed-section control-section">
    <h3 class="destroyed-title">Destroyed Objects</h3>
    <div class="destroyed-list-container">
      <ul id="destroyed-list" bind:this={destroyedListEl}></ul>
    </div>
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--font-family, sans-serif);
    font-size: 0.9em;
    fill: #fff;
    overflow: hidden;
  }

  .panel-header {
    padding: 12px 16px;
    background-color: var(--color-surface-2, rgba(255, 255, 255, 0.05));
    border-bottom: 1px solid var(--color-border, #4a4a6a);
    flex-shrink: 0;
  }

  .connected-window {
    margin: 0;
    font-size: 0.85em;
    color: var(--color-text-secondary, #aaa);
    font-style: italic;
  }

  .control-section {
    margin-bottom: 15px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border, #4a4a6a);
    flex-shrink: 0;
  }

  .control-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .button-row {
    display: flex;
    gap: 8px;
  }

  :global(#reset-view),
  :global(#clear-focus) {
    flex-grow: 1;
  }

  .target-list-container {
    flex: 2;
    min-height: 200px;
    overflow-y: auto;
    padding: 0 5px 0 16px;
  }

  .destroyed-section {
    flex: 1;
    min-height: 150px;
    overflow-y: auto;
    padding: 10px 16px;
  }

  .destroyed-list-container {
    overflow-y: auto;
    padding-right: 5px;
    max-height: calc(100% - 30px);
  }

  .destroyed-title {
    margin: 0 0 10px 0;
    padding: 0;
    font-size: 1em;
    font-weight: bold;
    color: var(--color-text-primary, #fff);
  }

  /* Tree list resets */
  :global(ul),
  :global(#focus-tree-list) {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  :global(li) {
    padding: 0;
    margin: 0;
  }

  :global(.list-item-content) {
    display: flex;
    align-items: center;
    padding-left: 4px;
    min-height: 32px;
  }

  :global(.list-item-content.leaf-node) {
    padding-left: 36px;
  }

  :global(.caret) {
    cursor: pointer;
    user-select: none;
    display: inline-block;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    margin-right: 4px;
    position: relative;
    transition: transform 0.15s ease-out;
    min-width: 32px;
    min-height: 32px;
  }

  :global(.caret::before) {
    content: "\25B6";
    color: var(--color-text-secondary, #aaa);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 16px;
  }

  :global(.caret.caret-down::before) {
    transform: translate(-50%, -50%) rotate(90deg);
  }

  :global(.list-item-content .celestial-row-root) {
    flex-grow: 1;
  }

  :global(.nested) {
    display: none;
    padding-left: 22px;
    margin: 0;
  }

  :global(ul.nested.active) {
    display: block;
  }

  :global(li.destroyed),
  :global(li.annihilated) {
    opacity: 0.6;
  }

  :global(li.annihilated) {
    opacity: 0.4;
  }

  /* Focused row styling (applied via li.focused-item by FocusListManager) */
  :global(li.focused-item .celestial-row-root) {
    background-color: var(--color-primary-muted, #5551cc);
    color: var(--color-text-on-primary, white);
    font-weight: bold;
  }

  :global(li.focused-item .celestial-icon) {
    filter: brightness(0) invert(1);
  }

  :global(li.focused-item .button-host button) {
    color: var(--color-text-on-primary, white);
  }

  :global(.empty-message) {
    padding: 10px;
    color: var(--color-text-secondary, #aaa);
    text-align: center;
    font-style: italic;
  }
</style>
