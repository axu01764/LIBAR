import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist/assets', { recursive: true });
mkdirSync('dist/images', { recursive: true });
copyFileSync('index.html', 'dist/index.html');
copyFileSync('favicon.png', 'dist/favicon.png');
for (const file of ['site.css', 'pos.css', 'utilities.css', 'site.js', 'pos.js', 'content.js', 'countdown.js']) {
  copyFileSync(`assets/${file}`, `dist/assets/${file}`);
}
cpSync('assets/vendor', 'dist/assets/vendor', { recursive: true });
// Keep existing recipe image URLs working; omit the uncompressed hero master.
cpSync('images', 'dist/images', { recursive: true, filter: (source) => !source.endsWith('resurrection-hero.png') });
console.log('Static website exported to dist/.');
