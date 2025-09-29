import { describe, it, expect } from 'vitest';
import { getXurViewData } from '@domain/adapter/xur';
import { getDefinition } from '@api/bungie/getDefinition';
import { getVendor } from '@api/bungie/getVendor';

const hasEnv =
  !!process.env.B_API_KEY &&
  !!process.env.B_MEMBERSHIP_TYPE &&
  !!process.env.B_MEMBERSHIP_ID &&
  !!process.env.B_CHARACTER_ID_HUNTER &&
  !!process.env.B_CHARACTER_ID_TITAN &&
  !!process.env.B_CHARACTER_ID_WARLOCK;

const shouldRun = hasEnv && process.env.RUN_LIVE_TESTS === '1';

describe.runIf(shouldRun)('getXurViewData (LIVE)', () => {
	it('シュールの情報が取得できる', async () => {
    const data = await getXurViewData(getDefinition, getVendor);


		expect(data.xurHash).toBeDefined();
		expect(data.offersHash).toBeDefined();
		expect(data.gearHash).toBeDefined();
		expect(data.vendorDefs).toBeDefined();
		expect(data.itemDefs).toBeDefined();
		expect(data.vendorResponses).toBeDefined();
		expect(Object.keys(data.vendorResponses)).members(['2190858386', '537912098', '3751514131']);
  });
});
