export type BungieResponse<T> = {
	Response: T;
	ErrorCode: number;
	ErrorStatus: string;
	Message: string;
	MessageData: Record<string, string>;
	ThrottleSeconds: number;
	DetailedErrorTrace?: string;
}

export enum DestinyComponentType {
	None = 0,
	Profiles = 100,
	VendorReceipts = 101,
	ProfileInventories = 102,
	ProfileCurrencies = 103,
	ProfileProgression = 104,
	PlatformSilver = 105,
	Characters = 200,
	CharacterInventories = 201,
	CharacterProgressions = 202,
	CharacterRenderData = 203,
	CharacterActivities = 204,
	CharacterEquipment = 205,
	CharacterLoadouts = 206,
	ItemInstances = 300,
	ItemObjectives = 301,
	ItemPerks = 302,
	ItemRenderData = 303,
	ItemStats = 304,
	ItemSockets = 305,
	ItemTalentGrids = 306,
	ItemCommonData = 307,
	ItemPlugStates = 308,
	ItemPlugObjectives = 309,
	ItemReusablePlugs = 310,
	Vendors = 400,
	VendorCategories = 401,
	VendorSales = 402,
	Kiosks = 500,
	CurrencyLookups = 600,
	PresentationNodes = 700,
	Collectibles = 800,
	Records = 900,
	Transitory = 1000,
	Metrics = 1100,
	StringVariables = 1200,
	Craftables = 1300,
	SocialCommendations = 1400
}

export enum DestinyActivityModeType {
	None = 0,
	Story = 2,
	Strike = 3,
	Raid = 4,
	AllPvP = 5,
	Patrol = 6,
	AllPvE = 7,
	Reserved9 = 9,
	Control = 10,
	Reserved11 = 11,
	Clash = 12,
	Reserved13 = 13,
	CrimsonDoubles = 15,
	Nightfall = 16,
	HeroicNightfall = 17,
	AllStrikes = 18,
	IronBanner = 19,
	Reserved20 = 20,
	Reserved21 = 21,
	Reserved22 = 22,
	Reserved24 = 24,
	AllMayhem = 25,
	Reserved26 = 26,
	Reserved27 = 27,
	Reserved28 = 28,
	Reserved29 = 29,
	Reserved30 = 30,
	Supremacy = 31,
	PrivateMatchesAll = 32,
	Survival = 37,
	Countdown = 38,
	TrialsOfTheNine = 39,
	Social = 40,
	TrialsCountdown = 41,
	TrialsSurvival = 42,
	IronBannerControl = 43,
	IronBannerClash = 44,
	IronBannerSupremacy = 45,
	ScoredNightfall = 46,
	ScoredHeroicNightfall = 47,
	Rumble = 48,
	AllDoubles = 49,
	Doubles = 50,
	PrivateMatchesClash = 51,
	PrivateMatchesControl = 52,
	PrivateMatchesSupremacy = 53,
	PrivateMatchesCountdown = 54,
	PrivateMatchesSurvival = 55,
	PrivateMatchesMayhem = 56,
	PrivateMatchesRumble = 57,
	HeroicAdventure = 58,
	Showdown = 59,
	Lockdown = 60,
	Scorched = 61,
	ScorchedTeam = 62,
	Gambit = 63,
	AllPvECompetitive = 64,
	Breakthrough = 65,
	BlackArmoryRun = 66,
	Salvage = 67,
	IronBannerSalvage = 68,
	PvPCompetitive = 69,
	PvPQuickplay = 70,
	ClashQuickplay = 71,
	ClashCompetitive = 72,
	ControlQuickplay = 73,
	ControlCompetitive = 74,
	GambitPrime = 75,
	Reckoning = 76,
	Menagerie = 77,
	VexOffensive = 78,
	NightmareHunt = 79,
	Elimination = 80,
	Momentum = 81,
	Dungeon = 82,
	Sundial = 83,
	TrialsOfOsiris = 84,
	Dares = 85,
	Offensive = 86,
	LostSector = 87,
	Rift = 88,
	ZoneControl = 89,
	IronBannerRift = 90,
	IronBannerZoneControl = 91,
	Relic = 92
};

export enum DestinyBreakerType {
	None = 0,
	ShieldPiercing = 1,
	Disruption = 2,
	Stagger = 3
}

export type DestinyColor = {
	red: number;
	green: number;
	blue: number;
	alpha: number;
};

export type DestinyProgression = {
	progressionHash: number;
	dailyProgress: number;
	dailyLimit: number;
	weeklyProgress: number;
	weeklyLimit: number;
	currentProgress: number;
	level: number;
	levelCap: number;
	progressToNextLevel: number;
	nextLevelAt: number;
	currentResetCount?: number;
	seasonResets: any[];
	rewardItemStates: number;
	rewardItemSocketOverrideStates: any[];
};

export type DestinyFactionProgression = {
	factionHash: number;
	factionVendorIndex: number;
	progressionHash: number;
	dailyProgress: number;
	dailyLimit: number;
	weeklyProgress: number;
	weeklyLimit: number;
	currentProgress: number;
	level: number;
	levelCap: number;
	stepIndex: number;
	progressToNextLevel: number;
	nextLevelAt: number;
	currentResetCount?: number;
	seasonResets: any[];
	rewardItemStates: number;
	rewardItemSocketOverrideStates: any[];
};

export type DestinyObjectiveProgress = {
	objectiveHash: number;
	destinationHash?: number;
	activityHash?: number;
	progress?: number;
	completionValue: number;
	complete: boolean;
	visible: boolean;
};

export type DestinyQuestStatus = {
	questHash: number;
	stepHash: number;
	stepObjectives: DestinyObjectiveProgress[];
	tracked: boolean;
	itemInstanceId: number;
	completed: boolean;
	redeemed: boolean;
	started: boolean;
	vendorHash?: number;
};

export type DestinyMilestoneActivityPhase = {
	complete: boolean;
	phaseHash: number;
};

export type DestinyMilestoneActivityCompletionStatus = {
	completed: boolean;
	phases: DestinyMilestoneActivityPhase[];
};

export type DestinyMilestoneActivityVariant = {
	activityHash: number;
	completionStatus: DestinyMilestoneActivityCompletionStatus;
	activityModeHash?: number;
	activityModeType?: DestinyActivityModeType;
};

export type DestinyMilestoneActivity = {
	activityHash: number;
	activityModeHash?: number;
	activityModeType: DestinyActivityModeType;
	modifierHashes: number[];
	variants: DestinyMilestoneActivityVariant[];
};

