import { DestinyInventoryItemDefinition, DestinySandboxPerkDefinition, DestinyStatDefinition, DestinyVendorDefinition, DestinyVendorResponse, DestinyVendorSaleItemComponent, DestinyComponentType as T } from "type";

export type XurViewData = {
	vendorResponses: Record<number, DestinyVendorResponse[]>;
	vendorDefs: Record<number, DestinyVendorDefinition>;
	itemDefs: Record<number, DestinyInventoryItemDefinition>;
	statDefs: Record<number, DestinyStatDefinition>;
	sandboxPerkDefs: Record<number, DestinySandboxPerkDefinition>;
}

const XUR_VENDOR_HASH = 2190858386;

export const getXurViewData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem" | "Stat", hash: number) => Promise<T>,
	getVendor: (character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>
) => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};
	const vendorDefs: Record<number, DestinyVendorDefinition> = {};
	const vendorResponses: Record<number, DestinyVendorResponse[]> = {};
	const statDefs: Record<number, DestinyStatDefinition> = {};
	const sandboxPerkDefs: Record<number, DestinySandboxPerkDefinition> = {};

	const itemHashes = new Set<number>();

	// ## 全ベンダーのResponseを取得 ##

	// XurのResponseを先に取得
	const xurResponses = await Promise.all([
		getVendor(0, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemStats]),
		getVendor(1, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemStats]),
		getVendor(2, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemStats]),
	]);

	vendorResponses[XUR_VENDOR_HASH] = xurResponses;

	const xurDef = await getDef<DestinyVendorDefinition>("Vendor", XUR_VENDOR_HASH);
	vendorDefs[XUR_VENDOR_HASH] = xurDef;

	// 「さらなる奇妙なオファー」が入ったカテゴリのインデックス
	const offerStrangeIndex = xurDef.displayCategories.findIndex(c => c.identifier === "category_xur_offer_strange");
	
	// 「さらなる奇妙なオファー」が入ったカテゴリに含まれるitemIndexes
	const offerStrange = xurResponses[0].categories.data?.categories.find(c => c.displayCategoryIndex === offerStrangeIndex)?.itemIndexes;
	if (!offerStrange) throw new Error("Xur's 'Offer Strange' category not found");

	// Xurの販売アイテムを全てマージ
	const xurMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(xurResponses[0].sales.data ?? {}),
		...(xurResponses[1].sales.data ?? {}),
		...(xurResponses[2].sales.data ?? {}),
	};
	const xurSaleItems = Object.values(xurMergedSales);
	if (xurSaleItems.length === 0) throw new Error("Xur has no sale items");

	// 「さらなる奇妙なオファー」に含まれるベンダーアイテムのhashを取得
	const offerStrangeVendorItemHashes = offerStrange.map(index => {
		const item = xurSaleItems.find(i => i.vendorItemIndex === index);
		if (!item) throw new Error(`Xur's sale item not found for index ${index}`);
		if (!item.itemHash) throw new Error(`Xur's sale item has no itemHash for index ${index}`);
		itemHashes.add(item.itemHash);
		return item.itemHash;
	});

	// 対応するアイテム定義を取得
	await Promise.all(offerStrangeVendorItemHashes.map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		const def = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
		itemDefs[h] = def;
	}));

	// previewVendorHashからベンダー情報を取得
	const offerResponses = await Promise.all(offerStrangeVendorItemHashes.map(h => Promise.all([
		getVendor(0, itemDefs[h].preview.previewVendorHash, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemReusablePlugs]),
		getVendor(1, itemDefs[h].preview.previewVendorHash, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemReusablePlugs]),
		getVendor(2, itemDefs[h].preview.previewVendorHash, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemReusablePlugs]),
	])));
	offerStrangeVendorItemHashes.forEach((h, i) => {
		vendorResponses[itemDefs[h].preview.previewVendorHash] = offerResponses[i];
	});

	await Promise.all(offerStrangeVendorItemHashes.map(async (h) => {
		const offerDef = await getDef<DestinyVendorDefinition>("Vendor", itemDefs[h].preview.previewVendorHash);
		vendorDefs[itemDefs[h].preview.previewVendorHash] = offerDef;
	}));
	
	const OFFERS_VENDOR_HASH = Object.values(vendorDefs)
		.find(v => v.vendorIdentifier === "TOWER_NINE_OFFERS")?.hash;
	if (!OFFERS_VENDOR_HASH) throw new Error("Xur's 'Offers' vendor definition not found");

	const GEAR_VENDOR_HASH = Object.values(vendorDefs)
		.find(v => v.vendorIdentifier === "TOWER_NINE_GEAR")?.hash;
	if (!GEAR_VENDOR_HASH) throw new Error("Xur's 'Gear' vendor definition not found");

	// ## シュール（防具）に関する定義の収集 ##

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of xurSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// ベンダーの販売アイテムに含まれるStatの定義を集める
	for (const respArr of Object.values(vendorResponses)) {
		for (const resp of respArr) {
			const items = resp.itemComponents?.stats?.data;
			if (!items) continue;
			for (const [_, obj] of Object.entries(items)) {
				const stats = obj.stats;
				await Promise.all(Object.keys(stats).map(async (hash) => {
					if (!statDefs[Number(hash)]) return;
					statDefs[Number(hash)] = await getDef<DestinyStatDefinition>("Stat", Number(hash));
				}));
			}
		}
	}

	// ## 装備（武器）に関する定義の収集 ##

	// GEARの販売アイテムを全てマージ
	const gearMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(vendorResponses[GEAR_VENDOR_HASH][0].sales.data ?? {}),
		...(vendorResponses[GEAR_VENDOR_HASH][1].sales.data ?? {}),
		...(vendorResponses[GEAR_VENDOR_HASH][2].sales.data ?? {}),
	};
	const gearSaleItems = Object.values(gearMergedSales);

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of gearSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## 追加取得が必要な定義 ##

	// 媒体に含まれるSandboxPerkの定義

	const catalystHashes = new Set<number>();
	// todo: 媒体である可能性のあるインデックスを取得し、一致するインデックスのハッシュを収集



	return { vendorResponses, vendorDefs, itemDefs, statDefs, sandboxPerkDefs };
}