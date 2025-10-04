export function isWeaponPerkSocketCategory(socketCategoryHash: number): boolean {
	// 武器パークのソケットカテゴリハッシュ
	const WEAPON_PERK_SOCKET_CATEGORY_HASHES = new Set([
		4241085061, // Weapon Perks
	]);
	return WEAPON_PERK_SOCKET_CATEGORY_HASHES.has(socketCategoryHash);
}

export function isArchetypeSocket(socketTypeHash: number): boolean {
	// アーキタイプのソケットタイプハッシュ
	const ARCHETYPE_SOCKET_TYPE_HASHES = new Set([
		2104613635, // Weapon Archetype Socket Type
		3614673599, // Armor Archetype Socket Type
	]);
	return ARCHETYPE_SOCKET_TYPE_HASHES.has(socketTypeHash);
}

export function isExoticPerkSocket(socketTypeHash: number): boolean {
	// エキゾチックパークのソケットタイプハッシュ
	const EXOTIC_PERK_SOCKET_TYPE_HASHES = new Set([
		3956125808, // Exotic Weapon Perk Socket Type
		965959289, // Exotic Armor Perk Socket Type
	]);
	return EXOTIC_PERK_SOCKET_TYPE_HASHES.has(socketTypeHash);
}

export function isArmorPerkSocket(socketTypeHash: number): boolean {
	// アーマーパークのソケットタイプハッシュ
	const ARMOR_PERK_SOCKET_TYPE_HASHES = new Set([
		965959289, // Armor Perk Socket Type
	]);
	return ARMOR_PERK_SOCKET_TYPE_HASHES.has(socketTypeHash);
}

export function isMasterworkSocket(socketTypeHash: number): boolean {
	// マスターワークのソケットタイプハッシュ
	const MASTERWORK_SOCKET_TYPE_HASHES = new Set([
		2218962841, // Masterwork Socket Type
	]);
	return MASTERWORK_SOCKET_TYPE_HASHES.has(socketTypeHash);
}

export function isKillTrackerSocket(socketTypeHash: number): boolean {
	// キルトラッカーのソケットタイプハッシュ
	const KILL_TRACKER_SOCKET_TYPE_HASHES = new Set([
		1282012138, // Kill Tracker Socket Type
	]);
	return KILL_TRACKER_SOCKET_TYPE_HASHES.has(socketTypeHash);
}

export function isExoticEngramCategory(categoryHash: number): boolean {
	// エキゾチックエングラムのカテゴリハッシュ
	const EXOTIC_ENGRAM_CATEGORY_HASHES = new Set([
		2896368674, // Engram (Exotic)
	]);
	return EXOTIC_ENGRAM_CATEGORY_HASHES.has(categoryHash);
}

export function isWeaponEngramCategory(categoryHash: number): boolean {
	// 武器エングラムのカテゴリハッシュ
	const WEAPON_ENGRAM_CATEGORY_HASHES = new Set([
		82868630, // Engram (Weapon)
	]);
	return WEAPON_ENGRAM_CATEGORY_HASHES.has(categoryHash);
}

export function isExoticWeaponCategory(categoryHash: number): boolean {
	// エキゾチック武器のカテゴリハッシュ
	const EXOTIC_WEAPON_CATEGORY_HASHES = new Set([
		2551490447,
		3300495863
	]);
	return EXOTIC_WEAPON_CATEGORY_HASHES.has(categoryHash);
}

export function isRandomRollExoticCategory(categoryHash: number): boolean {
	// ランダムロールエキゾチックのカテゴリハッシュ
	const RANDOM_ROLL_EXOTIC_CATEGORY_HASHES = new Set([
		921496046, // Random Roll Exotic Weapons
	]);
	return RANDOM_ROLL_EXOTIC_CATEGORY_HASHES.has(categoryHash);
}

export function isCatalystCategory(categoryHash: number): boolean {
	// カタリストのカテゴリハッシュ
	const CATALYST_CATEGORY_HASHES = new Set([
		3525849831, // Catalyst (Exotic)
	]);
	return CATALYST_CATEGORY_HASHES.has(categoryHash);
}

export function isWeaponCategory(categoryHash: number): boolean {
	// 武器のカテゴリハッシュ
	const WEAPON_CATEGORY_HASHES = new Set([
		739721188,
		3089647179,
		2998493651,
	]);
	return WEAPON_CATEGORY_HASHES.has(categoryHash);
}