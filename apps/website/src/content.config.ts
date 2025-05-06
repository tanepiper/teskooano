import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { planSchema } from "./schemas/plan";
import { changelogSchema } from "./schemas/changelog";

export const collections = {
  docs: defineCollection({
    type: "content",
    schema: docsSchema(),
  }),

  plan: defineCollection({
    type: "content",

    schema: planSchema(),
  }),
  changelog: defineCollection({
    type: "content",

    schema: changelogSchema(),
  }),
};
