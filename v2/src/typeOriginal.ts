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

export type Cost = {
	hash: number;
	quantity: number;
}

export type GearItem = {
	hash: number;
	quantity?: number;
	costs: Cost[];
};

export type GearRandomRollWeapon = GearItem & {
	index?: number;
	perks: {
		[index: number]: number[];
	}
	frameHash?: number;
	masterworkHash?: number;
};

export type DisplayableVendorItem = DisplayableItem & {
	quantity?: number;
	description?: string;
	costs: {
		name: string;
		icon: string;
		quantity: number;
	}[];
};

export type DisplayableVendorWeapon = DisplayableWeapon & {
	costs: {
		name: string;
		icon: string;
		quantity: number;
	}[];
};

export type DisplayableVendorArmor = DisplayableVendorItem & {
	tier: number;
	archetype: {
		name: string;
		icon: string;
	}
	stats: DisplayableStats;
	perk: {
		name: string;
		description: string;
		icon: string;
	}
}

export type DisplayableVendorExoticWeapon = DisplayableVendorWeapon & {
	perks: {
		name: string;
		description: string;
		icon: string;
	}[];
};

export type DisplayableVendorRandomRollExoticWeapon = DisplayableVendorWeapon & {
	exoticPerk: {
		name: string;
		description: string;
		icon: string;
	}
	stats: {
		name: string;
		hash: number;
		value: number;
	}[];
	baseStats: {
		name: string;
		hash: number;
		value: number;
	}[];
	randomPerks: {
		name: string;
		icon: string;
	}[][];
};

export type DisplayableVendorCatalyst = DisplayableVendorItem & {
	stats?: {
		name: string;
		hash: number;
		value: number;
	}[];
	perks: {
		name: string;
		description: string;
		icon: string;
	}[];
};

export type DisplayableVendorRandomRollWeapon = DisplayableVendorWeapon & {
	index?: number;
	perks: string[][];
	frame: {
		name: string;
		icon: string;
	}
	masterwork: {
		baseIcon: string;
		watermark: string;
	}
};