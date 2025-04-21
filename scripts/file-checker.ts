import * as fs from "fs";
import * as path from "path";
import type { CelestialObject } from "@teskooano/data-types"; // Assuming this type is available

interface OrbitalParams {
  realSemiMajorAxis_m?: number; // Match potential real data name
  semiMajorAxis_m?: number; // Keep original name for flexibility
  eccentricity: number;
  inclination: number; // in radians
  meanAnomaly: number;
  period_s: number;
}

enum AccuracyLevel {
  VERY_STRICT,
  SOMEWHAT_STRICT,
  LOOSE,
  NONE,
}

function analyzeOrbit(
  params: Partial<OrbitalParams>, // Use Partial as structure might vary slightly
  bodyId: string,
  accuracyLevel: AccuracyLevel,
): void {
  const G = 6.6743e-11; // Gravitational constant
  const M = 1.989e30; // Assumed central body mass (Sun in kg) - MAKE CONFIGURABLE?

  // Determine which semi-major axis property is available
  const semiMajorAxis = params.realSemiMajorAxis_m ?? params.semiMajorAxis_m;

  if (semiMajorAxis === undefined || params.period_s === undefined) {
    // console.warn(`[${bodyId}] Missing semiMajorAxis or period_s in orbit data. Skipping period check.`);
    // Don't warn by default, too noisy? Only warn if accuracy is high?
    if (accuracyLevel !== AccuracyLevel.NONE) {
      console.warn(
        `[${bodyId}] Missing semiMajorAxis or period_s in orbit data. Skipping period check.`,
      );
    }
    // Cannot perform period check without these values
  } else {
    // Calculate expected period based on semi-major axis (Kepler's Third Law)
    const expectedPeriod = Math.sqrt(
      (4 * Math.PI * Math.PI * semiMajorAxis ** 3) / (G * M),
    );

    const periodDifference = Math.abs(params.period_s - expectedPeriod);
    const periodDifferencePercentage =
      (periodDifference / params.period_s) * 100;

    let accuracyThreshold: number;

    switch (accuracyLevel) {
      case AccuracyLevel.VERY_STRICT:
        accuracyThreshold = 1; // Max 1% difference
        break;
      case AccuracyLevel.SOMEWHAT_STRICT:
        accuracyThreshold = 5; // Max 5% difference
        break;
      case AccuracyLevel.LOOSE:
        accuracyThreshold = 10; // Max 10% difference
        break;
      case AccuracyLevel.NONE:
      default: // Ensure default case
        accuracyThreshold = Infinity; // No check
        break;
    }

    if (periodDifferencePercentage > accuracyThreshold) {
      console.warn(
        `[${bodyId}] Period mismatch: Calculated ${expectedPeriod.toFixed(2)}s, Provided ${params.period_s}s (${periodDifferencePercentage.toFixed(2)}% difference).`,
      );
    }
  }

  // Check for high eccentricity
  if (params.eccentricity !== undefined && params.eccentricity > 0.8) {
    console.warn(
      `[${bodyId}] High eccentricity: ${params.eccentricity.toFixed(4)}. Orbit may be unstable or require careful handling.`,
    );
  }

  // Inclination check - flag if significantly different from zero (relative to ecliptic assumed)
  if (params.inclination !== undefined && Math.abs(params.inclination) > 0.5) {
    // Increased threshold
    console.warn(
      `[${bodyId}] High inclination relative to assumed plane: ${params.inclination.toFixed(4)} radians`,
    );
  }
}

/** Represents the expected structure of the input JSON file. */
interface SystemData {
  seed?: string; // Keep track of the seed if present
  objects: Partial<CelestialObject>[]; // Use partial as objects might not be complete
}

/**
 * Validates the orbital parameters of objects within a system data structure.
 * @param systemData The parsed system data from the JSON file.
 * @param accuracyLevel The desired level of accuracy checking.
 */
function validateSystem(
  systemData: SystemData,
  accuracyLevel: AccuracyLevel,
): void {
  console.log(
    `Validating system ${systemData.seed ? 'with seed "' + systemData.seed + '"' : ""} (${systemData.objects.length} objects) using accuracy: ${AccuracyLevel[accuracyLevel]}`,
  );
  let warningCount = 0;
  for (const obj of systemData.objects) {
    // Check if the object has an ID and orbit data
    if (obj.id && obj.orbit) {
      // Call analyzeOrbit, passing the orbit object which should match OrbitalParams
      // We cast obj.orbit because TS might not know it matches OrbitalParams exactly,
      // but analyzeOrbit handles partial data.
      const initialWarnCount = console.warn.length; // Primitive way to count calls
      analyzeOrbit(obj.orbit as Partial<OrbitalParams>, obj.id, accuracyLevel);
      if (console.warn.length > initialWarnCount) {
        warningCount++;
      }
    } else if (obj.id && !obj.orbit && obj.type !== "STAR") {
      // Optionally warn about non-star objects missing orbit data
      // console.log(`[${obj.id}] Type: ${obj.type || 'Unknown'} - No orbit data found.`);
    } else if (!obj.id) {
      console.warn("Found object without an ID.");
      warningCount++;
    }
  }
  console.log(
    `Validation complete. ${warningCount} objects triggered warnings.`,
  );
}

// --- Script Execution ---

/** Prints usage instructions and exits. */
function printUsage(): void {
  console.error(
    "Usage: npx tsx scripts/file-checker.ts <path/to/your/system.json> [accuracyLevel]",
  );
  console.error(
    "  accuracyLevel (optional): VERY_STRICT, SOMEWHAT_STRICT, LOOSE, NONE (default: SOMEWHAT_STRICT)",
  );
  process.exit(1);
}

// Get file path from command line arguments
const filePathArg = process.argv[2];
if (!filePathArg) {
  console.error("Error: JSON file path argument is missing.");
  printUsage();
}

const filePath = path.resolve(filePathArg);

// Determine accuracy level
const accuracyArg = process.argv[3]?.toUpperCase();
let accuracyLevel: AccuracyLevel = AccuracyLevel.SOMEWHAT_STRICT; // Default

if (accuracyArg) {
  if (accuracyArg in AccuracyLevel) {
    accuracyLevel = AccuracyLevel[accuracyArg as keyof typeof AccuracyLevel];
  } else {
    console.error(`Error: Invalid accuracy level "${process.argv[3]}".`);
    printUsage();
  }
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at "${filePath}"`);
  process.exit(1);
}

// Read and parse the JSON file
let systemData: SystemData;
try {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  systemData = JSON.parse(fileContent) as SystemData;
  // Basic validation of parsed structure
  if (!systemData || !Array.isArray(systemData.objects)) {
    throw new Error(
      "Invalid JSON structure: Expected root object with an 'objects' array.",
    );
  }
} catch (error) {
  console.error(`Error reading or parsing JSON file "${filePath}":`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// Run the validation
validateSystem(systemData, accuracyLevel);
