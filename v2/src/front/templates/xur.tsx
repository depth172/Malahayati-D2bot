import { renderHTML } from "./renderHTML";
import type { XurViewData } from "@domain/adapter/xur";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition } from "type";
import { ArmorStatsDisplay, ItemDisplay, WeaponStatsDisplay } from "./component";
import { TextToIcon } from "./text-replacement";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

function XurBasicCard({ data, d2settings, constant, classType, bgUrl, bgRatio }: {
  data: XurViewData;
	d2settings: BungieCommonSettings;
	constant: DestinyInventoryItemConstantsDefinition;
	classType: "hunter" | "titan" | "warlock";
	bgUrl?: string;
	bgRatio?: number;
}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// ロゴをBase64で読み込む
	const logoPath = path.join(__dirname, "../../assets/logo_full.png");
	const logoFullPngBase64 = fs.readFileSync(logoPath).toString("base64");
	
	if (!data.xurItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>{classType === "hunter" ? "ハンター" : classType === "titan" ? "タイタン" : "ウォーロック"}</div>
				</div>
			</div>
      <div className="contentXur">
        {data.xurItems.basicArmors[classType].map(item => (
					<div className="itemXur" key={item.hash}>
						<div className="itemSummary">
							<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
							<div className="price">
								{item.costs?.map((c, i) => (
									<div className="cost" key={i}>
										<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
										<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
									</div>
								))}
							</div>
						</div>
						<div />
						<div className="exotic-perk">
							<div className="perk-info">
								<img className="icon" src={`https://www.bungie.net${item.perk.icon}`} />
								<div className="name">{item.perk.name}</div>
							</div>
							<div className="desc destiny-font"><TextToIcon text={item.perk.description} /></div>
						</div>
						<div className="armor-info">
							<div className="archetype">
								<div className="name">{item.archetype.name}</div>
								<img className="icon" src={`https://www.bungie.net${item.archetype.icon}`} />
							</div>
							<ArmorStatsDisplay
								stats={item.stats}
							/>
						</div>
					</div>
				))}
      </div>
      <div className="footer" style={{justifyContent: "space-between"}}>
				<div className="tips">
					＊アーキタイプ / ステータス配分はゴーストの改造パーツによって変化する可能性があります。
				</div>
				<img src={`data:image/png;base64,${logoFullPngBase64}`} />
			</div>
    </div>
  );
}

function XurSpecialCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: XurViewData;
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

	if (!data.xurItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>その他のアイテム</div>
				</div>
			</div>
      <div className="contentXur">
        {data.xurItems.specialItems.map(item => (
					<div className="itemXur" key={item.name}>
						<div className="itemSummary">
							<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
							<div className="price">
								{item.costs?.map((c, i) => (
									<div className="cost" key={i}>
										<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
										<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
									</div>
								))}
							</div>
						</div>
						<div />
						<div className="description">{item.description}</div>
					</div>
				))}
      </div>
      <div className="footer"><img src={`data:image/png;base64,${logoFullPngBase64}`} /></div>
    </div>
  );
}

function GearExoticWeaponCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: XurViewData;
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

	if (!data.gearItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;
	const items = data.gearItems;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>エキゾチック武器</div>
					<img src={`https://www.bungie.net${items.icon}`} />
				</div>
			</div>
      <div className="contentXur">
				<div className="itemXur">
					<div className="itemSummary">
						<ItemDisplay item={items.exotics.engram} d2settings={d2settings} constant={constant} />
						<div className="price">
							{items.exotics.engram.costs?.map((c, i) => (
								<div className="cost" key={i}>
									<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
									<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
								</div>
							))}
						</div>
					</div>
				</div>
				<hr />
        {items.exotics.weapons.map(item => (
					<div className="itemXur" key={item.hash}>
						<div className="itemSummary">
							<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
							<div className="price">
								{item.costs?.map((c, i) => (
									<div className="cost" key={i}>
										<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
										<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
									</div>
								))}
							</div>
						</div>
						<div />
						{item.perks.map((perk) => (
							<div key={perk.name} className="exotic-weapon-perk">
								<div className="perk-info">
									<img className="icon" src={`https://www.bungie.net${perk.icon}`} />
									<div className="name">{perk.name}</div>
								</div>
								<div className="desc destiny-font"><TextToIcon text={perk.description} /></div>
							</div>
						))}
					</div>
				))}
				{items.exotics.randomRollWeapons.map(item => (
					<div className="itemXur" key={item.hash}>
						<div className="itemSummary">
							<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
							<div className="price">
								{item.costs?.map((c, i) => (
									<div className="cost" key={i}>
										<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
										<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
									</div>
								))}
							</div>
						</div>
						<div />
						<div className="exotic-weapon-perk">
							<div className="perk-info">
								<img className="icon" src={`https://www.bungie.net${item.exoticPerk.icon}`} />
								<div className="name">{item.exoticPerk.name}</div>
							</div>
							<div className="desc destiny-font"><TextToIcon text={item.exoticPerk.description} /></div>
							<div className="random-perks">
								{item.randomPerks.map((perkRow, idxR) => (
									<div key={idxR} className="random-perk-row">
										{perkRow.map((perk, idx) => (
											<div key={idx} className="random-perk">
												<img className="icon" src={`https://www.bungie.net${perk.icon}`} />
												<div className="name">{perk.name}</div>
											</div>
										))}
									</div>
								))}
							</div>
						</div>
						<WeaponStatsDisplay stats={item.stats} baseStats={item.baseStats} />
					</div>
				))}
      </div>
      <div className="footer">
				<img src={`data:image/png;base64,${logoFullPngBase64}`} />
			</div>
    </div>
  );
}

function GearCatalystCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: XurViewData;
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

	if (!data.gearItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;
	const items = data.gearItems;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>エキゾチック武器の媒体</div>
					<img src={`https://www.bungie.net${items.icon}`} />
				</div>
			</div>
      <div className="contentXur">
				{items.exotics.catalysts.map(item => (
					<div className="itemXur" key={item.hash}>
						<div className="itemSummary">
							<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
							<div className="price">
								{item.costs?.map((c, i) => (
									<div className="cost" key={i}>
										<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
										<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
									</div>
								))}
							</div>
						</div>
						<div />
						{item.perks.map((perk) => (
							<div key={perk.name} className="exotic-weapon-perk">
								<div className="perk-info">
									<img className="icon" src={`https://www.bungie.net${perk.icon}`} />
									<div className="name">{perk.name}</div>
								</div>
								<div className="desc destiny-font"><TextToIcon text={perk.description} /></div>
							</div>
						))}
					</div>
				))}
      </div>
      <div className="footer">
				<img src={`data:image/png;base64,${logoFullPngBase64}`} />
			</div>
    </div>
  );
}

function GearLegendaryWeaponsCard({ data, d2settings, range, pageNumber, pageMax, constant, bgUrl, bgRatio }: {
  data: XurViewData;
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

	if (!data.gearItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;
	const items = data.gearItems;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>レジェンダリー武器 ({pageNumber}/{pageMax})</div>
					<img src={`https://www.bungie.net${items.icon}`} />
				</div>
			</div>
      <div className="contentXur">
				{pageNumber === 1 &&
					<>
						<div className="weaponListXur">
							<div className="itemSummary">
								<ItemDisplay item={items.weapons.engram} d2settings={d2settings} constant={constant} />
								<div className="price">
									{items.weapons.engram.costs?.map((c, i) => (
										<div className="cost" key={i}>
											<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
											<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
										</div>
									))}
								</div>
							</div>
						</div>
						<hr />
					</>
				}
				<div className="weaponListXur">
	        {items.weapons.weapons.slice(range[0], range[1]).map(item => (
						<div key={item.hash} className="weapon">
							<div className="itemSummary">
								<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
								<div className="price">
									{item.costs?.map((c, i) => (
										<div className="cost" key={i}>
											<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
											<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
										</div>
									))}
								</div>
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

function OffersCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: XurViewData;
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

	if (!data.offerItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;
	const items = data.offerItems;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>奇妙なオファー</div>
					<img src={`https://www.bungie.net${items.icon}`} />
				</div>
			</div>
      <div className="contentXur">
				<div className="weaponListXur">
	        {items.weeklyItems.map(item => (
						<div key={item.hash} className="weapon">
							<div className="itemSummary">
								<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
								<div className="price">
									{item.costs?.map((c, i) => (
										<div className="cost" key={i}>
											<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
											<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
										</div>
									))}
								</div>
							</div>
							{item.description && <div className="desc destiny-font"><TextToIcon text={item.description} /></div>}
						</div>
					))}
				</div>
				<div>＊上記のアイテムは週に一度のみ購入可能です。</div>
				<hr />
				<div className="weaponListXur">
	        {items.generalItems.map(item => (
						<div key={item.hash} className="weapon">
							<div className="itemSummary">
								<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
								<div className="price">
									{item.costs?.map((c, i) => (
										<div className="cost" key={i}>
											<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
											<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
										</div>
									))}
								</div>
							</div>
							{item.description && <div className="desc destiny-font"><TextToIcon text={item.description} /></div>}
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

const pages = ["xur", "gear", "offers"] as const;

export function renderXurHTML(data: XurViewData, d2settings: BungieCommonSettings, constant: DestinyInventoryItemConstantsDefinition, page: typeof pages[number], bgUrl?: string, bgRatio?: number, per=6) {
	const classes = ["hunter", "titan", "warlock"] as const;
	const legendaryWeaponCount = data.gearItems?.weapons.weapons.length || 0;

	if (page === "xur") {
		return [
			...classes.map(classType => renderHTML(<XurBasicCard data={data} d2settings={d2settings} constant={constant} classType={classType} bgUrl={bgUrl} bgRatio={bgRatio} />)),
			renderHTML(<XurSpecialCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />)
		];
	}

	if (page === "gear") {
		return [
			renderHTML(<GearExoticWeaponCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />),
			renderHTML(<GearCatalystCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />),
			...Array.from({ length: Math.ceil(legendaryWeaponCount / per) }, (_, i) => i).map(i => renderHTML(<GearLegendaryWeaponsCard data={data} d2settings={d2settings} constant={constant} range={[i * per, (i + 1) * per]} pageNumber={i + 1} pageMax={Math.ceil(legendaryWeaponCount / per)} bgUrl={bgUrl} bgRatio={bgRatio} />))
		];
	}

	if (page === "offers") {
		return [
			renderHTML(<OffersCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />)
		];
	}

	return [];
}