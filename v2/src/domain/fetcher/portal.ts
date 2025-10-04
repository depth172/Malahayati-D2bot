import { groupFocusedSets, inferFocusedGear, mergeFocusedSets } from "@domain/inferFocused";
import { DestinyCharacterResponse, DestinyComponentType as T } from "type";

export async function getPortalData(getCharacter: (characterId: number, components: T[]) => Promise<DestinyCharacterResponse>, getDefinition: <T>(type: string, hash: number) => Promise<T>) {
	const inputs = await Promise.all([
		getCharacter(0, [T.CharacterActivities]),
		getCharacter(1, [T.CharacterActivities]),
		getCharacter(2, [T.CharacterActivities]),
	]);

	const results = inputs.map(input => {
		const activities = Object.values(input.activities?.data.availableActivities || {});
		return inferFocusedGear(activities);
	});

	const merged = mergeFocusedSets(results);
	const grouped = await groupFocusedSets(merged, getDefinition);
	
	return grouped;
}