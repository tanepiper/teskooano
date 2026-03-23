<script lang="ts">
  import type { SystemHierarchyNode } from "@teskooano/core-debug";
  import Card from "@core/components/card/Card.svelte";

  let { nodes = [] }: { nodes: SystemHierarchyNode[] } = $props();
</script>

{#snippet hierarchyList(items: SystemHierarchyNode[])}
  <ul>
    {#each items as node (node.id)}
      <li data-id={node.id}>
        {node.name} ({node.type})
        {#if node.children && node.children.length > 0}
          {@render hierarchyList(node.children)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<Card>
  {#snippet title()}System Hierarchy{/snippet}
  <div id="hierarchy-content">
    {#if nodes.length === 0}
      <p>No celestial objects loaded.</p>
    {:else}
      {@render hierarchyList(nodes)}
    {/if}
  </div>
</Card>

<style>
  :global(#hierarchy-content ul) {
    padding-left: 20px;
    margin: 0;
    list-style-type: none;
  }

  :global(#hierarchy-content li) {
    padding: 2px 0;
  }
</style>
