import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Custom schema for the 'plan' collection
import { planSchema } from "./schemas/plan";
// Loader is not needed here when using type: 'data'
// import { planLoader } from "./loaders/planLoader"; // We don't need the custom loader for type: 'data'

export const collections = {
  docs: defineCollection({
    type: "content", // Starlight handles its own loading
    schema: docsSchema(),
  }),
  // Define the new 'plan' collection as data
  plan: defineCollection({
    type: "content", // Treat .plan files as data (frontmatter + raw body)
    // Astro implicitly finds files in src/content/plan/
    schema: planSchema(), // Apply our custom frontmatter schema
  }),
};
