import { isKillTrackerSocket, isMasterworkSocket, isWeaponFrameSocket, isWeaponPerkSocketCategory } from "@domain/typeCheck";
import { DestinyInventoryItemDefinition, DestinyItemInstanceComponent, DestinyItemReusablePlugsComponent, DestinyItemSocketsComponent, DestinyVendorDefinition, DestinyVendorResponse, DestinyVendorSaleItemComponent, DestinyComponentType as T } from "type";
import { GearRandomRollWeapon } from "typeOriginal";

export type BansheeSellWeaponData = {
	vendorHash: number;
	sellWeapons: GearRandomRollWeapon[];
}

export type BansheeFocusItemData = {
	vendorHash: number;
	weaponGroups: {
		groupIndex: number;
		weapons: number[];
	}[];
}

const BANSHEE_VENDOR_HASH = 672118013;

export const getBansheeSellWeaponData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem", hash: number) => Promise<T>,
	getVendor: (account: "main" | "sub", character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>
): Promise<BansheeSellWeaponData> => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};

	const itemHashes = new Set<number>();

	// ## ベンダーのResponseとDefinitionを取得 ##

	const bansheeResponses = await Promise.all([0, 1, 2].map(c => getVendor("sub", c, BANSHEE_VENDOR_HASH, [T.VendorSales, T.VendorCategories, T.ItemReusablePlugs, T.ItemSockets, T.ItemInstances])));
	const bansheeDef = await getDef<DestinyVendorDefinition>("Vendor", BANSHEE_VENDOR_HASH);

	// バンシーの販売アイテムを全てマージ
	const bansheeMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(bansheeResponses[0].sales.data ?? {}),
		...(bansheeResponses[1].sales.data ?? {}),
		...(bansheeResponses[2].sales.data ?? {}),
	};
	const bansheeVendorSaleItems = Object.values(bansheeMergedSales)
	if (bansheeVendorSaleItems.length === 0) throw new Error("Banshee has no sale items");

	// ## バンシー（週刊武器）に関する定義の収集 ##

	// キャラクターごとのVendorSaleItemComponentを統合
	const vendorItemComponents: {
		reusablePlugs: Record<number, DestinyItemReusablePlugsComponent>;
		instances: Record<number, DestinyItemInstanceComponent>;
		sockets: Record<number, DestinyItemSocketsComponent>;
	} = {
		reusablePlugs: {
			...(bansheeResponses[0].itemComponents?.reusablePlugs?.data ?? {}),
			...(bansheeResponses[1].itemComponents?.reusablePlugs?.data ?? {}),
			...(bansheeResponses[2].itemComponents?.reusablePlugs?.data ?? {}),
		},
		instances: {
			...(bansheeResponses[0].itemComponents?.instances?.data ?? {}),
			...(bansheeResponses[1].itemComponents?.instances?.data ?? {}),
			...(bansheeResponses[2].itemComponents?.instances?.data ?? {}),
		},
		sockets: {
			...(bansheeResponses[0].itemComponents?.sockets?.data ?? {}),
			...(bansheeResponses[1].itemComponents?.sockets?.data ?? {}),
			...(bansheeResponses[2].itemComponents?.sockets?.data ?? {}),
		}
	};

	// 週刊武器カテゴリのインデックス
	const weeklyWeaponCategoryIndex = bansheeDef.displayCategories.findIndex(c => c.identifier === "category_weapon_meta");

	// 週刊武器カテゴリに含まれるitemIndexes
	const weeklyWeaponItemIndexes = new Set([
		...bansheeResponses[0].categories.data?.categories.find(c => c.displayCategoryIndex === weeklyWeaponCategoryIndex)?.itemIndexes ?? [],
		...bansheeResponses[1].categories.data?.categories.find(c => c.displayCategoryIndex === weeklyWeaponCategoryIndex)?.itemIndexes ?? [],
		...bansheeResponses[2].categories.data?.categories.find(c => c.displayCategoryIndex === weeklyWeaponCategoryIndex)?.itemIndexes ?? []
	]);
	if (weeklyWeaponItemIndexes.size === 0) throw new Error("Banshee's weekly weapon category not found");

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of bansheeVendorSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## BansheeSellWeaponData型に整形 ##

	// 週刊武器
	const sellWeapons: GearRandomRollWeapon[] = [];
	weeklyWeaponItemIndexes.forEach(i => {
		const [idx, hash, def] = [i, bansheeMergedSales[i].itemHash, itemDefs[bansheeMergedSales[i].itemHash]];
		if (!hash || !def) return; // アイテム定義がない場合はスキップ
		
		const weaponPerkSocketCategories = def.sockets.socketCategories?.find(sc => isWeaponPerkSocketCategory(sc.socketCategoryHash))?.socketIndexes;
		const frameSocketIndex = def.sockets?.socketEntries.findIndex(se => se && isWeaponFrameSocket(se.socketTypeHash));
		const masterworkSocketIndex = def.sockets?.socketEntries.findIndex(se => se && isMasterworkSocket(se.socketTypeHash));
		const killTrackerSocketIndex = def.sockets?.socketEntries.findIndex(se => se && isKillTrackerSocket(se.socketTypeHash));

		// 特性
		const perks: { [index: number]: number[] } = {};
		const plugs = vendorItemComponents.reusablePlugs[idx]?.plugs;
		const frameHash = vendorItemComponents.sockets[idx]?.sockets[frameSocketIndex ?? -1]?.plugHash;
		const masterworkHash = vendorItemComponents.sockets[idx]?.sockets[masterworkSocketIndex ?? -1]?.plugHash;

		if (plugs) {
			Object.entries(plugs).forEach(([socketIndexStr, plugStates]) => {
				const socketIndex = Number(socketIndexStr);
				if (!weaponPerkSocketCategories?.includes(socketIndex) || socketIndex === killTrackerSocketIndex) return;

				const plugHashes = plugStates.map(p => p.plugItemHash);
				perks[socketIndex] = plugHashes;
			});
		}

		sellWeapons.push({
			hash,
			index: idx,
			costs: bansheeMergedSales[idx].costs?.map(c => ({
				hash: c.itemHash,
				quantity: c.quantity
			})) ?? [],
			perks,
			frameHash: frameHash && isWeaponFrameSocket(def.sockets.socketEntries[frameSocketIndex]?.socketTypeHash) ? frameHash : undefined,
			masterworkHash: masterworkHash && isMasterworkSocket(def.sockets.socketEntries[masterworkSocketIndex]?.socketTypeHash) ? masterworkHash : undefined
		});
	});

	return {
		vendorHash: BANSHEE_VENDOR_HASH,
		sellWeapons
	}
}

