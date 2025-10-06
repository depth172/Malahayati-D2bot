import buildCosts from "@domain/buildCostData";
import { GearRandomRollExoticWeapon, XurData } from "@domain/fetcher/xur";
import { isKillTrackerSocket, isWeaponPerkSocketCategory } from "@domain/typeCheck";
import { DestinyDamageTypeDefinition, DestinyInventoryItemDefinition, DestinyPlugSetDefinition, DestinySandboxPerkDefinition, DestinyStatDefinition, DestinyVendorDefinition } from "type";
import { DisplayableStats, DisplayableVendorArmor, DisplayableVendorCatalyst, DisplayableVendorExoticWeapon, DisplayableVendorItem, DisplayableVendorRandomRollExoticWeapon, DisplayableVendorRandomRollWeapon, GearRandomRollWeapon } from "typeOriginal";

export type XurViewData = {
	date: string;
	background: string;
	xurItems: {
		basicArmors: {
			hunter: DisplayableVendorArmor[];
			titan: DisplayableVendorArmor[];
			warlock: DisplayableVendorArmor[];
		}
		specialItems: (DisplayableVendorItem & {
			description: string;
		})[]
	}
	gearItems: {
		icon: string;
		exotics: {
			engram: DisplayableVendorItem;
			weapons: DisplayableVendorExoticWeapon[];
			catalysts: DisplayableVendorCatalyst[];
			randomRollWeapons: DisplayableVendorRandomRollExoticWeapon[];
		}
		weapons: {
			engram: DisplayableVendorItem;
			weapons: DisplayableVendorRandomRollWeapon[];
		}
	}
	offerItems: {
		icon: string;
		weeklyItems: DisplayableVendorItem[];
		generalItems: DisplayableVendorItem[];
	}
}

// シュールの販売期間（土曜～火曜）を「M月D日～M月D日」の形式で取得
function formatXurDayRange(baseDate = new Date()) {
	const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
	const day = d.getDay();
	const daysSinceSaturday = (day + 1) % 7; // Sun->1, Mon->2, ..., Sat->0
	const sat = new Date(d);
	sat.setDate(d.getDate() - daysSinceSaturday);
	const tue = new Date(sat);
	tue.setDate(sat.getDate() + 3);

	const fmt = (dt: Date) => {
		const y = dt.getFullYear();
		const m = String(dt.getMonth() + 1).padStart(2, "0");
		const d = String(dt.getDate()).padStart(2, "0");
		return `${y}/${m}/${d}`;
	};
	return `${fmt(sat)} 〜 ${fmt(tue)}`;
}

