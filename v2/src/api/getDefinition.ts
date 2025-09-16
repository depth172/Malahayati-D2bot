import { BungieResponse } from "type";

export async function getDefinition(definitionType: string, hash: number) {
	const API_KEY = process.env.B_API_KEY;
	if (!API_KEY) {
		throw new Error('B_API_KEY is not set in environment variables');
	}

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

	const json = await def.json() as BungieResponse<any>;
	if (json.ErrorCode !== 1) {
		throw new Error(`Failed to fetch definition: ${json.ErrorStatus} ${json.Message}`);
	}

	return json.Response;
}