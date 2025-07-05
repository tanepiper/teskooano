const template = document.createElement("template");
template.innerHTML = `
<style>
    :host {
        display: inline-block;
        width: 1em;
        height: 1em;
        position: relative;
    }
    svg {
        width: 100%;
        height: 100%;
        overflow: visible;
    }
    .atmosphere {
        stroke-width: 2;
        fill: none;
        filter: url(#atmosphere-blur);
    }
    .planet-base {
        stroke: none;
    }
    .rings {
        fill: none;
        stroke-width: 2;
    }
    .comet-tail {
        fill-opacity: 0.8;
        stroke: none;
        filter: url(#atmosphere-blur);
    }
</style>
<svg viewBox="0 0 24 24">
    <defs>
        <filter id="atmosphere-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
        <linearGradient id="procedural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <!-- Stops will be added here by the component -->
        </linearGradient>
        <radialGradient id="planet-gradient">
            <stop offset="0%" stop-color="var(--gradient-start, white)" />
            <stop offset="100%" stop-color="var(--gradient-end, black)" />
        </radialGradient>
    </defs>
    <g class="icon-layers">
      <!-- Atmosphere will be added here -->
      <!-- Comet Tail will be added here -->
      <!-- Planet/Star body will be added here -->
      <!-- Rings will be added here -->
    </g>
</svg>
`;

export { template };
