import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log('CONSOLE ERROR:', msg.text());
  }
});
page.on('request', (request) => {
  const url = request.url();
  if (url.includes('algolia.net')) {
    console.log('ALGOLIA REQ', url);
    if (request.postData()) {
      console.log('  payload', request.postData());
    }
  }
});
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('algolia.net')) {
    console.log('ALGOLIA RES', url, response.status());
    try {
      const body = await response.text();
      console.log('  body starts with', body.slice(0, 120));
    } catch (error) {
      console.log('  response body error', error);
    }
  }
});
await page.goto('http://localhost:3000/vysledky', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
console.log('articles', await page.locator('article').count());
console.log('stats text', await page.locator('text= vozidiel').textContent());
await browser.close();
