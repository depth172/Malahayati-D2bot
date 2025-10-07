import { BungieResponse, DestinyManifest } from "type";

// Destinyの各種定義に含まれるエントリを全て取得する関数
// 取得した定義はキャッシュされ、同じtypeとhashの組み合わせで再度呼び出された場合はキャッシュから返される
// Tは返される定義の型を表すジェネリック型パラメータ
// definitionTypeは"Activity"や"InventoryItem"などのDestiny定義の種類を表す文字列
// hashは取得したい定義のハッシュ値を表す数値
export async function getAllDefinition<T>(definitionType: string, filter: (item: T) => boolean = () => true): Promise<Record<number, T>> {
	const API_KEY = process.env.B_API_KEY;
	if (!API_KEY) {
		throw new Error('B_API_KEY is not set in environment variables');
	}

	const manifest = await fetch(`https://www.bungie.net/Platform/Destiny2/Manifest/?lc=ja`, {
		headers: {
			'X-API-Key': API_KEY,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
	});

	const manifestData = await manifest.json() as BungieResponse<DestinyManifest>;
	if (manifestData.ErrorCode !== 1) {
		throw new Error(`Failed to fetch definition: ${manifestData.ErrorStatus} ${manifestData.Message}`);
	}

	const definitionUrl = manifestData.Response.jsonWorldComponentContentPaths.ja[`Destiny${definitionType}Definition`];
	if (!definitionUrl) {
		throw new Error(`Definition type ${definitionType} not found in manifest`);
	}

	const def = await fetch(`https://www.bungie.net${definitionUrl}`, {
		headers: {
			'Content-Type': 'application/json'
		},
		cache: 'no-store'
	});
	const json = await def.json() as Record<number, T>;
	const filtered = Object.fromEntries(Object.entries(json).filter(([_, item]) => filter(item)));

	return filtered;
}