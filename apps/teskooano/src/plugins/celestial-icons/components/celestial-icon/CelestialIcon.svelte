<script lang="ts">
  import type { CelestialIconConfig } from "../../types.js";

  interface Props {
    config: CelestialIconConfig | null;
  }

  let { config }: Props = $props();

  // Unique suffix per instance to avoid SVG ID collisions when multiple
  // <celestial-icon> elements are rendered on the same page.
  const uid = Math.random().toString(36).slice(2, 8);

  const ids = {
    atmosphereBlur: `atmosphere-blur-${uid}`,
    blackHoleBlur: `black-hole-blur-${uid}`,
    whiteDwarfGlow: `white-dwarf-glow-${uid}`,
    proceduralGradient: `procedural-gradient-${uid}`,
    planetGradient: `planet-gradient-${uid}`,
  };

  // --- Derived state ---

  const layersTransform = $derived.by(() => {
    if (!config?.atmosphere) return undefined;
    const visualRadius = 11 + config.atmosphere.size / 2;
    const scale = 11.5 / visualRadius;
    const translate = 12 - 12 * scale;
    return `translate(${translate}, ${translate}) scale(${scale})`;
  });

  const proceduralStops = $derived.by(() => {
    if (!config?.procedural) return [];
    const p = config.procedural;
    return [
      { color: p.color1, offset: p.height1 },
      { color: p.color2, offset: p.height2 },
      { color: p.color3, offset: p.height3 },
      { color: p.color4, offset: p.height4 },
      { color: p.color5, offset: p.height5 },
    ]
      .map((s) => ({ ...s, offset: Math.max(0, Math.min(1, s.offset)) }))
      .sort((a, b) => a.offset - b.offset);
  });

  const gradientStart = $derived(config?.base?.gradient?.[0] ?? "white");
  const gradientEnd = $derived(config?.base?.gradient?.[1] ?? "black");

  const bodyFill = $derived.by(() => {
    if (!config) return "transparent";
    if (config.procedural) return `url(#${ids.proceduralGradient})`;
    if (config.base.gradient) return `url(#${ids.planetGradient})`;
    return config.base.color;
  });

  const bodyRadius = $derived.by(() => {
    if (!config) return 8;
    if (config.base.type === "star") return 6;
    return config.base.radius ?? 8;
  });

  const atmosphereRadius = $derived(
    config?.base?.type === "star" ? 6 : 11,
  );

  const atmosphereStrokeWidth = $derived.by(() => {
    if (!config?.atmosphere) return 0;
    return config.base.type === "star"
      ? Math.max(1, config.atmosphere.size * 0.7)
      : config.atmosphere.size;
  });

  const cometTailD = $derived.by(() => {
    if (!config?.tail) return "";
    const len = config.tail.length || 10;
    return `M 12,12 L ${12 + len},${12 - 2.5} L ${12 + len},${12 + 2.5} Z`;
  });

  // Starburst spikes — 6 evenly-spaced radial lines, only for stars
  const starburstSpikes = $derived.by(() => {
    if (!config || config.base.type !== "star" || config.special === "black-hole")
      return [] as { x2: number; y2: number; color: string }[];
    const color = config.base.gradient?.[0] ?? config.base.color;
    const numSpikes = 6;
    const length = 12;
    const center = 12;
    return Array.from({ length: numSpikes }, (_, i) => {
      const rad = ((i * 360) / numSpikes) * (Math.PI / 180);
      return {
        x2: center + length * Math.cos(rad),
        y2: center + length * Math.sin(rad),
        color,
      };
    });
  });

  // Pulsar beam rotations (4 beams, 90° apart)
  const pulsarBeams = [0, 90, 180, 270];
</script>

