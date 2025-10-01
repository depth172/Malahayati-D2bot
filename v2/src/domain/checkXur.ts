import { DestinyVendorResponse } from "type";

export async function isXurAvailable(getVendor: (character: number, hash: number, components: number[]) => Promise<DestinyVendorResponse>) {
	const XUR_VENDOR_HASH = 2190858386; // Xur のベンダーハッシュ

	const xurResponses = await Promise.all(
		[0, 1, 2].map(c => getVendor(c, XUR_VENDOR_HASH, [402, 403]))
	);

	return xurResponses.some(r => Object.keys(r.sales?.data ?? {}).length > 0);
}
