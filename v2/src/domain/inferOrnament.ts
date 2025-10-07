import { DestinyInventoryItemDefinition, DestinyItemSocketBlockDefinition, DestinyPlugSetDefinition } from "type";
import { isWeaponOrnamentSocketCategory } from "./typeCheck";

// 武器装飾のソケットインデックスを抽出
function filterOrnamentCategoryIndexes(sockets: DestinyItemSocketBlockDefinition): number[] {
	const ornamentCategory = sockets.socketCategories?.find(c => isWeaponOrnamentSocketCategory(c.socketCategoryHash));
	if (ornamentCategory) {
		return ornamentCategory.socketIndexes;
	}
	return [];
}

// ソケットインデックスから装飾のreusablePlugSetHashを抽出
function extractOrnamentPlugHash(idxs: number[], sockets: DestinyItemSocketBlockDefinition): number[] {
	const out: number[] = [];
	for (const idx of idxs) {
		const socket = sockets.socketEntries[idx];
		if (!socket) continue;
		if (typeof socket.reusablePlugSetHash === "number") {
			out.push(socket.reusablePlugSetHash);
		}
	}
	return out;
}

// 装飾のハッシュと全ての武器のRecordから装備可能な武器のハッシュを推論する
export async function inferWeaponOrnament(
	ornamentHash: number,
	weapons: Record<number, DestinyInventoryItemDefinition>,
	getDef: (type: "PlugSet", hash: number) => Promise<DestinyPlugSetDefinition>
): Promise<number[]> {
	const plugHashes: number[] = [];
	const plugDefs: Record<number, DestinyPlugSetDefinition> = {};

	// 全武器の中から、装飾のソケットインデックスを抽出し、reusablePlugSetHashを収集
	for (const w of Object.values(weapons)) {
		const ornamentPlugHashes = extractOrnamentPlugHash(filterOrnamentCategoryIndexes(w.sockets), w.sockets);
		plugHashes.push(...ornamentPlugHashes);
	}

	// 定義取得
	await Promise.all(plugHashes.map(async (h) => {
		if (plugDefs[h]) return;
		plugDefs[h] = await getDef("PlugSet", h);
	}));

	// 装飾のハッシュが含まれるreusablePlugItemsを持つPlugSetを抽出
	const matchPlugs: number[] = [];
	for (const pd of Object.values(plugDefs)) {
		for (const plug of Object.values(pd.reusablePlugItems)) {
			if (plug.plugItemHash === ornamentHash) {
				matchPlugs.push(pd.hash);
			}
		}
	}

	// 抽出したPlugSetを持つ武器を抽出
	const out: number[] = [];
	for (const w of Object.values(weapons)) {
		const ornamentPlugHashes = extractOrnamentPlugHash(filterOrnamentCategoryIndexes(w.sockets), w.sockets);
		for (const plugHash of ornamentPlugHashes) {
			if (matchPlugs.includes(plugHash)) {
				out.push(w.hash);
			}
		}
	}

	return out;
}
