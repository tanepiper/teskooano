<script lang="ts">
  import {
    StateAccessor,
    simulationState$,
    actions,
    type SimulationState,
  } from "@teskooano/core-state";
  import Button from "@core/components/button/Button.svelte";
  import { TimeDisplayManager } from "../controller/time-display-manager.js";
  import {
    formatScale,
    getConfigurationShortName,
    getConfigurationDisplayName,
  } from "../controller/simulation-controls.utils.js";

  import PlayRegular from "@fluentui/svg-icons/icons/play_20_regular.svg?raw";
  import PauseRegular from "@fluentui/svg-icons/icons/pause_20_regular.svg?raw";
  import PreviousRegular from "@fluentui/svg-icons/icons/previous_20_regular.svg?raw";
  import NextRegular from "@fluentui/svg-icons/icons/next_20_regular.svg?raw";
  import ArrowClockwiseRegular from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg?raw";

  const speedValues = [
    0.0625, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24,
    32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608,
    10000000,
  ];

  // --- Reactive simulation state ---
  let simState = $state<SimulationState>(StateAccessor.getSimulationState());

  $effect(() => {
    const sub = simulationState$.subscribe((s) => (simState = s));
    return () => sub.unsubscribe();
  });

  const isPaused = $derived(simState.paused);
  const timeScale = $derived(simState.timeScale);
  const simulationConfig = $derived(simState.simulationConfig);

  const scaleDisplay = $derived(formatScale(timeScale));
  const scaleColor = $derived(
    timeScale < 0 ? "var(--color-warning-emphasis)" : "var(--color-text-secondary)",
  );

  const engineShortName = $derived(getConfigurationShortName(simulationConfig as any));
  const engineFullName = $derived(getConfigurationDisplayName(simulationConfig as any));

  const isSpeedDownDisabled = $derived(
    isPaused ||
      (Math.abs(timeScale) <= speedValues[0] && timeScale !== 0),
  );
  const isSpeedUpDisabled = $derived(
    isPaused || Math.abs(timeScale) >= speedValues[speedValues.length - 1],
  );

  // --- Scale dropdown state ---
  let showScaleSelect = $state(false);
  let scaleSelectEl: HTMLSelectElement | null = $state(null);

  function openScaleSelect() {
    showScaleSelect = true;
    // Focus happens in a microtask after Svelte renders the <select>
    setTimeout(() => scaleSelectEl?.focus(), 0);
  }

  function applyScaleSelect() {
    if (!scaleSelectEl) return;
    const selectedValue = parseFloat(scaleSelectEl.value);
    if (!isNaN(selectedValue)) {
      const newScale = timeScale < 0 ? -selectedValue : selectedValue;
      actions.setTimeScale(newScale);
    }
    showScaleSelect = false;
  }

  function cancelScaleSelect() {
    showScaleSelect = false;
  }

  // --- Time display ---
  let timeDisplayEl: HTMLElement | null = $state(null);
  let timeDisplayManager: TimeDisplayManager | null = null;

  $effect(() => {
    if (!timeDisplayEl) return;
    timeDisplayManager = new TimeDisplayManager({
      element: timeDisplayEl,
      compact: false,
    });

    // Listen for public API events from the web component shell
    const host = timeDisplayEl.closest("teskooano-simulation-controls");
    const onReset = () => timeDisplayManager?.resetStartDate();
    const onSetDate = (e: Event) => {
      const { startDate } = (e as CustomEvent).detail ?? {};
      if (startDate instanceof Date) timeDisplayManager?.setStartDate(startDate);
    };
    host?.addEventListener("simulation-reset-date", onReset);
    host?.addEventListener("simulation-set-date", onSetDate);

    return () => {
      host?.removeEventListener("simulation-reset-date", onReset);
      host?.removeEventListener("simulation-set-date", onSetDate);
      timeDisplayManager?.dispose();
      timeDisplayManager = null;
    };
  });

  $effect(() => {
    // Reactively update the date display whenever sim time changes
    timeDisplayManager?.updateDisplay(simState.time);
  });

  // --- Button actions ---
  function handlePlayPause() {
    actions.togglePause();
  }

  function handleSpeedUp() {
    if (timeScale === 0) { actions.setTimeScale(1); return; }
    const abs = Math.abs(timeScale);
    const sign = Math.sign(timeScale);
    const next = speedValues.find((v) => v > abs) ?? speedValues[speedValues.length - 1];
    actions.setTimeScale(next * sign);
  }

  function handleSpeedDown() {
    if (timeScale === 0) { actions.setTimeScale(-1); return; }
    const abs = Math.abs(timeScale);
    const sign = Math.sign(timeScale);
    const prev = [...speedValues].reverse().find((v) => v < abs) ?? speedValues[0];
    actions.setTimeScale(prev * sign);
  }

  function handleReverse() {
    actions.setTimeScale(timeScale === 0 ? -1 : -timeScale);
  }

  // Build the speed options for the <select>
  const scaleOptions = $derived.by(() => {
    const abs =
      timeScale < 0
        ? Math.abs(timeScale)
        : timeScale === 0
          ? 1
          : timeScale;
    return speedValues.map((v) => ({ value: v, label: formatScale(v), selected: v === abs }));
  });