export const getBansheeFocusItemData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem", hash: number) => Promise<T>,
	getVendor: (account: "main" | "sub", character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>
): Promise<BansheeFocusItemData> => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};

	const itemHashes = new Set<number>();

	// ## ベンダーのResponseとDefinitionを取得 ##

	const bansheeResponses = await Promise.all([0, 1, 2].map(c => getVendor("sub", c, BANSHEE_VENDOR_HASH, [T.VendorSales, T.VendorCategories, T.ItemReusablePlugs, T.ItemSockets, T.ItemInstances])));
	const bansheeDef = await getDef<DestinyVendorDefinition>("Vendor", BANSHEE_VENDOR_HASH);

	// 集束化解読が入ったカテゴリのインデックス
	const focusedDecodingCategoryIndex = bansheeDef.displayCategories.findIndex(c => c.identifier === "category.vendor_engram_purchase");

	// 「集束化解読」が入ったカテゴリに含まれるitemIndexes
	const focusedDecodingItemIndex = bansheeResponses[0].categories.data?.categories.find(c => c.displayCategoryIndex === focusedDecodingCategoryIndex)?.itemIndexes[0];
	if (!focusedDecodingItemIndex) throw new Error("Banshee's 'Focused Decoding' category not found");

	// バンシーの販売アイテムを全てマージ
	const bansheeMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(bansheeResponses[0].sales.data ?? {}),
		...(bansheeResponses[1].sales.data ?? {}),
		...(bansheeResponses[2].sales.data ?? {}),
	};
	const bansheeVendorSaleItemsRaw = Object.values(bansheeMergedSales)
	if (bansheeVendorSaleItemsRaw.length === 0) throw new Error("Banshee has no sale items");

	// 集束化解読に含まれるベンダー（疑似アイテム）のhashを取得
	const focusedDecodingVendorItem = bansheeVendorSaleItemsRaw.find(i => i.vendorItemIndex === focusedDecodingItemIndex);
	if (!focusedDecodingVendorItem) throw new Error(`Banshee's sale item not found for index ${focusedDecodingItemIndex}`);
	if (!focusedDecodingVendorItem.itemHash) throw new Error(`Banshee's sale item has no itemHash for index ${focusedDecodingItemIndex}`);
	const focusedDecodingVendorItemHash = focusedDecodingVendorItem.itemHash;

	const bansheeSaleItems = bansheeVendorSaleItemsRaw.filter(i => i.vendorItemIndex !== focusedDecodingItemIndex);
	bansheeSaleItems.sort((a, b) => (bansheeDef.itemList[a.vendorItemIndex].categoryIndex ?? 0) - (bansheeDef.itemList[b.vendorItemIndex].categoryIndex ?? 0));

	// 対応するアイテム定義を取得
	if (!itemDefs[focusedDecodingVendorItemHash]) {
		itemDefs[focusedDecodingVendorItemHash] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", focusedDecodingVendorItemHash);
	}

	// previewVendorHashからベンダー情報を取得
	const focusedDecodingResponses = await Promise.all([0, 1, 2].map(
		c => getVendor("sub", c, itemDefs[focusedDecodingVendorItemHash].preview.previewVendorHash, [T.VendorSales, T.VendorCategories])
	));
	const focusedDecodingDef = await getDef<DestinyVendorDefinition>("Vendor", itemDefs[focusedDecodingVendorItemHash].preview.previewVendorHash);
	
	const FOCUSED_DECODING_VENDOR_HASH = focusedDecodingDef?.hash;
	if (!FOCUSED_DECODING_VENDOR_HASH) throw new Error("Focused Decoding vendor hash not found");

	// ## 集束化解読（武器）に関する定義の収集 ##

	// GEARの販売アイテムを全てマージ
	const focusedDecodingMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(focusedDecodingResponses[0].sales.data ?? {}),
		...(focusedDecodingResponses[1].sales.data ?? {}),
		...(focusedDecodingResponses[2].sales.data ?? {}),
	};
	const fdSaleItems = Object.values(focusedDecodingMergedSales);

	fdSaleItems.sort((a, b) => (focusedDecodingDef.itemList[a.vendorItemIndex].categoryIndex ?? 0) - (focusedDecodingDef.itemList[b.vendorItemIndex].categoryIndex ?? 0));

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of fdSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## BansheeData型に整形 ##

	const weaponGroups: BansheeFocusItemData["weaponGroups"] = [];

	focusedDecodingResponses[0].categories.data?.categories.forEach(c => {
		const [idx, items] = [c.displayCategoryIndex, c.itemIndexes];

		const weapons: number[] = [];
		if (items && items.length > 0) {
			items.forEach(i => {
				const hash = fdSaleItems.find(s => s.vendorItemIndex === i)?.itemHash;
				if (!hash) throw new Error(`Banshee's focused decoding sale item not found for index ${i}`);
				weapons.push(hash);
			});
		}
		
		const data = {
			groupIndex: idx,
			weapons
		};

		weaponGroups.push(data);
	});

	return {
		vendorHash: FOCUSED_DECODING_VENDOR_HASH,
		weaponGroups
	}
}