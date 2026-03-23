<script lang="ts">
  import Card from "@core/components/card/Card.svelte";
  let { drawCalls = 0, triangles = 0 }: { drawCalls: number; triangles: number } = $props();
</script>

<Card variant="fluid">
  {#snippet title()}Renderer Stats{/snippet}
  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Draw Calls</td>
        <td>{drawCalls.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Triangles</td>
        <td>{triangles.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
</Card>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.25rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color-soft);
  }

  th {
    font-weight: var(--font-weight-bold);
    color: var(--text-color-secondary);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  td:last-child {
    text-align: right;
  }
</style>
