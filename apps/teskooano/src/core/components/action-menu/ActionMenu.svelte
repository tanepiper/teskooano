<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "../button/Button.svelte";
  import MoreHorizontalIcon from "@fluentui/svg-icons/icons/more_horizontal_20_regular.svg?raw";

  type Direction = "left" | "right" | "top" | "bottom";
  type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

  interface Props {
    /** Which side the menu expands toward. */
    direction?: Direction;
    /** Size of the toggle button. */
    buttonSize?: ButtonSize;
    /** Close the menu when a child action is clicked. */
    closeOnAction?: boolean;
    /** Aria label / tooltip for the toggle button. */
    toggleTitle?: string;
    /** Inline SVG for the toggle button icon (defaults to ⋯). */
    toggleIconSvg?: string | null;
    /** Default slot — the action buttons inside the menu. */
    children?: Snippet;
  }

  let {
    direction = "right",
    buttonSize = "xs",
    closeOnAction = false,
    toggleTitle = "More Options",
    toggleIconSvg = null,
    children,
  }: Props = $props();

  let expanded = $state(false);
  let hostEl: HTMLDivElement | undefined = $state();

  function toggle(e: MouseEvent) {
    e.stopPropagation();
    expanded = !expanded;
  }

  function handleOutsideClick(e: MouseEvent) {
    if (expanded && hostEl && !hostEl.contains(e.target as Node)) {
      expanded = false;
    }
  }

  function handleMenuClick() {
    if (closeOnAction) expanded = false;
  }

  $effect(() => {
    if (!expanded) return;
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  });

  const menuIconSvg = $derived(toggleIconSvg ?? MoreHorizontalIcon);
</script>

<div class="action-menu-host" bind:this={hostEl}>
  <div class="action-menu-container">
    <div class="menu-toggle-button">
      <Button
        size={buttonSize}
        variant="icon"
        title={toggleTitle}
        iconSvg={menuIconSvg}
        onclick={toggle}
      />
    </div>

    <div
      class="menu-container"
      class:expanded
      data-direction={direction}
      role="menu"
      tabindex="-1"
      onclick={handleMenuClick}
      onkeydown={(e) => e.key === "Enter" && handleMenuClick()}
    >
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
</div>

<style>
  .action-menu-host {
    display: inline-block;
    position: relative;
  }

  .action-menu-container {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .menu-container {
    position: absolute;
    z-index: 9999;
    display: inline-flex;
    align-items: center;
    background-color: rgba(40, 40, 60, 0.95);
    border-radius: 4px;
    padding: 4px;
    gap: 4px;
    overflow: visible;
    color: white;
    fill: var(--color-text-primary);
    max-width: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      max-width 0.3s ease-in-out,
      opacity 0.3s ease-in-out,
      visibility 0.3s ease-in-out;
    white-space: nowrap;
  }

  .menu-container.expanded {
    max-width: 400px;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  /* Direction positioning */
  .menu-container[data-direction="right"] {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 4px;
  }

  .menu-container[data-direction="left"] {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 4px;
  }

  .menu-container[data-direction="top"] {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column;
    margin-bottom: 4px;
  }

  .menu-container[data-direction="bottom"] {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column;
    margin-top: 4px;
  }
</style>
