import imageSize from "image-size";
import { request } from "undici";

export function paginateActivities<T>(acts: T[], per: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < acts.length; i += per) out.push(acts.slice(i, i + per));
  return out;
}

export async function getImageRatio(url: string) {
	const res = await request(url);
	if (res.statusCode !== 200) throw new Error(`failed to fetch ${url}`);
	const buf = Buffer.from(await res.body.arrayBuffer());
	const { width, height } = imageSize(buf);
	if (!width || !height) throw new Error("could not read image size");
	return width / height;
}