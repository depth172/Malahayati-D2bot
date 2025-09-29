import { DestinyInventoryItemDefinition, DestinyItemInstanceComponent, DestinyItemSocketsComponent, DestinyItemStatsComponent, DestinySandboxPerkDefinition, DestinyStatDefinition, DestinyVendorDefinition, DestinyVendorResponse, DestinyVendorSaleItemComponent, DestinyComponentType as T } from "type";

type XurCardCategories = "normal" | "special";

type XurCardData = {
	indexes: {
		[key in XurCardCategories]: number[]; // vendorItemIndex の配列
	};
	items: {
		[hash: number]: {
			name: string;
			icon: string;
			watermark: string;
		}
	}
};

export type XurViewData = {
	xurHash: number;
	offersHash: number;
	gearHash: number;
	vendorResponses: Record<number, DestinyVendorResponse[]>;
	vendorDefs: Record<number, DestinyVendorDefinition>;
	itemDefs: Record<number, DestinyInventoryItemDefinition>;
	statDefs: Record<number, DestinyStatDefinition>;
	sandboxPerkDefs: Record<number, DestinySandboxPerkDefinition>;
}

const XUR_VENDOR_HASH = 2190858386;

export const getXurViewData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem" | "Stat" | "SandboxPerk", hash: number) => Promise<T>,
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
		getVendor(0, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemInstances, T.ItemStats, T.ItemSockets]),
		getVendor(1, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemInstances, T.ItemStats, T.ItemSockets]),
		getVendor(2, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemInstances, T.ItemStats, T.ItemSockets]),
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
	const statHashes = Object.values(xurResponses)
		.flatMap(resp => Object.values(resp.itemComponents?.stats?.data ?? {}))
		.flatMap(stat => Object.keys(stat?.stats ?? {}).map(h => Number(h)))
		.filter((h, i, arr) => arr.indexOf(h) === i); // 重複排除

	await Promise.all(statHashes.map(async (h) => {
		if (statDefs[h]) return;
		statDefs[h] = await getDef<DestinyStatDefinition>("Stat", h);
	}));

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

	// ## オファー（雑貨）に関する定義の収集 ##

	// OFFERSの販売アイテムを全てマージ
	const offersMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(vendorResponses[OFFERS_VENDOR_HASH][0].sales.data ?? {}),
		...(vendorResponses[OFFERS_VENDOR_HASH][1].sales.data ?? {}),
		...(vendorResponses[OFFERS_VENDOR_HASH][2].sales.data ?? {}),
	};
	const offersSaleItems = Object.values(offersMergedSales);

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of offersSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// ## その他の定義の収集 ##

	// 通貨となるアイテムを itemHashes に追加
	const costItemHashes = Object.values(vendorResponses)
		.flat()
		.flatMap((resp) => Object.values(resp.sales.data ?? {}))
		.flatMap((item) => item.costs ?? [])
		.map((c) => c.itemHash)
		.filter((h): h is number => typeof h === "number");

	costItemHashes.forEach((h) => itemHashes.add(h));

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## 追加取得が必要な定義 ##

	// 防具のアーキタイプを特定

	const archetypeHashes = new Set<number>();	
	xurSaleItems.forEach(async i => {
		if (!itemDefs[i.itemHash] || !itemDefs[i.itemHash].sockets) return; // アイテム定義がない場合はスキップ

		// アーキタイプの入るsocketTypeHash(2104613635)がどのインデックスに入っているかを調べる
		const archetypeSocketIndex = itemDefs[i.itemHash].sockets.socketEntries.findIndex(s => s.socketTypeHash === 2104613635);
		if (archetypeSocketIndex === -1) return; // アーキタイプのソケットがない場合はスキップ

		// 同じインデックスのDestinyItemSocketsComponentを調べてハッシュを得る
		const sockets = vendorResponses[XUR_VENDOR_HASH]
			.flatMap(vr => Object.values(vr.itemComponents?.sockets?.data[i.vendorItemIndex]?.sockets ?? {}))
		if (sockets) archetypeHashes.add(sockets[archetypeSocketIndex].plugHash);
	});

	// アーキタイプの定義を取得
	await Promise.all(Array.from(archetypeHashes).map(async (h) => {
		if (itemDefs[h]) return;
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// 媒体に含まれるSandboxPerkの定義

	const catalystHashes = new Set<number>();

	const catalystIndexes = vendorDefs[GEAR_VENDOR_HASH].categories.find(c => c.categoryHash === 3525849831)?.vendorItemIndexes;
	if (catalystIndexes !== undefined) {
		const catalystItems = gearSaleItems.filter(i => catalystIndexes.includes(i.vendorItemIndex));
		catalystItems.forEach(i => {
			if (i.itemHash) catalystHashes.add(i.itemHash);
		});
	}

	await Promise.all(Array.from(catalystHashes).map(async (h) => {
		if (!itemDefs[h]) return; // アイテム定義がない場合はスキップ
		const perks = itemDefs[h].perks;
		if (!perks) return; // パークがない場合はスキップ
		perks.map(async (p) => {
			if (sandboxPerkDefs[p.perkHash]) return; // 既に取得済みの場合はスキップ
			sandboxPerkDefs[p.perkHash] = await getDef<DestinySandboxPerkDefinition>("SandboxPerk", p.perkHash);
		});
	}));

	return {
		xurHash: XUR_VENDOR_HASH,
		offersHash: OFFERS_VENDOR_HASH,
		gearHash: GEAR_VENDOR_HASH,
		vendorResponses,
		vendorDefs,
		itemDefs,
		statDefs,
		sandboxPerkDefs
	};
}