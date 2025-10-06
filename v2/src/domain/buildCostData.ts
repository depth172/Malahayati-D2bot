import { DestinyInventoryItemDefinition } from "type";
import { Cost } from "typeOriginal";

export default function buildCosts(costs: Cost[], itemDefs: Record<number, DestinyInventoryItemDefinition>): { name: string; icon: string; quantity: number }[] {
	return costs.map(c => {
		const itemDef = itemDefs[c.hash];
		if (!itemDef) throw new Error(`Cost item definition not found for hash: ${c.hash}`);

		return {
			name: itemDef.displayProperties.name,
			icon: itemDef.displayProperties.icon,
			quantity: c.quantity
		};
	});
}