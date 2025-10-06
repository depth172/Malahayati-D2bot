import buildCosts from "@domain/buildCostData";
import { BansheeSellWeaponData, BansheeFocusItemData } from "@domain/fetcher/banshee";
import { isKillTrackerSocket, isWeaponPerkSocketCategory } from "@domain/typeCheck";
import { DestinyDamageTypeDefinition, DestinyInventoryItemDefinition, DestinyPlugSetDefinition, DestinyVendorDefinition } from "type";
import { DisplayableVendorRandomRollWeapon, DisplayableWeapon, GearRandomRollWeapon } from "typeOriginal";

export type BansheeSellWeaponViewData = {
	date: string;
	background: string;
	sellWeapons: DisplayableVendorRandomRollWeapon[];
}

export type BansheeFocusItemViewData = {
	date: string;
	background: string;
	weaponGroups: {
		name: string;
		index: number;
		background: string;
		weapons: DisplayableWeapon[];
	}[];
}

export const toBansheeSellWeaponViewData = async (
	bansheeData: BansheeSellWeaponData,
	getDef: <T>(type: "Vendor" | "InventoryItem" | "DamageType" | "PlugSet", hash: number) => Promise<T>,
) => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};
	const damageTypeDefs: Record<number, DestinyDamageTypeDefinition> = {};

	const itemHashes = new Set<number>();

	// 日付生成
	const date = new Date();

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	let dateStr;
	const startDateStr = `${year}/${month}/${day}`;

	// 次の火曜日を計算
	const nextTuesday = new Date(date);
	const daysUntilTuesday = (2 - date.getDay() + 7) % 7;

	if (daysUntilTuesday === 0) {
		dateStr = startDateStr;
	} else {
		nextTuesday.setDate(date.getDate() + daysUntilTuesday);

		const endYear = nextTuesday.getFullYear();
		const endMonth = String(nextTuesday.getMonth() + 1).padStart(2, '0');
		const endDay = String(nextTuesday.getDate()).padStart(2, '0');
		const endDateStr = `${endYear}/${endMonth}/${endDay}`;

		dateStr = `${startDateStr} ～ ${endDateStr}`;
	}

	// ベンダー定義の取得
	const vendorDef = await getDef<DestinyVendorDefinition>("Vendor", bansheeData.vendorHash);

	// ## バンシー（週刊武器）に関する定義の収集 ##

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	const sellWeapons = bansheeData.sellWeapons;
	sellWeapons.forEach(w => {
		itemHashes.add(w.hash);
		w.costs.forEach(c => itemHashes.add(c.hash));
		if (w.frameHash) itemHashes.add(w.frameHash);
		if (w.masterworkHash) itemHashes.add(w.masterworkHash);
		Object.values(w.perks).flat().forEach(ph => itemHashes.add(ph));
	});

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## 追加取得が必要な定義 ##

	// 武器のDamageTypeの定義
	const damageTypeHashes = new Set<number>();

	Object.values(sellWeapons).forEach(w => {
		const itemDef = itemDefs[w.hash];
		if (!itemDef) return;

		const dmgTypeHash = itemDef.defaultDamageTypeHash;
		if (dmgTypeHash) damageTypeHashes.add(dmgTypeHash);
	});

	await Promise.all(Array.from(damageTypeHashes).map(async (h) => {
		if (damageTypeDefs[h]) return; // 既に取得済みの場合はスキップ
		damageTypeDefs[h] = await getDef<DestinyDamageTypeDefinition>("DamageType", h);
	}));

	// ## 表示用データに整形 ##

	const displaySellWeapons: DisplayableVendorRandomRollWeapon[] = [];

	const putRandomRollWeapon = async (i: GearRandomRollWeapon) => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);

		const costs = buildCosts(i.costs, itemDefs);

		const perkSocketsArray = itemDef.sockets.socketCategories.find(sc => isWeaponPerkSocketCategory(sc.socketCategoryHash))?.socketIndexes;
		if (!perkSocketsArray) throw new Error(`Perk sockets not found for item hash: ${i.hash}`);

		const filteredIndexes = perkSocketsArray.filter(index => !isKillTrackerSocket(itemDef.sockets.socketEntries[index].socketTypeHash));
		const perkSockets = new Set(filteredIndexes);

		const randomPerks = await Promise.all(Array.from(perkSockets)?.map(async index => {
			const perkHashes = i.perks[index];
			if (!perkHashes) {
				const plugDef = await getDef<DestinyPlugSetDefinition>("PlugSet", itemDef.sockets.socketEntries[index].reusablePlugSetHash ?? 0);
				if (!plugDef) throw new Error(`PlugSet definition not found for hash: ${itemDef.sockets.socketEntries[index].reusablePlugSetHash}`);
				const perkList = plugDef.reusablePlugItems.map(pi => pi.plugItemHash);
				const perkDefs = await Promise.all(perkList.map(async ph => {
					if (itemDefs[ph]) return itemDefs[ph];
					const def = await getDef<DestinyInventoryItemDefinition>("InventoryItem", ph);
					itemDefs[ph] = def;
					return def;
				}));
				return perkDefs.map(pd => ({ name: pd.displayProperties.name, icon: pd.displayProperties.icon }));
			};
			return perkHashes.map(ph => {
				const perkDef = itemDefs[ph];
				if (!perkDef) throw new Error(`Perk definition not found for hash: ${ph}`);
				return {
					name: perkDef.displayProperties.name,
					icon: perkDef.displayProperties.icon
				};
			});
		}) ?? []);

		const frameDef = i.frameHash ? itemDefs[i.frameHash] : null;
		const masterworkDef = i.masterworkHash ? itemDefs[i.masterworkHash] : null;
		const data = {
			name: itemDef.displayProperties.name,
			type: itemDef.itemTypeDisplayName,
			icon: itemDef.displayProperties.icon,
			watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
			hash: i.hash,
			index: i.index,
			damageType: itemDef.defaultDamageType,
			damageTypeName: itemDef.defaultDamageTypeHash ? (damageTypeDefs[itemDef.defaultDamageTypeHash]?.displayProperties.name ?? "") : "",
			damageTypeIcon: itemDef.defaultDamageTypeHash ? (damageTypeDefs[itemDef.defaultDamageTypeHash]?.displayProperties.icon ?? "") : "",
			ammoType: itemDef.equippingBlock?.ammoType ?? 0,
			perks: randomPerks.map(rp => rp.map(p => p.icon)),
			frame: {
				name: frameDef ? frameDef.displayProperties.name : "",
				icon: frameDef ? frameDef.displayProperties.icon : ""
			},
			masterwork: {
				baseIcon: masterworkDef ? masterworkDef.displayProperties.icon : "",
				watermark: masterworkDef ? (masterworkDef.isFeaturedItem ? masterworkDef.iconWatermarkFeatured : masterworkDef.iconWatermark) : ""
			},
			costs
		};

		displaySellWeapons.push(data);

	};

	await Promise.all(sellWeapons.map(i => putRandomRollWeapon(i)));
	displaySellWeapons.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

	return {
		date: dateStr,
		background: vendorDef.locations?.[0]?.backgroundImagePath,
		sellWeapons: displaySellWeapons
	};
}

