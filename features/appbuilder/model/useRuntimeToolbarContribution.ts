import {
	runtimeToolbarContributionRegistry,
	type RuntimeToolbarContribution,
} from "@AppBuilderLib/features/appbuilder/model/runtimeToolbarContributionRegistry";
import type {
	RuntimeToolbarMenuDefinition,
	RuntimeToolbarMenuVisibility,
	ToolbarCommandItem,
	ToolbarMenuItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useEffect} from "react";

interface UseRuntimeToolbarContributionOptions {
	id: string;
	namespace: string;
	viewportId: string;
	menu: RuntimeToolbarMenuDefinition;
	enabled: boolean;
	items: ToolbarMenuItem[];
	commands?: ToolbarCommandItem[];
	sectionId: string;
	menuVisibility?: RuntimeToolbarMenuVisibility;
}

/** Registers feature-owned content and presentation with the runtime toolbar. */
export function useRuntimeToolbarContribution({
	id,
	namespace,
	viewportId,
	menu,
	enabled,
	items,
	commands,
	sectionId,
	menuVisibility,
}: UseRuntimeToolbarContributionOptions) {
	useEffect(() => {
		if (!enabled) return;

		const contribution: RuntimeToolbarContribution = {
			id,
			namespace,
			viewportId,
			menu,
			items,
			commands,
			sectionId,
			menuVisibility,
		};
		runtimeToolbarContributionRegistry.register(contribution);
		return () => runtimeToolbarContributionRegistry.unregister(id);
	}, [enabled, id, namespace, viewportId]);

	useEffect(() => {
		if (enabled)
			runtimeToolbarContributionRegistry.update(id, {
				items,
				menu,
				commands,
				sectionId,
				menuVisibility,
			});
	}, [commands, enabled, id, items, menu, menuVisibility, sectionId]);
}
