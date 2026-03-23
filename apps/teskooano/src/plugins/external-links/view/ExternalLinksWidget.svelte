<script lang="ts">
  import { links } from "../data/links.js";

  function openLink(url: string): void {
    window.open(url, "_blank", "noopener,noreferrer");
  }
</script>

<div class="external-links-container">
  {#each links as link}
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <teskooano-button
      role="button"
      tabindex="0"
      variant="icon"
      aria-label={link.label}
      tooltip-text={link.tooltipText ?? link.label}
      tooltip-title={link.tooltipTitle ?? link.label}
      tooltip-icon-svg={link.tooltipIconSvg ?? link.iconSvg}
      onclick={() => openLink(link.url)}
      onkeydown={(e: KeyboardEvent) => e.key === "Enter" && openLink(link.url)}
    >
      <span slot="icon">{@html link.iconSvg}</span>
    </teskooano-button>
  {/each}
</div>

<style>
  .external-links-container {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