export type DestinyChallengeStatus = {
	objective: DestinyObjectiveProgress;
};

export type DestinyMilestoneQuest = {
	questItemHash: number;
	status: DestinyQuestStatus;
	activity: DestinyMilestoneActivity;
	challenges: DestinyChallengeStatus[];
};

export type DestinyMilestoneChallengeActivity = {
	activityHash: number;
	challenges: DestinyChallengeStatus[];
	modifierHashes: number[];
	booleanActivityOptions: Record<number, boolean>;
	loadoutRequirementIndex?: number;
	phases: DestinyMilestoneActivityPhase[];
};

export type DestinyMilestoneVendor = {
	vendorHash: number;
	previewItemHash?: number;
};

export type DestinyMilestoneRewardEntry = {
	rewardEntryHash: number;
	earned: boolean;
	redeemed: boolean;
};

export type DestinyMilestoneRewardCategory = {
	rewardCategoryHash: number;
	entries: DestinyMilestoneRewardEntry[];
};

export type DestinyMilestone = {
	milestoneHash: number;
	availableQuests: DestinyMilestoneQuest[];
	activities: DestinyMilestoneChallengeActivity[];
	values: Record<string, number>;
	vendorHashes: number[];
	vendors: DestinyMilestoneVendor[];
	rewards: DestinyMilestoneRewardCategory[];
	startDate: string;
	endDate: string;
	order: number;
};

export type DestinyItemComponent = {
	itemHash: number;
	itemInstanceId: number;
	quantity: number;
	bindStatus: number;
	location: number;
	bucketHash: number;
	transferStatus: number;
	lockable: boolean;
	state: number;
	overrideStyleItemHash?: number;
	expirationDate?: string;
	isWrapper: boolean;
	tooltipNotificationIndexes: number[];
	metricHash?: number;
	metricObjective: any;
	versionNumber: number;
	itemValueVisibility: boolean[];
};

export type DestinyCharacterComponent = {
	membershipId: number;
	membershipType: number;
	characterId: number;
	dateLastPlayed: string;
	minutesPlayedThisSession: number;
	minutesPlayedTotal: number;
	light: number;
	stats: Record<string, number>;
	raceHash: number;
	genderHash: number;
	classHash: number;
	raceType: number;
	classType: number;
	genderType: number;
	emblemPath: string;
	emblemBackgroundPath: string;
	emblemHash: number;
	emblemColor: DestinyColor;
	levelProgression: DestinyProgression;
	baseCharacterLevel: number;
	percentToNextLevel: number;
	titleRecordHash?: number;
};

export type DestinyPerkReference = {
	perkHash: number;
	iconPath: string;
	isActive: boolean;
	visible: boolean;
};

export type DestinyItemPerksComponent = {
	perks: DestinyPerkReference[];
};

export type DestinyArtifactTierItem = {
	itemHash: number;
	isActive: boolean;
	isVisible: boolean;
};

export type DestinyArtifactTier = {
	tierHash: number;
	isUnlocked: boolean;
	pointsToUnlock: number;
	items: DestinyArtifactTierItem[];
};

export type DestinyArtifactCharacterScoped = {
	artifactHash: number;
	pointsUsed: number;
	resetCount: number;
	tiers: DestinyArtifactTier[];
};

export type DestinyCharacterProgressionComponent = {
	progressions: Record<number, DestinyProgression>;
	factions: Record<number, DestinyFactionProgression>;
	milestones: Record<string, DestinyMilestone>;
	quests: Record<number, DestinyQuestStatus>;
	uninstancedItemObjectives: Record<number, DestinyObjectiveProgress[]>;
	uninstancedItemPerks: Record<number, DestinyItemPerksComponent[]>;
	checklists: {
		[checklistHash: number]: {
			[entryHash: number]: boolean;
		};
	};
	seasonalArtifact: DestinyArtifactCharacterScoped;
};

export type DyeReference = {
	channelHash: number;
	dyeHash: number;
};

export type DestinyCharacterCustomization = {
	personality: number;
	face: number;
	skinColor: number;
	lipColor: number;
	eyeColor: number;
	hairColors: number[];
	featureColors: number[];
	decalColor: number;
	wearHelmet: boolean;
	hairIndex: number;
	featureIndex: number;
	decalIndex: number;
};

export type DestinyItemPeerView = {
	itemHash: number;
	dyes: DyeReference[];
};

export type DestinyCharacterPeerView = {
	equipment: DestinyItemPeerView[];
};

export type DestinyCharacterRenderComponent = {
	customDyes: DyeReference[];
	customization: DestinyCharacterCustomization;
	peerView: DestinyCharacterPeerView;
};

export type DestinyItemQuantity = {
	itemHash: number;
	itemInstanceId?: number;
	quantity: number;
	hasConditionalVisibility: boolean;
};

export type DestinyActivityRewardItem = {
	itemQuantity: DestinyItemQuantity;
	uiStyle: string;
};

export type DestinyActivityRewardMapping = {
	displayBehavior: number;
	rewardItems: DestinyActivityRewardItem[];
};

export type DestinyActivity = {
	activityHash: number;
	isNew: boolean;
	canLead: boolean;
	canJoin: boolean;
	isCompleted: boolean;
	isVisible: boolean;
	displayLevel: number;
	recommendedLight: number;
	difficultyTier: number;
	challenges: DestinyChallengeStatus[];
	modifierHashes: number[];
	booleanActivityOptions: Record<number, boolean>;
	loadoutRequirementIndex?: number;
	visibleRewards: DestinyActivityRewardMapping[];
};

export type DestinyActivityInteractableReference = {
	activityInteractableHash: number;
	activityInteractableElementIndex: number;
};

export type DestinyCharacterActivitiesComponent = {
	dateActivityStarted: string;
	availableActivities: DestinyActivity[];
	availableActivityInteractables: DestinyActivityInteractableReference[];
	currentActivityHash: number;
	currentActivityModeHash: number;
	currentActivityModeType?: DestinyActivityModeType;
	currentActivityModeHashes: number[];
	currentActivityModeTypes: DestinyActivityModeType[];
	currentPlaylistActivityHash?: number;
	lastCompletedStoryHash: number;
};

export type Items_DestinyItemComponent = {
	itemHash: number;
	itemInstanceId?: number;
	quantity: number;
	bindStatus: number;
	location: number;
	bucketHash: number;
	transferStatus: number;
	lockable: boolean;
	state: number;
	overrideStyleItemHash?: number;
	expirationDate?: string;
	isWrapper: boolean;
	tooltipNotificationIndexes: number[];
	metricHash?: number;
	metricObjective: DestinyObjectiveProgress;
	versionNumber?: number;
	itemValueVisibility: boolean[];
};

