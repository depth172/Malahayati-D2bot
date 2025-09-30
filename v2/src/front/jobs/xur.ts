import fs from "node:fs/promises";
import path from "node:path";
import { htmlPagesToPNGs, nameFor } from "@front/templates/renderHTML";
import { getCommonSettings } from "@api/bungie/getCommonSettings";
import { getImageRatio } from "@front/utils";
import { getXurViewData } from "@domain/adapter/xur";
import { renderXurHTML } from "@front/templates/xur";
import { DestinyInventoryItemConstantsDefinition, DestinyVendorResponse } from "type";

export async function buildXurCards(
  opts?: {
    dateISO?: string;                 // 省略時は今日
    mode?: "preview" | "prod";        // 省略時は NODE_ENV / PREVIEW から推定
    previewDir?: string;              // 既定 ".preview"
		getDef: <T>(type: "InventoryItem" | "Vendor" | "Stat" | "SandboxPerk" | "InventoryItemConstants", hash: number) => Promise<T>              // 必須：定義リゾルバ
		getVendor: (character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>  // 必須：ベンダーリクエスタ
  }
): Promise<
  | { mode: "preview"; written: string[] }
  | { mode: "prod"; groups: { group: "xur" | "gear" | "offers"; images: Buffer[] }[] }
> {
	const pages = ["xur", "gear", "offers"] as const;

  const dateISO = opts?.dateISO ?? new Date().toISOString().slice(0, 10);
  const mode = opts?.mode ?? (process.env.PREVIEW ? "preview" : (process.env.NODE_ENV === "development" ? "preview" : "prod"));
  const previewDir = opts?.previewDir ?? ".preview";
  const getDef = opts?.getDef;
	const getVendor = opts?.getVendor;

  if (!getDef) throw new Error("getDef is required");
	if (!getVendor) throw new Error("getVendor is required");

	const settings = await getCommonSettings();
	if (!settings) throw new Error("destiny2 settings not found");

	const constant = await getDef<DestinyInventoryItemConstantsDefinition>("InventoryItemConstants", 1);
	
  const data = await getXurViewData(getDef, getVendor);

	const bgUrlFull = `https://www.bungie.net${data.background}`;

	const bgRatio = bgUrlFull ? await getImageRatio(bgUrlFull) : undefined;

  if (mode === "preview") {
    await fs.mkdir(previewDir, { recursive: true });
    const written: string[] = [];
    for (const p of pages) {
      const htmls = renderXurHTML(data, settings, constant, p, bgUrlFull, bgRatio);
      for (let i = 0; i < htmls.length; i++) {
        const filename = nameFor(dateISO, "xur", p, i, htmls.length, "html");
        const full = path.join(previewDir, filename);
        await fs.writeFile(full, htmls[i], "utf-8");
        written.push(full);
      }
    }
    return { mode: "preview", written };
  }

  // prod: PNG buffers を返す
  const groups: { group: "xur" | "gear" | "offers"; images: Buffer[] }[] = [];
  for (const p of pages) {
    const htmls = renderXurHTML(data, settings, constant, p, bgUrlFull, bgRatio);
    const pngs = await htmlPagesToPNGs(htmls, 1200);
    groups.push({ group: p, images: pngs });
  }
  return { mode: "prod", groups };
}