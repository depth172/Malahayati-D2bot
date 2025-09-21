import { BungieResponse, DestinyVendorResponse, DestinyComponentType } from "type";
import { getValidAccessToken } from "./auth";

enum CharacterClass {
	HUNTER = 0,
	TITAN = 1,
	WARLOCK = 2,
}

// 指定したキャラクターにおけるベンダーの情報を取得する関数
// character は取得するキャラクターのクラス（0: Hunter, 1: Titan, 2: Warlock）
// hash はベンダーのハッシュ値
export async function getVendor(character: CharacterClass, hash: number, components: DestinyComponentType[]) {
	const API_KEY = process.env.B_API_KEY;
	if (!API_KEY) {
		throw new Error('B_API_KEY is not set in environment variables');
	}
	const membershipType = process.env.B_MEMBERSHIP_TYPE;
	const membershipId = process.env.B_MEMBERSHIP_ID;
	const characterId = process.env[`B_CHARACTER_ID_${CharacterClass[character]}`];

	const accessToken = await getValidAccessToken();

	console.log(CharacterClass[character] + "のVendor: " + hash + " の情報を取得します...");

	if (!membershipType || !membershipId || !characterId) {
		throw new Error('B_MEMBERSHIP_TYPE, B_MEMBERSHIP_ID, or B_CHARACTER_ID is not set in environment variables');
	};

	const url = new URL(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/Vendors/${hash}/?lc=ja`);
	if (components.length > 0) {
		url.searchParams.append('components', components.join(','));
	}

	const res = await fetch(url.toString(), {
		headers: {
			'X-API-Key': API_KEY,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': `Bearer ${accessToken}`
		}
	});
	const json = await res.json() as BungieResponse<DestinyVendorResponse>;

	if (!res.ok) {
		console.error('Response:', json);
		throw new Error(`Failed to fetch vendor data: ${res.status} ${res.statusText}`);
	}

	if (json.ErrorCode !== 1) {
		throw new Error(`Failed to fetch vendor data: ${json.ErrorStatus} ${json.Message}`);
	}
	
	return json.Response;
};