export type Inventory_DestinyInventoryComponent = {
	items: Items_DestinyItemComponent[];
};

export type DestinyLoadoutItemComponent = {
	itemInstanceId: number;
	plugItemHashes: number[];
};

export type DestinyLoadoutComponent = {
	colorHash: number;
	iconHash: number;
	nameHash: number;
	items: DestinyLoadoutItemComponent[];
};

export type DestinyLoadoutsComponent = {
	loadouts: DestinyLoadoutComponent[];
};

export type DestinyKiosksComponent = {
	kioskItems: Record<number, number[]>;
};

export type DestinyPlugSetsComponent = {
	plugs: {
		[plugSetHash: number]: {
			plugItemHash: number;
			canInsert: boolean;
			enabled: boolean;
		};
	};
};

export type DestinyPresentationNodeComponent = {
	state: number;
	objective: DestinyObjectiveProgress;
	progressValue: number;
	completionValue: number;
	recordCategoryScore?: number;
};

export type DestinyPresentationNodesComponent = {
	nodes: DestinyPresentationNodeComponent[];
};

export type DestinyRecordComponent = {
	state: number;
	objectives: DestinyObjectiveProgress[];
	intervalObjectives: DestinyObjectiveProgress[];
	intervalsRedeemedCount: number;
	completedCount?: number;
	rewardVisibility: boolean[];
};

export type DestinyCharacterRecordsComponent = {
	featuredRecordHashes: number[];
	records: Record<number, DestinyRecordComponent>;
	recordCategoriesRootNodeHash: number;
	recordSealsRootNodeHash: number;
};

export type DestinyCollectibleComponent = {
	state: number;
};

export type DestinyCollectiblesComponent = {
	collectibles: Record<number, DestinyCollectibleComponent>;
	collectionCategoriesRootNodeHash: number;
	collectionBadgesRootNodeHash: number;
};

export type DestinyStat = {
	statHash: number;
	value: number;
};

export type DestinyItemInstanceEnergy = {
	energyTypeHash: number;
	energyType: number;
	energyCapacity: number;
	energyUsed: number;
	energyUnused: number;
};

export type DestinyItemInstanceComponent = {
	damageType: number;
	damageTypeHash?: number;
	primaryStat: DestinyStat;
	itemLevel: number;
	quality: number;
	isEquipped: boolean;
	canEquip: boolean;
	equipRequiredLevel: number;
	unlockHashesRequiredToEquip: number[];
	cannotEquipReason: number;
	breakerType?: DestinyBreakerType;
	breakerTypeHash?: number;
	energy: DestinyItemInstanceEnergy;
	gearTier?: number;
};

export type DestinyItemRenderComponent = {
	useCustomDyes: boolean;
	artRegions: Record<number, number>;
};

export type DestinyItemStatsComponent = {
	stats: Record<number, DestinyStat>;
};

export type DestinyItemSocketState = {
	plugHash: number;
	isEnabled: boolean;
	isVisible: boolean;
	enableFailIndexes: number[];
};

export type DestinyItemSocketsComponent = {
	sockets: DestinyItemSocketState[];
};

export type DestinyItemReusablePlugsComponent = {
	[itemIndex: number]: DestinyPlugSetsComponent;
};

export type DestinyItemPlugObjectivesComponent = {
	objectivesPerPlug: Record<number, DestinyObjectiveProgress[]>;
};

export type DestinyMaterialRequirement = {
	itemHash: number;
	deleteOnAction: boolean;
	count: number;
	countIsConstant: boolean;
	omitFromRequirements: boolean;
	hasVirtualStackSize: boolean;
};

export type DestinyTalentNodeStatBlock = {
	currentStepStats: DestinyStat[];
	nextStepStats: DestinyStat[];
};

export type DestinyTalentNode = {
	nodeIndex: number;
	nodeHash: number;
	state: number;
	isActivated: boolean;
	stepIndex: number;
	materialsToUpgrade: DestinyMaterialRequirement[];
	activationGridLevel: number;
	progressPercent: number;
	hidden: boolean;
	nodeStatsBlock: DestinyTalentNodeStatBlock;
};

export type DestinyItemTalentGridComponent = {
	talentGridHash: number;
	nodes: DestinyTalentNode[];
	isGridComplete: boolean;
	gridProgression: DestinyProgression;
};

export type DestinyItemPlugComponent = {
	plugObjectives: DestinyObjectiveProgress[];
	plugItemHash: number;
	canInsert: boolean;
	enabled: boolean;
	insertFailIndexes: number[];
	enableFailIndexes: number[];
	stackSize?: number;
	maxStackSize?: number;
};

export type DestinyItemObjectivesComponent = {
	objectives: DestinyObjectiveProgress[];
	flavorObjective: DestinyObjectiveProgress;
	dateCompleted?: string;
};

export type DestinyMaterialRequirementState = {
	itemHash: number;
	count: number;
	stackSize: number;
};

export type DestinyMaterialRequirementSetState = {
	materialRequirementSetHash: number;
	materialRequirementStates: DestinyMaterialRequirementState[];
};

export type DestinyCurrenciesComponent = {
	itemQuantities: DestinyItemQuantity[];
	materialRequirementSetStates: DestinyMaterialRequirementSetState[];
};

export type DestinyActivityRewardDefinition = {
	rewardText: string;
	rewardItems: DestinyItemQuantity[];
};

export type DestinyActivityModifierReferenceDefinition = {
	activityModifierHash: number;
}

export type DestinyActivityChallengeDefinition = {
	objectiveHash: number;
	dummyRewards: DestinyItemQuantity[];
};

export type DestinyActivityUnlockStringDefinition = {
	displayString: string;
};

export type DestinyActivityRequirementLabel = {
	displayString: string;
};

export type DestinyActivityRequirementsBlock = {
	leaderRequirementLabels: DestinyActivityRequirementLabel[];
	fireteamRequirementLabels: DestinyActivityRequirementLabel[];
};

export type DestinyActivitySelectableSkullCollection = {
	selectableSkullCollectionHash: number;
	minimumTierRank: number;
	maximumTierRank: number;
};

export type DestinyActivityPlaylistItemDefinition = {
	activityHash: number;
	directActivityModeHash?: number;
	directActivityModeType?: DestinyActivityModeType;
	activityModeHashes: number[];
	activityModeTypes: DestinyActivityModeType[];
};

