import { readFileSync } from 'fs';
const lines = readFileSync('src/app/vysledky/AlgoliaSearchPageClient.tsx', 'utf-8').split('\n');
for (let i = 69; i < 160; i++) {
  const num = String(i + 1).padStart(4, '0');
  console.log(`${num}: ${lines[i]}`);
}
