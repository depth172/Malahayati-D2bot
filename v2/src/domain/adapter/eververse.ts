import buildCosts from "@domain/buildCostData";
import { EververseData } from "@domain/fetcher/eververse";
import { DestinyDamageTypeDefinition, DestinyInventoryItemDefinition, DestinyVendorDefinition } from "type";
import { DisplayableVendorItem, DisplayableWeapon } from "typeOriginal";

export type EververseViewData = {
	date: string;
	background: string;
	itemGroups: {
		name: string;
		items: (DisplayableVendorItem & {
			background: string;
			eligibleItems?: DisplayableWeapon[];
		})[];
	}[];
}

export const toEververseViewData = async (
	eververseData: EververseData,
	getDef: <T>(type: "Vendor" | "InventoryItem" | "DamageType", hash: number) => Promise<T>,
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
	const vendorDef = await getDef<DestinyVendorDefinition>("Vendor", eververseData.vendorHash);

	// ## エバーバースに関する定義の収集 ##

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	const sellItems = eververseData.itemGroups.flatMap(group => group.items);
	sellItems.forEach(w => {
		itemHashes.add(w.hash);
		w.costs.forEach(c => itemHashes.add(c.hash));
		if (w.eligibleItemHashes) {
			w.eligibleItemHashes.forEach(h => itemHashes.add(h));
		}
	});

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## 追加取得が必要な定義 ##

	// 武器のDamageTypeの定義
	const damageTypeHashes = new Set<number>();

	Object.values(sellItems).forEach(w => {
		if (!w.eligibleItemHashes) return;
		w.eligibleItemHashes.forEach(h => {
			const itemDef = itemDefs[h];
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

	const displayData: EververseViewData["itemGroups"] = [];

	eververseData.itemGroups.forEach(async g => {
		const items: EververseViewData["itemGroups"][0]["items"] = [];
		g.items.forEach(async i => {
			const itemDef = itemDefs[i.hash];
			if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);

			const costs = buildCosts(i.costs, itemDefs);

			let eligibleItems: DisplayableWeapon[] | undefined = undefined;

			if (i.eligibleItemHashes) {
				eligibleItems = i.eligibleItemHashes.map(h => {
					const weaponDef = itemDefs[h] as DestinyInventoryItemDefinition | undefined;
					if (!weaponDef) throw new Error(`Weapon definition not found for hash: ${h}`);

					return {
						hash: h,
						name: weaponDef.displayProperties.name,
						icon: weaponDef.displayProperties.icon,
						type: weaponDef.itemTypeDisplayName,
						watermark: weaponDef.isFeaturedItem ? weaponDef.iconWatermarkFeatured : weaponDef.iconWatermark,
						damageType: weaponDef.defaultDamageType,
						damageTypeName: weaponDef.defaultDamageTypeHash ? damageTypeDefs[weaponDef.defaultDamageTypeHash]?.displayProperties.name : undefined,
						damageTypeIcon: weaponDef.defaultDamageTypeHash ? damageTypeDefs[weaponDef.defaultDamageTypeHash]?.displayProperties.icon : undefined,
						ammoType: weaponDef.equippingBlock?.ammoType,
					};
				});
			}

			items.push({
				hash: i.hash,
				name: itemDef.displayProperties.name,
				icon: itemDef.displayProperties.icon,
				type: itemDef.itemTypeDisplayName,
				watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
				background: itemDef.screenshot ?? "",
				costs,
				eligibleItems,
			});
		});

		displayData.push({
			name: vendorDef.displayCategories?.[g.groupIndex]?.displayProperties.name ?? `Group ${g.groupIndex + 1}`,
			items
		});
	});

	return {
		date: dateStr,
		background: vendorDef.locations?.[0]?.backgroundImagePath,
		itemGroups: displayData
	};
}
