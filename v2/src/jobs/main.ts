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
  try {
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

    const [portalRes, xurRes] = await Promise.allSettled([
      buildPortalCards(grouped, { mode: "preview", getDef: getDefinition }),
      buildXurCards({ mode: "preview", getDef: getDefinition, getVendor }),
    ]);

    if (portalRes.status === "fulfilled") console.log(portalRes.value);
    else console.error(portalRes.reason);

    if (xurRes.status === "fulfilled") console.log(xurRes.value);
    else console.error(xurRes.reason);

  } catch (e) {
    console.error(e);
    process.exitCode = 1;        // 明示的な exit() は避ける
  } finally {
    try { await redis.quit(); }  // quit は Promise なので await する
    catch (_) {}
  }
}

run();