export type DestinyActivityGraphListEntryDefinition = {
	activityGraphHash: number;
};

export type DestinyActivityMatchmakingBlockDefinition = {
	isMatchmade: boolean;
	minParty: number;
	maxParty: number;
	maxPlayers: number;
	requiresGuardianOath: boolean;
};

export type DestinyActivityGuidedBlockDefinition = {
	guidedMaxLobbySize: number;
	guidedMinLobbySize: number;
	guidedDisbandCount: number;
};

export type DestinyActivityLoadoutRequirement = {
	equipmentSlotHash: number;
	allowedEquipmentItemHashes: number[];
	allowedWeaponSubTypes: number[];
};

export type DestinyActivityLoadoutRequirementSet = {
	requirements: DestinyActivityLoadoutRequirement[];
};

export type DestinyActivityInsertionPointDefinition = {
	phaseHash: number;
};

export type DestinyEnvironmentLocationMapping = {
	locationHash: number;
	activationSource: string;
	itemHash?: number;
	objectiveHash?: number;
	activityHash?: number;
};

export type DestinyVendorComponent = {
	canPurchase: boolean;
	progression: DestinyProgression;
	vendorLocationIndex: number;
	seasonalRank?: number;
	vendorHash: number;
	nextRefreshDate: string;
	enabled: boolean;
};

export type DestinyVendorCategory = {
	displayCategoryIndex: number;
	itemIndexes: number[];
};

export type DestinyVendorCategoriesComponent = {
	categories: DestinyVendorCategory[];
};

export type DestinyUnlockStatus = {
	unlockHash: number;
	isSet: boolean;
};

export type DestinyVendorSaleItemComponent = {
	saleStatus: number;
	requiredUnlocks: number[];
	unlockStatuses: DestinyUnlockStatus[];
	failureIndexes: number[];
	augments: number;
	itemValueVisibility: boolean[];
	vendorItemIndex: number;
	itemHash: number;
	overrideStyleItemHash?: number;
	quantity: number;
	costs: DestinyItemQuantity[];
	overrideNextRefreshDate?: string;
	apiPurchasable: boolean;
};

export type DestinyStringVariablesComponent = {
	integerValuesByHash: Record<number, number>;
};

export interface DestinyDefinition {
	hash: number;
	index: number;
	redacted: boolean;
	blacklisted: boolean;
}

export type DestinyIconSequenceDefinition = {
	frames: string[];
};

export type DestinyDisplayPropertiesDefinition = {
	description: string;
	name: string;
	icon: string;
	hasIcon: boolean;
	highResIcon?: string;
	iconHash?: number;
	iconSequences?: DestinyIconSequenceDefinition[];
};

export type DestinyActivityDefinition = DestinyDefinition & {
	displayProperties: DestinyDisplayPropertiesDefinition;
	originalDisplayProperties: DestinyDisplayPropertiesDefinition;
	selectionScreenDisplayProperties: DestinyDisplayPropertiesDefinition;
	releaseIcon: string;
	releaseTime: number;
	activityLightLevel: number;
	destinationHash: number;
	placeHash: number;
	activityTypeHash: number;
	tier: number;
	pgcrImage: string;
	rewards: DestinyActivityRewardDefinition[];
	modifiers: DestinyActivityModifierReferenceDefinition[];
	isPlaylist: boolean;
	challenges: DestinyActivityChallengeDefinition[];
	optionalUnlockStrings: DestinyActivityUnlockStringDefinition[];
	activityFamilyHashes: number[];
	traitHashes: number[];
	requirements: DestinyActivityRequirementsBlock;
	difficultyTierCollectionHash?: number;
	selectableSkullCollectionHashes: number[];
	selectableSkullCollections: DestinyActivitySelectableSkullCollection[];
	playlistItems: DestinyActivityPlaylistItemDefinition[];
	activityGraphList: DestinyActivityGraphListEntryDefinition[];
	matchmaking: DestinyActivityMatchmakingBlockDefinition;
	guidedGame: DestinyActivityGuidedBlockDefinition;
	directActivityModeHash?: number;
	directActivityModeType?: DestinyActivityModeType;
	loadouts: DestinyActivityLoadoutRequirementSet;
	activityModeHashes: number[];
	activityModeTypes: DestinyActivityModeType[];
	isPvP: boolean;
	insertionPoints: DestinyActivityInsertionPointDefinition[];
	activityLocationMappings: DestinyEnvironmentLocationMapping[];
};

export type DestinyItemTooltipNotification = {
	displayString: string;
	displayStyle: string;
};

export type DestinyItemActionRequiredItemDefinition = {
	count: number;
	itemHash: number;
	deleteOnAction: boolean;
};

export type DestinyProgressionRewardDefinition = {
	progressionMappingHash: number;
	amount: number;
	applyThrottles: boolean;
};

export type DestinyItemActionBlockDefinition = {
	verbName: string;
	verbDescription: string;
	isPositive: boolean;
	overlayScreenName: string;
	overlayIcon: string;
	requiredCooldownSeconds: number;
	requiredItems: DestinyItemActionRequiredItemDefinition[];
	progressionRewards: DestinyProgressionRewardDefinition[];
	actionTypeLabel: string;
	requiredLocation: string;
	requiredCooldownHash: number;
	deleteOnAction: boolean;
	consumeEntireStack: boolean;
	useOnAcquire: boolean;
};

export type DestinyItemCraftingBlockBonusPlugDefinition = {
	socketTypeHash: number;
	plugItemHash: number;
};

export type DestinyItemCraftingBlockDefinition = {
	outputItemHash: number;
	requiredSocketTypeHashes: number[];
	failedRequirementStrings: string[];
	baseMaterialRequirements?: number[];
	bonusPlugs: DestinyItemCraftingBlockBonusPlugDefinition[];
};

export type DestinyItemInventoryBlockDefinition = {
	stackUniqueLabel: string;
	maxStackSize: number;
	bucketTypeHash: number;
	recoveryBucketTypeHash: number;
	tierTypeHash: number;
	isInstanceItem: boolean;
	tierTypeName: string;
	tierType: number;
	expirationTooltip: string;
	expiredInActivityMessage: string;
	expiredInOrbitMessage: string;
	suppressExpirationWhenObjectivesComplete: boolean;
	recipeItemHash?: number;
};

export type DestinyItemSetBlockEntryDefinition = {
	trackingValue: number;
	itemHash: number;
};

