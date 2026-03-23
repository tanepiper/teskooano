<script lang="ts">
  import { celestialDebugger } from "@teskooano/core-debug";

  let { tick = 0 }: { tick: number } = $props();

  const defaultStats = {
    totalObjects: 0,
    maxDepth: 0,
    rootCount: 0,
    averageChildrenPerParent: 0,
    objectsWithChildren: 0,
    leafNodes: 0,
  };

  const defaultDebugInfo = {
    totalObjects: 0,
    maxDepth: 0,
    rootCount: 0,
    entries: [] as Array<{
      id: string;
      name: string;
      type: string;
      parentId?: string;
      childrenCount: number;
      depth: number;
      path: string[];
      descendantCount: number;
      isRoot: boolean;
    }>,
  };

  const stats = $derived.by(() => {
    void tick;
    return celestialDebugger?.getHierarchyStats() ?? defaultStats;
  });

  const debugInfo = $derived.by(() => {
    void tick;
    return celestialDebugger?.getHierarchyDebugInfo() ?? defaultDebugInfo;
  });

  function depthClass(depth: number): string {
    return depth > 5 ? "depth-5p" : `depth-${depth}`;
  }
</script>

<teskooano-card>
  <span slot="title">Hierarchy Statistics</span>
  <div class="stats-grid">
    <div class="stat-item">
      <div class="stat-value">{stats.totalObjects}</div>
      <div class="stat-label">Total Objects</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{stats.maxDepth}</div>
      <div class="stat-label">Max Depth</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{stats.rootCount}</div>
      <div class="stat-label">Root Objects</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{stats.averageChildrenPerParent.toFixed(1)}</div>
      <div class="stat-label">Avg Children</div>
    </div>
  </div>

  {#if debugInfo.entries.length === 0}
    <p>No hierarchy data available.</p>
  {:else}
    <table class="hierarchy-table">
      <thead>
        <tr>
          <th>Object</th>
          <th>Type</th>
          <th>Depth</th>
          <th>Children</th>
          <th>Descendants</th>
          <th>Parent</th>
        </tr>
      </thead>
      <tbody>
        {#each debugInfo.entries as entry (entry.id)}
          <tr>
            <td>
              <span class="depth-indicator {depthClass(entry.depth)}"></span>
              {entry.name}
            </td>
            <td>{entry.type}</td>
            <td>{entry.depth}</td>
            <td>{entry.childrenCount}</td>
            <td>{entry.descendantCount}</td>
            <td>{entry.parentId ?? "Root"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</teskooano-card>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 10px 0;
  }

  .stat-item {
    background: var(--color-surface-2);
    padding: 8px;
    border-radius: 4px;
    text-align: center;
  }

  .stat-value {
    font-size: 1.2em;
    font-weight: bold;
    color: var(--color-primary);
  }

  .stat-label {
    font-size: 0.9em;
    color: var(--color-text-secondary);
  }

  .hierarchy-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .hierarchy-table th,
  .hierarchy-table td {
    padding: 4px 8px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  .hierarchy-table th {
    background: var(--color-surface-2);
    font-weight: bold;
  }

  .depth-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 4px;
  }

  .depth-0 { background: #ff6b6b; }
  .depth-1 { background: #4ecdc4; }
  .depth-2 { background: #45b7d1; }
  .depth-3 { background: #96ceb4; }
  .depth-4 { background: #feca57; }
  .depth-5p { background: #ff9ff3; }
</style>
