import type {
	ToolbarCommandItem,
	ToolbarRenderItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import type {RuntimeToolbarContribution} from "./runtimeToolbarContributionRegistry";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";

/**
 * Projects feature-owned runtime contributions into visual toolbar groups.
 * Each section id owns one divider-separated toolbar section.
 */
export const resolveRuntimeToolbarGroups = (
	runtimeToolbarContributions: RuntimeToolbarContribution[],
): ToolbarRenderItem[][] => {
	const sections = new Map<string, RuntimeToolbarContribution[]>();
	for (const contribution of runtimeToolbarContributions) {
		const existing = sections.get(contribution.sectionId) ?? [];
		existing.push(contribution);
		sections.set(contribution.sectionId, existing);
	}

	return Array.from(sections.values()).map((contributions) => {
		const [{menu, menuVisibility = "always"}] = contributions;
		const items = contributions.flatMap((contribution) => contribution.items);
		const showMenu =
			menuVisibility === "always" ||
			(items.length > 1 &&
				items.some(
					(item) => item.type === "checkbox" && !item.props.readOnly,
				));
		const commands = new Map<string, ToolbarCommandItem[]>();
		for (const command of contributions.flatMap(
			(contribution) => contribution.commands ?? [],
		)) {
			const key = command.aggregationId ?? command.id;
			const existing = commands.get(key) ?? [];
			existing.push(command);
			commands.set(key, existing);
		}
		const aggregatedCommands = Array.from(commands.values()).map((group) => {
			const [first] = group;
			return {
				...first,
				disabled: group.every((command) => command.disabled),
				props: {
					execute: () => {
						const enabledCommands = group.filter(
							(command) => !command.disabled,
						);
						const batchUpdates = enabledCommands.map(
							(command) => command.props.batchUpdate,
						);
						if (
							batchUpdates.length > 1 &&
							batchUpdates.every((update) => update !== undefined)
						) {
							const values: Record<string, Record<string, unknown>> = {};
							for (const update of batchUpdates) {
								if (!update) continue;
								update.prepare();
								(values[update.namespace] ??= {})[update.parameterId] =
									update.value;
							}
							void useShapeDiverStoreParameters
								.getState()
								.batchParameterValueUpdate(values);
							return;
						}
						for (const command of enabledCommands)
							void command.props.execute();
					},
				},
			};
		});

		return [
			...(showMenu
				? [{
						type: "menu" as const,
						id: menu.id,
						label: menu.label,
						icon: menu.icon,
						props: {sections: [{id: menu.sectionId ?? menu.id, items}]},
					}]
					: []),
			...aggregatedCommands,
		];
	});
};
