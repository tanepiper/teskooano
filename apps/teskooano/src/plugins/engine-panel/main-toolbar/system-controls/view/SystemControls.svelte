<script lang="ts">
  import {
    StateAccessor,
    celestialObjects$,
    currentSeed$,
    seed as seedStore,
  } from "@teskooano/core-state";
  import type { CelestialObject } from "@teskooano/data-types";
  import type { PluginExecutionContext } from "@teskooano/ui-plugin";
  import Button from "@core/components/button/Button.svelte";

  import RocketRegular from "@fluentui/svg-icons/icons/rocket_20_regular.svg?raw";
  import SparkleRegular from "@fluentui/svg-icons/icons/sparkle_20_regular.svg?raw";
  import DocumentAddRegular from "@fluentui/svg-icons/icons/document_add_20_regular.svg?raw";
  import WeatherSunnyRegular from "@fluentui/svg-icons/icons/weather_sunny_20_regular.svg?raw";
  import ArrowDownloadRegular from "@fluentui/svg-icons/icons/arrow_download_20_regular.svg?raw";
  import CopyRegular from "@fluentui/svg-icons/icons/copy_20_regular.svg?raw";
  import ArrowUploadRegular from "@fluentui/svg-icons/icons/arrow_upload_20_regular.svg?raw";
  import DeleteRegular from "@fluentui/svg-icons/icons/delete_20_regular.svg?raw";

  interface Props {
    context: PluginExecutionContext;
  }

  let { context }: Props = $props();

  // --- Reactive state ---
  let objects = $state<Record<string, CelestialObject>>(
    StateAccessor.getCelestialObjects(),
  );
  let currentSeed = $state(StateAccessor.getCurrentSeed());
  let isGenerating = $state(false);
  let seedInputValue = $state("");

  $effect(() => {
    const sub1 = celestialObjects$.subscribe((objs) => {
      objects = objs as Record<string, CelestialObject>;
    });
    const sub2 = currentSeed$.subscribe((s) => {
      currentSeed = s as string;
      if (!seedInputValue) seedInputValue = s as string ?? "";
    });
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  });

  const isLoaded = $derived(Object.keys(objects).length > 0);
  const celestialCount = $derived(Object.keys(objects).length);

  // --- Feedback state (per button key) ---
  type FeedbackEntry = { symbol: string; isError: boolean };
  let feedback = $state<Record<string, FeedbackEntry | null>>({});
  const feedbackTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  function showFeedback(
    key: string,
    symbol: string,
    isError = false,
    duration = 1500,
  ) {
    if (feedbackTimers[key]) clearTimeout(feedbackTimers[key]);
    feedback[key] = { symbol, isError };
    feedbackTimers[key] = setTimeout(() => {
      feedback[key] = null;
    }, duration);
  }

  // --- Actions ---
  async function handleGenerate() {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute(
        "system:generate_random",
        { seed: seedInputValue || undefined },
      );
      const ok = result?.success === true;
      showFeedback("generate", ok ? "✨" : "❌", !ok, ok ? 1500 : 2000);
    } catch (err: any) {
      showFeedback("generate", "❌", true, 2000);
      console.error("[SystemControls] Generate error:", err);
    } finally {
      isGenerating = false;
    }
  }

  async function handleRandom() {
    if (isGenerating) return;
    seedInputValue = "";
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute(
        "system:generate_random",
        {},
      );
      const ok = result?.success === true;
      if (ok && result?.seed) seedInputValue = result.seed;
      showFeedback("random", ok ? "✨" : "❌", !ok);
    } catch (err: any) {
      showFeedback("random", "❌", true, 2000);
    } finally {
      isGenerating = false;
    }
  }

  async function handleCreateBlank() {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute(
        "system:createBlank",
      );
      const ok = result?.success !== false;
      showFeedback("createBlank", ok ? "✅" : "❌", !ok);
    } catch {
      showFeedback("createBlank", "❌", true, 2000);
    } finally {
      isGenerating = false;
    }
  }

  async function handleLoadSolarSystem() {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute(
        "system:load_solar_system",
      );
      const ok = result?.success !== false;
      showFeedback("loadSolar", ok ? "☀️" : "❌", !ok);
    } catch {
      showFeedback("loadSolar", "❌", true, 2000);
    } finally {
      isGenerating = false;
    }
  }

  async function handleCopySeed() {
    try {
      await navigator.clipboard.writeText(currentSeed ?? "");
      showFeedback("copySeed", "📋");
    } catch {
      showFeedback("copySeed", "❌", true, 2000);
    }
  }

  async function handleExport() {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute("system:export");
      const ok = result?.success !== false;
      showFeedback("export", ok ? "💾" : "❌", !ok);
    } catch {
      showFeedback("export", "❌", true, 2000);
    } finally {
      isGenerating = false;
    }
  }

  async function handleImport() {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute(
        "system:trigger_import_dialog",
      );
      const cancelled = result?.message === "File selection cancelled.";
      if (cancelled) {
        showFeedback("import", "🤷", false, 1000);
      } else if (result?.success) {
        showFeedback("import", "✅", false, 1500);
      } else {
        showFeedback("import", "❌", true, 1500);
      }
    } catch {
      showFeedback("import", "❌", true, 2000);
    } finally {
      isGenerating = false;
    }
  }

  async function handleClear() {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const result: any = await context.pluginManager.execute("system:clear");
      const ok = result?.success !== false;
      showFeedback("clear", ok ? "🗑️" : "❌", !ok);
    } catch {
      showFeedback("clear", "❌", true, 2000);
    } finally {
      isGenerating = false;
    }
  }

  function handleSeedInput(e: Event) {
    seedInputValue = (e.target as HTMLInputElement).value;
    seedStore.updateSeed(seedInputValue);
  }
