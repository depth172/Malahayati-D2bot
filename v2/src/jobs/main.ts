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
import { makeThread } from '@api/twitter/tweet';
import createDataHash from '@domain/createHash';
import { closeBrowser } from '@front/templates/renderHTML';

// 指定時間待機する関数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// リトライ機能付きの実行関数
async function runWithRetry(maxRetries = 3, baseDelayMs = 2 * 60 * 1000): Promise<void> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      await run();
      return; // 成功したら終了
    } catch (error) {
      attempt++;
      console.error(`実行失敗 (試行 ${attempt}/${maxRetries + 1}):`, error);
      
      if (attempt <= maxRetries) {
        // 指数バックオフで待機時間を計算 (2分, 4分, 8分...)
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        const delayMinutes = Math.floor(delayMs / 60000);
        
        console.log(`${delayMinutes}分後にリトライします...`);
        await sleep(delayMs);
      } else {
        console.error("最大リトライ回数に達しました。処理を終了します。");
        process.exitCode = 1;
        throw error;
      }
    }
  }
}

async function run() {
  try {
    const isXur = await isXurAvailable(getVendor);

		// データ取得
		console.log("データの取得を行います...");
    const [portalData, xurData] = await Promise.all([
      getPortalData(getCharacter, getDefinition),
      isXur ? getXurData(getDefinition, getVendor) : Promise.resolve(null),
    ]);

    // 差分検知
    const portalHash = createDataHash(portalData);
    const lastPortalHash = await redis.get('portal_data_hash');

    const portalChanged = portalHash !== lastPortalHash;
		if (portalChanged) console.log("ポータルのデータに変更があります。ツイートを準備します。");

    const xurHash = isXur && xurData ? createDataHash(xurData) : undefined;
    const lastXurHash = isXur ? await redis.get('xur_data_hash') : undefined;

    const xurChanged = isXur ? (xurHash !== lastXurHash) : false;
		if (xurChanged) console.log("シュールのデータに変更があります。ツイートを準備します。");
		
		// 表示用定義リゾルバ
    const [portalRes, xurRes] = await Promise.allSettled([
      portalChanged ? buildPortalCards(portalData, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
      xurChanged ? buildXurCards(xurData!, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
    ]);

    if (portalChanged || xurChanged) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;

      const tweetPromises: Promise<any>[] = [];

      if (portalChanged) {
				console.log("ポータルのツイートを投稿します...");
        const portalPayload: { text: string, images: Buffer[] } = { text: `【${dateStr}】本日のポータルフォーカスアクティビティ情報をお知らせします。#Destiny2 #BungieAPIDev`, images: [] };
        if (portalRes.status === "fulfilled" && portalRes.value.mode === "prod") {
          const groupMap = new Map<string, typeof portalRes.value.groups[0]>();
          for (const group of portalRes.value.groups) {
            groupMap.set(group.group, group);
          }
          const orderedGroups: ("solo" | "fireteam" | "pinnacle" | "crucible")[] = ["solo", "fireteam", "pinnacle", "crucible"];
          const images: Buffer[] = [];
          for (const groupName of orderedGroups) {
            const group = groupMap.get(groupName);
            if (!group) continue;
            images.push(...group.images);
          }
          portalPayload.images.push(...images);
        }
        
        const portalPromise = makeThread([portalPayload]).then((threadId) => {
          console.log("Posted portal thread:", threadId);
          return { type: 'portal', hash: portalHash };
        }).catch((e) => {
          console.error("Failed to post portal thread:", e);
          throw e;
        });
        
        tweetPromises.push(portalPromise);
      }
      
      if (xurChanged) {
				console.log("シュールのツイートを投稿します...");
        const xurPayloads: { text: string, images: Buffer[] }[] = [];
        if (xurRes.status === "fulfilled" && xurRes.value.mode === "prod") {
          const groupMap = new Map<string, typeof xurRes.value.groups[0]>();
          for (const group of xurRes.value.groups) {
            groupMap.set(group.group, group);
          }
          const orderedGroups: ("xur" | "gear" | "offers")[] = ["xur", "gear", "offers"];
          for (const groupName of orderedGroups) {
            const group = groupMap.get(groupName);
            if (!group) continue;
            if (group.group === "xur") {
              xurPayloads.push({
                text: `【${dateStr}】本日は土曜日です。タワーに #シュール が来訪しています。#Destiny2 #BungieAPIDev\n\n今週取り扱っているエキゾチック装備と雑貨は以下の通りです。`,
                images: group.images
              });
            } else if (group.group === "gear") {
              xurPayloads.push({
                text: `＜エキゾチック武器 / レジェンダリー武器＞`,
                images: group.images
              });
            } else if (group.group === "offers") {
              xurPayloads.push({
                text: `＜奇妙なオファー＞`,
                images: group.images
              });
            }
          }
        }

        const xurPromise = makeThread(xurPayloads).then((threadId) => {
          console.log("Posted xur thread:", threadId);
          return { type: 'xur', hash: xurHash! };
        }).catch((e) => {
          console.error("Failed to post xur thread:", e);
          throw e;
        });
        
        tweetPromises.push(xurPromise);
      }

      // 全てのツイートが完了してからハッシュを更新
      if (tweetPromises.length > 0) {
        try {
          const results = await Promise.allSettled(tweetPromises);
          
          // 成功したもののハッシュを更新
          for (const result of results) {
            if (result.status === 'fulfilled') {
              if (result.value.type === 'portal') {
                await redis.set('portal_data_hash', result.value.hash);
              } else if (result.value.type === 'xur') {
                await redis.set('xur_data_hash', result.value.hash);
              }
            }
          }
        } catch (e) {
          console.error("Failed to update hashes:", e);
          throw e; // ハッシュ更新失敗もリトライ対象にする
        } 
      }
    } else {
      console.log("更新がないため、ツイートはスキップされました。");
    }

  } catch (e) {
    console.error("run() でエラーが発生:", e);
    throw e; // エラーを上位に投げてリトライ対象にする
  } finally {
    try { 
			await closeBrowser();
      await redis.quit();
    } catch (_) {
      // Redis終了エラーは無視
    }
  }
}

// メイン実行
runWithRetry(3, 2 * 60 * 1000) // 最大3回リトライ、初回待機2分
  .then(() => {
  })
  .catch((error) => {
    console.error("処理が失敗しました:", error);
    process.exit(1);
  });