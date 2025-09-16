// src/domain/inferFocusedWeapons.ts
export type RewardItem = { uiStyle: string; hash: number };

export function inferFocusedWeapons(items: RewardItem[]): number[] {
  return items.filter(i => i.uiStyle === 'daily_grind_guaranteed').map(i => i.hash);
}
