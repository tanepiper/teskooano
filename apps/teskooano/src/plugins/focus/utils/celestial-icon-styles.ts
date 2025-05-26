import { CelestialType } from "@teskooano/data-types";
import { StellarType } from "@teskooano/data-types";

/**
 * Shared icon styles for celestial objects.
 * Used by both CelestialRow and other components that need to display celestial object icons.
 */
export const iconStyles: Record<string, string> = {
  // General celestial types (fallback)
  [CelestialType.STAR]: "background-color: yellow;",
  [CelestialType.PLANET]: "background-color: skyblue;",
  [CelestialType.GAS_GIANT]: "background-color: orange;",
  [CelestialType.DWARF_PLANET]: "background-color: lightblue;",
  [CelestialType.MOON]: "background-color: lightgrey;",
  [CelestialType.ASTEROID_FIELD]: "background-color: brown;",
  [CelestialType.OORT_CLOUD]: "background-color: darkgrey;",
  default: "background-color: white;",
};

/**
 * Enhanced stellar type icon styles with stronger visual effects, masking, and better contrast.
 * These provide distinctive visual representation for different stellar classifications.
 */
export const stellarIconStyles: Record<string, string> = {
  // Pre-main sequence stars - Young, forming stars with turbulent effects
  [StellarType.PROTOSTAR]: `
    background: radial-gradient(circle, #ff8c42 0%, #ff4500 30%, #8b0000 70%, #2c1810 100%);
    box-shadow: 0 0 12px #ff8c42, 0 0 20px rgba(255, 140, 66, 0.6), inset 0 0 6px #8b0000;
    border: 2px solid #ff6b35;
    mask: radial-gradient(circle at 30% 30%, transparent 20%, black 40%, black 60%, transparent 80%);
    -webkit-mask: radial-gradient(circle at 30% 30%, transparent 20%, black 40%, black 60%, transparent 80%);
    animation: protostar-pulse 2s ease-in-out infinite alternate;
    transform: scale(1.1);
  `,
  [StellarType.T_TAURI]: `
    background: radial-gradient(circle, #ffcc55 0%, #ff7700 40%, #cc4400 70%, #661100 100%);
    box-shadow: 0 0 10px #ffcc55, 0 0 16px rgba(255, 204, 85, 0.5), inset 0 0 4px #cc4400;
    border: 2px solid #ffaa44;
    mask: radial-gradient(ellipse at 40% 60%, black 30%, transparent 50%, black 70%, transparent 90%);
    -webkit-mask: radial-gradient(ellipse at 40% 60%, black 30%, transparent 50%, black 70%, transparent 90%);
    animation: variable-flicker 1.5s ease-in-out infinite alternate;
    transform: scale(1.05);
  `,
  [StellarType.HERBIG_AE_BE]: `
    background: radial-gradient(circle, #aaddff 0%, #66bbff 30%, #4488cc 60%, #224466 100%);
    box-shadow: 0 0 14px #aaddff, 0 0 22px rgba(170, 221, 255, 0.6), inset 0 0 5px #4488cc;
    border: 2px solid #88ccff;
    mask: conic-gradient(from 45deg, black 0deg, transparent 60deg, black 120deg, transparent 180deg, black 240deg, transparent 300deg, black 360deg);
    -webkit-mask: conic-gradient(from 45deg, black 0deg, transparent 60deg, black 120deg, transparent 180deg, black 240deg, transparent 300deg, black 360deg);
    animation: herbig-shimmer 3s ease-in-out infinite alternate;
    transform: scale(1.08);
  `,

  // Main sequence stars - Stable hydrogen burning with clean appearance
  [StellarType.MAIN_SEQUENCE]: `
    background: radial-gradient(circle, #ffee66 0%, #ffcc00 60%, #cc9900 90%, #996600 100%);
    box-shadow: 0 0 8px #ffee66, 0 0 14px rgba(255, 238, 102, 0.4);
    border: 2px solid #ffcc00;
    mask: radial-gradient(circle, black 60%, transparent 80%);
    -webkit-mask: radial-gradient(circle, black 60%, transparent 80%);
    transform: scale(1.0);
  `,

  // Post-main sequence evolution - Larger and more dramatic
  [StellarType.SUBGIANT]: `
    background: radial-gradient(circle, #ffdd77 0%, #ffaa33 50%, #cc7700 80%, #994400 100%);
    box-shadow: 0 0 10px #ffdd77, 0 0 18px rgba(255, 221, 119, 0.5);
    border: 2px solid #ffaa33;
    mask: radial-gradient(circle, black 70%, transparent 85%);
    -webkit-mask: radial-gradient(circle, black 70%, transparent 85%);
    transform: scale(1.1);
  `,
  [StellarType.RED_GIANT]: `
    background: radial-gradient(circle, #ff6666 0%, #ff2222 20%, #cc0000 50%, #880000 80%, #440000 100%);
    box-shadow: 0 0 16px #ff6666, 0 0 28px rgba(255, 102, 102, 0.7), 0 0 40px rgba(255, 34, 34, 0.3);
    border: 3px solid #ff4444;
    mask: radial-gradient(circle, black 50%, transparent 70%, black 80%, transparent 95%);
    -webkit-mask: radial-gradient(circle, black 50%, transparent 70%, black 80%, transparent 95%);
    transform: scale(1.3);
    animation: red-giant-pulse 4s ease-in-out infinite alternate;
  `,
  [StellarType.BLUE_GIANT]: `
    background: radial-gradient(circle, #ccddff 0%, #6699ff 30%, #3366cc 60%, #1144aa 100%);
    box-shadow: 0 0 14px #ccddff, 0 0 24px rgba(204, 221, 255, 0.6), 0 0 36px rgba(102, 153, 255, 0.3);
    border: 2px solid #6699ff;
    mask: radial-gradient(circle, black 65%, transparent 80%);
    -webkit-mask: radial-gradient(circle, black 65%, transparent 80%);
    transform: scale(1.2);
    animation: blue-giant-shimmer 3s ease-in-out infinite alternate;
  `,
  [StellarType.SUPERGIANT]: `
    background: radial-gradient(circle, #ff7777 0%, #ff3333 15%, #dd0000 40%, #aa0000 70%, #550000 100%);
    box-shadow: 0 0 20px #ff7777, 0 0 32px rgba(255, 119, 119, 0.8), 0 0 48px rgba(255, 51, 51, 0.4);
    border: 3px solid #ff3333;
    mask: radial-gradient(circle, black 40%, transparent 60%, black 75%, transparent 90%);
    -webkit-mask: radial-gradient(circle, black 40%, transparent 60%, black 75%, transparent 90%);
    transform: scale(1.4);
    animation: supergiant-pulse 4s ease-in-out infinite alternate;
  `,
  [StellarType.HYPERGIANT]: `
    background: radial-gradient(circle, #ff9999 0%, #ff5555 10%, #ff1111 25%, #cc0000 50%, #880000 75%, #440000 100%);
    box-shadow: 0 0 24px #ff9999, 0 0 40px rgba(255, 153, 153, 0.9), 0 0 60px rgba(255, 85, 85, 0.5), 0 0 80px rgba(255, 17, 17, 0.2);
    border: 4px solid #ff5555;
    mask: conic-gradient(from 0deg, black 30deg, transparent 60deg, black 90deg, transparent 120deg, black 150deg, transparent 180deg, black 210deg, transparent 240deg, black 270deg, transparent 300deg, black 330deg, transparent 360deg);
    -webkit-mask: conic-gradient(from 0deg, black 30deg, transparent 60deg, black 90deg, transparent 120deg, black 150deg, transparent 180deg, black 210deg, transparent 240deg, black 270deg, transparent 300deg, black 330deg, transparent 360deg);
    transform: scale(1.5);
    animation: hypergiant-chaos 3s ease-in-out infinite alternate;
  `,

  // Evolved/Special stellar types - Unique masking patterns
  [StellarType.WOLF_RAYET]: `
    background: radial-gradient(circle, #eeffff 0%, #88ddff 20%, #44aacc 50%, #226688 80%, #003344 100%);
    box-shadow: 0 0 16px #eeffff, 0 0 28px rgba(238, 255, 255, 0.7), 0 0 42px rgba(136, 221, 255, 0.4);
    border: 3px solid #88ddff;
    mask: radial-gradient(circle, transparent 10%, black 25%, transparent 40%, black 55%, transparent 70%, black 85%, transparent 100%);
    -webkit-mask: radial-gradient(circle, transparent 10%, black 25%, transparent 40%, black 55%, transparent 70%, black 85%, transparent 100%);
    animation: wolf-rayet-wind 2s linear infinite;
    transform: scale(1.15);
  `,
  [StellarType.CARBON_STAR]: `
    background: radial-gradient(circle, #dd5555 0%, #aa2222 40%, #771111 70%, #440000 100%);
    box-shadow: 0 0 12px #dd5555, 0 0 20px rgba(221, 85, 85, 0.6), inset 0 0 8px #771111;
    border: 2px solid #aa2222;
    mask: repeating-radial-gradient(circle, black 0px, black 2px, transparent 3px, transparent 5px);
    -webkit-mask: repeating-radial-gradient(circle, black 0px, black 2px, transparent 3px, transparent 5px);
    filter: hue-rotate(15deg) saturate(1.3);
    transform: scale(1.05);
  `,
  [StellarType.VARIABLE_STAR]: `
    background: radial-gradient(circle, #ffff88 0%, #ffdd00 40%, #ccaa00 70%, #997700 100%);
    box-shadow: 0 0 12px #ffff88, 0 0 20px rgba(255, 255, 136, 0.6);
    border: 2px solid #ffdd00;
    mask: conic-gradient(from 0deg, black 45deg, transparent 90deg, black 135deg, transparent 180deg, black 225deg, transparent 270deg, black 315deg, transparent 360deg);
    -webkit-mask: conic-gradient(from 0deg, black 45deg, transparent 90deg, black 135deg, transparent 180deg, black 225deg, transparent 270deg, black 315deg, transparent 360deg);
    animation: variable-brightness 2.5s ease-in-out infinite alternate;
    transform: scale(1.02);
  `,

  // Stellar remnants - Compact and intense with special masking
  [StellarType.WHITE_DWARF]: `
    background: radial-gradient(circle, #ffffff 0%, #ddddff 30%, #aaaacc 60%, #777799 90%, #444466 100%);
    box-shadow: 0 0 10px #ffffff, 0 0 16px rgba(255, 255, 255, 0.8), inset 0 0 6px #aaaacc;
    border: 2px solid #ddddff;
    mask: radial-gradient(circle, black 80%, transparent 95%);
    -webkit-mask: radial-gradient(circle, black 80%, transparent 95%);
    transform: scale(0.7);
    filter: brightness(1.3);
  `,
  [StellarType.NEUTRON_STAR]: `
    background: radial-gradient(circle, #ffffff 0%, #ccccff 20%, #8888cc 50%, #555588 80%, #222244 100%);
    box-shadow: 0 0 12px #ffffff, 0 0 20px rgba(255, 255, 255, 0.9), 0 0 30px rgba(204, 204, 255, 0.5);
    border: 3px solid #ccccff;
    mask: repeating-conic-gradient(from 0deg, black 0deg, black 30deg, transparent 35deg, transparent 55deg);
    -webkit-mask: repeating-conic-gradient(from 0deg, black 0deg, black 30deg, transparent 35deg, transparent 55deg);
    transform: scale(0.5);
    animation: neutron-spin 1s linear infinite;
    filter: brightness(1.4);
  `,
  [StellarType.BLACK_HOLE]: `
    background: radial-gradient(circle, #222222 0%, #000000 20%, #111111 40%, #000000 60%, transparent 80%);
    box-shadow: 0 0 16px #666666, 0 0 28px rgba(102, 102, 102, 0.8), 0 0 40px rgba(68, 68, 68, 0.4), inset 0 0 12px #000000;
    border: 3px solid #555555;
    mask: radial-gradient(circle, transparent 15%, black 30%, transparent 50%, black 70%, transparent 85%);
    -webkit-mask: radial-gradient(circle, transparent 15%, black 30%, transparent 50%, black 70%, transparent 85%);
    transform: scale(0.8);
    animation: black-hole-distortion 4s ease-in-out infinite alternate;
    filter: contrast(1.5);
  `,
};

