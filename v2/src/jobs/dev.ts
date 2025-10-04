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

		// データ取得
		console.log("データの取得を行います...");
    const [portalData, xurData] = await Promise.all([
      getPortalData(getCharacter, getDefinition),
      isXur ? getXurData(getDefinition, getVendor) : Promise.resolve(null),
    ]);
		
		// 表示用定義リゾルバ
    const [portalRes, xurRes] = await Promise.allSettled([
      buildPortalCards(portalData, { mode: "preview", getDef: getDefinition }),
      isXur ? buildXurCards(xurData!, { mode: "preview", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
    ]);

		// 結果の処理
		if (portalRes.status === "rejected") {
			throw portalRes.reason;
		}
		if (xurRes.status === "rejected") {
			throw xurRes.reason;
		}

		if (portalRes.status === "fulfilled") console.log(portalRes.value);
		if (xurRes.status === "fulfilled") console.log(xurRes.value);

  } catch (e) {
    console.error("run() でエラーが発生:", e);
    throw e; // エラーを上位に投げてリトライ対象にする
  } finally {
    try { 
      await redis.quit(); 
    } catch (_) {
      // Redis終了エラーは無視
    }
  }
}

run()