export const toXurViewData = async (
	xurData: XurData,
	getDef: <T>(type: "Vendor" | "InventoryItem" | "Stat" | "SandboxPerk" | "DamageType" | "PlugSet", hash: number) => Promise<T>,
) => {
	const itemDefs: Record<number, DestinyInventoryItemDefinition> = {};
	const vendorDefs: Record<number, DestinyVendorDefinition> = {};
	const statDefs: Record<number, DestinyStatDefinition> = {};
	const damageTypeDefs: Record<number, DestinyDamageTypeDefinition> = {};
	const sandboxPerkDefs: Record<number, DestinySandboxPerkDefinition> = {};

	const itemHashes = new Set<number>();
	const statHashes = new Set<number>();

	// ベンダー定義の取得
	await Promise.all([xurData.xurHash, xurData.gearHash, xurData.offerHash].map(async (h) => {
		if (vendorDefs[h]) return; // 既に取得済みの場合はスキップ
		vendorDefs[h] = await getDef<DestinyVendorDefinition>("Vendor", h);
	}));

	// ## シュール（防具）に関する定義の収集 ##

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	const xurItems = xurData.xurItems;
	xurItems.basicArmors.hunter.forEach(i => {
		itemHashes.add(i.hash);
		itemHashes.add(i.archetypeHash);
		itemHashes.add(i.perkHash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});
	xurItems.basicArmors.titan.forEach(i => {
		itemHashes.add(i.hash);
		itemHashes.add(i.archetypeHash);
		itemHashes.add(i.perkHash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});
	xurItems.basicArmors.warlock.forEach(i => {
		itemHashes.add(i.hash);
		itemHashes.add(i.archetypeHash);
		itemHashes.add(i.perkHash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});

	xurItems.specialItems.forEach(i => {
		itemHashes.add(i.hash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});

	itemHashes.add(xurItems.xenology);

	// ベンダーの販売アイテムに含まれるStatのハッシュを集める
	xurItems.basicArmors.hunter.forEach(i => {
		i.stats.stat.forEach(s => statHashes.add(s.hash));
	});
	xurItems.basicArmors.titan.forEach(i => {
		i.stats.stat.forEach(s => statHashes.add(s.hash));
	});
	xurItems.basicArmors.warlock.forEach(i => {
		i.stats.stat.forEach(s => statHashes.add(s.hash));
	});

	// ## 装備（武器）に関する定義の収集 ##
	const gearItems = xurData.gearItems;

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	itemHashes.add(gearItems.exotics.engram.hash);
	itemHashes.add(gearItems.weapons.engram.hash);
	gearItems.exotics.weapons.forEach(i => {
		itemHashes.add(i.hash);
		i.perkHash.forEach(ph => itemHashes.add(ph));
		i.costs.forEach(c => itemHashes.add(c.hash));
	});
	gearItems.exotics.catalysts.forEach(i => {
		itemHashes.add(i.hash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});
	gearItems.exotics.randomRollWeapons.forEach(i => {
		itemHashes.add(i.hash);
		itemHashes.add(i.exoticPerkHash);
		i.stats.forEach(s => statHashes.add(s.hash));
		i.costs.forEach(c => itemHashes.add(c.hash));
		Object.values(i.perks).flat().forEach(ph => itemHashes.add(ph));
	});
	gearItems.weapons.weapons.forEach(i => {
		itemHashes.add(i.hash);
		if (i.frameHash) itemHashes.add(i.frameHash);
		if (i.masterworkHash) itemHashes.add(i.masterworkHash);
		i.costs.forEach(c => itemHashes.add(c.hash));
		Object.values(i.perks).flat().forEach(ph => itemHashes.add(ph));
	});

	// ## オファー（雑貨）に関する定義の収集 ##
	const offerItems = xurData.offerItems;

	// ベンダーの販売アイテムに含まれるInventoryItemのハッシュを集める
	offerItems.generalItems.forEach(i => {
		itemHashes.add(i.hash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});
	offerItems.weeklyItems.forEach(i => {
		itemHashes.add(i.hash);
		i.costs.forEach(c => itemHashes.add(c.hash));
	});

	// ## 定義の一括取得 ##

	await Promise.all(Array.from(itemHashes).map(async (h) => {
		if (itemDefs[h]) return; // 既に取得済みの場合はスキップ
		itemDefs[h] = await getDef<DestinyInventoryItemDefinition>("InventoryItem", h);
	}));

	await Promise.all(Array.from(statHashes).map(async (h) => {
		if (statDefs[h]) return;
		statDefs[h] = await getDef<DestinyStatDefinition>("Stat", h);
	}));	


	// ## 追加取得が必要な定義 ##

	// 武器のDamageTypeの定義
	const damageTypeHashes = new Set<number>();

	Object.values(gearItems.exotics.weapons).forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) return;

		const dmgTypeHash = itemDef.defaultDamageTypeHash;
		if (dmgTypeHash) damageTypeHashes.add(dmgTypeHash);
	});
	Object.values(gearItems.exotics.randomRollWeapons).forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) return;

		const dmgTypeHash = itemDef.defaultDamageTypeHash;
		if (dmgTypeHash) damageTypeHashes.add(dmgTypeHash);
	});
	Object.values(gearItems.weapons.weapons).forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) return;	

		const dmgTypeHash = itemDef.defaultDamageTypeHash;
		if (dmgTypeHash) damageTypeHashes.add(dmgTypeHash);
	});

	await Promise.all(Array.from(damageTypeHashes).map(async (h) => {
		if (damageTypeDefs[h]) return; // 既に取得済みの場合はスキップ
		damageTypeDefs[h] = await getDef<DestinyDamageTypeDefinition>("DamageType", h);
	}));

	// 媒体に含まれるSandboxPerkの定義
	const catalystHashes = gearItems.exotics.catalysts.map(i => i.hash);

	await Promise.all(catalystHashes.map(async (h) => {
		if (!itemDefs[h]) return; // アイテム定義がない場合はスキップ
		const perks = itemDefs[h].perks;
		if (!perks) return; // パークがない場合はスキップ
		await Promise.all(perks.map(async (p) => {
			if (sandboxPerkDefs[p.perkHash]) return; // 既に取得済みの場合はスキップ
			sandboxPerkDefs[p.perkHash] = await getDef<DestinySandboxPerkDefinition>("SandboxPerk", p.perkHash);
		}));
	}));

	// ## 表示用データに整形 ##

	// シュール
	const xurDisplayItems: XurViewData["xurItems"] = {
		basicArmors: {
			hunter: [],
			titan: [],
			warlock: []
		},
		specialItems: []
	};

	["hunter", "titan", "warlock"].forEach(cls => {
		const armors = xurItems.basicArmors[cls as "hunter" | "titan" | "warlock"];
		const displayItems = armors.map(i => {
			const itemDef = itemDefs[i.hash];
			if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);
			const archetypeDef = itemDefs[i.archetypeHash];
			if (!archetypeDef) throw new Error(`Archetype definition not found for hash: ${i.archetypeHash}`);
			const perkDef = itemDefs[i.perkHash];
			if (!perkDef) throw new Error(`Perk definition not found for hash: ${i.perkHash}`);

			const statRaw = i.stats.stat.map(s => {
				const def = statDefs[s.hash];
				if (!def) throw new Error(`Stat definition not found for hash: ${s.hash}`);

				return { 
					name: def.displayProperties.name,
					icon: def.displayProperties.icon,
					value: s.value,
					index: def.index
				};
			}).sort((a, b) => a.index - b.index);

			const stat = statRaw.map(s => ({ name: s.name, icon: s.icon, value: s.value }));

			const stats: DisplayableStats = {
				stat,
				total: stat.reduce((acc, s) => acc + s.value, 0)
			};

			const costs = buildCosts(i.costs, itemDefs);
			
			return {
				name: itemDef.displayProperties.name,
				type: itemDef.itemTypeDisplayName,
				icon: itemDef.displayProperties.icon,
				watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
				hash: i.hash,
				tier: i.tier ?? 0,
				archetype: {
					name: archetypeDef.displayProperties.name,
					icon: archetypeDef.displayProperties.icon
				},
				stats,
				perk: {
					name: perkDef.displayProperties.name,
					description: perkDef.displayProperties.description,
					icon: perkDef.displayProperties.icon
				},
				costs
			};
		});
		xurDisplayItems.basicArmors[cls as "hunter" | "titan" | "warlock"] = displayItems;
	});

	xurItems.specialItems.forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);
		const costs = buildCosts(i.costs, itemDefs);
		
		xurDisplayItems.specialItems.push({
			name: itemDef.displayProperties.name,
			type: itemDef.itemTypeDisplayName,
			icon: itemDef.displayProperties.icon,
			watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
			hash: i.hash,
			description: itemDef.displayProperties.description,
			costs
		});
	});

	// 装備
	const exoticEngramDef = itemDefs[gearItems.exotics.engram.hash];
	if (!exoticEngramDef) throw new Error(`Item definition not found for hash: ${gearItems.exotics.engram.hash}`);
	const exoticEngram: DisplayableVendorItem = {
		name: exoticEngramDef.displayProperties.name,
		type: exoticEngramDef.itemTypeDisplayName,
		icon: exoticEngramDef.displayProperties.icon,
		hash: gearItems.exotics.engram.hash,
		costs: buildCosts(gearItems.exotics.engram.costs, itemDefs)
	};

	const weaponEngramDef = itemDefs[gearItems.weapons.engram.hash];
	if (!weaponEngramDef) throw new Error(`Item definition not found for hash: ${gearItems.weapons.engram.hash}`);
	const weaponEngram: DisplayableVendorItem = {
		name: weaponEngramDef.displayProperties.name,
		type: weaponEngramDef.itemTypeDisplayName,
		icon: weaponEngramDef.displayProperties.icon,
		hash: gearItems.weapons.engram.hash,
		costs: buildCosts(gearItems.weapons.engram.costs, itemDefs)
	};
	
	const gearDisplayItems: XurViewData["gearItems"] = {
		icon: vendorDefs[xurData.gearHash].displayProperties.icon,
		exotics: {
			engram: exoticEngram,
			weapons: [],
			catalysts: [],
			randomRollWeapons: []
		},
		weapons: {
			engram: weaponEngram,
			weapons: []
		}
	};

	gearItems.exotics.weapons.forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);
		const perkDefs = i.perkHash.map(ph => {
			const pd = itemDefs[ph];
			if (!pd) throw new Error(`Perk definition not found for hash: ${ph}`);
			return pd;
		});
		const perks = perkDefs.map(pd => ({
			name: pd.displayProperties.name,
			description: pd.displayProperties.description,
			icon: pd.displayProperties.icon
		}));
		const costs = buildCosts(i.costs, itemDefs);
		
		gearDisplayItems.exotics.weapons.push({
			name: itemDef.displayProperties.name,
			type: itemDef.itemTypeDisplayName,
			icon: itemDef.displayProperties.icon,
			watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
			hash: i.hash,
			damageType: itemDef.defaultDamageType,
			damageTypeName: itemDef.defaultDamageTypeHash ? (damageTypeDefs[itemDef.defaultDamageTypeHash]?.displayProperties.name ?? "") : "",
			damageTypeIcon: itemDef.defaultDamageTypeHash ? (damageTypeDefs[itemDef.defaultDamageTypeHash]?.displayProperties.icon ?? "") : "",
			ammoType: itemDef.equippingBlock?.ammoType ?? 0,
			perks,
			costs
		});
	});

	gearItems.exotics.catalysts.forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);
		const costs = buildCosts(i.costs, itemDefs);

		const perks = itemDef.perks.map(p => {
			const perkDef = sandboxPerkDefs[p.perkHash];
			if (!perkDef) throw new Error(`SandboxPerk definition not found for hash: ${p.perkHash}`);
			return {
				name: perkDef.displayProperties.name,
				description: perkDef.displayProperties.description,
				icon: perkDef.displayProperties.iconSequences?.[1]?.frames?.[0] ?? perkDef.displayProperties.icon
			};
		}).filter(p => p.icon);

		gearDisplayItems.exotics.catalysts.push({
			name: itemDef.displayProperties.name,
			type: itemDef.itemTypeDisplayName,
			icon: itemDef.displayProperties.icon,
			hash: i.hash,
			perks,
			costs
		});
	});

	const putRandomRollWeapon = async (i: GearRandomRollExoticWeapon | GearRandomRollWeapon) => {
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

		if ("exoticPerkHash" in i) {
			const order = [
				4284893193,
				2961396640,
				447667954,
				3614673599,
				2523465841,
				3085395333,
				2837207746,
				4043523819,
				1240592695,
				1842278586,
				2762071195,
				209426660,
				1591432999,
				155624089,
				943549884,
				3022301683,
				3736848092,
				4188031367,
				1345609583,
				2714457168,
				3555269338,
				1931675084,
				2715839340,
				3871231066,
				925767036
			];
			const exoticPerkHash = i.exoticPerkHash;
			if (!exoticPerkHash) throw new Error(`Exotic perk hash is missing for item hash: ${i.hash}`);
			const exoticPerkDef = itemDefs[exoticPerkHash];
			if (!exoticPerkDef) throw new Error(`Exotic perk definition not found for hash: ${exoticPerkHash}`);

			const stats = i.stats.map(s => {
				const def = statDefs[s.hash];
				if (!def) throw new Error(`Stat definition not found for hash: ${s.hash}`);
				return {
					name: def.displayProperties.name,
					value: s.value,
					hash: s.hash,
				};
			}).sort((a, b) => {
				const ai = order.indexOf(a.hash);
				const bi = order.indexOf(b.hash);
				// orderにない場合は末尾
				return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
			});

			const baseStats = i.stats.map(s => {
				const def = statDefs[s.hash];
				if (!def) throw new Error(`Stat definition not found for hash: ${s.hash}`);
				return {
					name: def.displayProperties.name,
					value: itemDef.stats.stats[s.hash].value,
					hash: s.hash
				};
			}).sort((a, b) => {
				const ai = order.indexOf(a.hash);
				const bi = order.indexOf(b.hash);
				// orderにない場合は末尾
				return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
			});

			const data = {
				name: itemDef.displayProperties.name,
				type: itemDef.itemTypeDisplayName,
				icon: itemDef.displayProperties.icon,
				watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
				hash: i.hash,
				damageType: itemDef.defaultDamageType,
				damageTypeName: itemDef.defaultDamageTypeHash ? (damageTypeDefs[itemDef.defaultDamageTypeHash]?.displayProperties.name ?? "") : "",
				damageTypeIcon: itemDef.defaultDamageTypeHash ? (damageTypeDefs[itemDef.defaultDamageTypeHash]?.displayProperties.icon ?? "") : "",
				ammoType: itemDef.equippingBlock?.ammoType ?? 0,
				exoticPerk: {
					name: exoticPerkDef.displayProperties.name,
					description: exoticPerkDef.displayProperties.description,
					icon: exoticPerkDef.displayProperties.icon
				},
				stats,
				baseStats,
				randomPerks,
				costs
			};

			gearDisplayItems.exotics.randomRollWeapons.push(data);

		} else {
			const frameDef = i.frameHash ? itemDefs[i.frameHash] : null;
			const masterworkDef = i.masterworkHash ? itemDefs[i.masterworkHash] : null;
			const data = {
				name: itemDef.displayProperties.name,
				type: itemDef.itemTypeDisplayName,
				icon: itemDef.displayProperties.icon,
				watermark: itemDef.isFeaturedItem ? itemDef.iconWatermarkFeatured : itemDef.iconWatermark,
				hash: i.hash,
				index: "index" in i ? i.index : undefined,
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

			gearDisplayItems.weapons.weapons.push(data);
		}

	};

	await Promise.all(gearItems.exotics.randomRollWeapons.map(i => putRandomRollWeapon(i)));
	await Promise.all(gearItems.weapons.weapons.map(i => putRandomRollWeapon(i)));
	gearDisplayItems.weapons.weapons.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

	// オファー
	const offerDisplayItems: XurViewData["offerItems"] = {
		icon: vendorDefs[xurData.offerHash].displayProperties.icon,
		weeklyItems: [],
		generalItems: []
	};
	offerItems.weeklyItems.forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);
		const costs = buildCosts(i.costs, itemDefs);
		const data = {
			name: itemDef.displayProperties.name,
			type: itemDef.itemTypeDisplayName,
			icon: itemDef.displayProperties.icon,
			description: itemDef.displayProperties.description,
			hash: i.hash,
			quantity: i.quantity,
			costs
		};
		offerDisplayItems.weeklyItems.push(data);
	});

	offerItems.generalItems.forEach(i => {
		const itemDef = itemDefs[i.hash];
		if (!itemDef) throw new Error(`Item definition not found for hash: ${i.hash}`);
		const costs = buildCosts(i.costs, itemDefs);
		const description = i.hash === 4032296272 ? 
			itemDef.displayProperties.description + "\n" + vendorDefs[xurData.offerHash].failureStrings[1] :
			itemDef.displayProperties.description;
		const data = {
			name: itemDef.displayProperties.name,
			type: itemDef.itemTypeDisplayName,
			icon: itemDef.displayProperties.icon,
			description,
			hash: i.hash,
			costs
		};
		offerDisplayItems.generalItems.push(data);
	});

	return {
		date: formatXurDayRange(),
		background: vendorDefs[xurData.xurHash].locations?.[0]?.backgroundImagePath,
		xurItems: xurDisplayItems,
		gearItems: gearDisplayItems,
		offerItems: offerDisplayItems
	};
}