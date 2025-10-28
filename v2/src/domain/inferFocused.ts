import { DestinyActivity, DestinyActivityDefinition, DestinyActivityRewardItem } from "type";
import { FocusedSet, GroupedFocusedSets } from "typeOriginal";
import { activityGroups } from "assets/activityGroups";

const DAILY_GRIND_STYLE = "daily_grind" as const;

// 例外アイテムでないか
export function isNotException(item: DestinyActivityRewardItem) {
  const exceptions = new Set<number>([
		1077454211, // 死者の祭りボーナスドロップ
	]);
	return !exceptions.has(item.itemQuantity.itemHash as number);
}

// 報酬アイテムがボーナスフォーカスによるものかどうか
export function isFocusedRewardItem(item: DestinyActivityRewardItem) {
  return item.uiStyle.startsWith(DAILY_GRIND_STYLE);
}

// アクティビティがボーナスフォーカス対象かどうか
export function isFocusedActivity(a: DestinyActivity): boolean {
  return !!a.visibleRewards?.some(r => r.rewardItems?.some(isFocusedRewardItem));
}

// アクティビティからボーナスフォーカス対象の装備を抽出する
export function extractFocusedGearFromActivity(activity: DestinyActivity): number[] {
  const out: number[] = [];
  activity.visibleRewards.forEach(reward => {
    reward.rewardItems.forEach(item => {
      if (isFocusedRewardItem(item) && isNotException(item)) {
        const hash = item.itemQuantity.itemHash;
        if (typeof hash === "number") out.push(hash);
      }
    });
  });
  return out;
}

// アクティビティ一覧からボーナスフォーカス対象のアクティビティを抽出する
export function extractFocusedActivities(activities: DestinyActivity[]): DestinyActivity[] {
  return activities.filter(isFocusedActivity);
}

// アクティビティ一覧から FocusedSet を推論する
export function inferFocusedGear(activities: DestinyActivity[]): FocusedSet {
  const focused = extractFocusedActivities(activities);
  const acc = new Map<number, Set<number>>();
  for (const a of focused) {
    const actHash = a.activityHash as number;
    if (!acc.has(actHash)) acc.set(actHash, new Set());
    const set = acc.get(actHash)!;
    for (const gearHash of extractFocusedGearFromActivity(a)) set.add(gearHash);
  }

	const result: FocusedSet = {};
  for (const [actHash, set] of acc) {
		if (set.size === 0) continue;
		result[actHash] = Array.from(set);
	}
  return result;
}

// キャラクターごとに得られた FocusedSet をマージする
export function mergeFocusedSets(sets: FocusedSet[]): FocusedSet {
  const acc = new Map<number, Set<number>>();
  for (const set of sets) {
    for (const [activityHashStr, gearHashes] of Object.entries(set)) {
      const activityHash = Number(activityHashStr);
      if (!acc.has(activityHash)) acc.set(activityHash, new Set());
      const s = acc.get(activityHash)!;
      for (const gearHash of gearHashes) s.add(gearHash);
    }
  }
  const res: FocusedSet = {};
  for (const [hash, set] of acc) res[hash] = Array.from(set);
  return res;
}

// FocusedSet をアクティビティグループごとに分類する
export async function groupFocusedSets(
  set: FocusedSet,
  getDef: (type: string, hash: number) => Promise<DestinyActivityDefinition>
): Promise<GroupedFocusedSets> {
  const grouped: GroupedFocusedSets = { solo: {}, fireteam: {}, pinnacle: {}, crucible: {}, other: {} };

	// set のアクティビティハッシュから定義を取得する
  const activityHashes = Object.keys(set).map(n => Number(n));
  const defs = await Promise.all(activityHashes.map(h => getDef("Activity", h)));
	
	// アクティビティタイプハッシュからグループを特定するためのMapを作成
  const typeToGroup = new Map<number, keyof GroupedFocusedSets>();
  for (const [group, typeHashes] of Object.entries(activityGroups) as [keyof GroupedFocusedSets, number[]][]) {
    for (const t of typeHashes) typeToGroup.set(t, group);
  }

	// 定義をもとにグループ分けする
  for (const def of defs) {
    if (!def) continue;
    const actHash = def.hash;
    const typeHash = def.activityTypeHash;
    const group = typeToGroup.get(typeHash) ?? "other";
    grouped[group][actHash] = set[actHash] ?? [];
  }

	// グループ分けされた結果を返す
  return grouped;
}