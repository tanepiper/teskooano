<script lang="ts">
  import { CustomEvents } from "@teskooano/data-types";
  import { FormatUtils } from "../../../celestial-info/utils/formatters.js";
  import { DistanceStateService } from "../../services/DistanceStateService.js";
  import EyeIcon from "@fluentui/svg-icons/icons/eye_20_regular.svg?raw";
  import ArrowStepOverRegular from "@fluentui/svg-icons/icons/arrow_step_over_20_regular.svg?raw";

  let {
    objectId,
    objectName,
    objectType,
    config,
    inactive = false,
  }: {
    objectId: string;
    objectName: string;
    objectType: string;
    config: string;
    inactive?: boolean;
  } = $props();

  let rootEl: HTMLDivElement | null = $state(null);

  let distanceValue: number | undefined = $state(undefined);

  $effect(() => {
    const sub = DistanceStateService.getInstance()
      .getDistance$(objectId)
      .subscribe((val) => {
        distanceValue = val;
      });
    return () => sub.unsubscribe();
  });

  const formattedDistance = $derived(
    distanceValue !== undefined
      ? FormatUtils.formatDistanceAdaptive(distanceValue)
      : "",
  );

  function handleFocusClick(event: MouseEvent | KeyboardEvent) {
    if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return;
    event.stopPropagation();
    if (!inactive && rootEl) {
      rootEl.dispatchEvent(
        new CustomEvent(CustomEvents.FOCUS_REQUEST, {
          bubbles: true,
          detail: { objectId },
        }),
      );
    }
  }

  function handleFollowClick(event: MouseEvent | KeyboardEvent) {
    if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return;
    event.stopPropagation();
    if (!inactive && rootEl) {
      rootEl.dispatchEvent(
        new CustomEvent(CustomEvents.FOLLOW_REQUEST, {
          bubbles: true,
          detail: { objectId },
        }),
      );
    }
  }
</script>

<div
  class="celestial-row-root"
  class:inactive
  title="Type: {objectType}"
  data-object-id={objectId}
  bind:this={rootEl}
>
  <div class="icon-name-container">
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <celestial-icon {config} class="celestial-icon"></celestial-icon>
    <span class="object-name">{objectName}</span>
    {#if formattedDistance}
      <span class="object-distance">{formattedDistance}</span>
    {/if}
  </div>
  {#if !inactive}
    <div class="action-buttons">
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <teskooano-button
        size="sm"
        role="button"
        tabindex="0"
        title="Follow {objectName}"
        appearance="stealth"
        onclick={handleFollowClick}
        onkeydown={handleFollowClick}
      >
        <span slot="icon">{@html ArrowStepOverRegular}</span>
      </teskooano-button>
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <teskooano-action-menu direction="left">
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <teskooano-button
          size="sm"
          role="button"
          tabindex="0"
          title="Focus {objectName}"
          appearance="stealth"
          onclick={handleFocusClick}
          onkeydown={handleFocusClick}
        >
          <span slot="icon">{@html EyeIcon}</span>
        </teskooano-button>
      </teskooano-action-menu>
    </div>
  {/if}
</div>

<style>
  .celestial-row-root {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 2px 4px;
    border-radius: 3px;
    transition: background-color 0.15s ease;
    box-sizing: border-box;
    gap: 4px;
    font-size: 0.95em;
  }

  .celestial-row-root:hover {
    background-color: var(--color-surface-hover, rgba(255, 255, 255, 0.1));
  }

  .celestial-row-root.inactive {
    color: var(--color-text-disabled, #888);
    background-color: transparent;
    opacity: 0.6;
  }

  .celestial-row-root.inactive :global(.celestial-icon) {
    filter: grayscale(100%) opacity(50%);
  }

  .icon-name-container {
    display: flex;
    align-items: center;
    flex-grow: 1;
    overflow: hidden;
    gap: 6px;
  }

  :global(.celestial-icon) {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  .object-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }

  .object-distance {
    font-size: 0.9em;
    color: var(--color-text-secondary, #aaa);
    margin-left: 8px;
    flex-shrink: 0;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  :global(.celestial-row-root teskooano-button) {
    --button-padding: 2px;
    --button-min-height: 18px;
    --button-icon-size: 14px;
    --button-icon-color: currentColor;
  }
</style>
