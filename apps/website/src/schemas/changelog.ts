import { z } from "astro/zod";
import type { SchemaContext } from "astro:content";

// Updated schema for .plan files
export function changelogSchema(_context?: SchemaContext) {
  return z.object({
    version: z.string(),
    released: z.date().optional(), // Renamed lastUpdated to released
  });
}
