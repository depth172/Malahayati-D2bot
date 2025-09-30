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

export type DisplayableItem = {
	name: string;
	icon: string;
	type: string;
	watermark?: string;
	tier?: number;
	hash: number;
}

export type DisplayableWeapon = DisplayableItem & {
	damageType?: number;
	damageTypeName?: string;
	damageTypeIcon?: string;
	ammoType?: number;
};

export type DisplayableStats = {
	stat: {
		name: string;
		icon: string;
		value: number;
		index?: number;
	}[]
	total: number;
}