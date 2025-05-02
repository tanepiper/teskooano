import { z } from "astro/zod";
import type { SchemaContext } from "astro:content";

export function planSchema(_context?: SchemaContext) {
  return z.object({
    plan: z.string().regex(/^\d+$/),
    title: z.string(),
    author: z.string().optional(),
    released: z.date().optional(),
  });
}
