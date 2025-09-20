export type FocusedSet = {
	[activitiyHash: number]: number[];
};

type activityGroup = "solo" | "fireteam" | "pinnacle" | "crucible" | "other";

export type GroupedFocusedSets = {
	[group in activityGroup]: FocusedSet;
};