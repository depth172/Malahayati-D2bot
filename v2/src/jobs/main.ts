// src/jobs/main.ts
import { inferFocusedWeapons } from '@domain/inferFocused';

async function run() {
  // ここは仮。実際は adapters でAPI呼び出し
  const visibleRewards = [
    { uiStyle: 'daily_grind_guaranteed', hash: 111 },
    { uiStyle: 'other', hash: 222 }
  ];

  const hashes = inferFocusedWeapons(visibleRewards);
  console.log('[focused weapons]', hashes);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
