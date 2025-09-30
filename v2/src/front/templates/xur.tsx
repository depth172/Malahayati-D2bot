import { renderHTML } from "./renderHTML";
import type { XurViewData } from "@domain/adapter/xur";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition } from "type";
import { ArmorStatsDisplay, ItemDisplay } from "./component";
import { TextToIcon } from "./text-replacement";

function XurBasicCard({ data, d2settings, constant, classType, bgUrl, bgRatio }: {
  data: XurViewData;
	d2settings: BungieCommonSettings;
	constant: DestinyInventoryItemConstantsDefinition;
	classType: "hunter" | "titan" | "warlock";
	bgUrl?: string;
	bgRatio?: number;
}) {
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
      <div className="footer">
				<div className="tips">
					＊アーキタイプ / ステータス配分はゴーストの改造パーツによって変化する可能性があります。
				</div>
				<img src="../src/assets/logo_full.png" />
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
      <div className="footer"><img src="../src/assets/logo_full.png" /></div>
    </div>
  );
}

export function renderXurHTML(data: XurViewData, d2settings: BungieCommonSettings, constant: DestinyInventoryItemConstantsDefinition, page: string, bgUrl?: string, bgRatio?: number, per=8) {
	const pages = ["xur", "gear", "offers"] as const;
	const classes = ["hunter", "titan", "warlock"] as const;

	if (page === "xur") {
		return [
			...classes.map(classType => renderHTML(<XurBasicCard data={data} d2settings={d2settings} constant={constant} classType={classType} bgUrl={bgUrl} bgRatio={bgRatio} />)),
			renderHTML(<XurSpecialCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />)
		];
	}

	return [];
}