export type DestinyItemSetBlockDefinition = {
	itemList: DestinyItemSetBlockEntryDefinition[];
	requiredOrderedSetItemAdd: boolean;
	setIsFeatured: boolean;
	setType: string;
	questLineName: string;
	questLineDescription: string;
	questStepSummary: string;
};

export type DestinyInventoryItemStatDefinition = {
	statHash: number;
	value: number;
	minimum: number;
	maximum: number;
	displayMaximum?: number;
};

export type DestinyItemStatBlockDefinition = {
	disablePrimaryStatDisplay: boolean;
	statGroupHash: number;
	stats: Record<number, DestinyInventoryItemStatDefinition>;
	hasDisplayableStats: boolean;
	primaryBaseStatHash: number;
};

export type DestinyEquippingBlockDefinition = {
	gearsetItemHash?: number;
	uniqueLabel: string;
	uniqueLabelHash: number;
	equipmentSlotTypeHash: number;
	attributes: number;
	ammoType: number;
	displayStrings: string[];
	equipableItemSetHash?: number;
};

export type DestinyGearArtArrangementReference = {
	classHash: number;
	artArrangementHash: number;
};

export type DestinyItemTranslationBlockDefinition = {
	weaponPatternIdentifier: string;
	weaponPatternHash: number;
	defaultDyes: DyeReference[];
	lockedDyes: DyeReference[];
	customDyes: DyeReference[];
	arrangements: DestinyGearArtArrangementReference[];
	hasGeometry: boolean;
};

export type DestinyDerivedItemDefinition = {
	itemHash?: number;
	itemName: string;
	itemDetail: string;
	itemDescription: string;
	iconPath: string;
	vendorItemIndex: number;
};

export type DestinyDerivedItemCategoryDefinition = {
	categoryDescription: string;
	items: DestinyDerivedItemDefinition[];
};

export type DestinyItemPreviewBlockDefinition = {
	screenStyle: string;
	previewVendorHash: number;
	artifactHash?: number;
	previewActionString: string;
	derivedItemCategories: DestinyDerivedItemCategoryDefinition[];
};

export type DestinyItemQualityBlockDefinition = {
	itemLevels: number[];
	qualityLevel: number;
	infusionCategoryName: string;
	infusionCategoryHash: number;
	infusionCategoryHashes: number[];
	progressionLevelRequirementHash: number;
	currentVersion: number;
	versions: number[];
	displayVersionWatermarkIcons: string[];
};

export type DestinyItemValueBlockDefinition = {
	itemValue: DestinyItemQuantity[];
	valueDescription: string;
};

export type DestinyItemSourceDefinition = {
	level: number;
	minQuality: number;
	maxQuality: number;
	minLevelRequired: number;
	maxLevelRequired: number;
	computedStats: Record<number, DestinyInventoryItemStatDefinition>;
	sourceHashes: number[];
};

export type DestinyItemVendorSourceReference = {
	vendorHash: number;
	vendorItemIndexes: number[];
};

export type DestinyItemSourceBlockDefinition = {
	sourceHashes: number[];
	sources: DestinyItemSourceDefinition[];
	exclusive: number;
	vendorSources: DestinyItemVendorSourceReference[];
};

export type DestinyObjectiveDisplayProperties = {
	activityHash?: number;
	displayOnItemPreviewScreen: boolean;
};

export type DestinyItemObjectiveBlockDefinition = {
	objectiveHashes: number[];
	displayActivityHashes: number[];
	requireFullObjectiveCompletion: boolean;
	questlineItemHash: number;
	narrative: string;
	objectiveVerbName: string;
	questTypeIdentifier: string;
	questTypeHash: number;
	perObjectiveDisplayProperties: DestinyObjectiveDisplayProperties[];
	displayAsStatTracker: boolean;
};

export type DestinyItemMetricBlockDefinition = {
	availableMetricCategoryNodeHashes: number[];
};

export type DestinyPlugRuleDefinition = {
	failureMessage: string;
};

export type DestinyParentItemOverride = {
	additionalEquipRequirementsDisplayStrings: string[];
	pipIcon: string;
};

export type DestinyEnergyCapacityEntry = {
	capacityValue: number;
	energyTypeHash: number;
	energyType: number;
};

export type DestinyEnergyCostEntry = {
	energyCost: number;
	energyTypeHash: number;
	energyType: number;
};

export type DestinyItemPlugDefinition = {
	insertionRules: DestinyPlugRuleDefinition[];
	plugCategoryIdentifier: string;
	plugCategoryHash: number;
	onActionRecreateSelf: boolean;
	insertionMaterialRequirementHash: number;
	previewItemOverrideHash: number;
	enabledMaterialRequirementHash: number;
	enabledRules: DestinyPlugRuleDefinition[];
	uiPlugLabel: string;
	plugStyle: number;
	plugAvailability: number;
	alternateUiPlugLabel: string;
	alternatePlugStyle: number;
	isDummyPlug: boolean;
	parentItemOverride: DestinyParentItemOverride;
	energyCapacity: DestinyEnergyCapacityEntry;
	energyCost: DestinyEnergyCostEntry;
};

export type DestinyItemGearsetBlockDefinition = {
	trackingValueMax: number;
	itemList: number[];
};

export type DestinyItemSackBlockDefinition = {
	detailAction: string;
	openAction: string;
	selectItemCount: number;
	vendorSackType: string;
	openOnAcquire: boolean;
};

export type DestinyItemSocketEntryPlugItemDefinition = {
	plugItemHash: number;
};

export type DestinyItemSocketEntryDefinition = {
	socketTypeHash: number;
	singleInitialItemHash: number;
	reusablePlugItems: DestinyItemSocketEntryPlugItemDefinition[];
	preventInitializationOnVendorPurchase: boolean;
	hidePerksInItemTooltip: boolean;
	plugSources: number;
	reusablePlugSetHash?: number;
	randomizedPlugSetHash?: number;
	defaultVisible: boolean;
};

export type DestinyItemSocketBlockDefinition = {
	detail: string;
	socketEntries: DestinyItemSocketEntryDefinition[];
};

export type DestinyItemSummaryBlockDefinition = {
	sortPriority: number;
};

export type DestinyItemTalentGridBlockDefinition = {
	talentGridHash: number;
	itemDetailString: string;
	buildName: string;
	hudDamageType: number;
	hudIcon: string;
};

export type DestinyItemInvestmentStatDefinition = {
	statTypeHash: number;
	value: number;
	isConditionallyActive: boolean;
};

