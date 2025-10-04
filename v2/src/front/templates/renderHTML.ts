import React from "react";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";

export function renderHTML(children: React.ReactNode) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const cssPath = path.join(__dirname, "style.css");
	const css = fs.readFileSync(cssPath, "utf-8");

  const content = renderToStaticMarkup(children);

	const fontPath = path.join(__dirname, "Destiny_Keys.otf");
	const font = fs.readFileSync(fontPath);
  const fontBase64 = font.toString("base64");

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/modern-normalize/1.1.0/modern-normalize.min.css" integrity="sha512-+n8f3MCd8Yh7p+oz9r+X9g5mZbJ6+q4uF5jOeF2D7v3z6tWjH3yE5fI5c6k6T8K4e4g5F5g5F5g5F5g5F5g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="preconnect" href="https://www.bungie.net" />
	<meta name="viewport" content="width=device-width, initial-scale=2" />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap" rel="stylesheet">
	<title>Document</title>
	<style>
			@font-face {
			font-family: "Destiny_Keys";
			src: url("data:font/otf;base64,${fontBase64}") format("opentype");
        font-weight: normal;
        font-style: normal;
        font-display: block;
		}
		.destiny-font {
			font-family: "Destiny_Keys", sans-serif;
		}
${css}
</style>
</head>
<body>
  <div id="root">${content}</div>
</body>
</html>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));
}

export function chunkByCount<T>(arr: T[], per: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += per) out.push(arr.slice(i, i + per));
  return out;
}

export function nameFor(dateISO: string, type: string, group: string, idx: number, total: number, ext: "html" | "png") {
  const d = dateISO.replace(/-/g, "");
  const base = total > 1
    ? `${d}_${type}_${group}_p${idx + 1}of${total}`
    : `${d}_${type}_${group}`;
  return `${base}.${ext}`;
}

export async function htmlPagesToPNGs(htmls: string[], width = 1200) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 10 } });
  const out: Buffer[] = [];
  for (const html of htmls) {
    await page.setContent(html, { waitUntil: "networkidle" });
    const el = await page.$("#card"); // 要素単位でスクショ
    if (!el) throw new Error("#card not found");
		await page.evaluate(() => (document as any).fonts.ready);
    const buf = await el.screenshot({ type: "png", omitBackground: false }) as Buffer;
    out.push(buf);
  }
  await browser.close();
  return out;
}