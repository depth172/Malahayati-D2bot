import React from "react";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition, DestinyItemStatBlockDefinition, DestinyItemStatsComponent, DestinyStat, DestinyStatDefinition } from "type";
import { DisplayableItem, DisplayableWeapon } from "typeOriginal";

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
		statsData: DestinyItemStatBlockDefinition | DestinyItemStatsComponent,
		statDefs: Record<number, DestinyStatDefinition>
	}
) {
	const s = props.statsData.stats;
	if (!s) return null;

	const stats: Array<{ def: DestinyStatDefinition; value: number }> = Object.entries(s).map(([hash, stat]: [string, DestinyStat | undefined]) => {
		const def = props.statDefs[Number(hash)];
		if (!def) throw new Error(`Missing stat definition for hash ${hash}`);
		return { def, value: stat?.value ?? 0 };
	});

	stats.sort((a, b) => (a.def.index ?? 0) - (b.def.index ?? 0));

	const total = stats.reduce((sum, st) => sum + st.value, 0);

	return (
		<div className="armor-stats">
			{stats.map(({ def, value }) => (
				<React.Fragment key={def.hash}>
					<div className="stat-name">{def.displayProperties.name}</div>
					<img className="stat-icon" src={`https://www.bungie.net${def.displayProperties.icon}`} alt={def.displayProperties.name} />
					<div className="stat-value">{value}</div>
					<div className="stat-bar">
						<div className="stat-fill" style={{ width: `${(value / 42) * 100}%` }}></div>
					</div>
				</React.Fragment>
			))}
			<div className="stat-name total">合計</div>
			<div className="stat-icon total" />
			<div className="stat-value total">{total}</div>
		</div>
	);
};
