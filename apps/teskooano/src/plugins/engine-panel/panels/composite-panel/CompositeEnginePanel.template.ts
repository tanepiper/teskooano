export const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    .engine-container {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    #engine-placeholder-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--background-color-rgb, rgba(27, 27, 27, 0.95));
      color: var(--text-color-rgb, #ddd);
      z-index: 200; /* Above engine, below toolbar */
    }

    .placeholder-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      text-align: center;
      padding: 1em;
      box-sizing: border-box;
      /* background-color: inherit; */ /* Inherit host background */
      z-index: 10; /* Ensure it's above the engine container if they overlap */
    }

    .dynamic-grid-background {
      background-color: #0d0d0d;
      background-image: linear-gradient(rgba(50, 100, 150, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(50, 100, 150, 0.08) 1px, transparent 1px);
      background-size: 35px 35px, 35px 35px;
      animation: move-grid 20s linear infinite;
      position: relative;
      overflow: hidden;
    }

    .dynamic-grid-background::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 150%;
      padding-top: 150%;
      transform: translate(-50%, -50%);
      background: radial-gradient(
        circle at center,
        rgba(40, 80, 120, 0.5) 0%,
        transparent 55%
      );
      animation: pulse-glow 6s ease-in-out infinite;
      z-index: -1;
    }

    .placeholder-wrapper.hidden {
      display: none;
    }

    #placeholder-message {
      color: var(--text-color-secondary, #aaa);
      margin: 0 0 1em 0;
    }

    #placeholder-action-area progress {
      width: 100%; /* Make progress bar take full width of its container */
    }

    #placeholder-action-area a {
      display: inline-block;
      padding: 8px 15px;
      background-color: var(--button-primary-background-color, #333);
      color: var(--button-primary-text-color, #fff);
      text-decoration: none;
      border-radius: var(--button-border-radius, 4px);
    }
    #placeholder-action-area a:hover {
      background-color: var(--button-primary-hover-background-color, #555);
    }
    
    @keyframes move-grid {
      from {
        background-position: 0 0, 0 0;
      }
      to {
        background-position: 35px 35px, 35px 35px;
      }
    }

    @keyframes pulse-glow {
      0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0.6;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0.6;
      }
    }

    .placeholder-icon {
      max-width: 256px;
      max-height: 256px;
      margin-bottom: 1em;
      opacity: 0.7;
      border-radius: 16px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 15px rgba(40, 80, 120, 0.6),
        inset 0 0 5px rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease-in-out;
    }

    .placeholder-icon:hover {
      transform: scale(1.05);
      opacity: 0.9;
      box-shadow: 0 0 25px rgba(60, 120, 180, 0.8),
        inset 0 0 8px rgba(255, 255, 255, 0.2);
    }

    .hidden {
      display: none !important;
    }
  </style>
  <div class="engine-container" id="engine-container"></div>
  <teskooano-engine-toolbar></teskooano-engine-toolbar>
  <div id="engine-placeholder-wrapper">
    <img
      src="/assets/panel-icon.png"
      alt="Engine Placeholder Icon"
      class="placeholder-icon"
    />
    <p id="placeholder-message">No system loaded</p>
    <div id="placeholder-action-area"></div>
  </div>
`;
