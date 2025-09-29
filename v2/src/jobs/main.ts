import 'dotenv/config';
import { getCharacter } from '@api/bungie/getCharacter';
import { getDefinition } from '@api/bungie/getDefinition';
import { getVendor } from '@api/bungie/getVendor';
import { groupFocusedSets, inferFocusedGear, mergeFocusedSets } from '@domain/inferFocused';
import { buildPortalCards } from '@front/jobs/portal';
import { DestinyComponentType as T } from 'type';
import { redis } from '@api/redis/redis';
import { buildXurCards } from '@front/jobs/xur';

async function run() {
	const inputs = await Promise.all([
		getCharacter(0, [T.CharacterActivities]), // Hunter
		getCharacter(1, [T.CharacterActivities]), // Titan
		getCharacter(2, [T.CharacterActivities]), // Warlock
	]);

	const results = inputs.map(input => {
		const activities = Object.values(input.activities?.data.availableActivities || {});
		return inferFocusedGear(activities);
	});

	const mergedResult = mergeFocusedSets(results);

	const result = await groupFocusedSets(mergedResult, getDefinition);
	
	await buildPortalCards(result, { mode: "preview", getDef: getDefinition }).then(r => {
		console.log(r);
	}).catch(e => {
		console.error(e);
	});

	await buildXurCards({ mode: "preview", getDef: getDefinition, getVendor }).then(r => {
		console.log(r);
	}).catch(e => {
		console.error(e);
	});
}

run()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => {
		redis.quit();
	});