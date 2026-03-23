<script lang="ts">
  import type { Snippet } from "svelte";

  type CardVariant = "fixed" | "fluid" | "full";

  interface Props {
    /** Width behaviour. */
    variant?: CardVariant;
    /** Named snippets */
    image?: Snippet;
    label?: Snippet;
    title?: Snippet;
    cta?: Snippet;
    children?: Snippet;
  }

  let {
    variant = "fixed",
    image,
    label,
    title,
    cta,
    children,
  }: Props = $props();
</script>

<div
  class="card-container"
  class:variant-fluid={variant === "fluid"}
  class:variant-full={variant === "full"}
>
  {#if image}
    <div class="image-slot">{@render image()}</div>
  {/if}
  <div class="content-area">
    {#if label}
      <div class="label-slot">{@render label()}</div>
    {/if}
    {#if title}
      <div class="title-slot">{@render title()}</div>
    {/if}
    {#if children}
      <div class="content-slot">{@render children()}</div>
    {/if}
  </div>
  {#if cta}
    <div class="cta-area">{@render cta()}</div>
  {/if}
</div>

<style>
  .card-container {
    display: inline-flex;
    flex-direction: column;
    width: var(--card-fixed-width, 300px);
    background-color: var(--color-surface-2);
    border: var(--border-width-thin, 1px) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    box-sizing: border-box;
    transition: border-color 150ms ease;
  }

  .card-container:hover {
    border-color: var(--color-border-strong);
  }

  .card-container.variant-fluid {
    display: flex;
    width: auto;
    max-width: 100%;
  }

  .card-container.variant-full {
    display: flex;
    width: 100%;
  }

  .image-slot {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: var(--color-surface-1);
    flex-shrink: 0;
  }

  .image-slot :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .content-area {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: var(--space-2);
  }

  .label-slot {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    font-weight: var(--font-weight-medium);
    letter-spacing: 0.5px;
  }

  .title-slot {
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    line-height: var(--line-height-heading);
  }

  .content-slot {
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    flex-grow: 1;
  }

  .cta-area {
    margin-top: auto;
    padding: var(--space-3) var(--space-4) var(--space-4);
    border-top: var(--border-width-thin, 1px) solid var(--color-border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
