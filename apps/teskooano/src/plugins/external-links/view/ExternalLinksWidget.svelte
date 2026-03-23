<script lang="ts">
  import Button from "@core/components/button/Button.svelte";
  import { links } from "../data/links.js";

  function openLink(url: string): void {
    window.open(url, "_blank", "noopener,noreferrer");
  }
</script>

<div class="external-links-container">
  {#each links as link}
    <Button
      variant="icon"
      aria-label={link.label}
      tooltipText={link.tooltipText ?? link.label}
      tooltipTitle={link.tooltipTitle ?? link.label}
      tooltipIconSvg={link.tooltipIconSvg ?? link.iconSvg}
      onclick={() => openLink(link.url)}
      onkeydown={(e: KeyboardEvent) => e.key === "Enter" && openLink(link.url)}
    >
      {#snippet icon()}{@html link.iconSvg}{/snippet}
    </Button>
  {/each}
</div>

<style>
  .external-links-container {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
