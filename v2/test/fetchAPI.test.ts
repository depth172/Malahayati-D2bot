import { describe, it, expect } from 'vitest';
import { toXurViewData } from '@domain/adapter/xur';
import { getDefinition } from '@api/bungie/getDefinition';
import { getVendor } from '@api/bungie/getVendor';
import { getXurData } from '@domain/fetcher/xur';

const hasEnv =
  !!process.env.B_API_KEY &&
  !!process.env.B_MEMBERSHIP_TYPE &&
  !!process.env.B_MEMBERSHIP_ID &&
  !!process.env.B_CHARACTER_ID_HUNTER &&
  !!process.env.B_CHARACTER_ID_TITAN &&
  !!process.env.B_CHARACTER_ID_WARLOCK;

const shouldRun = hasEnv && process.env.RUN_LIVE_TESTS === '1';

describe.runIf(shouldRun)('getXurData (LIVE)', () => {
	it('シュールの情報が取得できる', async () => {
    const data = await getXurData(getDefinition, getVendor);
		console.dir(data, {depth: null});

		expect(data).toHaveProperty('xurItems');
  });
});

describe.runIf(shouldRun)('getXurViewData (LIVE)', () => {
	it('シュールの表示用情報が取得できる', async () => {
    const data = await getXurData(getDefinition, getVendor);
		const viewData = await toXurViewData(data, getDefinition);
		
		console.dir(viewData, {depth: null});
		expect(viewData).toHaveProperty('xurItems');
	});
});

// describe.runIf(shouldRun)('getPortalViewData (LIVE)', () => {
// 	it('シュールの情報が取得できる', async () => {
// 		const inputs = await Promise.all([
// 			getCharacter(0, [T.CharacterActivities]),
// 			getCharacter(1, [T.CharacterActivities]),
// 			getCharacter(2, [T.CharacterActivities]),
// 		]);

// 		const results = inputs.map(input => {
// 			const activities = Object.values(input.activities?.data.availableActivities || {});
// 			return inferFocusedGear(activities);
// 		});

// 		const merged = mergeFocusedSets(results);
// 		const grouped = await groupFocusedSets(merged, getDefinition);

// 		console.dir(grouped, {depth: null});

//   });
// });
