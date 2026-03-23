<script lang="ts">
  import type { Snippet } from "svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";

  type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
  type ButtonVariant = "primary" | "ghost" | "image" | "icon" | "stealth" | null;
  type ButtonType = "button" | "submit" | "reset";

  interface Props {
    /** Disables the button. */
    disabled?: boolean;
    /** Native button type. */
    type?: ButtonType;
    /** Expand to full container width. */
    fullwidth?: boolean;
    /** Size variant. */
    size?: ButtonSize;
    /** Visual variant. */
    variant?: ButtonVariant;
    /** Active/toggled state. */
    active?: boolean;
    /** Inline SVG string for the icon slot (alternative to the icon snippet).
     *  ⚠️ Must come from trusted sources only (e.g. @fluentui/svg-icons). */
    iconSvg?: string | null;
    /** Tooltip body text. Falls back to `title` if omitted. */
    tooltipText?: string | null;
    /** Tooltip heading text. */
    tooltipTitle?: string | null;
    /** Inline SVG string for the tooltip icon. */
    tooltipIconSvg?: string | null;
    /** Horizontal alignment of the tooltip relative to the button. */
    tooltipHorizontalAlign?: "start" | "center" | "end";
    /** Vertical placement of the tooltip. */
    tooltipVerticalAlign?: "above" | "below";
    /** Native title attribute (used as tooltip fallback). */
    title?: string;
    /** Named snippet rendered inside the icon slot. */
    icon?: Snippet;
    /** Default slot — the button label text. */
    children?: Snippet;
    /** Click handler. */
    onclick?: (e: MouseEvent) => void;
    /** Keydown handler (for custom keyboard navigation). */
    onkeydown?: (e: KeyboardEvent) => void;
    /** Passed straight to the `<button>` as aria-label. */
    "aria-label"?: string;
    /** Allows mobile-compact mode. */
    mobile?: boolean;
    /** Forwarded appearance alias (maps to variant). */
    appearance?: ButtonVariant;
  }

  let {
    disabled = false,
    type = "button",
    fullwidth = false,
    size = "md",
    variant: variantProp = null,
    active = false,
    iconSvg = null,
    tooltipText = null,
    tooltipTitle = null,
    tooltipIconSvg = null,
    tooltipHorizontalAlign = "center",
    tooltipVerticalAlign = "below",
    title,
    icon,
    children,
    onclick,
    onkeydown,
    mobile = false,
    appearance,
    "aria-label": ariaLabel,
  }: Props = $props();

  // `appearance` is an alias for `variant` used by some calling code
  const variant = $derived(variantProp ?? appearance ?? null);

  let buttonEl: HTMLButtonElement | undefined = $state();
  let hovered = $state(false);
  let focused = $state(false);

  const hasTooltip = $derived(
    !!(tooltipText || tooltipTitle || tooltipIconSvg || title),
  );
  const tooltipVisible = $derived(
    hasTooltip && !disabled && (hovered || focused),
  );

  const effectiveTooltipText = $derived(tooltipText ?? title ?? null);
</script>

<div
  class="button-host"
  class:fullwidth
  class:variant-primary={variant === "primary"}
  class:variant-ghost={variant === "ghost"}
  class:variant-image={variant === "image"}
  class:variant-icon={variant === "icon"}
  class:variant-stealth={variant === "stealth"}
  class:size-xs={size === "xs"}
  class:size-sm={size === "sm"}
  class:size-lg={size === "lg"}
  class:size-xl={size === "xl"}
  class:mobile
