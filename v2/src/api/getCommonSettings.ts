import { BungieCommonSettings, BungieResponse } from "type";

// 共通設定を取得する関数
// 取得した設定はBungieCommonSettings型のオブジェクトとして返される
export async function getCommonSettings(): Promise<BungieCommonSettings> {
	const API_KEY = process.env.B_API_KEY;
	if (!API_KEY) {
		throw new Error('B_API_KEY is not set in environment variables');
	}

	console.log("共通設定を取得します...");
	
	const res = await fetch('https://www.bungie.net/Platform/Settings/?lc=ja', {
		headers: {
			'X-API-Key': API_KEY
		}
	});
	if (!res.ok) {
		throw new Error(`Failed to fetch common settings: ${res.statusText}`);
	}

	const json = await res.json() as BungieResponse<BungieCommonSettings>;
	if (json.ErrorCode !== 1) {
		throw new Error(`Failed to fetch common settings: ${json.ErrorStatus} ${json.Message}`);
	}

	return json.Response;
};