export const toBansheeFocusItemViewData = async (
	bansheeData: BansheeFocusItemData,
	getDef: <T>(type: "Vendor" | "InventoryItem" | "DamageType", hash: number) => Promise<T>,
) => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};
	const vendorDefs: Record<number, DestinyVendorDefinition> = {};
	const damageTypeDefs: Record<number, DestinyDamageTypeDefinition> = {};

	const itemHashes = new Set<number>();

	// 日付生成
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const dateStr = `${year}/${month}/${day}`;

	// ベンダー定義の取得
	const vendorDef = await getDef<DestinyVendorDefinition>("Vendor", bansheeData.vendorHash);

	// ## 集束化解読武器に関する定義の収集 ##

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	const weaponGroups = bansheeData.weaponGroups;
	weaponGroups.forEach(g => {
		g.weapons.forEach(w => itemHashes.add(w));
	});

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## 追加取得が必要な定義 ##

	// 仮アイテム→実アイテム
	weaponGroups.forEach(g => {
		const newWeapons: number[] = [];
		g.weapons.forEach(w => {
			const itemDef = itemDefs[w];
			if (!itemDef) return;

			const realItemHash = itemDef.displayProperties.iconHash;
			if (realItemHash) {
				itemHashes.add(realItemHash);
				newWeapons.push(realItemHash);
			} else {
				newWeapons.push(w);
			}
		});
		g.weapons = newWeapons;
	});

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// 武器のDamageTypeの定義
	const damageTypeHashes = new Set<number>();

	weaponGroups.forEach(g => {
		g.weapons.forEach(w => {
			const itemDef = itemDefs[w];
			if (!itemDef) return;

			const dmgTypeHash = itemDef.defaultDamageTypeHash;
			if (dmgTypeHash) damageTypeHashes.add(dmgTypeHash);
		});
	});

	await Promise.all(Array.from(damageTypeHashes).map(async (h) => {
		if (damageTypeDefs[h]) return; // 既に取得済みの場合はスキップ
		damageTypeDefs[h] = await getDef<DestinyDamageTypeDefinition>("DamageType", h);
	}));

	// ## 表示用データに整形 ##

	// 集束化解読
	const displayWeaponGroups: BansheeFocusItemViewData["weaponGroups"] = [];
	weaponGroups.forEach(async g => {
		const weapons: DisplayableWeapon[] = [];
		g.weapons.forEach(async h => {
			const itemDef = itemDefs[h];
			if (!itemDef) throw new Error(`Item definition not found for hash: ${h}`);

			const dmgTypeDef = itemDef.defaultDamageTypeHash ? damageTypeDefs[itemDef.defaultDamageTypeHash] : undefined;

			weapons.push({
				name: itemDef.displayProperties.name,
				icon: itemDef.displayProperties.icon,
				type: itemDef.itemTypeDisplayName,
				watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
				hash: itemDef.hash,
				damageType: itemDef.defaultDamageType,
				damageTypeName: dmgTypeDef?.displayProperties.name,
				damageTypeIcon: dmgTypeDef?.displayProperties.icon,
				ammoType: itemDef.equippingBlock?.ammoType,
			});
		});

		displayWeaponGroups.push({
			name: vendorDef.displayCategories[g.groupIndex]?.displayProperties.name ?? `Group ${g.groupIndex + 1}`,
			index: g.groupIndex,
			background: itemDefs[weapons[0].hash]?.secondaryIcon ?? "",
			weapons
		});
	});

	return {
		date: dateStr,
		background: vendorDef.locations?.[0]?.backgroundImagePath,
		weaponGroups: displayWeaponGroups
	};
}