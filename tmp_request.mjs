import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';
if (!appId || !apiKey) {
  console.error('missing env', appId, apiKey);
  process.exit(1);
}
const url = `https://${appId}-dsn.algolia.net/1/indexes/ads/query`;
const headers = {
  'X-Algolia-API-Key': apiKey,
  'X-Algolia-Application-Id': appId,
  'Content-Type': 'application/json',
};
const payload = { params: 'query=&hitsPerPage=1' };
const res = await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify(payload),
});
console.log('status', res.status);
console.log(await res.text());
