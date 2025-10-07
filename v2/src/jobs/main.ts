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
import { makeThread, makeTweetWithImages } from '@api/twitter/tweet';
import createDataHash from '@domain/createHash';
import { closeBrowser } from '@front/templates/renderHTML';
import { getBansheeFocusItemData, getBansheeSellWeaponData } from '@domain/fetcher/banshee';
import { buildBansheeFocusCard, buildBansheeSellWeaponCards } from '@front/jobs/banshee';
import { getEververseData } from '@domain/fetcher/eververse';
import { buildEververseCard } from '@front/jobs/eververse';

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
    const [portalData, xurData, bansheeSellData, bansheeFocusData, eververseData] = await Promise.all([
      getPortalData(getCharacter, getDefinition),
      isXur ? getXurData(getDefinition, getVendor) : Promise.resolve(null),
      getBansheeSellWeaponData(getDefinition, getVendor),
      getBansheeFocusItemData(getDefinition, getVendor),
      getEververseData(getDefinition, getVendor)
    ]);

    // 差分検知
    const portalHash = createDataHash(portalData);
    const lastPortalHash = await redis.get('portal_data_hash');
    const portalChanged = portalHash !== lastPortalHash;
		if (portalChanged) console.log("ポータルのデータに変更があります。");

    const xurHash = isXur && xurData ? createDataHash(xurData) : undefined;
    const lastXurHash = isXur ? await redis.get('xur_data_hash') : undefined;
    const xurChanged = isXur ? (xurHash !== lastXurHash) : false;
		if (xurChanged) console.log("シュールのデータに変更があります。");

		const bansheeSellHash = createDataHash(bansheeSellData);
		const lastBansheeSellHash = await redis.get('banshee_sell_data_hash');
		const bansheeSellChanged = bansheeSellHash !== lastBansheeSellHash;
		if (bansheeSellChanged) console.log("バンシーの販売武器データに変更があります。");

		const bansheeFocusHash = createDataHash(bansheeFocusData);
		const lastBansheeFocusHash = await redis.get('banshee_focus_data_hash');
		const bansheeFocusChanged = bansheeFocusHash !== lastBansheeFocusHash;
		if (bansheeFocusChanged) console.log("バンシーの集束化解読データに変更があります。");

		const eververseHash = createDataHash(eververseData);
		const lastEververseHash = await redis.get('eververse_data_hash');
		const eververseChanged = eververseHash !== lastEververseHash;
		if (eververseChanged) console.log("エバーバースのデータに変更があります。");
		
		// 表示用定義リゾルバ
    const [portalRes, xurRes, bansheeSellRes, bansheeFocusRes, eververseRes] = await Promise.allSettled([
      portalChanged ? buildPortalCards(portalData, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
      xurChanged ? buildXurCards(xurData!, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
			bansheeSellChanged ? buildBansheeSellWeaponCards(bansheeSellData, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
			bansheeFocusChanged ? buildBansheeFocusCard(bansheeFocusData, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] }),
			eververseChanged ? buildEververseCard(eververseData, { mode: "prod", getDef: getDefinition }) : Promise.resolve({ mode: "preview" as const, written: [] })
    ]);

    if (portalChanged || xurChanged || bansheeSellChanged || bansheeFocusChanged || eververseChanged) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;

      const tweetPromises: Promise<any>[] = [];

      if (portalChanged) {
				console.log("ポータルのツイートを準備します...");
        const portalPayload: { text: string, images: Buffer[] } = { text: `【 #ボーナスフォーカス 】${dateStr}\n本日のポータルでのボーナスフォーカス対象アクティビティ情報をお知らせします。#Destiny2 #BungieAPIDev`, images: [] };
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
				
				console.log("ポータルのツイートを投稿します...");
        const portalPromise = makeTweetWithImages(portalPayload).then((threadId) => {
          console.log("ポータルのツイートに成功:", threadId);
          return { type: 'portal', hash: portalHash };
        }).catch((e) => {
          console.error("ポータルのツイートに失敗:", e);
          throw e;
        });
        
        tweetPromises.push(portalPromise);
      }

			if (bansheeSellChanged) {
				console.log("バンシーの販売ツイートを準備します...");
        const bansheeSellPayload: { text: string, images: Buffer[] } = { text: `【 #バンシー44 】${dateStr}\n今週のバンシー44の販売武器情報をお知らせします。#Destiny2 #BungieAPIDev`, images: [] };
        if (bansheeSellRes.status === "fulfilled" && bansheeSellRes.value.mode === "prod") {
          bansheeSellPayload.images.push(...bansheeSellRes.value.images);
        }

				console.log("バンシーの販売ツイートを投稿します...");
        const bansheeSellPromise = makeTweetWithImages(bansheeSellPayload).then((threadId) => {
          console.log("バンシーの販売ツイートに成功:", threadId);
          return { type: 'bansheeSell', hash: bansheeSellHash };
        }).catch((e) => {
          console.error("バンシーの販売ツイートに失敗:", e);
          throw e;
        });

        tweetPromises.push(bansheeSellPromise);
      }

			if (bansheeFocusChanged) {
				console.log("バンシーの集束化解読ツイートを準備します...");
        const bansheeFocusPayload: { text: string, images: Buffer[] } = { text: `【 #バンシー44 】${dateStr}\n本日のバンシー44の集束化解読対象武器情報をお知らせします。#Destiny2 #BungieAPIDev`, images: [] };
        if (bansheeFocusRes.status === "fulfilled" && bansheeFocusRes.value.mode === "prod") {
          bansheeFocusPayload.images.push(...bansheeFocusRes.value.images);
        }

				console.log("バンシーの集束化解読ツイートを投稿します...");
        const bansheeFocusPromise = makeTweetWithImages(bansheeFocusPayload).then((threadId) => {
          console.log("バンシーの集束化解読ツイートに成功:", threadId);
          return { type: 'bansheeFocus', hash: bansheeFocusHash };
        }).catch((e) => {
          console.error("バンシーの集束化解読ツイートに失敗:", e);
          throw e;
        });

        tweetPromises.push(bansheeFocusPromise);
      }

			if (eververseChanged) {
				console.log("エバーバースのツイートを準備します...");
				const everversePayload: { text: string, images: Buffer[] } = { text: `【 #エバーバース 】${dateStr}\n今週のエバーバースの販売アイテム情報をお知らせします。#Destiny2 #BungieAPIDev`, images: [] };
				if (eververseRes.status === "fulfilled" && eververseRes.value.mode === "prod") {
					everversePayload.images.push(...eververseRes.value.images);
				}

				console.log("エバーバースのツイートを投稿します...");
				const everversePromise = makeTweetWithImages(everversePayload).then((threadId) => {
					console.log("エバーバースのツイートに成功:", threadId);
					return { type: 'eververse', hash: eververseHash };
				}).catch((e) => {
					console.error("エバーバースのツイートに失敗:", e);
					throw e;
				});

				tweetPromises.push(everversePromise);
			}

      if (xurChanged) {
				console.log("シュールのツイートを準備します...");
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
                text: `【 #シュール 】${dateStr}\n本日は土曜日です。タワーにシュールが来訪しています。\n\n今週取り扱っているエキゾチック装備と雑貨の情報をお知らせします。#Destiny2 #BungieAPIDev`,
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

				console.log("シュールのツイートを投稿します...");
        const xurPromise = makeThread(xurPayloads).then((threadId) => {
          console.log("シュールのツイートに成功:", threadId);
          return { type: 'xur', hash: xurHash! };
        }).catch((e) => {
          console.error("シュールのツイートに失敗:", e);
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
              } else if (result.value.type === 'bansheeSell') {
                await redis.set('banshee_sell_data_hash', result.value.hash);
              } else if (result.value.type === 'bansheeFocus') {
                await redis.set('banshee_focus_data_hash', result.value.hash);
              } else if (result.value.type === 'eververse') {
								await redis.set('eververse_data_hash', result.value.hash);
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