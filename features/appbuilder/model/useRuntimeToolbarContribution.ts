import {
	runtimeToolbarContributionRegistry,
	type RuntimeToolbarContribution,
} from "@AppBuilderLib/features/appbuilder/model/runtimeToolbarContributionRegistry";
import type {
	RuntimeToolbarMenuDefinition,
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
}

/** Registers feature-owned content and presentation with the runtime toolbar. */
export function useRuntimeToolbarContribution({
	id,
	namespace,
	viewportId,
	menu,
	enabled,
	items,
}: UseRuntimeToolbarContributionOptions) {
	useEffect(() => {
		if (!enabled) return;

		const contribution: RuntimeToolbarContribution = {
			id,
			namespace,
			viewportId,
			menu,
			items,
		};
		runtimeToolbarContributionRegistry.register(contribution);
		return () => runtimeToolbarContributionRegistry.unregister(id);
	}, [enabled, id, namespace, viewportId]);

	useEffect(() => {
		if (enabled) runtimeToolbarContributionRegistry.update(id, {items, menu});
	}, [enabled, id, items, menu]);
}
