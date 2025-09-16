import { describe, it, expect } from 'vitest';
import { getCharacter } from '@api/getCharacter';

const hasEnv =
  !!process.env.B_API_KEY &&
  !!process.env.B_MEMBERSHIP_TYPE &&
  !!process.env.B_MEMBERSHIP_ID &&
  !!process.env.B_CHARACTER_ID_WARLOCK;

const shouldRun = hasEnv && process.env.RUN_LIVE_TESTS === '1';

describe.runIf(shouldRun)('getCharacter (LIVE)', () => {
	it('実際の API でキャラクターデータを返す', async () => {
    const res = await getCharacter(2, [200]); // 必要最小限のコンポーネントで
    expect(res).toBeTruthy();
    expect(res.character?.data.characterId).toBe(process.env.B_CHARACTER_ID);
  });
});
