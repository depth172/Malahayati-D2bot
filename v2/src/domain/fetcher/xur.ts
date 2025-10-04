import { isArchetypeSocket, isArmorPerkSocket, isCatalystCategory, isExoticEngramCategory, isExoticPerkSocket, isExoticWeaponCategory, isKillTrackerSocket, isMasterworkSocket, isRandomRollExoticCategory, isWeaponCategory, isWeaponEngramCategory, isWeaponFrameSocket, isWeaponPerkSocket, isWeaponPerkSocketCategory } from "@domain/typeCheck";
import { DestinyInventoryItemDefinition, DestinyItemInstanceComponent, DestinyItemReusablePlugsComponent, DestinyItemSocketsComponent, DestinyItemStatsComponent, DestinySandboxPerkDefinition, DestinyStatDefinition, DestinyVendorDefinition, DestinyVendorResponse, DestinyVendorSaleItemComponent, DestinyComponentType as T } from "type";

export type Cost = {
	hash: number;
	quantity: number;
}

type XurArmor = {
	hash: number;
	tier: number;
	archetypeHash: number;
	perkHash: number;
	stats: {
		stat: {
			hash: number;
			value: number;
		}[];
		total: number;
	};
	costs: Cost[];
};

type GearItem = {
	hash: number;
	quantity?: number;
	costs: Cost[];
};

type GearExoticWeapon = GearItem & {
	perkHash: number[];
};

export type GearRandomRollWeapon = GearItem & {
	index?: number;
	perks: {
		[index: number]: number[];
	}
	frameHash?: number;
	masterworkHash?: number;
};

export type GearRandomRollExoticWeapon = GearRandomRollWeapon & {
	exoticPerkHash: number;
	stats: {
		hash: number;
		value: number;
	}[];
};

type OfferItem = {
	hash: number;
	quantity: number;
	costs: Cost[];
}

export type XurData = {
	xurHash: number;
	gearHash: number;
	offerHash: number;
	xurItems: {
		basicArmors: {
			hunter: XurArmor[];
			titan: XurArmor[];
			warlock: XurArmor[];
		}
		specialItems: {
			hash: number;
			costs: Cost[];
		}[];
		xenology: number;
	};
	gearItems: {
		exotics: {
			engram: GearItem;
			weapons: GearExoticWeapon[];
			catalysts: GearItem[];
			randomRollWeapons: GearRandomRollExoticWeapon[];
		}
		weapons: {
			engram: GearItem;
			weapons: GearRandomRollWeapon[];
		}
	}
	offerItems: {
		weeklyItems: OfferItem[];
		generalItems: OfferItem[];
	};
}

const XUR_VENDOR_HASH = 2190858386;