/**
 * Enhanced CSS animations for stellar effects with more dramatic movements
 */
export const stellarAnimations = `
  @keyframes protostar-pulse {
    0% { 
      box-shadow: 0 0 12px #ff8c42, 0 0 20px rgba(255, 140, 66, 0.6), inset 0 0 6px #8b0000;
      transform: scale(1.1);
    }
    100% { 
      box-shadow: 0 0 18px #ff8c42, 0 0 30px rgba(255, 140, 66, 0.8), 0 0 42px rgba(255, 107, 53, 0.4), inset 0 0 10px #8b0000;
      transform: scale(1.15);
    }
  }

  @keyframes variable-flicker {
    0% { 
      opacity: 0.7; 
      box-shadow: 0 0 10px #ffcc55;
      transform: scale(1.05);
    }
    50% { 
      opacity: 1; 
      box-shadow: 0 0 16px #ffcc55, 0 0 24px rgba(255, 204, 85, 0.7);
      transform: scale(1.1);
    }
    100% { 
      opacity: 0.85; 
      box-shadow: 0 0 12px #ffcc55, 0 0 18px rgba(255, 204, 85, 0.5);
      transform: scale(1.07);
    }
  }

  @keyframes herbig-shimmer {
    0% { 
      box-shadow: 0 0 14px #aaddff;
      filter: brightness(1);
    }
    100% { 
      box-shadow: 0 0 20px #aaddff, 0 0 32px rgba(170, 221, 255, 0.8);
      filter: brightness(1.2);
    }
  }

  @keyframes red-giant-pulse {
    0% { 
      transform: scale(1.3); 
      box-shadow: 0 0 16px #ff6666, 0 0 28px rgba(255, 102, 102, 0.7), 0 0 40px rgba(255, 34, 34, 0.3);
    }
    100% { 
      transform: scale(1.35); 
      box-shadow: 0 0 24px #ff6666, 0 0 40px rgba(255, 102, 102, 0.9), 0 0 56px rgba(255, 34, 34, 0.5);
    }
  }

  @keyframes blue-giant-shimmer {
    0% { 
      box-shadow: 0 0 14px #ccddff, 0 0 24px rgba(204, 221, 255, 0.6);
      filter: brightness(1);
    }
    100% { 
      box-shadow: 0 0 20px #ccddff, 0 0 36px rgba(204, 221, 255, 0.8), 0 0 48px rgba(102, 153, 255, 0.4);
      filter: brightness(1.3);
    }
  }

  @keyframes supergiant-pulse {
    0% { 
      transform: scale(1.4); 
      box-shadow: 0 0 20px #ff7777, 0 0 32px rgba(255, 119, 119, 0.8), 0 0 48px rgba(255, 51, 51, 0.4);
    }
    100% { 
      transform: scale(1.45); 
      box-shadow: 0 0 28px #ff7777, 0 0 44px rgba(255, 119, 119, 1.0), 0 0 64px rgba(255, 51, 51, 0.6);
    }
  }

  @keyframes hypergiant-chaos {
    0% { 
      transform: scale(1.5) rotate(0deg); 
      filter: brightness(1) contrast(1.5);
    }
    25% { 
      transform: scale(1.55) rotate(2deg); 
      filter: brightness(1.2) contrast(1.6);
    }
    50% { 
      transform: scale(1.52) rotate(-2deg); 
      filter: brightness(0.9) contrast(1.4);
    }
    75% { 
      transform: scale(1.58) rotate(1deg); 
      filter: brightness(1.1) contrast(1.7);
    }
    100% { 
      transform: scale(1.54) rotate(-1deg); 
      filter: brightness(1) contrast(1.5);
    }
  }

  @keyframes wolf-rayet-wind {
    0% { 
      box-shadow: 0 0 16px #eeffff, 0 0 28px rgba(238, 255, 255, 0.7), 0 0 42px rgba(136, 221, 255, 0.4);
      transform: scale(1.15);
    }
    50% { 
      box-shadow: 0 0 22px #eeffff, 0 0 38px rgba(238, 255, 255, 0.9), 0 0 56px rgba(136, 221, 255, 0.6), 0 0 70px rgba(68, 170, 204, 0.3);
      transform: scale(1.18);
    }
    100% { 
      box-shadow: 0 0 16px #eeffff, 0 0 28px rgba(238, 255, 255, 0.7), 0 0 42px rgba(136, 221, 255, 0.4);
      transform: scale(1.15);
    }
  }

  @keyframes variable-brightness {
    0% { 
      opacity: 0.6; 
      transform: scale(1.02);
      filter: brightness(0.8);
    }
    50% { 
      opacity: 1; 
      transform: scale(1.08);
      filter: brightness(1.3);
    }
    100% { 
      opacity: 0.8; 
      transform: scale(1.05);
      filter: brightness(1);
    }
  }

  @keyframes neutron-spin {
    0% { 
      transform: scale(0.5) rotate(0deg);
      filter: brightness(1.4);
    }
    100% { 
      transform: scale(0.5) rotate(360deg);
      filter: brightness(1.6);
    }
  }

  @keyframes black-hole-distortion {
    0% { 
      transform: scale(0.8); 
      box-shadow: 0 0 16px #666666, 0 0 28px rgba(102, 102, 102, 0.8), 0 0 40px rgba(68, 68, 68, 0.4), inset 0 0 12px #000000;
      filter: contrast(1.5);
    }
    100% { 
      transform: scale(0.85); 
      box-shadow: 0 0 22px #666666, 0 0 38px rgba(102, 102, 102, 1.0), 0 0 54px rgba(68, 68, 68, 0.6), inset 0 0 16px #000000;
      filter: contrast(1.8);
    }
  }
`;

/**
 * Get the appropriate icon style for a stellar type
 */
export function getStellarIconStyle(stellarType: StellarType): string {
  return stellarIconStyles[stellarType] || iconStyles[CelestialType.STAR];
}

/**
 * Get the appropriate icon style for any celestial type (fallback to general types)
 */
export function getCelestialIconStyle(celestialType: CelestialType, stellarType?: StellarType): string {
  if (celestialType === CelestialType.STAR && stellarType) {
    return getStellarIconStyle(stellarType);
  }
  return iconStyles[celestialType] || iconStyles.default;
}
