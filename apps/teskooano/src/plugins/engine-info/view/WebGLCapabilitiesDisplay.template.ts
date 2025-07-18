import { sharedTemplate } from "./shared-template.js";

const template = document.createElement("template");

// Clone the shared template and add the specific content
template.innerHTML =
  sharedTemplate.innerHTML +
  `
  <div class="info-container">
    <!-- WebGL Capabilities Section -->
    <div id="webgl-capabilities" class="section">
      <h4>WebGL Capabilities</h4>
      <div class="loading">Loading capabilities...</div>
    </div>
    
    <!-- Performance Optimization Section -->
    <div id="performance-optimization" class="section">
      <h4>Active Performance Optimizations</h4>
      <div class="loading">Loading optimizations...</div>
    </div>
    
    <!-- Device Performance Section -->
    <div id="device-performance" class="section">
      <h4>Device Performance Monitoring</h4>
      <div class="loading">Loading device data...</div>
    </div>
  </div>
`;

export { template };
