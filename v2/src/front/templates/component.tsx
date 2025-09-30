import React from "react";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition, DestinyItemStatBlockDefinition, DestinyItemStatsComponent, DestinyStat, DestinyStatDefinition } from "type";
import { DisplayableItem, DisplayableStats, DisplayableWeapon } from "typeOriginal";

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
		item: DisplayableItem | DisplayableWeapon,
		d2settings?: BungieCommonSettings,
		constant?: DestinyInventoryItemConstantsDefinition
	}
) {
	const i = props.item;
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
				<div className="name">{i.name}</div>
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
						<div className="stat-fill" style={{ width: `${(stat.value / 42) * 100}%` }}></div>
					</div>
				</React.Fragment>
			))}
			<div className="stat-name total">合計</div>
			<div className="stat-icon total" />
			<div className="stat-value total">{stats.total}</div>
		</div>
	);
};
