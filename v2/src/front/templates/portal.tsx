import { paginateActivities } from "@front/utils";
import { renderHTML } from "./renderHTML";
import type { PortalViewData } from "@domain/adapter/portal";
import { BungieCommonSettings } from "type";
import { ItemDisplay } from "./component";

function PortalCard({ data, d2settings, bgUrl, bgRatio }: {
  data: { group: PortalViewData["group"]; activities: PortalViewData["activities"], icon: string; };
	d2settings: BungieCommonSettings;
	bgUrl?: string;
	bgRatio?: number;
}) {
  const titleMap = { solo: "ソロ", fireteam: "ファイアチーム", pinnacle: "最高峰", crucible: "クルーシブル" } as const;
	const date = new Date();
	const dateStr = date.toLocaleDateString();

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>ポータル: ボーナスフォーカス</h1>
					<div className="date">{dateStr}</div>
				</div>
      	<div className="group">
					<div>{titleMap[data.group]}</div>
					<img src={`https://www.bungie.net${data.icon}`} />
				</div>
			</div>
      <div className="contentPortal">
        {data.activities.map(a => (
          <div className="itemPortal" key={a.activity.hash} style={{"--bg-url": `url("https://www.bungie.net${a.activity.backgroundImage}")`} as any}>
            <div className="title">
							<div className="name">{a.activity.name}</div>
							<div className="type">{a.activity.type}</div>
						</div>
            <div className="items">
							{a.weapons.map(w => (
								<ItemDisplay key={w.hash} item={w} d2settings={d2settings} />
							))}
						</div>
          </div>
        ))}
      </div>
      <div className="footer"><img src="../src/assets/logo_full.png" /></div>
    </div>
  );
}

export function renderPortalHTML(groupPage: PortalViewData, d2settings: BungieCommonSettings, bgUrl?: string, bgRatio?: number, per=8) {
  const chunks = paginateActivities(groupPage.activities, per);
  return chunks.map((acts, i) => renderHTML(<PortalCard data={{...groupPage, activities: acts}} d2settings={d2settings} bgUrl={bgUrl} bgRatio={bgRatio} />));
}