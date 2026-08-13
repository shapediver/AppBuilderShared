import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {
	ToolbarCommandItem,
	ToolbarRenderItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import type {RuntimeToolbarContribution} from "./runtimeToolbarContributionRegistry";

/**
 * Projects feature-owned runtime contributions into visual toolbar groups.
 * Consecutive sections sharing a group id are rendered without a divider.
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

	const resolvedSections = Array.from(sections.values())
		.map((contributions) => {
			const [{menu, menuVisibility = "always"}] = contributions;
			const items = contributions.flatMap(
				(contribution) => contribution.items,
			);
			const showMenu =
				menuVisibility === "always" ||
				(items.length > 1 &&
					items.some(
						(item) =>
							item.type === "checkbox" && !item.props.readOnly,
					));
			const singleCheckbox =
				!showMenu && items.length === 1 && items[0].type === "checkbox"
					? items[0]
					: undefined;
			const singleToggleableCheckbox =
				singleCheckbox && !singleCheckbox.props.readOnly
					? singleCheckbox
					: undefined;
			const commands = new Map<string, ToolbarCommandItem[]>();
			for (const command of contributions.flatMap(
				(contribution) => contribution.commands ?? [],
			)) {
				const key = command.aggregationId ?? command.id;
				const existing = commands.get(key) ?? [];
				existing.push(command);
				commands.set(key, existing);
			}
			const aggregatedCommands = Array.from(commands.entries())
				.sort(
					([keyA, groupA], [keyB, groupB]) =>
						Math.min(
							...groupA.map(
								(command) => command.order ?? Infinity,
							),
						) -
							Math.min(
								...groupB.map(
									(command) => command.order ?? Infinity,
								),
							) || keyA.localeCompare(keyB),
				)
				.map(([, group]) => {
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
									batchUpdates.every(
										(update) => update !== undefined,
									)
								) {
									const values: Record<
										string,
										Record<string, unknown>
									> = {};
									for (const update of batchUpdates) {
										if (!update) continue;
										update.prepare();
										(values[update.namespace] ??= {})[
											update.parameterId
										] = update.value;
									}
									void Promise.resolve(
										useShapeDiverStoreParameters
											.getState()
											.batchParameterValueUpdate(values),
									).then(() => {
										for (const update of batchUpdates)
											update?.onComplete?.();
									});
									return;
								}
								for (const command of enabledCommands)
									void command.props.execute();
							},
						},
					};
				});

			return {
				groupId: contributions[0].groupId ?? contributions[0].sectionId,
				items: [
					...(singleToggleableCheckbox
						? [
								{
									...singleToggleableCheckbox,
									icon:
										singleToggleableCheckbox.icon ??
										menu.icon,
								},
							]
						: showMenu
							? [
									{
										type: "menu" as const,
										id: menu.id,
										label: menu.label,
										icon: menu.icon,
										props: {
											sections: [
												{
													id:
														menu.sectionId ??
														menu.id,
													items,
												},
											],
										},
									},
								]
							: []),
					...aggregatedCommands,
					...(singleCheckbox?.props.trailingAction
						? [
								{
									type: "command" as const,
									id: `${singleCheckbox.id}-trailing-action`,
									label: singleCheckbox.props.trailingAction
										.label,
									icon: singleCheckbox.props.trailingAction
										.icon,
									disabled:
										singleCheckbox.props.trailingAction
											.disabled,
									props: {
										execute:
											singleCheckbox.props.trailingAction
												.execute,
									},
								},
							]
						: []),
				],
			};
		})
		.filter((section) => section.items.length > 0);

	return resolvedSections
		.reduce<Array<{groupId: string; items: ToolbarRenderItem[]}>>(
			(groups, section) => {
				const previous = groups.at(-1);
				if (previous?.groupId === section.groupId) {
					previous.items.push(...section.items);
				} else {
					groups.push(section);
				}
				return groups;
			},
			[],
		)
		.map((group) => group.items);
};
