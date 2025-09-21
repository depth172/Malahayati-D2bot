import { BungieResponse } from "type";

const definitionCache = new Map<string, any>();

// Destinyの各種定義を取得する汎用関数
// 取得した定義はキャッシュされ、同じtypeとhashの組み合わせで再度呼び出された場合はキャッシュから返される
// Tは返される定義の型を表すジェネリック型パラメータ
// definitionTypeは"Activity"や"InventoryItem"などのDestiny定義の種類を表す文字列
// hashは取得したい定義のハッシュ値を表す数値
export async function getDefinition<T>(definitionType: string, hash: number) {
	const API_KEY = process.env.B_API_KEY;
	if (!API_KEY) {
		throw new Error('B_API_KEY is not set in environment variables');
	}

	const cacheKey = `${definitionType}:${hash}`;
	if (definitionCache.has(cacheKey)) {
		return definitionCache.get(cacheKey) as T;
	}

	console.log(`Destiny${definitionType}Definition: ${hash} の静的データを取得します...`);

	const def = await fetch(`https://www.bungie.net/Platform/Destiny2/Manifest/Destiny${definitionType}Definition/${hash}/?lc=ja`, {
		headers: {
			'X-API-Key': API_KEY,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
	});
	if (!def.ok) {
		throw new Error(`Failed to fetch definition: ${def.status} ${def.statusText}`);
	}

	const json = await def.json() as BungieResponse<T>;
	if (json.ErrorCode !== 1) {
		throw new Error(`Failed to fetch definition: ${json.ErrorStatus} ${json.Message}`);
	}

	definitionCache.set(cacheKey, json.Response);

	return json.Response;
}