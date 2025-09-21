export type BungieTokenPayload = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  scope?: string;
  expires_at: number;
  refresh_expires_at: number;
  membership_id?: string;
};

export type FocusedSet = {
	[activitiyHash: number]: number[];
};

type activityGroup = "solo" | "fireteam" | "pinnacle" | "crucible" | "other";

export type GroupedFocusedSets = {
	[group in activityGroup]: FocusedSet;
};