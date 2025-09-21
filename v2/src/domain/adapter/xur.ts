import { DestinyInventoryItemDefinition, DestinyVendorDefinition, DestinyVendorResponse, DestinyComponentType as T } from "type";

export type XurViewData = {
	vendorResponses: Record<number, DestinyVendorResponse[]>;
	vendorDefs: Record<number, DestinyVendorDefinition>;
	itemDefs: Record<number, DestinyInventoryItemDefinition>;
}

const XUR_VENDOR_HASH = 2190858386;

export const getXurViewData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem", hash: number) => Promise<T>,
	getVendor: (character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>
) => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};
	const vendorDefs: Record<number, DestinyVendorDefinition> = {};
	const vendorResponses: Record<number, DestinyVendorResponse[]> = {};

	const itemHashes = new Set<number>();

	const xurResponses = await Promise.all([
		getVendor(0, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemReusablePlugs]),
		getVendor(1, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemReusablePlugs]),
		getVendor(2, XUR_VENDOR_HASH, [T.Vendors, T.VendorSales, T.VendorCategories, T.ItemReusablePlugs]),
	]);

	vendorResponses[XUR_VENDOR_HASH] = xurResponses;

	const xurDef = await getDef<DestinyVendorDefinition>("Vendor", XUR_VENDOR_HASH);
	vendorDefs[XUR_VENDOR_HASH] = xurDef;

	// 「さらなる奇妙なオファー」が入ったカテゴリのインデックス
	const offerStrangeIndex = xurDef.displayCategories.findIndex(c => c.identifier === "category_xur_offer_strange");
	
	const offerStrange = xurResponses[0].categories.data?.categories.find(c => c.displayCategoryIndex === offerStrangeIndex)?.itemIndexes;
	if (!offerStrange) throw new Error("Xur's 'Offer Strange' category not found");

	const saleItems = xurResponses[0].sales.data ? Object.values(xurResponses[0].sales.data) : [];
	if (saleItems.length === 0) throw new Error("Xur has no sale items");

	const offerStrangeItemHashes = offerStrange.map(index => {
		const item = saleItems.find(i => i.vendorItemIndex === index);
		if (!item) throw new Error(`Xur's sale item not found for index ${index}`);
		if (!item.itemHash) throw new Error(`Xur's sale item has no itemHash for index ${index}`);
		itemHashes.add(item.itemHash);
		return item.itemHash;
	});

	await Promise.all(offerStrangeItemHashes.map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		const def = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
		itemDefs[h] = def;
	}));

	const offerResponses = await Promise.all(offerStrangeItemHashes.map(h => Promise.all([
		getVendor(0, itemDefs[h].preview.previewVendorHash, [T.Vendors, T.VendorSales, T.ItemReusablePlugs]),
		getVendor(1, itemDefs[h].preview.previewVendorHash, [T.Vendors, T.VendorSales, T.ItemReusablePlugs]),
		getVendor(2, itemDefs[h].preview.previewVendorHash, [T.Vendors, T.VendorSales, T.ItemReusablePlugs]),
	])));
	offerStrangeItemHashes.forEach((h, i) => {
		vendorResponses[itemDefs[h].preview.previewVendorHash] = offerResponses[i];
	});

	await Promise.all(offerStrangeItemHashes.map(async (h) => {
		const offerDef = await getDef<DestinyVendorDefinition>("Vendor", itemDefs[h].preview.previewVendorHash);
		vendorDefs[itemDefs[h].preview.previewVendorHash] = offerDef;
	}));

	return { vendorResponses, vendorDefs, itemDefs };
}