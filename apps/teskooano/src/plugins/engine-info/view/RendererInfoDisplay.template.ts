import { sharedTemplate } from "./shared-template.js";

const template = document.createElement("template");

// Clone the shared template and add the specific content
template.innerHTML =
  sharedTemplate.innerHTML +
  `
  <div class="info-container">
    <!-- Device Performance Section (moved to top) -->
    <div id="device-performance">
      <div class="section">
        <h4>Device Performance Monitoring</h4>
        <div class="loading">Loading device data...</div>
      </div>
    </div>
    
    <!-- Renderer Stats Section -->
    <div class="info-grid">
      <span class="label">Cam Pos:</span>
      <span class="value" id="cam-pos-value">-</span>

      <span class="label">FOV:</span>
      <span class="value" id="fov-value">-</span>
    </div>
    
    <!-- WebGL Capabilities Section -->
    <div id="webgl-capabilities">
      <div class="section">
        <h4>WebGL Capabilities</h4>
        <div class="loading">Loading capabilities...</div>
      </div>
    </div>
    
    <!-- Performance Optimization Section -->
    <div id="performance-optimization">
      <div class="section">
        <h4>Active Performance Optimizations</h4>
        <div class="loading">Loading optimizations...</div>
      </div>
    </div>
  </div>
`;

export { template };
