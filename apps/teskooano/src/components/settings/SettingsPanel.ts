import { IContentRenderer, IDockviewPanelProps } from 'dockview-core';
// Import state and actions
import { actions, simulationState, type PhysicsEngineType } from '@teskooano/core-state';
// Import shared components to ensure they are registered
import '../shared/Card.js';
import '../shared/Form.js';
import '../shared/Slider.js'; // Import the slider
import '../shared/Select.js'; // Import Select component
import '../shared/Button.js'; // Import Button component

// Import specific component types if needed for casting later
import { TeskooanoCard } from '../shared/Card';
import { TeskooanoForm } from '../shared/Form';
import { TeskooanoSlider } from '../shared/Slider'; // Import slider type
import { TeskooanoSelect } from '../shared/Select'; // Import Select type
import { TeskooanoButton } from '../shared/Button'; // Import Button type

// Define options for the select component
const ENGINE_OPTIONS: { value: PhysicsEngineType; label: string }[] = [
  { value: 'euler', label: 'Euler Integrator' },
  { value: 'symplectic', label: 'Symplectic Euler' },
  { value: 'verlet', label: 'Verlet Integration' },
];

// Constants for the texture cache
const TEXTURE_CACHE_DB_NAME = "textureCacheDB";
const TEXTURE_CACHE_STORE_NAME = "generatedTextures";

// Interface for cache stats
interface TextureCacheStats {
  count: number;
  totalSize: number;
  humanReadableSize: string;
}

/**
 * Gets the current statistics from the texture cache database
 * @returns Promise with the cache statistics or null if error
 */