export type DestinyItemPerkEntryDefinition = {
	requirementDisplayString: string;
	perkHash: number;
	perkVisibility: number;
};

export type DestinyAnimationReference = {
	animName: string;
	animIdentifier: string;
	path: string;
};

export type HyperLinkReference = {
	title: string;
	url: string;
};

export type DestinyInventoryItemDefinition = DestinyDefinition & {
	displayProperties: DestinyDisplayPropertiesDefinition;
	tooltipNotifications: DestinyItemTooltipNotification[];
	collectibleHash?: number;
	iconWatermark: string;
	iconWatermarkShelved: string;
	iconWatermarkFeatured: string;
	secondaryIcon: string;
	secondaryOverlay: string;
	secondarySpecial: string;
	backgroundColor: DestinyColor;
	isFeaturedItem: boolean;
	isHolofoil: boolean;
	isAdept: boolean;
	screenshot: string;
	itemTypeDisplayName: string;
	flavorText: string;
	uiItemDisplayStyle: string;
	itemTypeAndTierDisplayName: string;
	displaySource: string;
	tooltipStyle: string;
	action: DestinyItemActionBlockDefinition;
	crafting: DestinyItemCraftingBlockDefinition;
	inventory: DestinyItemInventoryBlockDefinition;
	setData: DestinyItemSetBlockDefinition;
	stats: DestinyItemStatBlockDefinition;
	emblemObjectiveHash?: number;
	equippingBlock?: DestinyEquippingBlockDefinition;
	translationBlock?: DestinyItemTranslationBlockDefinition;
	preview: DestinyItemPreviewBlockDefinition;
	quality: DestinyItemQualityBlockDefinition;
	value: DestinyItemValueBlockDefinition;
	sourceData: DestinyItemSourceBlockDefinition;
	objectives: DestinyItemObjectiveBlockDefinition;
	metrics: DestinyItemMetricBlockDefinition;
	plug: DestinyItemPlugDefinition;
	gearset: DestinyItemGearsetBlockDefinition;
	sack: DestinyItemSackBlockDefinition;
	sockets: DestinyItemSocketBlockDefinition;
	summary: DestinyItemSummaryBlockDefinition;
	talentGrid: DestinyItemTalentGridBlockDefinition;
	investmentStats: DestinyItemInvestmentStatDefinition[];
	perks: DestinyItemPerkEntryDefinition[];
	loreHash?: number;
	summaryItemHash?: number;
	animations: DestinyAnimationReference[];
	allowActions: boolean;
	links: HyperLinkReference[];
	doesPostmasterPullHaveSideEffects: boolean;
	nonTransferrable: boolean;
	itemCategoryHashes: number[];
	specialItemType: number;
	itemType: number;
	itemSubType: number;
	classType: number;
	breakerType: DestinyBreakerType;
	breakerTypeHash?: number;
	equippable: boolean;
	damageTypeHashes: number[];
	damageTypes: number[];
	defaultDamageType: number;
	defaultDamageTypeHash?: number;
	seasonHash?: number;
	isWrapper: boolean;
	traitIds: string[];
	traitHashes: number[];
};

export type DestinySeasonPassImages = {
	iconImagePath: string;
	themeBackgroundImagePath: string;
};

export type DestinySeasonPassDefinition = DestinyDefinition & {
	displayProperties: DestinyDisplayPropertiesDefinition;
	rewardProgressionHash: number;
	prestigeProgressionHash: number;
	linkRedirectPath: string;
	color: DestinyColor;
	images: DestinySeasonPassImages;
};

export type DestinyDamageTypeDefinition = DestinyDefinition & {
	displayProperties: DestinyDisplayPropertiesDefinition;
	transparentIconPath: string;
	showIcon: boolean;
	enumValue: number;
	color: DestinyColor;
};

export type DestinyVendorRequirementDisplayEntryDefinition = {
	icon: string;
	name: string;
	source: string;
	type: string;
};

export type DestinyVendorDisplayPropertiesDefinition = DestinyDisplayPropertiesDefinition & {
	largeIcon: string;
	subtitle: string;
	originalIcon: string;
	requirementsDisplay: DestinyVendorRequirementDisplayEntryDefinition[];
	smallTransparentIcon: string;
	mapIcon: string;
	largeTransparentIcon: string;
};

export type DateRange = {
	start: string;
	end: string;
};

export type DestinyVendorActionDefinition = {
	name: string;
	description: string;
	icon: string;
	executeSeconds: number;
	verb: string;
	isPositive: boolean;
	actionId: number;
	actionHash: number;
	autoPerformAction: boolean;
};

export type DestinyVendorCategoryOverlayDefinition = {
	title: string;
	description: string;
	icon: string;
	choiceDescription: string;
	currencyItemHash?: number;
};

export type DestinyVendorCategoryEntryDefinition = {
	categoryIndex: number;
	sortValue: number;
	categoryHash: number;
	quantityAvailable: number;
	showUnavailableItems: boolean;
	hideIfNoCurrency: boolean;
	hideFromRegularPurchase: boolean;
	buyStringOverride: string;
	disabledDescription: string;
	displayTitle: boolean;
	overlay: DestinyVendorCategoryOverlayDefinition;
	vendorItemIndexes: number[];
	isPreview: boolean;
	isDisplayOnly: boolean;
	resetIntervalMinutesOverride: number;
	resetOffsetMinutesOverride: number;
};

export type DestinyDisplayCategoryDefinition = {
	displayProperties: DestinyDisplayPropertiesDefinition;
	index: number;
	identifier: string;
	displayCategoryHash: number;
	displayInBanner: boolean;
	progressionHash?: number;
	sortOrder: number;
	displayStyleHash?: number;
	displayStyleIdentifier: string;
};

export type DestinyVendorInteractionReplyDefinition = {
	itemRewardsSelection: number;
	reply: string;
	replyType: number;
};

export type DestinyVendorInteractionSackEntryDefinition = {
	sackType: number;
};

export type DestinyVendorInteractionDefinition = {
	interactionIndex: number;
	replies: DestinyVendorInteractionReplyDefinition[];
	vendorCategoryIndex: number;
	questlineItemHash: number;
	sackInteractionList: DestinyVendorInteractionSackEntryDefinition[];
	uiInteractionType: number;
	interactionType: number;
	rewardBlockLabel: string;
	rewardVendorCategoryIndex: number;
	flavorLineOne: string;
	flavorLineTwo: string;
	headerDisplayProperties: DestinyDisplayPropertiesDefinition;
	instructions: string;
};

