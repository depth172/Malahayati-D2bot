import fs from "node:fs/promises";
import path from "node:path";
import { htmlPagesToPNGs, nameFor } from "@front/templates/renderHTML";
import { getCommonSettings } from "@api/bungie/getCommonSettings";
import { getImageRatio } from "@front/utils";
import { DestinyInventoryItemConstantsDefinition } from "type";
import { toEververseViewData } from "@domain/adapter/eververse";
import { EververseData } from "@domain/fetcher/eververse";
import { renderEververseHTML } from "@front/templates/eververse";

export async function buildEververseCard(
	eververseData: EververseData,
  opts?: {
    dateISO?: string;                 // 省略時は今日
    mode?: "preview" | "prod";        // 省略時は NODE_ENV / PREVIEW から推定
    previewDir?: string;              // 既定 ".preview"
		getDef: <T>(type: "InventoryItem" | "Vendor" | "PlugSet" | "DamageType" | "InventoryItemConstants", hash: number) => Promise<T>              // 必須：定義リゾルバ
  }
): Promise<
  | { mode: "preview"; written: string[] }
  | { mode: "prod"; images: Buffer[] }
> {
  const dateISO = opts?.dateISO ?? new Date().toISOString().slice(0, 10);
  const mode = opts?.mode ?? (process.env.PREVIEW ? "preview" : (process.env.NODE_ENV === "development" ? "preview" : "prod"));
  const previewDir = opts?.previewDir ?? ".preview";
  const getDef = opts?.getDef;

  if (!getDef) throw new Error("getDef is required");

	const settings = await getCommonSettings();
	if (!settings) throw new Error("destiny2 settings not found");

	const constant = await getDef<DestinyInventoryItemConstantsDefinition>("InventoryItemConstants", 1);

  const data = await toEververseViewData(eververseData, getDef);

	const bgUrlFull = `https://www.bungie.net${data.background}`;

	const bgRatio = bgUrlFull ? await getImageRatio(bgUrlFull) : undefined;

  if (mode === "preview") {
    await fs.mkdir(previewDir, { recursive: true });
    const written: string[] = [];
		const htmls = renderEververseHTML(data, settings, constant, bgUrlFull, bgRatio);
		for (let i = 0; i < htmls.length; i++) {
			const filename = nameFor(dateISO, "eververse", "brightdust", i, htmls.length, "html");
			const full = path.join(previewDir, filename);
			await fs.writeFile(full, htmls[i], "utf-8");
			written.push(full);
		}
    return { mode: "preview", written };
  }

  // prod: PNG buffers を返す
	try {
		const htmls = renderEververseHTML(data, settings, constant, bgUrlFull, bgRatio);
		const pngs = await htmlPagesToPNGs(htmls, 1200);
		return { mode: "prod", images: pngs };
	} catch (e) {
		console.error(`Error generating Banshee page:`, e);
		throw e;
	}
}