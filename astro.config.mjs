import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://notes.ciechanowi.cz',
  output: 'static',
  trailingSlash: 'always',
  markdown: { syntaxHighlight: false },
});
