import { z } from "astro/zod";
import type { SchemaContext } from "astro:content";

// Updated schema for .plan files
export function planSchema(_context?: SchemaContext) {
  return z.object({
    plan: z.string().regex(/^\d+$/),
    title: z.string(),
    author: z.string().optional(),
    released: z.date().optional(), // Renamed lastUpdated to released
  });
}
