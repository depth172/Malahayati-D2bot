import 'dotenv/config';
import { getCharacter } from '@api/bungie/getCharacter';
import { getDefinition } from '@api/bungie/getDefinition';
import { getVendor } from '@api/bungie/getVendor';
import { buildPortalCards } from '@front/jobs/portal';
import { redis } from '@api/redis/redis';
import { buildXurCards } from '@front/jobs/xur';
import { isXurAvailable } from '@domain/checkXur';
import { getXurData } from '@domain/fetcher/xur';
import { getPortalData } from '@domain/fetcher/portal';

async function run() {
  try {
		const isXur = await isXurAvailable(getVendor);

		const [portalData, xurData] = await Promise.all([
			getPortalData(getCharacter, getDefinition),
			isXur ? getXurData(getDefinition, getVendor) : Promise.resolve(null),
		]);

    const [portalRes, xurRes] = await Promise.allSettled([
      buildPortalCards(portalData, { mode: "preview", getDef: getDefinition }),
      isXur ? buildXurCards(xurData!, { mode: "preview", getDef: getDefinition }) : Promise.resolve({ mode: "preview", written: [] }),
    ]);

    if (portalRes.status === "fulfilled") console.log(portalRes.value);
    else console.error(portalRes.reason);

    if (xurRes.status === "fulfilled") console.log(xurRes.value);
    else console.error(xurRes.reason);

  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    try { await redis.quit(); }
    catch (_) {}
  }
}

run();