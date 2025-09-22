import { extendedDestinyInventoryItemDefinition } from "@domain/adapter/portal";
import { BungieCommonSettings } from "type";

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

export function WeaponDisplay(props: { weapon: extendedDestinyInventoryItemDefinition, d2settings: BungieCommonSettings }) {
	const w = props.weapon;
	return (
		<div className="weapon">
			<div className="icon">
				<img src={`https://www.bungie.net${w.displayProperties.icon}`} alt={w.displayProperties.name} />
				<img className="watermark" src={`https://www.bungie.net${w.isFeaturedItem ? w.iconWatermarkFeatured : w.iconWatermark}`} />
			</div>
			<div className="info">
				<div className="name">{w.displayProperties.name}</div>
				<div className="type">
					{w.defaultDamageTypeDef && (
						<img className="damage-type-icon" src={`https://www.bungie.net${w.defaultDamageTypeDef.displayProperties.icon}`} alt={w.defaultDamageTypeDef.displayProperties.name} title={w.defaultDamageTypeDef.displayProperties.name} />
					)}
					<AmmoIcon ammoType={w.equippingBlock?.ammoType || 0} d2settings={props.d2settings} />
					{w.itemTypeDisplayName}
				</div>
			</div>
		</div>
	);
}
