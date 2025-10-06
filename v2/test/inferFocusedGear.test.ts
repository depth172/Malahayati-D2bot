// test/inferFocusedGear.test.ts
import { describe, it, expect } from 'vitest';
import { groupFocusedSets, inferFocusedGear, mergeFocusedSets } from '@domain/inferFocused';
import { getCharacter } from '@api/bungie/getCharacter';
import { DestinyComponentType as T } from 'type';
import { getDefinition } from '@api/bungie/getDefinition';

describe('inferFocused', () => {
  it('アクティビティ一覧から武器とアクティビティのセットを抽出できる', async () => {
		const inputs = await Promise.all([
			getCharacter("main", 0, [T.CharacterActivities]), // Hunter
			getCharacter("main", 1, [T.CharacterActivities]), // Titan
			getCharacter("main", 2, [T.CharacterActivities]), // Warlock
		]);

    const results = inputs.map(input => {
			const activities = Object.values(input.activities?.data.availableActivities || {});
			return inferFocusedGear(activities);
		});

		const mergedResult = mergeFocusedSets(results);

		const result = await groupFocusedSets(mergedResult, getDefinition);

		console.log(result);

		expect(result).toBeDefined();
		expect(Object.keys(result).length).toBeGreaterThan(0);
		expect(Object.keys(result.other).length).toBe(0);
  });
});
