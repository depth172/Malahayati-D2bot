// test/inferFocusedWeapons.test.ts
import { describe, it, expect } from 'vitest';
import { inferFocusedWeapons } from '@domain/inferFocused';
import { getCharacter } from '@api/getCharacter';

describe('inferFocused', () => {
  it('アクティビティ一覧から武器とアクティビティのセットを抽出できる', async () => {
		const input = await getCharacter(0, [204]).then(res => res.activities?.data.availableActivities || []);
    const result = inferFocusedWeapons(input);

		console.log(result);

		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]).toHaveProperty('weaponHash');
		expect(result[0]).toHaveProperty('activityHash');
  });
});