export type DestinyVendorInventoryFlyoutBucketDefinition = {
	collapsible: boolean;
	inventoryBucketHash: number;
	sortItemsBy: number;
};

export type DestinyVendorInventoryFlyoutDefinition = {
	displayProperties: DestinyDisplayPropertiesDefinition;
	lockedDescription: string;
	buckets: DestinyVendorInventoryFlyoutBucketDefinition[];
	flyoutId: number;
	suppressNewness: boolean;
	equipmentSlotHash?: number;
};

export type DestinyVendorItemQuantity = {
	itemHash: number;
	itemInstanceId?: number;
	quantity: number;
	hasConditionalVisibility: boolean;
};

export type DestinyItemCreationEntryLevelDefinition = {
	level: number;
};

export type DestinyVendorSaleItemActionBlockDefinition = {
	executeSeconds: number;
	isPositive: boolean;
};

export type DestinyVendorItemSocketOverride = {
	singleItemHash?: number;
	randomizedOptionsCount: number;
	socketTypeHash: number;
};

export type DestinyVendorItemDefinition = {
	itemHash: number;
	quantity: number;
	vendorItemIndex: number;
	failureIndexes: number[];
	currencies: DestinyVendorItemQuantity[];
	refundPolicy: number;
	refundTimeLimit: number;
	creationLevels: DestinyItemCreationEntryLevelDefinition[];
	displayCategoryIndex: number;
	categoryIndex: number;
	originalCategoryIndex: number;
	minimumLevel: number;
	maximumLevel: number;
	action: DestinyVendorSaleItemActionBlockDefinition;
	displayCategory: string;
	inventoryBucketHash: number;
	visibilityScope: number;
	purchasableScope: number;
	exclusivity: number;
	isOffer?: boolean;
	isCrm?: boolean;
	sortValue: number;
	expirationTooltip: string;
	redirectToSaleIndexes: number[];
	socketOverrides: Record<number, DestinyVendorItemSocketOverride>;
	unpurchasable?: boolean;
};

export type DestinyVendorServiceDefinition = {
	name: string;
};

export type DestinyVendorAcceptedItemDefinition = {
	acceptedInventoryBucketHash: number;
	destinationInventoryBucketHash: number;
};

export type DestinyVendorLocationDefinition = {
	destinationHash: number;
	backgroundImagePath: string;
};

export type DestinyVendorGroupReference = {
	vendorGroupHash: number;
};

export type DestinyVendorDefinition = DestinyDefinition & {
	displayProperties: DestinyVendorDisplayPropertiesDefinition;
	vendorProgressionType: number;
	buyString: string;
	sellString: string;
	displayItemHash: number;
	inhibitBuying: boolean;
	inhibitSelling: boolean;
	factionHash: number;
	resetIntervalMinutes: number;
	resetOffsetMinutes: number;
	failureStrings: string[];
	unlockRanges: DateRange[];
	vendorIdentifier: string;
	vendorPortrait: string;
	vendorBanner: string;
	enabled: boolean;
	visible: boolean;
	vendorSubcategoryIdentifier: string;
	consolidateCategories: boolean;
	actions: DestinyVendorActionDefinition[];
	categories: DestinyVendorCategoryEntryDefinition[];
	originalCategories: DestinyVendorCategoryEntryDefinition[];
	displayCategories: DestinyDisplayCategoryDefinition[];
	interactions: DestinyVendorInteractionDefinition[];
	inventoryFlyouts: DestinyVendorInventoryFlyoutDefinition[];
	itemList: DestinyVendorItemDefinition[];
	services: DestinyVendorServiceDefinition[];
	acceptedItems: DestinyVendorAcceptedItemDefinition[];
	returnWithVendorRequest: boolean;
	locations: DestinyVendorLocationDefinition[];
	groups: DestinyVendorGroupReference[];
	ignoreSaleItemHashes: number[];
};

export type DestinyStatDefinition = DestinyDefinition & {
	displayProperties: DestinyDisplayPropertiesDefinition;
	aggregationType: number;
	hasComputedBlock: boolean;
	statCategory: number;
	interpolate: boolean;
};

type BungieSetting = {
	identifier: string;
	isDefault: boolean;
	displayName: string;
	summary?: string;
	imagePath?: string;
	childSettings?: BungieSetting[];
}

export type BungieCommonSettings = {
	environment: string;
	systems: {
		[systemName: string]: {
			enabled: boolean;
			parameters: Record<string, string>;
		};
	};
	ignoreReasons: BungieSetting[];
	forumCategories: BungieSetting[];
	groupAvatars: BungieSetting[];
	defaultGroupTheme: BungieSetting;
	destinyMembershipTypes: BungieSetting[];
	recruitmentPlatformTags: BungieSetting[];
	recruitmentMiscTags: BungieSetting[];
	recruitmentActivities: BungieSetting[];
	userContentLocales: BungieSetting[];
	systemContentLocales: BungieSetting[];
	clanBannerDecals: BungieSetting[];
	clanBannerDecalColors: BungieSetting[];
	clanBannerGonfalons: BungieSetting[];
	clanBannerGonfalonColors: BungieSetting[];
	clanBannerGonfalonDetails: BungieSetting[];
	clanBannerGonfalonDetailColors: BungieSetting[];
	clanBannerStandards: BungieSetting[];
	destiny2CoreSettings: {
		collectionRootNode: number;
		badgesRootNode: number;
		recordsRootNode: number;
		medalsRootNode: number;
		metricsRootNode: number;
		activeTriumphsRootNodeHash: number;
		activeSealsRootNodeHash: number;
		legacyTriumphsRootNodeHash: number;
		legacySealsRootNodeHash: number;
		medalsRootNodeHash: number;
		exoticCatalystsRootNodeHash: number;
		loreRootNodeHash: number;
		craftingRootNodeHash: number;
		globalConstantsHash: number;
		loadoutConstantsHash: number;
		guardianRankConstantsHash: number;
		fireteamFinderConstantsHash: number;
		inventoryItemConstantsHash: number;
		featuredItemListHash: number;
		armorArchetypePlugSetHash: number;
		seasonalHubEventCardHash: number;
		guardianRanksRootNodeHash: number;
		currentRankProgressionHashes: number[];
		insertPlugFreeProtectedPlugItemHashes: number[];
		insertPlugFreeBlockedSocketTypeHashes: number[];
		enabledFireteamFinderActivityGraphHashes: number[];
		undiscoveredCollectibleImage: string;
		ammoTypeHeavyIcon: string;
		ammoTypeSpecialIcon: string;
		ammoTypePrimaryIcon: string;
		currentSeasonalArtifactHash: number;
		currentSeasonHash: number;
		currentSeasonPassHash: number;
		seasonalChallengesPresentationNodeHash: number;
		futureSeasonHashes: number[];
		pastSeasonHashes: number[];
	};
	emailSettings: {
		optInDefinitions: {
			[type: string]: {
				name: string;
				value: number;
				setByDefault: boolean;
				dependantSubscriptions: number[];
			};
		};
		subscriptionDefinitions: {
			[type: string]: {
				name: string;
				value: number;
				setByDefault: boolean;
				dependencies: number[];
			};
		};
		views: {
			[type: string]: {
				name: string;
				viewSettings: {
					name: string;
					localization: {
						[locale: string]: {
							title: string;
							description: string;
						};
					};
					setByDefault: boolean;
					optInAggregateValue: number;
					subscriptions: number[];
				}[];
			};
		};
	};
	fireteamActivities: BungieSetting[];
};

