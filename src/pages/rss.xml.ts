import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('posts')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));

  return rss({
    title: 'Here be clouds.',
    description: 'My notes on figuring things out — somewhere between enterprise clouds, automation, and small things built to find out what happens.',
    site: site!,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: '/notes/' + post.id + '/',
    })),
    customData: '<language>en</language>',
  });
};
