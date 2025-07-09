const template = document.createElement("template");
template.innerHTML = `
  <style>
    /* Enhanced Settings Panel with Mode-Based Configuration */
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg, 15px);
    }

    .settings-title {
      margin-top: 0;
      margin-bottom: 0;
      color: var(--color-text-secondary, #aaa);
      border-bottom: 1px solid var(--color-border-subtle, #30304a);
      padding-bottom: var(--space-sm, 8px);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 4px);
    }

    .form-group label {
      font-weight: bold;
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-xs, 4px);
    }

    .form-group small {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      line-height: 1.4;
    }

    .info-icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--color-accent, #60a5fa);
      color: white;
      text-align: center;
      line-height: 16px;
      font-size: 12px;
      cursor: help;
      position: relative;
    }

    .info-icon::before {
      content: "i";
      font-style: normal;
      font-weight: bold;
    }

    /* Tooltip for info icons */
    .info-icon[title]:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-background-tooltip, #1a1a2e);
      color: var(--color-text-tooltip, #fff);
      padding: var(--space-sm, 8px);
      border-radius: var(--border-radius-md, 6px);
      font-size: var(--font-size-sm, 14px);
      white-space: nowrap;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    /* Enhanced select styling */
    select.teskooano-select {
      padding: var(--space-sm, 8px) var(--space-md, 12px);
      background-color: var(--color-background-input, #1e1e30);
      color: var(--color-text-input, #e0e0ff);
      border: 1px solid var(--color-border-input, #30304a);
      border-radius: var(--border-radius-md, 6px);
      font-family: inherit;
      font-size: inherit;
      cursor: pointer;
      appearance: none;
      background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23e0e0ff%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E');
      background-repeat: no-repeat;
      background-position: right var(--space-md, 12px) center;
      background-size: 1em;
      padding-right: calc(var(--space-md, 12px) * 2 + 1em);
      transition: all 0.2s ease;
    }

    select.teskooano-select:focus {
      outline: 2px solid var(--color-focus-ring, #60a5fa);
      outline-offset: 2px;
      border-color: var(--color-focus-ring, #60a5fa);
      background-color: var(--color-background-input-focus, #252540);
    }

    select.teskooano-select:hover {
      border-color: var(--color-border-input-hover, #4a4a6a);
    }

    /* Mode-specific sections */
    .physics-section {
      border: 1px solid var(--color-border-subtle, #30304a);
      border-radius: var(--border-radius-lg, 8px);
      padding: var(--space-md, 12px);
      background-color: var(--color-background-section, rgba(30, 30, 48, 0.5));
    }

    .physics-section-title {
      margin: 0 0 var(--space-md, 12px) 0;
      color: var(--color-text-primary);
      font-size: var(--font-size-lg, 18px);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--space-sm, 8px);
    }

    /* Mode indicator badges */
    .mode-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--border-radius-sm, 4px);
      font-size: var(--font-size-xs, 12px);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mode-badge.ideal {
      background-color: var(--color-success, #10b981);
      color: white;
    }

    .mode-badge.nbody {
      background-color: var(--color-accent, #60a5fa);
      color: white;
    }

    /* N-Body specific controls container */
    .nbody-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md, 12px);
      margin-top: var(--space-md, 12px);
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .nbody-controls.visible {
      opacity: 1;
      max-height: 200px;
    }

    @media (max-width: 768px) {
      .nbody-controls {
        grid-template-columns: 1fr;
      }
    }

    /* Performance indicator */
    .performance-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-xs, 4px);
      margin-top: var(--space-xs, 4px);
    }

    .performance-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-success, #10b981);
    }

    .performance-dot.warning {
      background-color: var(--color-warning, #f59e0b);
    }

    .performance-dot.error {
      background-color: var(--color-error, #ef4444);
    }

    .performance-text {
      font-size: var(--font-size-sm, 14px);
      color: var(--color-text-secondary);
    }

    /* Configuration display */
    .config-display {
      background-color: var(--color-background-code, #16213e);
      border: 1px solid var(--color-border-subtle, #30304a);
      border-radius: var(--border-radius-md, 6px);
      padding: var(--space-sm, 8px);
      font-family: var(--font-family-mono, 'Monaco', 'Menlo', monospace);
      font-size: var(--font-size-sm, 14px);
      color: var(--color-text-code, #e2e8f0);
      margin-top: var(--space-xs, 4px);
    }

    /* Animation classes */
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    .fade-out {
      animation: fadeOut 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }

    /* Error/Warning states */
    .form-group.error select {
      border-color: var(--color-error, #ef4444);
      background-color: var(--color-background-error, rgba(239, 68, 68, 0.1));
    }

    .form-group.warning select {
      border-color: var(--color-warning, #f59e0b);
      background-color: var(--color-background-warning, rgba(245, 158, 11, 0.1));
    }

    .error-message {
      color: var(--color-error, #ef4444);
      font-size: var(--font-size-sm, 14px);
      margin-top: var(--space-xs, 4px);
    }

    .warning-message {
      color: var(--color-warning, #f59e0b);
      font-size: var(--font-size-sm, 14px);
      margin-top: var(--space-xs, 4px);
    }
  </style>

  <form id="enhanced-settings-form" class="settings-form">
    <h3 class="settings-title">Physics & Performance Settings</h3>

    <!-- Trail Length Control (unchanged) -->
    <div class="form-group">
      <label for="setting-trail-length">
        Orbit Trail Length Multiplier
        <span class="info-icon" title="Controls the length of orbital trails. Higher values show longer historical paths."></span>
      </label>
      <teskooano-slider id="setting-trail-length" min="0" max="500" step="1"></teskooano-slider>
      <small>Adjust the visual length of orbital trails behind moving objects.</small>
    </div>

    <!-- Enhanced Physics Configuration Section -->
    <div class="physics-section">
      <h4 class="physics-section-title">
        Physics Configuration
        <span id="current-mode-badge" class="mode-badge ideal">Ideal</span>
      </h4>

      <!-- Simulation Mode Selector -->
      <div class="form-group">
        <label for="setting-simulation-mode">
          Simulation Mode
          <span class="info-icon" title="Ideal: Perfect Keplerian orbits (fastest, stable). N-Body: Real gravitational interactions (accurate, slower)."></span>
        </label>
        <select id="setting-simulation-mode" class="teskooano-select">
          <option value="ideal">Ideal Orrery (Keplerian Orbits)</option>
          <option value="nbody">N-Body Physics (Gravitational Simulation)</option>
        </select>
        <small>Choose between stable orbital mechanics or realistic gravitational physics.</small>
        <div id="mode-performance" class="performance-indicator">
          <span class="performance-dot"></span>
          <span class="performance-text">Optimal performance</span>
        </div>
      </div>

      <!-- N-Body Specific Controls (conditionally visible) -->
      <div id="nbody-controls" class="nbody-controls">
        <div class="form-group">
          <label for="setting-algorithm">
            Force Algorithm
            <span class="info-icon" title="Direct: O(N²) exact but slow. Barnes-Hut: O(N log N) balanced. FMM: O(N) fastest for large systems."></span>
          </label>
          <select id="setting-algorithm" class="teskooano-select">
            <option value="direct">Direct (Exact, O(N²))</option>
            <option value="barnes-hut">Barnes-Hut (Tree, O(N log N))</option>
            <option value="fmm">Fast Multipole (FMM, O(N))</option>
            <option value="p3m">Particle-Mesh (P3M, O(N log N))</option>
          </select>
          <small>Algorithm for calculating gravitational forces.</small>
        </div>

        <div class="form-group">
          <label for="setting-integrator">
            Time Integrator
            <span class="info-icon" title="Euler: Simple, fast. Symplectic: Energy conserving. Verlet: Stable, popular. RK4: High accuracy. Adaptive: Auto time-step."></span>
          </label>
          <select id="setting-integrator" class="teskooano-select">
            <option value="euler">Euler (1st order)</option>
            <option value="symplectic">Symplectic Euler (Energy conserving)</option>
            <option value="verlet">Velocity Verlet (2nd order)</option>
            <option value="rk4">Runge-Kutta 4 (4th order)</option>
            <option value="adaptive">Adaptive (Variable step)</option>
          </select>
          <small>Method for advancing positions and velocities over time.</small>
        </div>
      </div>

      <!-- Current Configuration Display -->
      <div class="form-group">
        <label>Current Configuration</label>
        <div id="config-display" class="config-display">
          Mode: Ideal Orrery | Performance: Optimal
        </div>
      </div>
    </div>

    <!-- Performance Profile (unchanged) -->
    <div class="form-group">
      <label for="setting-performance-profile">
        Performance Profile
        <span class="info-icon" title="Adjusts rendering quality vs performance. Higher settings increase visual fidelity but use more GPU resources."></span>
      </label>
      <select id="setting-performance-profile" class="teskooano-select">
        <!-- Options populated dynamically -->
      </select>
      <small>Balance between visual quality and rendering performance.</small>
    </div>

    <!-- Validation Messages -->
    <div id="validation-messages" style="display: none;">
      <!-- Error/warning messages will be inserted here -->
    </div>
  </form>
`;

export { template };