</script>

<div class="system-controls-container">
  <!-- Empty state: no system loaded -->
  {#if !isLoaded}
    <div class="state state--empty">
      <form
        class="seed-form"
        onsubmit={(e) => { e.preventDefault(); handleGenerate(); }}
      >
        <input
          type="text"
          id="seed"
          name="seed"
          placeholder="Enter seed..."
          value={seedInputValue}
          oninput={handleSeedInput}
          disabled={isGenerating}
          aria-label="System seed"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          title="Generate System"
          tooltipText="Generate a star system with this seed."
          tooltipTitle="Generate"
          iconSvg={feedback["generate"]?.symbol ? undefined : RocketRegular}
          disabled={isGenerating}
          onclick={handleGenerate}
        >
          {#if feedback["generate"]}
            {feedback["generate"].symbol}
          {/if}
        </Button>
      </form>

      <div class="actions">
        <Button
          variant="ghost"
          size="sm"
          title="Random System"
          tooltipText="Generate a system with a random seed."
          tooltipTitle="Random"
          iconSvg={feedback["random"]?.symbol ? undefined : SparkleRegular}
          disabled={isGenerating}
          onclick={handleRandom}
        >
          {#if feedback["random"]}
            {feedback["random"].symbol}
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Create Blank System"
          tooltipText="Create an empty star system canvas."
          tooltipTitle="Create Blank"
          iconSvg={feedback["createBlank"]?.symbol ? undefined : DocumentAddRegular}
          disabled={isGenerating}
          onclick={handleCreateBlank}
        >
          {#if feedback["createBlank"]}
            {feedback["createBlank"].symbol}
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Load Solar System"
          tooltipText="Load the Solar System."
          tooltipTitle="Solar System"
          iconSvg={feedback["loadSolar"]?.symbol ? undefined : WeatherSunnyRegular}
          disabled={isGenerating}
          onclick={handleLoadSolarSystem}
        >
          {#if feedback["loadSolar"]}
            {feedback["loadSolar"].symbol}
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Import System"
          tooltipText="Import a star system from a file."
          tooltipTitle="Import"
          iconSvg={feedback["import"]?.symbol ? undefined : ArrowUploadRegular}
          disabled={isGenerating}
          onclick={handleImport}
        >
          {#if feedback["import"]}
            {feedback["import"].symbol}
          {/if}
        </Button>
      </div>
    </div>
  {:else}
    <!-- Loaded state: system active -->
    <div class="state state--loaded">
      <div class="system-info">
        <span
          class="system-seed"
          title="Seed: {currentSeed}"
        >{currentSeed || "—"}</span>
        <span class="celestial-count">{celestialCount} Celestial{celestialCount !== 1 ? "s" : ""}</span>
      </div>

      <div class="actions">
        <Button
          variant="ghost"
          size="sm"
          title="Copy Seed"
          tooltipText="Copy the current seed to clipboard."
          tooltipTitle="Copy Seed"
          iconSvg={feedback["copySeed"]?.symbol ? undefined : CopyRegular}
          onclick={handleCopySeed}
        >
          {#if feedback["copySeed"]}
            {feedback["copySeed"].symbol}
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Export System"
          tooltipText="Save the current star system to a file."
          tooltipTitle="Export"
          disabled={isGenerating}
          iconSvg={feedback["export"]?.symbol ? undefined : ArrowDownloadRegular}
          onclick={handleExport}
        >
          {#if feedback["export"]}
            {feedback["export"].symbol}
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Import System"
          tooltipText="Load a star system from a file."
          tooltipTitle="Import"
          disabled={isGenerating}
          iconSvg={feedback["import"]?.symbol ? undefined : ArrowUploadRegular}
          onclick={handleImport}
        >
          {#if feedback["import"]}
            {feedback["import"].symbol}
          {/if}
        </Button>
        <Button
          variant="primary"
          size="sm"
          title="Clear System"
          tooltipText="Remove all celestial objects."
          tooltipTitle="Clear"
          disabled={isGenerating}
          iconSvg={feedback["clear"]?.symbol ? undefined : DeleteRegular}
          onclick={handleClear}
        >
          {#if feedback["clear"]}
            {feedback["clear"].symbol}
          {/if}
        </Button>
      </div>
    </div>
  {/if}

  <!-- Loading overlay -->
  {#if isGenerating}
    <div class="loading-overlay" aria-busy="true" aria-label="Generating...">
      <span class="loading-spinner">✦</span>
    </div>
  {/if}
</div>

<style>
  :global(teskooano-system-controls) {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-family-base, sans-serif);
    height: 100%;
    min-width: 240px;
    position: relative;
  }

  .system-controls-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 var(--space-2, 8px);
    height: 100%;
    position: relative;
  }

  .state {
    display: flex;
    flex-grow: 1;
    align-items: center;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  .state--empty {
    justify-content: flex-start;
  }

  .state--loaded {
    justify-content: space-between;
  }

  .actions {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--space-1, 4px);
  }

  .seed-form {
    display: flex;
    gap: var(--space-2, 8px);
    align-items: center;
    flex-grow: 1;
    min-width: 150px;
    max-width: 250px;
  }

  .seed-form input[type="text"] {
    flex-grow: 1;
    height: 30px;
    min-width: 80px;
    padding: var(--space-1, 4px) var(--space-2, 8px);
    border: var(--border-width-thin, 1px) solid var(--color-border-subtle, #4a4a6a);
    border-radius: var(--radius-md, 4px);
    background-color: var(--color-surface-1, #1a1a2e);
    color: var(--color-text-primary, #e0e0fc);
    font-size: var(--font-size-small, 0.85rem);
    font-family: var(--font-family-base);
  }

  .seed-form input[type="text"]:focus {
    outline: none;
    border-color: var(--color-border-focus, var(--color-primary));
  }

  .system-info {
    display: flex;
    gap: var(--space-md, 12px);
    align-items: center;
    min-width: 120px;
    flex-shrink: 0;
  }

  .system-seed {
    color: var(--color-text-secondary, #a0a0cc);
    font-family: var(--font-family-mono, monospace);
    font-size: var(--font-size-small, 0.85rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    background-color: var(--color-surface-1, #1a1a2e);
    padding: 2px 6px;
    border-radius: var(--radius-sm, 2px);
    border: 1px solid var(--color-border-subtle, #4a4a6a);
  }

  .celestial-count {
    color: var(--color-text-secondary, #a0a0cc);
    font-size: var(--font-size-small, 0.85rem);
    white-space: nowrap;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(26, 26, 46, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: var(--radius-sm, 2px);
  }

  .loading-spinner {
    color: var(--color-primary, #6c63ff);
    font-size: 1.2rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
