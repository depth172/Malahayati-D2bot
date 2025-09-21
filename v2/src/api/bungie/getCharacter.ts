import { BungieResponse, DestinyCharacterResponse, DestinyComponentType } from "type";
import { getValidAccessToken } from "./auth";

enum CharacterClass {
	TITAN = 0,
	HUNTER = 1,
	WARLOCK = 2,
}

// 指定したキャラクターの情報を取得する関数
export async function getCharacter(character: CharacterClass, components: DestinyComponentType[]) {
	const API_KEY = process.env.B_API_KEY;
	if (!API_KEY) {
		throw new Error('B_API_KEY is not set in environment variables');
	}
	const membershipType = process.env.B_MEMBERSHIP_TYPE;
	const membershipId = process.env.B_MEMBERSHIP_ID;
	const characterId = process.env[`B_CHARACTER_ID_${CharacterClass[character]}`];

	const accessToken = await getValidAccessToken();

	console.log(CharacterClass[character] + "のCharacterLive情報を取得します...");

	if (!membershipType || !membershipId || !characterId) {
		throw new Error('B_MEMBERSHIP_TYPE, B_MEMBERSHIP_ID, or B_CHARACTER_ID is not set in environment variables');
	};

	const url = new URL(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/?lc=ja`);
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

	if (!res.ok) {
		console.error('Response:', res);
		throw new Error(`Failed to fetch character data: ${res.status} ${res.statusText}`);
	}

	const json = await res.json() as BungieResponse<DestinyCharacterResponse>;
	if (json.ErrorCode !== 1) {
		throw new Error(`Failed to fetch character data: ${json.ErrorStatus} ${json.Message}`);
	}
	
	return json.Response;
};