<script lang="ts">
  import type { SystemHierarchyNode } from "@teskooano/core-debug";

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

<teskooano-card>
  <span slot="title">System Hierarchy</span>
  <div id="hierarchy-content">
    {#if nodes.length === 0}
      <p>No celestial objects loaded.</p>
    {:else}
      {@render hierarchyList(nodes)}
    {/if}
  </div>
</teskooano-card>

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
