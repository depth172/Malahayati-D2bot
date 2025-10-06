import { renderHTML } from "./renderHTML";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition } from "type";
import { ItemDisplay } from "./component";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { BansheeFocusItemViewData, BansheeSellWeaponViewData } from "@domain/adapter/banshee";

function BansheeBasicCard({ data, d2settings, range, pageNumber, pageMax, constant, bgUrl, bgRatio }: {
  data: BansheeSellWeaponViewData;
	d2settings: BungieCommonSettings;
	range: [number, number];
	pageNumber: number;
	pageMax: number;
	constant: DestinyInventoryItemConstantsDefinition;
	bgUrl?: string;
	bgRatio?: number;
}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// ロゴをBase64で読み込む
	const logoPath = path.join(__dirname, "../../assets/logo_full.png");
	const logoFullPngBase64 = fs.readFileSync(logoPath).toString("base64");

	if (!data.sellWeapons) return <div className="card">バンシーの販売アイテムが見つかりません。</div>;
	const weapons = data.sellWeapons;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>バンシー44</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>注目{pageMax > 1 ? ` (${pageNumber}/${pageMax})` : ""}</div>
				</div>
			</div>
      <div className="contentBanshee">
				<div className="weaponListBanshee">
	        {weapons.slice(range[0], range[1]).map(item => (
						<div key={item.hash} className="weapon">
							<div className="itemSummary">
								<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
							</div>
							<div className="weapon-info">
								<div className="frame">
									<img className="icon" src={`https://www.bungie.net${item.frame.icon}`} />
									<div className="name">{item.frame.name}</div>
								</div>
								<div className="masterwork">
									<div className="icon">
										<img src={`https://www.bungie.net${item.masterwork.baseIcon}`} />
										{item.masterwork.watermark && <img className="watermarkMiddle" src={`https://www.bungie.net${item.masterwork.watermark}`} />}
									</div>
								</div>
							</div>
							<div className="weapon-perks">
								{item.perks.map((perkRow, idxRow) => (
									<div key={idxRow} className="weapon-perk-row">
										{perkRow.map((perk, idx) => (
											<div key={idx} className="weapon-perk">
												<img className="icon" src={`https://www.bungie.net${perk}`} />
											</div>
										))}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
      </div>
      <div className="footer">
				<img src={`data:image/png;base64,${logoFullPngBase64}`} />
			</div>
    </div>
  );
}

function BansheeFocusedDecodingCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: BansheeFocusItemViewData;
	d2settings: BungieCommonSettings;
	constant: DestinyInventoryItemConstantsDefinition;
	bgUrl?: string;
	bgRatio?: number;
}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// ロゴをBase64で読み込む
	const logoPath = path.join(__dirname, "../../assets/logo_full.png");
	const logoFullPngBase64 = fs.readFileSync(logoPath).toString("base64");

	if (!data.weaponGroups) return <div className="card">バンシーの販売アイテムが見つかりません。</div>;
	const groups = data.weaponGroups;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>バンシー44</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>集束化解読</div>
				</div>
			</div>
      <div className="contentBanshee">
        {groups.map(group => (
					<div key={group.index} className="weapon-group">
						<div className="group-name" style={{"--bg-url": `url("https://www.bungie.net${group.background}")`} as any}>{group.name}</div>
						<div className="lite-weapon-list">
							{group.weapons.map(weapon => (
								<div key={weapon.hash} className="weapon">
									<div className="itemSummary">
										<ItemDisplay item={weapon} d2settings={d2settings} constant={constant} />
									</div>
								</div>
							))}
						</div>
					</div>
				))}
      </div>
      <div className="footer">
				<img src={`data:image/png;base64,${logoFullPngBase64}`} />
			</div>
    </div>
  );
}

export function renderBansheeSellWeaponHTML(data: BansheeSellWeaponViewData, d2settings: BungieCommonSettings, constant: DestinyInventoryItemConstantsDefinition, bgUrl?: string, bgRatio?: number, per=6) {
	const legendaryWeaponCount = data.sellWeapons.length || 0;

	return [
		...Array.from({ length: Math.ceil(legendaryWeaponCount / per) }, (_, i) => i).map(i => renderHTML(<BansheeBasicCard data={data} d2settings={d2settings} constant={constant} range={[i * per, (i + 1) * per]} pageNumber={i + 1} pageMax={Math.ceil(legendaryWeaponCount / per)} bgUrl={bgUrl} bgRatio={bgRatio} />)),
	];
}

export function renderBansheeFocusedDecodingHTML(data: BansheeFocusItemViewData, d2settings: BungieCommonSettings, constant: DestinyInventoryItemConstantsDefinition, bgUrl?: string, bgRatio?: number) {
	return [
		renderHTML(<BansheeFocusedDecodingCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />),
	];
}