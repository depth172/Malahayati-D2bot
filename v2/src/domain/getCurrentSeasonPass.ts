import { getCommonSettings } from "@api/bungie/getCommonSettings";
import { getDefinition } from "@api/bungie/getDefinition";
import { DestinySeasonPassDefinition } from "type";

export async function getCurrentSeasonPass(): Promise<DestinySeasonPassDefinition | undefined> {
	const globalSettings = await getCommonSettings();

	const seasonPassHash = globalSettings.destiny2CoreSettings.currentSeasonPassHash;

	if (!seasonPassHash) {
		console.warn("No current season pass hash found in common settings.");
		return undefined;
	}

	const seasonPass = await getDefinition<DestinySeasonPassDefinition>("SeasonPass", seasonPassHash);

	return seasonPass;
}