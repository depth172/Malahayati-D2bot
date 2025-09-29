import { renderHTML } from "./renderHTML";
import type { XurViewData } from "@domain/adapter/xur";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition, DestinyItemStatsComponent } from "type";
import { ArmorStatsDisplay, ItemDisplay } from "./component";

// シュールの販売期間（土曜～火曜）を「M月D日～M月D日」の形式で取得
function formatXurDayRange(baseDate = new Date()) {
	const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
	const day = d.getDay();
	const daysSinceSaturday = (day + 1) % 7; // Sun->1, Mon->2, ..., Sat->0
	const sat = new Date(d);
	sat.setDate(d.getDate() - daysSinceSaturday);
	const tue = new Date(sat);
	tue.setDate(sat.getDate() + 3);

	const fmt = (dt: Date) => dt.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
	return `${fmt(sat)} 〜 ${fmt(tue)}`;
}

function XurCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: XurViewData;
	d2settings: BungieCommonSettings;
	constant: DestinyInventoryItemConstantsDefinition;
	bgUrl?: string;
	bgRatio?: number;
}) {
  const dataXur = data.vendorResponses[data.xurHash];

	const itemIndexes = dataXur[0].categories.data?.categories[0].itemIndexes;
	if (!itemIndexes) return <div className="card">シュールの販売アイテムが見つかりません。</div>;

	const normalItemIndexes = itemIndexes?.slice(0, -1);

	const specialItemIndexes = new Set<number>();
	const specialItemHunter = dataXur[0].categories.data?.categories[0].itemIndexes.at(-1);
	const specialItemTitan = dataXur[1].categories.data?.categories[0].itemIndexes.at(-1);
	const specialItemWarlock = dataXur[2].categories.data?.categories[0].itemIndexes.at(-1);
	if (specialItemHunter) specialItemIndexes.add(specialItemHunter);
	if (specialItemTitan) specialItemIndexes.add(specialItemTitan);
	if (specialItemWarlock) specialItemIndexes.add(specialItemWarlock);

	const sellItems = Object.assign({},
		dataXur[0].sales.data ?? {},
		dataXur[1].sales.data ?? {},
		dataXur[2].sales.data ?? {},
	)
	if (!sellItems) return <div className="card">シュールの販売アイテムが見つかりません。</div>;

	const sellInstances = Object.assign({},
		dataXur[0].itemComponents?.instances?.data ?? {},
		dataXur[1].itemComponents?.instances?.data ?? {},
		dataXur[2].itemComponents?.instances?.data ?? {},
	);

	const sellSockets = Object.assign({},
		dataXur[0].itemComponents?.sockets?.data ?? {},
		dataXur[1].itemComponents?.sockets?.data ?? {},
		dataXur[2].itemComponents?.sockets?.data ?? {},
	);

	const xurSellStats: Record<number, DestinyItemStatsComponent> = Object.assign({},
		dataXur[0].itemComponents?.stats?.data ?? {},
		dataXur[1].itemComponents?.stats?.data ?? {},
		dataXur[2].itemComponents?.stats?.data ?? {},
	);

	const dateStr = formatXurDayRange(new Date());

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>今週のシュール</h1>
					<div className="date">{dateStr}</div>
				</div>
			</div>
      <div className="contentXur">
        {normalItemIndexes.map(idx => {
					const itemDef = data.itemDefs[sellItems[idx].itemHash];
					if (!itemDef) return null;
					const archetypeSocketIndex = itemDef.sockets?.socketEntries.findIndex(se => se.socketTypeHash === 2104613635);
					const archetypeDef = data.itemDefs[sellSockets[idx].sockets[archetypeSocketIndex].plugHash];
					if (!archetypeDef) return null;

					const archetypeIcon = archetypeDef.displayProperties.iconSequences && archetypeDef.displayProperties.iconSequences.length > 0
						? archetypeDef.displayProperties.iconSequences[0].frames[1]
						: archetypeDef.displayProperties.icon;
					
					return (
					<div className="itemXur" key={sellItems[idx].itemHash}>
						<div className="itemSummary">
							<ItemDisplay item={itemDef} d2settings={d2settings} tier={sellInstances[idx].gearTier} constant={constant} />
							<div className="price">
								{sellItems[idx].costs?.map((c, i) => {
									const costItemDef = data.itemDefs[c.itemHash];
									if (!costItemDef) return null;
									return (
										<div className="cost" key={i}>
											<img className="cost-icon" src={`https://www.bungie.net${costItemDef.displayProperties.icon}`} alt={costItemDef.displayProperties.name} title={costItemDef.displayProperties.name} />
											<div className="cost-amount">x<span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
										</div>
									);
								})}
							</div>
						</div>
						<div className="archetype">
							<div className="name">{archetypeDef.displayProperties.name}</div>
							<img className="icon" src={`https://www.bungie.net${archetypeIcon}`} />
						</div>
						<ArmorStatsDisplay
							statsData={xurSellStats[idx]}
							statDefs={data.statDefs}
						/>
					</div>
					);
				})}
      </div>
      <div className="footer"><img src="../src/assets/logo_full.png" /></div>
    </div>
  );
}

export function renderXurHTML(data: XurViewData, d2settings: BungieCommonSettings, constant: DestinyInventoryItemConstantsDefinition, bgUrl?: string, bgRatio?: number, per=8) {
  return [renderHTML(<XurCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />)];
}