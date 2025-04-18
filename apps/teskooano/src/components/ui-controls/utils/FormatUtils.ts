// Constants for formatters
const AU_IN_METERS = 149597870700;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_YEAR = SECONDS_PER_DAY * 365.25;

// Shared formatter utility class
export class FormatUtils {
    static formatExp(val: number | undefined | null, digits = 3): string {
        return val != null && Number.isFinite(val) ? val.toExponential(digits) : 'N/A';
    }
    
    static formatFix(val: number | undefined | null, digits = 1): string {
        return val != null && Number.isFinite(val) ? val.toFixed(digits) : 'N/A';
    }
    
    static formatDistanceKm(meters: number | undefined | null, digits = 0): string {
        return meters != null && Number.isFinite(meters) ? (meters / 1000).toFixed(digits) + ' km' : 'N/A';
    }

    static formatDistanceAU(meters: number | undefined | null, digits = 3): string {
        return meters != null && Number.isFinite(meters) ? (meters / AU_IN_METERS).toFixed(digits) + ' AU' : 'N/A';
    }

    static formatDegrees(radians: number | undefined | null, digits = 1): string {
        return radians != null && Number.isFinite(radians) ? (radians * 180 / Math.PI).toFixed(digits) + '°' : 'N/A';
    }

    static formatPeriod(seconds: number | undefined | null): string {
        if (seconds == null || !Number.isFinite(seconds)) return 'N/A';
        if (seconds > SECONDS_PER_YEAR * 1.5) { // Use years for long periods
            return (seconds / SECONDS_PER_YEAR).toFixed(2) + ' yrs';
        } else if (seconds > SECONDS_PER_DAY * 1.5) { // Use days 
             return (seconds / SECONDS_PER_DAY).toFixed(1) + ' days';
        } else { // Use seconds for short periods
            return seconds.toFixed(0) + ' s';
        }
    }
    
    // Function to map star color hex codes to descriptive names
    static getStarColorName(hexColor: string | undefined | null): string {
        if (!hexColor) return 'Unknown';
        
        // Map of star colors to descriptive names based on spectral classes
        const colorMap: Record<string, string> = {
            // O-type stars (blue)
            '#9bb0ff': 'Blue',
            '#a2b5ff': 'Blue',
            '#aabfff': 'Blue',
            
            // B-type stars (blue-white)
            '#cad7ff': 'Blue-White',
            '#cadfff': 'Blue-White',
            '#f6f3ff': 'Blue-White',
            
            // A-type stars (white)
            '#f8f7ff': 'White',
            '#ffffff': 'White',
            
            // F-type stars (yellow-white)
            '#fff4ea': 'Yellow-White',
            '#fffcdf': 'Yellow-White',
            
            // G-type stars (yellow)
            '#ffff9d': 'Yellow',
            '#fffadc': 'Yellow',
            
            // K-type stars (orange)
            '#ffd2a1': 'Orange',
            '#ffcc6f': 'Orange',
            
            // M-type stars (red)
            '#ffb56c': 'Red-Orange',
            '#ff9b6c': 'Red',
            '#ff8080': 'Red'
        };
        
        // Try exact match first
        const lowerHex = hexColor.toLowerCase();
        if (lowerHex in colorMap) {
            return colorMap[lowerHex];
        }
        
        // If no exact match, use a simple approximation based on color code
        if (hexColor.startsWith('#ff')) {
            if (hexColor.includes('8') || hexColor.includes('9')) {
                return 'Reddish';
            } else {
                return 'Yellowish';
            }
        } else if (hexColor.startsWith('#ca') || hexColor.startsWith('#9b') || hexColor.startsWith('#a')) {
            return 'Bluish';
        } else if (hexColor.startsWith('#ff')) {
            return 'Yellowish';
        }
        
        return 'Unknown';
    }
} 