async function getTextureCacheStats(): Promise<TextureCacheStats | null> {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(TEXTURE_CACHE_DB_NAME);
      
      request.onerror = (event) => {
        console.error("[TextureCache] Error opening DB:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(TEXTURE_CACHE_STORE_NAME, "readonly");
        const store = transaction.objectStore(TEXTURE_CACHE_STORE_NAME);
        const countRequest = store.count();
        let totalSize = 0;
        let count = 0;
        
        countRequest.onsuccess = () => {
          count = countRequest.result;
          
          if (count === 0) {
            resolve({
              count: 0,
              totalSize: 0,
              humanReadableSize: "0 B"
            });
            return;
          }
          
          // Get all records to calculate size
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => {
            const records = getAllRequest.result;
            records.forEach(record => {
              if (record.colorBlob) totalSize += record.colorBlob.size || 0;
              if (record.normalBlob) totalSize += record.normalBlob.size || 0;
            });
            
            // Generate human-readable size
            const humanReadableSize = formatBytes(totalSize);
            
            resolve({
              count,
              totalSize,
              humanReadableSize
            });
          };
          
          getAllRequest.onerror = (event) => {
            console.error("[TextureCache] Error getting records:", (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        };
        
        countRequest.onerror = (event) => {
          console.error("[TextureCache] Error counting records:", (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      };
    });
  } catch (error) {
    console.error("[TextureCache] Failed to get cache stats:", error);
    return null;
  }
}

/**
 * Clears all textures from the cache database
 * @returns Promise resolving to true if successful, false if failed
 */
async function clearTextureCache(): Promise<boolean> {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(TEXTURE_CACHE_DB_NAME);
      
      request.onerror = (event) => {
        console.error("[TextureCache] Error opening DB:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(TEXTURE_CACHE_STORE_NAME, "readwrite");
        const store = transaction.objectStore(TEXTURE_CACHE_STORE_NAME);
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          resolve(true);
        };
        
        clearRequest.onerror = (event) => {
          console.error("[TextureCache] Error clearing cache:", (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      };
    });
  } catch (error) {
    console.error("[TextureCache] Failed to clear cache:", error);
    return false;
  }
}

/**
 * Formats bytes into a human-readable string
 * @param bytes The number of bytes to format
 * @returns A formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Renders the content for the settings panel within Dockview.
 */
export class SettingsPanel implements IContentRenderer {
  // The root element that Dockview provides and manages
  readonly element: HTMLElement;

  private cardElement: TeskooanoCard | null = null;
  private formElement: TeskooanoForm | null = null;
  private trailSliderElement: TeskooanoSlider | null = null;
  private engineSelectElement: TeskooanoSelect | null = null;
  private unsubscribeSimState: (() => void) | null = null;
  
  // Texture cache elements
  private cacheStatsElement: HTMLElement | null = null;
  private cacheClearButton: TeskooanoButton | null = null;
  private isCacheStatsLoading: boolean = false;

  constructor() {
    // Create the main container element for this panel's content
    this.element = document.createElement('div');
    // Add some padding and ensure it can scroll if content overflows
    this.element.style.padding = 'var(--space-md, 12px)';
    this.element.style.height = '100%';
    this.element.style.overflowY = 'auto';
    this.element.style.boxSizing = 'border-box';
  }

  /**
   * Called by Dockview to initialize the panel content.
   * @param params - Initialization parameters provided by Dockview.
   */
  init(params: IDockviewPanelProps<any>): void {
    this.element.innerHTML = ''; // Clear any existing content

    // Cast created elements to their specific types
    this.cardElement = document.createElement('teskooano-card') as TeskooanoCard;
    this.formElement = document.createElement('teskooano-form') as TeskooanoForm;

    // Add a title inside the form
    const title = document.createElement('h3');
    title.textContent = 'Application Settings';
    title.style.marginTop = '0'; // Remove default margin
    title.style.marginBottom = 'var(--space-lg, 15px)';
    title.style.color = 'var(--color-text-secondary, #aaa)';
    title.style.borderBottom = `1px solid var(--color-border-subtle, #30304a)`;
    title.style.paddingBottom = `var(--space-sm, 8px)`;

    this.formElement.appendChild(title);

    // --- Trail Length Slider --- 
    this.trailSliderElement = document.createElement('teskooano-slider') as TeskooanoSlider;
    this.trailSliderElement.id = 'setting-trail-length';
    this.trailSliderElement.setAttribute('label', 'Orbit Trail Length Multiplier');
    this.trailSliderElement.setAttribute('help-text', 'This controls the length of the orbit trail. Higher values mean longer trails.');
    this.trailSliderElement.setAttribute('min', '0');
    this.trailSliderElement.setAttribute('max', '500');
    this.trailSliderElement.setAttribute('step', '1');
    
    // Set initial value directly from (new) state, default to 30
    const currentState = simulationState.get();
    // Assuming visualSettings.trailLengthMultiplier exists after state update
    const initialMultiplier = currentState.visualSettings.trailLengthMultiplier ?? 30; 
    this.trailSliderElement.setAttribute('value', String(initialMultiplier)); // Use setAttribute for initial string value

    // Add event listener to update state directly
    this.trailSliderElement.addEventListener('input', (event) => {
        const target = event.target as TeskooanoSlider;
        const sliderValueNumber = target.value; 

        if (!isNaN(sliderValueNumber)) {
            // Dispatch the (new) action directly with the number
            // Assuming actions.setTrailLengthMultiplier exists after state update
            actions.setTrailLengthMultiplier(sliderValueNumber); 
        }
    });

    this.formElement.appendChild(this.trailSliderElement);
    // --- End Trail Length Slider --- 

    // --- Physics Engine Select --- 
    this.engineSelectElement = document.createElement('teskooano-select') as TeskooanoSelect;
    this.engineSelectElement.id = 'setting-physics-engine';
    this.engineSelectElement.setAttribute('label', 'Physics Engine');
    this.engineSelectElement.setAttribute('help-text', 'Select the physics engine to use for the simulation.');
    // Populate options
    ENGINE_OPTIONS.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        this.engineSelectElement!.appendChild(optionElement);
    });

    // Set initial value from state
    const engineState = simulationState.get();
    this.engineSelectElement.setAttribute('value', engineState.physicsEngine);

    // Add event listener to update state
    this.engineSelectElement.addEventListener('change', (event) => {
        const target = event.target as TeskooanoSelect;
        const newEngine = target.value as PhysicsEngineType; 
        // Dispatch action if the value is a valid engine type
        if (ENGINE_OPTIONS.some(opt => opt.value === newEngine)) {
             actions.setPhysicsEngine(newEngine); 
        }
    });
    this.formElement.appendChild(this.engineSelectElement);
    // --- End Physics Engine Select --- 

    // --- Texture Cache Section ---
    // Create section title
    const cacheTitle = document.createElement('h4');
    cacheTitle.textContent = 'Texture Cache';
    cacheTitle.style.marginTop = 'var(--space-lg, 15px)';
    cacheTitle.style.marginBottom = 'var(--space-md, 12px)';
    cacheTitle.style.color = 'var(--color-text-secondary, #aaa)';
    cacheTitle.style.borderBottom = `1px solid var(--color-border-subtle, #30304a)`;
    cacheTitle.style.paddingBottom = `var(--space-sm, 8px)`;
    this.formElement.appendChild(cacheTitle);

    // Create stats container
    this.cacheStatsElement = document.createElement('div');
    this.cacheStatsElement.id = 'texture-cache-stats';
    this.cacheStatsElement.style.marginBottom = 'var(--space-md, 12px)';
    this.cacheStatsElement.style.padding = 'var(--space-sm, 8px)';
    this.cacheStatsElement.style.backgroundColor = 'var(--color-background-light, #22223a)';
    this.cacheStatsElement.style.borderRadius = 'var(--border-radius-sm, 4px)';
    this.cacheStatsElement.textContent = 'Loading texture cache information...';
    this.formElement.appendChild(this.cacheStatsElement);

    // Create clear cache button
    this.cacheClearButton = document.createElement('teskooano-button') as TeskooanoButton;
    this.cacheClearButton.id = 'clear-texture-cache';
    this.cacheClearButton.textContent = 'Clear Texture Cache';
    this.cacheClearButton.setAttribute('type', 'danger');
    this.cacheClearButton.setAttribute('disabled', 'true'); // Disable until we know there's something to clear
    this.cacheClearButton.addEventListener('click', async () => {
      if (this.cacheClearButton) {
        this.cacheClearButton.setAttribute('disabled', 'true');
        this.cacheClearButton.textContent = 'Clearing...';
        
        try {
          const success = await clearTextureCache();
          if (success) {
            this.updateCacheStats();
            this.cacheClearButton!.textContent = 'Cache Cleared!';
            // Reset button after 2 seconds
            setTimeout(() => {
              if (this.cacheClearButton) {
                this.cacheClearButton.textContent = 'Clear Texture Cache';
                this.cacheClearButton.removeAttribute('disabled');
              }
            }, 2000);
          } else {
            this.cacheClearButton!.textContent = 'Failed to Clear';
            // Reset button after 2 seconds
            setTimeout(() => {
              if (this.cacheClearButton) {
                this.cacheClearButton.textContent = 'Clear Texture Cache';
                this.cacheClearButton.removeAttribute('disabled');
              }
            }, 2000);
          }
        } catch (error) {
          console.error('[SettingsPanel] Error clearing texture cache:', error);
          if (this.cacheClearButton) {
            this.cacheClearButton.textContent = 'Error Clearing Cache';
            // Reset button after 2 seconds
            setTimeout(() => {
              if (this.cacheClearButton) {
                this.cacheClearButton.textContent = 'Clear Texture Cache';
                this.cacheClearButton.removeAttribute('disabled');
              }
            }, 2000);
          }
        }
      }
    });
    this.formElement.appendChild(this.cacheClearButton);
    // --- End Texture Cache Section ---

    // Use non-null assertions as elements are assigned above
    this.cardElement.appendChild(this.formElement!);
    this.element.appendChild(this.cardElement!);

    // Subscribe to state changes to update controls
    this.unsubscribeSimState = simulationState.subscribe(this.updateControlStates);

    // Initial fetch of cache stats
    this.updateCacheStats();

    // You can access params.params here if you pass data when adding the panel
  }

  /**
   * Updates the cache statistics display
   */
  private async updateCacheStats(): Promise<void> {
    if (this.isCacheStatsLoading || !this.cacheStatsElement) return;
    
    this.isCacheStatsLoading = true;
    this.cacheStatsElement.textContent = 'Loading texture cache information...';
    
    try {
      const stats = await getTextureCacheStats();
      
      if (!this.cacheStatsElement) return; // Check again in case component was disposed
      
      if (stats) {
        this.cacheStatsElement.innerHTML = `
          <div>
            <p><strong>Cached Textures:</strong> ${stats.count}</p>
            <p><strong>Total Size:</strong> ${stats.humanReadableSize}</p>
          </div>
        `;
        
        // Enable/disable clear button based on if there's anything to clear
        if (this.cacheClearButton) {
          if (stats.count > 0) {
            this.cacheClearButton.removeAttribute('disabled');
          } else {
            this.cacheClearButton.setAttribute('disabled', 'true');
          }
        }
      } else {
        this.cacheStatsElement.textContent = 'Unable to retrieve texture cache information.';
        if (this.cacheClearButton) {
          this.cacheClearButton.setAttribute('disabled', 'true');
        }
      }
    } catch (error) {
      console.error('[SettingsPanel] Error updating cache stats:', error);
      if (this.cacheStatsElement) {
        this.cacheStatsElement.textContent = 'Error retrieving texture cache information.';
      }
      if (this.cacheClearButton) {
        this.cacheClearButton.setAttribute('disabled', 'true');
      }
    } finally {
      this.isCacheStatsLoading = false;
    }
  }

  /**
   * Updates controls based on the current simulation state.
   */
  private updateControlStates = (): void => {
    const state = simulationState.get();
    
    // Update Trail Slider
    if (this.trailSliderElement) {
        const currentMultiplier = state.visualSettings.trailLengthMultiplier ?? 30;
        if (currentMultiplier !== this.trailSliderElement.value) {
            this.trailSliderElement.value = currentMultiplier;
        }
    }

    // Update Engine Select
    if (this.engineSelectElement) {
        const currentEngine = state.physicsEngine;
        if (currentEngine !== this.engineSelectElement.value) {
            this.engineSelectElement.value = currentEngine; 
        }
    }
  };

  /**
   * Optional cleanup method called by Dockview when the panel is closed.
   */
  dispose?(): void {
    // Unsubscribe from state changes
    this.unsubscribeSimState?.();
    this.unsubscribeSimState = null;
    // Clear references
    this.cacheStatsElement = null;
    this.cacheClearButton = null;
    // Perform any cleanup here, like removing event listeners
  }

  // Other IContentRenderer methods like onFocus, onBlur, onParamsChanged
  // can be implemented here if needed later.
}
