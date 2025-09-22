import fs from "node:fs/promises";
import path from "node:path";
import { PortalViewData, toPortalViewData } from "@domain/adapter/portal";
import { GroupedFocusedSets } from "typeOriginal";
import { htmlPagesToPNGs, nameFor } from "@front/templates/renderHTML";
import { renderPortalHTML } from "@front/templates/portal";
import { getCurrentSeasonPass } from "@domain/getCurrentSeasonPass";
import { getCommonSettings } from "@api/bungie/getCommonSettings";
import { getImageRatio } from "@front/utils";

export async function buildPortalCards(
  grouped: GroupedFocusedSets,
  opts?: {
    dateISO?: string;                 // 省略時は今日
    mode?: "preview" | "prod";        // 省略時は NODE_ENV / PREVIEW から推定
    previewDir?: string;              // 既定 ".preview"
		getDef: <T>(type: "Activity" | "InventoryItem" | "DamageType" | "ActivityType", hash: number) => Promise<T>              // 必須：定義リゾルバ
  }
): Promise<
  | { mode: "preview"; written: string[] }
  | { mode: "prod"; groups: { group: PortalViewData["group"]; images: Buffer[] }[] }
> {
  const dateISO = opts?.dateISO ?? new Date().toISOString().slice(0, 10);
  const mode = opts?.mode ?? (process.env.PREVIEW ? "preview" : (process.env.NODE_ENV === "development" ? "preview" : "prod"));
  const previewDir = opts?.previewDir ?? ".preview";
  const getDef = opts?.getDef;

  if (!getDef) throw new Error("getDef is required");

	const settings = await getCommonSettings();
	if (!settings) throw new Error("destiny2 settings not found");

  const views = await toPortalViewData(grouped, getDef, dateISO);

	const currentSeasonPass = await getCurrentSeasonPass();
	const bgUrl = currentSeasonPass?.images.themeBackgroundImagePath ?? undefined;
	const bgUrlFull = bgUrl ? `https://www.bungie.net${bgUrl}` : undefined;

	const bgRatio = bgUrlFull ? await getImageRatio(bgUrlFull) : undefined;

  if (mode === "preview") {
    await fs.mkdir(previewDir, { recursive: true });
    const written: string[] = [];
    for (const v of views) {
      const htmls = renderPortalHTML(v, settings, bgUrlFull, bgRatio);
      for (let i = 0; i < htmls.length; i++) {
        const filename = nameFor(dateISO, v.group, i, htmls.length, "html");
        const full = path.join(previewDir, filename);
        await fs.writeFile(full, htmls[i], "utf-8");
        written.push(full);
      }
    }
    return { mode: "preview", written };
  }

  // prod: PNG buffers を返す
  const groups: { group: PortalViewData["group"]; images: Buffer[] }[] = [];
  for (const v of views) {
    const htmls = renderPortalHTML(v, settings, bgUrlFull, bgRatio);
    const pngs = await htmlPagesToPNGs(htmls, 1200);
    groups.push({ group: v.group, images: pngs });
  }
  return { mode: "prod", groups };
}