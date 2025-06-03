// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  'posts': postsCollection,
};