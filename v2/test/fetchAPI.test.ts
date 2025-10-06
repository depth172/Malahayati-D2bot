import { describe, it, expect } from 'vitest';
import { toXurViewData } from '@domain/adapter/xur';
import { getDefinition } from '@api/bungie/getDefinition';
import { getVendor } from '@api/bungie/getVendor';
import { getXurData } from '@domain/fetcher/xur';
import { getBansheeData } from '@domain/fetcher/banshee';
import { toBansheeViewData } from '@domain/adapter/banshee';

const hasEnv =
  !!process.env.B_API_KEY &&
  !!process.env.B_MEMBERSHIP_TYPE &&
  !!process.env.B_MEMBERSHIP_ID_SUB &&
  !!process.env.B_CHARACTER_ID_HUNTER_SUB &&
  !!process.env.B_CHARACTER_ID_TITAN_SUB &&
  !!process.env.B_CHARACTER_ID_WARLOCK_SUB;

const shouldRun = hasEnv && process.env.RUN_LIVE_TESTS === '1';

describe.runIf(shouldRun)('getBansheeData (LIVE)', () => {
	it('バンシーの情報が取得できる', async () => {
    const data = await getBansheeData(getDefinition, getVendor);
		console.dir(data, {depth: null});

		expect(data).toHaveProperty('bansheeHash');
		expect(data).toHaveProperty('focusedDecodingHash');
		expect(data).toHaveProperty('focusItems');
		expect(data).toHaveProperty('sellWeapons');
  });
});

describe.runIf(shouldRun)('toBansheeViewData (LIVE)', () => {
	it('バンシーの表示用情報が取得できる', async () => {
    const data = await getBansheeData(getDefinition, getVendor);
		const viewData = await toBansheeViewData(data, getDefinition);

		console.dir(viewData, {depth: null});
		expect(viewData).toHaveProperty('date');
		expect(viewData).toHaveProperty('focusItems');
		expect(viewData).toHaveProperty('sellWeapons');
	});
});
