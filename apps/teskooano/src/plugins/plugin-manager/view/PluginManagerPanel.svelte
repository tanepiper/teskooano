<script lang="ts">
  import { pluginManager } from "@teskooano/ui-plugin";
  import { startWith, map } from "rxjs/operators";
  import { fromObservable } from "@core/utils/svelte-rxjs.svelte.js";
  import PluginDetailCard from "../components/plugin-detail-card/PluginDetailCard.svelte";

  // Map the "changed" signal to the actual plugin list on every emission
  const plugins$ = pluginManager.pluginsChanged$.pipe(
    startWith(undefined),
    map(() => pluginManager.getPlugins()),
  );

  const pluginsState = fromObservable(plugins$, []);
</script>

<div class="plugin-manager-container">
  <h2>Teskooano Plugins</h2>
  <p class="plugin-manager-description">
    This is a list of all the plugins that are currently loaded in the
    application.
  </p>

  {#if pluginsState.value.length === 0}
    <p class="no-plugins">No plugins loaded or found.</p>
  {:else}
    {#each pluginsState.value as plugin (plugin.id)}
      <PluginDetailCard {plugin} />
    {/each}
  {/if}
</div>

<style>
  .plugin-manager-container {
    display: block;
    padding: 16px;
    font-family: var(--font-family-sans, sans-serif);
    background-color: var(--background-color-default, #282c34);
    color: var(--text-color-default, #abb2bf);
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    max-width: 800px;
    margin: 0 auto;
  }

  h2 {
    color: var(--text-color-headings, #61afef);
    border-bottom: 1px solid var(--border-color-default, #3f444f);
    padding-bottom: 8px;
  }

  .plugin-manager-description {
    font-size: 0.9em;
    margin-bottom: 12px;
  }

  .no-plugins {
    padding: 10px;
    text-align: center;
    color: var(--text-color-warning, #e5c07b);
  }
</style>
