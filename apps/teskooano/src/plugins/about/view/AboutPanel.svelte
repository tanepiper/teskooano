<script lang="ts">
  import type { PanelInitParameters } from "dockview-core";

  let { options }: { options?: PanelInitParameters } = $props();

  const version = import.meta.env.PACKAGE_VERSION || "N/A";
  const commitHash = import.meta.env.GIT_COMMIT_HASH || "N/A";
  const buildTimestamp = import.meta.env.BUILD_TIMESTAMP
    ? new Date(import.meta.env.BUILD_TIMESTAMP).toLocaleString()
    : "N/A";
</script>

<div class="about-panel-container" data-testid="about-panel" id={options?.params?.id || "about-panel"}>
  <teskooano-card variant="fluid">
    <span slot="title">🔭 Teskooano</span>
    <p>
      Teskooano: An ambitious N-Body simulation engine with real physics and
      orbital mechanics.
    </p>
    <p>App Version: {version} - {commitHash}</p>
    <p>Deployed: {buildTimestamp}</p>
    <p>
      Developed by: <a href="https://tane.dev" target="_blank" rel="noopener noreferrer">Tane Piper</a><br />
      Powered by: ThreeJS, Dockview, RxJS, and more!
    </p>
  </teskooano-card>
</div>

<style>
  .about-panel-container {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
  }

  a {
    color: var(--color-primary, #7c7cff);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
