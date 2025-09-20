import { paginateActivities } from "front/paginate";
import { renderHTML } from "./renderHTML";
import type { PortalViewData } from "@domain/adapter/portal";
import { BungieCommonSettings } from "type";
import { WeaponDisplay } from "./component";

export function PortalCard({ data, d2settings, bgUrl, bgRatio, pageIndex, pageTotal }: {
  data: { group: PortalViewData["group"]; activities: PortalViewData["activities"] };
	d2settings: BungieCommonSettings;
	bgUrl?: string;
	bgRatio?: number;
  pageIndex: number; pageTotal: number;
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
      	<h2>&lt;{titleMap[data.group]}&gt;</h2>
			</div>
      <div className="content">
        {data.activities.map(a => (
          <div className="itemPortal" key={a.activity.hash} style={{"--bg-url": `url("https://www.bungie.net${a.activity.pgcrImage}")`} as any}>
            <h3>{a.activity.originalDisplayProperties.name}</h3>
            <div className="weapons">
							{a.weapons.map(w => (
								<WeaponDisplay key={w.hash} weapon={w} d2settings={d2settings} />
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
  const total = chunks.length;
  return chunks.map((acts, i) => renderHTML(<PortalCard data={{...groupPage, activities: acts}} d2settings={d2settings} bgUrl={bgUrl} bgRatio={bgRatio} pageIndex={i} pageTotal={total}/>));
}