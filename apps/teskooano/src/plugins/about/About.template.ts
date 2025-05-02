const template = document.createElement("template");
template.innerHTML = `
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

    /* Add styles for cards if needed, e.g., max-width for fluid cards */
    teskooano-card[variant="fluid"] {
        max-width: 600px; /* Example constraint */
        width: 100%; /* Ensure fluid cards take available width */
    }

  </style>
  <div class="about-panel-container" part="container">
    
    <teskooano-card variant="fluid">
      <span slot="title">🔭 Teskooano</span>
      <p>
        Teskooano: An ambitious N-Body simulation engine with real physics 
        and orbital mechanics.
      </p>
      <p>
        App Version: <span id="app-version">loading...</span> - <span id="git-commit-hash">loading...</span>
      </p>
      <p>
        Developed by: <a href="https://tane.dev">Tane Piper</a><br>
        Powered by: ThreeJS, Dockview, RxJS, and more!<br>
        
      </p>
    </teskooano-card>
  </div>
`;

export { template };
