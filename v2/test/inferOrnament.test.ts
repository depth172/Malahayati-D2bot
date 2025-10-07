import { describe, it, expect } from 'vitest';
import { DestinyInventoryItemDefinition, DestinyComponentType as T } from 'type';
import { getDefinition } from '@api/bungie/getDefinition';
import { getAllDefinition } from '@api/bungie/getAllDefinition';
import { inferWeaponOrnament } from '@domain/inferOrnament';

describe('inferOrnament', async () => {
	const legendaryWeaponDefs = await getAllDefinition<DestinyInventoryItemDefinition>("InventoryItem", 
		i => {
			return i.itemType === 3 // Weapon
				&& i.inventory?.tierType === 5 // Legendary
		}
	)
	const exoticWeaponDefs = await getAllDefinition<DestinyInventoryItemDefinition>("InventoryItem",
		i => {
			return i.itemType === 3 // Weapon
				&& i.inventory?.tierType === 6 // Exotic
		}
	)

  it('エキゾチック武器装飾からエキゾチック武器を逆算', async () => {
		const ornamentHash = 2195305504; // MIDA Tactical
		const matchWeapons = await inferWeaponOrnament(ornamentHash, exoticWeaponDefs, getDefinition);

		expect(matchWeapons).toBeDefined();
		expect(Object.keys(matchWeapons).length).toBeGreaterThan(0);
		expect(matchWeapons).toContain(1331482397); // MIDA Multi-Tool
  });

	it('レジェンダリー武器装飾からレジェンダリー武器を逆算', async () => {
		const ornamentHash = 1249781195; // ザロフの秘蔵ロングボア
		const matchWeapons = await inferWeaponOrnament(ornamentHash, legendaryWeaponDefs, getDefinition);
		
		expect(matchWeapons).toBeDefined();
		expect(Object.keys(matchWeapons).length).toBeGreaterThan(0);
		expect(matchWeapons).toContain(4166221755); // トロフィーハンター
	});

	it('一つのレジェンダリー武器装飾から複数のレジェンダリー武器を逆算', async () => {
		const ornamentHash = 403561732; // Defenseless, to Be Armed
		const matchWeapons = await inferWeaponOrnament(ornamentHash, legendaryWeaponDefs, getDefinition);
		
		expect(matchWeapons).toBeDefined();
		expect(Object.keys(matchWeapons).length).toBeGreaterThan(0);
		expect(matchWeapons).toContain(174192097); // カルス・ミニツール (シーズン6版)
		expect(matchWeapons).toContain(2490988246); // カルス・ミニツール (シーズン17版)
	});	
});
