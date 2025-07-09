/**
 * @deprecated This legacy SettingsController is deprecated and will be removed in the next major version.
 * Please use EnhancedSettingsController instead, which supports the new dual-mode configuration system.
 * 
 * The legacy physics engine system has been replaced with a comprehensive dual-mode system:
 * - Ideal Mode: Perfect Keplerian orbits (stable, fast)
 * - N-Body Mode: Realistic gravitational physics with multiple algorithms and integrators
 * 
 * Migration:
 * ```typescript
 * // Old (deprecated)
 * import { SettingsController } from './SettingsController';
 * 
 * // New (recommended)
 * import { EnhancedSettingsController } from './EnhancedSettingsController';
 * import { EnhancedSettingsPanel } from '../view/EnhancedSettingsPanel';
 * ```
 * 
 * @see EnhancedSettingsController for the replacement implementation
 * @see EnhancedSettingsPanel for the corresponding UI component
 */
export class SettingsController {
  constructor() {
    console.warn(
      '⚠️  SettingsController is deprecated and will be removed in the next major version. ' +
      'Please migrate to EnhancedSettingsController which supports the new dual-mode configuration system.'
    );
    throw new Error(
      'SettingsController has been deprecated. Please use EnhancedSettingsController instead. ' +
      'See the deprecation notice above for migration instructions.'
    );
  }
}

// Legacy interface for backwards compatibility
export interface ISettingsPanelElements {
  formElement: HTMLFormElement;
  trailSliderElement: any; // TeskooanoSlider
  engineSelectElement: HTMLSelectElement;
  profileSelectElement: HTMLSelectElement;
}
