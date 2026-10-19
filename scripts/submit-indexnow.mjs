import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const seo = JSON.parse(readFileSync(fileURLToPath(new URL('../seo-config.json', import.meta.url)), 'utf8'));
const keyLocation = new URL(`${seo.indexNowKey}.txt`, seo.url).href;
const keyResponse = await fetch(keyLocation, { signal: AbortSignal.timeout(20000) });
if (!keyResponse.ok || (await keyResponse.text()).trim() !== seo.indexNowKey) {
  throw new Error('Deploy the matching IndexNow key file before submitting.');
}
const response = await fetch('https://www.bing.com/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(seo.url).hostname, key: seo.indexNowKey, keyLocation, urlList: [seo.url] }),
  signal: AbortSignal.timeout(20000)
});
if (![200, 202].includes(response.status)) throw new Error(`IndexNow submission failed: HTTP ${response.status} ${await response.text()}`);
console.log(`IndexNow received ${seo.url}: HTTP ${response.status}. Receipt does not guarantee indexing.`);