</script>

<div class="controls-container">
  <Button
    variant="icon"
    size="sm"
    title="Reverse Direction"
    tooltipText="Reverse simulation direction."
    tooltipTitle="Reverse"
    tooltipHorizontalAlign="start"
    active={timeScale < 0}
    iconSvg={ArrowClockwiseRegular}
    onclick={handleReverse}
  />
  <Button
    variant="icon"
    size="sm"
    title="Decrease Speed"
    tooltipText="Decrease simulation speed (halve)."
    tooltipTitle="Decrease Speed"
    tooltipHorizontalAlign="start"
    disabled={isSpeedDownDisabled}
    iconSvg={PreviousRegular}
    onclick={handleSpeedDown}
  />
  <Button
    variant="icon"
    size="sm"
    title={isPaused ? "Play Simulation" : "Pause Simulation"}
    tooltipText={isPaused ? "Play Simulation" : "Pause Simulation"}
    tooltipTitle="Simulation Control"
    tooltipHorizontalAlign="start"
    active={!isPaused}
    iconSvg={isPaused ? PlayRegular : PauseRegular}
    onclick={handlePlayPause}
  />
  <Button
    variant="icon"
    size="sm"
    title="Increase Speed"
    tooltipText="Increase simulation speed (double)."
    tooltipTitle="Increase Speed"
    tooltipHorizontalAlign="start"
    disabled={isSpeedUpDisabled}
    iconSvg={NextRegular}
    onclick={handleSpeedUp}
  />
</div>

<div class="separator"></div>

<div class="display-container">
  <!-- Scale display / select -->
  {#if showScaleSelect}
    <select
      bind:this={scaleSelectEl}
      class="display-value scale-select"
      title="Select Time Scale"
      onchange={applyScaleSelect}
      onblur={() => { setTimeout(() => { if (document.activeElement !== scaleSelectEl) cancelScaleSelect(); }, 100); }}
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyScaleSelect(); } else if (e.key === 'Escape') { e.preventDefault(); cancelScaleSelect(); } }}
    >
      {#each scaleOptions as opt}
        <option value={opt.value} selected={opt.selected}>{opt.label}</option>
      {/each}
    </select>
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="display-value"
      style:color={scaleColor}
      title="Time Scale — click to change"
      onclick={openScaleSelect}
    >{scaleDisplay}</span>
  {/if}

  <!-- Time display (managed by TimeDisplayManager for editable date logic) -->
  <span
    bind:this={timeDisplayEl}
    class="display-value time-value"
    title="Simulation Time"
  ></span>

  <!-- Engine mode -->
  <span
    class="display-value engine-value"
    title={engineFullName}
    data-full-name={engineFullName}
  >{engineShortName}</span>
</div>

<style>
  :global(teskooano-simulation-controls) {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    font-family: var(--font-family-base);
  }

  .controls-container {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1, 4px);
  }

  .display-container {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm, 8px);
  }

  .separator {
    width: var(--border-width-thin, 1px);
    height: 20px;
    background-color: var(--color-border-subtle);
    margin: 0 var(--space-1, 4px);
    flex-shrink: 0;
  }

  .display-value {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    min-width: 60px;
    text-align: center;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width-thin, 1px) solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-1);
    cursor: default;
    white-space: nowrap;
  }

  .display-value.time-value {
    min-width: 200px;
    color: var(--color-primary);
    cursor: pointer;
  }

  .display-value.time-value :global(.date-display:hover) {
    color: var(--color-accent);
  }

  .display-value.engine-value {
    min-width: 30px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    position: relative;
    cursor: help;
  }

  .display-value.engine-value:hover::after {
    content: attr(data-full-name);
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-surface-2);
    border: var(--border-width-thin, 1px) solid var(--color-border-subtle);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-small);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0.9;
    z-index: 10;
    font-weight: normal;
    text-transform: none;
    color: var(--color-text-secondary);
  }

  .scale-select {
    display: inline-block;
    min-width: 70px;
    cursor: pointer;
  }
</style>
