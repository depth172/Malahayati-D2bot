import { DestinyActivity } from "type";
import { FocusedSet } from "typeOriginal";

export function inferFocusedActivities(activities: DestinyActivity[]): DestinyActivity[] {
	return activities.filter(a =>
		a.visibleRewards?.some(reward =>
			reward.rewardItems?.some(item => item.uiStyle === "daily_grind_guaranteed")
		)
	);
}

export function inferFocusedWeapons(activities: DestinyActivity[]): FocusedSet[] {
	const focusedActivities = inferFocusedActivities(activities);
	const focusedSets: FocusedSet[] = [];

	focusedActivities.forEach(activity => {
		activity.visibleRewards?.forEach(reward => {
			reward.rewardItems?.forEach(item => {
				if (item.uiStyle === "daily_grind_guaranteed") {
					focusedSets.push({
						weaponHash: item.itemQuantity.itemHash,
						activityHash: activity.activityHash,
					});
				}
			});
		});
	});

	return focusedSets;
}