export type DestinyCharacterResponse = {
	inventory?: {
		data: {
			items: DestinyItemComponent[];
		};
		privacy: number;
		disabled?: boolean;
	};
	character?: {
		data: DestinyCharacterComponent;
		privacy: number;
		disabled?: boolean;
	};
	progressions?: {
		data: DestinyCharacterProgressionComponent;
		privacy: number;
		disabled?: boolean;
	};
	renderData?: {
		data: DestinyCharacterRenderComponent;
		privacy: number;
		disabled?: boolean;
	};
	activities?: {
		data: DestinyCharacterActivitiesComponent;
		privacy: number;
		disabled?: boolean;
	};
	equipment?: {
		data: Inventory_DestinyInventoryComponent;
		privacy: number;
		disabled?: boolean;
	};
	loadouts?: {
		data: DestinyLoadoutsComponent;
		privacy: number;
		disabled?: boolean;
	};
	kiosks?: {
		data: DestinyKiosksComponent;
		privacy: number;
		disabled?: boolean;
	};
	plugSets?: {
		data: DestinyPlugSetsComponent;
		privacy: number;
		disabled?: boolean;
	};
	presentationNodes?: {
		data: DestinyPresentationNodesComponent;
		privacy: number;
		disabled?: boolean;
	};
	records?: {
		data: DestinyCharacterRecordsComponent;
		privacy: number;
		disabled?: boolean;
	};
	collectibles?: {
		data: DestinyCollectiblesComponent;
		privacy: number;
		disabled?: boolean;
	};
	itemComponents: {
		instances?: {
			data: DestinyItemInstanceComponent;
			privacy: number;
			disabled?: boolean;
		};
		renderData?: {
			data: DestinyItemRenderComponent;
			privacy: number;
			disabled?: boolean;
		};
		stats?: {
			data: DestinyItemStatsComponent;
			privacy: number;
			disabled?: boolean;
		};
		sockets?: {
			data: DestinyItemSocketsComponent;
			privacy: number;
			disabled?: boolean;
		};
		reusablePlugs?: {
			data: DestinyItemReusablePlugsComponent;
			privacy: number;
			disabled?: boolean;
		};
		plugObjectives?: {
			data: DestinyItemPlugObjectivesComponent;
			privacy: number;
			disabled?: boolean;
		};
		talentGrids?: {
			data: DestinyItemTalentGridComponent;
			privacy: number;
			disabled?: boolean;
		};
		plugStates?: {
			data: DestinyItemPlugComponent;
			privacy: number;
			disabled?: boolean;
		};
		objectives?: {
			data: DestinyItemObjectivesComponent;
			privacy: number;
			disabled?: boolean;
		};
		perks?: {
			data: DestinyItemPerksComponent;
			privacy: number;
			disabled?: boolean;
		};
	};
	uninstancedItemComponents: {
		objectives?: {
			data: DestinyItemObjectivesComponent;
			privacy: number;
			disabled?: boolean;
		};
		perks?: {
			data: DestinyItemPerksComponent;
			privacy: number;
			disabled?: boolean;
		};
	};
	currencyLookups?: {
		data: DestinyCurrenciesComponent;
		privacy: number;
		disabled?: boolean;
	}
};

export type DestinyVendorResponse = {
	vendor: {
		data?: DestinyVendorComponent;
		privacy: number;
		disabled?: boolean;
	};
	categories: {
		data?: DestinyVendorCategoriesComponent;
		privacy: number;
		disabled?: boolean;
	};
	sales: {
		data?: Record<number, DestinyVendorSaleItemComponent>;
		privacy: number;
		disabled?: boolean;
	};
	itemComponents?: {
		itemComponents?: {
			data: Record<number, DestinyItemComponent>;
			privacy: number;
			disabled?: boolean;
		};
		instances?: {
			data: Record<number, DestinyItemInstanceComponent>;
			privacy: number;
			disabled?: boolean;
		};
		renderData?: {
			data: Record<number, DestinyItemRenderComponent>;
			privacy: number;
			disabled?: boolean;
		};
		stats?: {
			data: Record<number, DestinyItemStatsComponent>;
			privacy: number;
			disabled?: boolean;
		};
		sockets?: {
			data: Record<number, DestinyItemSocketsComponent>;
			privacy: number;
			disabled?: boolean;
		};
		reusablePlugs?: {
			data: Record<number, DestinyItemReusablePlugsComponent>;
			privacy: number;
			disabled?: boolean;
		};
		plugObjectives?: {
			data: Record<number, DestinyItemPlugObjectivesComponent>;
			privacy: number;
			disabled?: boolean;
		};
		talentGrids?: {
			data: Record<number, DestinyItemTalentGridComponent>;
			privacy: number;
			disabled?: boolean;
		};
		plugStates?: {
			data: Record<number, DestinyItemPlugComponent>;
			privacy: number;
			disabled?: boolean;
		};
		objectives?: {
			data: Record<number, DestinyItemObjectivesComponent>;
			privacy: number;
			disabled?: boolean;
		};
		perks?: {
			data: Record<number, DestinyItemPerksComponent>;
			privacy: number;
			disabled?: boolean;
		};
	};
	currencyLookups: {
		data?: DestinyCurrenciesComponent;
		privacy: number;
		disabled?: boolean;
	};
	stringVariables: {
		data?: DestinyStringVariablesComponent;
		privacy: number;
		disabled?: boolean;
	}
};