>
  <button
    bind:this={buttonEl}
    {type}
    {disabled}
    aria-label={ariaLabel}
    aria-pressed={active}
    aria-describedby={hasTooltip ? "btn-tooltip" : undefined}
    class:active
    onmouseenter={() => (hovered = true)}
    onmouseleave={() => (hovered = false)}
    onfocusin={() => (focused = true)}
    onfocusout={() => (focused = false)}
    {onclick}
    {onkeydown}
  >
    {#if icon}
      <span class="icon-slot">{@render icon()}</span>
    {:else if iconSvg}
      <span class="icon-slot">{@html iconSvg}</span>
    {/if}
    {#if children}
      <span class="label-slot">{@render children()}</span>
    {/if}
  </button>

  {#if hasTooltip}
    <Tooltip
      triggerEl={buttonEl}
      visible={tooltipVisible}
      verticalAlign={tooltipVerticalAlign}
      horizontalAlign={tooltipHorizontalAlign}
    >
      {#snippet icon()}{#if tooltipIconSvg}{@html tooltipIconSvg}{/if}{/snippet}
      {#snippet title()}{#if tooltipTitle}{tooltipTitle}{/if}{/snippet}
      {#if effectiveTooltipText}{effectiveTooltipText}{/if}
    </Tooltip>
  {/if}
</div>

<style>
  .button-host {
    display: inline-block;
    box-sizing: border-box;
    position: relative;
    --icon-size: var(--font-size-base);
    --icon-gap: var(--space-2);
  }

  .button-host.fullwidth {
    display: block;
    width: 100%;
  }

  .button-host.fullwidth button {
    width: 100%;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-height: calc(var(--space-2) * 2 + var(--line-height-base) * 1em);
    padding: var(--space-2) var(--space-4);
    border: var(--border-width-thin, 1px) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-base);
    gap: var(--icon-gap);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      color 150ms ease,
      box-shadow 150ms ease;
  }

  button:hover:not([disabled]) {
    border-color: var(--color-border-strong);
    background-color: var(--color-surface-3);
  }

  button:active:not([disabled]) {
    background-color: var(--color-surface-1);
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-inner);
  }

  button:focus {
    outline: none;
  }

  button:focus-visible {
    outline: var(--border-width-medium, 2px) solid var(--color-border-focus);
    outline-offset: 1px;
    border-color: var(--color-border-focus);
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--color-surface-1);
    border-color: var(--color-border-subtle);
    color: var(--color-text-disabled);
  }

  button.active {
    background-color: var(--color-primary, #6c63ff);
    border-color: var(--color-primary, #6c63ff);
    color: var(--color-text-on-primary, #fff);
  }

  /* --- Variants --- */
  .variant-primary button {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-on-primary);
  }

  .variant-primary button:hover:not([disabled]) {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  .variant-ghost button,
  .variant-icon button,
  .variant-stealth button {
    background-color: transparent;
    border-color: transparent;
    color: var(--color-text-secondary);
  }

  .variant-ghost button:hover:not([disabled]),
  .variant-icon button:hover:not([disabled]),
  .variant-stealth button:hover:not([disabled]) {
    background-color: var(--color-surface-2);
    border-color: var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  .variant-image button {
    padding: 0;
    min-height: auto;
    min-width: auto;
    width: 45px;
    height: 45px;
    background-color: transparent;
    border-color: transparent;
    gap: 0;
    line-height: 0;
  }

  /* --- Sizes --- */
  .size-xs button {
    min-height: calc(var(--space-1) * 2 + var(--line-height-base) * 0.5em);
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-small);
    border-radius: var(--radius-sm);
  }

  .size-sm button {
    min-height: calc(var(--space-1) * 2 + var(--line-height-base) * 1em);
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-small);
    border-radius: var(--radius-sm);
  }

  .size-lg button {
    min-height: calc(var(--space-3) * 2 + var(--line-height-base) * 1em);
    padding: var(--space-3) var(--space-5);
    font-size: var(--font-size-large);
    border-radius: var(--radius-lg);
  }

  .size-xl button {
    min-height: calc(var(--space-4) * 2 + var(--line-height-base) * 1em);
    padding: var(--space-4) var(--space-6);
    font-size: var(--font-size-xlarge);
    border-radius: var(--radius-xl);
  }

  /* Hide label text in mobile mode */
  .mobile .label-slot {
    display: none;
  }

  .icon-slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size);
    height: var(--icon-size);
    flex-shrink: 0;
  }

  .icon-slot :global(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
    pointer-events: none;
  }
</style>
