import { DestinyActivityDefinition, DestinyActivityTypeDefinition, DestinyDamageTypeDefinition, DestinyInventoryItemDefinition } from "type";
import type { DisplayableWeapon, GroupedFocusedSets } from "typeOriginal";

type DisplayableActivity = {
	name: string;
	icon: string;
	type: string;
	backgroundImage: string;
	hash: number;
	index: number;
}

export type PortalViewData = {
	dateISO: string;
  group: "solo" | "fireteam" | "pinnacle" | "crucible";
	icon: string;
  activities: {
    activity: DisplayableActivity;
    weapons: DisplayableWeapon[];
  }[];
};

type GetDef = <T>(type: "Activity" | "InventoryItem" | "DamageType" | "ActivityType", hash: number) => Promise<T>;

function dedupeActivities(
  acts: Array<{ activity: DisplayableActivity; weapons: DisplayableWeapon[] }>
) {
  const groups = new Map<string, Array<{ activity: DisplayableActivity; weapons: DisplayableWeapon[] }>>();
  for (const row of acts) {
    const key = row.activity.name;
    (groups.get(key) ?? (groups.set(key, []), groups.get(key)!)).push(row);
  }
  // 各グループで代表のみ残す
  const reps: typeof acts = [];
  for (const arr of groups.values()) {
    arr.sort((x, y) => x.activity.index - y.activity.index);
    reps.push(arr[0]);
  }
  // 表示順の安定化
  reps.sort((x, y) => x.activity.index - y.activity.index);
  return reps;
}

export async function toPortalViewData(
  grouped: GroupedFocusedSets,
  getDef: GetDef,
  dateISO: string
): Promise<PortalViewData[]> {
  const groups: Array<PortalViewData["group"]> = ["solo", "fireteam", "pinnacle", "crucible"];
  const out: PortalViewData[] = [];
  for (const g of groups) {
    const set = grouped[g] ?? {};
    const acts = await Promise.all(
      Object.entries(set).map(async ([aHash, wHashes]) => {
        const activityDef = (await getDef<DestinyActivityDefinition>("Activity", Number(aHash)));
				const activityTypeDef = await getDef<DestinyActivityTypeDefinition>("ActivityType", activityDef.activityTypeHash);

				const activityName = activityDef.originalDisplayProperties.name.startsWith("クイックプレイ") ? "クイックプレイ" : activityDef.originalDisplayProperties.name;

				const activity = {
					name: activityName,
					icon: activityDef.displayProperties.icon,
					type: activityTypeDef.displayProperties.name,
					backgroundImage: activityDef.pgcrImage ?? activityDef.displayProperties.icon ?? "",
					hash: activityDef.hash,
					index: activityDef.index,
				};

				const weaponsDef = await Promise.all(
					wHashes.map(h => getDef<DestinyInventoryItemDefinition>("InventoryItem", h))
				);
				const damageTypesDef = await Promise.all(
					weaponsDef.map(w => w.defaultDamageTypeHash ? getDef<DestinyDamageTypeDefinition>("DamageType", w.defaultDamageTypeHash) : Promise.resolve(undefined))
				);

				const weapons: DisplayableWeapon[] = weaponsDef.map((w, i) => ({
					name: w.displayProperties.name,
					icon: w.displayProperties.icon,
					type: w.itemTypeDisplayName,
					watermark: w.isFeaturedItem ? w.iconWatermarkFeatured : w.iconWatermark,
					hash: w.hash as number,
					damageType: w.defaultDamageTypeHash,
					damageTypeName: damageTypesDef[i]?.displayProperties.name,
					damageTypeIcon: damageTypesDef[i]?.displayProperties.icon,
					ammoType: w.equippingBlock?.ammoType,
				}));

        return { activity, weapons, icon: activityDef.displayProperties.icon };
      })
    );
		const deduped = dedupeActivities(acts);
		if (deduped.length === 0) continue;

    out.push({ group: g, dateISO, icon: deduped[0].activity.icon, activities: deduped });
  }
  return out;
}