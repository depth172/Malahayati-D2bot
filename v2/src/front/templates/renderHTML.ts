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

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/modern-normalize/1.1.0/modern-normalize.min.css" integrity="sha512-+n8f3MCd8Yh7p+oz9r+X9g5mZbJ6+q4uF5jOeF2D7v3z6tWjH3yE5fI5c6k6T8K4e4g5F5g5F5g5F5g5F5g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <style>${css}</style>
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

export function nameFor(dateISO: string, group: string, idx: number, total: number, ext: "html" | "png") {
  const d = dateISO.replace(/-/g, "");
  const base = total > 1
    ? `${d}_portal_${group}_p${idx + 1}of${total}`
    : `${d}_portal_${group}`;
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
    const buf = await el.screenshot({ type: "png", omitBackground: false }) as Buffer;
    out.push(buf);
  }
  await browser.close();
  return out;
}