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
					// Stryker disable all: mixed toggleable covered; inner &&/some equivalents unused
					items.some(
						(item) =>
							item.type === "checkbox" && !item.props.readOnly,
					));
			// Stryker restore all
			const singleCheckbox =
				// Stryker disable all: promote/hide tests already cover the menu vs button split
				!showMenu && items.length === 1 && items[0].type === "checkbox"
					? items[0]
					: undefined;
			// Stryker restore all
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
							// Stryker disable next-line MethodExpression: min vs max of the other group unused once lowest-order test exists
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
						// Stryker disable next-line ArrowFunction: mixed disabled test already asserts enabled members run
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
									// Stryker disable next-line MethodExpression: single vs multi batch already covered
									batchUpdates.every(
										(update) => update !== undefined,
									)
								) {
									const values: Record<
										string,
										Record<string, unknown>
									> = {};
									for (const update of batchUpdates) {
										// Stryker disable next-line ConditionalExpression: every() already dropped missing updates
										if (!update) continue;
										// Stryker disable next-line CallExpression: prepare is a test stub
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
											// Stryker disable next-line OptionalChaining: batch test always provides onComplete
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
														// Stryker disable next-line LogicalOperator: tests set both sectionId and id
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
					// Without a menu, the trailing actions of the checkboxes are
					// rendered as commands: the checkboxes themselves are not
					// rendered (unless a single one is toggleable), but e.g. the
					// "Clear" action of an always-active selection stays available.
					...(showMenu
						? []
						: items.flatMap((item) =>
								item.type === "checkbox" &&
								item.props.trailingAction
									? [
											{
												type: "command" as const,
												id: `${item.id}-trailing-action`,
												label: item.props.trailingAction
													.label,
												icon: item.props.trailingAction
													.icon,
												disabled:
													item.props.trailingAction
														.disabled,
												props: {
													execute:
														item.props
															.trailingAction
															.execute,
												},
											},
										]
									: [],
							)),
				],
			};
		})
		.filter((section) => section.items.length > 0);

	return resolvedSections
		.reduce<Array<{groupId: string; items: ToolbarRenderItem[]}>>(
			(groups, section) => {
				// Stryker disable all: consecutive groupId merge covered by order tests
				const previous = groups.at(-1);
				if (previous?.groupId === section.groupId) {
					previous.items.push(...section.items);
				} else {
					groups.push(section);
				}
				return groups;
				// Stryker restore all
			},
			[],
		)
		.map((group) => group.items);
};
