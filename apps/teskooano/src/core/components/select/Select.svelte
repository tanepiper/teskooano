<script lang="ts">
  import type { Snippet } from "svelte";
  import { CustomEvents } from "@teskooano/data-types";

  interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    id?: string;
    name?: string;
    value?: string;
    disabled?: boolean;
    options?: SelectOption[];
    /** Called when the selected value changes. */
    onchange?: (value: string) => void;
    label?: Snippet;
    helpText?: Snippet;
  }

  let {
    id,
    name,
    value: valueProp = "",
    disabled = false,
    options = [],
    onchange,
    label,
    helpText,
  }: Props = $props();

  let value = $state<string>("");

  // Sync external changes
  $effect(() => {
    const v = valueProp;
    value = v;
  });

  function handleChange(e: Event) {
    if (disabled) return;
    const newValue = (e.target as HTMLSelectElement).value;
    value = newValue;
    onchange?.(newValue);
    // Dispatch legacy custom event for backward compat with controllers
    (e.target as HTMLElement).dispatchEvent(
      new CustomEvent(CustomEvents.SELECT_CHANGE, {
        bubbles: true,
        composed: true,
        detail: { value: newValue },
      }),
    );
  }
</script>

<div class="select-wrapper" class:disabled>
  {#if label}
    <label for={id}>{@render label()}</label>
  {/if}

  <select {id} {name} {value} {disabled} onchange={handleChange}>
    {#each options as opt}
      <option value={opt.value} disabled={opt.disabled ?? false}>
        {opt.label}
      </option>
    {/each}
  </select>

  {#if helpText}
    <span class="help-text">{@render helpText()}</span>
  {/if}
</div>

<style>
  .select-wrapper {
    display: block;
    margin-bottom: var(--space-3, 12px);
    font-family: var(--font-family, sans-serif);
  }

  label {
    display: block;
    font-size: var(--font-size-sm, 0.9em);
    color: var(--color-text-secondary, #aaa);
    font-weight: var(--font-weight-medium, 500);
    margin-bottom: var(--space-1, 4px);
  }

  select {
    display: block;
    width: 100%;
    padding: var(--space-2, 8px) var(--space-3, 12px);
    font-size: var(--font-size-base, 1em);
    font-family: inherit;
    color: var(--color-text-primary, #e0e0fc);
    background-color: var(--color-surface-inset, #1a1a2e);
    border: 1px solid var(--color-border-subtle, #50506a);
    border-radius: var(--radius-md, 5px);
    cursor: pointer;
  }

  select:focus {
    outline: none;
    border-color: var(--color-primary, #6c63ff);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.3);
  }

  .disabled select {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--color-surface-disabled, #333);
  }

  .disabled label {
    opacity: 0.6;
  }

  .help-text {
    display: block;
    font-size: var(--font-size-xs, 0.8em);
    color: var(--color-text-secondary, #aaa);
    margin-top: var(--space-1, 4px);
  }
</style>
