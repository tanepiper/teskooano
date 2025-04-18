import { CelestialObject, CelestialType, PlanetProperties, RingSystemProperties } from '@teskooano/data-types';
import { FormatUtils } from '../utils/FormatUtils';
import { baseStyles } from '../utils/CelestialStyles';
import { CelestialInfoComponent } from '../utils/CelestialInfoInterface';
import { celestialObjectsStore } from '@teskooano/core-state';

// --- PLANET INFO COMPONENT ---
export class PlanetInfoComponent extends HTMLElement implements CelestialInfoComponent {
    private shadow: ShadowRoot;
    
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = `
            <style>${baseStyles}</style>
            <div id="container" class="placeholder">Loading planet data...</div>
        `;
    }
    
    updateData(celestial: CelestialObject): void {
        if (celestial.type !== CelestialType.PLANET && celestial.type !== CelestialType.DWARF_PLANET) {
            console.warn('PlanetInfoComponent received non-planet data');
            return;
        }
        
        const container = this.shadow.getElementById('container');
        if (!container) return;
        
        const planetProps = celestial.properties as PlanetProperties;
        const surface = planetProps?.surface;
        const atmosphere = planetProps?.atmosphere;
        
        const allObjects = celestialObjectsStore.get();
        const ringSystem = Object.values(allObjects).find(
            obj => obj.type === CelestialType.RING_SYSTEM && obj.parentId === celestial.id
        );
        const ringSystemProps = ringSystem?.properties as RingSystemProperties | undefined;
        
        container.innerHTML = `
            <h3>${celestial.name}</h3>
            <dl class="info-grid">
                <dt>Type:</dt><dd>${celestial.type === CelestialType.DWARF_PLANET ? 'Dwarf Planet' : 'Planet'}</dd>
                <dt>Parent:</dt><dd>${celestial.parentId ?? 'N/A'}</dd>
                <dt>Planet Type:</dt><dd>${planetProps?.planetType ?? 'N/A'}</dd>
                <dt>Mass:</dt><dd>${FormatUtils.formatExp(celestial.realMass_kg, 4)} kg</dd>
                <dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(celestial.realRadius_m)}</dd>
                <dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>
                
                ${surface ? `
                <dt>Surface:</dt><dd>${surface.type ?? 'N/A'}</dd>
                <dt>Roughness:</dt><dd>${FormatUtils.formatFix(surface.roughness, 2)}</dd>
                ` : ''}
                
                ${atmosphere ? `
                <dt>Atmosphere:</dt><dd>${atmosphere.color ?? 'N/A'}</dd>
                <dt>Pressure:</dt><dd>${FormatUtils.formatFix(atmosphere.pressure, 2)} bar</dd>
                <dt>Composition:</dt><dd>${atmosphere.composition?.join(', ') || 'N/A'}</dd>
                ` : ''}
                
                ${ringSystem ? `
                <dt>Rings:</dt><dd>Yes (${ringSystemProps?.rings?.length || 0} defined)</dd>
                ` : ''}
                
                ${celestial.orbit ? `
                <dt>Orbit Radius:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m)}</dd>
                <dt>Eccentricity:</dt><dd>${FormatUtils.formatFix(celestial.orbit.eccentricity, 4)}</dd>
                <dt>Inclination:</dt><dd>${FormatUtils.formatDegrees(celestial.orbit.inclination)}</dd>
                <dt>Period:</dt><dd>${FormatUtils.formatPeriod(celestial.orbit.period_s)}</dd>
                ` : ''}
                
                ${celestial.siderealRotationPeriod_s ? `
                <dt>Rotation Period:</dt><dd>${FormatUtils.formatPeriod(celestial.siderealRotationPeriod_s)}</dd>
                ` : ''}
                
                ${celestial.albedo ? `<dt>Albedo:</dt><dd>${FormatUtils.formatFix(celestial.albedo, 2)}</dd>` : ''}
            </dl>
        `;
    }
}

// Define the custom element
customElements.define('planet-info', PlanetInfoComponent); 