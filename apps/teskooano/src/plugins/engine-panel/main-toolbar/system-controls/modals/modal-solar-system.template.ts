/**
 * Template for the Solar System modal component
 */
export const SolarSystemModalTemplate = document.createElement("template");

SolarSystemModalTemplate.innerHTML = `
<style>
  .solar-system-modal-content {
    font-family: var(--font-family-base, system-ui);
    line-height: 1.5;
    color: var(--color-text-secondary, #ccccdd);
  }
  
  .system-header {
    margin-bottom: 16px;
  }
  
  .system-title {
    margin: 0 0 8px 0; 
    color: var(--color-text-primary, #eeeef5); 
    font-size: 18px;
  }
  
  .system-description {
    margin: 0; 
    font-size: 14px; 
    opacity: 0.9;
  }
  
  .warning-box {
    background: rgba(255, 0, 0, 0.1); 
    padding: 12px; 
    border-radius: 6px; 
    margin-bottom: 16px;
  }
  
  .section-title {
    margin: 0 0 8px 0; 
    color: var(--color-text-primary, #eeeef5); 
    font-size: 14px;
  }
  
  .section-content {
    margin: 0; 
    font-size: 14px; 
    opacity: 0.9;
  }
  
  .info-box {
    background: var(--color-surface-1, #1e1e2a); 
    padding: 12px; 
    border-radius: 6px; 
    margin-bottom: 16px;
  }
  
  .summary-grid {
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 8px; 
    font-size: 13px;
  }
  
  .feature-list {
    margin: 0; 
    padding-left: 16px;
    font-size: 13px; 
    line-height: 1.4;
  }
  
  .footer-info {
    margin-top: 16px; 
    font-size: 12px; 
    opacity: 0.7; 
    text-align: center;
  }
</style>

<div class="solar-system-modal-content">
  <div class="system-header">
    <h4 class="system-title">🏡 Welcome to our Solar System</h4>
    <p class="system-description">
      Our home system has been loaded with reasonably accurate astronomical data from NASA and JPL.
    </p>
  </div>

  <div class="warning-box">
    <h5 class="section-title">⚠️ Development Accuracy Warning</h5>
    <p class="section-content">
      This is a hand-crafted system, currently used for testing and eventually to have as accurate as possible.
      <br>
      During development you might find moons flying off (don't worry! it's not real), planets not looking correct, and not all features are implemented.
      <br>
      For the best experience, use the "Ideal Physics" mode.
    </p>
  </div>

  <div class="info-box" id="summary-box">
    <h5 class="section-title">📊 System Summary</h5>
    <div class="summary-grid" id="summary-grid">
      <!-- Content will be dynamically populated -->
    </div>
  </div>

  <div class="info-box">
    <h5 class="section-title">🌟 Central Star: Sun</h5>
    <div class="star-details">
      <p class="section-content">
        <strong>Type:</strong> G2V Main Sequence Star<br>
        <strong>Mass:</strong> 1.989 x 10³⁰ kg<br>
        <strong>Temperature:</strong> 5,778 K<br>
        <strong>Age:</strong> ~4.6 billion years
      </p>
    </div>
  </div>

  <div class="info-box">
    <h5 class="section-title">🪐 Notable Features</h5>
    <ul class="feature-list">
      <li>Earth - The only known planet with life</li>
      <li>Jupiter - Largest planet with 4 major moons</li>
      <li>Saturn - Famous for its prominent ring system</li>
      <li>Main Asteroid Belt - Between Mars and Jupiter</li>
      <li>Accurate orbital mechanics and real astronomical data</li>
    </ul>
  </div>

  <div class="footer-info">
    Data sourced from NASA Planetary Fact Sheet & JPL Horizons
  </div>
</div>
`;
