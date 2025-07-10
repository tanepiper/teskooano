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
    .pulsar-beam {
        animation: pulsar-pulse 2s ease-in-out infinite;
    }
    .pulsar-beam:nth-child(1) { animation-delay: 0s; }
    .pulsar-beam:nth-child(2) { animation-delay: 0.5s; }
    .pulsar-beam:nth-child(3) { animation-delay: 1s; }
    .pulsar-beam:nth-child(4) { animation-delay: 1.5s; }
    
    @keyframes pulsar-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.8; }
    }
    
    .black-hole-disk {
        animation: disk-rotate 4s linear infinite;
        transform-origin: 12px 12px;
    }
    
    @keyframes disk-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .black-hole-horizon {
        filter: url(#black-hole-blur);
    }
    
    .white-dwarf-core {
        filter: url(#white-dwarf-glow);
    }
    
    .protostar-shape {
        animation: protostar-pulse 3s ease-in-out infinite;
    }
    
    @keyframes protostar-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.1); }
    }
</style>
<svg viewBox="0 0 24 24">
    <defs>
        <filter id="atmosphere-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
        <filter id="black-hole-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
        </filter>
        <filter id="white-dwarf-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
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
      <!-- Special effects will be added here -->
      <!-- Planet/Star body will be added here -->
      <!-- Rings will be added here -->
    </g>
</svg>
`;

export { template };
