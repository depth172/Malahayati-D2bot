import { describe, it, expect } from 'vitest';
import { toXurViewData } from '@domain/adapter/xur';
import { getDefinition } from '@api/bungie/getDefinition';
import { getVendor } from '@api/bungie/getVendor';
import { getXurData } from '@domain/fetcher/xur';
import { getEververseData } from '@domain/fetcher/eververse';
import { toEververseViewData } from '@domain/adapter/eververse';
import { DestinyInventoryItemDefinition } from 'type';
import { getAllDefinition } from '@api/bungie/getAllDefinition';

const hasEnv =
  !!process.env.B_API_KEY &&
  !!process.env.B_MEMBERSHIP_TYPE &&
  !!process.env.B_MEMBERSHIP_ID_SUB &&
  !!process.env.B_CHARACTER_ID_HUNTER_SUB &&
  !!process.env.B_CHARACTER_ID_TITAN_SUB &&
  !!process.env.B_CHARACTER_ID_WARLOCK_SUB;

const shouldRun = hasEnv && process.env.RUN_LIVE_TESTS === '1';

describe.runIf(false)('getEververseData (LIVE)', () => {
	it('エバーバースの情報が取得できる', async () => {
    const data = await getEververseData(getDefinition, getVendor);
		console.dir(data, {depth: null});

		expect(data).toHaveProperty('vendorHash');
		expect(data).toHaveProperty('itemGroups');
		expect(data.itemGroups).toBeInstanceOf(Array);
		expect(data.itemGroups[0]).toHaveProperty('groupIndex');
		expect(data.itemGroups[0]).toHaveProperty('items');
		expect(data.itemGroups[0].items).toBeInstanceOf(Array);
	});
});

describe.runIf(false)('toEververseViewData (LIVE)', () => {
	it('エバーバースの表示用情報が取得できる', async () => {
    const data = await getEververseData(getDefinition, getVendor);
		const viewData = await toEververseViewData(data, getDefinition);

		console.dir(viewData, {depth: null});
		expect(viewData).toHaveProperty('date');
		expect(viewData).toHaveProperty('itemGroups');
		expect(viewData.itemGroups).toBeInstanceOf(Array);
		expect(viewData.itemGroups[0]).toHaveProperty('name');
		expect(viewData.itemGroups[0]).toHaveProperty('items');
		expect(viewData.itemGroups[0].items).toBeInstanceOf(Array);
		expect(viewData.itemGroups[0].items[0]).toHaveProperty('name');
		expect(viewData.itemGroups[0].items[0]).toHaveProperty('icon');
		expect(viewData.itemGroups[0].items[0]).toHaveProperty('background');
		expect(viewData.itemGroups[0].items[0]).toHaveProperty('type');
		expect(viewData.itemGroups[0].items[0]).toHaveProperty('costs');
	});
});

describe.runIf(shouldRun)('getDefinition', () => {
	it('DestinyInventoryItemLiteDefinitionの確認', async () => {
		const itemDefs = await getAllDefinition<DestinyInventoryItemDefinition>("InventoryItemLite", i => {
			return i.itemType === 3 // Weapon
		});

		const itemDef = itemDefs[1331482397]; // MIDA Multi-Tool

		console.dir(itemDef, {depth: null});
		expect(itemDef).toBeDefined();
	});
});