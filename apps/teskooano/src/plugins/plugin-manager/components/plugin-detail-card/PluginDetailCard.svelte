<script lang="ts">
  import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
  import Card from "@core/components/card/Card.svelte";

  let { plugin }: { plugin: TeskooanoPlugin } = $props();

  const functions = $derived(plugin.functions?.map((f) => f.id) ?? []);
  const panels = $derived(plugin.panels?.map((p) => p.componentName) ?? []);
  const components = $derived(
    plugin.components?.map((c) => `<${c.tagName}>`) ?? [],
  );
</script>

<Card variant="fluid">
  {#snippet title()}{plugin.name ?? "Unnamed Plugin"}{/snippet}
  <div class="plugin-id">ID: {plugin.id}</div>
  <div class="plugin-description">
    {plugin.description ?? "No description provided."}
  </div>
  <div class="plugin-content-wrapper">
    {#if functions.length > 0}
      <div class="plugin-details">
        <strong>Functions:</strong>
        <ul>
          {#each functions as fn}
            <li>{fn}</li>
          {/each}
        </ul>
      </div>
    {/if}
    {#if panels.length > 0}
      <div class="plugin-details">
        <strong>Panels:</strong>
        <ul>
          {#each panels as panel}
            <li>{panel}</li>
          {/each}
        </ul>
      </div>
    {/if}
    {#if components.length > 0}
      <div class="plugin-details">
        <strong>Components:</strong>
        <ul>
          {#each components as component}
            <li>{@html component}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</Card>

<style>
  .plugin-id {
    font-weight: bold;
    color: var(--text-color-accent, #c678dd);
  }

  .plugin-description {
    font-size: 0.9em;
    margin-top: 4px;
    margin-bottom: 12px;
  }

  .plugin-details {
    margin-top: 8px;
    padding-left: 12px;
    border-left: 2px solid var(--border-color-default, #3f444f);
  }

  .plugin-details strong {
    color: var(--text-color-subtle, #98c379);
  }

  .plugin-details ul {
    font-size: 0.9em;
    padding-left: 16px;
    list-style-type: disc;
    margin: 4px 0 0;
  }

  .plugin-details ul li {
    padding: 2px 0;
    margin: 0;
  }
</style>
