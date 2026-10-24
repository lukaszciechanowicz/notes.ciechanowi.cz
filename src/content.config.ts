import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
    readingMinutes: z.number().int().positive(),
    sketch: z.enum(['firewall', 'notebook', 'camera', 'observability']).optional(),
    illustration: image().optional(),
  }),
});

const gallery = defineCollection({
  loader: glob({ base: './src/content/gallery', pattern: '*.json' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    alt: z.string(),
    description: z.string().optional(),
    image: image(),
    order: z.number(),
  }),
});

export const collections = { posts, gallery };
