<script lang="ts">
  import type { Snippet } from "svelte";
  import { CustomEvents } from "@teskooano/data-types";

  interface SliderChangePayload {
    value: number;
    panelId: string;
  }

  interface Props {
    id?: string;
    name?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    editableValue?: boolean;
    /** Called when the value changes. */
    onchange?: (value: number) => void;
    /** Named snippets */
    label?: Snippet;
    helpText?: Snippet;
  }

  let {
    id,
    name,
    value: valueProp = 50,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    editableValue = false,
    onchange,
    label,
    helpText,
  }: Props = $props();

  let value = $state<number>(0);
  let inputText = $state("0");
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let hostEl: HTMLDivElement | undefined = $state();

  const precision = $derived.by(() => {
    const s = step.toString();
    return s.includes(".") ? s.split(".")[1].length : 0;
  });

  const displayValue = $derived(value.toFixed(precision));

  function applyStep(raw: number): number {
    const stepped =
      Math.round((raw - min) / step) * step + min;
    return Math.max(min, Math.min(stepped, max));
  }

  function getPanelId(): string | null {
    let el: HTMLElement | null = hostEl ?? null;
    while (el) {
      const id = el.getAttribute("data-panel-id");
      if (id) return id;
      const root = el.getRootNode();
      el =
        root instanceof ShadowRoot
          ? (root.host as HTMLElement)
          : el.parentElement;
    }
    return null;
  }

  function emit(newValue: number) {
    const panelId = getPanelId();
    if (!panelId) {
      // Slider is outside a panel context — skip event dispatch.
      return;
    }
    const payload: SliderChangePayload = { value: newValue, panelId };
    hostEl?.dispatchEvent(
      new CustomEvent<SliderChangePayload>(CustomEvents.SLIDER_CHANGE, {
        detail: payload,
        bubbles: true,
        composed: true,
      }),
    );
  }

  function handleSlider(e: Event) {
    if (disabled) return;
    const v = parseFloat((e.target as HTMLInputElement).value);
    value = v;
    inputText = value.toString();
    emit(value);
    onchange?.(value);
  }

  function handleInputChange(e: Event) {
    if (disabled) return;
    const raw = (e.target as HTMLInputElement).value;
    inputText = raw;
    const num = parseFloat(raw);
    if (isNaN(num) || num < min || num > max) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      value = applyStep(num);
      inputText = value.toString();
      emit(value);
      onchange?.(value);
    }, 400);
  }

  function handleInputBlur() {
    inputText = value.toString();
  }

  // Sync external value changes — only when valueProp actually differs
  $effect(() => {
    const v = valueProp;
    if (v !== value) {
      value = v;
      inputText = String(v);
    }
  });
</script>

<div class="slider-wrapper" bind:this={hostEl} class:disabled>
  <div class="label-row">
    {#if label}
      <label for={id}>{@render label()}</label>
    {/if}
  </div>

  <div class="control-row">
    <input
      type="range"
      {id}
      {name}
      {min}
      {max}
      {step}
      value={value}
      {disabled}
      oninput={handleSlider}
    />

    {#if editableValue}
      <input
        type="number"
        class="value-input"
        {min}
        {max}
        {step}
        value={inputText}
        {disabled}
        oninput={handleInputChange}
        onblur={handleInputBlur}
      />
    {:else}
      <span class="value-display">{displayValue}</span>
    {/if}
  </div>

  {#if helpText}
    <div class="help-text">{@render helpText()}</div>
  {/if}
</div>

<style>
  .slider-wrapper {
    display: block;
    margin-bottom: var(--space-3, 12px);
    font-family: var(--font-family, sans-serif);
  }

  .label-row {
    margin-bottom: var(--space-1, 4px);
  }

  label {
    font-size: var(--font-size-sm, 0.9em);
    color: var(--color-text-secondary, #aaa);
    font-weight: var(--font-weight-medium, 500);
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
  }

  input[type="range"] {
    flex-grow: 1;
    appearance: none;
    -webkit-appearance: none;
    height: 4px;
    background: var(--color-surface-inset, #1a1a2e);
    outline: none;
    border-radius: 2px;
    cursor: pointer;
    margin: 8px 0;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: var(--color-primary, #6c63ff);
    border: 2px solid var(--color-border-light, #8888ff);
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: var(--color-primary, #6c63ff);
    border: 2px solid var(--color-border-light, #8888ff);
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.3);
  }

  .value-display {
    font-family: var(--font-family-mono, monospace);
    font-size: var(--font-size-small, 0.85rem);
    color: var(--color-text-secondary, #aaa);
    min-width: 40px;
    text-align: right;
  }

  .value-input {
    width: 60px;
    padding: var(--space-1, 4px) var(--space-2, 8px);
    border: var(--border-width-thin, 1px) solid var(--color-border-subtle, #4a4a6a);
    border-radius: var(--radius-sm, 3px);
    background-color: var(--color-surface-1, #1a1a2e);
    color: var(--color-text-primary, #e0e0fc);
    font-size: var(--font-size-small, 0.85rem);
    font-family: var(--font-family-mono, monospace);
  }

  .value-input:focus {
    outline: none;
    border-color: var(--color-primary, #6c63ff);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.3);
  }

  .help-text {
    font-size: var(--font-size-xs, 0.8em);
    color: var(--color-text-secondary, #aaa);
    margin-top: var(--space-1, 4px);
  }

  .disabled input[type="range"],
  .disabled .value-input {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
