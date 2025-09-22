import { DestinyActivityDefinition, DestinyActivityTypeDefinition, DestinyDamageTypeDefinition, DestinyInventoryItemDefinition } from "type";
import type { GroupedFocusedSets } from "typeOriginal";

export type extendedDestinyInventoryItemDefinition = DestinyInventoryItemDefinition & {
  defaultDamageTypeDef?: DestinyDamageTypeDefinition;
}

type extendedDestinyActivityDefinition = DestinyActivityDefinition & {
	activityTypeDef: DestinyActivityTypeDefinition;
};

export type PortalViewData = {
	dateISO: string;
  group: "solo" | "fireteam" | "pinnacle" | "crucible";
  activities: Array<{
    activity: extendedDestinyActivityDefinition;
    weapons: Array<extendedDestinyInventoryItemDefinition>;
  }>;
};


type GetDef = <T>(type: "Activity" | "InventoryItem" | "DamageType" | "ActivityType", hash: number) => Promise<T>;

function normalizeName(name?: string) {
  if (!name) return "";
  return name
    .replace(/\s*:\s*(マッチメイキング|カスタマイズ)$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}


function canonicalKey(a: extendedDestinyActivityDefinition) {
  // 強い順にキーを積む
  const pgcr = a.pgcrImage ?? "";
  const mode =
    ((a.activityModeTypes as number[] | undefined)?.[0] ?? 0);
  const loc = (a.destinationHash as number | undefined) ?? (a.placeHash as number | undefined) ?? 0;
  const stem = normalizeName(a.displayProperties?.name);
  return JSON.stringify([pgcr, mode, loc, stem]);
}

function isMatchmade(a: extendedDestinyActivityDefinition) {
  // 実フィールドは環境差があるので必要に応じて調整
  // 例: a.matchmaking?.isMatchmade / a.directActivityModeHash 等
  return (a as any)?.matchmaking?.isMatchmade ? 1 : 0;
}

function better(a: extendedDestinyActivityDefinition, b: extendedDestinyActivityDefinition) {
  const am = isMatchmade(a);
  const bm = isMatchmade(b);
  if (am !== bm) return bm - am;             // マッチメイキング優先
  if (a.index !== b.index) return a.index - b.index;
  return (a.hash as number) - (b.hash as number);
}

function dedupeActivities(
  acts: Array<{ activity: extendedDestinyActivityDefinition; weapons: extendedDestinyInventoryItemDefinition[] }>
) {
  const groups = new Map<string, Array<{ activity: extendedDestinyActivityDefinition; weapons: extendedDestinyInventoryItemDefinition[] }>>();
  for (const row of acts) {
    const key = canonicalKey(row.activity);
    (groups.get(key) ?? (groups.set(key, []), groups.get(key)!)).push(row);
  }
  // 各グループで代表のみ残す
  const reps: typeof acts = [];
  for (const arr of groups.values()) {
    arr.sort((x, y) => better(x.activity, y.activity));
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
        const activity = (await getDef<DestinyActivityDefinition>("Activity", Number(aHash)));
				const activityTypeDef = await getDef<DestinyActivityTypeDefinition>("ActivityType", activity.activityTypeHash as number);
				const extendedActivity: extendedDestinyActivityDefinition = {
					...activity,
					activityTypeDef
				};

				const weapons = await Promise.all(
					wHashes.map(h => getDef<DestinyInventoryItemDefinition>("InventoryItem", h))
				);
				const definedDamageTypes = await Promise.all(
					weapons.map(w => w.defaultDamageTypeHash ? getDef<DestinyDamageTypeDefinition>("DamageType", w.defaultDamageTypeHash as number) : Promise.resolve(undefined))
				);
        const weaponsWithDamage = weapons.map((w, i) => {
          const dt = definedDamageTypes[i];
          return {
            ...w,
            defaultDamageTypeDef: dt ?? undefined
          };
        });

        return { activity: extendedActivity, weapons: weaponsWithDamage };
      })
    );
		const deduped = dedupeActivities(acts);
		if (deduped.length === 0) continue;
    out.push({ group: g, dateISO, activities: deduped });
  }
  return out;
}