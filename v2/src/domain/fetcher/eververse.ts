import { getAllDefinition } from "@api/bungie/getAllDefinition";
import { inferWeaponOrnament } from "@domain/inferOrnament";
import { DestinyInventoryItemDefinition, DestinyVendorDefinition, DestinyVendorResponse, DestinyVendorSaleItemComponent, DestinyComponentType as T } from "type";
import { Cost } from "typeOriginal";
import { b } from "vitest/dist/chunks/suite.d.FvehnV49.js";

export type EververseData = {
	vendorHash: number;
	itemGroups: {
		groupIndex: number;
		items: {
			hash: number;
			eligibleItemHashes?: number[];
			costs: Cost[];
		}[];
	}[];
}

const EVERVERSE_VENDOR_HASH = 3361454721;

export const getEververseData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem" | "PlugSet", hash: number) => Promise<T>,
	getVendor: (account: "main" | "sub", character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>
): Promise<EververseData> => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};

	const itemHashes = new Set<number>();

	// ## ベンダーのResponseとDefinitionを取得 ##

	const evResponses = await Promise.all([0, 1, 2].map(c => getVendor("sub", c, EVERVERSE_VENDOR_HASH, [T.VendorSales, T.VendorCategories])));
	const evDef = await getDef<DestinyVendorDefinition>("Vendor", EVERVERSE_VENDOR_HASH);

	// バンシーの販売アイテムを全てマージ
	const evMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(evResponses[0].sales.data ?? {}),
		...(evResponses[1].sales.data ?? {}),
		...(evResponses[2].sales.data ?? {}),
	};
	const evSaleItems = Object.values(evMergedSales);
	if (evSaleItems.length === 0) throw new Error("Eververse has no sale items");

	// ## 定義の収集 ##

	// ブライトダスト販売カテゴリのインデックス
	const brightDustCategoryIds = [
		"categories.featured.bright_dust",
		"categories.bright_dust.items",
		"categories.bright_dust.flair"
	]
	const brightDustCategoryIndexes = brightDustCategoryIds.map(id => evDef.displayCategories.findIndex(c => c.identifier === id));

	// ブライトダストで販売されるitemIndexes
	const brightDustItemIndexes = Array.from(new Set(
		evResponses.map(r => brightDustCategoryIndexes.map(idx => r.categories.data?.categories.find(c => c.displayCategoryIndex === idx)?.itemIndexes ?? []).flat()).flat()
	));
	if (brightDustItemIndexes.length === 0) throw new Error("Eververse's bright dust category not found");

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of brightDustItemIndexes.map(i => evMergedSales[i]).filter(i => i)) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// 定義取得
	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return;
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## 追加取得が必要な定義 ##

	// 武器装飾が存在する場合、対象となる武器を特定
	let hasWeaponOrnaments = false;
	let isExotic = false;
	let isLegendary = false;

	for (const item of Object.values(itemDefs)) {
		if (item.traitIds?.[0] === "item.ornament.weapon") {
			hasWeaponOrnaments = true;
			// 装飾の品質から対象武器の品質を判定
			if (item.inventory?.tierType === 6) { // エキゾチック
				isExotic = true;
			} else if (item.inventory?.tierType === 5) { // レジェンダリー
				isLegendary = true;
			}
		}
	}

	const ornamentMatchList: Record<number, number[]> = {}; // ornamentHash -> weaponHash[]
	// 武器装飾が存在する場合、対応するレアリティの全武器を取得
	if (hasWeaponOrnaments) {
		console.log(`武器装飾が検出されました。${isExotic ? "エキゾチック" : ""}${isLegendary ? (isExotic ? "、" : "") + "レジェンダリー" : ""}の全武器を取得します...`);
		const allWeaponLiteDefs = await getAllDefinition<DestinyInventoryItemDefinition>("InventoryItemLite", def => {
			// 武器のみ
			if (def.itemType !== 3) return false
			// 対象のレアリティのみ
			if (isExotic && def.inventory?.tierType === 6) return true;
			if (isLegendary && def.inventory?.tierType === 5) return true;
			return false;
		});

		const hashes = Object.keys(allWeaponLiteDefs).map(h => parseInt(h));

		const allWeaponDefs: Record<number, DestinyInventoryItemDefinition> = {};
		await Promise.all(hashes.map(async (h) => {
			if (allWeaponDefs[h]) return;
			allWeaponDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
		}));

		// 全武器の中から、装飾が付けられる武器を推論
		for (const item of Object.values(itemDefs)) {
			if (item.traitIds?.[0] === "item.ornament.weapon") {
				const matchWeapons = await inferWeaponOrnament(item.hash, allWeaponDefs, getDef);
				ornamentMatchList[item.hash] = matchWeapons;
			}
		}
	}

	// ## EververseData型に整形 ##

	const brightDustItems: EververseData["itemGroups"] = [];
	brightDustCategoryIndexes.forEach(i => {
		const items: EververseData["itemGroups"][0]["items"] = [];

		const indexesSet = new Set<number>();
		evResponses.forEach(r => {
			const category = r.categories.data?.categories.find(c => c.displayCategoryIndex === i);
			if (!category) return;
			category.itemIndexes.forEach(idx => indexesSet.add(idx));
		});

		const indexes = Array.from(indexesSet).sort((a, b) => a - b);
		indexes.forEach(idx => {
			const sale = evMergedSales[idx];
			if (!sale) throw new Error(`Eververse sale item not found: index=${idx}`);
			if (!sale.itemHash) throw new Error(`Eververse sale item has no itemHash: index=${idx}`);

			const eligibleItemHashes = ornamentMatchList[sale.itemHash];

			items.push({
				hash: sale.itemHash,
				eligibleItemHashes,
				costs: sale.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? [],
			});
		});

		brightDustItems.push({
			groupIndex: i,
			items
		});
	});

	return {
		vendorHash: EVERVERSE_VENDOR_HASH,
		itemGroups: brightDustItems
	};
}