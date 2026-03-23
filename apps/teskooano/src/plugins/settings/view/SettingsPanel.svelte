<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    simulationManager,
    simulationState$ as simulationStateObs,
  } from "@teskooano/core-state";
  import type { DeviceTier, SimulationMode } from "@teskooano/data-types";
  import { SimulationMode as SimMode } from "@teskooano/data-types";
  import { fromObservable } from "@core/utils/svelte-rxjs.svelte.js";

  // Import sub-components so they self-register via customElements.define()
  import "./NBodySettingsComponent";
  import "./KeplerianSettingsComponent";

  const SIMULATION_MODE_OPTIONS = [
    { value: SimMode.NBODY, label: "N-Body (Full Physics)" },
    { value: SimMode.IDEAL, label: "Ideal (Keplerian)" },
  ];

  const PERFORMANCE_PROFILE_OPTIONS = [
    { value: "low", label: "Low (Power Saving)" },
    { value: "medium", label: "Medium (Balanced)" },
    { value: "high", label: "High (Performance)" },
    { value: "cosmic", label: "Cosmic (Max Quality)" },
  ];

  const simState = fromObservable(
    simulationStateObs,
    simulationManager.getSimulationState(),
  );

  const mode = $derived(simState.value.simulationConfig?.mode ?? SimMode.NBODY);
  const trailLength = $derived(
    simState.value.visualSettings?.trailLengthMultiplier ?? 100,
  );
  const profile = $derived(simState.value.performanceProfile ?? "high");

  let sliderRef: HTMLElement | null = $state(null);
  let nbodyRef: any = $state(null);
  let keplerianRef: any = $state(null);

  let validationMsg: string = $state("");
  let validationTimeout: ReturnType<typeof setTimeout> | null = null;

  function showValidationMessage(
    message: string,
    _type: "error" | "warning" = "error",
  ) {
    validationMsg = message;
    if (validationTimeout) clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
      validationMsg = "";
    }, 5000);
  }

  function clearValidationMessages() {
    validationMsg = "";
    if (validationTimeout) {
      clearTimeout(validationTimeout);
      validationTimeout = null;
    }
  }

  // Attach slider's custom event listener
  $effect(() => {
    if (!sliderRef) return;
    const handler = (e: Event) => {
      const value = (e as CustomEvent<{ value: number }>).detail?.value;
      if (typeof value === "number" && !isNaN(value)) {
        simulationManager.setTrailLengthMultiplier(Math.max(0, value));
      }
    };
    sliderRef.addEventListener("slider:change", handler);
    return () => sliderRef?.removeEventListener("slider:change", handler);
  });

  // Initialize N-Body sub-component and keep it in sync with state
  $effect(() => {
    if (!nbodyRef) return;
    if (typeof nbodyRef.initialize === "function") {
      nbodyRef.initialize({ showValidationMessage, clearValidationMessages });
    }
    if (typeof nbodyRef.updateNBodyControls === "function") {
      nbodyRef.updateNBodyControls();
      nbodyRef.updateNBodyVisibility();
    }
  });

  // Initialize Keplerian sub-component and keep it in sync with state
  $effect(() => {
    if (!keplerianRef) return;
    if (typeof keplerianRef.initialize === "function") {
      keplerianRef.initialize({ showValidationMessage, clearValidationMessages });
    }
    if (typeof keplerianRef.updateKeplerianControls === "function") {
      keplerianRef.updateKeplerianControls();
      keplerianRef.updateKeplerianVisibility();
    }
  });

  onDestroy(() => {
    if (validationTimeout) clearTimeout(validationTimeout);
  });

  function handleModeChange(e: Event) {
    const newMode = (e.target as HTMLSelectElement).value as SimulationMode;
    try {
      simulationManager.setSimulationMode(newMode);
      clearValidationMessages();
    } catch (error) {
      showValidationMessage(
        `Failed to change mode: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  function handleProfileChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as DeviceTier;
    simulationManager.setPerformanceProfile(value);
  }
</script>

<form id="settings-form" novalidate>
  <!-- Simulation Mode Section -->
  <div class="form-section">
    <h3>
      <span>Simulation Mode</span>
      <span id="current-mode-badge" class={mode}>{mode === "ideal"
          ? "Ideal"
          : "N-Body"}</span>
    </h3>
    <div class="form-group">
      <label for="setting-simulation-mode">Physics Model</label>
      <select id="setting-simulation-mode" onchange={handleModeChange}>
        {#each SIMULATION_MODE_OPTIONS as opt}
          <option value={opt.value} selected={mode === opt.value}
            >{opt.label}</option
          >
        {/each}
      </select>
      <span class="help-text"
        >Choose between N-Body (unstable) or Ideal (stable) physics - in N-Body
        mode, you can adjust the algorithm and integrator, in Ideal mode,
        celestial bodies follow perfect orbital mechanics.</span
      >
    </div>

    <!-- N-Body Specific Controls Sub-Component -->
    <teskooano-nbody-settings bind:this={nbodyRef}
    ></teskooano-nbody-settings>

    <!-- Keplerian Specific Controls Sub-Component -->
    <teskooano-keplerian-settings bind:this={keplerianRef}
    ></teskooano-keplerian-settings>

    {#if validationMsg}
      <div class="validation-messages">{validationMsg}</div>
    {/if}
  </div>

  <!-- Visuals Section -->
  <div class="form-section">
    <h3>Visuals &amp; Performance</h3>
    <div class="form-group">
      <label for="setting-trail-length">Trail Length Multiplier</label>
      <teskooano-slider
        id="setting-trail-length"
        min="0"
        max="300"
        value={trailLength}
        step="10"
        bind:this={sliderRef}
      >
        <span slot="help-text"
          >Sets the multiplier for the length of orbital trails behind moving
          objects (the base length is 10000 points). Set to 0 to disable
          trails.</span
        >
      </teskooano-slider>
    </div>
    <div class="form-group">
      <label for="setting-performance-profile">Performance Profile</label>
      <select id="setting-performance-profile" onchange={handleProfileChange}>
        {#each PERFORMANCE_PROFILE_OPTIONS as opt}
          <option value={opt.value} selected={profile === opt.value}
            >{opt.label}</option
          >
        {/each}
      </select>
      <span class="help-text"
        >Adjusts rendering quality vs performance. Higher settings increase
        visuals but use more resources.</span
      >
    </div>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 24px);
    padding: var(--space-md, 16px);
    font-family: var(--font-family-sans, sans-serif);
    font-size: var(--font-size-sm, 14px);
    color: var(--color-text-primary, #eee);
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .form-section {
    border: 1px solid var(--color-border, #444);
    border-radius: var(--border-radius-md, 8px);
    padding: var(--space-md, 16px);
  }

  .form-section h3 {
    margin: 0 0 var(--space-md, 16px) 0;
    font-size: var(--font-size-md, 16px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-text-secondary, #ccc);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  label {
    font-weight: var(--font-weight-bold, 600);
  }

  select {
    width: 100%;
    padding: var(--space-xs, 8px);
    border-radius: var(--border-radius-sm, 4px);
    background-color: var(--color-background-input, #2a2a2a);
    color: var(--color-text-primary, #eee);
    border: 1px solid var(--color-border, #444);
  }

  #current-mode-badge {
    background-color: var(--color-primary, #337ab7);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: var(--font-size-xs, 12px);
    text-transform: uppercase;
  }

  .validation-messages {
    background-color: rgba(255, 0, 0, 0.1);
    border: 1px solid var(--color-status-danger, #f00);
    border-radius: var(--border-radius-sm, 4px);
    padding: var(--space-sm, 12px);
    color: var(--color-text-danger, #ff8a8a);
    font-size: var(--font-size-xs, 12px);
    margin-top: var(--space-sm, 8px);
  }

  .help-text {
    font-size: var(--font-size-xs, 0.8em);
    color: var(--color-text-secondary, #aaa);
    margin-top: var(--space-xxs, 2px);
  }
</style>
