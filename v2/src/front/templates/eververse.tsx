import { renderHTML } from "./renderHTML";
import { BungieCommonSettings, DestinyInventoryItemConstantsDefinition } from "type";
import { ItemDisplay } from "./component";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { EververseViewData } from "@domain/adapter/eververse";

function EververseCard({ data, d2settings, constant, bgUrl, bgRatio }: {
  data: EververseViewData;
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

	if (!data.itemGroups) return <div className="card">エバーバースの販売アイテムが見つかりません。</div>;
	const groups = data.itemGroups;

  return (
    <div className="card" style={{ ["--bg-url" as any]: `url("${bgUrl}")`, ["--bg-ratio" as any]: bgRatio }}>
			<div className="header">
				<div className="title">
      		<h1>エバーバース</h1>
					<div className="date">{data.date}</div>
				</div>
				<div className="group">
					<div>ブライトダスト</div>
				</div>
			</div>
      <div className="contentEververse">
        {groups.map((group, idx) => (
					<div key={idx} className="item-group">
						<div className="group-name">{group.name}</div>
						<div className="item-list">
							{group.items.map(item => (
								<div key={item.hash} className={`item-wrap${item.eligibleItems ? " ornament" : ""}`} style={{ "--bg-url": `url("https://www.bungie.net${item.background}")` } as any}>
									<div className="itemSummary" style={item.eligibleItems ? { width: "48.1%" } : {}}>
										<ItemDisplay item={item} d2settings={d2settings} constant={constant} />
										<div className="price">
											{item.costs?.map((c, i) => (
												<div className="cost" key={i}>
													<img className="cost-icon" src={`https://www.bungie.net${c.icon}`} />
													<div className="cost-amount"><span style={{ fontWeight: "bold" }}>{c.quantity}</span></div>
												</div>
											))}
										</div>
									</div>
									{item.eligibleItems && (
										<div className="eligible-items">
											<div className="eligible-items-title">以下の武器に装備可能:</div>
											<div className="eligible-items-list">
												{item.eligibleItems.map(weapon => (
													<div key={weapon.hash} className="eligible-item">
														<ItemDisplay item={weapon} d2settings={d2settings} constant={constant} />
													</div>
												))}
											</div>
										</div>
									)}
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

export function renderEververseHTML(data: EververseViewData, d2settings: BungieCommonSettings, constant: DestinyInventoryItemConstantsDefinition, bgUrl?: string, bgRatio?: number) {
	return [
		renderHTML(<EververseCard data={data} d2settings={d2settings} constant={constant} bgUrl={bgUrl} bgRatio={bgRatio} />)
	];
}