export const getXurData = async (
	getDef: <T>(type: "Vendor" | "InventoryItem", hash: number) => Promise<T>,
	getVendor: (character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>
): Promise<XurData> => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};
	const vendorDefs: Record<number, DestinyVendorDefinition> = {};
	const vendorResponses: Record<number, DestinyVendorResponse[]> = {};

	const itemHashes = new Set<number>();

	// ## 全ベンダーのResponseを取得 ##

	// XurのResponseを先に取得
	const xurResponses = await Promise.all([0, 1, 2].map(c => getVendor(c, XUR_VENDOR_HASH, [T.VendorSales, T.VendorCategories, T.ItemInstances, T.ItemStats, T.ItemSockets])));

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
	const xurVendorSaleItemsRaw = Object.values(xurMergedSales)
	if (xurVendorSaleItemsRaw.length === 0) throw new Error("Xur has no sale items");

	// 「さらなる奇妙なオファー」に含まれるベンダー（疑似アイテム）のhashを取得
	const offerStrangeVendorItemHashes = offerStrange.map(index => {
		const item = xurVendorSaleItemsRaw.find(i => i.vendorItemIndex === index);
		if (!item) throw new Error(`Xur's sale item not found for index ${index}`);
		if (!item.itemHash) throw new Error(`Xur's sale item has no itemHash for index ${index}`);
		return item.itemHash;
	});

	const xurVendorSaleItems = xurVendorSaleItemsRaw.filter(i => !offerStrange.includes(i.vendorItemIndex));
	xurVendorSaleItems.sort((a, b) => (xurDef.itemList[a.vendorItemIndex].categoryIndex ?? 0) - (xurDef.itemList[b.vendorItemIndex].categoryIndex ?? 0));

	// 対応するアイテム定義を取得
	await Promise.all(offerStrangeVendorItemHashes.map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		const def = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
		itemDefs[h] = def;
	}));

	// previewVendorHashからベンダー情報を取得
	const offerResponses = await Promise.all(offerStrangeVendorItemHashes.map(h => Promise.all([0, 1, 2].map(
		c => getVendor(c, itemDefs[h].preview.previewVendorHash, [T.VendorSales, T.VendorCategories, T.ItemStats, T.ItemReusablePlugs, T.ItemSockets])
	))));

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
	const offersDef = vendorDefs[OFFERS_VENDOR_HASH];

	const GEAR_VENDOR_HASH = Object.values(vendorDefs)
		.find(v => v.vendorIdentifier === "TOWER_NINE_GEAR")?.hash;
	if (!GEAR_VENDOR_HASH) throw new Error("Xur's 'Gear' vendor definition not found");
	const gearDef = vendorDefs[GEAR_VENDOR_HASH];

	// ## シュール（防具）に関する定義の収集 ##

	// キャラクターごとのVendorSaleItemComponentを統合
	const xurItemComponents: {
		instances: Record<number, DestinyItemInstanceComponent>;
		stats: Record<number, DestinyItemStatsComponent>;
		sockets: Record<number, DestinyItemSocketsComponent>;
	} = {
		instances: {
			...(xurResponses[0].itemComponents?.instances?.data ?? {}),
			...(xurResponses[1].itemComponents?.instances?.data ?? {}),
			...(xurResponses[2].itemComponents?.instances?.data ?? {}),
		},
		stats: {
			...(xurResponses[0].itemComponents?.stats?.data ?? {}),
			...(xurResponses[1].itemComponents?.stats?.data ?? {}),
			...(xurResponses[2].itemComponents?.stats?.data ?? {}),
		},
		sockets: {
			...(xurResponses[0].itemComponents?.sockets?.data ?? {}),
			...(xurResponses[1].itemComponents?.sockets?.data ?? {}),
			...(xurResponses[2].itemComponents?.sockets?.data ?? {}),
		}
	};

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of xurVendorSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// ## 装備（武器）に関する定義の収集 ##

	// GEARの販売アイテムを全てマージ
	const gearMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(vendorResponses[GEAR_VENDOR_HASH][0].sales.data ?? {}),
		...(vendorResponses[GEAR_VENDOR_HASH][1].sales.data ?? {}),
		...(vendorResponses[GEAR_VENDOR_HASH][2].sales.data ?? {}),
	};
	const gearSaleItems = Object.values(gearMergedSales);

	gearSaleItems.sort((a, b) => (gearDef.itemList[a.vendorItemIndex].categoryIndex ?? 0) - (gearDef.itemList[b.vendorItemIndex].categoryIndex ?? 0));

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	for (const item of gearSaleItems) {
		if (!item.itemHash) continue;
		itemHashes.add(item.itemHash);
	}

	// キャラクターごとのVendorSaleItemComponentを統合
	const gearItemComponents: {
		reusablePlugs: Record<number, DestinyItemReusablePlugsComponent>;
		sockets: Record<number, DestinyItemSocketsComponent>;
		stats: Record<number, DestinyItemStatsComponent>;
	} = {
		reusablePlugs: {
			...(vendorResponses[GEAR_VENDOR_HASH][0].itemComponents?.reusablePlugs?.data ?? {}),
			...(vendorResponses[GEAR_VENDOR_HASH][1].itemComponents?.reusablePlugs?.data ?? {}),
			...(vendorResponses[GEAR_VENDOR_HASH][2].itemComponents?.reusablePlugs?.data ?? {}),
		},
		sockets: {
			...(vendorResponses[GEAR_VENDOR_HASH][0].itemComponents?.sockets?.data ?? {}),
			...(vendorResponses[GEAR_VENDOR_HASH][1].itemComponents?.sockets?.data ?? {}),
			...(vendorResponses[GEAR_VENDOR_HASH][2].itemComponents?.sockets?.data ?? {}),
		},
		stats: {
			...(vendorResponses[GEAR_VENDOR_HASH][0].itemComponents?.stats?.data ?? {}),
			...(vendorResponses[GEAR_VENDOR_HASH][1].itemComponents?.stats?.data ?? {}),
			...(vendorResponses[GEAR_VENDOR_HASH][2].itemComponents?.stats?.data ?? {}),
		}
	};

	// ## オファー（雑貨）に関する定義の収集 ##

	// OFFERSの販売アイテムを全てマージ
	const offersMergedSales: Record<number, DestinyVendorSaleItemComponent> = {
		...(vendorResponses[OFFERS_VENDOR_HASH][0].sales.data ?? {}),
		...(vendorResponses[OFFERS_VENDOR_HASH][1].sales.data ?? {}),
		...(vendorResponses[OFFERS_VENDOR_HASH][2].sales.data ?? {}),
	};
	const offersVendorSaleItems = Object.values(offersMergedSales);

	offersVendorSaleItems.sort((a, b) => (offersDef.itemList[a.vendorItemIndex].categoryIndex ?? 0) - (offersDef.itemList[b.vendorItemIndex].categoryIndex ?? 0));

	// 週替り雑貨が入るカテゴリのインデックス
	const rotatingIndex = offersDef.displayCategories.findIndex(c => c.identifier === "category_xur_offer_material");
	const weeklyItemIndexes = vendorResponses[OFFERS_VENDOR_HASH][0].categories.data?.categories.find(c => c.displayCategoryIndex === rotatingIndex)?.itemIndexes;

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	// ## XurData型に整形 ##

	// シュール
	const xurItems: XurData["xurItems"] = {
		basicArmors: {
			hunter: [],
			titan: [],
			warlock: []
		},
		specialItems: [],
		xenology: 0
	};

	xurVendorSaleItems.forEach(i => {
		const [idx, hash, def] = [i.vendorItemIndex, i.itemHash, itemDefs[i.itemHash]];
		if (!hash || !def) return; // アイテム定義がない場合はスキップ

		const instance = xurItemComponents.instances[idx];
		
		// 防具
		if (def.itemType === 2 /* Armor */) {
			// アーキタイプ
			const archetypeSocketIndex = def.sockets?.socketEntries.findIndex(s => isArchetypeSocket(s.socketTypeHash));
			const archetypeHash = xurItemComponents.sockets[idx]?.sockets[archetypeSocketIndex].plugHash;

			// ステータス
			const statsComp = xurItemComponents.stats[idx];

			const stats = Object.values(statsComp.stats).map(s => ({
				hash: s.statHash,
				value: s.value
			}));
			const statsTotal = stats.reduce((sum, s) => sum + s.value, 0);

			// エキゾチック防具の効果
			const perkHash = def.sockets.socketEntries.find(se => se && isExoticPerkSocket(se.socketTypeHash))?.singleInitialItemHash;

			// コスト
			const costs = i.costs?.map(c => ({
				hash: c.itemHash,
				quantity: c.quantity
			})) ?? [];

			const data = {
				hash: hash,
				tier: instance?.gearTier ?? 0,
				archetypeHash,
				perkHash: perkHash ?? 0,
				stats: {
					stat: stats,
					total: statsTotal
				},
				costs
			}

			switch (def.classType) {
				case 0: xurItems.basicArmors.titan.push(data); break;
				case 1: xurItems.basicArmors.hunter.push(data); break;
				case 2: xurItems.basicArmors.warlock.push(data); break;
				default: xurItems.basicArmors.hunter.push(data); break; // クラス不明はハンターに入れる
			}

		} else if (def.itemType === 12) {
			xurItems.xenology = hash;
		} else {
			// 雑貨
			const costs = i.costs?.map(c => ({
				hash: c.itemHash,
				quantity: c.quantity
			})) ?? [];

			const data = {
				hash: hash,
				costs
			}

			xurItems.specialItems.push(data);
		}
	});

	// 装備
	const gearItems: XurData["gearItems"] = {
		exotics: {
			engram: { hash: 0, costs: [] },
			weapons: [],
			catalysts: [],
			randomRollWeapons: []
		},
		weapons: {
			engram: { hash: 0, costs: [] },
			weapons: []
		}
	};

	gearSaleItems.forEach(i => {
		const [idx, hash, def] = [i.vendorItemIndex, i.itemHash, itemDefs[i.itemHash]];
		if (!hash || !def) return; // アイテム定義がない場合はスキップ
		
		const categoryIndex = gearDef.itemList[idx].categoryIndex;
		const categoryHash = gearDef.categories[categoryIndex]?.categoryHash;
		if (!categoryHash) return; // カテゴリがない場合はスキップ

		if (isExoticEngramCategory(categoryHash)) {
			// エキゾチックエングラム
			gearItems.exotics.engram = {
				hash,
				costs: i.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? []
			};
		} else if (isWeaponEngramCategory(categoryHash)) {
			// 武器エングラム
			gearItems.weapons.engram = {
				hash,
				costs: i.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? []
			};
		} else if (isExoticWeaponCategory(categoryHash)) {
			// エキゾチック武器
			const def = itemDefs[hash];
			if (!def) return;

			const perkHash = def.sockets?.socketEntries.find(se => se && isExoticPerkSocket(se.socketTypeHash))?.singleInitialItemHash;
			const subPerkHash = def.sockets?.socketEntries.find(se => se && isWeaponPerkSocket(se.socketTypeHash))?.singleInitialItemHash;

			gearItems.exotics.weapons.push({
				hash,
				perkHash: [perkHash ?? 0, subPerkHash ?? 0].filter(h => h !== 0),
				costs: i.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? []
			});
		} else if (isCatalystCategory(categoryHash)) {
			// 媒体
			gearItems.exotics.catalysts.push({
				hash,
				quantity: i.quantity,
				costs: i.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? []
			});
		} else if (isRandomRollExoticCategory(categoryHash)) {
			// ランダムロールエキゾチック武器
			const exoticPerkHash = def.sockets?.socketEntries.find(se => se && isExoticPerkSocket(se.socketTypeHash))?.singleInitialItemHash;

			// 特性
			const perks: { [index: number]: number[] } = {};
			const plugs = gearItemComponents.reusablePlugs[idx].plugs;

			Object.entries(plugs).forEach(([socketIndexStr, plugStates]) => {
				const socketIndex = Number(socketIndexStr);
				const plugHashes = plugStates.map(p => p.plugItemHash);

				perks[socketIndex] = plugHashes;
			});

			// ステータス
			const statsComp = gearItemComponents.stats[idx];
			const stats = Object.values(statsComp.stats).map(s => ({
				hash: s.statHash,
				value: s.value
			}));

			gearItems.exotics.randomRollWeapons.push({
				hash,
				stats,
				exoticPerkHash: exoticPerkHash ?? 0,
				costs: i.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? [],
				perks
			});
		} else if (isWeaponCategory(categoryHash)) {
			// その他の武器
			const def = itemDefs[hash];
			if (!def) return;

			const weaponPerkSocketCategories = def.sockets.socketCategories?.find(sc => isWeaponPerkSocketCategory(sc.socketCategoryHash))?.socketIndexes;
			const frameSocketIndex = def.sockets?.socketEntries.findIndex(se => se && isWeaponFrameSocket(se.socketTypeHash));
			const masterworkSocketIndex = def.sockets?.socketEntries.findIndex(se => se && isMasterworkSocket(se.socketTypeHash));
			const killTrackerSocketIndex = def.sockets?.socketEntries.findIndex(se => se && isKillTrackerSocket(se.socketTypeHash));

			// 特性
			const perks: { [index: number]: number[] } = {};
			const plugs = gearItemComponents.reusablePlugs[idx]?.plugs;
			const frameHash = gearItemComponents.sockets[idx]?.sockets[frameSocketIndex ?? -1]?.plugHash;
			const masterworkHash = gearItemComponents.sockets[idx]?.sockets[masterworkSocketIndex ?? -1]?.plugHash;

			if (plugs) {
				Object.entries(plugs).forEach(([socketIndexStr, plugStates]) => {
					const socketIndex = Number(socketIndexStr);
					if (!weaponPerkSocketCategories?.includes(socketIndex) || socketIndex === killTrackerSocketIndex) return;

					const plugHashes = plugStates.map(p => p.plugItemHash);
					perks[socketIndex] = plugHashes;
				});
			}

			gearItems.weapons.weapons.push({
				hash,
				index: idx,
				costs: i.costs?.map(c => ({
					hash: c.itemHash,
					quantity: c.quantity
				})) ?? [],
				perks,
				frameHash: frameHash && isWeaponFrameSocket(def.sockets.socketEntries[frameSocketIndex]?.socketTypeHash) ? frameHash : undefined,
				masterworkHash: masterworkHash && isMasterworkSocket(def.sockets.socketEntries[masterworkSocketIndex]?.socketTypeHash) ? masterworkHash : undefined
			});
		}
	});

	// オファー
	const offerItems: XurData["offerItems"] = {
		weeklyItems: [],
		generalItems: []
	};

	offersVendorSaleItems.forEach(i => {
		const hash = i.itemHash;
		if (!hash) return; // アイテム定義がない場合はスキップ

		const data = {
			hash: hash,
			quantity: i.quantity,
			costs: i.costs?.map(c => ({
				hash: c.itemHash,
				quantity: c.quantity
			})) ?? []
		};

		// 週替り雑貨
		if (weeklyItemIndexes?.includes(i.vendorItemIndex)) {
			offerItems.weeklyItems.push(data);
		} else {
			offerItems.generalItems.push(data);
		}
	});

	return {
		xurHash: XUR_VENDOR_HASH,
		gearHash: GEAR_VENDOR_HASH,
		offerHash: OFFERS_VENDOR_HASH,
		xurItems,
		gearItems,
		offerItems
	}
}