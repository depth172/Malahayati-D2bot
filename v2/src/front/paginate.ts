export function paginateActivities<T>(acts: T[], per: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < acts.length; i += per) out.push(acts.slice(i, i + per));
  return out;
}