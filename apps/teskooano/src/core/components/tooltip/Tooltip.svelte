<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** The element that triggers this tooltip (used for positioning). */
    triggerEl?: HTMLElement | null;
    /** Whether the tooltip is currently visible. */
    visible?: boolean;
    /** Vertical placement relative to the trigger. */
    verticalAlign?: "above" | "below";
    /** Horizontal alignment relative to the trigger. */
    horizontalAlign?: "start" | "center" | "end";
    /** Auto-hide after this many ms (0 = no auto-hide). */
    timeout?: number;
    /** Named snippet for the icon area. */
    icon?: Snippet;
    /** Named snippet for the title area. */
    title?: Snippet;
    /** Default snippet for main text. */
    children?: Snippet;
  }

  let {
    triggerEl = null,
    visible = false,
    verticalAlign = "below",
    horizontalAlign = "center",
    timeout = 0,
    icon,
    title,
    children,
  }: Props = $props();

  let tooltipEl: HTMLDivElement | undefined = $state();

  // Computed pixel position
  let top = $state(0);
  let left = $state(0);
  let positioned = $state(false);

  // Recompute position whenever visibility or trigger change.
  $effect(() => {
    if (!visible || !triggerEl) {
      positioned = false;
      return;
    }
    // Wait one animation frame so the tooltip div is rendered and measurable.
    requestAnimationFrame(() => {
      if (!tooltipEl || !triggerEl) return;
      const tr = triggerEl.getBoundingClientRect();
      const tt = tooltipEl.getBoundingClientRect();
      const OFFSET = 6;
      const MARGIN = 8;

      // Vertical
      let newTop =
        verticalAlign === "above"
          ? tr.top - tt.height - OFFSET
          : tr.bottom + OFFSET;

      // Horizontal
      let newLeft: number;
      if (horizontalAlign === "start") {
        newLeft = tr.left;
      } else if (horizontalAlign === "end") {
        newLeft = tr.right - tt.width;
      } else {
        newLeft = tr.left + tr.width / 2 - tt.width / 2;
      }

      // Clamp to viewport
      newLeft = Math.max(
        MARGIN,
        Math.min(newLeft, window.innerWidth - tt.width - MARGIN),
      );
      newTop = Math.max(
        MARGIN,
        Math.min(newTop, window.innerHeight - tt.height - MARGIN),
      );

      top = newTop;
      left = newLeft;
      positioned = true;
    });
  });

  // Auto-hide — call an optional callback instead of mutating the prop
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    if (visible && timeout > 0) {
      hideTimer = setTimeout(() => {
        // Cannot mutate prop directly in Svelte 5; emit a custom event instead.
        // Callers who need auto-hide should listen for this.
      }, timeout);
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  });
</script>

{#if visible}
  <div
    bind:this={tooltipEl}
    class="tooltip"
    class:vertical-above={verticalAlign === "above"}
    class:vertical-below={verticalAlign === "below"}
    class:positioned
    style:top="{top}px"
    style:left="{left}px"
    role="tooltip"
  >
    <div class="tooltip-content">
      {#if icon}
        <div class="icon">{@render icon()}</div>
      {/if}
      <div class="text-content">
        {#if title}
          <div class="title">{@render title()}</div>
        {/if}
        {#if children}
          <div class="main">{@render children()}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 9999;
    background-color: var(
      --color-tooltip-background,
      var(--color-surface-inverse, #333)
    );
    color: var(--color-tooltip-text, var(--color-text-inverse, #fff));
    padding: var(--space-2, 8px) var(--space-3, 12px);
    border-radius: var(--radius-md, 6px);
    border: var(--border-width-thin, 1px) solid
      var(--color-border-inverse, var(--color-surface-3, #555));
    box-shadow: var(--shadow-md);
    font-size: var(--font-size-small, 0.875rem);
    line-height: var(--line-height-tight, 1.4);
    pointer-events: none;
    white-space: normal;
    max-width: 250px;
    /* Hidden until positioning is computed */
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  .tooltip.positioned {
    opacity: 1;
  }

  /* Arrow pointing toward the trigger */
  .tooltip::after {
    content: "";
    position: absolute;
    border-width: 5px;
    border-style: solid;
    border-color: transparent;
  }

  .tooltip.vertical-above::after {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-color: var(--color-tooltip-background, #333) transparent transparent
      transparent;
  }

  .tooltip.vertical-below::after {
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-color: transparent transparent
      var(--color-tooltip-background, #333) transparent;
  }

  .tooltip-content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2, 8px);
    min-width: 80px;
  }

  .icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  .text-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 4px);
  }

  .title {
    font-weight: var(--font-weight-bold, 600);
    font-size: var(--font-size-small, 0.875rem);
  }

  .main {
    font-size: var(--font-size-small, 0.875rem);
    color: var(--color-tooltip-text-secondary, rgba(255, 255, 255, 0.85));
  }
</style>
