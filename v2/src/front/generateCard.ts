import fs from "node:fs/promises";
import path from "node:path";
import { PortalViewData, toPortalViewData } from "@domain/adapter/portal";
import { GroupedFocusedSets } from "typeOriginal";
import { htmlPagesToPNGs, nameFor } from "./templates/renderHTML";
import { renderPortalHTML } from "./templates/portal";
import { getCurrentSeasonPass } from "@domain/getCurrentSeasonPass";
import { request } from "undici";
import { imageSize } from "image-size";
import { getCommonSettings } from "@api/getCommonSettings";

export async function getImageRatio(url: string) {
  const res = await request(url);
  if (res.statusCode !== 200) throw new Error(`failed to fetch ${url}`);
  const buf = Buffer.from(await res.body.arrayBuffer());
  const { width, height } = imageSize(buf);
  if (!width || !height) throw new Error("could not read image size");
  return width / height;
}

export async function buildPortalCards(
  grouped: GroupedFocusedSets,
  opts?: {
    dateISO?: string;                 // 省略時は今日
    per?: number;                     // 1枚あたりの活動数（既定 8）
    mode?: "preview" | "prod";        // 省略時は NODE_ENV / PREVIEW から推定
    previewDir?: string;              // 既定 ".preview"
		getDef: <T>(type: "Activity" | "InventoryItem" | "DamageType", hash: number) => Promise<T>              // 必須：定義リゾルバ
  }
): Promise<
  | { mode: "preview"; written: string[] }
  | { mode: "prod"; groups: { group: PortalViewData["group"]; images: Buffer[] }[] }
> {
  const dateISO = opts?.dateISO ?? new Date().toISOString().slice(0, 10);
  const per = opts?.per ?? 8;
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
      const htmls = renderPortalHTML(v, settings, bgUrlFull, bgRatio, per);
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
    const htmls = renderPortalHTML(v, settings, bgUrlFull, bgRatio, per);
    const pngs = await htmlPagesToPNGs(htmls, 1200);
    groups.push({ group: v.group, images: pngs });
  }
  return { mode: "prod", groups };
}