<svg viewBox="0 0 24 24" style="width:100%;height:100%;overflow:visible;">
  <defs>
    <filter id={ids.atmosphereBlur} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
    </filter>
    <filter id={ids.blackHoleBlur} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
    </filter>
    <filter id={ids.whiteDwarfGlow} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
    </filter>

    <linearGradient id={ids.proceduralGradient} x1="0%" y1="0%" x2="100%" y2="100%">
      {#each proceduralStops as stop}
        <stop offset="{stop.offset * 100}%" stop-color={stop.color} />
      {/each}
    </linearGradient>

    <radialGradient id={ids.planetGradient}>
      <stop offset="0%" stop-color={gradientStart} />
      <stop offset="100%" stop-color={gradientEnd} />
    </radialGradient>
  </defs>

  <g class="icon-layers" transform={layersTransform}>
    <!-- 1. Atmosphere (bottom layer) -->
    {#if config?.atmosphere}
      <circle
        class="atmosphere"
        cx="12"
        cy="12"
        r={atmosphereRadius}
        stroke={config.atmosphere.color}
        stroke-width={atmosphereStrokeWidth}
        fill="none"
        filter="url(#{ids.atmosphereBlur})"
      />
    {/if}

    <!-- 2. Comet tail -->
    {#if config?.tail}
      <path
        class="comet-tail"
        d={cometTailD}
        fill={config.tail.color}
        fill-opacity="0.8"
        filter="url(#{ids.atmosphereBlur})"
        transform="rotate({config.tail.angle} 12 12)"
      />
    {/if}

    <!-- 3. Special effects for exotic stars -->
    {#if config?.special === "pulsar"}
      {#each pulsarBeams as rotation, i}
        <line
          class="pulsar-beam"
          x1="12" y1="12" x2="12" y2="2"
          stroke="#FFFFFF"
          stroke-width="1"
          opacity="0.8"
          transform="rotate({rotation} 12 12)"
          style="animation-delay: {i * 0.5}s"
        />
      {/each}
    {:else if config?.special === "black-hole"}
      <ellipse
        class="black-hole-disk"
        cx="12" cy="12" rx="10" ry="3"
        fill="none"
        stroke="#FF6B6B"
        stroke-width="1"
        opacity="0.6"
      />
      <circle
        class="black-hole-horizon"
        cx="12" cy="12" r="2"
        fill="#000000"
        stroke="#333333"
        stroke-width="0.5"
        filter="url(#{ids.blackHoleBlur})"
      />
    {:else if config?.special === "white-dwarf"}
      <circle
        class="white-dwarf-core"
        cx="12" cy="12" r="2"
        fill="#FFFFFF"
        opacity="0.9"
        filter="url(#{ids.whiteDwarfGlow})"
      />
    {:else if config?.special === "protostar"}
      <path
        class="protostar-shape"
        d="M 12,8 Q 14,10 12,12 Q 10,14 12,16 Q 14,14 12,12 Q 14,10 12,8"
        fill="#FF8A4A"
        opacity="0.8"
      />
    {/if}

    <!-- 3.5 Starburst for all stars (except black holes) -->
    {#each starburstSpikes as spike}
      <line
        class="starburst-spike"
        x1="12" y1="12"
        x2={spike.x2} y2={spike.y2}
        stroke={spike.color}
        stroke-width="1.2"
        opacity="0.7"
        stroke-linecap="round"
      />
    {/each}

    <!-- 5. Back ring (behind the body) -->
    {#if config?.rings}
      <ellipse
        class="rings back-ring"
        cx="12" cy="12" rx="10" ry="4"
        fill="none"
        stroke={config.rings.color}
        stroke-width="3"
        opacity="0.8"
        transform="rotate({config.rings.angle} 12 12)"
      />
    {/if}

    <!-- 4. Base body (satellite or circular) -->
    {#if config?.base.type === "satellite"}
      <!-- Satellite body -->
      <rect x="9" y="9" width="6" height="6" fill="#C0C0C0" stroke="#808080" stroke-width="0.5" />
      <!-- Left solar panel -->
      <rect x="4" y="10.5" width="4" height="3" fill="#1E3A8A" stroke="#1E40AF" stroke-width="0.5" />
      <!-- Right solar panel -->
      <rect x="16" y="10.5" width="4" height="3" fill="#1E3A8A" stroke="#1E40AF" stroke-width="0.5" />
      <!-- Solar panel grid lines (left) -->
      {#each [1, 2] as i}
        <line
          x1={4 + i * 1.2} y1="10.5"
          x2={4 + i * 1.2} y2="13.5"
          stroke="#3B82F6" stroke-width="0.3" opacity="0.7"
        />
      {/each}
      <!-- Solar panel grid lines (right) -->
      {#each [1, 2] as i}
        <line
          x1={16 + i * 1.2} y1="10.5"
          x2={16 + i * 1.2} y2="13.5"
          stroke="#3B82F6" stroke-width="0.3" opacity="0.7"
        />
      {/each}
      <!-- Antenna -->
      <line x1="12" y1="9" x2="12" y2="6" stroke="#FFD700" stroke-width="1" stroke-linecap="round" />
      <!-- Antenna dish -->
      <circle cx="12" cy="6" r="1" fill="none" stroke="#FFD700" stroke-width="0.8" />
      <!-- Body details / sensors -->
      <circle cx="10.5" cy="10.5" r="0.5" fill="#4ADE80" opacity="0.8" />
      <circle cx="13.5" cy="13.5" r="0.5" fill="#EF4444" opacity="0.8" />
    {:else if config}
      <!-- Planet / star circular body -->
      <circle
        class="planet-base"
        cx="12" cy="12"
        r={bodyRadius}
        fill={bodyFill}
      />
    {/if}

    <!-- 6. Front ring highlight (top arc, for 3D effect) -->
    {#if config?.rings}
      <path
        class="rings front-arc"
        d="M 4,10 A 10,4 0 0 1 20,10"
        fill="none"
        stroke={config.rings.color}
        stroke-width="2"
        opacity="0.9"
        transform="rotate({config.rings.angle} 12 12)"
      />
    {/if}
  </g>
</svg>

<style>
  .atmosphere {
    stroke-width: 2;
    fill: none;
    filter: var(--atmosphere-filter);
  }

  .comet-tail {
    fill-opacity: 0.8;
    stroke: none;
  }

  .pulsar-beam {
    animation: pulsar-pulse 2s ease-in-out infinite;
  }
  .pulsar-beam:nth-child(1) { animation-delay: 0s; }
  .pulsar-beam:nth-child(2) { animation-delay: 0.5s; }
  .pulsar-beam:nth-child(3) { animation-delay: 1s; }
  .pulsar-beam:nth-child(4) { animation-delay: 1.5s; }

  :global {
    @keyframes pulsar-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
  }

  .black-hole-disk {
    animation: disk-rotate 4s linear infinite;
    transform-origin: 12px 12px;
  }

  :global {
    @keyframes disk-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  }

  .protostar-shape {
    animation: protostar-pulse 3s ease-in-out infinite;
  }

  :global {
    @keyframes protostar-pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.1); }
    }
  }

  .starburst-spike {
    filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px currentColor);
    pointer-events: none;
  }

  .planet-base {
    stroke: none;
  }

  .rings {
    fill: none;
    stroke-width: 2;
  }
</style>
