import { hubble } from "./hubble";
import { iss } from "./iss";
import { noaa19 } from "./noaa19";
import { ses1 } from "./ses1";
import { terra } from "./terra";

/**
 * Earth-orbiting satellites that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const earthOrbitingSatellites = [iss, hubble, noaa19, ses1, terra];

/**
 * All satellites that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const allSatellites = [...earthOrbitingSatellites];
