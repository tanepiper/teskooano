import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { planSchema } from "./schemas/plan";
import { changelogSchema } from "./schemas/changelog";

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
  changelog: defineCollection({
    type: "content", // Treat .changelog files as data (frontmatter + raw body)
    // Astro implicitly finds files in src/content/changelog/
    schema: changelogSchema(), // Apply our custom frontmatter schema
  }),
};
