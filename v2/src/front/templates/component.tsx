import RecoilStat from "@front/recoil-direction-component";
import React from "react";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition } from "type";
import { DisplayableItem, DisplayableStats, DisplayableVendorItem, DisplayableWeapon } from "typeOriginal";

export function AmmoIcon (props: { ammoType: number, d2settings: BungieCommonSettings }) {
	const { ammoType, d2settings } = props;

	switch (ammoType) {
		case 1:
			return <img className="ammo-icon" src={`https://www.bungie.net${d2settings.destiny2CoreSettings.ammoTypePrimaryIcon}`} alt="Primary Ammo" />;
		case 2:
			return <img className="ammo-icon" src={`https://www.bungie.net${d2settings.destiny2CoreSettings.ammoTypeSpecialIcon}`} alt="Special Ammo" />;
		case 3:
			return <img className="ammo-icon" src={`https://www.bungie.net${d2settings.destiny2CoreSettings.ammoTypeHeavyIcon}`} alt="Heavy Ammo" />;
		default:
			return null;
	};
}

function isDisplayableWeapon(item: DisplayableItem | DisplayableWeapon): item is DisplayableWeapon {
	return (item as DisplayableWeapon).damageType !== undefined;
}

export function ItemDisplay(
	props: {
		item: DisplayableItem | DisplayableWeapon | DisplayableVendorItem,
		d2settings?: BungieCommonSettings,
		constant?: DestinyInventoryItemConstantsDefinition
	}
) {
	const i = props.item;
	const quantity = (i as DisplayableVendorItem).quantity;

	return (
		<div className="item">
			<div className="icon">
				<img src={`https://www.bungie.net${i.icon}`} alt={i.name} />
				{i.tier && props.constant && (
					<img className="watermark" src={`https://www.bungie.net${props.constant.gearTierOverlayImagePaths[i.tier - 1]}`} />
				)}
				{i.watermark && (
					<img className="watermark" src={`https://www.bungie.net${i.watermark}`} />
				)}
			</div>
			<div className="info">
				<div className="name">{i.name}{quantity && quantity > 1 && ` x${quantity}`}</div>
				<div className="type">
					{isDisplayableWeapon(i) && (
						<>
							<img className="damage-type-icon" src={`https://www.bungie.net${i.damageTypeIcon}`} />
							{props.d2settings && i.ammoType && <AmmoIcon ammoType={i.ammoType} d2settings={props.d2settings} />}
						</>
					)}
					{i.type}
				</div>
			</div>
		</div>
	);
}

export function ArmorStatsDisplay(
	props: {
		stats: DisplayableStats;
	}
) {
	const stats = props.stats;

	return (
		<div className="armor-stats">
			{stats.stat.map((stat) => (
				<React.Fragment key={stat.name}>
					<div className="stat-name">{stat.name}</div>
					<img className="stat-icon" src={`https://www.bungie.net${stat.icon}`} alt={stat.name} />
					<div className="stat-value">{stat.value}</div>
					<div className="stat-bar">
						<div className="stat-fill" style={{ width: `${(stat.value / 42) * 100}%` }} />
					</div>
				</React.Fragment>
			))}
			<div className="stat-name total">合計</div>
			<div className="stat-icon total" />
			<div className="stat-value total">{stats.total}</div>
		</div>
	);
};

export function WeaponStatsDisplay(
	props: {
		stats: { name: string; value: number; hash: number }[];
		baseStats?: { name: string; value: number; hash: number }[];
	}
) {
	const stats = props.stats;
	const baseStats = props.baseStats;
	const noBarStats = new Set([4284893193, 2961396640, 447667954, 2715839340, 3871231066, 925767036]); // Recoil Direction

	return (
		<div className="weapon-stats">
			{stats.map((stat) => (
				<React.Fragment key={stat.name}>
					<div className="stat-name">{stat.name}</div>
					<div className="stat-value">{stat.value}</div>
					<div className="stat-bar" style={{ backgroundColor: noBarStats.has(stat.hash) ? 'transparent' : undefined }}>
						{stat.hash === 2715839340 ? (
							<RecoilStat value={stat.value} />
						) : noBarStats.has(stat.hash) ? null : (
							<>
							<div className={`stat-fill ${stat.value > (baseStats?.find(bs => bs.hash === stat.hash)?.value ?? 0) ? 'increase' : 'decrease'}`} style={{ width: `${stat.value}%` }} />
							{baseStats && (() => {
								const baseStat = baseStats.find(bs => bs.hash === stat.hash);
								if (baseStat) {
									return (
										<div className={`stat-fill-cover ${baseStat.value > 0 ? 'increase' : 'decrease'}`} style={{ width: `${baseStat.value}%` }} />
									);
								}
								return null;
							})()}
							</>
						)}
					</div>
				</React.Fragment>
			))}
		</div>
	);
};
